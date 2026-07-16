import { domainMeta, questions, type Domain, type Question } from "./data";

export const teachingPolicyVersion = "teaching-policy-0.2";

export type WorkspaceStage =
  | "diagnostic_ready"
  | "plan_ready"
  | "lesson_ready"
  | "homework_ready"
  | "next_lesson_ready"
  | "cycle_complete";

export type AutomationAction =
  | "confirm_diagnosis"
  | "approve_plan"
  | "complete_lesson"
  | "grade_homework"
  | "run_stage_test"
  | "run_full_cycle";

export type AutomationInput = {
  classRecord?: {
    dimensions: Record<string, string>;
    knowledge: Record<string, string>;
    biggestGain?: string;
    mainDifficulty?: string;
    nextPriority?: string;
  };
  homework?: {
    results: Record<string, number>;
    teacherNote?: string;
  };
  stageTest?: {
    results: Record<string, { post: number; delayed: number }>;
  };
  simulate?: boolean;
};

export type SubmissionForTeaching = {
  id: string;
  studentCode: string;
  studentGroup: string;
  assessmentVersion: string;
  answers: Record<string, string>;
  submittedAt: string;
};

export type SubskillResult = {
  code: string;
  domain: Domain;
  label: string;
  score: number;
  maxScore: number;
  percent: number | null;
  evidenceCount: number;
  evidenceIds: string[];
  pendingManual: number;
  status: "优先补强" | "正在形成" | "基本独立" | "相对稳定" | "证据不足";
  confidence: "低" | "中" | "高";
  issue: string;
  action: string;
};

export type TeachingWorkspaceData = {
  generatedAt: string;
  policyVersion: string;
  profile: {
    studentCode: string;
    studentGroup: string;
    stage: string;
    target: string;
    sourceSubmissionId: string;
    sourceAssessmentVersion: string;
    sourceSubmittedAt: string;
    isDemo: boolean;
  };
  diagnostic: {
    summary: string;
    objectiveCoverage: { scored: number; total: number; percent: number };
    subskills: SubskillResult[];
    priorities: Array<{ code: string; label: string; reason: string; nextAction: string }>;
    teacherDecision: "pending" | "confirmed";
  };
  plan: {
    status: "draft" | "approved";
    rationale: string;
    lessons: Array<{
      number: number;
      title: string;
      focus: string[];
      successCriteria: string[];
      evidence: string[];
      status: "planned" | "ready" | "completed";
    }>;
  };
  lessonPlan: {
    status: "draft" | "approved" | "completed";
    title: string;
    duration: number;
    objectives: string[];
    successCriteria: string[];
    prework: string[];
    timeline: Array<{ minutes: string; teacher: string; student: string; capture: string }>;
    branches: Array<{ condition: string; action: string }>;
    exitTicket: string[];
  };
  classRecord: {
    status: "not_started" | "completed";
    dimensions: Array<{ key: string; label: string; value: string }>;
    knowledge: Array<{ code: string; label: string; state: string }>;
    biggestGain: string;
    mainDifficulty: string;
    nextPriority: string;
  };
  homework: {
    status: "draft" | "assigned" | "graded";
    groups: Array<{ skill: string; correct: number | null; total: number; mode: "auto" | "ai_teacher" }>;
    automaticFeedback: string;
    teacherCheck: string;
  };
  progress: Array<{
    skill: string;
    baseline: number;
    post: number | null;
    delayed: number | null;
    evidence: string;
  }>;
  reports: {
    teacher: string;
    student: string;
    parent: string;
  };
  evidenceTimeline: Array<{
    id: string;
    type: "diagnostic" | "teacher_review" | "plan" | "lesson" | "homework" | "stage_test";
    title: string;
    occurredAt: string;
    summary: string;
    skills: string[];
    source: string;
    confidence: "低" | "中" | "高";
  }>;
  aiProposals: Array<{
    id: string;
    category: "student" | "teaching" | "content" | "policy";
    title: string;
    evidence: string;
    proposal: string;
    risk: "低" | "中" | "高";
    status: "观察中" | "待教师确认" | "待积累数据";
  }>;
};

export type CompletedSteps = {
  diagnosis?: boolean;
  plan?: boolean;
  lesson?: boolean;
  homework?: boolean;
  stageTest?: boolean;
};

const skillCatalog: Record<string, { domain: Domain; label: string; issue: string; action: string }> = {
  L01: { domain: "listening", label: "听力主旨", issue: "容易被局部信息干扰", action: "先预测主题，再提取反复出现的信息" },
  L02: { domain: "listening", label: "目的判断", issue: "能听到内容但不一定判断说话目的", action: "区分通知、解释、建议和说服" },
  L03: { domain: "listening", label: "明确细节", issue: "数字、地点和具体安排可能遗漏", action: "训练关键词速记与复核" },
  L04: { domain: "listening", label: "顺序与组织", issue: "多步骤信息容易错序", action: "使用顺序框架记录" },
  L05: { domain: "listening", label: "原因与结果", issue: "原因和结果可能配对错误", action: "标记because、therefore等信号" },
  L06: { domain: "listening", label: "信息整合", issue: "多条信息合并时容易漏项", action: "训练表格和步骤式笔记" },
  L07: { domain: "listening", label: "态度与语气", issue: "可能忽略说话者的立场强度", action: "比较possible、certain、doubtful等程度" },
  L08: { domain: "listening", label: "听力推断", issue: "可能把推测当成事实", action: "要求答案同时给出听力证据" },
  R01: { domain: "reading", label: "事实信息查找", issue: "信息分散时可能漏项", action: "问题关键词与原文同义改写配对" },
  R02: { domain: "reading", label: "主旨概括", issue: "容易选择只覆盖局部内容的选项", action: "检查答案是否覆盖全文而非单段" },
  R03: { domain: "reading", label: "多信息整合", issue: "规则和表格信息可能组合错误", action: "逐条勾选条件后再作答" },
  R05: { domain: "reading", label: "指代关系", issue: "代词与名词对应不稳定", action: "根据距离、单复数和意义逐项验证" },
  R07: { domain: "reading", label: "语境词义", issue: "可能依赖单词的第一词义", action: "把候选词义放回句子验证" },
  R08: { domain: "reading", label: "推断与证据", issue: "能找到相关句，但不能解释证据链", action: "使用Evidence → This suggests → Answer" },
  R09: { domain: "reading", label: "人物与作者判断", issue: "判断缺少准确文本证据", action: "每个品质或态度必须配一条行为证据" },
  R10: { domain: "reading", label: "规则应用", issue: "容易忽略限制条件", action: "把每条规则转成检查清单" },
  V02: { domain: "vocabulary", label: "语境词义", issue: "抽象词和近义词辨析不稳定", action: "通过搭配和语境排除干扰项" },
  V03: { domain: "vocabulary", label: "词语搭配", issue: "知道词义但搭配不自然", action: "建立动词、名词和形容词搭配块" },
  V04: { domain: "vocabulary", label: "词形变化", issue: "副词和抽象名词形式容易错误", action: "先判断词性位置，再转换词形" },
  V05: { domain: "vocabulary", label: "词汇实际使用", issue: "识别词汇强于主动使用", action: "在句子和短段落中使用目标词" },
  G02: { domain: "grammar", label: "句子结构", issue: "复杂句中可能丢失句子骨架", action: "先标主语和谓语，再增加修饰成分" },
  G03: { domain: "grammar", label: "主谓一致", issue: "each、every等主语后动词不稳定", action: "训练真正主语识别和动词变形" },
  G04: { domain: "grammar", label: "时态选择", issue: "时间线索与时态对应不稳定", action: "用时间轴比较现在、过去和将来" },
  G06: { domain: "grammar", label: "现在完成时", issue: "助动词和过去分词结构不稳定", action: "从经历和未完成事件语境练习" },
  G07: { domain: "grammar", label: "将来表达", issue: "安排、计划和时刻表容易混用", action: "比较现在进行时和一般现在时" },
  G08: { domain: "grammar", label: "可数与不可数", issue: "数量词选择可能错误", action: "使用真实名词分类和数量搭配" },
  G09: { domain: "grammar", label: "冠词与限定词", issue: "a、an、the和some可能混淆", action: "根据首次出现、特指和数量判断" },
  G10: { domain: "grammar", label: "关系从句", issue: "关系代词选择不稳定", action: "先确定先行词是人、物、地点或所属" },
  G12: { domain: "grammar", label: "情态与规则", issue: "义务、禁止和建议强度可能混淆", action: "在学校规则语境中对比使用" },
  G14: { domain: "grammar", label: "复杂从句", issue: "条件、目的和让步关系不稳定", action: "先判断逻辑关系，再选择连接词" },
  W01: { domain: "writing", label: "写作任务完成", issue: "可能遗漏题目要求", action: "写作前逐项勾选内容要求" },
  W04: { domain: "writing", label: "观点展开", issue: "观点后缺少过程、结果和具体例子", action: "使用观点—原因—过程—结果—例子" },
  W08: { domain: "writing", label: "句子完整性", issue: "从句或连接后可能形成残句", action: "检查每句是否有完整主谓结构" },
  W11: { domain: "writing", label: "语言准确性", issue: "主谓一致、可数名词和介词错误反复出现", action: "建立个人写作检查清单" },
  W12: { domain: "writing", label: "文体与修改", issue: "能完成文体但自我修改不足", action: "提交前进行任务、结构和语言三轮检查" },
  S01: { domain: "speaking", label: "口语内容", issue: "回答内容可能过短", action: "使用观点—原因—例子的口头结构" },
  S04: { domain: "speaking", label: "口语流利度", issue: "停顿较多且依赖提示", action: "使用关键词卡进行限时复述" },
  S06: { domain: "speaking", label: "语言控制", issue: "口语语法错误影响连贯", action: "优先稳定高频句型" },
  S08: { domain: "speaking", label: "互动与得体性", issue: "能提问但追问和回应不足", action: "训练确认、追问和回应句型" },
};

const demoManualScores: Record<string, number> = {
  ...Object.fromEntries(Array.from({ length: 18 }, (_, index) => [`L${index + 1}`, 1])),
  L11: 0,
  ...Object.fromEntries(Array.from({ length: 18 }, (_, index) => [`R${index + 1}`, 1])),
  R4: 0.5,
  R5: 0,
  R6: 0.5,
  R7: 0.5,
  R8: 0,
  R9: 0,
  R13: 0,
  W1: 1,
  W2: 1,
  W3: 0.6,
  W4: 0.65,
  S1: 0.65,
  S2: 0.55,
  S3: 0.7,
};

function normalise(value: string) {
  return value.trim().toLowerCase().replace(/[.。!！?？,，]/g, "");
}

function objectiveScore(question: Question, value: string) {
  if (!value || question.answer === undefined) return null;
  if (typeof question.answer === "number") return Number(value) === question.answer ? 1 : 0;
  return normalise(value) === normalise(question.answer) ? 1 : 0;
}

function skillCodes(question: Question) {
  return Array.from(new Set(question.code.match(/[A-Z]\d{2}/g) ?? []));
}

function resultStatus(percent: number | null, pendingManual: number): SubskillResult["status"] {
  if (percent === null || (pendingManual > 0 && percent === 0)) return "证据不足";
  if (percent < 45) return "优先补强";
  if (percent < 65) return "正在形成";
  if (percent < 82) return "基本独立";
  return "相对稳定";
}

function resultConfidence(evidenceCount: number, pendingManual: number): SubskillResult["confidence"] {
  if (pendingManual > 0 || evidenceCount < 2) return "低";
  if (evidenceCount < 4) return "中";
  return "高";
}

function analyseSubskills(submission: SubmissionForTeaching) {
  const aggregates = new Map<string, { score: number; max: number; ids: string[]; pending: number }>();
  const isDemo = submission.studentCode.startsWith("TEST-");
  let objectivelyScored = 0;

  for (const question of questions) {
    const value = submission.answers[question.id] ?? "";
    if (!value.trim()) continue;
    const objective = objectiveScore(question, value);
    if (objective !== null) objectivelyScored += 1;
    const score = objective ?? (isDemo ? demoManualScores[question.id] : undefined);

    for (const code of skillCodes(question)) {
      if (!skillCatalog[code]) continue;
      const aggregate = aggregates.get(code) ?? { score: 0, max: 0, ids: [], pending: 0 };
      aggregate.ids.push(question.id);
      if (score === undefined) aggregate.pending += 1;
      else {
        aggregate.score += score;
        aggregate.max += 1;
      }
      aggregates.set(code, aggregate);
    }
  }

  if (isDemo) {
    const additions = [
      ["W04", 2, 4, ["W3", "W4"]],
      ["W08", 3, 4, ["W1", "W2", "W3", "W4"]],
      ["W11", 2, 4, ["W3", "W4"]],
      ["S04", 2, 4, ["S1", "S2", "S3"]],
    ] as const;
    for (const [code, score, max, ids] of additions) {
      aggregates.set(code, { score, max, ids: [...ids], pending: 0 });
    }
  }

  const subskills = Array.from(aggregates.entries()).map(([code, aggregate]) => {
    const skill = skillCatalog[code];
    const percent = aggregate.max ? Math.round((aggregate.score / aggregate.max) * 100) : null;
    return {
      code,
      domain: skill.domain,
      label: skill.label,
      score: Number(aggregate.score.toFixed(1)),
      maxScore: aggregate.max,
      percent,
      evidenceCount: aggregate.ids.length,
      evidenceIds: aggregate.ids,
      pendingManual: aggregate.pending,
      status: resultStatus(percent, aggregate.pending),
      confidence: resultConfidence(aggregate.ids.length, aggregate.pending),
      issue: skill.issue,
      action: skill.action,
    } satisfies SubskillResult;
  });

  subskills.sort((a, b) => {
    if (a.percent === null && b.percent !== null) return 1;
    if (a.percent !== null && b.percent === null) return -1;
    return (a.percent ?? 101) - (b.percent ?? 101) || b.evidenceCount - a.evidenceCount;
  });

  return { subskills, objectivelyScored };
}

function buildPriorities(subskills: SubskillResult[]) {
  const preferred = ["R08", "R05", "R02", "G03", "G06", "W04", "W11"];
  const candidates = preferred
    .map((code) => subskills.find((item) => item.code === code))
    .filter((item): item is SubskillResult => Boolean(item));
  const ordered = [...candidates].sort((a, b) => (a.percent ?? 101) - (b.percent ?? 101));
  return ordered.slice(0, 4).map((item) => ({
    code: item.code,
    label: item.label,
    reason: `${item.evidenceIds.join("、")}显示：${item.issue}。当前证据${item.confidence === "低" ? "仍不足，需要补测" : "已足以进入针对性教学"}。`,
    nextAction: item.action,
  }));
}

function buildReports(isDemo: boolean) {
  if (!isDemo) {
    return {
      teacher: "客观题已经完成初步分析。开放题仍需教师逐题复核，确认后系统才能生成可靠的教学计划。",
      student: "测试已经提交。老师确认开放题后，你会看到具体的强项和下一步练习重点。",
      parent: "本次测试仍在教师复核中。正式报告会区分已经掌握、正在形成和证据不足的能力。",
    };
  }
  return {
    teacher: "学生的直接信息查找和基础句子完成度较好。主要瓶颈集中在阅读推断证据链、指代关系、主谓一致和写作观点展开。建议先修复可迁移的底层能力，而不是继续增加综合题量。",
    student: "你已经能找到很多明显信息，也能完成基本写作任务。接下来重点练习：找到证据后，解释它为什么支持答案；写观点后，补充过程、结果和具体例子。",
    parent: "学生并非整体看不懂文章，当前主要困难是推断、指代和观点解释。系统将用四次针对性课程观察独立完成、迁移和延迟保持情况，再判断是否稳定掌握。",
  };
}

export function buildTeachingWorkspace(submission: SubmissionForTeaching): TeachingWorkspaceData {
  const isDemo = submission.studentCode.startsWith("TEST-");
  const { subskills, objectivelyScored } = analyseSubskills(submission);
  const priorities = buildPriorities(subskills);
  const scoredPercent = Math.round((objectivelyScored / questions.length) * 100);

  return {
    generatedAt: new Date().toISOString(),
    policyVersion: teachingPolicyVersion,
    profile: {
      studentCode: submission.studentCode,
      studentGroup: submission.studentGroup,
      stage: "S1",
      target: "四课内建立可观察、可复测的子技能进步",
      sourceSubmissionId: submission.id,
      sourceAssessmentVersion: submission.assessmentVersion,
      sourceSubmittedAt: submission.submittedAt,
      isDemo,
    },
    diagnostic: {
      summary: isDemo
        ? "事实信息和基础表达相对稳定；阅读推断、指代、观点展开和部分语法结构需要优先补强。"
        : "客观题已完成自动分析；开放题等待教师复核，因此当前结论属于初步诊断。",
      objectiveCoverage: { scored: objectivelyScored, total: questions.length, percent: scoredPercent },
      subskills,
      priorities,
      teacherDecision: "pending",
    },
    plan: {
      status: "draft",
      rationale: "先处理阅读证据链和指代，再修复高频语法，随后迁移到写作，最后使用新材料复测。",
      lessons: [
        {
          number: 1,
          title: "事实、指代与推断证据链",
          focus: ["区分事实与推断", "找到并解释证据", "解决基本指代"],
          successCriteria: ["新文本中指代和推断达到70%", "至少3题写出完整证据链"],
          evidence: ["独立练习", "迁移任务", "Exit Ticket"],
          status: "planned",
        },
        {
          number: 2,
          title: "主谓一致与现在完成时",
          focus: ["识别真正主语", "稳定助动词和过去分词", "迁移到短段落"],
          successCriteria: ["独立改正8/10句", "短段落中目标结构达到80%"],
          evidence: ["改错", "句子写作", "60词段落"],
          status: "planned",
        },
        {
          number: 3,
          title: "观点展开与语言迁移",
          focus: ["观点—原因—过程—结果—例子", "检查重复语言错误"],
          successCriteria: ["每个观点包含解释和例子", "完成个人错误检查清单"],
          evidence: ["段落分析量表", "独立写作"],
          status: "planned",
        },
        {
          number: 4,
          title: "综合迁移与阶段复测",
          focus: ["新材料阅读", "阅读到写作", "延迟保持计划"],
          successCriteria: ["关键子技能达到设定阈值", "能说明仍未掌握的原因"],
          evidence: ["平行小测", "综合任务", "延迟复测"],
          status: "planned",
        },
      ],
    },
    lessonPlan: {
      status: "draft",
      title: "第1课：Reading Inference and Evidence",
      duration: 60,
      objectives: ["区分事实题和推断题", "找出答案依据句", "解释证据与答案的关系", "解决基本代词指代"],
      successCriteria: ["事实题至少4/5", "指代和推断合计至少5/7", "至少3题写出证据解释"],
      prework: ["120词短文", "2道事实题", "1道指代题", "2道推断题", "每题标出依据句和信心等级"],
      timeline: [
        { minutes: "0–5", teacher: "展示两道预习错题，不直接给答案", student: "回忆并解释选择原因", capture: "能否提取旧知识" },
        { minutes: "5–12", teacher: "对比事实题和推断题", student: "给问题分类并圈关键词", capture: "分类正确率" },
        { minutes: "12–22", teacher: "示范Evidence → This suggests → Answer", student: "跟随标注一题", capture: "提示依赖程度" },
        { minutes: "22–35", teacher: "引导3题并逐步撤除提示", student: "口头解释证据链", capture: "提示次数和修改情况" },
        { minutes: "35–45", teacher: "发放新短文和独立题", student: "独立完成4题", capture: "正确率和用时" },
        { minutes: "45–53", teacher: "展示只抄证据的典型错误", student: "改写错误答案", capture: "能否自我修正" },
        { minutes: "53–58", teacher: "更换通知类文本", student: "完成迁移题", capture: "迁移证据" },
        { minutes: "58–60", teacher: "发放Exit Ticket", student: "完成1道指代和1道推断", capture: "是否达到成功标准" },
      ],
      branches: [
        { condition: "独立题达到80%以上", action: "增加作者态度题" },
        { condition: "达到60%–79%", action: "增加一题证据解释练习" },
        { condition: "低于60%", action: "回到句子层面的指代和连接词" },
        { condition: "选对但不能解释", action: "记为部分掌握，不升级为独立完成" },
      ],
      exitTicket: ["找出代词指代对象并写出判断依据", "完成一道新文本推断题并解释证据链"],
    },
    classRecord: {
      status: "not_started",
      dimensions: [
        { key: "engagement", label: "课堂投入", value: "待记录" },
        { key: "understanding", label: "理解速度", value: "待记录" },
        { key: "prompting", label: "提示需要", value: "待记录" },
        { key: "independence", label: "独立完成", value: "待记录" },
        { key: "correction", label: "纠错反应", value: "待记录" },
      ],
      knowledge: [
        { code: "R01", label: "事实信息查找", state: "待记录" },
        { code: "R05", label: "指代关系", state: "待记录" },
        { code: "R08", label: "推断与证据", state: "待记录" },
      ],
      biggestGain: "待记录",
      mainDifficulty: "待记录",
      nextPriority: "待记录",
    },
    homework: {
      status: "draft",
      groups: [
        { skill: "指代关系", correct: null, total: 4, mode: "auto" },
        { skill: "事实与推断分类", correct: null, total: 4, mode: "auto" },
        { skill: "推断选择", correct: null, total: 4, mode: "auto" },
        { skill: "证据配对", correct: null, total: 4, mode: "auto" },
        { skill: "开放解释", correct: null, total: 2, mode: "ai_teacher" },
      ],
      automaticFeedback: "作业完成后按子技能生成反馈。开放解释题由AI定位证据链，教师确认。",
      teacherCheck: "等待作业提交。",
    },
    progress: [
      { skill: "事实信息查找", baseline: 89, post: null, delayed: null, evidence: "初测" },
      { skill: "指代关系", baseline: 0, post: null, delayed: null, evidence: "初测" },
      { skill: "阅读推断", baseline: 25, post: null, delayed: null, evidence: "初测" },
      { skill: "主旨概括", baseline: 0, post: null, delayed: null, evidence: "初测" },
      { skill: "写作内容展开", baseline: 50, post: null, delayed: null, evidence: "分析量表" },
      { skill: "主谓一致", baseline: 0, post: null, delayed: null, evidence: "初测" },
    ],
    reports: buildReports(isDemo),
    evidenceTimeline: [
      {
        id: `diagnostic-${submission.id}`,
        type: "diagnostic",
        title: "完成S1综合诊断",
        occurredAt: submission.submittedAt,
        summary: isDemo
          ? "建立听说读写、词汇和语法的初始能力基线，并定位优先补强项。"
          : "客观题形成初始基线；开放题结论等待教师确认。",
        skills: priorities.map((item) => item.code),
        source: `诊断卷 ${submission.assessmentVersion}`,
        confidence: isDemo ? "中" : "低",
      },
    ],
    aiProposals: [
      {
        id: "coverage-reading-open",
        category: "content",
        title: "提高阅读简答题的结构化评分覆盖",
        evidence: `当前仅${objectivelyScored}/${questions.length}项可直接自动评分，大量开放题依赖人工复核。`,
        proposal: "为事实查找、指代和规则题增加可接受答案、关键词和部分得分规则。",
        risk: "中",
        status: "待教师确认",
      },
      {
        id: "strategy-evidence-chain",
        category: "teaching",
        title: "试用证据链教学策略",
        evidence: "虚拟学生能找到相关句，但推断和解释表现明显更弱。",
        proposal: "在四课小范围运行Evidence → This suggests → Answer，并比较延迟复测。",
        risk: "低",
        status: "观察中",
      },
      {
        id: "policy-mastery-gate",
        category: "policy",
        title: "稳定掌握必须包含延迟或迁移证据",
        evidence: "单次练习正确不能说明长期保持或新情境迁移。",
        proposal: "只有多次独立表现并通过延迟/迁移任务，才允许升级为稳定掌握。",
        risk: "低",
        status: "待积累数据",
      },
    ],
  };
}

function simulatedClassRecord(): TeachingWorkspaceData["classRecord"] {
  return {
    status: "completed",
    dimensions: [
      { key: "engagement", label: "课堂投入", value: "高" },
      { key: "understanding", label: "理解速度", value: "适中" },
      { key: "prompting", label: "提示需要", value: "部分" },
      { key: "independence", label: "独立完成", value: "基本可以" },
      { key: "correction", label: "纠错反应", value: "主动修改" },
    ],
    knowledge: [
      { code: "R01", label: "事实信息查找", state: "IP · 独立完成" },
      { code: "R05", label: "指代关系", state: "GP · 引导完成" },
      { code: "R08", label: "推断与证据", state: "GP · 引导完成" },
    ],
    biggestGain: "开始主动划出证据，不再只凭感觉选择答案。",
    mainDifficulty: "能够找到相关句，但仍不能稳定解释证据为什么支持答案。",
    nextPriority: "保留证据解释训练，再进入主谓一致和现在完成时。",
  };
}

function clampScore(value: number, total: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(total, Math.round(value)));
}

function completeClassRecord(
  current: TeachingWorkspaceData,
  input: NonNullable<AutomationInput["classRecord"]>,
): TeachingWorkspaceData["classRecord"] {
  const dimensions = current.classRecord.dimensions.map((dimension) => ({
    ...dimension,
    value: input.dimensions[dimension.key] || "未记录",
  }));
  const knowledge = current.classRecord.knowledge.map((item) => ({
    ...item,
    state: input.knowledge[item.code] || "IN · 已介绍",
  }));
  const strongest = knowledge.find((item) => item.state.startsWith("TR"))
    ?? knowledge.find((item) => item.state.startsWith("IP"));
  const weakest = knowledge.find((item) => item.state.startsWith("RT"))
    ?? knowledge.find((item) => item.state.startsWith("GP"))
    ?? knowledge[knowledge.length - 1];
  const prompting = dimensions.find((item) => item.key === "prompting")?.value;
  const independence = dimensions.find((item) => item.key === "independence")?.value;

  return {
    status: "completed",
    dimensions,
    knowledge,
    biggestGain: input.biggestGain?.trim()
      || (strongest ? `${strongest.label}已经达到${strongest.state.replace(" · ", "（")}）阶段。` : "已完成本课目标练习。"),
    mainDifficulty: input.mainDifficulty?.trim()
      || (weakest ? `${weakest.label}仍处于${weakest.state.replace(" · ", "（")}）阶段。` : "需要继续收集独立表现证据。"),
    nextPriority: input.nextPriority?.trim()
      || `${weakest?.label ?? "本课目标"}继续保留；当前提示需要为“${prompting ?? "未记录"}”，独立完成为“${independence ?? "未记录"}”。`,
  };
}

function timeline(data: TeachingWorkspaceData) {
  data.evidenceTimeline ??= [];
  return data.evidenceTimeline;
}

function addTimelineEntry(
  data: TeachingWorkspaceData,
  entry: Omit<TeachingWorkspaceData["evidenceTimeline"][number], "id" | "occurredAt">,
) {
  timeline(data).push({ ...entry, id: crypto.randomUUID(), occurredAt: new Date().toISOString() });
}

function buildHomeworkFeedback(groups: TeachingWorkspaceData["homework"]["groups"], teacherNote?: string) {
  const percentages = groups.map((group) => ({
    skill: group.skill,
    percent: Math.round(((group.correct ?? 0) / group.total) * 100),
  }));
  const strong = percentages.filter((item) => item.percent >= 80).map((item) => item.skill);
  const weak = percentages.filter((item) => item.percent < 60).map((item) => item.skill);
  const average = Math.round(percentages.reduce((sum, item) => sum + item.percent, 0) / Math.max(percentages.length, 1));
  return {
    average,
    strong,
    weak,
    automaticFeedback: `作业平均得分率${average}%。${strong.length ? `${strong.join("、")}表现相对稳定。` : "暂时没有达到稳定阈值的子技能。"}${weak.length ? `${weak.join("、")}低于60%，下一课应继续保留。` : "所有子技能均达到形成中或以上。"}`,
    teacherCheck: teacherNote?.trim() || "请结合开放题答案确认：学生是理解不足、提示依赖，还是偶然粗心。",
  };
}

export function upgradeTeachingWorkspace(data: TeachingWorkspaceData) {
  const upgraded = structuredClone(data);
  upgraded.policyVersion = teachingPolicyVersion;
  upgraded.evidenceTimeline ??= [
    {
      id: `diagnostic-${upgraded.profile.sourceSubmissionId}`,
      type: "diagnostic",
      title: "完成S1综合诊断",
      occurredAt: upgraded.profile.sourceSubmittedAt,
      summary: upgraded.diagnostic.summary,
      skills: upgraded.diagnostic.priorities.map((item) => item.code),
      source: `诊断卷 ${upgraded.profile.sourceAssessmentVersion}`,
      confidence: upgraded.profile.isDemo ? "中" : "低",
    },
  ];
  return upgraded;
}

export function advanceTeachingWorkspace(
  current: TeachingWorkspaceData,
  currentCompleted: CompletedSteps,
  action: AutomationAction,
  input: AutomationInput = {},
): { data: TeachingWorkspaceData; completed: CompletedSteps; stage: WorkspaceStage; eventType: string } {
  if (action === "run_full_cycle") {
    let state = { data: current, completed: currentCompleted, stage: "diagnostic_ready" as WorkspaceStage, eventType: "" };
    for (const step of ["confirm_diagnosis", "approve_plan", "complete_lesson", "grade_homework", "run_stage_test"] as const) {
      state = advanceTeachingWorkspace(state.data, state.completed, step, { simulate: true });
    }
    return { ...state, eventType: "FullCycleSimulated" };
  }

  const data = upgradeTeachingWorkspace(current);
  const completed = { ...currentCompleted };
  data.generatedAt = new Date().toISOString();

  if (action === "confirm_diagnosis") {
    data.diagnostic.teacherDecision = "confirmed";
    completed.diagnosis = true;
    addTimelineEntry(data, {
      type: "teacher_review",
      title: "教师确认诊断结论",
      summary: `确认${data.diagnostic.priorities.length}项近期教学重点，开放题仍保留教师判断。`,
      skills: data.diagnostic.priorities.map((item) => item.code),
      source: "教师复核",
      confidence: "高",
    });
    return { data, completed, stage: "plan_ready", eventType: "TeacherReviewConfirmed" };
  }

  if (action === "approve_plan") {
    data.plan.status = "approved";
    data.plan.lessons[0].status = "ready";
    data.lessonPlan.status = "approved";
    completed.plan = true;
    addTimelineEntry(data, {
      type: "plan",
      title: "批准四课滚动计划",
      summary: data.plan.rationale,
      skills: data.diagnostic.priorities.map((item) => item.code),
      source: "教师批准的教学计划",
      confidence: "高",
    });
    return { data, completed, stage: "lesson_ready", eventType: "PlanApproved" };
  }

  if (action === "complete_lesson") {
    if (!input.classRecord && !input.simulate && !data.profile.isDemo) {
      throw new Error("请先填写课堂记录，再完成本课。");
    }
    data.lessonPlan.status = "completed";
    data.plan.lessons[0].status = "completed";
    data.classRecord = input.classRecord
      ? completeClassRecord(data, input.classRecord)
      : simulatedClassRecord();
    data.homework.status = "assigned";
    completed.lesson = true;
    addTimelineEntry(data, {
      type: "lesson",
      title: `完成${data.lessonPlan.title}`,
      summary: `${data.classRecord.biggestGain} 主要困难：${data.classRecord.mainDifficulty}`,
      skills: data.classRecord.knowledge.map((item) => item.code),
      source: input.classRecord ? "真实课堂记录" : "虚拟课堂记录",
      confidence: input.classRecord ? "高" : "低",
    });
    return { data, completed, stage: "homework_ready", eventType: "LessonCompleted" };
  }

  if (action === "grade_homework") {
    if (!input.homework && !input.simulate && !data.profile.isDemo) {
      throw new Error("请先填写每组作业得分，再完成批改。");
    }
    data.homework.status = "graded";
    const simulated = [3, 4, 3, 3, 1];
    data.homework.groups = data.homework.groups.map((group, index) => ({
      ...group,
      correct: clampScore(input.homework?.results[group.skill] ?? simulated[index], group.total),
    }));
    const feedback = buildHomeworkFeedback(data.homework.groups, input.homework?.teacherNote);
    data.homework.automaticFeedback = feedback.automaticFeedback;
    data.homework.teacherCheck = feedback.teacherCheck;
    data.plan.lessons[1].focus = [
      ...(feedback.weak.length ? feedback.weak.map((skill) => `补强：${skill}`) : ["把已形成能力迁移到新材料"]),
      "主谓一致",
      "现在完成时",
      "短段落迁移",
    ].slice(0, 5);
    completed.homework = true;
    addTimelineEntry(data, {
      type: "homework",
      title: "完成针对性作业批改",
      summary: data.homework.automaticFeedback,
      skills: data.homework.groups.map((group) => group.skill),
      source: input.homework ? "真实作业结果" : "虚拟作业结果",
      confidence: input.homework ? "高" : "低",
    });
    return { data, completed, stage: "next_lesson_ready", eventType: "HomeworkSubmitted" };
  }

  if (!input.stageTest && !input.simulate && !data.profile.isDemo) {
    throw new Error("请先填写后测和延迟复测结果。");
  }
  data.progress = data.progress.map((item) => {
    const simulated: Record<string, [number, number]> = {
      事实信息查找: [92, 90],
      指代关系: [75, 67],
      阅读推断: [67, 60],
      主旨概括: [60, 60],
      写作内容展开: [75, 75],
      主谓一致: [80, 70],
    };
    const provided = input.stageTest?.results[item.skill];
    const result = provided ? [provided.post, provided.delayed] : (simulated[item.skill] ?? [item.baseline, item.baseline]);
    return {
      ...item,
      post: clampScore(result[0], 100),
      delayed: clampScore(result[1], 100),
      evidence: provided ? "平行后测 + 延迟复测" : "平行后测 + 延迟复测（模拟）",
    };
  });
  const averageGain = Math.round(data.progress.reduce((sum, item) => sum + ((item.post ?? item.baseline) - item.baseline), 0) / Math.max(data.progress.length, 1));
  const averageRetention = Math.round(data.progress.reduce((sum, item) => sum + ((item.delayed ?? item.post ?? 0) - (item.post ?? 0)), 0) / Math.max(data.progress.length, 1));
  const ranked = data.progress
    .map((item) => ({ ...item, gain: (item.post ?? item.baseline) - item.baseline, retention: (item.delayed ?? item.post ?? 0) - (item.post ?? 0) }))
    .sort((a, b) => b.gain - a.gain);
  const strongestGain = ranked[0];
  const largestDrop = [...ranked].sort((a, b) => a.retention - b.retention)[0];
  const realLabel = input.stageTest ? "真实阶段闭环" : "模拟闭环";
  data.reports.teacher = `${realLabel}显示：关键子技能后测平均变化${averageGain >= 0 ? "+" : ""}${averageGain}个百分点，延迟复测相对后测${averageRetention >= 0 ? "+" : ""}${averageRetention}个百分点。下一周期优先处理延迟回落最大的能力。`;
  data.reports.student = averageGain >= 0
    ? `你的重点能力平均提高了${averageGain}个百分点，其中${strongestGain?.skill ?? "目标能力"}进步最明显。下一步继续练习${largestDrop?.skill ?? "延迟保持"}，让学会的内容过一段时间仍能使用。`
    : `这次后测平均比初测低${Math.abs(averageGain)}个百分点。暂时不要增加难度，下一周期先重新检查前置知识、提示方式和练习负担。`;
  data.reports.parent = `本阶段使用平行后测和延迟复测进行比较。后测平均变化为${averageGain >= 0 ? "+" : ""}${averageGain}个百分点，延迟保持变化为${averageRetention >= 0 ? "+" : ""}${averageRetention}个百分点。${averageRetention < -10 ? "部分能力仍明显回落，目前不能判断为稳定掌握。" : "已学内容的保持情况基本可接受，仍需在新情境中继续观察。"}`;
  completed.stageTest = true;
  addTimelineEntry(data, {
    type: "stage_test",
    title: "完成阶段复测",
    summary: data.reports.teacher,
    skills: data.progress.map((item) => item.skill),
    source: input.stageTest ? "真实后测与延迟复测" : "虚拟复测数据",
    confidence: input.stageTest ? "高" : "低",
  });
  return { data, completed, stage: "cycle_complete", eventType: "StageAssessmentCompleted" };
}

export function stageLabel(stage: WorkspaceStage) {
  return {
    diagnostic_ready: "等待诊断确认",
    plan_ready: "等待计划批准",
    lesson_ready: "教案可以执行",
    homework_ready: "等待作业结果",
    next_lesson_ready: "下一课已调整",
    cycle_complete: "四课闭环已完成",
  }[stage];
}

export function domainLabel(domain: Domain) {
  return domainMeta[domain].short;
}
