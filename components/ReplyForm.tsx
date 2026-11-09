"use client";

import { useState } from "react";
import { submitReply } from "@/app/j/[code]/actions";
import { resizeImage } from "@/lib/resize";

export default function ReplyForm(props: { code: string; weekId: string; kidNick: string; initial?: string }) {
  const [body, setBody] = useState(props.initial ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <div className="flash">
        털보쌤에게 전달됐어요. {props.kidNick} 일지에 함께 저장됐어요.
      </div>
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.set("body", body);
      if (file) fd.set("photo", new File([await resizeImage(file)], "reply.jpg", { type: "image/jpeg" }));
      const res = await submitReply(props.code, props.weekId, fd);
      if ("error" in res && res.error) setError(res.error);
      else setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "보내지 못했어요. 잠시 후 다시 시도해 주세요.");
    } finally {
      setBusy(false);
    }
  }

  const id = `reply-${props.weekId}`;
  return (
    <form onSubmit={onSubmit} className="stack">
      <div className="field">
        <label className="l" htmlFor={id}>{props.kidNick}가 집에서 한 이야기</label>
        <textarea id={id} value={body} onChange={(e) => setBody(e.target.value)} placeholder="편하게 적어 주세요." />
      </div>
      <div className="row">
        {preview && <img src={preview} alt="첨부한 사진" style={{ width: 64, height: 64, objectFit: "cover", borderRadius: 10 }} />}
        <label className="btn ghost small" htmlFor={`${id}-photo`}>{file ? "사진 바꾸기" : "사진 첨부 (선택)"}</label>
        <input
          id={`${id}-photo`}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0] ?? null;
            setFile(f);
            setPreview(f ? URL.createObjectURL(f) : null);
          }}
        />
      </div>
      {error && <div className="err">{error}</div>}
      <button className="btn" disabled={busy}>{busy ? "보내는 중…" : "털보쌤에게 보내기"}</button>
    </form>
  );
}
