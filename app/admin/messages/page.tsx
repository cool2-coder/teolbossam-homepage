import { sql } from "@/lib/db";
import { formatTime } from "@/lib/brand";
import { smsConfigured } from "@/lib/sms";
import AdminTop from "@/components/AdminTop";

export const dynamic = "force-dynamic";

const KIND: Record<string, string> = { publish: "일지 알림", remind: "재알림", teacher: "답장 알림" };
const STATUS: Record<string, [string, string]> = {
  sent: ["보냄", "ok"], logged: ["기록만 (문자 미연결)", "off"], failed: ["실패", "wait"],
};

export default async function Messages() {
  const rows = await sql<{ id: number; kind: string; to_phone: string; body: string; status: string; error: string | null; created_at: Date; name: string | null }[]>`
    select m.*, k.name from messages m left join kids k on k.id = m.kid_id order by m.created_at desc limit 200`;
  return (
    <main className="page">
      <AdminTop title="문자 기록" back="/admin" />
      <div className="pad">
        {!smsConfigured() && <div className="err small">문자 서비스가 연결되지 않아 실제로 보내지 않고 기록만 남겼어요.</div>}
        {rows.length === 0 && <p className="muted">아직 보낸 문자가 없어요.</p>}
        {rows.map((m) => (
          <div className="card" key={m.id}>
            <div className="between small">
              <b>{m.name ?? "털보쌤"} · {KIND[m.kind] ?? m.kind}</b>
              <span className={`st ${STATUS[m.status]?.[1] ?? "off"}`}>{STATUS[m.status]?.[0] ?? m.status}</span>
            </div>
            <p className="small" style={{ margin: 0, whiteSpace: "pre-line" }}>{m.body}</p>
            <span className="muted tiny tnum">{formatTime(m.created_at)} · {m.to_phone}{m.error ? ` · ${m.error}` : ""}</span>
          </div>
        ))}
      </div>
    </main>
  );
}
