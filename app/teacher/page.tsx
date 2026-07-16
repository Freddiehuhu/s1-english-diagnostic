import { env } from "cloudflare:workers";
import { requireChatGPTUser, chatGPTSignOutPath } from "../chatgpt-auth";
import TeacherDashboard from "./teacher-dashboard";

export const dynamic = "force-dynamic";

async function TeacherGate() {
  const user = await requireChatGPTUser("/teacher");
  const expected = env.TEACHER_EMAIL?.trim().toLowerCase();
  const authorised = Boolean(expected && user.email.toLowerCase() === expected);

  if (!authorised) {
    return (
      <main className="access-page">
        <section className="access-card">
          <span className="brand-mark">S1</span>
          <div className="eyebrow">TEACHER ACCESS</div>
          <h1>此账号没有教师权限</h1>
          <p>学生测试仍可公开使用；教师提交记录只向指定账号开放。</p>
          <a href={chatGPTSignOutPath("/teacher")}>切换 ChatGPT 账号</a>
        </section>
      </main>
    );
  }

  return <TeacherDashboard teacherName={user.displayName} signOutPath={chatGPTSignOutPath("/")} />;
}

export default function TeacherPage() {
  return <TeacherGate />;
}
