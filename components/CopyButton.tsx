"use client";

import { useState } from "react";

export default function CopyButton({ text, label = "링크 복사" }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className="btn ghost small"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
          setTimeout(() => setDone(false), 1500);
        } catch {
          window.prompt("링크를 복사해 주세요", text);
        }
      }}
    >
      {done ? "복사됨" : label}
    </button>
  );
}
