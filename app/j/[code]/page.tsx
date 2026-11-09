import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { sql, getSettings, type Kid } from "@/lib/db";
import { formatDate, nick } from "@/lib/brand";
import ReplyForm from "@/components/ReplyForm";
import "./journal.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { robots: { index: false, follow: false } };

type Row = {
  id: string; number: number; class_date: Date; place: string; topic: string; mission: string;
  note: string; powers: string[]; reply_id: string | null; reply_body: string | null;
};

export default async function Journal({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const [kid] = await sql<Kid[]>`select * from kids where code = ${code} and active`;
  if (!kid) notFound();
  const settings = await getSettings();

  const weeks = await sql<Row[]>`
    select w.id, w.number, w.class_date, w.place, w.topic, w.mission, e.note, e.powers,
           r.id as reply_id, r.body as reply_body
    from weeks w
    join entries e on e.week_id = w.id and e.kid_id = ${kid.id} and e.attended
    left join replies r on r.week_id = w.id and r.kid_id = ${kid.id}
    where w.published_at is not null and w.season = ${settings.season}
    order by w.class_date desc, w.number desc`;

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

  const n = nick(kid.name);
  const total = Math.max(settings.seasonWeeks, weeks.length);

  return (
    <main className="page journal">
      <header className="jhead">
        <small>털보쌤 숲체험 · {settings.season}</small>
        <h1>{n}의 숲 일지</h1>
        <div className="streak">
          <div className="dots" aria-hidden="true">
            {Array.from({ length: total }, (_, i) => <i key={i} className={i < weeks.length ? "on" : ""} />)}
          </div>
          <span>{total}번 중 {weeks.length}번째 기록</span>
        </div>
      </header>

      <div className="pad">
        {weeks.length === 0 && (
          <div className="card">
            <b>아직 올라온 기록이 없어요.</b>
            <span className="muted small">수업이 끝나면 털보쌤이 사진과 이야기를 이곳에 남겨 드려요.</span>
          </div>
        )}

        {weeks.map((w, i) => {
          const body = (
            <article className="entry">
              <div className="meta">
                <b>{w.number}주차</b>
                <span>{formatDate(w.class_date)}{w.place ? ` · ${w.place}` : ""}</span>
              </div>
              <h2 className="topic">{w.topic}</h2>
              {photos.some((p) => p.week_id === w.id) && (
                <div className="photos">
                  {photos.filter((p) => p.week_id === w.id).map((p) => (
                    <div className="ph" key={p.id}>
                      <img src={`/p/${p.id}`} alt={`${w.number}주차 수업 사진`} loading="lazy" />
                      <a className="save" href={`/p/${p.id}?dl=1`}>원본 저장</a>
                    </div>
                  ))}
                </div>
              )}
              {w.note && (
                <div className="note"><span>털보쌤 한마디</span><p>{w.note}</p></div>
              )}
              {w.powers.length > 0 && (
                <div className="row"><span className="muted tiny">오늘 기른 힘</span>{w.powers.map((p) => <span className="chip" key={p}>{p}</span>)}</div>
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
                <span>{w.number}주차 · {w.topic}</span>
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
