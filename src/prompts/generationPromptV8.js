// BRAND ENGINE V8 Generation Prompt - Phase 2 (Improved)
// 2단계 프로세스: Step 1 분석 → Step 2 글쓰기
// 목표: Product Knowledge 중심으로 제품별 차별화된 상세페이지 생성

import { buildGenerationConstraint } from "../compliance/categoryRules.js";
import { buildProductBlock, buildNumericGuidance } from "./numericGuidance.js";
import { getProductKnowledge, getSafeProductFeatures } from "../data/productKnowledge.js";
import { GENERAL_HEALTH_FOOD_BRAIN_V6 } from "../brains/generalHealthFood/brain.js";
import { GENERAL_HEALTH_FOOD_TEMPLATE } from "../brains/generalHealthFood/template.js";
import { HEALTH_FUNCTIONAL_FOOD_BRAIN_V6 } from "../brains/healthFunctionalFood/brain.js";
import { HEALTH_FUNCTIONAL_FOOD_TEMPLATE } from "../brains/healthFunctionalFood/template.js";

const safeList = (value) => (Array.isArray(value) ? value.filter(Boolean) : []);

function selectBrainAndTemplate(product) {
  const functional = product.category === "건강기능식품";
  const brain = functional ? HEALTH_FUNCTIONAL_FOOD_BRAIN_V6 : GENERAL_HEALTH_FOOD_BRAIN_V6;
  const template = functional ? HEALTH_FUNCTIONAL_FOOD_TEMPLATE : GENERAL_HEALTH_FOOD_TEMPLATE;

  const structure = safeList(template.structure)
    .map((s, i) => {
      const id = s.sectionId || s.id || `section_${i + 1}`;
      const goal = s.goal || s.purpose || "";
      const role = s.role || "";
      return `${i + 1}. ${id}: ${goal}${role ? ` / 역할: ${role}` : ""}`;
    })
    .join("\n");

  const principles = safeList(brain.corePrinciple?.rules)
    .map((r) => `- ${r.principle || r}`)
    .join("\n");

  const recognition = {
    type: functional ? "HEALTH_FUNCTIONAL" : "GENERAL_HEALTH_FOOD",
    confidence: 100,
    reason: `사용자가 "${product.category}"로 선택함`
  };

  return { recognition, brain, structure, principles, template };
}

// ============================================================
// STEP 1: 제품 분석 프롬프트
// ============================================================

export function buildProductAnalysisPrompt(product) {
  const { brain, principles } = selectBrainAndTemplate(product);
  const productKnowledge = getProductKnowledge(product.name);
  const categoryConstraint = buildGenerationConstraint(product.category);
  
  const productBlock = buildProductBlock({
    ...product,
    benefits: product.benefits || "미입력"
  });

  let knowledgeBlock = `[${product.name} 기본 정보]
특징: ${productKnowledge?.commonQualities ? safeList(productKnowledge.commonQualities).join(", ") : "기본 원료"}
사용처: ${productKnowledge?.commonUsages ? safeList(productKnowledge.commonUsages).join(", ") : "일반적 용도"}`;

  if (productKnowledge) {
    knowledgeBlock += `

[${product.name} 판매 전략 정보 (매우 중요)]

판매 전략 유형: ${productKnowledge.salesStrategy || "기본"}
→ 이것이 상세페이지의 기조를 결정합니다.

구매자의 심리 상태: ${productKnowledge.buyerPsychology || "제품을 구매하려는 고객"}
→ 고객의 감정 상태와 의사결정 프로세스를 이해하세요.

차별화 포인트:
${safeList(productKnowledge.differentiators).map((d, i) => `${i + 1}. ${d}`).join("\n")}
→ 경쟁사와 다른 이 제품만의 강점입니다.

고객이 가장 궁금해하는 것:
${safeList(productKnowledge.topCuriosity).map((q, i) => `${i + 1}. ${q}`).join("\n")}
→ 상세페이지 어딘가에 반드시 답변이 있어야 합니다.

제품의 톤: ${productKnowledge.copytone || "자연스러운"}
→ 모든 표현이 이 톤을 유지해야 합니다.

각 섹션별로 강조할 내용:
${productKnowledge.sectionEmphasis ? Object.entries(productKnowledge.sectionEmphasis)
  .map(([section, emphasis]) => `${section.toUpperCase()}: ${emphasis}`)
  .join("\n") : "표준 구조"}
→ 각 섹션을 작성할 때 이 지침을 따르세요.
`;
  }

  return `당신은 한국 이커머스 제품 전략 분석가입니다.

아래 제품 정보를 읽고, 이 제품의 최고의 판매 전략을 도출하세요.
특히 [Product Knowledge]를 반드시 고려하세요.

===================================================================

${productBlock}

${knowledgeBlock}

===================================================================
[분석 질문]
===================================================================

아래 5개 질문에 대해 깊이 있게 답변하세요:

1. 핵심 구매 이유
"${product.name}는 왜 구매되는가?"

${productKnowledge?.buyerPsychology ? `
참고: 이 제품의 구매자는 "${productKnowledge.buyerPsychology}"입니다.
` : ""}

생각해야 할 것:
- 이 제품을 찾는 고객의 가장 강력한 구매 동기는?
- 다른 제품 대신 이 제품을 선택하는 핵심 이유는?
- 고객이 첫번째로 느끼는 이점은?

2. 고객 심리 분석
"${product.name}를 찾는 고객의 심리는?"

${productKnowledge?.topCuriosity ? `
참고: 고객이 가장 궁금한 것은 ${safeList(productKnowledge.topCuriosity).slice(0, 2).map(q => `"${q}"`).join(", ")}입니다.
` : ""}

생각해야 할 것:
- 고객이 이 제품을 찾을 때 어떤 감정 상태인가?
- 고객의 주요 불안감이나 고민은?
- 고객이 찾는 안심 신호는?

3. 고객 궁금증
"고객이 가장 먼저 알고 싶은 것은?"

${productKnowledge?.differentiators ? `
참고: 이 제품의 차별화 포인트는 ${safeList(productKnowledge.differentiators).slice(0, 2).join(", ")}입니다.
` : ""}

생각해야 할 것:
- 고객의 Top 3 질문은?
- 구매 결정을 막는 장애물은?
- 가장 확인하고 싶은 정보는?

4. 차별화 전략
"이 제품만의 우위는 무엇인가?"

${productKnowledge?.salesStrategy ? `
참고: 판매 전략이 "${productKnowledge.salesStrategy}"이므로, 이에 맞는 차별화 포인트를 찾으세요.
` : ""}

생각해야 할 것:
- 경쟁 제품과의 구체적 차이점은?
- 이 제품만 할 수 있는 것은?
- 고객에게 가장 와닿을 만한 차별 요소는?

5. 최적 섹션 순서
"어떤 순서로 보여주면 구매 전환이 높을까?"

${productKnowledge?.sectionEmphasis ? `
참고: 각 섹션에서는 다음을 강조해야 합니다:
${Object.entries(productKnowledge.sectionEmphasis).map(([s, e]) => `- ${s}: ${e}`).join("\n")}
` : ""}

생각해야 할 것:
- 첫 섹션이 고객에게 어떤 영향을 미쳐야 하는가?
- 중간 섹션들의 목적은?
- 마지막 섹션이 만들어야 할 심리 상태는?

===================================================================
[제약사항]
===================================================================

${categoryConstraint}

===================================================================
[출력 지시]
===================================================================

반드시 아래의 JSON 형식으로만 답하세요. 설명은 하지 마세요.

{
  "coreValue": "제품의 핵심 구매 이유를 한 문장으로 (감정 포함)",
  "customerPsychology": "고객의 심리 상태와 감정 (구체적이고 현실적)",
  "topCuriosity": ["가장 중요한 질문 1", "질문 2", "질문 3"],
  "differentiation": "이 제품만의 차별화 포인트 (구체적)",
  "optimalSequence": [
    "첫 섹션: 고객의 감정에 도달하는 부분",
    "두 번째: 핵심 문제를 인식시키는 부분",
    "세 번째: 해결책과 차별화를 보여주는 부분",
    "네 번째: 신뢰감을 구축하는 부분",
    "다섯 번째: 구매 행동을 자연스럽게 유도"
  ],
  "salesStrategy": "이 제품에 가장 효과적인 판매 전략 (한 문단, 구체적)",
  "emotionalJourney": "고객이 거쳐야 할 감정 변화: '???' → '그래?' → '어?' → '오!' → '해야겠다'",
  "keyMessages": [
    "전달해야 할 핵심 메시지 1",
    "핵심 메시지 2",
    "핵심 메시지 3"
  ],
  "avoidMessages": [
    "절대 강조하면 안 되는 것 1",
    "절대 강조하면 안 되는 것 2"
  ]
}`;
}

// ============================================================
// STEP 2: 분석 결과를 기반으로 상세페이지 생성
// Product Knowledge 중심의 완전히 새로운 프롬프트
// ============================================================

export function buildDetailPageGenerationPrompt(product, analysis) {
  const { brain, structure, principles, template } = selectBrainAndTemplate(product);
  const isFunctional = product.category === "건강기능식품";
  const categoryConstraint = buildGenerationConstraint(product.category);
  
  const productBlock = buildProductBlock({
    ...product,
    benefits: product.benefits || "미입력"
  });

  const numericGuidance =
    product.purity || product.actualAmount || product.epa || product.dha
      ? buildNumericGuidance(product)
      : "";

  const productKnowledge = getProductKnowledge(product.name);

  // ============================================================
  // 핵심: Product Knowledge를 프롬프트의 중심에 배치
  // ============================================================
  let strategyBlock = `[제품 맞춤 판매 전략 (이것을 가장 먼저 읽으세요)]`;
  
  if (productKnowledge) {
    strategyBlock += `

판매 전략 유형: ${productKnowledge.salesStrategy || "기본"}

구매자의 심리 상태:
${productKnowledge.buyerPsychology || "제품을 구매하려는 고객"}

제품의 핵심 특징:
${safeList(productKnowledge.commonQualities).map((q, i) => `${i + 1}. ${q}`).join("\n")}

고객이 이 제품에서 가장 궁금해하는 것:
${safeList(productKnowledge.topCuriosity).map((q, i) => `${i + 1}. ${q}`).join("\n")}

경쟁사와의 차별화 포인트:
${safeList(productKnowledge.differentiators).map((d, i) => `${i + 1}. ${d}`).join("\n")}

제품의 톤: ${productKnowledge.copytone || "자연스러운"}

섹션별 강조 내용 (각 섹션을 작성할 때 이것을 기준으로):
${productKnowledge.sectionEmphasis ? Object.entries(productKnowledge.sectionEmphasis)
  .map(([section, emphasis]) => `
${section.toUpperCase()} 섹션:
→ ${emphasis}
`).join("\n") : "표준 섹션 역할"}
`;
  } else {
    strategyBlock += `
기본 판매 전략: 제품의 강점과 신뢰성 중심
`;
  }

  // AI 설계 결과
  let pageDesignBlock = "";
  let pageStructureGuide = "";
  
  if (product.pageDesign) {
    const designSections = safeList(product.pageDesign.pageStructure);
    if (designSections.length > 0) {
      pageStructureGuide = `
[⭐ 페이지 구성 순서 (AI 설계 기반)]
${designSections.map((s, i) => `${i + 1}. ${s}`).join("\n")}
`;
    }

    pageDesignBlock = `
[이미지 전략]
${safeList(product.pageDesign.recommendedImages).map((img, i) => `${i + 1}. ${img}`).join("\n") || "각 섹션에 맞는 시각 자료"}

[강조할 특징]
${safeList(product.pageDesign.productFeatures).map((f, i) => `${i + 1}. ${f}`).join("\n")}

[설득 포인트]
${safeList(product.pageDesign.persuasionPoints).map((p, i) => `${i + 1}. ${p}`).join("\n")}
`;
  }

  return `당신은 한국 이커머스의 최고급 카피라이터이자 상세페이지 기획자입니다.

아래 순서대로 읽고 "${product.name}"이라는 제품을 충분히 이해한 후, 사람이 직접 기획한 상세페이지를 작성하세요.

===================================================================
[제1단계] 제품 깊이 이해
===================================================================

${strategyBlock}

[AI 분석 결과]
제품의 핵심 가치: ${analysis.coreValue}
구매자의 심리: ${analysis.customerPsychology}
차별화 전략: ${analysis.differentiation}

가장 중요한 정보 (이 3가지를 반드시 포함):
${safeList(analysis.topCuriosity).map((q, i) => `${i + 1}. ${q}`).join("\n")}

감정 여정 (고객이 겪어야 하는 감정 변화):
${analysis.emotionalJourney}

===================================================================
[제2단계] 페이지 구성 (레이아웃만 참고)
===================================================================

${pageStructureGuide}

${pageDesignBlock}

[기본 Template 구조 참고]
${structure}

===================================================================
[제3단계] 글쓰기 규칙
===================================================================

[원칙]
${principles || "- 확인 가능한 정보로만 설득한다."}
톤: ${brain.copyTone || "신뢰감 있는 톤"}

[제약사항]
${categoryConstraint}

${numericGuidance}

===================================================================
[제4단계] 섹션별 작성 지침 (가장 중요)
===================================================================

당신은 Template를 채우는 것이 아니라, 제품을 기획하는 기획자입니다.

▶ Hero 섹션 작성:
  지침: "${productKnowledge?.sectionEmphasis?.hero || "고객의 감정에 공감하고 제품 가치 제시"}"
  목표: 고객의 감정을 흔들고 이 제품의 존재를 알게 하기
  필수 포함: ${safeList(analysis.topCuriosity).slice(0, 1).join("")}
  작성법: 한 문장으로 제품의 핵심 가치 + 감정 표현

▶ 다음 섹션들 작성:
  지침: 각 섹션의 강조 내용에 따라 다르게 작성
  필수 원칙:
  - 단순히 제품 정보가 아니라 고객 관점에서 필요한 이야기만
  - "${productKnowledge?.salesStrategy || "기본"}" 전략에 맞게
  - 고객이 가장 궁금한 "${safeList(analysis.topCuriosity).slice(0, 1).join("")}"를 자연스럽게 답변
  - 차별화 포인트를 분산 배치 (한 번에 다 나열하지 말기)
  - 이전 섹션과 자연스럽게 연결

▶ 각 섹션의 구체적 역할:
${productKnowledge?.sectionEmphasis ? Object.entries(productKnowledge.sectionEmphasis)
  .map(([section, emphasis]) => `
[${section.toUpperCase()}]
목표: ${emphasis}
예상 길이: 200-300 단어
포함할 내용: 위의 "강조할 특징"과 "설득 포인트" 중 관련 것
톤: "${productKnowledge.copytone || "자연스러운"}"
`).join("\n") : "표준 역할"}

===================================================================
[제5단계] 금지사항
===================================================================

❌ Template 의존:
"이 섹션은...", "다음으로...", "마지막으로..."\n"위에서 말한 대로...", "이제 알아봅시다..."

❌ 제품과 맞지 않는 표현:
입력되지 않은 정보 생성
같은 제품 표현 반복 (다른 제품도 같은 말하면 안 됨)
플레이스홀더 ("XXmg", "[제품명]")

❌ 문법/스타일 오류:
조사 오류 ("가치을" → "가치")
같은 주어/술어 반복
문장 길이 일정함
느낌표 남발

===================================================================
[제6단계] 출력 형식
===================================================================

반드시 JSON으로만 출력하세요. 마크다운이나 설명은 절대 금지.

{
  "hero_headline": "제품을 선택할 핵심 이유 (한 문장, 감정 포함)",
  "hero_subcopy": "헤드라인을 구체화 (2-3문장의 설명)",
  "analysis": {
    "target_insight": "이 제품을 찾는 고객의 심리 상태",
    "emotional_appeal": "호소하는 감정 요소",
    "product_positioning": "경쟁 제품과의 차별화"
  },
  "sections": [
    {
      "type": "section",
      "title": "AI 설계에서 정한 섹션명 (Template과 다를 수 있음)",
      "body": "완성된 본문 카피 (3-5 문단, 300-400 단어)",
      "role": "이 섹션의 역할"
    }
  ]
}`;
}

// ============================================================
// 기존 호환성 유지
// ============================================================

export function buildGenerationPrompt(product) {
  console.warn("buildGenerationPrompt is deprecated. Use 2-step process instead.");
  return buildDetailPageGenerationPrompt(product, {
    coreValue: product.benefits || "핵심 가치",
    customerPsychology: "고객이 이 제품을 찾음",
    topCuriosity: ["원료", "품질", "효과"],
    differentiation: "차별화됨",
    optimalSequence: [],
    salesStrategy: "기본 전략",
    emotionalJourney: "고객의 감정 변화",
    keyMessages: [],
    avoidMessages: []
  });
}

export const DETAIL_PAGE_SCHEMA = `{
  "hero_headline": "string",
  "hero_subcopy": "string",
  "analysis": {
    "target_insight": "string",
    "emotional_appeal": "string",
    "product_positioning": "string"
  },
  "sections": [
    {
      "type": "string",
      "title": "string",
      "body": "string",
      "role": "string"
    }
  ]
}`;
