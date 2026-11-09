import type { Week } from "@/lib/db";
import { kstDateString } from "@/lib/brand";

export default function WeekFields({ week, nextNumber = 1 }: { week?: Week; nextNumber?: number }) {
  return (
    <>
      <div className="row" style={{ flexWrap: "nowrap" }}>
        <div className="field" style={{ width: 90 }}>
          <label className="l" htmlFor="number">주차</label>
          <input id="number" name="number" type="number" min={1} defaultValue={week?.number ?? nextNumber} required />
        </div>
        <div className="field" style={{ flex: 1 }}>
          <label className="l" htmlFor="class_date">수업 날짜</label>
          <input id="class_date" name="class_date" type="date" defaultValue={kstDateString(week?.class_date)} required />
        </div>
      </div>
      <div className="row" style={{ flexWrap: "nowrap" }}>
        <div className="field" style={{ width: 130 }}>
          <label className="l" htmlFor="meet_time">모이는 시간</label>
          <input id="meet_time" name="meet_time" type="text" defaultValue={week?.meet_time} placeholder="오전 10시" />
        </div>
        <div className="field" style={{ flex: 1 }}>
          <label className="l" htmlFor="place">장소</label>
          <input id="place" name="place" type="text" defaultValue={week?.place} placeholder="동네 뒷산 입구" />
        </div>
      </div>
      <div className="field">
        <label className="l" htmlFor="topic">오늘의 주제</label>
        <input id="topic" name="topic" type="text" defaultValue={week?.topic} required placeholder="도토리는 어디로 굴러갈까?" />
      </div>
      <div className="field">
        <label className="l" htmlFor="prep">준비물 (수업 전 안내에 들어가요)</label>
        <input id="prep" name="prep" type="text" defaultValue={week?.prep} placeholder="물통, 긴바지, 장갑" />
      </div>
      <div className="field">
        <label className="l" htmlFor="mission">수업 후 집에서 해 보기 (일지에 들어가요)</label>
        <textarea id="mission" name="mission" defaultValue={week?.mission}
          placeholder="산책길에서 열매나 씨앗을 하나 주워 와서, 어디에서 찾았는지 그림으로 그려 보세요." />
      </div>
    </>
  );
}
