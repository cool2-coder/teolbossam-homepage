import Link from "next/link";
import { sql, getSettings } from "@/lib/db";
import { weekStats } from "@/lib/queries";
import { formatDate, WEEKDAYS, CLASS_KINDS, kindOf, type ClassKind } from "@/lib/brand";
import type { WeekStat } from "@/lib/queries";
import { smsConfigured } from "@/lib/sms";
import { logout } from "./actions";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const s = await getSettings();
  const weeks = await weekStats();
  const [{ n: kidCount }] = await sql<{ n: number }[]>`select count(*)::int as n from kids where active`;
  // For each class kind: the next class still to run, otherwise the most recent one.
  const pick = (k: ClassKind) => {
    const list = weeks.filter((w) => kindOf(w.kind) === k);
    const open = list.filter((w) => !w.published_at).sort((a, b) => +a.class_date - +b.class_date);
    return open[0] ?? list[0];
  };
  const current = (Object.keys(CLASS_KINDS) as ClassKind[]).map((k) => [k, pick(k)] as const);
  const shown = new Set(current.map(([, w]) => w?.id));

  return (
    <main className="page">
      <div className="pad">
        <div className="between">
          <div>
            <span className="muted tiny">털보쌤 숲체험 · {s.season}</span>
            <h1 style={{ fontSize: 24 }}>털보쌤 관리</h1>
            <span className="muted tiny">
              버전 {(process.env.COMMIT_REF ?? "local").slice(0, 7)} · 문자: {smsConfigured() ? "문자 서비스 연결됨" : "선생님 폰으로 보내기"}
            </span>
          </div>
          <form action={logout}><button className="btn ghost small">나가기</button></form>
        </div>

        <div className="kcards">
          {current.map(([k, w]) => (
            <KindCard key={k} kind={k} week={w} />
          ))}
        </div>

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
          <li><Link className="item" href="/admin/settings"><span>설정</span><span className="muted">›</span></Link></li>
        </ul>

        {weeks.some((w) => !shown.has(w.id)) && (
          <>
            <p className="sec">다른 수업</p>
            <ul className="list">
              {weeks.filter((w) => !shown.has(w.id)).map((w) => (
                <li key={w.id} data-kind={kindOf(w.kind)}>
                  <Link className="item" href={`/admin/weeks/${w.id}`}>
                    <span><span className="kchip">{CLASS_KINDS[kindOf(w.kind)].label}</span>{" "}
                      <span className="muted small tnum">{formatDate(w.class_date)}</span> · {w.topic}</span>
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

function KindCard({ kind, week }: { kind: ClassKind; week?: WeekStat }) {
  const meta = CLASS_KINDS[kind];
  return (
    <section className="kcard" data-kind={kind}>
      <div className="khead">
        <span>{meta.icon} {meta.label}</span>
        <Link href={`/admin/weeks/new?kind=${kind}`} style={{ color: "inherit", fontSize: 13 }}>+ 새 {meta.label}</Link>
      </div>
      {week ? (
        <Link href={`/admin/weeks/${week.id}`} className="kbody">
          <div className="between">
            <span className="muted small">{formatDate(week.class_date)}</span>
            <span className={`st ${week.published_at ? "ok" : "wait"}`}>{week.published_at ? "일지 발행됨" : "수업 전"}</span>
          </div>
          <h2 style={{ fontSize: 19 }}>{week.topic}</h2>
          {week.published_at ? (
            <>
              <div className="between small tnum"><span>{week.attended}가족 중</span><span><b>{week.replied}</b>가족 답장</span></div>
              <div className="bar"><i style={{ width: `${week.attended ? (week.replied / week.attended) * 100 : 0}%` }} /></div>
            </>
          ) : (
            <div className="row small tnum">
              <span className="st ok">참석 {week.rsvp_yes}</span>
              <span className="st off">불참 {week.rsvp_no}</span>
            </div>
          )}
        </Link>
      ) : null}
    </section>
  );
}
