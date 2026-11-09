import Link from "next/link";
import { notFound } from "next/navigation";
import { sql, isUuid } from "@/lib/db";
import { weekStats } from "@/lib/queries";
import { formatDate, formatTime } from "@/lib/brand";
import AdminTop from "@/components/AdminTop";
import { publish, remindNow, publishOnly, sendNotice, deleteWeek, saveRecap } from "../../actions";
import { smsConfigured } from "@/lib/sms";
import { publishText, remindText, noticeText } from "@/lib/notify";
import SmsButton from "@/components/SmsButton";

export const dynamic = "force-dynamic";

type KidRow = {
  id: string; name: string; guardian_label: string; phone: string; code: string; reminded: boolean; noticed: boolean; rsvp: string | null; attended: boolean; note: string; photos: number;
  reply_body: string | null; reply_at: Date | null; reply_photo: string | null; notified: boolean;
};

export default async function WeekPage({ params, searchParams }: {
  params: Promise<{ id: string }>; searchParams: Promise<{ sent?: string; reminded?: string; noticed?: string; recap?: string }>;
}) {
  const { id } = await params;
  const q = await searchParams;
  if (!isUuid(id)) notFound();
  const [week] = await weekStats({ id });
  if (!week) notFound();

  const kids = await sql<KidRow[]>`
    select k.id, k.name, k.guardian_label, k.phone, k.code, e.attended, e.note, e.rsvp,
      exists (select 1 from messages m where m.week_id = ${id} and m.kid_id = k.id and m.kind = 'notice'
              and m.status in ('sent','manual')) as noticed,
      exists (select 1 from messages m where m.week_id = ${id} and m.kid_id = k.id and m.kind = 'remind'
              and m.status in ('sent','manual')) as reminded,
      (select count(*)::int from photo_tags t join photos p on p.id = t.photo_id where t.kid_id = k.id and p.week_id = ${id}) as photos,
      r.body as reply_body, r.created_at as reply_at,
      (select p.id from photos p where p.reply_id = r.id limit 1) as reply_photo,
      exists (select 1 from messages m where m.week_id = ${id} and m.kid_id = k.id and m.kind = 'publish'
              and m.status in ('sent','manual')) as notified
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
  let step = 0;
  const sec = (t: string) => `${++step}. ${t}`;
  const replies = kids.filter((k) => k.reply_at).sort((a, b) => +b.reply_at! - +a.reply_at!);

  return (
    <main className="page">
      <AdminTop title={`${formatDate(week.class_date)} · ${week.topic}`} back="/admin" />
      <div className="pad">
        {q.sent && <div className="flash">{q.sent}가족에게 일지 문자를 보냈어요.</div>}
        {q.recap && <div className="flash">수업 기록을 저장했어요.</div>}
        {q.noticed && <div className="flash">{q.noticed}가족에게 수업 안내 문자를 보냈어요.</div>}
        {q.reminded && <div className="flash">{q.reminded}가족에게 재알림을 보냈어요.</div>}

        <div className="card">
          <div className="between">
            <span className="muted small">{formatDate(week.class_date)}{week.place ? ` · ${week.place}` : ""}</span>
            <Link className="small" href={`/admin/weeks/${id}/edit`}>고치기</Link>
          </div>
          <h2 style={{ fontSize: 20 }}>{week.topic}</h2>
          {week.body && (
            <details>
              <summary className="small" style={{ cursor: "pointer" }}>수업 안내문 보기</summary>
              <p className="small" style={{ margin: "8px 0 0", whiteSpace: "pre-line" }}>{week.body}</p>
            </details>
          )}
          {(week.meet_time || week.prep) && <p className="small" style={{ margin: 0 }}>{[week.meet_time, week.prep && `준비물: ${week.prep}`].filter(Boolean).join(" · ")}</p>}
          {week.mission && <p className="small" style={{ margin: 0, whiteSpace: "pre-line" }}>집 미션: {week.mission}</p>}
          {week.published_at && (
            <>
              <div className="between small tnum"><span>{week.attended}가족 중</span><span><b>{week.replied}</b>가족 답장</span></div>
              <div className="bar"><i style={{ width: `${week.attended ? (week.replied / week.attended) * 100 : 0}%` }} /></div>
            </>
          )}
        </div>

        {!week.published_at && (
          <>
            <p className="sec">{sec("수업 전 안내 · 참석 확인")}</p>
            <div className="card small">
              <div className="row tnum">
                <span className="st ok">참석 {kids.filter((k) => k.rsvp === "yes").length}</span>
                <span className="st off">불참 {kids.filter((k) => k.rsvp === "no").length}</span>
                <span className="st wait">응답 전 {kids.filter((k) => !k.rsvp).length}</span>
              </div>
              <span className="muted tiny">안내 문자 속 링크에서 엄마가 참석/불참을 누르면 여기와 출석 명단에 바로 반영돼요.</span>
            </div>
            {smsConfigured() ? (
              kids.some((k) => !k.noticed) && (
                <form action={sendNotice.bind(null, id)}>
                  <button className="btn ghost">아직 안내 못 받은 {kids.filter((k) => !k.noticed).length}가족에게 안내 문자 보내기</button>
                </form>
              )
            ) : null}
            <ul className="list">
              {kids.map((k) => (
                <li key={k.id} className="item">
                  <span><b>{k.name}</b>{" "}
                    <span className={`st ${k.rsvp === "yes" ? "ok" : k.rsvp === "no" ? "off" : "wait"}`}>
                      {k.rsvp === "yes" ? "참석" : k.rsvp === "no" ? "불참" : "응답 전"}
                    </span>
                  </span>
                  {!smsConfigured() && (
                    <SmsButton weekId={id} kidId={k.id} kind="notice" phone={k.phone} sent={k.noticed}
                      text={noticeText(k, week)} label="안내 보내기" />
                  )}
                </li>
              ))}
            </ul>
          </>
        )}

        <p className="sec">{sec("사진 나누기")}</p>
        <Link className="btn ghost" href={`/admin/weeks/${id}/photos`}>
          수업 사진 올리고 아이별로 나누기 {total > 0 && `(${total}장${untagged ? `, 이름 없음 ${untagged}` : ""})`}
        </Link>

        <p className="sec">{sec("오늘 수업 기록 (모든 아이 일지에 함께 보여요)")}</p>
        <form action={saveRecap.bind(null, id)} className="stack">
          <textarea id="recap" name="recap" defaultValue={week.recap} style={{ minHeight: 220 }}
            placeholder={"오늘의 숲체험, 활동 흐름, 만난 자연 친구들, 가정 연계 활동 등\n쓰신 글을 그대로 붙여 넣으세요."} />
          <button className="btn ghost">수업 기록 저장</button>
        </form>

        <p className="sec">{sec("아이별 관찰일지")}</p>
        <ul className="list">
          {kids.map((k) => (
            <li key={k.id}>
              <Link className="item" href={`/admin/weeks/${id}/k/${k.id}`}>
                <span><b>{k.name}</b>{" "}
                  <span className="muted small">
                    {k.attended ? `사진 ${k.photos} · 관찰일지 ${k.note ? `✓ ${k.note.length.toLocaleString()}자` : "–"}` : "결석"}
                  </span>
                </span>
                {k.attended && week.published_at
                  ? <span className={`st ${k.reply_at ? "ok" : "wait"}`}>{k.reply_at ? "답장 완료" : "기다리는 중"}</span>
                  : <span className={`st ${k.attended ? "off" : "off"}`}>{k.attended ? "›" : "결석"}</span>}
              </Link>
            </li>
          ))}
        </ul>

        <p className="sec">{sec("일지 보내기")}</p>
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
        <details className="danger-zone">
          <summary>이 수업 지우기</summary>
          <form action={deleteWeek.bind(null, id)} className="stack">
            <p className="small" style={{ margin: 0 }}>
              잘못 만든 수업이면 지워 주세요. 이 수업의 사진, 기록, 답장, 참석 응답이 모두 지워지고 되돌릴 수 없어요.
            </p>
            <button className="btn danger">정말 지우기</button>
          </form>
        </details>
      </div>
    </main>
  );
}
