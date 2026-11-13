import Link from "next/link";
import { sql, type Term } from "@/lib/db";
import { formatDate, kstDateString } from "@/lib/brand";
import AdminTop from "@/components/AdminTop";
import { createTerm } from "../actions";
import { termSummary } from "@/lib/terms";

export const dynamic = "force-dynamic";

export default async function Terms() {
  const terms = await sql<(Term & { kids: number; unpaid: number })[]>`
    select t.*,
      (select count(distinct kid_id)::int from enrollments e where e.term_id = t.id) as kids,
      (select count(*)::int from enrollments e where e.term_id = t.id and not e.paid) as unpaid
    from terms t order by start_date desc`;
  const sums = await Promise.all(terms.map((t) => termSummary(t)));
  const today = new Date();
  const m = new Date(today.getFullYear(), today.getMonth(), 1);
  const end = new Date(today.getFullYear(), today.getMonth() + 2, 0);
  return (
    <main className="page">
      <AdminTop title="모집 기수" back="/admin" />
      <div className="pad">
        <ul className="list">
          {terms.map((t, i) => (
            <li key={t.id}>
              <Link className="item" href={`/admin/terms/${t.id}`}>
                <span><b>{t.name}</b> <span className="muted small tnum">{formatDate(t.start_date)} ~ {formatDate(t.end_date)}</span></span>
                <span className="row small tnum" style={{ justifyContent: "flex-end" }}>
                  <span className="muted">{t.kids}명</span>
                  <span className="st new">신규 {sums[i].newKids.length}</span>
                  <span className="st ok">재등록 {sums[i].returning}</span>
                  {t.unpaid > 0 && <span className="st wait">입금 대기 {t.unpaid}</span>}
                </span>
              </Link>
            </li>
          ))}
        </ul>
        {terms.length === 0 && <p className="muted small">아직 기수가 없어요. 이번 모집부터 만들어 보세요.</p>}

        <details className="card" open={terms.length === 0}>
          <summary><b>+ 새 기수 만들기</b></summary>
          <form action={createTerm} className="stack" style={{ marginTop: 10 }}>
            <div className="field">
              <label className="l" htmlFor="name">기수 이름</label>
              <input id="name" name="name" type="text" required placeholder="11·12월 숲" />
            </div>
            <div className="row" style={{ flexWrap: "nowrap" }}>
              <div className="field" style={{ flex: 1 }}>
                <label className="l" htmlFor="start_date">시작</label>
                <input id="start_date" name="start_date" type="date" required defaultValue={kstDateString(m)} />
              </div>
              <div className="field" style={{ flex: 1 }}>
                <label className="l" htmlFor="end_date">끝</label>
                <input id="end_date" name="end_date" type="date" required defaultValue={kstDateString(end)} />
              </div>
            </div>
            <button className="btn">만들기</button>
          </form>
        </details>
      </div>
    </main>
  );
}
