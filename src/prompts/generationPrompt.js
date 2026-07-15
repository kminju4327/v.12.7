// BRAND ENGINE V6 generation prompt
// Brain = 사고, Template = 구성, Prompt = 글쓰기, Validator = 검수

import { buildGenerationConstraint } from "../compliance/categoryRules.js";
import { buildProductBlock, buildNumericGuidance } from "./numericGuidance.js";
import { getProductKnowledge, getSafeProductFeatures } from "../data/productKnowledge.js";
import { GENERAL_HEALTH_FOOD_BRAIN_V6 } from "../brains/generalHealthFood/brain.js";
import { GENERAL_HEALTH_FOOD_TEMPLATE } from "../brains/generalHealthFood/template.js";
import { HEALTH_FUNCTIONAL_FOOD_BRAIN_V6 } from "../brains/healthFunctionalFood/brain.js";
import { HEALTH_FUNCTIONAL_FOOD_TEMPLATE } from "../brains/healthFunctionalFood/template.js";
import { recognizeProductType } from "../utils/productRecognition.js";

export const DETAIL_PAGE_SCHEMA = `{"hero_headline":"string","hero_subcopy":"string","analysis":{"target_insight":"string","emotional_appeal":"string","product_positioning":"string"},"sections":[{"type":"problem|solution|objection_handling|benefit_list|how_to_use|trust_badges|section","title":"string","body":"string","items":["string"]}]}`;

const safeList = (value) => (Array.isArray(value) ? value.filter(Boolean) : []);

function buildKnowledgeBlock(product) {
  const knowledge = getProductKnowledge(product.name);
  const safe = getSafeProductFeatures(product.name);
  return `
[제품 지식 사용 원칙]
- 사용자 입력값을 최우선 사실로 사용한다.
- 아래 정보는 일반적으로 활용 가능한 방향일 뿐, 제품 고유 사실로 단정하지 않는다.
- 입력되지 않은 수치, 원산지, 인증, 임상, 연구 기간, 논문 수, 등급을 만들지 않는다.
안전한 특징: ${safeList(safe?.qualities).join(", ") || "없음"}
안전한 활용 상황: ${safeList(safe?.usages).join(", ") || "없음"}
안전한 인상: ${safeList(safe?.feelings).join(", ") || "없음"}
참고 특징: ${safeList(knowledge?.commonQualities).join(", ") || "없음"}
생성 금지 추론: ${safeList(knowledge?.avoidWords).join(", ") || "검증되지 않은 모든 수치·인증·효능 정보"}
`;
}

function selectBrainAndTemplate(product) {
  // 사용자가 선택한 category를 우선 사용 (건강기능식품 또는 일반식품)
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

  // 분류 결과를 위한 recognition 객체 생성
  const recognition = {
    type: functional ? "HEALTH_FUNCTIONAL" : "GENERAL_HEALTH_FOOD",
    confidence: 100,
    reason: `사용자가 "${product.category}"로 선택함`
  };

  return { recognition, brain, structure, principles };
}

export function buildGenerationPrompt(product) {
  const categoryConstraint = buildGenerationConstraint(product.category);
  const productBlock = buildProductBlock({
    ...product,
    benefits: product.benefits || "미입력"
  });
  const numericGuidance =
    product.purity || product.actualAmount || product.epa || product.dha
      ? buildNumericGuidance(product)
      : "";
  const { recognition, brain, structure, principles } = selectBrainAndTemplate(product);
  const isFunctional = recognition.type === "HEALTH_FUNCTIONAL";
  
  // Product Knowledge - 제품별 전략 추출
  const knowledge = getProductKnowledge(product.name);
  
  // 섹션별 구체적 역할 정의
  const sectionRoles = {
    hero: {
      goal: "관심을 끈다",
      description: "제품이 존재하는 것을 알리고, 고객의 감정을 흔든다. 왜 이 제품이 필요한지 한 문장으로 제시."
    },
    problem: {
      goal: "공감한다",
      description: "고객의 구체적인 불안감, 고민, 불편함을 정확히 인식시킨다. 고객이 '맞다, 내 이야기다'라고 느끼게 한다."
    },
    insight: {
      goal: "깨달음을 준다",
      description: "왜 그 문제가 발생하는지, 근본 원인이 무엇인지 설명한다. 논리적 이해를 통해 신뢰감을 형성한다."
    },
    ingredient: {
      goal: "신뢰를 만든다",
      description: "이 제품이 어떻게 만들어졌는지, 원료가 무엇인지 설명한다. 사용자가 '이 제품은 믿을 만하다'고 느끼게 한다."
    },
    quality: {
      goal: "안심시킨다",
      description: "품질 기준, 안전성, 검증된 정보를 제시한다. 사용자의 마지막 의심을 없앤다."
    },
    solution: {
      goal: "해결책을 제시한다",
      description: "이 제품이 어떻게 문제를 해결하는지 구체적으로 설명한다. 원리와 효과를 명확히 한다."
    },
    usage: {
      goal: "구매 후 모습을 상상하게 한다",
      description: "이 제품을 사용한 후의 일상, 변화, 만족감을 구체적으로 그려준다. 사용자가 미래를 상상하게 한다."
    },
    cta: {
      goal: "자연스럽게 구매를 유도한다",
      description: "지금까지의 흐름을 자연스럽게 마무리하고, 구매 행동으로 유도한다. 강압적이 아닌 필연적으로 느껴지게 한다."
    }
  };

  // 제품별 판매 전략 구성 (순서가 중요)
  const productStrategy = knowledge ? `
[제품 맞춤 판매 전략 (이것이 섹션 구성을 결정합니다)]

판매 전략 유형: ${knowledge.salesStrategy || "기본"}

구매 심리: ${knowledge.buyerPsychology || "제품을 구매하려는 고객"}

가장 중요한 정보:
${safeList(knowledge.topCuriosity).map((q, i) => `${i + 1}. ${q}`).join("\n")}
→ 이 정보들이 반드시 포함되어야 합니다.

차별화 포인트:
${safeList(knowledge.differentiators).map((d, i) => `${i + 1}. ${d}`).join("\n")}
→ 각 섹션에 자연스럽게 분산 배치하세요.

제품 톤: ${knowledge.copytone || "자연스러운"}
→ 모든 표현이 이 톤을 유지해야 합니다.

각 섹션의 역할 (제품별로 다릅니다):
${knowledge.sectionEmphasis ? Object.entries(knowledge.sectionEmphasis)
  .map(([section, emphasis]) => `
${section.toUpperCase()}:
목표: ${emphasis}
역할: ${sectionRoles[section.toLowerCase()]?.goal || "섹션 역할"}
방향: ${sectionRoles[section.toLowerCase()]?.description || "기본"}
`)
  .join("\n") : "표준 섹션 구조"}

섹션 구성 순서의 이유:
${knowledge.salesStrategy === "정보 비교형" ? `
1. 고객이 비교하고 싶어함 → 먼저 기능성·원료·품질을 명확히
2. 신뢰할 수 있는 정보 → 수치·기준·차이점 강조
3. 구매 결정 → 비교 우위 강조
` : knowledge.salesStrategy === "원료 신뢰형" ? `
1. 원료의 신뢰성 → 가장 먼저 원료 스토리 설명
2. 배합의 과학성 → 왜 이 원료들을 함께 넣었는지
3. 일상 루틴 → 신뢰감 바탕으로 구매 유도
` : knowledge.salesStrategy === "브랜드 신뢰형" ? `
1. 브랜드의 역사와 신뢰 → 원산지·전통·기준 강조
2. 오랜 신뢰의 근거 → 품질 관리·기준·혁신
3. 선택의 당위성 → 신뢰의 축적으로 구매 유도
` : `
1. 제품의 핵심 가치
2. 고객 혜택
3. 구매 유도
`}
` : "";

  // AI 설계 결과
  const pageDesignBlock = product.pageDesign ? `
[AI 설계에서 결정한 페이지 구조]

순서: ${product.pageDesign.pageStructure?.join(" → ") || "표준"}

강조할 특징:
${product.pageDesign.productFeatures?.map((f, i) => `${i + 1}. ${f}`).join("\n")}

설득 포인트:
${product.pageDesign.persuasionPoints?.map((p, i) => `${i + 1}. ${p}`).join("\n")}

이미지 전략:
${product.pageDesign.recommendedImages?.map((img, i) => `${i + 1}. ${img}`).join("\n")}
` : "";

  return `당신은 한국 이커머스의 최고 수준 카피라이터입니다.

제품을 깊이 있게 이해하고, 사람이 직접 기획한 것처럼 자연스러운 상세페이지를 작성하세요.

이것이 "Template를 채우는 작업"이 아니라 "제품을 기획하는 작업"이라는 것을 기억하세요.

===================================================================
[제품 정보]
===================================================================

${productBlock}

표시·광고 분류: ${product.category}
선택: ${product.mainCategory || ""} > ${product.subCategory || ""}

===================================================================
[⭐ 제품 맞춤 판매 전략 (모든 섹션이 이를 따릅니다)]
===================================================================

${productStrategy}

===================================================================
[AI 설계 페이지 구조]
===================================================================

${pageDesignBlock}

===================================================================
[섹션별 구체적 역할 (각 섹션은 다른 목적을 가집니다)]
===================================================================

${Object.entries(sectionRoles).map(([key, role]) => `
[${key.toUpperCase()}]
목표: ${role.goal}
역할: ${role.description}
방식: 이전 섹션의 흐름을 받아 이 목표를 달성해야 합니다.
`).join("\n")}

===================================================================
[글쓰기 원칙 (신뢰성과 법적 준수)]
===================================================================

${principles || "- 확인 가능한 정보로만 설득한다."}
톤: ${brain.copyTone || "신뢰감 있는 톤"}

${categoryConstraint}

${numericGuidance}

===================================================================
[생성 지침]
===================================================================

⭐ 최우선 (이 순서를 따르세요):
1. 제품의 판매 전략 전체를 이해한 후
2. 각 섹션이 그 역할을 명확히 수행하도록
3. Product Knowledge를 자연스럽게 녹여서
4. 사람처럼 기획한 느낌으로 작성

📝 각 섹션 작성 시:
- 이전 섹션의 감정·논리를 이어받기
- 이 섹션의 목표를 명확히 달성하기
- 다음 섹션으로 자연스럽게 연결하기
- 제품의 판매 전략을 반영하기

🎨 표현의 다양성:
- 같은 문장 구조 반복 금지
- 문단마다 다른 문장형 사용 (평서, 의문, 감탄, 선언)
- 주어를 다양하게 (제품, 고객, 우리, 상황, 감정 등)
- 설명 방식 다양화 (사실, 비유, 질문, 이야기, 수치)

❌ 절대 금지 (AI 느낌 제거):
- 같은 시작 (문장, 섹션 제목)
- 같은 단어 반복
- 같은 구조 ("~을 통해", "~으로써")
- 플레이스홀더 ("XXmg", "[제품명]")
- 템플릿 티 ("이 섹션은", "다음으로")

✨ 브랜드 문체 목표:
- 마치 브랜드의 전담 카피라이터가 기획한 것 같음
- 제품의 개성이 느껴짐
- 고객의 심리를 정확히 파악한 느낌
- 자연스럽고 설득력 있음
- 각 섹션이 나름의 역할을 명확히 함

===================================================================
[제품별 차별화 체크리스트]
===================================================================

이 상세페이지가:
□ 루테인이면: 정보 중심, 기능성·원료·품질 비교
□ 베르베린이면: 원료 중심, 신뢰감·배합·루틴
□ 홍삼이면: 브랜드 중심, 원산지·전통·신뢰
□ 오메가3이면: 정보+생활 중심, 수치·활용·일상

완전히 다른 느낌이어야 합니다.

===================================================================
[최종 출력]
===================================================================

반드시 JSON만 출력하세요.

{
  "hero_headline": "제품 선택의 핵심 이유 (한 문장, 감정 포함)",
  "hero_subcopy": "헤드라인을 구체화 (2-3문장, 고객 관점)",
  "analysis": {
    "target_insight": "고객의 구체적 심리 상태",
    "emotional_appeal": "호소하는 감정",
    "product_positioning": "경쟁 제품과의 차별점"
  },
  "sections": [
    {
      "type": "section",
      "title": "섹션 제목 (AI 설계와 일치)",
      "body": "완성된 카피 (3-5 문단, 완전한 문장)",
      "items": ["리스트 항목"]
    }
  ]
}

${DETAIL_PAGE_SCHEMA}`;
}
