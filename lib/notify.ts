import { sql, type Kid, type Week } from "./db";
import { sendSms } from "./sms";
import { siteUrl, formatDate, nick, callName } from "./brand";


type KidLike = Pick<Kid, "name" | "guardian_label" | "code"> & { call_name?: string | null };
type WeekLike = Pick<Week, "topic">;
type NoticeWeek = Pick<Week, "topic" | "class_date" | "meet_time" | "place" | "prep" | "body">;

export function publishText(k: KidLike, w: WeekLike) {
  return (
    `[털보쌤 숲체험] ${nick(callName(k))}의 오늘 숲 일지가 올라왔어요 🌳\n` +
    `‘${w.topic}’ 시간에 찍은 사진과 털보쌤 이야기를 보러 와 주세요.\n` +
    `집에서 아이에게 한마디 들으시면 답장도 남겨 주세요 ^^\n${siteUrl()}/j/${k.code}`
  );
}

export function noticeText(k: KidLike, w: NoticeWeek) {
  const link = `${siteUrl()}/j/${k.code}`;
  if (w.body.trim()) return `${w.body.trim()}\n\n▶ ${nick(callName(k))} 참석 여부를 눌러 주세요\n${link}`;
  const lines = [
    `[털보쌤 숲체험] ${callName(k)} ${k.guardian_label}, 이번 숲체험 안내드려요.`,
    `일시: ${formatDate(w.class_date)}${w.meet_time ? ` ${w.meet_time}` : ""}`,
    w.place && `장소: ${w.place}`,
    `주제: ${w.topic}`,
    w.prep && `준비물: ${w.prep}`,
    `참석 여부를 눌러 주세요.`,
    link,
  ];
  return lines.filter(Boolean).join("\n");
}

export function remindText(k: KidLike, w: WeekLike) {
  return (
    `[털보쌤 숲체험] ${nick(callName(k))}는 ‘${w.topic}’ 이야기를 집에서도 했을까요? 🙂\n` +
    `편하실 때 숲 일지에 한마디 남겨 주시면 털보쌤이 반갑게 읽을게요.\n${siteUrl()}/j/${k.code}`
  );
}

/** Sends the "journal is up" text to every attending kid who hasn't been told yet for this week. */
export async function publishWeek(weekId: string) {
  const [week] = await sql<Week[]>`select * from weeks where id = ${weekId}`;
  if (!week) return 0;
  const kids = await sql<Kid[]>`
    select k.* from kids k join entries e on e.kid_id = k.id and e.week_id = ${weekId}
    where k.active and e.attended
      and not exists (select 1 from messages m where m.week_id = ${weekId} and m.kid_id = k.id
                      and m.kind = 'publish' and m.status in ('sent','manual'))`;
  for (const k of kids) {
    await sendSms({ to: k.phone, text: publishText(k, week), kind: "publish", kidId: k.id, weekId });
  }
  await sql`update weeks set published_at = coalesce(published_at, now()) where id = ${weekId}`;
  return kids.length;
}

/** Reminds families that were sent the journal but haven't replied yet. */
export async function remindWeek(weekId: string) {
  const [week] = await sql<Week[]>`select * from weeks where id = ${weekId}`;
  if (!week?.published_at) return 0;
  const kids = await sql<Kid[]>`
    select k.* from kids k join entries e on e.kid_id = k.id and e.week_id = ${weekId}
    where k.active and e.attended
      and not exists (select 1 from replies r where r.week_id = ${weekId} and r.kid_id = k.id)`;
  for (const k of kids) {
    await sendSms({ to: k.phone, text: remindText(k, week), kind: "remind", kidId: k.id, weekId });
  }
  await sql`update weeks set reminded_at = now() where id = ${weekId}`;
  return kids.length;
}

/** Sends the pre-class notice (with RSVP link) to every active kid who hasn't received it yet. */
export async function noticeWeek(weekId: string) {
  const [week] = await sql<Week[]>`select * from weeks where id = ${weekId}`;
  if (!week) return 0;
  const kids = await sql<Kid[]>`
    select k.* from kids k join entries e on e.kid_id = k.id and e.week_id = ${weekId}
    where k.active and not exists (select 1 from messages m where m.week_id = ${weekId} and m.kid_id = k.id
                      and m.kind = 'notice' and m.status in ('sent','manual'))`;
  for (const k of kids) {
    await sendSms({ to: k.phone, text: noticeText(k, week), kind: "notice", kidId: k.id, weekId });
  }
  return kids.length;
}

export async function notifyTeacher(kid: Kid, week: Week) {
  const to = process.env.TEACHER_PHONE;
  if (!to) return;
  await sendSms({
    to,
    text: `[숲 일지] ${kid.name} ${kid.guardian_label}이 숲 일지에 답장을 남겼어요.\n${siteUrl()}/admin/weeks/${week.id}`,
    kind: "teacher",
    kidId: kid.id,
    weekId: week.id,
  });
}
