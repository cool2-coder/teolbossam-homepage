import Link from "next/link";

export default function AdminTop({ title, back }: { title: string; back?: string }) {
  return (
    <div className="topbar">
      {back && <Link className="back" href={back} aria-label="뒤로">‹</Link>}
      <b>{title}</b>
    </div>
  );
}
