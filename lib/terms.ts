import { sql, type Term } from "./db";

export type TermSummary = {
  kids: number;          // distinct children registered this term
  newKids: string[];     // first time ever registered
  returning: number;     // registered in an earlier term before
  unpaid: number;        // class registrations not yet paid
  prev?: Term;           // the term right before this one
  recontact: string[];   // previous term's children not registered this term
};

export async function termSummary(term: Pick<Term, "id" | "start_date">): Promise<TermSummary> {
  const rows = await sql<{ kid_id: string; returning: boolean; unpaid: number }[]>`
    select e.kid_id,
      exists (select 1 from enrollments e2 join terms t2 on t2.id = e2.term_id
              where e2.kid_id = e.kid_id and t2.start_date < ${term.start_date}) as returning,
      count(*) filter (where not e.paid)::int as unpaid
    from enrollments e join kids k on k.id = e.kid_id and k.active
    where e.term_id = ${term.id}
    group by e.kid_id`;
  const [prev] = await sql<Term[]>`select * from terms where start_date < ${term.start_date} order by start_date desc limit 1`;
  const recontact = prev
    ? (await sql<{ kid_id: string }[]>`
        select distinct e.kid_id from enrollments e join kids k on k.id = e.kid_id and k.active
        where e.term_id = ${prev.id}
          and e.kid_id not in (select kid_id from enrollments where term_id = ${term.id})`).map((r) => r.kid_id)
    : [];
  return {
    kids: rows.length,
    newKids: rows.filter((r) => !r.returning).map((r) => r.kid_id),
    returning: rows.filter((r) => r.returning).length,
    unpaid: rows.reduce((a, r) => a + r.unpaid, 0),
    prev,
    recontact,
  };
}
