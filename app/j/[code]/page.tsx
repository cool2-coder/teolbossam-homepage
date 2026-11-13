import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { sql, getSettings, type Kid } from "@/lib/db";
import { formatDate, nick, callName, kindOf, kindLabel } from "@/lib/brand";
import ReplyForm from "@/components/ReplyForm";
import Rsvp from "@/components/Rsvp";
import RichText from "@/components/RichText";
import { Avatar } from "@/components/ProfilePhoto";
import "./journal.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { robots: { index: false, follow: false } };

type Row = {
  id: string; number: number; class_date: Date; place: string; topic: string; mission: string; body: string; recap: string; kind: string;
  note: string; powers: string[]; reply_id: string | null; reply_body: string | null;
};

export default async function Journal({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const [kid] = await sql<Kid[]>`select * from kids where code = ${code} and active`;
  if (!kid) notFound();
  const settings = await getSettings();

  const weeks = await sql<Row[]>`
    select w.id, w.number, w.class_date, w.place, w.topic, w.mission, w.body, w.recap, w.kind, e.note, e.powers,
           r.id as reply_id, r.body as reply_body
    from weeks w
    join entries e on e.week_id = w.id and e.kid_id = ${kid.id} and e.attended
    left join replies r on r.week_id = w.id and r.kid_id = ${kid.id}
    where w.published_at is not null
    order by w.class_date desc, w.created_at desc`;

  const upcoming = await sql<{ id: string; class_date: Date; meet_time: string; place: string; topic: string; prep: string; body: string; kind: string; rsvp: string | null }[]>`
    select w.id, w.class_date, w.meet_time, w.place, w.topic, w.prep, w.body, w.kind, e.rsvp
    from weeks w join entries e on e.week_id = w.id and e.kid_id = ${kid.id}
    where w.published_at is null and w.class_date >= (now() at time zone 'Asia/Seoul')::date
    order by w.class_date`;

  const ids = weeks.map((w) => w.id);
  const replyIds = weeks.map((w) => w.reply_id).filter(Boolean) as string[];
  const photos = ids.length
    ? await sql<{ id: string; week_id: string }[]>`
        select p.id, p.week_id from photos p join photo_tags t on t.photo_id = p.id
        where t.kid_id = ${kid.id} and p.week_id in ${sql(ids)} order by p.created_at`
    : [];
  const replyPhotos = replyIds.length
    ? await sql<{ id: string; reply_id: string }[]>`select id, reply_id from photos where reply_id in ${sql(replyIds)}`
    : [];

  const n = nick(callName(kid));

  return (
    <main className="page journal">
      <header className="jhead">
        <small>털보쌤 숲체험 · {settings.season}</small>
        <div className="jtitle">
          <Avatar photoId={kid.photo_id} name={callName(kid)} size={64} />
          <h1>{n}의 숲 일지</h1>
        </div>
        {weeks.length > 0 && (
          <div className="streak">
            <div className="dots" aria-hidden="true">
              {weeks.map((w) => <i key={w.id} className="on" />)}
            </div>
            <span>지금까지 숲 기록 {weeks.length}개</span>
          </div>
        )}
      </header>

      <div className="pad">
        {upcoming.map((u) => (
          <section className="notice" key={u.id} data-kind={kindOf(u.kind)}>
            <span className="label"><span className="kchip">{kindLabel(u.kind)}</span> 다가오는 숲체험 · {formatDate(u.class_date)}</span>
            {u.body ? (
              <div className="bodytext">{u.body}</div>
            ) : (
              <>
                <h2 className="topic">{u.topic}</h2>
                <dl>
                  <dt>일시</dt><dd>{formatDate(u.class_date)}{u.meet_time ? ` ${u.meet_time}` : ""}</dd>
                  {u.place && <><dt>장소</dt><dd>{u.place}</dd></>}
                  {u.prep && <><dt>준비물</dt><dd>{u.prep}</dd></>}
                </dl>
              </>
            )}
            <Rsvp code={code} weekId={u.id} initial={u.rsvp} />
          </section>
        ))}

        {weeks.length === 0 && (
          <div className="card">
            <b>아직 올라온 기록이 없어요.</b>
            <span className="muted small">수업이 끝나면 털보쌤이 사진과 이야기를 이곳에 남겨 드려요.</span>
          </div>
        )}

        {weeks.map((w, i) => {
          const body = (
            <article className="entry" data-kind={kindOf(w.kind)}>
              <div className="meta">
                <span className="row"><b>{weeks.length - i}번째 숲</b><span className="kchip">{kindLabel(w.kind)}</span></span>
                <span>{formatDate(w.class_date)}{w.place ? ` · ${w.place}` : ""}</span>
              </div>
              <h2 className="topic">{w.topic}</h2>
              {photos.some((p) => p.week_id === w.id) && (
                <div className="photos">
                  {photos.filter((p) => p.week_id === w.id).map((p) => (
                    <div className="ph" key={p.id}>
                      <img src={`/p/${p.id}`} alt={`${weeks.length - i}번째 숲 사진`} loading="lazy" />
                      <a className="save" href={`/p/${p.id}?dl=1`}>원본 저장</a>
                    </div>
                  ))}
                </div>
              )}
              {w.note && (w.note.length < 200 ? (
                <div className="note"><span>털보쌤 한마디</span><p>{w.note}</p></div>
              ) : (
                <div className="longnote">
                  <span>털보쌤 관찰일지</span>
                  <RichText text={w.note} />
                </div>
              ))}
              {w.powers.length > 0 && (
                <div className="row"><span className="muted tiny">오늘 기른 힘</span>{w.powers.map((p) => <span className="chip" key={p}>{p}</span>)}</div>
              )}
              {w.recap && (
                <details className="bodybox">
                  <summary>이날 수업 이야기 전체 보기</summary>
                  <RichText text={w.recap} />
                </details>
              )}
              {w.body && (
                <details className="bodybox">
                  <summary>이날 수업 안내문 다시 보기</summary>
                  <div className="bodytext">{w.body}</div>
                </details>
              )}
              {w.mission && (
                <div className="mission">
                  <span>이번 주 집에서 해 보기</span>
                  <p>{w.mission}</p>
                </div>
              )}
              {w.reply_id ? (
                <div className="card reply">
                  <div className="between"><span className="tiny muted"><b>{kid.guardian_label}의 답장</b></span><span className="st ok">털보쌤에게 전달됨</span></div>
                  {w.reply_body && <p>{w.reply_body}</p>}
                  {replyPhotos.filter((p) => p.reply_id === w.reply_id).map((p) => (
                    <img key={p.id} src={`/p/${p.id}`} alt="답장 사진" className="replyimg" loading="lazy" />
                  ))}
                  <details>
                    <summary className="tiny muted">답장 고치기</summary>
                    <ReplyForm code={code} weekId={w.id} kidNick={n} initial={w.reply_body ?? ""} />
                  </details>
                </div>
              ) : (
                <ReplyForm code={code} weekId={w.id} kidNick={n} />
              )}
            </article>
          );
          return i === 0 ? (
            <div key={w.id}>{body}</div>
          ) : (
            <details key={w.id} className="past">
              <summary>
                <span data-kind={kindOf(w.kind)}><span className="kchip">{kindLabel(w.kind)}</span> {w.topic}</span>
                <span className={`st ${w.reply_id ? "ok" : "wait"}`}>{w.reply_id ? "답장 완료" : "답장 전"}</span>
              </summary>
              {body}
            </details>
          );
        })}
      </div>
    </main>
  );
}
