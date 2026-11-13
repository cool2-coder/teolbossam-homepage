import { notFound } from "next/navigation";
import { sql, isUuid, type Term } from "@/lib/db";
import { CLASS_KINDS, formatDate, kstDateString, type ClassKind } from "@/lib/brand";
import AdminTop from "@/components/AdminTop";
import PaidToggle from "@/components/PaidToggle";
import { Avatar } from "@/components/ProfilePhoto";
import { setEnrollments, updateTerm, deleteTerm } from "../../actions";

export const dynamic = "force-dynamic";

type En = { kid_id: string; kind: string; paid: boolean };
type K = { id: string; name: string; phone: string; guardian_label: string; caution: string; photo_id: string | null };

export default async function TermPage({ params, searchParams }: {
  params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string }>;
}) {
  const { id } = await params;
  const { saved } = await searchParams;
  if (!isUuid(id)) notFound();
  const [term] = await sql<Term[]>`select * from terms where id = ${id}`;
  if (!term) notFound();
  const ens = await sql<En[]>`select kid_id, kind, paid from enrollments where term_id = ${id}`;
  const kids = await sql<K[]>`select id, name, phone, guardian_label, caution, photo_id from kids where active order by name`;
  const byId = new Map(kids.map((k) => [k.id, k]));
  // Families from the previous term who haven't registered for this one yet.
  const [prev] = await sql<Term[]>`select * from terms where start_date < ${term.start_date} order by start_date desc limit 1`;
  const prevKids = prev
    ? await sql<{ kid_id: string }[]>`select distinct kid_id from enrollments where term_id = ${prev.id}
        and kid_id not in (select kid_id from enrollments where term_id = ${id})`
    : [];
  const kidCount = new Set(ens.map((e) => e.kid_id)).size;
  const unpaid = ens.filter((e) => !e.paid).length;

  return (
    <main className="page">
      <AdminTop title={term.name} back="/admin/terms" />
      <div className="pad">
        <div className="card">
          <span className="muted small tnum">{formatDate(term.start_date)} ~ {formatDate(term.end_date)}</span>
          <div className="row small tnum">
            <span className="st ok">등록 {kidCount}명</span>
            <span className={`st ${unpaid ? "wait" : "ok"}`}>입금 대기 {unpaid}</span>
            {prev && <span className={`st ${prevKids.length ? "wait" : "ok"}`}>재등록 연락 {prevKids.length}</span>}
          </div>
          <span className="muted tiny">반에 등록한 아이는 이 기간의 그 반 수업 명단에 자동으로 들어가요.</span>
        </div>
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
                            <b>{k.name}</b>
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
              </div>
            </section>
          );
        })}

        {prev && (
          <>
            <p className="sec">재등록 연락 ({prev.name}에는 있었는데 아직 등록 안 한 가족)</p>
            {prevKids.length === 0 ? (
              <div className="card small">지난 기수 가족이 모두 다시 등록했어요.</div>
            ) : (
              <ul className="list">
                {prevKids.map(({ kid_id }) => {
                  const k = byId.get(kid_id);
                  if (!k) return null;
                  return (
                    <li key={kid_id} className="item">
                      <span><b>{k.name}</b> <span className="muted small">{k.guardian_label} · {k.phone || "번호 없음"}</span></span>
                      {k.phone && <a className="btn ghost small" href={`sms:${k.phone.replace(/[^\d+]/g, "")}`}>문자</a>}
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        )}

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
