"use server";

import { revalidatePath } from "next/cache";
import { sql, type Kid, type Week } from "@/lib/db";
import { notifyTeacher } from "@/lib/notify";

export async function submitReply(code: string, weekId: string, form: FormData) {
  const body = String(form.get("body") ?? "").trim().slice(0, 2000);
  const photo = form.get("photo");
  if (!body && !(photo instanceof File && photo.size)) return { error: "내용을 적거나 사진을 올려 주세요." };

  const [kid] = await sql<Kid[]>`select * from kids where code = ${code} and active`;
  if (!kid) return { error: "링크를 다시 확인해 주세요." };
  const [week] = await sql<Week[]>`
    select w.* from weeks w join entries e on e.week_id = w.id and e.kid_id = ${kid.id}
    where w.id = ${weekId} and w.published_at is not null`;
  if (!week) return { error: "답장할 수 없는 주차예요." };

  const [existing] = await sql<{ id: string }[]>`select id from replies where week_id = ${weekId} and kid_id = ${kid.id}`;
  const [reply] = await sql<{ id: string }[]>`
    insert into replies (week_id, kid_id, body) values (${weekId}, ${kid.id}, ${body})
    on conflict (week_id, kid_id) do update set body = excluded.body, created_at = now()
    returning id`;

  if (photo instanceof File && photo.size) {
    if (photo.size > 4_500_000) return { error: "사진이 너무 커요." };
    if (!photo.type.startsWith("image/")) return { error: "사진 파일만 올릴 수 있어요." };
    await sql`delete from photos where reply_id = ${reply.id}`;
    const buf = Buffer.from(await photo.arrayBuffer());
    await sql`insert into photos (reply_id, mime, data) values (${reply.id}, ${photo.type}, ${buf})`;
  }

  if (!existing) await notifyTeacher(kid, week);
  revalidatePath(`/j/${code}`);
  return { ok: true };
}

export async function setRsvp(code: string, weekId: string, going: boolean) {
  const [kid] = await sql<Kid[]>`select * from kids where code = ${code} and active`;
  if (!kid) return { error: "링크를 다시 확인해 주세요." };
  const res = await sql`update entries e set rsvp = ${going ? "yes" : "no"}, attended = ${going}, updated_at = now()
    from weeks w where w.id = e.week_id and e.week_id = ${weekId} and e.kid_id = ${kid.id} and w.published_at is null`;
  if (res.count === 0) return { error: "이미 끝난 수업이에요." };
  revalidatePath(`/j/${code}`);
  return { ok: true };
}
