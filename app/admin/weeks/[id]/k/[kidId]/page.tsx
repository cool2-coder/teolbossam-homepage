import { notFound } from "next/navigation";
import { sql, isUuid, type Kid, type Week } from "@/lib/db";
import { POWERS, nick } from "@/lib/brand";
import AdminTop from "@/components/AdminTop";
import PhotoSorter from "@/components/PhotoSorter";
import { saveEntry } from "../../../../actions";

export const dynamic = "force-dynamic";

export default async function KidEntry({ params }: { params: Promise<{ id: string; kidId: string }> }) {
  const { id, kidId } = await params;
  if (!isUuid(id) || !isUuid(kidId)) notFound();
  const [week] = await sql<Week[]>`select * from weeks where id = ${id}`;
  const [kid] = await sql<Kid[]>`select * from kids where id = ${kidId}`;
  if (!week || !kid) notFound();
  const [entry] = await sql<{ attended: boolean; note: string; powers: string[] }[]>`
    select attended, note, powers from entries where week_id = ${id} and kid_id = ${kidId}`;
  const order = await sql<{ id: string }[]>`
    select k.id from entries e join kids k on k.id = e.kid_id where e.week_id = ${id} and k.active
    order by e.attended desc, k.name`;
  const idx = order.findIndex((o) => o.id === kidId);
  const next = idx >= 0 && idx + 1 < order.length ? order[idx + 1].id : null;
  const photos = await sql<{ id: string; tags: string[] }[]>`
    select p.id, array[${kidId}::text] as tags from photos p join photo_tags t on t.photo_id = p.id
    where p.week_id = ${id} and t.kid_id = ${kidId} order by p.created_at`;
  const [reply] = await sql<{ body: string }[]>`select body from replies where week_id = ${id} and kid_id = ${kidId}`;

  return (
    <main className="page">
      <AdminTop title={`${week.number}주차 · ${nick(kid.name)} 기록`} back={`/admin/weeks/${id}`} />
      <div className="pad">
        <form action={saveEntry.bind(null, id, kidId, next)} className="stack">
          <div className="toggles">
            <label><input type="checkbox" name="attended" defaultChecked={entry?.attended ?? true} /> 오늘 출석</label>
          </div>
          <div className="field">
            <label className="l" htmlFor="note">털보쌤 한마디</label>
            <textarea id="note" name="note" defaultValue={entry?.note}
              placeholder={`${nick(kid.name)}가 오늘 숲에서 한 말, 발견한 것`} />
          </div>
          <div className="field">
            <span className="l">오늘 기른 힘</span>
            <div className="toggles">
              {POWERS.map((p) => (
                <label key={p.name}>
                  <input type="checkbox" name="powers" value={p.name} defaultChecked={entry?.powers.includes(p.name)} /> {p.name}
                </label>
              ))}
            </div>
          </div>
          <button className="btn">{next ? "저장하고 다음 아이 ›" : "저장하고 끝내기"}</button>
        </form>

        <p className="sec">{nick(kid.name)} 사진 {photos.length}장</p>
        <PhotoSorter weekId={id} kids={[]} photos={photos} kidId={kidId} />

        {reply && (
          <div className="card">
            <b className="small">{kid.guardian_label}의 답장</b>
            <p className="small" style={{ margin: 0, whiteSpace: "pre-line" }}>{reply.body}</p>
          </div>
        )}
      </div>
    </main>
  );
}
