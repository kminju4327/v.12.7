// 자동 보완(remediation) 프롬프트 빌더.
// 컴플라이언스 체크에서 needs_review가 나오면, 발견된 리스크를 반영해
// 콘텐츠를 한 번 자동 수정하도록 요청한다. (최대 1회)

import { buildGenerationConstraint } from "../compliance/categoryRules.js";
import { COMPLIANCE_RULES } from "../compliance/complianceRules.js";
import { buildNumericGuidance } from "./numericGuidance.js";
import { DETAIL_PAGE_SCHEMA } from "./generationPrompt.js";

export function buildRemediationPrompt(currentContent, flags, product) {
  const categoryConstraint = buildGenerationConstraint(product.category);
  const numericGuidance = buildNumericGuidance(product);

  return (
    `아래 상세페이지 콘텐츠에서, 명시된 리스크 항목들을 모두 제안된 방향으로 수정하세요. ` +
    `리스크와 무관한 나머지 내용과 톤은 최대한 그대로 유지하세요.

` +
    `원본 콘텐츠: ${JSON.stringify(currentContent)}

` +
    `수정해야 할 리스크 목록: ${JSON.stringify(flags)}

` +
    `[전체 규정 - 수정 시 새로운 위반이 생기지 않도록 참고]
${COMPLIANCE_RULES}

` +
    `제품 카테고리 제약: ${categoryConstraint}${numericGuidance}

` +
    `반드시 원본과 동일한 JSON 구조로 전체 콘텐츠를 반환하세요. 설명 없이 JSON만.
${DETAIL_PAGE_SCHEMA}`
  );
}
