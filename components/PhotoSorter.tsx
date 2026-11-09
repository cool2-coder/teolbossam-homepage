"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { resizeImage } from "@/lib/resize";
import { setPhotoTag, deletePhoto } from "@/app/admin/actions";

type Photo = { id: string; tags: string[] };
type Kid = { id: string; name: string };

/**
 * Upload many class photos at once and tap kids' names under each one.
 * With `kidId`, photos uploaded here are tagged to that kid right away.
 */
export default function PhotoSorter(props: { weekId: string; kids: Kid[]; photos: Photo[]; kidId?: string }) {
  const router = useRouter();
  const [photos, setPhotos] = useState(props.photos);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "untagged">("all");

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setError(null);
    const list = Array.from(files);
    for (const [i, f] of list.entries()) {
      setProgress(`사진 올리는 중 ${i + 1} / ${list.length}`);
      try {
        const fd = new FormData();
        fd.set("weekId", props.weekId);
        if (props.kidId) fd.set("kidId", props.kidId);
        fd.set("file", new File([await resizeImage(f)], "photo.jpg", { type: "image/jpeg" }));
        const res = await fetch("/api/admin/photos", { method: "POST", body: fd });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "올리지 못했어요.");
        setPhotos((p) => [...p, { id: json.id, tags: props.kidId ? [props.kidId] : [] }]);
      } catch (e) {
        setError(`${f.name}: ${e instanceof Error ? e.message : "올리지 못했어요."}`);
      }
    }
    setProgress(null);
    router.refresh();
  }

  async function toggle(photoId: string, kidId: string) {
    const on = !photos.find((p) => p.id === photoId)?.tags.includes(kidId);
    setPhotos((ps) => ps.map((p) => (p.id === photoId ? { ...p, tags: on ? [...p.tags, kidId] : p.tags.filter((t) => t !== kidId) } : p)));
    await setPhotoTag(photoId, kidId, on);
  }

  async function remove(photoId: string) {
    setPhotos((ps) => ps.filter((p) => p.id !== photoId));
    await deletePhoto(photoId);
    router.refresh();
  }

  const shown = photos.filter((p) =>
    props.kidId ? p.tags.includes(props.kidId) : filter === "all" || p.tags.length === 0,
  );
  const untagged = photos.filter((p) => p.tags.length === 0).length;

  return (
    <div className="stack">
      <label className="btn" htmlFor={`up-${props.kidId ?? "all"}`}>
        {progress ?? (props.kidId ? "+ 이 아이 사진 올리기" : "+ 수업 사진 한꺼번에 올리기")}
      </label>
      <input id={`up-${props.kidId ?? "all"}`} type="file" accept="image/*" multiple hidden disabled={!!progress}
        onChange={(e) => { upload(e.target.files); e.target.value = ""; }} />
      {error && <div className="err">{error}</div>}

      {!props.kidId && photos.length > 0 && (
        <div className="row">
          <button type="button" className={`btn small ${filter === "all" ? "" : "ghost"}`} onClick={() => setFilter("all")}>전체 {photos.length}</button>
          <button type="button" className={`btn small ${filter === "untagged" ? "" : "ghost"}`} onClick={() => setFilter("untagged")}>이름 없는 사진 {untagged}</button>
        </div>
      )}

      {shown.map((p) => (
        <div key={p.id} className="card sorter">
          <img src={`/p/${p.id}`} alt="" loading="lazy" />
          {props.kidId ? (
            <button type="button" className="btn ghost small" onClick={() => toggle(p.id, props.kidId!)}>이 아이 사진에서 빼기</button>
          ) : (
            <>
              <div className="names">
                {props.kids.map((k) => (
                  <button type="button" key={k.id} aria-pressed={p.tags.includes(k.id)} onClick={() => toggle(p.id, k.id)}>{k.name}</button>
                ))}
              </div>
              <button type="button" className="btn danger small" onClick={() => remove(p.id)}>사진 삭제</button>
            </>
          )}
        </div>
      ))}
      {shown.length === 0 && photos.length > 0 && !props.kidId && <p className="muted small">모든 사진에 이름을 붙였어요.</p>}
    </div>
  );
}
