// 예시 데이터: 아이 12명과 1주차 수업. 실제 운영 DB에서는 실행하지 마세요.
import "./env.mjs";
import crypto from "node:crypto";
import postgres from "postgres";

const url = process.env.DATABASE_URL;
const local = /localhost|127\.0\.0\.1/.test(url);
const sql = postgres(url, { ssl: local ? false : "require", prepare: false });
const names = ["민준", "서윤", "하준", "지우", "도윤", "서아", "시우", "하윤", "은우", "지아", "이안", "수아"];
const code = () => crypto.randomBytes(6).toString("base64url");
for (const [i, n] of names.entries()) {
  await sql`insert into kids (name, phone, code) values (${n}, ${"0100000" + String(1000 + i)}, ${code()})`;
}
const [w] = await sql`insert into weeks (season, number, class_date, place, topic, mission)
  values ('시즌2', 1, current_date, '동네 뒷산', '도토리는 어디로 굴러갈까?',
  '산책길에서 열매나 씨앗을 하나 주워 와서, 어디에서 찾았는지 그림으로 그려 보세요.') returning id`;
await sql`insert into entries (week_id, kid_id) select ${w.id}, id from kids`;
console.log("예시 데이터 추가 완료");
await sql.end();
