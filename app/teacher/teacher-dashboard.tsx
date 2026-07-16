"use client";

import { useEffect, useMemo, useState } from "react";
import { domainMeta, domains, questions, type Domain } from "../data";

type Submission = {
  id: string;
  studentCode: string;
  studentGroup: string;
  assessmentVersion: string;
  answeredCount: number;
  totalItems: number;
  reviewStatus: string;
  submittedAt: string;
  reviewedAt: string | null;
  answers: Record<string, string>;
  objective: Record<string, { total?: number; attempted?: number; correct?: number; label?: string }>;
  teacherScores: Partial<Record<Domain, number>>;
  teacherNotes: Partial<Record<Domain, string>>;
};

export default function TeacherDashboard({
  teacherName,
  signOutPath,
}: {
  teacherName: string;
  signOutPath: string;
}) {
  const [items, setItems] = useState<Submission[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const response = await fetch("/api/teacher/submissions", { cache: "no-store" });
    const payload = (await response.json()) as { submissions?: Submission[]; error?: string };
    if (!response.ok) {
      setMessage(payload.error ?? "无法读取提交记录。");
      setLoading(false);
      return;
    }
    const next = payload.submissions ?? [];
    setItems(next);
    setSelectedId((current) => current || next[0]?.id || "");
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  const selected = items.find((item) => item.id === selectedId) ?? null;
  const pending = items.filter((item) => item.reviewStatus !== "reviewed").length;
  const completed = items.filter((item) => item.answeredCount === item.totalItems).length;

  const openAnswers = useMemo(() => {
    if (!selected) return [];
    return questions.filter(
      (question) =>
        question.type !== "mcq" &&
        typeof question.answer !== "string" &&
        selected.answers[question.id]?.trim(),
    );
  }, [selected]);

  function updateSelected(updater: (item: Submission) => Submission) {
    setItems((current) => current.map((item) => (item.id === selectedId ? updater(item) : item)));
  }

  async function saveReview() {
    if (!selected) return;
    setSaving(true);
    setMessage("");
    const response = await fetch("/api/teacher/submissions", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        id: selected.id,
        reviewStatus: selected.reviewStatus,
        teacherScores: selected.teacherScores,
        teacherNotes: selected.teacherNotes,
      }),
    });
    const payload = (await response.json()) as { error?: string };
    setMessage(response.ok ? "教师复核已保存。" : payload.error ?? "保存失败。");
    setSaving(false);
  }

  return (
    <main>
      <header className="topbar">
        <a className="brand" href="/">
          <span className="brand-mark">S1</span>
          <span><strong>Teacher Console</strong><small>集中提交与证据复核</small></span>
        </a>
        <div className="teacher-account"><span>{teacherName}</span><a href={signOutPath}>退出</a></div>
      </header>

      <section className="teacher-view">
        <div className="teacher-hero">
          <div>
            <div className="eyebrow">PROTECTED TEACHER DASHBOARD</div>
            <h1>学生提交记录</h1>
            <p>只使用学生编号；演示题结果不作为正式年级达标判断。</p>
          </div>
          <button className="secondary-button" onClick={() => void load()} disabled={loading}>刷新记录</button>
        </div>

        <div className="summary-grid">
          <div className="summary-card"><span>总提交</span><strong>{items.length}</strong><small>最近 100 份</small></div>
          <div className="summary-card"><span>待复核</span><strong>{pending}</strong><small>尚未标记完成</small></div>
          <div className="summary-card"><span>完整作答</span><strong>{completed}</strong><small>所有项目均有答案</small></div>
        </div>

        {message && <div className="inline-message">{message}</div>}

        <div className="teacher-console">
          <aside className="submission-list">
            <div className="teacher-section-head"><div><h2>提交列表</h2><p>{loading ? "读取中…" : "按提交时间倒序"}</p></div></div>
            {items.map((item) => (
              <button
                key={item.id}
                className={selectedId === item.id ? "active" : ""}
                onClick={() => setSelectedId(item.id)}
              >
                <span><strong>{item.studentCode}</strong><small>{item.studentGroup || "未填写班级"}</small></span>
                <span><b>{item.answeredCount}/{item.totalItems}</b><small>{new Date(item.submittedAt).toLocaleString()}</small></span>
              </button>
            ))}
            {!loading && !items.length && <div className="empty-state">尚未收到学生提交。</div>}
          </aside>

          <section className="submission-detail">
            {!selected ? (
              <div className="empty-state">选择一份提交后查看证据。</div>
            ) : (
              <>
                <div className="detail-head">
                  <div><div className="eyebrow">SUBMISSION</div><h2>{selected.studentCode}</h2><p>{selected.studentGroup || "未填写班级"} · {selected.assessmentVersion}</p></div>
                  <label>复核状态
                    <select
                      value={selected.reviewStatus}
                      onChange={(event) => updateSelected((item) => ({ ...item, reviewStatus: event.target.value }))}
                    >
                      <option value="submitted">待复核</option>
                      <option value="in_review">复核中</option>
                      <option value="reviewed">已完成</option>
                    </select>
                  </label>
                </div>

                <div className="rubric-grid">
                  {domains.map((domain) => {
                    const stats = selected.objective[domain] ?? {};
                    return (
                      <article className="rubric-card" key={domain}>
                        <div className="rubric-top"><div><span>{domainMeta[domain].short}</span><small>{domainMeta[domain].description}</small></div><strong>{selected.teacherScores[domain] ?? "–"}<em>/4</em></strong></div>
                        {stats.total ? <div className="evidence-row"><span>客观题证据</span><b>{stats.correct ?? 0}/{stats.attempted ?? 0}</b></div> : <div className="evidence-row"><span>客观题证据</span><b>需人工判断</b></div>}
                        <label className="score-label">教师证据等级
                          <select
                            value={selected.teacherScores[domain] ?? ""}
                            onChange={(event) => updateSelected((item) => ({
                              ...item,
                              teacherScores: { ...item.teacherScores, [domain]: Number(event.target.value) },
                            }))}
                          >
                            <option value="" disabled>请选择</option>
                            {[0, 1, 2, 3, 4].map((score) => <option value={score} key={score}>{score}</option>)}
                          </select>
                        </label>
                        <textarea
                          rows={3}
                          placeholder="证据、反复错误或提示情况……"
                          value={selected.teacherNotes[domain] ?? ""}
                          onChange={(event) => updateSelected((item) => ({
                            ...item,
                            teacherNotes: { ...item.teacherNotes, [domain]: event.target.value },
                          }))}
                        />
                      </article>
                    );
                  })}
                </div>

                <section className="teacher-section">
                  <div className="teacher-section-head"><div><h2>开放题证据</h2><p>只展示学生已经作答的主观项目。</p></div></div>
                  <div className="review-list">
                    {openAnswers.map((question) => (
                      <details key={question.id}>
                        <summary><span>{question.id} · {domainMeta[question.domain].short}</span><strong>{question.code}</strong></summary>
                        <div><p>{question.prompt}</p><blockquote>{selected.answers[question.id]}</blockquote></div>
                      </details>
                    ))}
                    {!openAnswers.length && <div className="empty-state">没有已填写的开放题。</div>}
                  </div>
                </section>

                <div className="review-save-bar">
                  <span>0 无证据 · 1 尚未形成 · 2 提示依赖 · 3 独立完成 · 4 可迁移</span>
                  <button className="primary-button" onClick={() => void saveReview()} disabled={saving}>{saving ? "保存中…" : "保存教师复核"}</button>
                </div>
              </>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}
