export const POWERS = [
  { name: "관찰력", desc: "자세히 보고 변화를 알아차리는 힘" },
  { name: "기록력", desc: "자신의 발견을 남기는 힘" },
  { name: "지속력", desc: "기다리며 꾸준히 이어 가는 힘" },
  { name: "사고력", desc: "스스로 질문하고 이유를 찾는 힘" },
  { name: "완성력", desc: "생각을 표현하고 끝까지 해 보는 힘" },
] as const;

export const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

export function formatDate(d: Date | string) {
  const date = typeof d === "string" ? new Date(d) : d;
  const k = new Date(date.getTime() + 9 * 3600_000);
  return `${k.getUTCMonth() + 1}월 ${k.getUTCDate()}일 ${WEEKDAYS[k.getUTCDay()]}`;
}

export function formatTime(d: Date | string) {
  const date = typeof d === "string" ? new Date(d) : d;
  const k = new Date(date.getTime() + 9 * 3600_000);
  return `${k.getUTCMonth() + 1}/${k.getUTCDate()} ${String(k.getUTCHours()).padStart(2, "0")}:${String(k.getUTCMinutes()).padStart(2, "0")}`;
}

/** "2026-11-08" for <input type="date"> in Korea time. */
export function kstDateString(d: Date = new Date()) {
  return new Date(d.getTime() + 9 * 3600_000).toISOString().slice(0, 10);
}

export function siteUrl() {
  const fromVercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  const url = process.env.SITE_URL || (fromVercel ? `https://${fromVercel}` : "") || process.env.URL || "";
  return url.replace(/\/$/, "");
}

/** "민준" → "민준이", "서아" → "서아" (Korean nickname form, used before 가/의/도). */
export function nick(name: string) {
  const c = name.charCodeAt(name.length - 1);
  if (c >= 0xac00 && c <= 0xd7a3 && (c - 0xac00) % 28 !== 0) return name + "이";
  return name;
}

export const CLASS_KINDS = {
  morning: { label: "아침숲", icon: "🌳" },
  indoor: { label: "실내숲", icon: "🏠" },
  explorer: { label: "초등숲탐험대", icon: "🧭" },
  oneday: { label: "하루 숲체험", icon: "🎒" },
} as const;
export type ClassKind = keyof typeof CLASS_KINDS;
export const isKind = (k: string): k is ClassKind => k in CLASS_KINDS;
export const kindOf = (k: string): ClassKind => (isKind(k) ? k : "morning");
export const kindLabel = (k: string) => CLASS_KINDS[kindOf(k)].label;

/** "문서윤" → "서윤" (first character is the family name). A set 부르는 이름 wins. */
export function callName(k: { name: string; call_name?: string | null }) {
  const c = k.call_name?.trim();
  if (c) return c;
  const n = k.name.trim();
  return n.length >= 3 ? n.slice(1) : n;
}

/** "19년생 여아" */
export function kidInfo(k: { birth_year?: number | null; gender?: string | null }) {
  return [k.birth_year ? `${String(k.birth_year).slice(-2)}년생` : "", k.gender === "F" ? "여아" : k.gender === "M" ? "남아" : ""]
    .filter(Boolean).join(" ");
}
