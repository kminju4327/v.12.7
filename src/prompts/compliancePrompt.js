// 컴플라이언스 체크 프롬프트 빌더.
// 생성된 상세페이지 콘텐츠를 표시광고 규정 관점에서 검토하도록 요청한다.

import { buildComplianceFocus } from "../compliance/categoryRules.js";
import { COMPLIANCE_RULES } from "../compliance/complianceRules.js";

// 컴플라이언스 결과 JSON 스키마
export const COMPLIANCE_SCHEMA = `{"flags": [{"field": "string", "flagged_text": "string", "violation_type": "string", "risk_level": "high/medium/low", "suggested_revision": "string"}], "overall_status": "pass/needs_review"}`;

export function buildCompliancePrompt(content, category) {
  const complianceFocus = buildComplianceFocus(category);
  return (
    `아래 상세페이지 콘텐츠를 건강기능식품 표시·광고 규정(식품 등의 표시·광고에 관한 법률 제8조) 관점에서 검토하세요.
` +
    `${JSON.stringify(content)}

` +
    `제품 카테고리: ${category}

` +
    `[체크 규칙]
${COMPLIANCE_RULES}

` +
    `[이 카테고리에서 특히 주의해서 볼 부분]
${complianceFocus}

` +
    `각 항목의 suggested_revision은 1문장 이내로 간결하게 쓰세요.

` +
    `반드시 아래 JSON 형식으로만 답하세요.
${COMPLIANCE_SCHEMA}`
  );
}
