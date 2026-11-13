import { sql } from "@/lib/db";
import { formatTime } from "@/lib/brand";
import AdminTop from "@/components/AdminTop";
import { deleteMessage, deleteAllMessages } from "../actions";

export const dynamic = "force-dynamic";

const KIND: Record<string, string> = { notice: "수업 안내", publish: "일지 알림", remind: "재알림", teacher: "답장 알림" };
const STATUS: Record<string, [string, string]> = {
  sent: ["보냄", "ok"], manual: ["폰으로 보냄", "ok"], logged: ["기록만 (문자 미연결)", "off"], failed: ["실패", "wait"],
};

export default async function Messages({ searchParams }: { searchParams: Promise<{ cleared?: string }> }) {
  const { cleared } = await searchParams;
  const rows = await sql<{ id: number; kind: string; to_phone: string; body: string; status: string; error: string | null; created_at: Date; name: string | null }[]>`
    select m.*, k.name from messages m left join kids k on k.id = m.kid_id order by m.created_at desc limit 200`;
  return (
    <main className="page">
      <AdminTop title="문자 기록" back="/admin" />
      <div className="pad">
        {cleared && <div className="flash">문자 기록을 모두 지웠어요.</div>}
        {rows.length === 0 && <p className="muted">문자 기록이 없어요.</p>}
        {rows.length > 0 && (
          <p className="muted tiny" style={{ margin: 0 }}>
            기록을 지우면 수업 화면에서 그 가족이 다시 ‘안 보냄’으로 보여요. 실제로 보낸 문자는 지워지지 않아요.
          </p>
        )}
        {rows.map((m) => (
          <div className="card" key={m.id}>
            <div className="between small">
              <b>{m.name ?? "털보쌤"} · {KIND[m.kind] ?? m.kind}</b>
              <span className={`st ${STATUS[m.status]?.[1] ?? "off"}`}>{STATUS[m.status]?.[0] ?? m.status}</span>
            </div>
            <p className="small" style={{ margin: 0, whiteSpace: "pre-line" }}>{m.body}</p>
            <div className="between">
              <span className="muted tiny tnum">{formatTime(m.created_at)} · {m.to_phone}{m.error ? ` · ${m.error}` : ""}</span>
              <form action={deleteMessage.bind(null, m.id)}><button className="btn ghost small">지우기</button></form>
            </div>
          </div>
        ))}
        {rows.length > 0 && (
          <details className="danger-zone">
            <summary>문자 기록 모두 지우기</summary>
            <form action={deleteAllMessages} className="stack">
              <p className="small" style={{ margin: 0 }}>문자 기록 {rows.length}개를 모두 지워요. 되돌릴 수 없어요.</p>
              <button className="btn danger">정말 모두 지우기</button>
            </form>
          </details>
        )}
      </div>
    </main>
  );
}
