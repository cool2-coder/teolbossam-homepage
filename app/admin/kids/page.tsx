import { sql, type Kid } from "@/lib/db";
import { siteUrl, CLASS_KINDS, kindOf, kindLabel, kidInfo, callName, formatDate, type ClassKind } from "@/lib/brand";
import AdminTop from "@/components/AdminTop";
import CopyButton from "@/components/CopyButton";
import ProfilePhoto, { Avatar } from "@/components/ProfilePhoto";
import { addKid, updateKid, setKidActive } from "../actions";

export const dynamic = "force-dynamic";

const YEARS = Array.from({ length: 14 }, (_, i) => new Date().getFullYear() - 3 - i);

function KidFields({ kid }: { kid?: Kid }) {
  const p = kid?.id ?? "new";
  return (
    <>
      <div className="row" style={{ flexWrap: "nowrap" }}>
        <div className="field" style={{ flex: 1 }}>
          <label className="l" htmlFor={`name-${p}`}>아이 이름 (성 포함)</label>
          <input id={`name-${p}`} name="name" type="text" defaultValue={kid?.name} required placeholder="문서윤" />
        </div>
        <div className="field" style={{ width: 120 }}>
          <label className="l" htmlFor={`cn-${p}`}>부르는 이름</label>
          <input id={`cn-${p}`} name="call_name" type="text" defaultValue={kid?.call_name}
            placeholder={kid ? callName({ name: kid.name }) : "서윤"} />
        </div>
      </div>
      <span className="muted tiny" style={{ marginTop: -6 }}>
        부르는 이름을 비우면 맨 앞 한 글자(성)를 빼고 불러요. 일지와 문자에는 ‘서윤이의 숲 일지’처럼 나가요.
      </span>
      <div className="row" style={{ flexWrap: "nowrap" }}>
        <div className="field" style={{ flex: 1 }}>
          <label className="l" htmlFor={`by-${p}`}>출생연도</label>
          <select id={`by-${p}`} name="birth_year" defaultValue={kid?.birth_year ?? ""}>
            <option value="">모름</option>
            {YEARS.map((y) => <option key={y} value={y}>{y}년생</option>)}
          </select>
        </div>
        <div className="field">
          <span className="l">성별</span>
          <div className="toggles">
            <label><input type="radio" name="gender" value="F" defaultChecked={kid?.gender === "F"} /> 여</label>
            <label><input type="radio" name="gender" value="M" defaultChecked={kid?.gender === "M"} /> 남</label>
          </div>
        </div>
      </div>
      <div className="row" style={{ flexWrap: "nowrap" }}>
        <div className="field" style={{ flex: 1 }}>
          <label className="l" htmlFor={`phone-${p}`}>문자 받을 번호</label>
          <input id={`phone-${p}`} name="phone" type="tel" inputMode="tel" defaultValue={kid?.phone} placeholder="010-0000-0000" />
        </div>
        <div className="field" style={{ width: 100 }}>
          <label className="l" htmlFor={`gl-${p}`}>호칭</label>
          <input id={`gl-${p}`} name="guardian_label" type="text" defaultValue={kid?.guardian_label ?? "어머님"} />
        </div>
      </div>
      <div className="field">
        <span className="l">듣는 수업 (새 수업을 만들 때 자동으로 들어가요)</span>
        <div className="toggles">
          {Object.entries(CLASS_KINDS).map(([k, v]) => (
            <label key={k} data-kind={k}>
              <input type="checkbox" name="classes" value={k} defaultChecked={kid ? kid.classes.includes(k) : false} /> {v.icon} {v.label}
            </label>
          ))}
        </div>
      </div>
    </>
  );
}

type Done = { kid_id: string; id: string; kind: string; class_date: Date; topic: string };

export default async function Kids() {
  const kids = await sql<Kid[]>`select * from kids order by active desc, name`;
  const active = kids.filter((k) => k.active);
  const inactive = kids.filter((k) => !k.active);
  // Classes each child actually took part in (attended, and the class has happened or its journal is out).
  const done = await sql<Done[]>`
    select e.kid_id, w.id, w.kind, w.class_date, w.topic
    from entries e join weeks w on w.id = e.week_id
    where e.attended and (w.published_at is not null or w.class_date < (now() at time zone 'Asia/Seoul')::date)
    order by w.class_date desc`;
  const byKid = new Map<string, Done[]>();
  for (const d of done) byKid.set(d.kid_id, [...(byKid.get(d.kid_id) ?? []), d]);

  return (
    <main className="page">
      <AdminTop title={`아이 명단 ${active.length}명`} back="/admin" />
      <div className="pad">
        <details className="card">
          <summary><b>+ 아이 추가</b></summary>
          <form action={addKid} className="stack" style={{ marginTop: 10 }}>
            <KidFields />
            <button className="btn">추가하기</button>
          </form>
        </details>

        <ul className="list">
          {active.map((k) => {
            const hist = byKid.get(k.id) ?? [];
            const counts = (Object.keys(CLASS_KINDS) as ClassKind[])
              .map((kind) => [kind, hist.filter((h) => kindOf(h.kind) === kind).length] as const)
              .filter(([, n]) => n > 0);
            return (
              <li key={k.id}>
                <details>
                  <summary className="kidsum">
                    <div className="between">
                      <span className="row" style={{ flexWrap: "nowrap" }}>
                        <Avatar photoId={k.photo_id} name={k.name} size={36} />
                        <span><b>{k.name}</b> <span className="muted small">{kidInfo(k)}</span></span>
                      </span>
                      <span className="muted">›</span>
                    </div>
                    <div className="row">
                      {counts.length ? counts.map(([kind, n]) => (
                        <span key={kind} data-kind={kind} className="kchip">{CLASS_KINDS[kind].label} {n}</span>
                      )) : <span className="muted tiny">아직 참여한 수업 없음</span>}
                    </div>
                  </summary>
                  <div className="stack" style={{ paddingBottom: 14 }}>
                    <ProfilePhoto kidId={k.id} photoId={k.photo_id} name={k.name} />
                    {hist.length > 0 && (
                      <div className="card small">
                        <b>참여한 수업 {hist.length}번</b>
                        <ul className="list">
                          {hist.map((h) => (
                            <li key={h.id} data-kind={kindOf(h.kind)}>
                              <a className="item" href={`/admin/weeks/${h.id}`}>
                                <span><span className="kchip">{kindLabel(h.kind)}</span> {h.topic}</span>
                                <span className="muted tiny tnum">{formatDate(h.class_date)}</span>
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <div className="row">
                      <CopyButton text={`${siteUrl()}/j/${k.code}`} label="일지 링크 복사" />
                      <a className="btn ghost small" href={`/j/${k.code}`} target="_blank">일지 보기</a>
                    </div>
                    <form action={updateKid.bind(null, k.id)} className="stack">
                      <KidFields kid={k} />
                      <button className="btn">저장</button>
                    </form>
                    <form action={setKidActive.bind(null, k.id, false)}>
                      <button className="btn danger small">수업 그만둠 (명단에서 숨기기)</button>
                    </form>
                  </div>
                </details>
              </li>
            );
          })}
        </ul>

        {inactive.length > 0 && (
          <>
            <p className="sec">숨긴 아이</p>
            <ul className="list">
              {inactive.map((k) => (
                <li key={k.id} className="item">
                  <span className="muted">{k.name}</span>
                  <form action={setKidActive.bind(null, k.id, true)}><button className="btn ghost small">다시 추가</button></form>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </main>
  );
}
