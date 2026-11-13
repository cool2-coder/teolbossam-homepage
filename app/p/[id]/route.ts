import { sql } from "@/lib/db";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) return new Response("없는 사진이에요.", { status: 404 });
  const [p] = await sql<{ mime: string; data: Buffer }[]>`select mime, data from photos where id = ${id}`;
  if (!p) return new Response("없는 사진이에요.", { status: 404 });
  const headers: Record<string, string> = {
    "Content-Type": p.mime,
    "Cache-Control": "private, max-age=31536000, immutable",
  };
  if (new URL(req.url).searchParams.has("dl")) {
    headers["Content-Disposition"] = `attachment; filename="teolbossam-${id.slice(0, 8)}.jpg"`;
  }
  return new Response(new Uint8Array(p.data), { headers });
}
