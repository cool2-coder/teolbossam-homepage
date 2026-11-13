"use server";

import crypto from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { sql, getSettings, setSetting, isUuid, type Week } from "@/lib/db";
import { requireAdmin, ADMIN_COOKIE } from "@/lib/auth";
import { setProfile } from "@/lib/profile";
import { publishWeek, remindWeek, noticeWeek, publishText, remindText, noticeText } from "@/lib/notify";
import { POWERS, kindOf, isKind } from "@/lib/brand";

const str = (f: FormData, k: string, max = 2000) => String(f.get(k) ?? "").trim().slice(0, max);
const birthYear = (f: FormData) => {
  const y = Number(f.get("birth_year"));
  return y >= 2005 && y <= 2030 ? y : null;
};
const genderOf = (f: FormData) => {
  const g = String(f.get("gender") ?? "");
  return g === "F" || g === "M" ? g : null;
};
const classesOf = (f: FormData) => {
  const c = f.getAll("classes").map(String).filter(isKind);
  return c.length ? c : ["morning"];
};

export async function logout() {
  (await cookies()).delete(ADMIN_COOKIE);
  redirect("/admin/login");
}

/* 아이 명단 */
export async function addKid(form: FormData) {
  await requireAdmin();
  const name = str(form, "name", 30);
  if (!name) return;
  const code = crypto.randomBytes(6).toString("base64url");
  const classes = classesOf(form);
  const [kid] = await sql<{ id: string }[]>`insert into kids (name, guardian_label, phone, code, classes, birth_year, gender, call_name, caution)
    values (${name}, ${str(form, "guardian_label", 10) || "어머님"}, ${str(form, "phone", 20)}, ${code}, ${classes},
            ${birthYear(form)}, ${genderOf(form)}, ${str(form, "call_name", 20)}, ${str(form, "caution", 300)}) returning id`;
  // Add to this kid's upcoming classes.
  await sql`insert into entries (week_id, kid_id) select id, ${kid.id} from weeks
    where published_at is null and kind = any(${classes}) on conflict do nothing`;
  revalidatePath("/admin/kids");
}

export async function updateKid(id: string, form: FormData) {
  await requireAdmin();
  await sql`update kids set name = ${str(form, "name", 30)}, guardian_label = ${str(form, "guardian_label", 10) || "어머님"},
    phone = ${str(form, "phone", 20)}, classes = ${classesOf(form)}, birth_year = ${birthYear(form)},
    gender = ${genderOf(form)}, call_name = ${str(form, "call_name", 20)}, caution = ${str(form, "caution", 300)} where id = ${id}`;
  revalidatePath("/admin/kids");
}

export async function setKidActive(id: string, active: boolean) {
  await requireAdmin();
  await sql`update kids set active = ${active} where id = ${id}`;
  revalidatePath("/admin/kids");
}

/* 주차 */
export async function createWeek(form: FormData) {
  await requireAdmin();
  const s = await getSettings();
  const [w] = await sql<{ id: string }[]>`insert into weeks (season, number, kind, class_date, topic, body)
    values (${s.season}, (select coalesce(max(number), 0) + 1 from weeks), ${kindOf(str(form, "kind", 10))}, ${str(form, "class_date", 10)},
            ${str(form, "topic", 120) || "오늘의 숲"}, ${str(form, "body", 30000)})
    returning id`;
  const kind = kindOf(str(form, "kind", 10));
  // Kids registered for this class type in the term covering the class date; otherwise the roster's 듣는 수업.
  const fromTerm = await sql`
    insert into entries (week_id, kid_id)
    select distinct ${w.id}::uuid, en.kid_id from enrollments en
    join terms t on t.id = en.term_id
    join kids k on k.id = en.kid_id and k.active
    where en.kind = ${kind} and ${str(form, "class_date", 10)}::date between t.start_date and t.end_date
    on conflict do nothing`;
  if (fromTerm.count === 0) {
    await sql`insert into entries (week_id, kid_id) select ${w.id}, id from kids
      where active and ${kind} = any(classes)`;
  }
  redirect(`/admin/weeks/${w.id}`);
}

export async function updateWeek(id: string, form: FormData) {
  await requireAdmin();
  await sql`update weeks set kind = ${kindOf(str(form, "kind", 10))}, class_date = ${str(form, "class_date", 10)}, topic = ${str(form, "topic", 120)},
    body = ${str(form, "body", 30000)} where id = ${id}`;
  redirect(`/admin/weeks/${id}`);
}

export async function deleteWeek(id: string) {
  await requireAdmin();
  await sql`delete from weeks where id = ${id}`;
  redirect("/admin");
}

export async function saveEntry(weekId: string, kidId: string, nextKidId: string | null, form: FormData) {
  await requireAdmin();
  const powers = form.getAll("powers").map(String).filter((p) => POWERS.some((x) => x.name === p));
  await sql`insert into entries (week_id, kid_id, attended, note, powers)
    values (${weekId}, ${kidId}, ${form.get("attended") === "on"}, ${str(form, "note", 30000)}, ${powers})
    on conflict (week_id, kid_id) do update set attended = excluded.attended, note = excluded.note,
      powers = excluded.powers, updated_at = now()`;
  revalidatePath(`/admin/weeks/${weekId}`);
  redirect(nextKidId ? `/admin/weeks/${weekId}/k/${nextKidId}` : `/admin/weeks/${weekId}`);
}

/* 사진 */
export async function setPhotoTag(photoId: string, kidId: string, on: boolean) {
  await requireAdmin();
  if (on) await sql`insert into photo_tags (photo_id, kid_id) values (${photoId}, ${kidId}) on conflict do nothing`;
  else await sql`delete from photo_tags where photo_id = ${photoId} and kid_id = ${kidId}`;
}

export async function deletePhoto(photoId: string) {
  await requireAdmin();
  await sql`delete from photos where id = ${photoId}`;
}

/* 문자 */
export async function publish(weekId: string) {
  await requireAdmin();
  const n = await publishWeek(weekId);
  redirect(`/admin/weeks/${weekId}?sent=${n}`);
}

export async function remindNow(weekId: string) {
  await requireAdmin();
  const n = await remindWeek(weekId);
  redirect(`/admin/weeks/${weekId}?reminded=${n}`);
}

/* 설정 */
export async function saveSettings(form: FormData) {
  await requireAdmin();
  await setSetting("remind_enabled", form.get("remind_enabled") === "on" ? "true" : "false");
  await setSetting("remind_weekday", String(Math.min(6, Math.max(0, Number(form.get("remind_weekday")) || 0))));
  const season = str(form, "season", 30);
  if (season) await setSetting("season", season);
  redirect("/admin/settings?saved=1");
}

/* 선생님 폰으로 직접 보내기 (문자 서비스 없이) */
export async function publishOnly(weekId: string) {
  await requireAdmin();
  await sql`update weeks set published_at = coalesce(published_at, now()) where id = ${weekId}`;
  redirect(`/admin/weeks/${weekId}`);
}

/** Records that the teacher opened their phone's message app for this kid. */
export async function sendNotice(weekId: string) {
  await requireAdmin();
  const n = await noticeWeek(weekId);
  redirect(`/admin/weeks/${weekId}?noticed=${n}`);
}

export async function markManualSent(weekId: string, kidId: string, kind: "publish" | "remind" | "notice") {
  await requireAdmin();
  const [k] = await sql<{ phone: string; name: string; guardian_label: string; code: string }[]>`
    select phone, name, guardian_label, code from kids where id = ${kidId}`;
  const [w] = await sql<Week[]>`select * from weeks where id = ${weekId}`;
  if (!k || !w) return;
  const body = kind === "publish" ? publishText(k, w) : kind === "notice" ? noticeText(k, w) : remindText(k, w);
  await sql`insert into messages (kid_id, week_id, kind, to_phone, body, status)
    values (${kidId}, ${weekId}, ${kind}, ${k.phone}, ${body}, 'manual')`;
  if (kind === "remind") await sql`update weeks set reminded_at = now() where id = ${weekId}`;
}

export async function saveRecap(weekId: string, form: FormData) {
  await requireAdmin();
  await sql`update weeks set recap = ${str(form, "recap", 30000)} where id = ${weekId}`;
  redirect(`/admin/weeks/${weekId}?recap=1`);
}

/** Teacher sets attendance by hand (e.g. a parent replied by text). */
export async function setRsvpByTeacher(weekId: string, kidId: string, value: "yes" | "no" | null) {
  await requireAdmin();
  await sql`update entries set rsvp = ${value}, attended = ${value !== "no"}, updated_at = now()
    where week_id = ${weekId} and kid_id = ${kidId}`;
  revalidatePath(`/admin/weeks/${weekId}`);
}

/** Choose which kids belong to this class (who gets the notice and the journal). */
export async function setWeekKids(weekId: string, form: FormData) {
  await requireAdmin();
  const ids = form.getAll("kid").map(String).filter(isUuid);
  if (ids.length) {
    await sql`insert into entries (week_id, kid_id) select ${weekId}, id from kids where id in ${sql(ids)}
      on conflict do nothing`;
    await sql`delete from entries where week_id = ${weekId} and kid_id not in ${sql(ids)}`;
  } else {
    await sql`delete from entries where week_id = ${weekId}`;
  }
  redirect(`/admin/weeks/${weekId}?kids=1`);
}

/** Use one of the class photos (or none) as the child's profile picture. */
export async function setProfilePhoto(kidId: string, photoId: string | null) {
  await requireAdmin();
  if (!isUuid(kidId) || (photoId && !isUuid(photoId))) return;
  await setProfile(kidId, photoId);
  revalidatePath("/admin/kids");
}

/* 문자 기록 지우기 */
export async function deleteMessage(id: number) {
  await requireAdmin();
  await sql`delete from messages where id = ${id}`;
  revalidatePath("/admin/messages");
}

export async function deleteAllMessages() {
  await requireAdmin();
  await sql`delete from messages`;
  redirect("/admin/messages?cleared=1");
}

/* 모집 기수 */
export async function createTerm(form: FormData) {
  await requireAdmin();
  const [t] = await sql<{ id: string }[]>`insert into terms (name, start_date, end_date)
    values (${str(form, "name", 40) || "새 기수"}, ${str(form, "start_date", 10)}, ${str(form, "end_date", 10)}) returning id`;
  redirect(`/admin/terms/${t.id}`);
}

export async function updateTerm(id: string, form: FormData) {
  await requireAdmin();
  await sql`update terms set name = ${str(form, "name", 40)}, start_date = ${str(form, "start_date", 10)},
    end_date = ${str(form, "end_date", 10)} where id = ${id}`;
  redirect(`/admin/terms/${id}`);
}

export async function deleteTerm(id: string) {
  await requireAdmin();
  await sql`delete from terms where id = ${id}`;
  redirect("/admin/terms");
}

/** Who is registered for one class type in this term. Upcoming classes of that type follow along. */
export async function setEnrollments(termId: string, kind: string, form: FormData) {
  await requireAdmin();
  if (!isKind(kind)) return;
  const ids = form.getAll("kid").map(String).filter(isUuid);
  const [t] = await sql<{ start_date: Date; end_date: Date }[]>`select start_date, end_date from terms where id = ${termId}`;
  if (!t) return;
  const before = (await sql<{ kid_id: string }[]>`select kid_id from enrollments where term_id = ${termId} and kind = ${kind}`)
    .map((r) => r.kid_id);
  const added = ids.filter((i) => !before.includes(i));
  const removed = before.filter((i) => !ids.includes(i));
  if (added.length) {
    await sql`insert into enrollments (term_id, kid_id, kind) select ${termId}, id, ${kind} from kids where id in ${sql(added)}
      on conflict do nothing`;
    await sql`insert into entries (week_id, kid_id)
      select w.id, k.id from weeks w, kids k
      where k.id in ${sql(added)} and w.kind = ${kind} and w.published_at is null
        and w.class_date between ${t.start_date} and ${t.end_date}
      on conflict do nothing`;
  }
  if (removed.length) {
    await sql`delete from enrollments where term_id = ${termId} and kind = ${kind} and kid_id in ${sql(removed)}`;
    await sql`delete from entries e using weeks w
      where e.week_id = w.id and e.kid_id in ${sql(removed)} and w.kind = ${kind} and w.published_at is null
        and w.class_date between ${t.start_date} and ${t.end_date}`;
  }
  redirect(`/admin/terms/${termId}?saved=${kind}`);
}

export async function setPaid(termId: string, kidId: string, kind: string, paid: boolean) {
  await requireAdmin();
  await sql`update enrollments set paid = ${paid} where term_id = ${termId} and kid_id = ${kidId} and kind = ${kind}`;
  revalidatePath(`/admin/terms/${termId}`);
}

/* 수업 종료 / 다시 열기 */
export async function closeWeek(id: string) {
  await requireAdmin();
  await sql`update weeks set closed_at = now() where id = ${id}`;
  redirect(`/admin?closed=1`);
}

export async function reopenWeek(id: string) {
  await requireAdmin();
  await sql`update weeks set closed_at = null where id = ${id}`;
  redirect(`/admin/weeks/${id}`);
}
