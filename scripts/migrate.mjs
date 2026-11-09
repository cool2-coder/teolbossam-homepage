import "./env.mjs";
import fs from "node:fs";
import postgres from "postgres";

const url = process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL || process.env.POSTGRES_URL;
if (!url) {
  console.warn("DATABASE_URL이 없어 DB 준비를 건너뜁니다.");
  process.exit(0);
}
const local = /localhost|127\.0\.0\.1/.test(url);
const sql = postgres(url, { ssl: local ? false : "require", prepare: false, onnotice: () => {} });
await sql.unsafe(fs.readFileSync(new URL("../db/schema.sql", import.meta.url), "utf8"));
console.log("DB 준비 완료");
await sql.end();
