"use client";

import { useState } from "react";
import { setRsvp } from "@/app/j/[code]/actions";

export default function Rsvp(props: { code: string; weekId: string; initial: string | null }) {
  const [value, setValue] = useState(props.initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function choose(going: boolean) {
    setBusy(true);
    setError(null);
    const res = await setRsvp(props.code, props.weekId, going).catch(() => ({ error: "저장하지 못했어요. 다시 눌러 주세요." }));
    if ("error" in res && res.error) setError(res.error);
    else setValue(going ? "yes" : "no");
    setBusy(false);
  }

  return (
    <div className="stack">
      <div className="row" style={{ flexWrap: "nowrap" }}>
        <button type="button" className={`btn ${value === "yes" ? "" : "ghost"}`} disabled={busy} onClick={() => choose(true)}>
          {value === "yes" ? "✓ 참석해요" : "참석해요"}
        </button>
        <button type="button" className={`btn ${value === "no" ? "warn" : "ghost"}`} disabled={busy} onClick={() => choose(false)}>
          {value === "no" ? "✓ 이번엔 쉬어요" : "이번엔 쉬어요"}
        </button>
      </div>
      {value && <span className="muted tiny">털보쌤에게 전달됐어요. 바뀌면 다시 눌러 주세요.</span>}
      {error && <div className="err">{error}</div>}
    </div>
  );
}
