import { sql, type Kid } from "@/lib/db";
import { siteUrl } from "@/lib/brand";
import AdminTop from "@/components/AdminTop";
import CopyButton from "@/components/CopyButton";
import { addKid, updateKid, setKidActive } from "../actions";

export const dynamic = "force-dynamic";

function KidFields({ kid }: { kid?: Kid }) {
  const p = kid?.id ?? "new";
  return (
    <>
      <div className="row" style={{ flexWrap: "nowrap" }}>
        <div className="field" style={{ flex: 1 }}>
          <label className="l" htmlFor={`name-${p}`}>아이 이름</label>
          <input id={`name-${p}`} name="name" type="text" defaultValue={kid?.name} required placeholder="민준" />
        </div>
        <div className="field" style={{ width: 110 }}>
          <label className="l" htmlFor={`gl-${p}`}>호칭</label>
          <input id={`gl-${p}`} name="guardian_label" type="text" defaultValue={kid?.guardian_label ?? "어머님"} />
        </div>
      </div>
      <div className="field">
        <label className="l" htmlFor={`phone-${p}`}>문자 받을 번호</label>
        <input id={`phone-${p}`} name="phone" type="tel" inputMode="tel" defaultValue={kid?.phone} placeholder="010-0000-0000" />
      </div>
    </>
  );
}

export default async function Kids() {
  const kids = await sql<Kid[]>`select * from kids order by active desc, name`;
  const active = kids.filter((k) => k.active);
  const inactive = kids.filter((k) => !k.active);

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
          {active.map((k) => (
            <li key={k.id}>
              <details>
                <summary className="item">
                  <span><b>{k.name}</b> <span className="muted small">{k.guardian_label} · {k.phone || "번호 없음"}</span></span>
                  <span className="muted">›</span>
                </summary>
                <div className="stack" style={{ paddingBottom: 14 }}>
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
          ))}
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
