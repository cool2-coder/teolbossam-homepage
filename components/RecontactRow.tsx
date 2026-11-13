"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setRecontact } from "@/app/admin/actions";

type S = "contacted" | "declined" | null;
const OPTS: [S, string, string][] = [[null, "연락 전", "none"], ["contacted", "연락함", "yes"], ["declined", "이번엔 안 함", "no"]];

/** Status toggle plus a text button that opens the phone's message app (and marks the family as contacted). */
export default function RecontactRow(props: { termId: string; kidId: string; status: S; phone: string; text: string }) {
  const [status, setStatus] = useState<S>(props.status);
  const [pending, start] = useTransition();
  const router = useRouter();
  const set = (v: S) => {
    setStatus(v);
    start(async () => { await setRecontact(props.termId, props.kidId, v); router.refresh(); });
  };
  const to = props.phone.replace(/[^\d+]/g, "");
  const body = encodeURIComponent(props.text);
  return (
    <div className="row" style={{ justifyContent: "flex-end" }}>
      <div className="seg" role="group" aria-label="연락 상태" data-pending={pending || undefined}>
        {OPTS.map(([v, label, d]) => (
          <button key={label} type="button" aria-pressed={status === v} data-v={d} onClick={() => status !== v && set(v)}>{label}</button>
        ))}
      </div>
      {to ? (
        <a className="btn small" href={`sms:${to}?body=${body}`}
          onClick={(e) => {
            if (/iPhone|iPad|iPod/.test(navigator.userAgent)) { e.preventDefault(); window.location.href = `sms:${to}&body=${body}`; }
            if (!status) set("contacted");
          }}>문자</a>
      ) : <span className="st off">번호 없음</span>}
    </div>
  );
}
