import { notFound } from "next/navigation";
import { sql, isUuid, type Term } from "@/lib/db";
import { CLASS_KINDS, formatDate, kstDateString, type ClassKind } from "@/lib/brand";
import AdminTop from "@/components/AdminTop";
import PaidToggle from "@/components/PaidToggle";
import { Avatar } from "@/components/ProfilePhoto";
import { setEnrollments, updateTerm, deleteTerm, addNewKidToTerm } from "../../actions";
import Link from "next/link";
import { termSummary } from "@/lib/terms";

export const dynamic = "force-dynamic";

type En = { kid_id: string; kind: string; paid: boolean };
type K = { id: string; name: string; phone: string; guardian_label: string; caution: string; photo_id: string | null };

export default async function TermPage({ params, searchParams }: {
  params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string; added?: string }>;
}) {
  const { id } = await params;
  const { saved, added } = await searchParams;
  if (!isUuid(id)) notFound();
  const [term] = await sql<Term[]>`select * from terms where id = ${id}`;
  if (!term) notFound();
  const ens = await sql<En[]>`select kid_id, kind, paid from enrollments where term_id = ${id}`;
  const kids = await sql<K[]>`select id, name, phone, guardian_label, caution, photo_id from kids where active order by name`;
  const byId = new Map(kids.map((k) => [k.id, k]));
  const sum = await termSummary(term);
  const isNew = new Set(sum.newKids);

  return (
    <main className="page">
      <AdminTop title={term.name} back="/admin/terms" />
      <div className="pad">
        <div className="card">
          <span className="muted small tnum">{formatDate(term.start_date)} ~ {formatDate(term.end_date)}</span>
          <div className="statgrid">
            <div><b>{sum.kids}</b><span>등록</span></div>
            <div><b style={{ color: "var(--acorn)" }}>{sum.newKids.length}</b><span>신규</span></div>
            <div><b style={{ color: "var(--pine)" }}>{sum.returning}</b><span>재등록</span></div>
          </div>
          <div className="row small tnum">
            <span className={`st ${sum.unpaid ? "wait" : "ok"}`}>입금 대기 {sum.unpaid}</span>
          </div>
          <span className="muted tiny">반에 등록한 아이는 이 기간의 그 반 수업 명단에 자동으로 들어가요.</span>
        </div>
        {sum.prev && (
          <Link href={`/admin/terms/${id}/recontact`} className="btn ghost">
            재등록 연락드리기 · {sum.prev.name} 가족 중 {sum.recontact.length}가족 아직 미등록 ›
          </Link>
        )}
        {added && <div className="flash">{added} 신규 등록했어요. 아이 명단에도 들어갔어요.</div>}
        {saved && <div className="flash">{CLASS_KINDS[saved as ClassKind]?.label ?? ""} 등록을 저장했어요.</div>}

        {(Object.keys(CLASS_KINDS) as ClassKind[]).map((kind) => {
          const list = ens.filter((e) => e.kind === kind && byId.has(e.kid_id));
          const inSet = new Set(list.map((e) => e.kid_id));
          return (
            <section key={kind} className="kcard" data-kind={kind}>
              <div className="khead">
                <span>{CLASS_KINDS[kind].icon} {CLASS_KINDS[kind].label}</span>
                <span className="small">{list.length}명{list.some((e) => !e.paid) ? ` · 입금 대기 ${list.filter((e) => !e.paid).length}` : ""}</span>
              </div>
              <div className="kbody">
                {list.length > 0 && (
                  <ul className="list">
                    {list.map((e) => {
                      const k = byId.get(e.kid_id)!;
                      return (
                        <li key={e.kid_id} className="kidrow">
                          <Avatar photoId={k.photo_id} name={k.name} size={28} />
                          <span style={{ flex: 1, minWidth: 0 }}>
                            <b>{k.name}</b>{isNew.has(k.id) && <span className="st new" style={{ marginLeft: 6 }}>신규</span>}
                            {k.caution && <span className="caution" title={k.caution}> ⚠ {k.caution}</span>}
                          </span>
                          <PaidToggle termId={id} kidId={k.id} kind={kind} paid={e.paid} />
                        </li>
                      );
                    })}
                  </ul>
                )}
                <details>
                  <summary className="small" style={{ cursor: "pointer" }}>{list.length ? "아이 더하기 · 빼기" : "+ 이 반에 아이 등록하기"}</summary>
                  <form action={setEnrollments.bind(null, id, kind)} className="stack" style={{ marginTop: 10 }}>
                    <div className="toggles">
                      {kids.map((k) => (
                        <label key={k.id}><input type="checkbox" name="kid" value={k.id} defaultChecked={inSet.has(k.id)} /> {k.name}</label>
                      ))}
                    </div>
                    <button className="btn ghost">저장</button>
                  </form>
                </details>
                <details>
                  <summary className="small" style={{ cursor: "pointer" }}>+ 처음 오는 아이 신규 등록</summary>
                  <form action={addNewKidToTerm.bind(null, id, kind)} className="stack" style={{ marginTop: 10 }}>
                    <input name="name" type="text" required placeholder="아이 이름 (성 포함) 예: 문서윤" aria-label="아이 이름" />
                    <div className="row" style={{ flexWrap: "nowrap" }}>
                      <select name="birth_year" defaultValue="" aria-label="출생연도" style={{ flex: 1 }}>
                        <option value="">출생연도</option>
                        {Array.from({ length: 14 }, (_, i) => new Date().getFullYear() - 3 - i).map((y) => (
                          <option key={y} value={y}>{String(y).slice(-2)}년생</option>
                        ))}
                      </select>
                      <div className="toggles">
                        <label><input type="radio" name="gender" value="F" /> 여아</label>
                        <label><input type="radio" name="gender" value="M" /> 남아</label>
                      </div>
                    </div>
                    <div className="row" style={{ flexWrap: "nowrap" }}>
                      <input name="phone" type="tel" inputMode="tel" placeholder="엄마 번호 010-0000-0000" aria-label="문자 받을 번호" style={{ flex: 1 }} />
                      <input name="guardian_label" type="text" defaultValue="어머님" aria-label="호칭" style={{ width: 90 }} />
                    </div>
                    <button className="btn">신규 등록</button>
                  </form>
                </details>
              </div>
            </section>
          );
        })}

        <details className="danger-zone">
          <summary>기수 이름·기간 고치기 / 지우기</summary>
          <form action={updateTerm.bind(null, id)} className="stack">
            <input name="name" type="text" defaultValue={term.name} aria-label="기수 이름" />
            <div className="row" style={{ flexWrap: "nowrap" }}>
              <input name="start_date" type="date" defaultValue={kstDateString(term.start_date)} aria-label="시작" />
              <input name="end_date" type="date" defaultValue={kstDateString(term.end_date)} aria-label="끝" />
            </div>
            <button className="btn ghost">저장</button>
          </form>
          <form action={deleteTerm.bind(null, id)} style={{ marginTop: 10 }}>
            <button className="btn danger small">이 기수 지우기 (등록·입금 기록도 지워져요)</button>
          </form>
        </details>
      </div>
    </main>
  );
}
