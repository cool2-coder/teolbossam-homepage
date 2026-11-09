"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setRsvpByTeacher } from "@/app/admin/actions";

type V = "yes" | "no" | null;
const OPTS: [V, string][] = [["yes", "참석"], ["no", "불참"], [null, "미정"]];

export default function RsvpToggle({ weekId, kidId, initial }: { weekId: string; kidId: string; initial: V }) {
  const [value, setValue] = useState<V>(initial);
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <div className="seg" role="group" aria-label="참석 여부" data-pending={pending || undefined}>
      {OPTS.map(([v, label]) => (
        <button
          key={label}
          type="button"
          aria-pressed={value === v}
          data-v={v ?? "none"}
          onClick={() => {
            if (value === v) return;
            setValue(v);
            start(async () => {
              await setRsvpByTeacher(weekId, kidId, v);
              router.refresh();
            });
          }}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
