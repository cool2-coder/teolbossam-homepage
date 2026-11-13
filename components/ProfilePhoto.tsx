"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { squareImage } from "@/lib/resize";
import { setProfilePhoto } from "@/app/admin/actions";

/** Shows a child's profile picture with buttons to upload a new one or remove it. */
export default function ProfilePhoto({ kidId, photoId, name }: { kidId: string; photoId: string | null; name: string }) {
  const router = useRouter();
  const [id, setId] = useState(photoId);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.set("kidId", kidId);
      fd.set("file", new File([await squareImage(file)], "profile.jpg", { type: "image/jpeg" }));
      const res = await fetch("/api/admin/profile", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "올리지 못했어요.");
      setId(json.id);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "올리지 못했어요.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="row">
      <Avatar photoId={id} name={name} size={64} />
      <label className="btn ghost small" htmlFor={`pf-${kidId}`}>{busy ? "올리는 중…" : id ? "대표 사진 바꾸기" : "대표 사진 올리기"}</label>
      <input id={`pf-${kidId}`} type="file" accept="image/*" hidden disabled={busy}
        onChange={(e) => { upload(e.target.files?.[0]); e.target.value = ""; }} />
      {id && (
        <button type="button" className="btn ghost small" disabled={busy}
          onClick={async () => { setId(null); await setProfilePhoto(kidId, null); router.refresh(); }}>
          빼기
        </button>
      )}
      {error && <div className="err">{error}</div>}
    </div>
  );
}

export function Avatar({ photoId, name, size = 40 }: { photoId: string | null; name: string; size?: number }) {
  return photoId ? (
    <img className="avatar" src={`/p/${photoId}`} alt={`${name} 대표 사진`} width={size} height={size} style={{ width: size, height: size }} />
  ) : (
    <span className="avatar empty" style={{ width: size, height: size, fontSize: size * 0.42 }} aria-hidden="true">{name.slice(-1)}</span>
  );
}
