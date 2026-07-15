// 부분 재생성(regenerate) 프롬프트 빌더.
// 사용자가 특정 섹션(또는 hero)의 "다시 생성" 버튼을 눌렀을 때,
// 나머지 콘텐츠의 톤/맥락을 유지하면서 지정된 필드만 다시 작성하도록 요청한다.
//
// feedback 인자가 있으면(자연어 수정 요청), 그 요청을 반드시 반영하도록 지시한다.
// 예: "더 짧게", "첫 문장만 강하게", "이모지 빼고"

import { buildGenerationConstraint } from "../compliance/categoryRules.js";

export function buildRegeneratePrompt(draft, target, product, feedback = "") {
  const categoryConstraint = buildGenerationConstraint(product.category);
  const feedbackLine = feedback
    ? `

[사용자 수정 요청] 다음 요청을 반드시 반영해서 다시 쓰세요: "${feedback}"`
    : "";
  return (
    `아래는 상세페이지의 나머지 확정된 콘텐츠입니다. 이 톤과 맥락을 유지하면서, 지정된 필드만 다시 작성하세요.

` +
    `전체 콘텐츠: ${JSON.stringify(draft)}

` +
    `다시 작성할 대상: ${JSON.stringify(target)}

` +
    `제품 카테고리 제약: ${categoryConstraint}${feedbackLine}

` +
    `반드시 대상과 동일한 JSON 구조로만, 새로 작성된 내용을 반환하세요. 설명 없이 JSON만.`
  );
}
