import { sql, type Week } from "./db";

export type WeekStat = Week & { attended: number; replied: number; notified: number; rsvp_yes: number; rsvp_no: number };

export async function weekStats(where?: { id?: string; season?: string }) {
  return sql<WeekStat[]>`
    select w.*,
      (select count(*)::int from entries e join kids k on k.id = e.kid_id where e.week_id = w.id and e.attended and k.active) as attended,
      (select count(*)::int from replies r join entries e on e.week_id = r.week_id and e.kid_id = r.kid_id
         where r.week_id = w.id and e.attended) as replied,
      (select count(distinct m.kid_id)::int from messages m where m.week_id = w.id and m.kind = 'publish'
         and m.status in ('sent','manual')) as notified
      ,(select count(*)::int from entries e join kids k on k.id = e.kid_id where e.week_id = w.id and k.active and e.rsvp = 'yes') as rsvp_yes,
      (select count(*)::int from entries e join kids k on k.id = e.kid_id where e.week_id = w.id and k.active and e.rsvp = 'no') as rsvp_no
    from weeks w
    where ${where?.id ? sql`w.id = ${where.id}` : where?.season ? sql`w.season = ${where.season}` : sql`true`}
    order by w.class_date desc, w.number desc`;
}
