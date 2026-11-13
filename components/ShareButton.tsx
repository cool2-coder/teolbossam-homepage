"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Opens the phone's share sheet (pick KakaoTalk, then tick the chats) with the text filled in.
 * Where sharing isn't available, copies the text instead.
 */
export default function ShareButton(props: {
  text: string; label: string; className?: string; onShared?: () => Promise<unknown> | void;
}) {
  const [state, setState] = useState<"idle" | "shared" | "copied" | "error">("idle");
  const router = useRouter();
  return (
    <div className="stack" style={{ gap: 6 }}>
      <button
        type="button"
        className={props.className ?? "btn kakao"}
        onClick={async () => {
          try {
            if (navigator.share) {
              await navigator.share({ text: props.text });
              setState("shared");
            } else {
              await navigator.clipboard.writeText(props.text);
              setState("copied");
            }
            await props.onShared?.();
            router.refresh();
          } catch (e) {
            if (e instanceof DOMException && e.name === "AbortError") return; // closed the share sheet
            try {
              await navigator.clipboard.writeText(props.text);
              setState("copied");
              await props.onShared?.();
            } catch {
              setState("error");
            }
          }
        }}
      >
        {props.label}
      </button>
      {state === "shared" && <span className="muted tiny">보냈어요. 보낸 가족은 ‘보냄’으로 표시돼요.</span>}
      {state === "copied" && <span className="muted tiny">글을 복사했어요. 카카오톡 채팅방에 붙여 넣어 주세요.</span>}
      {state === "error" && <span className="err">공유하지 못했어요. 이 폰의 브라우저에서 다시 눌러 주세요.</span>}
    </div>
  );
}
