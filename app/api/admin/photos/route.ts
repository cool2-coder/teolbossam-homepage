import { sql, isUuid } from "@/lib/db";
import { isAdmin } from "@/lib/auth";

export async function POST(req: Request) {
  if (!(await isAdmin())) return Response.json({ error: "로그인이 필요해요." }, { status: 401 });
  const form = await req.formData();
  const weekId = String(form.get("weekId") ?? "");
  const kidId = String(form.get("kidId") ?? "");
  const file = form.get("file");
  if (!(file instanceof File) || !file.type.startsWith("image/")) return Response.json({ error: "사진 파일이 아니에요." }, { status: 400 });
  if (file.size > 4_500_000) return Response.json({ error: "사진이 너무 커요." }, { status: 400 });
  if (!isUuid(weekId) || (kidId && !isUuid(kidId))) return Response.json({ error: "잘못된 요청이에요." }, { status: 400 });
  const [w] = await sql`select 1 from weeks where id = ${weekId}`;
  if (!w) return Response.json({ error: "없는 주차예요." }, { status: 404 });
  const [p] = await sql<{ id: string }[]>`insert into photos (week_id, mime, data)
    values (${weekId}, ${file.type}, ${Buffer.from(await file.arrayBuffer())}) returning id`;
  if (kidId) await sql`insert into photo_tags (photo_id, kid_id) values (${p.id}, ${kidId}) on conflict do nothing`;
  return Response.json({ id: p.id });
}
