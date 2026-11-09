import { getSettings } from "@/lib/db";
import { WEEKDAYS } from "@/lib/brand";
import AdminTop from "@/components/AdminTop";
import { saveSettings } from "../actions";

export const dynamic = "force-dynamic";

export default async function Settings({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const s = await getSettings();
  const { saved } = await searchParams;
  return (
    <main className="page">
      <AdminTop title="설정" back="/admin" />
      <form action={saveSettings} className="pad">
        {saved && <div className="flash">저장했어요.</div>}
        <p className="sec">미답장 자동 재알림</p>
        <div className="toggles">
          <label><input type="checkbox" name="remind_enabled" defaultChecked={s.remindEnabled} /> 자동 재알림 켜기</label>
        </div>
        <div className="field">
          <label className="l" htmlFor="remind_weekday">보내는 요일 (저녁 7시쯤)</label>
          <select id="remind_weekday" name="remind_weekday" defaultValue={s.remindWeekday}>
            {WEEKDAYS.map((d, i) => <option key={d} value={i}>{d}요일</option>)}
          </select>
        </div>
        <p className="muted small">발행한 지 2일 이상 지난 수업만, 답장 안 한 가족에게 한 번 보내요.</p>

        <p className="sec">시즌</p>
        <div className="field">
          <label className="l" htmlFor="season">시즌 이름</label>
          <input id="season" name="season" type="text" defaultValue={s.season} />
        </div>
        <p className="muted small">학부모님 일지 맨 위에 작게 보여요. 지난 기록은 시즌이 바뀌어도 계속 쌓여요.</p>
        <button className="btn">저장</button>
      </form>
    </main>
  );
}
