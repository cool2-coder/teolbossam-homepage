import Link from "next/link";
import { sql, getSettings } from "@/lib/db";
import { weekStats } from "@/lib/queries";
import { formatDate, WEEKDAYS } from "@/lib/brand";
import { smsConfigured } from "@/lib/sms";
import { logout } from "./actions";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const s = await getSettings();
  const weeks = await weekStats({ season: s.season });
  const [{ n: kidCount }] = await sql<{ n: number }[]>`select count(*)::int as n from kids where active`;
  const cur = weeks[0];

  return (
    <main className="page">
      <div className="pad">
        <div className="between">
          <div>
            <span className="muted tiny">털보쌤 숲체험 · {s.season}</span>
            <h1 style={{ fontSize: 24 }}>털보쌤 관리</h1>
          </div>
          <form action={logout}><button className="btn ghost small">나가기</button></form>
        </div>

        {cur ? (
          <Link href={`/admin/weeks/${cur.id}`} className="card" style={{ textDecoration: "none", color: "inherit" }}>
            <div className="between">
              <span className="muted small">{cur.number}주차 · {formatDate(cur.class_date)}</span>
              <span className={`st ${cur.published_at ? "ok" : "wait"}`}>{cur.published_at ? "발행됨" : "발행 전"}</span>
            </div>
            <h2 style={{ fontSize: 20 }}>{cur.topic}</h2>
            <div className="between small tnum"><span>{cur.attended}가족 중</span><span><b>{cur.replied}</b>가족 답장</span></div>
            <div className="bar"><i style={{ width: `${cur.attended ? (cur.replied / cur.attended) * 100 : 0}%` }} /></div>
          </Link>
        ) : (
          <div className="card"><b>아직 수업이 없어요.</b><span className="muted small">아래에서 첫 수업을 만들어 주세요.</span></div>
        )}

        <Link className="btn" href="/admin/weeks/new">+ 새 수업 만들기</Link>

        <div className="card small">
          {smsConfigured() ? (
            <span>
              미답장 자동 재알림: <b>{s.remindEnabled ? `매주 ${WEEKDAYS[s.remindWeekday]}요일 저녁 7시쯤` : "꺼짐"}</b>
            </span>
          ) : (
            <span>
              문자는 <b>선생님 폰</b>으로 보내요. 수업 화면에서 발행한 뒤 아이별 [문자 보내기]를 눌러 주세요.
              답장 안 한 가족 재알림도 같은 화면에 있어요.
            </span>
          )}
        </div>

        <ul className="list">
          <li><Link className="item" href="/admin/kids"><span>아이 명단</span><span className="muted">{kidCount}명 ›</span></Link></li>
          <li><Link className="item" href="/admin/messages"><span>문자 기록</span><span className="muted">›</span></Link></li>
          <li><Link className="item" href="/admin/settings"><span>설정 (시즌, 재알림)</span><span className="muted">›</span></Link></li>
        </ul>

        {weeks.length > 1 && (
          <>
            <p className="sec">지난 수업</p>
            <ul className="list">
              {weeks.slice(1).map((w) => (
                <li key={w.id}>
                  <Link className="item" href={`/admin/weeks/${w.id}`}>
                    <span>{w.number}주차 · {w.topic}</span>
                    <span className="muted small tnum">답장 {w.replied}/{w.attended}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </main>
  );
}
