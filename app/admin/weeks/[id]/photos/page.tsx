import { notFound } from "next/navigation";
import { sql, isUuid, type Week } from "@/lib/db";
import { formatDate } from "@/lib/brand";
import AdminTop from "@/components/AdminTop";
import PhotoSorter from "@/components/PhotoSorter";

export const dynamic = "force-dynamic";

export default async function Photos({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isUuid(id)) notFound();
  const [week] = await sql<Week[]>`select * from weeks where id = ${id}`;
  if (!week) notFound();
  const kids = await sql<{ id: string; name: string }[]>`
    select k.id, k.name from kids k join entries e on e.kid_id = k.id and e.week_id = ${id}
    where k.active and e.attended order by k.name`;
  const photos = await sql<{ id: string; tags: string[] }[]>`
    select p.id, coalesce(array_agg(t.kid_id::text) filter (where t.kid_id is not null), '{}') as tags
    from photos p left join photo_tags t on t.photo_id = p.id
    where p.week_id = ${id} group by p.id order by min(p.created_at)`;
  return (
    <main className="page">
      <AdminTop title={`${formatDate(week.class_date)} 사진 나누기`} back={`/admin/weeks/${id}`} />
      <div className="pad">
        <p className="muted small">사진을 한꺼번에 올리고, 사진마다 나온 아이 이름을 눌러 주세요. 단체 사진은 여러 명을 누르면 돼요.</p>
        <PhotoSorter weekId={id} kids={kids} photos={photos} />
      </div>
    </main>
  );
}
