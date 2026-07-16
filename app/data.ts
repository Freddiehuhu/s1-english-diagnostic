export type Domain =
  | "listening"
  | "reading"
  | "vocabulary"
  | "grammar"
  | "writing"
  | "speaking";

export type Question = {
  id: string;
  domain: Domain;
  group: string;
  code: string;
  prompt: string;
  type: "mcq" | "short" | "long";
  options?: string[];
  answer?: number | string;
  resource?: "readingA" | "readingB";
  audio?: "A" | "B" | "C";
  hint?: string;
  sourceKind: "demo" | "official" | "licensed" | "teacher-authored";
  reviewStatus: "draft" | "reviewed" | "published" | "retired";
  version: string;
  points: number;
  difficultyTarget: "foundation" | "core" | "stretch";
};

export const assessmentMeta = {
  id: "s1-demo-diagnostic",
  version: "0.2.0-demo",
  title: "S1 English Diagnostic",
  status: "demo" as const,
  contentNotice: "演示题库：用于测试流程和界面，不代表正式香港中一能力标准。",
};

export const domainMeta: Record<Domain, { label: string; short: string; description: string }> = {
  listening: { label: "听力 Listening", short: "听力", description: "主旨、细节、因果、态度与信息整合" },
  reading: { label: "阅读 Reading", short: "阅读", description: "定位、指代、推断、篇章目的与证据" },
  vocabulary: { label: "词汇 Vocabulary", short: "词汇", description: "语境词义、词形与实际使用" },
  grammar: { label: "语法 Grammar", short: "语法", description: "时态、主谓一致、从句与句子控制" },
  writing: { label: "写作 Writing", short: "写作", description: "任务完成、组织、展开与语言准确性" },
  speaking: { label: "口语 Speaking", short: "口语", description: "内容、流利度、互动与得体性" },
};

export const listeningScripts = {
  A: {
    title: "Recording A · Community Action Day",
    text: "Good morning, students. Next Friday, the eighteenth of September, the school will hold Community Action Day. The activities were originally planned for Riverside Park, but the weather forecast now predicts heavy rain. We will therefore use the school hall instead. All S1 students should meet outside the library at eight fifteen. Wear your PE uniform and bring a reusable water bottle. In the hall, you may either pack food boxes or design cards for elderly residents. If you registered for gardening, please report to the hall as usual; a teacher will give you a new activity. The programme finishes at noon. Parent volunteers will collect donated items at the main gate. If you need to eat lunch at school after the programme, tell your form teacher by Tuesday so that the kitchen can prepare enough food.",
  },
  B: {
    title: "Recording B · Science project discussion",
    text: "Maya: Leo, have you finished the graph for our plant experiment? Leo: I entered the results, but the graph looks strange. We measured the plants every two days, except last Friday. The classroom was locked, so there is a missing point. Maya: Then we should not invent a number. Let's add a note and explain the gap. Leo: But Ms Ho said the presentation must look complete. Maya: Complete does not mean perfect. We should be honest. Besides, the plant near the window grew faster. Sunlight may be the reason. Leo: I thought it grew faster because we gave it twice as much water. Maya: Check the log. Both plants received fifty millilitres each time. We can mention sunlight as a possible reason, but we cannot say we proved it. Leo: All right. I'll correct the label and write the note. Can you shorten the introduction? We only have four minutes for the whole presentation. Maya: Sure. I'll keep the aim and remove the background details.",
  },
  C: {
    title: "Recording C · A study method",
    text: "Many students prepare for a test by reading the same notes several times. A small classroom experiment compared this method with recall practice. One group read a list of words three times. Another group closed the list and tried to remember the words without looking. Both groups studied for ten minutes. Immediately afterwards, their results were similar. When they were tested again two days later, however, the recall group remembered more. Trying to remember can feel difficult, and that uncomfortable feeling may be why some students avoid it. Yet the effort helps show the brain which information needs strengthening. This does not mean that students should never reread. A useful sequence is to read once for understanding, close the material and quiz yourself, check your answers, and then return to the items you missed. The classroom experiment was small, so it does not prove that one method will work best for every learner. It does, however, give students a method worth trying.",
  },
};

export const readingA = {
  title: "An Interview That Changed Direction",
  paragraphs: [
    "Ken had joined the school magazine because he enjoyed writing, but his first assignment did not excite him. The editor asked him to interview someone for a series called ‘People Who Make Our School Work’. Ken chose Mr Yip, a caretaker, mainly because he thought the interview would be easy.",
    "On the afternoon of the interview, Ken found Mr Yip beside a shelf of numbered umbrellas. One umbrella was open on the floor, and Mr Yip was replacing one of its metal arms. Above the shelf was a handwritten sign: BORROW ONE. RETURN IT WHEN THE RAIN STOPS.",
    "Mr Yip explained that the idea had begun on a wet Monday. Several students had no umbrellas and were waiting inside long after school. The lost-property room contained a pile of broken umbrellas that nobody had claimed. Mr Yip asked the principal for permission to repair them.",
    "The first results were not impressive. Two umbrellas folded inside out on their first journey, and three others were never returned. Instead of ending the project, Mr Yip changed it. He tested each repair in front of a large fan, added number tags and placed a borrowing log beside the shelf. Later, students offered to check returned umbrellas every Friday.",
    "Ken looked at his prepared questions. They suddenly seemed flat. He put them aside and asked Mr Yip what he had learnt from the failures. ‘A useful idea is rarely finished when you first think of it,’ Mr Yip said.",
    "Ken wrote an article about the umbrella shelf as a small experiment in problem-solving. His editor asked him to change a paragraph that described Mr Yip as the person who saved everyone. Students also made the system work by returning umbrellas, completing the log and checking repairs.",
  ],
};

export const readingB = {
  title: "Green Steps Challenge",
  schedule: [
    ["Monday", "Launch briefing", "3:45 p.m.", "School hall", "Every captain must attend"],
    ["Tuesday", "Safe-route workshop", "3:30 p.m.", "Room 204", "Optional"],
    ["Friday", "Reflection circle", "8:00 a.m.", "Library Innovation Hub", "Optional"],
    ["Sunday", "Final upload deadline", "6:00 p.m.", "Challenge webpage", "Travel record; bonus proposal if attempted"],
  ],
  rules: [
    "Teams must have 4–6 students and include at least one S1 student and one S2 student.",
    "Record the transport used for the greatest part of each school journey.",
    "Daily points: walking or cycling = 5; public transport = 2; car-sharing = 1; private car = 0.",
    "One team member must check and sign the weekly travel record before upload.",
    "A bonus proposal must identify a travel problem, give a practical solution and explain its likely effect. A sketch is optional.",
    "Do not upload photographs showing faces, student names or travel-card numbers.",
  ],
  message: "Dev has formed a team with three S1 classmates and two S2 students. Carla wants to be captain, but she has music rehearsal on Monday from 3:30 to 4:30. Dev could attend the launch instead. He takes the MTR and then walks for eight minutes. Mei cycles daily but cannot attend on Friday morning. The team also has an idea for a covered bicycle rack.",
};

const mcq = (id: string, domain: Domain, group: string, code: string, prompt: string, options: string[], answer: number, extra: Partial<Question> = {}): Question =>
  ({ id, domain, group, code, prompt, type: "mcq", options, answer, sourceKind: "demo", reviewStatus: "draft", version: assessmentMeta.version, points: 1, difficultyTarget: "core", ...extra });
const short = (id: string, domain: Domain, group: string, code: string, prompt: string, answer?: string, extra: Partial<Question> = {}): Question =>
  ({ id, domain, group, code, prompt, type: "short", answer, sourceKind: "demo", reviewStatus: "draft", version: assessmentMeta.version, points: 1, difficultyTarget: "core", ...extra });
const long = (id: string, domain: Domain, group: string, code: string, prompt: string, hint?: string): Question =>
  ({ id, domain, group, code, prompt, type: "long", hint, sourceKind: "demo", reviewStatus: "draft", version: assessmentMeta.version, points: 1, difficultyTarget: "core" });

export const questions: Question[] = [
  mcq("L1", "listening", "Recording A", "L02", "What is the main purpose of the announcement?", ["Ask parents to organise an event", "Explain arrangements for Community Action Day", "Report that all activities are cancelled", "Teach students to pack food boxes"], 1, { audio: "A" }),
  short("L2", "listening", "Recording A", "L05", "Why has the event location changed?", undefined, { audio: "A" }),
  short("L3", "listening", "Recording A", "L03", "Where will the activities now take place?", undefined, { audio: "A" }),
  mcq("L4", "listening", "Recording A", "L03", "When and where should S1 students meet?", ["8:00 at the main gate", "8:15 outside the library", "8:30 in the hall", "9:00 at Riverside Park"], 1, { audio: "A" }),
  short("L5", "listening", "Recording A", "L03/L05", "What should students registered for gardening do?", undefined, { audio: "A" }),
  short("L6", "listening", "Recording A", "L03", "What must some students tell their form teacher by Tuesday?", undefined, { audio: "A" }),
  short("L7", "listening", "Recording B", "L03", "What problem does Leo notice in the graph?", undefined, { audio: "B" }),
  short("L8", "listening", "Recording B", "L05", "Why was one measurement not taken?", undefined, { audio: "B" }),
  mcq("L9", "listening", "Recording B", "L07", "How does Maya feel about inventing the missing number?", ["It would improve the project", "It is acceptable if unnoticed", "The gap should be reported honestly", "The experiment must be repeated"], 2, { audio: "B" }),
  short("L10", "listening", "Recording B", "L03/L05", "What shows that extra water probably did not cause the faster growth?", undefined, { audio: "B" }),
  mcq("L11", "listening", "Recording B", "L08", "What does Maya say about sunlight?", ["It definitely caused the growth", "It is possible but unproved", "It had no effect", "It should not be mentioned"], 1, { audio: "B" }),
  short("L12", "listening", "Recording B", "L03/L05", "Why does Leo ask Maya to shorten the introduction?", undefined, { audio: "B" }),
  mcq("L13", "listening", "Recording C", "L01/L02", "What is the main purpose of the talk?", ["Prove rereading never helps", "Compare rereading with recall", "Teach experimental design", "Explain why word lists are bad"], 1, { audio: "C" }),
  short("L14", "listening", "Recording C", "L04", "What was the main difference between the two study groups?", undefined, { audio: "C" }),
  short("L15", "listening", "Recording C", "L03", "What happened when students were tested two days later?", undefined, { audio: "C" }),
  short("L16", "listening", "Recording C", "L07/L08", "Why might some students avoid recall practice?", undefined, { audio: "C" }),
  short("L17", "listening", "Recording C", "L04/L06", "Write the four study steps in the correct order.", undefined, { audio: "C" }),
  short("L18", "listening", "Recording C", "L08", "What warning does the speaker give about the experiment?", undefined, { audio: "C" }),

  short("R1", "reading", "Text A", "R01", "What series was Ken's article intended for?", undefined, { resource: "readingA" }),
  short("R2", "reading", "Text A", "R08", "Why did Ken first choose to interview Mr Yip?", undefined, { resource: "readingA" }),
  mcq("R3", "reading", "Text A", "R07", "In paragraph 5, ‘flat’ most nearly means:", ["not level", "uninteresting", "dishonest", "too difficult"], 1, { resource: "readingA" }),
  short("R4", "reading", "Text A", "R01/R08", "Give TWO details showing the project did not work perfectly at first.", undefined, { resource: "readingA" }),
  short("R5", "reading", "Text A", "R05", "What does ‘them’ refer to in ‘permission to repair them’?", undefined, { resource: "readingA" }),
  short("R6", "reading", "Text A", "R05/R08", "Why did Mr Yip introduce number tags and a borrowing log?", undefined, { resource: "readingA" }),
  short("R7", "reading", "Text A", "R08/R09", "Give one quality Mr Yip showed and one piece of evidence.", undefined, { resource: "readingA" }),
  short("R8", "reading", "Text A", "R09/R10", "Why did the editor ask Ken to change the paragraph about Mr Yip?", undefined, { resource: "readingA" }),
  mcq("R9", "reading", "Text A", "R02", "Which statement best summarises the final article?", ["Rules matter more than ideas", "Testing and shared responsibility improved a problem", "Students need punishment", "Caretakers should run all services"], 1, { resource: "readingA" }),
  short("R10", "reading", "Text B", "R10", "Is Dev's proposed team eligible? Explain.", undefined, { resource: "readingB" }),
  short("R11", "reading", "Text B", "R10", "Why should Carla probably not be captain?", undefined, { resource: "readingB" }),
  short("R12", "reading", "Text B", "R01/R10", "Which event must Dev attend as captain? Give day, time and place.", undefined, { resource: "readingB" }),
  short("R13", "reading", "Text B", "R03/R10", "Which transport type should Dev record, and why?", undefined, { resource: "readingB" }),
  short("R14", "reading", "Text B", "R01", "What maximum travel points can Mei earn Monday–Friday?", undefined, { resource: "readingB" }),
  short("R15", "reading", "Text B", "R03/R10", "Does Mei's Friday absence make the team ineligible? Explain.", undefined, { resource: "readingB" }),
  short("R16", "reading", "Text B", "R01", "What THREE things must the bicycle-rack proposal include?", undefined, { resource: "readingB" }),
  short("R17", "reading", "Text B", "R01/R10", "What must the team submit, and by what deadline?", undefined, { resource: "readingB" }),
  short("R18", "reading", "Text B", "R01", "Which privacy rule applies to photographs?", undefined, { resource: "readingB" }),

  mcq("V1", "vocabulary", "Vocabulary in context", "V02", "When a toaster stops working, some people immediately ______ it.", ["discard", "deliver", "display", "divide"], 0),
  mcq("V2", "vocabulary", "Vocabulary in context", "V02", "Volunteers first ______ the item to discover the problem.", ["inspect", "invite", "interrupt", "imagine"], 0),
  mcq("V3", "vocabulary", "Vocabulary in context", "V02", "Their aim is to ______ the item's function.", ["restore", "remove", "repeat", "reduce"], 0),
  mcq("V4", "vocabulary", "Vocabulary in context", "V02", "Details about when the fault began may be ______.", ["essential", "ordinary", "silent", "equal"], 0),
  mcq("V5", "vocabulary", "Vocabulary in context", "V02/V03", "The team may suggest a ______ solution until a part arrives.", ["temporary", "private", "formal", "traditional"], 0),
  mcq("V6", "vocabulary", "Vocabulary in context", "V05", "Students learn to ______ tools carefully.", ["handle", "collect", "predict", "compare"], 0),
  mcq("V7", "vocabulary", "Vocabulary in context", "V02", "Taking an item apart can ______ how it was designed.", ["reveal", "refuse", "replace", "record"], 0),
  mcq("V8", "vocabulary", "Vocabulary in context", "V02/V05", "Repairing objects gives students ______ experience.", ["practical", "recent", "secret", "nervous"], 0),
  short("V9", "vocabulary", "Word forms", "V04", "The team made a careful ______ before replacing the wire. (decide)", "decision"),
  short("V10", "vocabulary", "Word forms", "V04", "All tools must be used ______. (safe)", "safely"),
  short("V11", "vocabulary", "Word forms", "V04", "The ______ of the event depends on preparation. (succeed)", "success"),
  short("V12", "vocabulary", "Word forms", "V04", "Students showed great ______. (responsible)", "responsibility"),
  short("V13", "vocabulary", "Word forms", "V04", "The explanation was clear and ______. (help)", "helpful"),

  mcq("G1", "grammar", "Grammar in context", "G04/G07", "Our S1 classes ______ the Wetland Centre next Thursday.", ["visit", "visited", "are visiting", "have visit"], 2),
  mcq("G2", "grammar", "Grammar in context", "G04/G07", "The bus ______ school at 8:15, according to the timetable.", ["leave", "leaves", "left", "leaving"], 1),
  mcq("G3", "grammar", "Grammar in context", "G03", "Each student ______ to arrive by 8:00.", ["need", "needs", "needing", "have needed"], 1),
  mcq("G4", "grammar", "Grammar in context", "G09", "Students should bring ______ light raincoat.", ["a", "an", "the", "some"], 0),
  mcq("G5", "grammar", "Grammar in context", "G08/G09", "They should bring ______ water.", ["many", "a few", "some", "an"], 2),
  mcq("G6", "grammar", "Grammar in context", "G14", "If it ______ heavily, teachers will move lunch indoors.", ["rain", "rains", "rained", "will rain"], 1),
  mcq("G7", "grammar", "Grammar in context", "G10/G14", "Ms Chan, ______ visited last year, will lead the group.", ["which", "who", "where", "whose"], 1),
  mcq("G8", "grammar", "Grammar in context", "G12", "Students ______ feed or touch the animals.", ["must not", "do not have", "are not", "did not"], 0),
  mcq("G9", "grammar", "Grammar in context", "G06", "Two students ______ their forms yet.", ["do not return", "did not returned", "have not returned", "are not return"], 2),
  mcq("G10", "grammar", "Grammar in context", "G02/G04", "Contact the school if you ______ any questions.", ["have", "had", "will have", "having"], 0),
  mcq("G11", "grammar", "Grammar in context", "G14", "Two buses were arranged ______ everyone can travel safely.", ["although", "so that", "but", "unless"], 1),
  mcq("G12", "grammar", "Grammar in context", "G06", "Students will compare what they ______ in their notebooks.", ["have written", "has wrote", "writing", "writes"], 0),

  long("W1", "writing", "Sentence control", "W07/W08", "Make this fragment a complete sentence: Because the library was closed.", "Write one complete sentence."),
  long("W2", "writing", "Sentence control", "W06/W08", "Join the ideas: I had practised carefully. I still felt nervous.", "Use a suitable connector."),
  long("W3", "writing", "Short paragraph", "W01–W11", "Should a school give students one homework-free evening every week? State your opinion, explain one reason and give a specific example.", "Write 60–80 words."),
  long("W4", "writing", "Extended writing", "W01–W12", "Write an email to the Student Council. Describe one difficulty new S1 students may face, propose TWO practical welcome activities, and explain how each would help.", "Write 120–150 words."),

  long("S1", "speaking", "Individual response", "S01–S06", "Explain three things a new student should know about a normal school day and why each is useful.", "30 seconds preparation; about 1½ minutes speaking."),
  long("S2", "speaking", "Opinion", "S01–S08", "Should students use mobile phones during lunch time? Give your view with reasons or examples.", "Teacher asks two neutral follow-up questions."),
  long("S3", "speaking", "Role play", "S01–S08", "Ask an organiser for the exact time, place, work and items to bring for a Saturday community activity.", "Record brief observation notes after the role play."),
];

export const domains = Object.keys(domainMeta) as Domain[];
