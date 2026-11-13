"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setPaid } from "@/app/admin/actions";

export default function PaidToggle(props: { termId: string; kidId: string; kind: string; paid: boolean }) {
  const [paid, set] = useState(props.paid);
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <button
      type="button"
      className={`st ${paid ? "ok" : "wait"}`}
      style={{ border: 0, cursor: "pointer", opacity: pending ? 0.6 : 1, padding: "5px 10px" }}
      aria-pressed={paid}
      onClick={() => {
        const next = !paid;
        set(next);
        start(async () => { await setPaid(props.termId, props.kidId, props.kind, next); router.refresh(); });
      }}
    >
      {paid ? "✓ 입금 확인" : "입금 대기"}
    </button>
  );
}
