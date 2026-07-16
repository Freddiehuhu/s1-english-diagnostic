"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  assessmentMeta,
  domainMeta,
  domains,
  listeningScripts,
  questions,
  readingA,
  readingB,
  type Domain,
  type Question,
} from "./data";

type Receipt = {
  id: string;
  submittedAt: string;
  answeredCount: number;
  totalItems: number;
};

type SavedState = {
  studentCode: string;
  studentGroup: string;
  answers: Record<string, string>;
  receipt: Receipt | null;
  startedAt: string;
};

const STORAGE_KEY = `s1-diagnostic-${assessmentMeta.version}`;
const alphabet = ["A", "B", "C", "D", "E"];

function isAnswered(question: Question, answers: Record<string, string>) {
  return Boolean(answers[question.id]?.trim());
}

function ResourcePanel({ domain, group }: { domain: Domain; group: string }) {
  if (domain !== "reading") return null;

  if (group === "Text A") {
    return (
      <article className="resource-card">
        <div className="eyebrow">READING TEXT A</div>
        <h3>{readingA.title}</h3>
        {readingA.paragraphs.map((paragraph, index) => (
          <p key={paragraph}><span className="paragraph-number">{index + 1}</span>{paragraph}</p>
        ))}
      </article>
    );
  }

  return (
    <article className="resource-card">
      <div className="eyebrow">READING TEXT B</div>
      <h3>{readingB.title}</h3>
      <div className="schedule-wrap">
        <table>
          <thead><tr><th>Day</th><th>Event</th><th>Time</th><th>Place</th><th>Attendance</th></tr></thead>
          <tbody>{readingB.schedule.map((row) => <tr key={row[0]}>{row.map((cell) => <td key={cell}>{cell}</td>)}</tr>)}</tbody>
        </table>
      </div>
      <h4>Participation rules</h4>
      <ol className="rule-list">{readingB.rules.map((rule) => <li key={rule}>{rule}</li>)}</ol>
      <div className="message-box"><strong>Message from Dev</strong><p>{readingB.message}</p></div>
    </article>
  );
}

function QuestionCard({
  question,
  value,
  disabled,
  onChange,
}: {
  question: Question;
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <article className={`question-card ${value ? "has-answer" : ""} ${disabled ? "locked" : ""}`} id={question.id}>
      <div className="question-meta">
        <span>{question.id}</span>
        <span>{question.code}</span>
        <span className="demo-chip">演示题</span>
      </div>
      <h4>{question.prompt}</h4>
      {question.hint && <p className="question-hint">{question.hint}</p>}
      {question.type === "mcq" && question.options ? (
        <div className="option-grid" role="radiogroup" aria-label={question.prompt}>
          {question.options.map((option, index) => (
            <label className={`option ${value === String(index) ? "selected" : ""}`} key={option}>
              <input
                type="radio"
                name={question.id}
                value={index}
                checked={value === String(index)}
                disabled={disabled}
                onChange={(event) => onChange(event.target.value)}
              />
              <span className="option-letter">{alphabet[index]}</span>
              <span>{option}</span>
            </label>
          ))}
        </div>
      ) : question.type === "long" ? (
        <textarea
          className="long-answer"
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          placeholder={question.domain === "speaking" ? "口试部分可由教师在现场记录简要表现……" : "在这里输入答案……"}
          rows={question.domain === "writing" ? 8 : 4}
        />
      ) : (
        <input
          className="short-answer"
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          placeholder="输入简短答案"
        />
      )}
    </article>
  );
}

export default function Home() {
  const [activeDomain, setActiveDomain] = useState<Domain>("listening");
  const [studentCode, setStudentCode] = useState("");
  const [studentGroup, setStudentGroup] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [startedAt, setStartedAt] = useState(() => new Date().toISOString());
  const [hydrated, setHydrated] = useState(false);
  const [saveState, setSaveState] = useState("草稿已保存在本机");
  const [playing, setPlaying] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as SavedState;
        setStudentCode(saved.studentCode || "");
        setStudentGroup(saved.studentGroup || "");
        setAnswers(saved.answers || {});
        setReceipt(saved.receipt || null);
        setStartedAt(saved.startedAt || new Date().toISOString());
      }
    } catch {
      // A malformed local draft should not block a fresh attempt.
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    setSaveState("正在保存草稿…");
    const timeout = window.setTimeout(() => {
      const payload: SavedState = { studentCode, studentGroup, answers, receipt, startedAt };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      setSaveState(receipt ? "提交记录已保存在本机" : "草稿已保存在本机");
    }, 350);
    return () => window.clearTimeout(timeout);
  }, [answers, hydrated, receipt, startedAt, studentCode, studentGroup]);

  const domainQuestions = useMemo(
    () => questions.filter((question) => question.domain === activeDomain),
    [activeDomain],
  );

  const groupedQuestions = useMemo(() => {
    return domainQuestions.reduce<Record<string, Question[]>>((groups, question) => {
      (groups[question.group] ||= []).push(question);
      return groups;
    }, {});
  }, [domainQuestions]);

  const answeredCount = questions.filter((question) => isAnswered(question, answers)).length;
  const unansweredCount = questions.length - answeredCount;
  const overallProgress = Math.round((answeredCount / questions.length) * 100);

  function domainProgress(domain: Domain) {
    const items = questions.filter((question) => question.domain === domain);
    const done = items.filter((question) => isAnswered(question, answers)).length;
    return {
      done,
      total: items.length,
      percent: items.length ? Math.round((done / items.length) * 100) : 0,
    };
  }

  function updateAnswer(id: string, value: string) {
    if (receipt) return;
    setAnswers((current) => ({ ...current, [id]: value }));
  }

  function playRecording(key: "A" | "B" | "C") {
    const speech = window.speechSynthesis;
    speech.cancel();
    const script = listeningScripts[key];
    let playCount = 0;
    const speakOnce = () => {
      const utterance = new SpeechSynthesisUtterance(script.text);
      utterance.lang = "en-HK";
      utterance.rate = 0.88;
      utterance.onend = () => {
        playCount += 1;
        if (playCount < 2) window.setTimeout(speakOnce, 900);
        else setPlaying(null);
      };
      utterance.onerror = () => setPlaying(null);
      speech.speak(utterance);
    };
    setPlaying(key);
    speakOnce();
  }

  async function submitAttempt() {
    setSubmitMessage("");
    if (studentCode.trim().length < 2) {
      setSubmitMessage("请先填写至少 2 个字符的学生编号，不建议使用真实姓名。");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (unansweredCount > 0) {
      const proceed = window.confirm(`还有 ${unansweredCount} 项未作答。是否仍然提交？提交后不能修改。`);
      if (!proceed) return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/submissions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          assessmentId: assessmentMeta.id,
          assessmentVersion: assessmentMeta.version,
          studentCode,
          studentGroup,
          answers,
          startedAt,
        }),
      });
      const payload = (await response.json()) as { receipt?: Receipt; error?: string };
      if (!response.ok || !payload.receipt) {
        setSubmitMessage(payload.error ?? "提交失败，本机草稿仍然保留。");
        return;
      }
      setReceipt(payload.receipt);
      setSubmitMessage("");
    } catch {
      setSubmitMessage("网络中断，答案仍保存在本机。请恢复连接后再次提交。");
    } finally {
      setSubmitting(false);
    }
  }

  function startNewAttempt() {
    if (!window.confirm("开始新的测试会清空当前设备上的答案，是否继续？")) return;
    const now = new Date().toISOString();
    setAnswers({});
    setStudentCode("");
    setStudentGroup("");
    setReceipt(null);
    setStartedAt(now);
    setActiveDomain("listening");
    setSubmitMessage("");
    window.localStorage.removeItem(STORAGE_KEY);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const activeProgress = domainProgress(activeDomain);
  const isLastDomain = domains.indexOf(activeDomain) === domains.length - 1;

  return (
    <main>
      <header className="topbar">
        <Link className="brand" href="/">
          <span className="brand-mark">S1</span>
          <span><strong>English Diagnostic</strong><small>测试流程原型 · 演示题库</small></span>
        </Link>
        <div className="top-actions">
          <span className="demo-badge">DEMO {assessmentMeta.version}</span>
          <Link className="teacher-link" href="/teacher">教师后台</Link>
        </div>
      </header>

      <section className="demo-notice">
        <strong>当前为流程测试版</strong>
        <span>{assessmentMeta.contentNotice}</span>
      </section>

      <section className="identity-strip">
        <div>
          <label htmlFor="studentCode">学生编号</label>
          <input id="studentCode" disabled={Boolean(receipt)} value={studentCode} onChange={(event) => setStudentCode(event.target.value)} placeholder="例如：S1-A07（不要填写真实姓名）" />
        </div>
        <div>
          <label htmlFor="studentGroup">班级 / 测试组（可选）</label>
          <input id="studentGroup" disabled={Boolean(receipt)} value={studentGroup} onChange={(event) => setStudentGroup(event.target.value)} placeholder="例如：S1A" />
        </div>
        <div className="save-status"><span className="status-dot" />{saveState}<small>正式提交后进入教师后台</small></div>
      </section>

      {submitMessage && <div className="submit-alert">{submitMessage}</div>}
      {receipt && (
        <section className="receipt-banner">
          <div><div className="eyebrow">SUBMISSION RECEIVED</div><h2>已成功提交</h2><p>提交编号：{receipt.id.slice(0, 8)} · 完成 {receipt.answeredCount}/{receipt.totalItems} 项</p></div>
          <button onClick={startNewAttempt}>开始新的测试</button>
        </section>
      )}

      <div className="app-shell">
        <aside className="sidebar">
          <div className="progress-card">
            <div className="progress-ring" style={{ "--progress": `${overallProgress * 3.6}deg` } as React.CSSProperties}>
              <span>{overallProgress}%</span>
            </div>
            <div><strong>整体进度</strong><small>{answeredCount} / {questions.length} 项已完成</small></div>
          </div>
          <nav className="domain-nav" aria-label="测评模块">
            {domains.map((domain, index) => {
              const progress = domainProgress(domain);
              return (
                <button key={domain} className={activeDomain === domain ? "active" : ""} onClick={() => setActiveDomain(domain)}>
                  <span className="nav-index">{index + 1}</span>
                  <span><strong>{domainMeta[domain].short}</strong><small>{progress.done}/{progress.total} · {progress.percent}%</small></span>
                </button>
              );
            })}
          </nav>
          <div className="privacy-note"><strong>隐私与提交</strong><p>请使用学生编号。作答中草稿保存在本机；点击正式提交后，答案会进入受保护的教师后台。</p></div>
        </aside>

        <section className="workspace">
          <div className="section-head">
            <div><div className="eyebrow">MODULE {domains.indexOf(activeDomain) + 1} OF 6</div><h1>{domainMeta[activeDomain].label}</h1><p>{domainMeta[activeDomain].description}</p></div>
            <div className="section-progress"><strong>{activeProgress.percent}%</strong><span>本模块</span></div>
          </div>

          {activeDomain === "listening" && (
            <div className="audio-grid">
              {(Object.keys(listeningScripts) as ("A" | "B" | "C")[]).map((key) => (
                <article className="audio-card" key={key}>
                  <span className="audio-label">{key}</span>
                  <div><strong>{listeningScripts[key].title}</strong><small>设备将自动朗读两遍</small></div>
                  <button onClick={() => playRecording(key)} disabled={playing !== null || Boolean(receipt)}>{playing === key ? "正在播放…" : "播放听力"}</button>
                </article>
              ))}
            </div>
          )}

          {Object.entries(groupedQuestions).map(([group, items]) => (
            <section className="question-group" key={group}>
              <div className="group-title"><h2>{group}</h2><span>{items.filter((item) => isAnswered(item, answers)).length}/{items.length}</span></div>
              <ResourcePanel domain={activeDomain} group={group} />
              <div className="question-list">
                {items.map((question) => (
                  <QuestionCard
                    key={question.id}
                    question={question}
                    value={answers[question.id] || ""}
                    disabled={Boolean(receipt)}
                    onChange={(value) => updateAnswer(question.id, value)}
                  />
                ))}
              </div>
            </section>
          ))}

          {isLastDomain && (
            <section className="submission-panel">
              <div>
                <div className="eyebrow">FINAL CHECK</div>
                <h2>{receipt ? "本次测试已锁定" : "检查并正式提交"}</h2>
                <p>{unansweredCount ? `还有 ${unansweredCount} 项未作答；可返回对应模块补充。` : "所有项目都已有答案，可以提交。"}</p>
              </div>
              {!receipt && <button className="primary-button" disabled={submitting} onClick={() => void submitAttempt()}>{submitting ? "提交中…" : "正式提交答案"}</button>}
            </section>
          )}

          <div className="workspace-footer">
            <span>{receipt ? "答案已提交并锁定" : saveState}</span>
            {!isLastDomain ? (
              <button className="primary-button" onClick={() => setActiveDomain(domains[domains.indexOf(activeDomain) + 1])}>下一模块 →</button>
            ) : (
              <button className="secondary-button" onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" })}>查看提交区</button>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
