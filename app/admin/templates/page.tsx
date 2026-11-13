import { getTemplates, TEMPLATES, VAR_HELP, fill, type TemplateKey } from "@/lib/templates";
import AdminTop from "@/components/AdminTop";
import { saveTemplate, resetTemplate } from "../actions";

export const dynamic = "force-dynamic";

const EXAMPLE = {
  이름: "서윤", 아이: "서윤이", 호칭: "어머님", 주제: "사마귀 알집 찾기 탐험대", 날짜: "11월 15일 토",
  기수: "11·12월 숲", 링크: "https://teolbossam.netlify.app/j/…",
};

export default async function Templates({ searchParams }: { searchParams: Promise<{ saved?: string; reset?: string }> }) {
  const q = await searchParams;
  const t = await getTemplates();
  return (
    <main className="page">
      <AdminTop title="문자 문구 고치기" back="/admin" />
      <div className="pad">
        <p className="muted small" style={{ margin: 0 }}>
          사이트가 보내는 모든 문자의 기본 문구예요. 고쳐서 저장하면 다음 문자부터 바뀌어요.
          중괄호 안의 말은 아이마다 자동으로 바뀌어요.
        </p>
        {(Object.keys(TEMPLATES) as TemplateKey[]).map((key) => {
          const meta = TEMPLATES[key];
          const changed = t[key] !== meta.text;
          return (
            <section key={key} id={key} className="card">
              <div className="between">
                <b>{meta.title}</b>
                {changed && <span className="st ok">고친 문구</span>}
              </div>
              <span className="muted tiny">{meta.help}</span>
              {q.saved === key && <div className="flash">저장했어요.</div>}
              {q.reset === key && <div className="flash">처음 문구로 되돌렸어요.</div>}
              <form action={saveTemplate.bind(null, key)} className="stack">
                <textarea key={t[key]} id={`tpl-${key}`} name="text" defaultValue={t[key]} style={{ minHeight: 140 }} aria-label={meta.title} />
                <div className="row">
                  {meta.vars.map((v) => (
                    <span key={v} className="chip" title={VAR_HELP[v]}>{`{${v}}`} {VAR_HELP[v]}</span>
                  ))}
                </div>
                <button className="btn ghost">저장</button>
              </form>
              <details>
                <summary className="small" style={{ cursor: "pointer" }}>미리 보기 (서윤이 예시)</summary>
                <p className="small" style={{ whiteSpace: "pre-line", margin: "8px 0 0", background: "var(--screen)", borderRadius: 10, padding: 10 }}>
                  {key === "notice" ? "(붙여 넣은 수업 안내문)\n\n" : ""}{fill(t[key], EXAMPLE)}
                </p>
              </details>
              {changed && (
                <form action={resetTemplate.bind(null, key)}>
                  <button className="btn ghost small">처음 문구로 되돌리기</button>
                </form>
              )}
            </section>
          );
        })}
      </div>
    </main>
  );
}
