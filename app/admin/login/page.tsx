import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE, adminToken } from "@/lib/auth";

async function login(form: FormData) {
  "use server";
  const pw = String(form.get("password") ?? "");
  if (!process.env.ADMIN_PASSWORD || pw !== process.env.ADMIN_PASSWORD) redirect("/admin/login?e=1");
  (await cookies()).set(ADMIN_COOKIE, await adminToken(), {
    httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 180,
  });
  redirect("/admin");
}

export default async function Login({ searchParams }: { searchParams: Promise<{ e?: string }> }) {
  const { e } = await searchParams;
  return (
    <main className="page">
      <form action={login} className="pad" style={{ marginTop: "18vh" }}>
        <h1>털보쌤 관리</h1>
        {!process.env.ADMIN_PASSWORD && <div className="err">ADMIN_PASSWORD 환경변수를 먼저 설정해 주세요.</div>}
        {e && <div className="err">비밀번호가 맞지 않아요.</div>}
        <div className="field">
          <label className="l" htmlFor="password">비밀번호</label>
          <input id="password" name="password" type="password" autoComplete="current-password" required />
        </div>
        <button className="btn">들어가기</button>
      </form>
    </main>
  );
}
