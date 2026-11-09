// Netlify scheduled function: every day 10:00 UTC (19:00 KST) asks the site to send reminders.
export default async () => {
  const base = process.env.URL;
  const secret = process.env.CRON_SECRET;
  if (!base || !secret) return;
  await fetch(`${base}/api/cron/remind`, { headers: { authorization: `Bearer ${secret}` } });
};

export const config = { schedule: "0 10 * * *" };
