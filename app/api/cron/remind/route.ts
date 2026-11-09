import { sql, getSettings } from "@/lib/db";
import { remindWeek } from "@/lib/notify";

export const dynamic = "force-dynamic";

/** Called daily by Vercel Cron (~19:00 KST). Sends reminders on the configured weekday. */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  const s = await getSettings();
  const kstDay = new Date(Date.now() + 9 * 3600_000).getUTCDay();
  if (!s.remindEnabled || kstDay !== s.remindWeekday) return Response.json({ skipped: true });

  const weeks = await sql<{ id: string }[]>`
    select id from weeks where published_at is not null and reminded_at is null
      and published_at < now() - interval '2 days' and published_at > now() - interval '14 days'`;
  let sent = 0;
  for (const w of weeks) sent += await remindWeek(w.id);
  return Response.json({ weeks: weeks.length, sent });
}
