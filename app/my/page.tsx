import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { sql } from "@/lib/db";
import { nick } from "@/lib/brand";
import { FAMILY_COOKIE, parseFamily } from "@/lib/family";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "우리 아이 숲 일지 · 털보쌤 숲체험", robots: { index: false, follow: false } };

/** The one shared link sent to every family. Opens the child(ren) this phone remembers, and nothing else. */
export default async function My() {
  const codes = parseFamily((await cookies()).get(FAMILY_COOKIE)?.value);
  const kids = codes.length
    ? await sql<{ name: string; code: string }[]>`select name, code from kids where active and code in ${sql(codes)} order by name`
    : [];
  if (kids.length === 1) redirect(`/j/${kids[0].code}`);

  return (
    <main className="page">
      <div className="pad" style={{ marginTop: "10vh" }}>
        <span className="muted small">털보쌤 숲체험</span>
        {kids.length > 1 ? (
          <>
            <h1 style={{ fontSize: 24 }}>어느 아이 일지를 볼까요?</h1>
            <ul className="list">
              {kids.map((k) => (
                <li key={k.code}><Link className="item" href={`/j/${k.code}`}><b>{nick(k.name)}의 숲 일지</b><span className="muted">›</span></Link></li>
              ))}
            </ul>
          </>
        ) : (
          <>
            <h1 style={{ fontSize: 24 }}>처음 한 번만 확인할게요</h1>
            <p style={{ margin: 0 }}>
              카톡 대화방에서 털보쌤이 처음 보내 드린 <b>‘우리 아이 숲 일지’ 링크</b>를 한 번 눌러 주세요.
              그다음부터는 이 링크로 바로 열려요.
            </p>
            <p className="muted small" style={{ margin: 0 }}>
              링크를 찾기 어려우시면 털보쌤에게 말씀해 주세요. 다시 보내 드릴게요.
            </p>
          </>
        )}
      </div>
    </main>
  );
}
