"use client";

import { useState } from "react";
import { markManualSent } from "@/app/admin/actions";

/** Opens the phone's own message app with the number and text filled in. */
export default function SmsButton(props: {
  weekId: string; kidId: string; kind: "publish" | "remind" | "notice"; phone: string; text: string; sent: boolean; label: string;
}) {
  const [sent, setSent] = useState(props.sent);
  const to = props.phone.replace(/[^\d+]/g, "");
  if (!to) return <span className="st off">번호 없음</span>;
  const body = encodeURIComponent(props.text);
  const href = `sms:${to}?body=${body}`;
  return (
    <a
      className={`btn small ${sent ? "ghost" : ""}`}
      href={href}
      onClick={(e) => {
        if (/iPhone|iPad|iPod/.test(navigator.userAgent)) {
          e.preventDefault();
          window.location.href = `sms:${to}&body=${body}`;
        }
        setSent(true);
        markManualSent(props.weekId, props.kidId, props.kind).catch(() => {});
      }}
    >
      {sent ? "✓ 보냄" : props.label}
    </a>
  );
}
