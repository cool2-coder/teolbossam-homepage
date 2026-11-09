import postgres from "postgres";

const g = globalThis as unknown as { __sql?: postgres.Sql };

function connect() {
  const url = process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL || process.env.POSTGRES_URL;
  if (!url) throw new Error("DATABASE_URL이 설정되지 않았습니다.");
  const local = /localhost|127\.0\.0\.1/.test(url);
  return postgres(url, { ssl: local ? false : "require", prepare: false, max: 5 });
}

export const sql: postgres.Sql = g.__sql ?? (g.__sql = connect());

export type Kid = {
  id: string;
  name: string;
  guardian_label: string;
  phone: string;
  code: string;
  active: boolean;
};

export type Week = {
  id: string;
  season: string;
  number: number;
  class_date: Date;
  place: string;
  meet_time: string;
  prep: string;
  body: string;
  recap: string;
  kind: string;
  topic: string;
  mission: string;
  published_at: Date | null;
  reminded_at: Date | null;
};

export async function getSettings() {
  const rows = await sql<{ key: string; value: string }[]>`select key, value from settings`;
  const m = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return {
    season: m.season ?? "시즌2",
    seasonWeeks: Number(m.season_weeks ?? 10),
    remindEnabled: (m.remind_enabled ?? "true") === "true",
    remindWeekday: Number(m.remind_weekday ?? 4),
  };
}

export async function setSetting(key: string, value: string) {
  await sql`insert into settings (key, value) values (${key}, ${value})
    on conflict (key) do update set value = excluded.value`;
}

export const isUuid = (s: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
