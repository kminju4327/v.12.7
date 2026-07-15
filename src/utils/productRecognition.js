// PRODUCT RECOGNITION
// 법적 분류는 제품명 추측보다 사용자가 선택한 카테고리를 우선한다.

const FUNCTIONAL_APPROVAL_TERMS = [
  "건강기능식품", "식약처 인정", "기능성 원료", "개별인정형", "고시형"
];

export function recognizeProductType(productName, subCategory = "", userInput = {}) {
  const explicitCategory = String(
    userInput.internalCategory || userInput.category || subCategory || ""
  ).trim();

  // 사용자가 명시적으로 선택한 카테고리를 최우선 사용
  if (explicitCategory === "건강기능식품" || subCategory === "건강기능식품") {
    return {
      type: "HEALTH_FUNCTIONAL",
      confidence: 100,
      reason: "사용자가 건강기능식품으로 선택함",
      needsQuestion: false,
      mismatchWarning: null
    };
  }

  if (
    explicitCategory === "일반식품" ||
    ["일반 건강식품", "단백질·영양식", "체중조절용 식품"].includes(subCategory)
  ) {
    return {
      type: "GENERAL_HEALTH_FOOD",
      confidence: 100,
      reason: "사용자가 일반식품 계열로 선택함",
      needsQuestion: false,
      mismatchWarning: null
    };
  }

  // 제품명으로 추론 (경고 포함)
  const text = [productName, userInput.benefits, userInput.certs, userInput.functionality]
    .filter(Boolean)
    .join(" ");
  const approvalMatches = FUNCTIONAL_APPROVAL_TERMS.filter((term) => text.includes(term));

  // 사용자 선택과 제품명이 맞지 않는 경우 경고
  let mismatchWarning = null;
  if (approvalMatches.length > 0 && explicitCategory !== "건강기능식품") {
    const assumedType = "건강기능식품";
    mismatchWarning = {
      userSelected: explicitCategory || "미선택",
      detectedType: assumedType,
      reason: `제품명이나 입력 정보에서 건강기능식품 표시를 발견했습니다: ${approvalMatches.join(", ")}`,
      suggestion: `"${assumedType}"로 변경하시겠습니까?`
    };
  }

  if (approvalMatches.length > 0) {
    return {
      type: "HEALTH_FUNCTIONAL",
      confidence: 75,
      reason: `건강기능식품 표시 단서: ${approvalMatches.join(", ")}`,
      needsQuestion: false,
      mismatchWarning
    };
  }

  return {
    type: "UNKNOWN",
    confidence: 0,
    reason: "제품명만으로 법적 분류를 확정할 수 없음",
    needsQuestion: true,
    question: "이 제품은 일반 건강식품인가요, 건강기능식품인가요?",
    mismatchWarning: null
  };
}

export function hasApprovalIndicators(userInput = {}) {
  const text = [userInput.benefits, userInput.certs, userInput.functionality]
    .filter(Boolean)
    .join(" ");
  return {
    mentionsApproval: FUNCTIONAL_APPROVAL_TERMS.some((term) => text.includes(term)),
    hasClinicalData: Boolean(userInput.clinicalData),
    hasExactDosage: Boolean(userInput.actualAmount || userInput.dailyAmount)
  };
}

export function suggestProductType(userInput = {}) {
  if (userInput.category === "건강기능식품") return "HEALTH_FUNCTIONAL";
  if (userInput.category === "일반식품") return "GENERAL_HEALTH_FOOD";
  return hasApprovalIndicators(userInput).mentionsApproval ? "HEALTH_FUNCTIONAL" : "UNKNOWN";
}

export const getPromptByType = (type) =>
  type === "HEALTH_FUNCTIONAL"
    ? "buildHealthFunctionalFoodPrompt"
    : type === "GENERAL_HEALTH_FOOD"
    ? "buildGeneralHealthFoodPrompt"
    : null;

export const getBrainByType = (type) =>
  type === "HEALTH_FUNCTIONAL"
    ? "healthFunctionalFoodBrain"
    : type === "GENERAL_HEALTH_FOOD"
    ? "generalHealthFoodBrain"
    : null;

export default {
  recognizeProductType,
  hasApprovalIndicators,
  suggestProductType,
  getPromptByType,
  getBrainByType
};
