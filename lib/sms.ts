import crypto from "node:crypto";
import { sql } from "./db";

type Send = { to: string; text: string; kind: string; kidId?: string | null; weekId?: string | null };

export function smsConfigured() {
  return !!(process.env.SOLAPI_API_KEY && process.env.SOLAPI_API_SECRET && process.env.SMS_FROM);
}

function digits(s: string) {
  return s.replace(/\D/g, "");
}

async function solapiSend(to: string, text: string) {
  const key = process.env.SOLAPI_API_KEY!;
  const secret = process.env.SOLAPI_API_SECRET!;
  const date = new Date().toISOString();
  const salt = crypto.randomBytes(16).toString("hex");
  const signature = crypto.createHmac("sha256", secret).update(date + salt).digest("hex");
  const res = await fetch("https://api.solapi.com/messages/v4/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `HMAC-SHA256 apiKey=${key}, date=${date}, salt=${salt}, signature=${signature}`,
    },
    body: JSON.stringify({ message: { to: digits(to), from: digits(process.env.SMS_FROM!), text } }),
  });
  if (!res.ok) throw new Error(`솔라피 ${res.status}: ${(await res.text()).slice(0, 200)}`);
}

/** Sends one text (or only records it when SMS is not configured) and logs it. */
export async function sendSms({ to, text, kind, kidId = null, weekId = null }: Send) {
  let status = "logged";
  let error: string | null = null;
  if (!digits(to)) {
    status = "failed";
    error = "전화번호 없음";
  } else if (smsConfigured()) {
    try {
      await solapiSend(to, text);
      status = "sent";
    } catch (e) {
      status = "failed";
      error = e instanceof Error ? e.message : String(e);
    }
  }
  await sql`insert into messages (kid_id, week_id, kind, to_phone, body, status, error)
    values (${kidId}, ${weekId}, ${kind}, ${to}, ${text}, ${status}, ${error})`;
  return status;
}
