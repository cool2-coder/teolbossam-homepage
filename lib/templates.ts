import { sql } from "./db";

/** Every default text the site sends. The teacher can rewrite each one (stored in settings as msg_<key>). */
export const TEMPLATES = {
  notice: {
    title: "수업 전 안내 (안내문 아래에 붙는 말)",
    help: "수업마다 붙여 넣은 안내문 바로 아래에 이 말이 붙어서 나가요.",
    vars: ["아이", "이름", "호칭", "주제", "날짜", "링크"],
    text: "▶ {아이} 참석 여부를 눌러 주세요\n{링크}",
  },
  notice_plain: {
    title: "수업 전 안내 (안내문이 비어 있을 때)",
    help: "수업에 안내문을 안 넣었을 때 대신 나가는 문구예요.",
    vars: ["아이", "이름", "호칭", "주제", "날짜", "링크"],
    text: "[털보쌤 숲체험] {이름} {호칭}, 이번 숲체험 안내드려요.\n일시: {날짜}\n주제: {주제}\n참석 여부를 눌러 주세요.\n{링크}",
  },
  publish: {
    title: "일지 알림 (수업 후)",
    help: "일지를 발행하고 [문자 보내기]를 누를 때 나가요.",
    vars: ["아이", "이름", "호칭", "주제", "날짜", "링크"],
    text:
      "[털보쌤 숲체험] {아이}의 오늘 숲 일지가 올라왔어요 🌳\n‘{주제}’ 시간에 찍은 사진과 털보쌤 이야기를 보러 와 주세요.\n" +
      "집에서 아이에게 한마디 들으시면 답장도 남겨 주세요 ^^\n{링크}",
  },
  remind: {
    title: "답장 재알림",
    help: "일지에 아직 답장하지 않은 가족에게 보내요.",
    vars: ["아이", "이름", "호칭", "주제", "날짜", "링크"],
    text:
      "[털보쌤 숲체험] {아이}는 ‘{주제}’ 이야기를 집에서도 했을까요? 🙂\n" +
      "편하실 때 숲 일지에 한마디 남겨 주시면 털보쌤이 반갑게 읽을게요.\n{링크}",
  },
  recontact: {
    title: "재등록 연락",
    help: "기수 화면의 [재등록 연락드리기]에서 보내요. 기수마다 따로 고친 문구가 있으면 그게 먼저 쓰여요.",
    vars: ["아이", "이름", "호칭", "기수"],
    text:
      "[털보쌤 숲체험] {이름} {호칭}, 안녕하세요 🌳\n{기수} 모집을 시작했어요.\n" +
      "지난 기수 함께해 주셔서 정말 고마웠어요. 이번에도 {아이}와 숲에서 만나고 싶어요.\n편하실 때 참여 여부 알려 주세요 ^^",
  },
} as const;

export type TemplateKey = keyof typeof TEMPLATES;
export type Templates = Record<TemplateKey, string>;

export const VAR_HELP: Record<string, string> = {
  아이: "서윤이 (부르는 말)", 이름: "서윤", 호칭: "어머님", 주제: "수업 주제", 날짜: "11월 15일 토", 링크: "아이 일지 링크", 기수: "11·12월 숲",
};

export async function getTemplates(): Promise<Templates> {
  const rows = await sql<{ key: string; value: string }[]>`select key, value from settings where key like 'msg_%'`;
  const saved = Object.fromEntries(rows.map((r) => [r.key.slice(4), r.value]));
  return Object.fromEntries(
    (Object.keys(TEMPLATES) as TemplateKey[]).map((k) => [k, saved[k]?.trim() ? saved[k] : TEMPLATES[k].text]),
  ) as Templates;
}

export function fill(tpl: string, vars: Record<string, string>) {
  return tpl.replace(/\{(아이|이름|호칭|주제|날짜|링크|기수)\}/g, (m, k) => vars[k] ?? m);
}
