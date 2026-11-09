import type { Week } from "@/lib/db";
import { kstDateString } from "@/lib/brand";

export default function WeekFields({ week }: { week?: Week }) {
  return (
    <>
      <div className="field">
        <label className="l" htmlFor="topic">주제 (목록과 문자 제목에 쓰여요)</label>
        <input id="topic" name="topic" type="text" defaultValue={week?.topic} required placeholder="사마귀 알집 찾기 탐험대" />
      </div>
      <div className="field">
        <label className="l" htmlFor="class_date">수업 날짜</label>
        <input id="class_date" name="class_date" type="date" defaultValue={kstDateString(week?.class_date)} required />
        <span className="muted tiny" style={{ marginTop: 4 }}>학부모님 일지에 ‘다가오는 숲체험’으로 보여 줄 날을 정할 때 써요.</span>
      </div>
      <div className="field">
        <label className="l" htmlFor="body">수업 안내 (쓰신 글을 그대로 붙여 넣으세요)</label>
        <textarea id="body" name="body" defaultValue={week?.body} style={{ minHeight: 320 }}
          placeholder={"[토요일 아침숲 안내]\n\n가을이 깊어지면 숲속 곤충들도 추운 겨울을 준비해요. 🍂\n\n🧔🏻‍♂️ 일시\n…"} />
      </div>
    </>
  );
}
