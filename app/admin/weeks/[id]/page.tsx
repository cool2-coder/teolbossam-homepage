import Link from "next/link";
import { notFound } from "next/navigation";
import { sql, isUuid } from "@/lib/db";
import { weekStats } from "@/lib/queries";
import { formatDate, formatTime } from "@/lib/brand";
import AdminTop from "@/components/AdminTop";
import { publish, remindNow, publishOnly } from "../../actions";
import { smsConfigured } from "@/lib/sms";
import { publishText, remindText } from "@/lib/notify";
import SmsButton from "@/components/SmsButton";

export const dynamic = "force-dynamic";

type KidRow = {
  id: string; name: string; guardian_label: string; phone: string; code: string; reminded: boolean; attended: boolean; note: string; photos: number;
  reply_body: string | null; reply_at: Date | null; reply_photo: string | null; notified: boolean;
};

export default async function WeekPage({ params, searchParams }: {
  params: Promise<{ id: string }>; searchParams: Promise<{ sent?: string; reminded?: string }>;
}) {
  const { id } = await params;
  const q = await searchParams;
  if (!isUuid(id)) notFound();
  const [week] = await weekStats({ id });
  if (!week) notFound();

  const kids = await sql<KidRow[]>`
    select k.id, k.name, k.guardian_label, k.phone, k.code, e.attended, e.note,
      exists (select 1 from messages m where m.week_id = ${id} and m.kid_id = k.id and m.kind = 'remind'
              and m.status in ('sent','logged','manual')) as reminded,
      (select count(*)::int from photo_tags t join photos p on p.id = t.photo_id where t.kid_id = k.id and p.week_id = ${id}) as photos,
      r.body as reply_body, r.created_at as reply_at,
      (select p.id from photos p where p.reply_id = r.id limit 1) as reply_photo,
      exists (select 1 from messages m where m.week_id = ${id} and m.kid_id = k.id and m.kind = 'publish'
              and m.status in ('sent','logged','manual')) as notified
    from entries e join kids k on k.id = e.kid_id
    left join replies r on r.week_id = e.week_id and r.kid_id = k.id
    where e.week_id = ${id} and k.active
    order by e.attended desc, k.name`;
  const [{ total, untagged }] = await sql<{ total: number; untagged: number }[]>`
    select count(*)::int as total,
      count(*) filter (where not exists (select 1 from photo_tags t where t.photo_id = p.id))::int as untagged
    from photos p where p.week_id = ${id}`;

  const toSend = kids.filter((k) => k.attended && !k.notified).length;
  const waiting = kids.filter((k) => k.attended && !k.reply_at).length;
  const replies = kids.filter((k) => k.reply_at).sort((a, b) => +b.reply_at! - +a.reply_at!);

  return (
    <main className="page">
      <AdminTop title={`${week.number}주차 · ${week.topic}`} back="/admin" />
      <div className="pad">
        {q.sent && <div className="flash">{q.sent}가족에게 일지 문자를 보냈어요.</div>}
        {q.reminded && <div className="flash">{q.reminded}가족에게 재알림을 보냈어요.</div>}

        <div className="card">
          <div className="between">
            <span className="muted small">{formatDate(week.class_date)}{week.place ? ` · ${week.place}` : ""}</span>
            <Link className="small" href={`/admin/weeks/${id}/edit`}>고치기</Link>
          </div>
          <h2 style={{ fontSize: 20 }}>{week.topic}</h2>
          {week.mission && <p className="small" style={{ margin: 0, whiteSpace: "pre-line" }}>집 미션: {week.mission}</p>}
          {week.published_at && (
            <>
              <div className="between small tnum"><span>{week.attended}가족 중</span><span><b>{week.replied}</b>가족 답장</span></div>
              <div className="bar"><i style={{ width: `${week.attended ? (week.replied / week.attended) * 100 : 0}%` }} /></div>
            </>
          )}
        </div>

        <p className="sec">1. 사진 나누기</p>
        <Link className="btn ghost" href={`/admin/weeks/${id}/photos`}>
          수업 사진 올리고 아이별로 나누기 {total > 0 && `(${total}장${untagged ? `, 이름 없음 ${untagged}` : ""})`}
        </Link>

        <p className="sec">2. 아이별 기록</p>
        <ul className="list">
          {kids.map((k) => (
            <li key={k.id}>
              <Link className="item" href={`/admin/weeks/${id}/k/${k.id}`}>
                <span><b>{k.name}</b>{" "}
                  <span className="muted small">
                    {k.attended ? `사진 ${k.photos} · 한마디 ${k.note ? "✓" : "–"}` : "결석"}
                  </span>
                </span>
                {k.attended && week.published_at
                  ? <span className={`st ${k.reply_at ? "ok" : "wait"}`}>{k.reply_at ? "답장 완료" : "기다리는 중"}</span>
                  : <span className={`st ${k.attended ? "off" : "off"}`}>{k.attended ? "›" : "결석"}</span>}
              </Link>
            </li>
          ))}
        </ul>

        <p className="sec">3. 학부모님께 보내기</p>
        {smsConfigured() ? (
          <>
            {toSend > 0 ? (
              <form action={publish.bind(null, id)}>
                <button className="btn">{week.published_at ? `아직 못 받은 ${toSend}가족에게 보내기` : `발행하고 ${toSend}가족에게 문자 보내기`}</button>
              </form>
            ) : (
              <div className="card small">출석한 가족 모두에게 일지 문자를 보냈어요.</div>
            )}
            {week.published_at && waiting > 0 && (
              <form action={remindNow.bind(null, id)}>
                <button className="btn warn">답장 안 한 {waiting}가족에게 지금 재알림</button>
              </form>
            )}
          </>
        ) : !week.published_at ? (
          <form action={publishOnly.bind(null, id)} className="stack">
            <button className="btn">발행하기 (학부모님 일지에 공개)</button>
            <p className="muted tiny" style={{ margin: 0 }}>발행하면 아이별 [문자 보내기] 버튼이 생겨요. 누르면 폰 문자 앱에 번호와 내용이 채워져 열려요.</p>
          </form>
        ) : (
          <>
            <div className="card small">
              <b>문자 보내기 {kids.filter((k) => k.attended && k.notified).length}/{week.attended}</b>
              <span className="muted tiny">버튼을 누르면 문자 앱이 열려요. 전송을 누르고 이 화면으로 돌아와 다음 아이를 눌러 주세요.</span>
            </div>
            <ul className="list">
              {kids.filter((k) => k.attended).map((k) => (
                <li key={k.id} className="item">
                  <span><b>{k.name}</b> <span className="muted small">{k.guardian_label}</span></span>
                  <SmsButton weekId={id} kidId={k.id} kind="publish" phone={k.phone} sent={k.notified}
                    text={publishText(k, week)} label="문자 보내기" />
                </li>
              ))}
            </ul>
            {waiting > 0 && (
              <details className="card">
                <summary><b className="small">답장 안 한 {waiting}가족에게 재알림 보내기</b></summary>
                <ul className="list">
                  {kids.filter((k) => k.attended && !k.reply_at).map((k) => (
                    <li key={k.id} className="item">
                      <span><b>{k.name}</b> <span className="muted small">{k.guardian_label}</span></span>
                      <SmsButton weekId={id} kidId={k.id} kind="remind" phone={k.phone} sent={k.reminded}
                        text={remindText(k, week)} label="재알림" />
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </>
        )}
        {week.reminded_at && <p className="muted tiny">마지막 재알림: {formatTime(week.reminded_at)}</p>}

        {replies.length > 0 && (
          <>
            <p className="sec">학부모님 답장</p>
            {replies.map((k) => (
              <div className="card" key={k.id}>
                <div className="between"><b className="small">{k.name} {k.guardian_label}</b><span className="muted tiny">{formatTime(k.reply_at!)}</span></div>
                {k.reply_body && <p className="small" style={{ margin: 0, whiteSpace: "pre-line" }}>{k.reply_body}</p>}
                {k.reply_photo && <img src={`/p/${k.reply_photo}`} alt="답장 사진" style={{ borderRadius: 10, maxHeight: 220, width: "auto" }} />}
              </div>
            ))}
          </>
        )}
      </div>
    </main>
  );
}
