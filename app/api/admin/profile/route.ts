import { sql, isUuid } from "@/lib/db";
import { isAdmin } from "@/lib/auth";
import { setProfile } from "@/lib/profile";

/** Upload a child's profile picture (already cropped square in the browser). */
export async function POST(req: Request) {
  if (!(await isAdmin())) return Response.json({ error: "로그인이 필요해요." }, { status: 401 });
  const form = await req.formData();
  const kidId = String(form.get("kidId") ?? "");
  const file = form.get("file");
  if (!isUuid(kidId)) return Response.json({ error: "잘못된 요청이에요." }, { status: 400 });
  if (!(file instanceof File) || !file.type.startsWith("image/")) return Response.json({ error: "사진 파일이 아니에요." }, { status: 400 });
  if (file.size > 4_500_000) return Response.json({ error: "사진이 너무 커요." }, { status: 400 });
  const [p] = await sql<{ id: string }[]>`insert into photos (mime, data)
    values (${file.type}, ${Buffer.from(await file.arrayBuffer())}) returning id`;
  await setProfile(kidId, p.id);
  return Response.json({ id: p.id });
}
