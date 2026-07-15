import { normalizeSectionItems } from "./sectionItem";

// 생성된 상세페이지(draft 객체)를 클립보드 복사용 평문 텍스트로 변환한다.
// 헤드라인 → 서브카피 → 각 섹션(제목/본문/리스트) 순서로 정리한다.

export function draftToPlainText(draft) {
  if (!draft) return "";
  const lines = [draft.hero_headline, draft.hero_subcopy, ""];
  draft.sections?.forEach((s) => {
    if (s.title) lines.push(s.title);
    if (s.body) lines.push(s.body);
    if (s.items) lines.push(...normalizeSectionItems(s.items).map((it) => "- " + it));
    lines.push("");
  });
  return lines.join("\n");
}
