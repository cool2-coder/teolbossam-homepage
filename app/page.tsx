import Link from "next/link";
import "./home.css";

const VALUES = [
  ["자연", "자연을 가까이 만나고 작은 생명과 관계를 맺습니다."],
  ["가족", "가족이 함께 자연을 경험하며 서로를 이해하고 교감합니다."],
  ["모험", "낯선 것에 호기심을 갖고 스스로 도전합니다."],
  ["성장", "시도하고 기다리며 자신의 힘으로 해내는 경험을 쌓습니다."],
  ["감사", "자연과 함께하는 사람들의 소중함을 느낍니다."],
];

const POWERS = [
  ["관찰력", "자세히 보고 변화를 알아차리는 힘", "자연의 색과 모양, 움직임을 살펴보며 지나쳤던 특징과 차이를 발견합니다."],
  ["기록력", "자신의 발견을 남기는 힘", "보고 느낀 것을 글과 그림으로 기록하고, 쌓인 기록을 통해 변화를 돌아봅니다."],
  ["지속력", "기다리며 꾸준히 이어 가는 힘", "식물을 돌보며 결과가 바로 나타나지 않아도 관심을 갖고 지켜보는 경험을 합니다."],
  ["사고력", "스스로 질문하고 이유를 찾는 힘", "“왜 그럴까?”를 묻고, 관찰한 것을 바탕으로 자신의 생각을 펼칩니다."],
  ["완성력", "생각을 표현하고 끝까지 해 보는 힘", "관찰과 생각을 만들기로 연결하며 자신의 손으로 완성하는 경험을 쌓습니다."],
];

export default function Home() {
  return (
    <main className="home">
      <section className="hero">
        <small>털보쌤 숲체험</small>
        <blockquote>숲은 놀이터이면서<br />동시에 인생학교이다.</blockquote>
        <p>
          털보쌤 숲체험은 아이들이 자연 속에서 스스로 발견하고, 도전하고, 함께하며 성장하도록 돕는 교육
          브랜드입니다. 숲에서 마음껏 놀고 탐험하는 경험을 바탕으로, 자연을 이해하는 지식과 삶에 필요한
          태도를 함께 길러 갑니다.
        </p>
      </section>

      <section>
        <span className="eyebrow">브랜드의 시작</span>
        <h2>동네 숲을 아이들의 놀이터이자 배움터로</h2>
        <p>
          가까이 있지만 자주 찾지 않는 동네 숲에서 시작했습니다. 아이들이 일상 가까이에서 자연을 만나고, 직접
          느끼며 뛰어놀 수 있는 시간을 마련합니다.
        </p>
      </section>

      <section className="soft">
        <span className="eyebrow">교육의 핵심가치</span>
        <h2>다섯 가지 마음</h2>
        <div className="values">
          {VALUES.map(([t, d]) => (
            <div key={t}>
              <b>{t}</b>
              <span>{d}</span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <span className="eyebrow">수업에서 기르는 힘 · 시즌2</span>
        <h2>자연과학 관찰, 식물키트, 워크북으로 기르는 다섯 가지 힘</h2>
        <ul className="powers">
          {POWERS.map(([t, s, d]) => (
            <li key={t}>
              <b>{t}</b>
              <strong>{s}</strong>
              <span>{d}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="future">
        <span className="eyebrow">10년 후를 생각하는 털보쌤 숲체험</span>
        <h2>오늘 숲에서의 경험이 내일을 살아가는 힘으로</h2>
        <p>
          오늘 숲에서 발견하고, 도전하고, 기다려 본 경험이 아이의 내일을 살아가는 힘으로 이어지기를 바랍니다.
          자연을 알아가는 과정 속에서 스스로 생각하고 행동하며, 함께하는 존재를 소중히 여기는 아이로 성장하도록
          돕겠습니다.
        </p>
      </section>

      <section className="soft">
        <span className="eyebrow">참여 가족 안내</span>
        <h2>우리 아이 숲 일지</h2>
        <p>
          수업이 끝나면 문자로 아이별 숲 일지 링크를 보내 드려요. 링크를 누르면 로그인 없이 수업 사진과 털보쌤
          한마디, 이번 주 집 미션을 보고 답장을 남길 수 있어요.
        </p>
      </section>

      <footer>
        <span>© 털보쌤 숲체험</span>
        <Link href="/admin">털보쌤 관리</Link>
      </footer>
    </main>
  );
}
