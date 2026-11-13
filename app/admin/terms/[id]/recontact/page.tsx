import { notFound } from "next/navigation";
import { sql, isUuid, type Term } from "@/lib/db";
import { CLASS_KINDS, kindOf, callName, kidInfo, nick } from "@/lib/brand";
import { termSummary } from "@/lib/terms";
import AdminTop from "@/components/AdminTop";
import RecontactRow from "@/components/RecontactRow";
import { Avatar } from "@/components/ProfilePhoto";
import { saveRecontactText } from "../../../actions";
import { getTemplates, fill as fillTpl } from "@/lib/templates";

export const dynamic = "force-dynamic";

type K = { id: string; name: string; call_name: string; guardian_label: string; phone: string; photo_id: string | null;
  birth_year: number | null; gender: string | null };

export default async function Recontact({ params, searchParams }: {
  params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string }>;
}) {
  const { id } = await params;
  const { saved } = await searchParams;
  if (!isUuid(id)) notFound();
  const [term] = await sql<(Term & { recontact_text: string })[]>`select * from terms where id = ${id}`;
  if (!term) notFound();
  const sum = await termSummary(term);
  const t = await getTemplates();
  const text = term.recontact_text || t.recontact;

  if (!sum.prev) {
    return (
      <main className="page">
        <AdminTop title="재등록 연락" back={`/admin/terms/${id}`} />
        <div className="pad"><p className="muted">이전 기수가 없어서 연락할 가족이 없어요.</p></div>
      </main>
    );
  }
  const prev = sum.prev;
  const kids = sum.recontact.length
    ? await sql<K[]>`select id, name, call_name, guardian_label, phone, photo_id, birth_year, gender from kids
        where id in ${sql(sum.recontact)} order by name`
    : [];
  const statuses = new Map((await sql<{ kid_id: string; status: string }[]>`
    select kid_id, status from recontacts where term_id = ${id}`).map((r) => [r.kid_id, r.status]));
  const lastKinds = await sql<{ kid_id: string; kind: string }[]>`select kid_id, kind from enrollments where term_id = ${prev.id}`;
  const [{ n: prevTotal }] = await sql<{ n: number }[]>`select count(distinct kid_id)::int as n from enrollments where term_id = ${prev.id}`;
  const contacted = kids.filter((k) => statuses.get(k.id) === "contacted").length;
  const declined = kids.filter((k) => statuses.get(k.id) === "declined").length;

  const fill = (k: K) => {
    const n = callName(k);
    return fillTpl(text, { 이름: n, 아이: nick(n), 호칭: k.guardian_label, 기수: term.name });
  };

  return (
    <main className="page">
      <AdminTop title={`재등록 연락 · ${term.name}`} back={`/admin/terms/${id}`} />
      <div className="pad">
        <div className="card">
          <span className="muted small">{prev.name} 가족 {prevTotal}가족 중</span>
          <div className="statgrid">
            <div><b style={{ color: "var(--pine)" }}>{prevTotal - kids.length}</b><span>이미 재등록</span></div>
            <div><b style={{ color: "var(--acorn)" }}>{kids.length - contacted - declined}</b><span>연락 전</span></div>
            <div><b>{contacted}</b><span>연락함</span></div>
          </div>
          {declined > 0 && <span className="muted tiny">이번엔 안 함 {declined}가족</span>}
          <span className="muted tiny">아이가 이번 기수에 등록되면 이 목록에서 자동으로 빠져요.</span>
        </div>

        <details className="card">
          <summary className="small" style={{ cursor: "pointer" }}><b>이 기수만 문구 고치기</b> <span className="muted tiny">(모든 기수 기본 문구는 ‘문자 문구 고치기’에서)</span></summary>
          <form action={saveRecontactText.bind(null, id)} className="stack" style={{ marginTop: 10 }}>
            <textarea id="recontact_text" name="recontact_text" defaultValue={text} style={{ minHeight: 160 }} />
            <span className="muted tiny">{"{이름}"}은 아이 이름(서윤), {"{아이}"}는 부르는 말(서윤이), {"{호칭}"}은 어머님, {"{기수}"}는 ‘{term.name}’로 바뀌어요.</span>
            <button className="btn ghost">문구 저장</button>
          </form>
        </details>
        {saved && <div className="flash">문구를 저장했어요.</div>}

        {kids.length === 0 ? (
          <div className="card small">{prev.name} 가족이 모두 다시 등록했어요. 🎉</div>
        ) : (
          <ul className="list">
            {kids.map((k) => (
              <li key={k.id} className="stack" style={{ padding: "12px 2px", gap: 8, borderBottom: "1px solid var(--line)" }}>
                <div className="row" style={{ flexWrap: "nowrap" }}>
                  <Avatar photoId={k.photo_id} name={k.name} size={32} />
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <b>{k.name}</b> <span className="muted small">{kidInfo(k)} · {k.guardian_label}</span>
                    <span className="row" style={{ marginTop: 2 }}>
                      {lastKinds.filter((l) => l.kid_id === k.id).map((l) => (
                        <span key={l.kind} data-kind={kindOf(l.kind)} className="kchip">{CLASS_KINDS[kindOf(l.kind)].label}</span>
                      ))}
                    </span>
                  </span>
                </div>
                <RecontactRow termId={id} kidId={k.id} status={(statuses.get(k.id) as "contacted" | "declined") ?? null}
                  phone={k.phone} text={fill(k)} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
