import { sql, getSettings } from "@/lib/db";
import AdminTop from "@/components/AdminTop";
import WeekFields from "@/components/WeekFields";
import { createWeek } from "../../actions";

export const dynamic = "force-dynamic";

export default async function NewWeek() {
  const s = await getSettings();
  const [{ n }] = await sql<{ n: number }[]>`select coalesce(max(number), 0)::int + 1 as n from weeks where season = ${s.season}`;
  return (
    <main className="page">
      <AdminTop title="새 수업 만들기" back="/admin" />
      <form action={createWeek} className="pad">
        <WeekFields nextNumber={n} />
        <p className="muted small">만들면 명단의 아이들이 모두 ‘출석’으로 들어가요. 빠진 아이는 다음 화면에서 바꿀 수 있어요.</p>
        <button className="btn">만들기</button>
      </form>
    </main>
  );
}
