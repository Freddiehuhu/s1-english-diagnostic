"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { domainMeta } from "../../data";
import type {
  AutomationAction,
  CompletedSteps,
  TeachingWorkspaceData,
  WorkspaceStage,
} from "../../teaching-engine";

type WorkspaceItem = {
  id: string;
  studentId: string;
  studentCode: string;
  studentGroup: string;
  studentStage: string;
  target: string;
  isDemo: boolean;
  sourceSubmissionId: string;
  stage: WorkspaceStage;
  policyVersion: string;
  data: TeachingWorkspaceData;
  completed: CompletedSteps;
  updatedAt: string;
};

type TabKey = "overview" | "diagnostic" | "plan" | "lesson" | "record" | "homework" | "report" | "ai";

const tabs: Array<{ key: TabKey; label: string }> = [
  { key: "overview", label: "总览" },
  { key: "diagnostic", label: "能力诊断" },
  { key: "plan", label: "四课计划" },
  { key: "lesson", label: "教师教案" },
  { key: "record", label: "课后记录" },
  { key: "homework", label: "作业" },
  { key: "report", label: "进步报告" },
  { key: "ai", label: "AI改进" },
];

const stageLabels: Record<WorkspaceStage, string> = {
  diagnostic_ready: "等待诊断确认",
  plan_ready: "等待计划批准",
  lesson_ready: "教案可以执行",
  homework_ready: "等待作业结果",
  next_lesson_ready: "下一课已调整",
  cycle_complete: "四课闭环已完成",
};

const recordOptions: Record<string, string[]> = {
  engagement: ["低", "一般", "高"],
  understanding: ["慢", "适中", "快"],
  prompting: ["大量", "部分", "少量"],
  independence: ["困难", "基本可以", "稳定"],
  correction: ["被动接受", "愿意修改", "主动修改"],
};

export default function TeachingWorkspace({ teacherName, signOutPath }: { teacherName: string; signOutPath: string }) {
  const [items, setItems] = useState<WorkspaceItem[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [recordSelections, setRecordSelections] = useState<Record<string, string>>({});

  async function sync() {
    setLoading(true);
    setError("");
    const response = await fetch("/api/teacher/workspaces", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "sync" }),
    });
    const payload = (await response.json()) as { items?: WorkspaceItem[]; message?: string; error?: string };
    if (!response.ok) setError(payload.error ?? "无法同步教学工作区。");
    else {
      const next = payload.items ?? [];
      setItems(next);
      setSelectedId((current) => current || next.find((item) => item.isDemo)?.id || next[0]?.id || "");
      setMessage(payload.message ?? "");
    }
    setLoading(false);
  }

  useEffect(() => {
    void sync();
  }, []);

  const selected = items.find((item) => item.id === selectedId) ?? null;
  const completedCycles = items.filter((item) => item.stage === "cycle_complete").length;
  const pendingDecisions = items.filter((item) => !item.completed.diagnosis || !item.completed.plan).length;

  const visibleSubskills = useMemo(() => {
    if (!selected) return [];
    return selected.data.diagnostic.subskills.filter(
      (skill) => skill.status === "优先补强" || skill.status === "正在形成" || skill.pendingManual > 0,
    );
  }, [selected]);

  async function advance(action: AutomationAction) {
    if (!selected) return;
    setRunning(action);
    setError("");
    setMessage("");
    const response = await fetch("/api/teacher/workspaces", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "advance", workspaceId: selected.id, automationAction: action }),
    });
    const payload = (await response.json()) as { items?: WorkspaceItem[]; message?: string; error?: string };
    if (!response.ok) setError(payload.error ?? "自动化步骤执行失败。");
    else {
      setItems(payload.items ?? []);
      setMessage(payload.message ?? "已完成。" );
      if (action === "confirm_diagnosis") setActiveTab("plan");
      if (action === "approve_plan") setActiveTab("lesson");
      if (action === "complete_lesson") setActiveTab("homework");
      if (action === "grade_homework") setActiveTab("report");
      if (action === "run_stage_test" || action === "run_full_cycle") setActiveTab("report");
    }
    setRunning("");
  }

  return (
    <main>
      <header className="topbar">
        <Link className="brand" href="/teacher/workspace">
          <span className="brand-mark">AI</span>
          <span><strong>Teaching Harness</strong><small>诊断、教案与教学闭环</small></span>
        </Link>
        <div className="top-actions">
          <Link className="teacher-link" href="/teacher">提交复核</Link>
          <Link className="teacher-link" href="/">学生测试</Link>
          <div className="teacher-account"><span>{teacherName}</span><a href={signOutPath}>退出</a></div>
        </div>
      </header>

      <section className="harness-view">
        <div className="harness-hero">
          <div>
            <div className="eyebrow">EVENT-DRIVEN TEACHING WORKSPACE</div>
            <h1>教学闭环工作台</h1>
            <p>每一步都引用学习证据；AI可以自动生成和调整，但重要判断仍由教师确认。</p>
          </div>
          <div className="harness-hero-actions">
            <button className="secondary-button" onClick={() => void sync()} disabled={loading}>{loading ? "同步中…" : "同步最新诊断"}</button>
            <button className="primary-button" onClick={() => void advance("run_full_cycle")} disabled={!selected || Boolean(running)}>
              {running === "run_full_cycle" ? "运行中…" : "自动运行虚拟闭环"}
            </button>
          </div>
        </div>

        <div className="harness-summary">
          <article><span>学生工作区</span><strong>{items.length}</strong><small>由最新诊断自动建立</small></article>
          <article><span>等待教师决定</span><strong>{pendingDecisions}</strong><small>诊断或计划尚未确认</small></article>
          <article><span>闭环完成</span><strong>{completedCycles}</strong><small>包含复测与报告</small></article>
          <article><span>当前策略</span><strong className="policy-number">0.1</strong><small>所有操作均保留版本</small></article>
        </div>

        {message && <div className="inline-message">{message}</div>}
        {error && <div className="harness-error">{error}</div>}

        <div className="harness-shell">
          <aside className="student-rail">
            <div className="rail-title"><div><h2>学生</h2><p>{loading ? "读取中…" : `${items.length}个工作区`}</p></div></div>
            {items.map((item) => (
              <button
                key={item.id}
                className={item.id === selectedId ? "active" : ""}
                onClick={() => { setSelectedId(item.id); setActiveTab("overview"); setRecordSelections({}); }}
              >
                <span><strong>{item.studentCode}</strong><small>{item.studentGroup || "未填写测试组"}</small></span>
                <span><b>{stageLabels[item.stage]}</b>{item.isDemo && <em>虚拟</em>}</span>
              </button>
            ))}
            {!loading && !items.length && <div className="empty-state">先让学生提交诊断测试，再同步到这里。</div>}
          </aside>

          <section className="harness-main">
            {!selected ? (
              <div className="empty-state">等待可用的学生诊断记录。</div>
            ) : (
              <>
                <div className="student-head">
                  <div>
                    <div className="eyebrow">{selected.studentStage} · {selected.policyVersion}</div>
                    <h2>{selected.studentCode}</h2>
                    <p>{selected.target}</p>
                  </div>
                  <div className="stage-chip">{stageLabels[selected.stage]}</div>
                </div>

                <div className="cycle-steps" aria-label="教学闭环进度">
                  {[
                    ["diagnosis", "诊断确认"], ["plan", "计划批准"], ["lesson", "完成课程"], ["homework", "作业批改"], ["stageTest", "阶段复测"],
                  ].map(([key, label], index) => (
                    <div className={selected.completed[key as keyof CompletedSteps] ? "done" : ""} key={key}>
                      <span>{selected.completed[key as keyof CompletedSteps] ? "✓" : index + 1}</span><small>{label}</small>
                    </div>
                  ))}
                </div>

                <nav className="workspace-tabs" aria-label="教学工作区模块">
                  {tabs.map((tab) => (
                    <button className={activeTab === tab.key ? "active" : ""} key={tab.key} onClick={() => setActiveTab(tab.key)}>{tab.label}</button>
                  ))}
                </nav>

                {activeTab === "overview" && (
                  <div className="workspace-panel">
                    <section className="overview-banner">
                      <div><div className="eyebrow">AI DIAGNOSTIC SUMMARY</div><h3>{selected.data.diagnostic.summary}</h3><p>自动评分覆盖 {selected.data.diagnostic.objectiveCoverage.scored}/{selected.data.diagnostic.objectiveCoverage.total} 项；开放题需要教师确认。</p></div>
                      {!selected.completed.diagnosis && <button className="primary-button" onClick={() => void advance("confirm_diagnosis")} disabled={Boolean(running)}>确认诊断</button>}
                    </section>
                    <div className="priority-grid">
                      {selected.data.diagnostic.priorities.map((priority, index) => (
                        <article key={priority.code}><span>{index + 1}</span><div><small>{priority.code}</small><h4>{priority.label}</h4><p>{priority.reason}</p><b>{priority.nextAction}</b></div></article>
                      ))}
                    </div>
                    <section className="automation-next">
                      <div><div className="eyebrow">NEXT BEST ACTION</div><h3>{nextActionTitle(selected)}</h3><p>{nextActionDescription(selected)}</p></div>
                      {nextActionButton(selected, running, advance)}
                    </section>
                  </div>
                )}

                {activeTab === "diagnostic" && (
                  <div className="workspace-panel">
                    <div className="panel-heading"><div><h3>具体失分与能力证据</h3><p>默认显示需要补强、正在形成或仍需人工复核的子技能。</p></div><span>{visibleSubskills.length}项需要关注</span></div>
                    <div className="skill-table-wrap">
                      <table className="skill-table"><thead><tr><th>领域与子技能</th><th>证据</th><th>表现</th><th>可信度</th><th>下一步</th></tr></thead>
                        <tbody>{visibleSubskills.map((skill) => (
                          <tr key={skill.code}>
                            <td><small>{skill.code} · {domainMeta[skill.domain].short}</small><strong>{skill.label}</strong><p>{skill.issue}</p></td>
                            <td><b>{skill.score}/{skill.maxScore || "–"}</b><small>{skill.evidenceIds.join("、")}{skill.pendingManual ? ` · ${skill.pendingManual}项待复核` : ""}</small></td>
                            <td><span className={`status-tag status-${skill.status}`}>{skill.percent === null ? "待复核" : `${skill.percent}% · ${skill.status}`}</span></td>
                            <td>{skill.confidence}</td><td>{skill.action}</td>
                          </tr>
                        ))}</tbody>
                      </table>
                    </div>
                    {!selected.completed.diagnosis && <div className="panel-action"><span>确认后，系统才会把这些结论用于正式学习计划。</span><button className="primary-button" onClick={() => void advance("confirm_diagnosis")} disabled={Boolean(running)}>确认诊断并生成计划</button></div>}
                  </div>
                )}

                {activeTab === "plan" && (
                  <div className="workspace-panel">
                    <div className="panel-heading"><div><h3>四课滚动计划</h3><p>{selected.data.plan.rationale}</p></div><span>{selected.data.plan.status === "approved" ? "教师已批准" : "AI草稿"}</span></div>
                    <div className="lesson-grid">{selected.data.plan.lessons.map((lesson) => (
                      <article key={lesson.number} className={lesson.status}><div className="lesson-number">{lesson.number}</div><div><small>{lesson.status === "completed" ? "已完成" : lesson.status === "ready" ? "可以执行" : "计划中"}</small><h4>{lesson.title}</h4><p>{lesson.focus.join(" · ")}</p><strong>成功标准</strong><ul>{lesson.successCriteria.map((criterion) => <li key={criterion}>{criterion}</li>)}</ul><em>证据：{lesson.evidence.join("、")}</em></div></article>
                    ))}</div>
                    {!selected.completed.plan && <div className="panel-action"><span>批准后自动生成下一课可直接使用的教师教案。</span><button className="primary-button" onClick={() => void advance("approve_plan")} disabled={!selected.completed.diagnosis || Boolean(running)}>批准四课计划</button></div>}
                  </div>
                )}

                {activeTab === "lesson" && (
                  <div className="workspace-panel">
                    <div className="lesson-hero"><div><div className="eyebrow">READY-TO-TEACH LESSON</div><h3>{selected.data.lessonPlan.title}</h3><p>{selected.data.lessonPlan.duration}分钟 · {selected.data.lessonPlan.status === "approved" ? "教师已批准" : selected.data.lessonPlan.status === "completed" ? "课程已完成" : "等待计划批准"}</p></div><div className="success-box"><strong>本课成功标准</strong>{selected.data.lessonPlan.successCriteria.map((item) => <span key={item}>✓ {item}</span>)}</div></div>
                    <section className="prework-box"><strong>课前预习</strong><div>{selected.data.lessonPlan.prework.map((item) => <span key={item}>{item}</span>)}</div></section>
                    <div className="timeline"><div className="timeline-head"><span>时间</span><span>教师行动</span><span>学生活动</span><span>系统记录</span></div>{selected.data.lessonPlan.timeline.map((row) => <div key={row.minutes}><b>{row.minutes}</b><span>{row.teacher}</span><span>{row.student}</span><span>{row.capture}</span></div>)}</div>
                    <div className="branch-grid">{selected.data.lessonPlan.branches.map((branch) => <article key={branch.condition}><strong>如果：{branch.condition}</strong><span>那么：{branch.action}</span></article>)}</div>
                    {!selected.completed.lesson && <div className="panel-action"><span>课堂结束后进入90秒课后记录。</span><button className="primary-button" onClick={() => setActiveTab("record")} disabled={!selected.completed.plan}>开始课堂记录</button></div>}
                  </div>
                )}

                {activeTab === "record" && (
                  <div className="workspace-panel">
                    <div className="panel-heading"><div><h3>90秒课后记录</h3><p>只保留会影响下一课的可观察变量。</p></div><span>{selected.data.classRecord.status === "completed" ? "已写入学生状态" : "等待勾选"}</span></div>
                    <div className="quick-record">{selected.data.classRecord.dimensions.map((dimension) => (
                      <section key={dimension.key}><strong>{dimension.label}</strong>{selected.data.classRecord.status === "completed" ? <b>{dimension.value}</b> : <div>{(recordOptions[dimension.key] ?? []).map((option) => <button key={option} className={recordSelections[dimension.key] === option ? "active" : ""} onClick={() => setRecordSelections((current) => ({ ...current, [dimension.key]: option }))}>{option}</button>)}</div>}</section>
                    ))}</div>
                    <div className="knowledge-grid">{selected.data.classRecord.knowledge.map((item) => <article key={item.code}><small>{item.code}</small><strong>{item.label}</strong><span>{item.state}</span></article>)}</div>
                    {selected.data.classRecord.status === "completed" && <div className="record-notes"><p><strong>最大进步：</strong>{selected.data.classRecord.biggestGain}</p><p><strong>主要困难：</strong>{selected.data.classRecord.mainDifficulty}</p><p><strong>下节优先：</strong>{selected.data.classRecord.nextPriority}</p></div>}
                    {!selected.completed.lesson && <div className="panel-action"><span>保存后自动生成作业、反馈和状态更新建议。</span><button className="primary-button" onClick={() => void advance("complete_lesson")} disabled={!selected.completed.plan || Boolean(running)}>保存并完成本课</button></div>}
                  </div>
                )}

                {activeTab === "homework" && (
                  <div className="workspace-panel">
                    <div className="panel-heading"><div><h3>针对性作业</h3><p>客观题自动批改；开放解释题由AI定位证据链，教师确认。</p></div><span>{selected.data.homework.status === "graded" ? "已批改" : selected.data.homework.status === "assigned" ? "已布置" : "草稿"}</span></div>
                    <div className="homework-grid">{selected.data.homework.groups.map((group) => <article key={group.skill}><small>{group.mode === "auto" ? "自动批改" : "AI初评＋教师确认"}</small><h4>{group.skill}</h4><strong>{group.correct === null ? `共${group.total}题` : `${group.correct}/${group.total}`}</strong><div className="mini-bar"><span style={{ width: group.correct === null ? "0%" : `${Math.round((group.correct / group.total) * 100)}%` }} /></div></article>)}</div>
                    <div className="feedback-card"><strong>自动反馈</strong><p>{selected.data.homework.automaticFeedback}</p><small>{selected.data.homework.teacherCheck}</small></div>
                    {!selected.completed.homework && <div className="panel-action"><span>批改后自动调整第二课重点并更新学生状态建议。</span><button className="primary-button" onClick={() => void advance("grade_homework")} disabled={!selected.completed.lesson || Boolean(running)}>模拟提交并批改作业</button></div>}
                  </div>
                )}

                {activeTab === "report" && (
                  <div className="workspace-panel">
                    <div className="panel-heading"><div><h3>前测—后测—延迟复测</h3><p>只有可比较的新材料和延迟证据，才用于判断学习是否稳定。</p></div><span>{selected.completed.stageTest ? "阶段报告已生成" : "等待阶段复测"}</span></div>
                    <div className="trend-table"><div><b>子技能</b><b>初测</b><b>四课后</b><b>延迟复测</b><b>证据</b></div>{selected.data.progress.map((row) => <div key={row.skill}><strong>{row.skill}</strong><span>{row.baseline}%</span><span>{row.post === null ? "–" : `${row.post}%`}</span><span>{row.delayed === null ? "–" : `${row.delayed}%`}</span><small>{row.evidence}</small></div>)}</div>
                    <div className="report-grid"><article><small>教师版</small><p>{selected.data.reports.teacher}</p></article><article><small>学生版</small><p>{selected.data.reports.student}</p></article><article><small>家长版</small><p>{selected.data.reports.parent}</p></article></div>
                    {!selected.completed.stageTest && <div className="panel-action"><span>当前使用模拟平行卷数据验证报告结构，不代表真实教学效果。</span><button className="primary-button" onClick={() => void advance("run_stage_test")} disabled={!selected.completed.homework || Boolean(running)}>运行模拟阶段复测</button></div>}
                  </div>
                )}

                {activeTab === "ai" && (
                  <div className="workspace-panel">
                    <div className="panel-heading"><div><h3>AI改进中心</h3><p>系统只提出候选升级；未经评测和教师批准，不会改变正式规则。</p></div><span>{selected.data.aiProposals.length}个候选</span></div>
                    <div className="proposal-list">{selected.data.aiProposals.map((proposal) => <article key={proposal.id}><div><span>{proposal.category.toUpperCase()}</span><em>风险：{proposal.risk}</em><b>{proposal.status}</b></div><h4>{proposal.title}</h4><p><strong>证据：</strong>{proposal.evidence}</p><p><strong>建议：</strong>{proposal.proposal}</p><footer>离线验证 → 教师审批 → 影子运行 → 小范围试点 → 发布或回滚</footer></article>)}</div>
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}

function nextActionTitle(item: WorkspaceItem) {
  if (!item.completed.diagnosis) return "教师确认具体失分与证据";
  if (!item.completed.plan) return "批准四课滚动计划";
  if (!item.completed.lesson) return "执行第1课并填写课后记录";
  if (!item.completed.homework) return "批改作业并调整下一课";
  if (!item.completed.stageTest) return "运行阶段复测并生成报告";
  return "审阅下一周期建议与AI升级候选";
}

function nextActionDescription(item: WorkspaceItem) {
  if (!item.completed.diagnosis) return "AI已经生成初步诊断，但正式学生状态必须由教师确认。";
  if (!item.completed.plan) return "计划已经引用具体薄弱点和前置知识，批准后才生成正式教案。";
  if (!item.completed.lesson) return "教案已经包含时间、分支、成功标准和Exit Ticket。";
  if (!item.completed.homework) return "客观题自动批改，开放解释题保留教师抽查。";
  if (!item.completed.stageTest) return "使用新材料和延迟复测，避免把熟悉题型误判成掌握。";
  return "系统可以提出优化，但不会未经审核自行修改策略或发布新题。";
}

function nextActionButton(item: WorkspaceItem, running: string, advance: (action: AutomationAction) => Promise<void>) {
  if (!item.completed.diagnosis) return <button className="primary-button" onClick={() => void advance("confirm_diagnosis")} disabled={Boolean(running)}>确认诊断</button>;
  if (!item.completed.plan) return <button className="primary-button" onClick={() => void advance("approve_plan")} disabled={Boolean(running)}>批准计划</button>;
  if (!item.completed.lesson) return <button className="primary-button" onClick={() => void advance("complete_lesson")} disabled={Boolean(running)}>模拟完成本课</button>;
  if (!item.completed.homework) return <button className="primary-button" onClick={() => void advance("grade_homework")} disabled={Boolean(running)}>批改作业</button>;
  if (!item.completed.stageTest) return <button className="primary-button" onClick={() => void advance("run_stage_test")} disabled={Boolean(running)}>运行复测</button>;
  return <button className="secondary-button" onClick={() => void advance("run_full_cycle")} disabled={Boolean(running)}>重新生成演示闭环</button>;
}
