import { sql, type Kid, type Week } from "./db";
import { sendSms } from "./sms";
import { siteUrl, formatDate, nick, callName } from "./brand";
import { getTemplates, fill, type Templates } from "./templates";


type KidLike = Pick<Kid, "name" | "guardian_label" | "code"> & { call_name?: string | null };
type WeekLike = Pick<Week, "topic" | "class_date">;
type NoticeWeek = WeekLike & Pick<Week, "body">;

function vars(k: KidLike, w: WeekLike): Record<string, string> {
  const n = callName(k);
  return { 이름: n, 아이: nick(n), 호칭: k.guardian_label, 주제: w.topic, 날짜: formatDate(w.class_date), 링크: `${siteUrl()}/j/${k.code}` };
}

export function publishText(k: KidLike, w: WeekLike, t: Templates) {
  return fill(t.publish, vars(k, w));
}

export function noticeText(k: KidLike, w: NoticeWeek, t: Templates) {
  if (w.body.trim()) return `${w.body.trim()}\n\n${fill(t.notice, vars(k, w))}`;
  return fill(t.notice_plain, vars(k, w));
}

export function remindText(k: KidLike, w: WeekLike, t: Templates) {
  return fill(t.remind, vars(k, w));
}

/** Sends the "journal is up" text to every attending kid who hasn't been told yet for this week. */
export async function publishWeek(weekId: string) {
  const [week] = await sql<Week[]>`select * from weeks where id = ${weekId}`;
  if (!week) return 0;
  const t = await getTemplates();
  const kids = await sql<Kid[]>`
    select k.* from kids k join entries e on e.kid_id = k.id and e.week_id = ${weekId}
    where k.active and e.attended
      and not exists (select 1 from messages m where m.week_id = ${weekId} and m.kid_id = k.id
                      and m.kind = 'publish' and m.status in ('sent','manual'))`;
  for (const k of kids) {
    await sendSms({ to: k.phone, text: publishText(k, week, t), kind: "publish", kidId: k.id, weekId });
  }
  await sql`update weeks set published_at = coalesce(published_at, now()) where id = ${weekId}`;
  return kids.length;
}

/** Reminds families that were sent the journal but haven't replied yet. */
export async function remindWeek(weekId: string) {
  const [week] = await sql<Week[]>`select * from weeks where id = ${weekId}`;
  if (!week?.published_at) return 0;
  const t = await getTemplates();
  const kids = await sql<Kid[]>`
    select k.* from kids k join entries e on e.kid_id = k.id and e.week_id = ${weekId}
    where k.active and e.attended
      and not exists (select 1 from replies r where r.week_id = ${weekId} and r.kid_id = k.id)`;
  for (const k of kids) {
    await sendSms({ to: k.phone, text: remindText(k, week, t), kind: "remind", kidId: k.id, weekId });
  }
  await sql`update weeks set reminded_at = now() where id = ${weekId}`;
  return kids.length;
}

/** Sends the pre-class notice (with RSVP link) to every active kid who hasn't received it yet. */
export async function noticeWeek(weekId: string) {
  const [week] = await sql<Week[]>`select * from weeks where id = ${weekId}`;
  if (!week) return 0;
  const t = await getTemplates();
  const kids = await sql<Kid[]>`
    select k.* from kids k join entries e on e.kid_id = k.id and e.week_id = ${weekId}
    where k.active and not exists (select 1 from messages m where m.week_id = ${weekId} and m.kid_id = k.id
                      and m.kind = 'notice' and m.status in ('sent','manual'))`;
  for (const k of kids) {
    await sendSms({ to: k.phone, text: noticeText(k, week, t), kind: "notice", kidId: k.id, weekId });
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
