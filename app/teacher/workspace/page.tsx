import { env } from "cloudflare:workers";
import { chatGPTSignOutPath, requireChatGPTUser } from "../../chatgpt-auth";
import TeachingWorkspace from "./teaching-workspace";

export const dynamic = "force-dynamic";

async function WorkspaceGate() {
  const user = await requireChatGPTUser("/teacher/workspace");
  const expected = env.TEACHER_EMAIL?.trim().toLowerCase();
  const authorised = Boolean(expected && user.email.toLowerCase() === expected);

  if (!authorised) {
    return (
      <main className="access-page">
        <section className="access-card">
          <span className="brand-mark">S1</span>
          <div className="eyebrow">TEACHER ACCESS</div>
          <h1>此账号没有教师权限</h1>
          <p>教学工作区包含学生诊断、计划和反馈，只向指定教师账号开放。</p>
          <a href={chatGPTSignOutPath("/teacher/workspace")}>切换 ChatGPT 账号</a>
        </section>
      </main>
    );
  }

  return <TeachingWorkspace teacherName={user.displayName} signOutPath={chatGPTSignOutPath("/")} />;
}

export default function TeacherWorkspacePage() {
  return <WorkspaceGate />;
}
