// HEALTH FUNCTIONAL FOOD TEMPLATE
// 판매 흐름 중심의 섹션 구조. 실제 카피는 Prompt가 작성한다.

export const HEALTH_FUNCTIONAL_FOOD_TEMPLATE = {
  structure: [
    { order: 1, sectionId: "hero", displayName: "Hero", purpose: "제품의 핵심 선택 이유를 한 문장으로 제시", goal: "인정 기능성과 제품 고유 정보를 과장 없이 연결", role: "첫 신뢰 형성" },
    { order: 2, sectionId: "selectionCriteria", displayName: "선택 기준", purpose: "소비자가 비교할 기준을 정리", goal: "기능성, 원료, 함량, 품질 중 입력된 사실만 활용", role: "구매 기준 제시" },
    { order: 3, sectionId: "functionalIngredient", displayName: "핵심 기능성 원료", purpose: "기능성 원료의 역할을 쉽게 설명", goal: "사용자가 입력한 원료와 인정 정보만 사용", role: "제품 이해" },
    { order: 4, sectionId: "approvedFunctionality", displayName: "인정 기능성 정보", purpose: "법정 표현 범위에서 기능성 안내", goal: "질병 치료·예방으로 확대하지 않음", role: "기능성 신뢰" },
    { order: 5, sectionId: "quality", displayName: "원료와 품질 관리", purpose: "제조와 품질 정보를 통해 불안 해소", goal: "입력된 인증·검사·제조 정보만 활용", role: "품질 신뢰" },
    { order: 6, sectionId: "usage", displayName: "섭취 방법", purpose: "입력된 섭취량과 방법을 명확하게 안내", goal: "효과 기간이나 결과를 보장하지 않음", role: "실행 편의" },
    { order: 7, sectionId: "checklist", displayName: "구매 전 확인 사항", purpose: "표시사항과 섭취 시 주의사항 확인 유도", goal: "정확하고 책임 있는 선택 지원", role: "마지막 불안 해소" },
    { order: 8, sectionId: "cta", displayName: "CTA", purpose: "정보를 확인한 뒤 선택하도록 자연스럽게 마무리", goal: "강압적 표현 금지", role: "구매 행동" }
  ]
};

export const healthFunctionalFoodTemplate = HEALTH_FUNCTIONAL_FOOD_TEMPLATE;
