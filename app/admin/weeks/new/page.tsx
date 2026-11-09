import AdminTop from "@/components/AdminTop";
import WeekFields from "@/components/WeekFields";
import { createWeek } from "../../actions";

export const dynamic = "force-dynamic";

export default async function NewWeek({ searchParams }: { searchParams: Promise<{ kind?: string }> }) {
  const { kind } = await searchParams;
  return (
    <main className="page">
      <AdminTop title="새 수업 만들기" back="/admin" />
      <form action={createWeek} className="pad">
        <WeekFields kind={kind} />
        <p className="muted small">만들면 다음 화면에서 아이별로 수업 전 안내 문자를 보낼 수 있어요. 엄마들이 링크에서 참석/불참을 누르면 출석 명단이 자동으로 정리돼요.</p>
        <button className="btn">만들기</button>
      </form>
    </main>
  );
}
