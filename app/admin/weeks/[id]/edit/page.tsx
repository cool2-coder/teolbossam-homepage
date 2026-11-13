import { notFound } from "next/navigation";
import { sql, isUuid, type Week } from "@/lib/db";
import { formatDate } from "@/lib/brand";
import AdminTop from "@/components/AdminTop";
import WeekFields from "@/components/WeekFields";
import { updateWeek, deleteWeek } from "../../../actions";

export const dynamic = "force-dynamic";

export default async function EditWeek({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isUuid(id)) notFound();
  const [week] = await sql<Week[]>`select * from weeks where id = ${id}`;
  if (!week) notFound();
  return (
    <main className="page">
      <AdminTop title={`${formatDate(week.class_date)} 수업 고치기`} back={`/admin/weeks/${id}`} />
      <div className="pad">
        <form action={updateWeek.bind(null, id)} className="stack">
          <WeekFields week={week} />
          <button className="btn">저장</button>
        </form>
        <details>
          <summary className="muted small">이 수업 지우기</summary>
          <form action={deleteWeek.bind(null, id)} style={{ marginTop: 10 }}>
            <p className="small">사진, 기록, 답장이 모두 지워지고 되돌릴 수 없어요.</p>
            <button className="btn danger">정말 지우기</button>
          </form>
        </details>
      </div>
    </main>
  );
}
