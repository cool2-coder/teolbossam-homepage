import Link from "next/link";
import { weekStats } from "@/lib/queries";
import { CLASS_KINDS, formatDate, kindOf, type ClassKind } from "@/lib/brand";
import AdminTop from "@/components/AdminTop";

export const dynamic = "force-dynamic";

export default async function Closed({ searchParams }: { searchParams: Promise<{ kind?: string }> }) {
  const { kind } = await searchParams;
  const all = (await weekStats()).filter((w) => w.closed_at);
  const list = kind ? all.filter((w) => kindOf(w.kind) === kind) : all;
  return (
    <main className="page">
      <AdminTop title={`종료된 수업 ${all.length}개`} back="/admin" />
      <div className="pad">
        <div className="row">
          <Link className={`btn small ${kind ? "ghost" : ""}`} href="/admin/closed">전체 {all.length}</Link>
          {(Object.keys(CLASS_KINDS) as ClassKind[]).map((k) => {
            const n = all.filter((w) => kindOf(w.kind) === k).length;
            return n ? (
              <Link key={k} data-kind={k} className={`kchip`} style={kind === k ? { background: "var(--k)", color: "var(--screen)" } : undefined}
                href={`/admin/closed?kind=${k}`}>{CLASS_KINDS[k].label} {n}</Link>
            ) : null;
          })}
        </div>
        {list.length === 0 && <p className="muted small">종료된 수업이 없어요. 수업 화면 아래의 [수업 종료]를 누르면 여기로 모여요.</p>}
        <ul className="list">
          {list.map((w) => (
            <li key={w.id} data-kind={kindOf(w.kind)}>
              <Link className="item" href={`/admin/weeks/${w.id}`}>
                <span><span className="kchip">{CLASS_KINDS[kindOf(w.kind)].label}</span>{" "}
                  <span className="muted small tnum">{formatDate(w.class_date)}</span> · {w.topic}</span>
                <span className="muted small tnum">{w.published_at ? `답장 ${w.replied}/${w.attended}` : "일지 없음"}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
