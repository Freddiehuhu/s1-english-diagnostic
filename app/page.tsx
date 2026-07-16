"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Domain,
  Question,
  domainMeta,
  domains,
  listeningScripts,
  questions,
  readingA,
  readingB,
} from "./data";

type Mode = "student" | "teacher";
type SavedState = {
  studentName: string;
  studentClass: string;
  answers: Record<string, string>;
  manualScores: Partial<Record<Domain, number>>;
  teacherNotes: Partial<Record<Domain, string>>;
};

const STORAGE_KEY = "s1-diagnostic-mvp-v1";
const alphabet = ["A", "B", "C", "D", "E"];

function normalise(value: string) {
  return value.trim().toLowerCase().replace(/[.。!！?？,，]/g, "");
}

function isAnswered(question: Question, answers: Record<string, string>) {
  return Boolean(answers[question.id]?.trim());
}

function isObjective(question: Question) {
  return question.type === "mcq" || typeof question.answer === "string";
}

function isCorrect(question: Question, value: string) {
  if (!value || question.answer === undefined) return false;
  if (typeof question.answer === "number") return Number(value) === question.answer;
  return normalise(value) === normalise(question.answer);
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
  onChange,
}: {
  question: Question;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <article className={`question-card ${value ? "has-answer" : ""}`} id={question.id}>
      <div className="question-meta">
        <span>{question.id}</span>
        <span>{question.code}</span>
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
          onChange={(event) => onChange(event.target.value)}
          placeholder={question.domain === "speaking" ? "教师在口试后记录学生表现……" : "在这里输入答案……"}
          rows={question.domain === "writing" ? 8 : 4}
        />
      ) : (
        <input
          className="short-answer"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="输入简短答案"
        />
      )}
    </article>
  );
}

export default function Home() {
  const [mode, setMode] = useState<Mode>("student");
  const [activeDomain, setActiveDomain] = useState<Domain>("listening");
  const [studentName, setStudentName] = useState("");
  const [studentClass, setStudentClass] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [manualScores, setManualScores] = useState<Partial<Record<Domain, number>>>({});
  const [teacherNotes, setTeacherNotes] = useState<Partial<Record<Domain, string>>>({});
  const [hydrated, setHydrated] = useState(false);
  const [saveState, setSaveState] = useState("已自动保存");
  const [playing, setPlaying] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as SavedState;
        setStudentName(saved.studentName || "");
        setStudentClass(saved.studentClass || "");
        setAnswers(saved.answers || {});
        setManualScores(saved.manualScores || {});
        setTeacherNotes(saved.teacherNotes || {});
      }
    } catch {
      // A malformed local draft should never block the assessment.
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    setSaveState("正在保存…");
    const timeout = window.setTimeout(() => {
      const payload: SavedState = { studentName, studentClass, answers, manualScores, teacherNotes };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      setSaveState("已自动保存");
    }, 350);
    return () => window.clearTimeout(timeout);
  }, [answers, hydrated, manualScores, studentClass, studentName, teacherNotes]);

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
  const overallProgress = Math.round((answeredCount / questions.length) * 100);

  function domainProgress(domain: Domain) {
    const items = questions.filter((question) => question.domain === domain);
    const done = items.filter((question) => isAnswered(question, answers)).length;
    return { done, total: items.length, percent: items.length ? Math.round((done / items.length) * 100) : 0 };
  }

  function objectiveStats(domain: Domain) {
    const items = questions.filter((question) => question.domain === domain && isObjective(question));
    const attempted = items.filter((question) => isAnswered(question, answers));
    const correct = attempted.filter((question) => isCorrect(question, answers[question.id])).length;
    return {
      total: items.length,
      attempted: attempted.length,
      correct,
      percent: attempted.length ? Math.round((correct / attempted.length) * 100) : null,
    };
  }

  const pendingReview = questions.filter(
    (question) => !isObjective(question) && isAnswered(question, answers),
  ).length;

  const priorities = useMemo(() => {
    const items: { title: string; reason: string }[] = [];
    const vocabulary = objectiveStats("vocabulary");
    const grammar = objectiveStats("grammar");
    const listening = manualScores.listening;
    const reading = manualScores.reading;
    const writing = manualScores.writing;
    const speaking = manualScores.speaking;

    if (vocabulary.percent !== null && vocabulary.percent < 75) items.push({ title: "词汇语境与词形", reason: `客观题正确率 ${vocabulary.percent}%` });
    if (grammar.percent !== null && grammar.percent < 75) items.push({ title: "语法规则迁移", reason: `客观题正确率 ${grammar.percent}%` });
    if (reading !== undefined && reading < 3) items.push({ title: "阅读证据与推断", reason: `教师证据等级 ${reading}/4` });
    if (listening !== undefined && listening < 3) items.push({ title: "听力信息整合", reason: `教师证据等级 ${listening}/4` });
    if (writing !== undefined && writing < 3) items.push({ title: "写作展开与句子控制", reason: `教师证据等级 ${writing}/4` });
    if (speaking !== undefined && speaking < 3) items.push({ title: "口语持续表达与互动", reason: `教师证据等级 ${speaking}/4` });
    return items.slice(0, 3);
  }, [answers, manualScores]);

  function updateAnswer(id: string, value: string) {
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

  function exportRecord() {
    const payload = {
      version: "S1 Diagnostic MVP 1.0",
      exportedAt: new Date().toISOString(),
      student: { name: studentName, class: studentClass },
      answers,
      manualScores,
      teacherNotes,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `S1-diagnostic-${studentName || "student"}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function clearRecord() {
    if (!window.confirm("确定清空这名学生的全部答案和教师评分吗？此操作无法撤销。")) return;
    setAnswers({});
    setManualScores({});
    setTeacherNotes({});
    setStudentName("");
    setStudentClass("");
    window.localStorage.removeItem(STORAGE_KEY);
  }

  const activeProgress = domainProgress(activeDomain);

  return (
    <main>
      <header className="topbar">
        <div className="brand" onClick={() => setMode("student")} role="button" tabIndex={0}>
          <span className="brand-mark">S1</span>
          <span><strong>English Diagnostic</strong><small>教学诊断 MVP · 本地版</small></span>
        </div>
        <div className="mode-switch" aria-label="切换使用模式">
          <button className={mode === "student" ? "active" : ""} onClick={() => setMode("student")}>学生作答</button>
          <button className={mode === "teacher" ? "active" : ""} onClick={() => setMode("teacher")}>教师查看</button>
        </div>
      </header>

      <section className="identity-strip">
        <div>
          <label htmlFor="studentName">学生姓名 / 编号</label>
          <input id="studentName" value={studentName} onChange={(event) => setStudentName(event.target.value)} placeholder="例如：Student A" />
        </div>
        <div>
          <label htmlFor="studentClass">学校 / 班级</label>
          <input id="studentClass" value={studentClass} onChange={(event) => setStudentClass(event.target.value)} placeholder="例如：S1A" />
        </div>
        <div className="save-status"><span className="status-dot" />{saveState}<small>资料仅保存在这台设备</small></div>
      </section>

      {mode === "student" ? (
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
            <div className="privacy-note"><strong>隐私提示</strong><p>这是原型版：不上传姓名、学校、答案或录音。更换设备前请让教师导出记录。</p></div>
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
                    <button onClick={() => playRecording(key)} disabled={playing !== null}>{playing === key ? "正在播放…" : "播放听力"}</button>
                  </article>
                ))}
              </div>
            )}

            {Object.entries(groupedQuestions).map(([group, items]) => (
              <section className="question-group" key={group}>
                <div className="group-title"><h2>{group}</h2><span>{items.filter((item) => isAnswered(item, answers)).length}/{items.length}</span></div>
                <ResourcePanel domain={activeDomain} group={group} />
                <div className="question-list">
                  {items.map((question) => <QuestionCard key={question.id} question={question} value={answers[question.id] || ""} onChange={(value) => updateAnswer(question.id, value)} />)}
                </div>
              </section>
            ))}

            <div className="workspace-footer">
              <span>{saveState}</span>
              {domains.indexOf(activeDomain) < domains.length - 1 ? (
                <button className="primary-button" onClick={() => setActiveDomain(domains[domains.indexOf(activeDomain) + 1])}>下一模块 →</button>
              ) : (
                <button className="primary-button" onClick={() => setMode("teacher")}>完成并进入教师查看 →</button>
              )}
            </div>
          </section>
        </div>
      ) : (
        <section className="teacher-view">
          <div className="teacher-hero">
            <div><div className="eyebrow">TEACHER EVIDENCE VIEW</div><h1>{studentName || "未命名学生"}的诊断概览</h1><p>客观题自动统计；开放题与口语由教师结合真实表现给出 0–4 证据等级。</p></div>
            <div className="teacher-actions"><button onClick={exportRecord}>导出记录</button><button onClick={() => window.print()}>打印报告</button><button className="danger" onClick={clearRecord}>清空</button></div>
          </div>

          <div className="summary-grid">
            <div className="summary-card"><span>完成度</span><strong>{overallProgress}%</strong><small>{answeredCount}/{questions.length} 项</small></div>
            <div className="summary-card"><span>开放题待复核</span><strong>{pendingReview}</strong><small>已有答案的主观项目</small></div>
            <div className="summary-card"><span>已评能力域</span><strong>{Object.keys(manualScores).length}/6</strong><small>教师证据评分</small></div>
          </div>

          <section className="teacher-section">
            <div className="teacher-section-head"><div><h2>六项能力画像</h2><p>0 无有效证据 · 1 尚未形成 · 2 提示依赖 · 3 熟悉任务独立完成 · 4 可迁移使用</p></div></div>
            <div className="rubric-grid">
              {domains.map((domain) => {
                const stats = objectiveStats(domain);
                const progress = domainProgress(domain);
                return (
                  <article className="rubric-card" key={domain}>
                    <div className="rubric-top"><div><span>{domainMeta[domain].short}</span><small>{domainMeta[domain].description}</small></div><strong>{manualScores[domain] ?? "–"}<em>/4</em></strong></div>
                    <div className="evidence-row"><span>作答进度</span><b>{progress.done}/{progress.total}</b></div>
                    {stats.total > 0 && <div className="evidence-row"><span>自动评分</span><b>{stats.correct}/{stats.attempted || stats.total}{stats.percent !== null ? ` · ${stats.percent}%` : ""}</b></div>}
                    <label className="score-label">教师证据等级
                      <select value={manualScores[domain] ?? ""} onChange={(event) => setManualScores((current) => ({ ...current, [domain]: Number(event.target.value) }))}>
                        <option value="" disabled>请选择</option>{[0, 1, 2, 3, 4].map((score) => <option key={score} value={score}>{score}</option>)}
                      </select>
                    </label>
                    <textarea value={teacherNotes[domain] || ""} onChange={(event) => setTeacherNotes((current) => ({ ...current, [domain]: event.target.value }))} placeholder="证据、反复错误或提示情况……" rows={3} />
                  </article>
                );
              })}
            </div>
          </section>

          <section className="teacher-section priority-section">
            <div className="teacher-section-head"><div><h2>下一步教学重点</h2><p>根据当前客观题和教师证据评分自动生成；未完成评分前只显示已有证据。</p></div></div>
            {priorities.length ? <div className="priority-list">{priorities.map((priority, index) => <article key={priority.title}><span>0{index + 1}</span><div><strong>{priority.title}</strong><p>{priority.reason}</p></div></article>)}</div> : <div className="empty-state">完成客观题并填写教师证据等级后，这里会出现前三项教学重点。</div>}
          </section>

          <section className="teacher-section">
            <div className="teacher-section-head"><div><h2>开放题快速复核</h2><p>只展示学生已经填写的开放题，方便定位证据，不用翻整张试卷。</p></div></div>
            <div className="review-list">
              {questions.filter((question) => !isObjective(question) && isAnswered(question, answers)).map((question) => (
                <details key={question.id}>
                  <summary><span>{question.id} · {domainMeta[question.domain].short}</span><strong>{question.code}</strong></summary>
                  <div><p>{question.prompt}</p><blockquote>{answers[question.id]}</blockquote></div>
                </details>
              ))}
              {!pendingReview && <div className="empty-state">学生尚未填写开放题。</div>}
            </div>
          </section>
        </section>
      )}
    </main>
  );
}
