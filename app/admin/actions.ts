"use server";

import crypto from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { sql, getSettings, setSetting, isUuid, type Week } from "@/lib/db";
import { requireAdmin, ADMIN_COOKIE } from "@/lib/auth";
import { publishWeek, remindWeek, noticeWeek, publishText, remindText, noticeText } from "@/lib/notify";
import { POWERS, kindOf } from "@/lib/brand";

const str = (f: FormData, k: string, max = 2000) => String(f.get(k) ?? "").trim().slice(0, max);
const classesOf = (f: FormData) => {
  const c = f.getAll("classes").map(String).filter((x) => x === "morning" || x === "indoor");
  return c.length ? c : ["morning", "indoor"];
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
  const [kid] = await sql<{ id: string }[]>`insert into kids (name, guardian_label, phone, code, classes)
    values (${name}, ${str(form, "guardian_label", 10) || "어머님"}, ${str(form, "phone", 20)}, ${code}, ${classes}) returning id`;
  // Add to this kid's upcoming classes.
  await sql`insert into entries (week_id, kid_id) select id, ${kid.id} from weeks
    where published_at is null and kind = any(${classes}) on conflict do nothing`;
  revalidatePath("/admin/kids");
}

export async function updateKid(id: string, form: FormData) {
  await requireAdmin();
  await sql`update kids set name = ${str(form, "name", 30)}, guardian_label = ${str(form, "guardian_label", 10) || "어머님"},
    phone = ${str(form, "phone", 20)}, classes = ${classesOf(form)} where id = ${id}`;
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
  await sql`insert into entries (week_id, kid_id) select ${w.id}, id from kids
    where active and ${kindOf(str(form, "kind", 10))} = any(classes)`;
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
