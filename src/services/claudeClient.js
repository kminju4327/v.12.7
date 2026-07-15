// Claude API 호출 서비스.
//
// API 키가 환경변수로 제공되면 실제 API를 호출한다.
// 키가 없으면 Mock 모드로 동작하여, 개발/체크 단계에서도 전체 파이프라인을 테스트할 수 있다.
//
// 개발 환경(npm run dev): vite 프록시(/api/anthropic)를 통해 요청
// StackBlitz/프로덕션: 환경변수로 키가 제공되면 브라우저 직접 호출

import { parseLLMJson } from "../utils/jsonParser.js";

const API_ENDPOINT = "/api/anthropic";
const MODEL = import.meta.env.VITE_ANTHROPIC_MODEL || "claude-sonnet-4-6";
const API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY || "";

// Mock 생성용 템플릿 데이터
function generateMockDraft(product, instruction = "") {
  const productName = product.name || "제품";
  const target = product.target || "건강을 원하는 분들";
  const benefits = product.benefits || "건강 관리";
  const ingredientName = product.ingredientName || "프리미엄 원료";
  
  // ✅ 수정: instruction에 따라 다른 Mock 응답 생성
  
  // "더 짧게" 요청
  if (instruction && instruction.toLowerCase().includes("짧")) {
    return {
      title: `${ingredientName}, 간단하게 말씀드리겠습니다`,
      body: `${productName}은 신뢰할 수 있는 원료로 만들었습니다. 매일 섭취하면 충분합니다.`,
      items: [
        "검증된 원료",
        "엄격한 품질 관리",
        "일상의 선택"
      ]
    };
  }
  
  // "더 길게" 요청
  if (instruction && instruction.toLowerCase().includes("길")) {
    return {
      title: `${target}을 위한 ${productName}, 자세하게 알려드립니다`,
      body: `${productName}은 ${ingredientName}을 주원료로 하여 만들어졌습니다. ${ingredientName}은 20년 이상 국제 학술지에 발표된 검증된 원료로, 50개국 이상에서 신뢰받고 있습니다. 우리는 엄격한 품질 기준을 통과한 원료만을 엄선하여 사용하며, 매 단계마다 철저한 품질 검사를 진행합니다. 효능보다는 원료의 신뢰도를 중심으로 제품을 기획했으며, 매일 꾸준히 섭취할 때 그 가치가 드러납니다.`,
      items: [
        "20년 이상의 국제 학술 발표 이력",
        "50개국 이상에서 신뢰받는 원료",
        "GMP/HACCP 인증 시설 제조",
        "매 단계별 엄격한 품질 검사",
        "투명한 원료 정보 공개"
      ]
    };
  }
  
  // "더 전문적으로" 요청
  if (instruction && instruction.toLowerCase().includes("전문")) {
    return {
      title: `${ingredientName}의 과학적 근거`,
      body: `${ingredientName}은 임상 연구에서 검증된 원료입니다. 국제 학술지 게재 이력과 엄격한 품질 기준을 통해 신뢰성이 확보되었습니다. GMP 인증 시설에서 제조되며, 정기적인 품질 검사로 안전성을 보장합니다.`,
      items: [
        "임상 데이터 기반의 선택",
        "국제 학술 검증됨",
        "GMP/HACCP 인증 시설",
        "정기적 품질 검사",
        "원료 추적 가능"
      ]
    };
  }
  
  // "프리미엄하게" 요청
  if (instruction && (instruction.toLowerCase().includes("프리미") || instruction.toLowerCase().includes("럭셔"))) {
    return {
      title: `${target}을 위한 프리미엄 선택, ${productName}`,
      body: `세련된 선택의 기준은 품질에서 비롯됩니다. ${productName}은 정교한 원료 선별과 엄격한 품질 관리로 완성된 프리미엄 제품입니다. 매순간의 신중한 관리가 만드는 차이, 당신의 투자 가치를 느껴보세요.`,
      items: [
        "세련된 원료 선별",
        "정교한 품질 관리",
        "프리미엄 브랜드 신뢰",
        "차별화된 가치",
        "선택받은 고객의 경험"
      ]
    };
  }
  
  // "구매 전환형" 요청
  if (instruction && (instruction.toLowerCase().includes("전환") || instruction.toLowerCase().includes("구매"))) {
    return {
      title: `지금 선택해야 할 이유, ${productName}`,
      body: `다른 고객들이 선택한 이유는 신뢰입니다. ${ingredientName}의 검증된 품질, 엄격한 관리 기준, 투명한 정보 공개. 지금 시작하는 작은 관리가 모여 큰 변화를 만듭니다. 당신의 선택이 당신을 바꿉니다.`,
      items: [
        "다른 고객들의 신뢰 선택",
        "검증된 품질의 근거",
        "투명한 정보와 기준",
        "지금 시작하는 변화",
        "당신만의 관리 경험"
      ]
    };
  }
  
  // 기본 응답 (instruction이 없거나 매칭되지 않음)
  return {
    hero_headline: `${target}을 위한 ${productName}, 작은 관리로 시작해보세요`,
    hero_subcopy: `매일의 선택이 만드는 변화. 신뢰할 수 있는 원료로 만들었습니다.`,
    analysis: {
      target_insight: `${target}의 주요 관심사는 ${benefits}입니다. 효능보다 신뢰할 수 있는 원료와 꾸준한 관리를 중시합니다.`,
      emotional_appeal: "신뢰할 수 있는 품질, 투명한 정보, 일상 속 자연스러운 선택",
      product_positioning: `${ingredientName}을 중심으로 한 신뢰 기반의 건강 관리 제품`,
    },
    sections: [
      {
        type: "problem",
        title: `${target}이 겪는 일상의 불편함`,
        body: `저녁이 되면 몸이 무거워지는 경험, 혼자가 아닙니다. 많은 분들이 같은 고민을 합니다. 하지만 이는 질병이 아니라 일상의 작은 불편함일 뿐입니다. 신뢰할 수 있는 원료를 꾸준히 섭취하며 관리하는 것으로 충분합니다.`,
        label_style: "pill",
      },
      {
        type: "solution",
        title: `${ingredientName}의 신뢰도`,
        body: `${ingredientName}은 20년 이상 국제 학술지에 발표된 원료입니다. 50개국 이상에서 신뢰받으며, 엄격한 품질 기준을 통과한 원료만 사용합니다. 효능에 의존하지 않고, 원료의 신뢰도만으로 설득하는 제품입니다.`,
        label_style: "pill",
      },
      {
        type: "benefit_list",
        title: "신뢰의 근거",
        body: `✓ 20년 이상의 국제 학술 발표 이력
✓ GMP/HACCP 인증 시설 제조
✓ 매 단계별 품질 검사
✓ 신뢰할 수 있는 원료 공급처
✓ 투명한 성분 정보 공개`,
        label_style: "pill",
      },
      {
        type: "how_to_use",
        title: "매일의 습관으로 시작하기",
        body: `아침 식사 후, 물과 함께 1회 섭취하세요. 가장 중요한 것은 꾸준함입니다. 며칠이 아니라 매일, 습관처럼 섭취할 때 의미가 있습니다. 당신의 작은 선택이 모여 큰 변화를 만듭니다.`,
        label_style: "pill",
      },
      {
        type: "trust_badges",
        title: "제품 신뢰성",
        body: `GMP 인증 | HACCP 인증 | 정기적 품질 검사 | 원료 추적 가능 | 전성분 공개`,
        label_style: "pill",
      },
    ],
  };
}

function generateMockCompliance() {
  return {
    overall_status: "pass",
    severity_count: { critical: 0, warning: 0, info: 0 },
    flags: [],
    summary: "컴플라이언스 체크가 완료되었습니다 (Mock 모드).",
  };
}

// 실제 API 호출 (키가 있을 때)
async function callClaudeApi(prompt, maxTokens = 2000) {
  let endpoint = API_ENDPOINT;
  let headers = { "Content-Type": "application/json" };
  let body = JSON.stringify({
    model: MODEL,
    max_tokens: maxTokens,
    messages: [{ role: "user", content: prompt }],
  });

  // StackBlitz 등 프로덕션 환경에서 API 키가 있으면 직접 호출
  if (API_KEY && typeof window !== "undefined" && window.location.origin.includes("stackblitz")) {
    endpoint = "https://api.anthropic.com/v1/messages";
    headers = {
      "Content-Type": "application/json",
      "x-api-key": API_KEY,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    };
  }

  const res = await fetch(endpoint, {
    method: "POST",
    headers,
    body,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(`API 오류 (${res.status}): ${data?.error?.message || JSON.stringify(data)}`);
  }

  const text = (data.content || []).map((b) => (b.type === "text" ? b.text : "")).join("\n");

  if (!text) {
    throw new Error("응답에 텍스트 내용이 없어요: " + JSON.stringify(data));
  }

  return parseLLMJson(text);
}

/**
 * Claude에 프롬프트를 보내고, JSON으로 파싱된 결과를 반환한다.
 * API 키가 없으면 Mock 모드로 동작한다.
 *
 * @param {string} prompt - 사용자 프롬프트
 * @param {number} maxTokens - 최대 출력 토큰
 * @param {object} context - Mock 모드용 컨텍스트 (product 등)
 * @param {string} stage - Mock 모드 스테이지 ("generation" | "compliance" | "remediation" | "regenerate")
 * @returns {Promise<object>} 파싱된 JSON 객체
 */
export async function callClaude(prompt, maxTokens = 2000, context = {}, stage = "generation") {
  // API 키 없으면 Mock 모드
  if (!API_KEY) {
    // 시뮬레이션 딜레이 (실제 API 호출처럼 보이도록)
    await new Promise((r) => setTimeout(r, 800 + Math.random() * 400));

    // 스테이지별 Mock 응답
    if (stage === "compliance") {
      return generateMockCompliance();
    }
    // ✅ 수정: instruction을 generateMockDraft에 전달
    if (stage === "remediation" || stage === "regenerate") {
      return generateMockDraft(context.product || {}, context.instruction || "");
    }
    // generation, 기타 스테이지
    return generateMockDraft(context.product || {}, context.instruction || "");
  }

  // API 키가 있으면 실제 호출
  return callClaudeApi(prompt, maxTokens);
}
