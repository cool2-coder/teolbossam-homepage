import { sql } from "./db";

export async function setProfile(kidId: string, photoId: string | null) {
  const [old] = await sql<{ photo_id: string | null }[]>`select photo_id from kids where id = ${kidId}`;
  await sql`update kids set photo_id = ${photoId} where id = ${kidId}`;
  // Remove the previous picture if it was uploaded only as a profile picture.
  if (old?.photo_id && old.photo_id !== photoId) {
    await sql`delete from photos where id = ${old.photo_id} and week_id is null and reply_id is null
      and not exists (select 1 from kids where photo_id = ${old.photo_id})`;
  }
}
