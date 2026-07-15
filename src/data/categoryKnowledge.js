// 카테고리별 구매 심리, 판매 전략, Story Flow를 정의
// AI가 제품 카테고리를 이해하고 맞는 상세페이지 구조를 설계하도록 함

export const CATEGORY_KNOWLEDGE_BASE = {
  // ============================================================
  // 1. 신선식품 > 과일
  // ============================================================
  "신선식품|과일": {
    keyBuyingPoints: [
      "산지",
      "품종",
      "당도",
      "신선도",
      "수확시기",
      "배송상태"
    ],
    customerConcerns: [
      "맛이 없을까?",
      "당도가 낮지 않을까?",
      "배송 중 상하지 않을까?",
      "사진과 실제가 다르지 않을까?"
    ],
    recommendedStrategy: "산지 · 당도 · 신선도 중심",
    storyFlow: [
      "산지 소개",
      "재배 환경",
      "품종 및 당도",
      "수확 및 선별",
      "신선 포장",
      "배송 안내",
      "보관 방법"
    ],
    trustElements: [
      "원산지",
      "당도 정보",
      "수확일",
      "선별 기준",
      "배송 방식"
    ],
    imageDirection: [
      "산지 풍경",
      "과일 단면",
      "신선한 식탁",
      "포장 이미지"
    ],
    copyTone: "신선하고 생생한 느낌",
    avoidExpressions: [
      "혈당",
      "치료",
      "예방",
      "면역력",
      "건강 개선",
      "효능"
    ],
    // 카테고리별 AI 진단 메시지
    aiDiagnosis: "신선도와 산지를 먼저 강조하는 것이 구매 전환에 유리합니다. 수확 시점부터 배송까지의 과정을 투명하게 보여주세요.",
    defaultTarget: "신선하고 맛있는 과일을 찾는 고객"
  },

  // ============================================================
  // 2. 수산물 > 생선
  // ============================================================
  "수산물|생선": {
    keyBuyingPoints: [
      "원산지",
      "신선도",
      "손질 여부",
      "냉장/냉동",
      "보관 방법"
    ],
    customerConcerns: [
      "비린내",
      "신선도",
      "손질 상태",
      "요리하기 어렵지 않을까?"
    ],
    recommendedStrategy: "신선도 · 원산지 중심",
    storyFlow: [
      "원산지 소개",
      "신선도 기준",
      "손질 정보",
      "냉장/냉동 방식",
      "보관 방법",
      "조리 방법",
      "조리 팁"
    ],
    trustElements: [
      "원산지 증명",
      "신선도 기준",
      "손질 여부",
      "온도 유지 방식",
      "위생 처리"
    ],
    imageDirection: [
      "생선의 윤기",
      "신선한 상태",
      "손질 과정",
      "요리 완성 이미지"
    ],
    copyTone: "신뢰감 있고 깔끔한 느낌",
    avoidExpressions: [
      "혈관",
      "콜레스테롤",
      "치료",
      "약",
      "건강식"
    ],
    aiDiagnosis: "원산지와 신선도에 대한 신뢰를 먼저 확보하는 것이 중요합니다. 구매 고객의 비린내 우려를 해소하는 조리법 제시가 효과적입니다.",
    defaultTarget: "신선한 수산물을 찾는 고객"
  },

  // ============================================================
  // 3. 음료 > 커피
  // ============================================================
  "음료|커피": {
    keyBuyingPoints: [
      "향",
      "산미",
      "원산지",
      "로스팅",
      "추출 방식",
      "맛의 프로필"
    ],
    customerConcerns: [
      "내 취향일까?",
      "너무 쓰지 않을까?",
      "신맛이 강하지 않을까?",
      "밋밋하지 않을까?"
    ],
    recommendedStrategy: "향 · 감성 · 경험 중심",
    storyFlow: [
      "향 소개",
      "원산지 스토리",
      "로스팅 과정",
      "맛 프로필",
      "추천 추출법",
      "페어링 제안"
    ],
    trustElements: [
      "원산지",
      "로스팅 정보",
      "맛 노트",
      "신선도",
      "추출 가이드"
    ],
    imageDirection: [
      "원산지 풍경",
      "로스팅 과정",
      "음료의 색감",
      "라이프스타일 이미지",
      "분위기 있는 소비 장면"
    ],
    copyTone: "감성적이고 경험 중심적인 느낌",
    avoidExpressions: [
      "피로 회복",
      "건강",
      "효능",
      "개선",
      "치료"
    ],
    aiDiagnosis: "향과 로스팅 스토리를 먼저 보여주는 구성이 효과적입니다. 고객의 라이프스타일과 기분에 맞는 추천을 강조하세요.",
    defaultTarget: "취향에 맞는 커피를 찾는 고객"
  },

  // ============================================================
  // 4. 건강관리 식품 > 일반 건강식품
  // ============================================================
  "건강관리 식품|일반 건강식품": {
    keyBuyingPoints: [
      "원료",
      "함량",
      "배합",
      "품질",
      "신뢰",
      "섭취 편의성"
    ],
    customerConcerns: [
      "믿을 수 있을까?",
      "원료가 좋은가?",
      "매일 먹기 편한가?",
      "가격 대비 효과가 있을까?",
      "부작용은 없을까?"
    ],
    recommendedStrategy: "원료 · 신뢰 · 일상성 중심",
    storyFlow: [
      "고객 고민 공감",
      "핵심 원료 소개",
      "원료의 효과",
      "함량 정보",
      "배합의 이유",
      "품질 신뢰 (인증, 검증)",
      "일상 섭취 방법",
      "꾸준한 섭취의 중요성"
    ],
    trustElements: [
      "원료 정보",
      "함량 기준",
      "품질 인증",
      "안전성 검증",
      "고객 후기",
      "섭취 가이드"
    ],
    imageDirection: [
      "원료 이미지",
      "제품 포장",
      "일상 생활 (섭취 장면)",
      "가족 이미지",
      "건강한 라이프스타일"
    ],
    copyTone: "신뢰감 있고 따뜻한 느낌",
    avoidExpressions: [
      "치료",
      "약",
      "의약품",
      "의사 추천",
      "질병 예방",
      "100% 효과",
      "기적적"
    ],
    aiDiagnosis: "신뢰성과 원료의 우수성을 중심으로 구성하되, 일상에서 자연스럽게 섭취 가능하다는 점을 강조하세요. 꾸준한 섭취의 가치를 전달하는 것이 중요합니다.",
    defaultTarget: "건강한 식습관을 원하는 고객"
  },

  // ============================================================
  // 5. 건강관리 식품 > 건강기능식품
  // ============================================================
  "건강관리 식품|건강기능식품": {
    keyBuyingPoints: [
      "기능성 인정",
      "원료",
      "함량",
      "배합",
      "임상 근거",
      "인증"
    ],
    customerConcerns: [
      "정말 효과가 있을까?",
      "안전할까?",
      "부작용은 없을까?",
      "다른 제품과 무엇이 다를까?",
      "얼마나 먹어야 효과를 볼 수 있을까?"
    ],
    recommendedStrategy: "기능성 · 원료 · 임상 근거 중심",
    storyFlow: [
      "고객의 건강 고민",
      "제품이 해결하는 기능성",
      "기능성 인정 근거",
      "핵심 원료 소개",
      "원료의 임상 근거",
      "함량 및 배합",
      "부원료의 역할",
      "섭취 방법 및 기간",
      "안전성 및 인증",
      "CTA (구매 유도)"
    ],
    trustElements: [
      "식약처 기능성 인정",
      "임상 데이터",
      "원료 공급처",
      "함량 정보",
      "품질 인증 (GMP 등)",
      "안전성 검증",
      "고객 사례"
    ],
    imageDirection: [
      "원료 이미지",
      "성분표",
      "임상 데이터 시각화",
      "제품 포장",
      "건강한 라이프스타일",
      "신뢰감 있는 배경"
    ],
    copyTone: "과학적이고 신뢰감 있는 느낌",
    avoidExpressions: [
      "완치",
      "약",
      "의약품",
      "치료",
      "100% 효과",
      "즉효",
      "기적",
      "부작용 없음"
    ],
    aiDiagnosis: "식약처 인정 기능성과 임상 근거를 중심으로 신뢰성을 확보하세요. 제품의 차별화되는 함량과 배합을 명확히 설명하는 것이 필수입니다.",
    defaultTarget: "건강한 루틴을 원하는 고객"
  }
};

// 카테고리별 기본 타깃 쉽게 조회하는 함수
export const getDefaultTargetByCategory = (mainCategory, subCategory) => {
  const key = `${mainCategory}|${subCategory}`;
  const knowledge = CATEGORY_KNOWLEDGE_BASE[key];
  return knowledge?.defaultTarget || "좋은 제품을 찾는 고객";
};

// 카테고리별 Story Flow 조회 함수
export const getStoryFlowByCategory = (mainCategory, subCategory) => {
  const key = `${mainCategory}|${subCategory}`;
  const knowledge = CATEGORY_KNOWLEDGE_BASE[key];
  return knowledge?.storyFlow || [];
};

// 카테고리별 Knowledge 조회 함수
export const getCategoryKnowledge = (mainCategory, subCategory) => {
  const key = `${mainCategory}|${subCategory}`;
  return CATEGORY_KNOWLEDGE_BASE[key];
};

// 지원하는 카테고리 목록 조회 함수
export const getSupportedCategories = () => {
  return Object.keys(CATEGORY_KNOWLEDGE_BASE).map(key => {
    const [main, sub] = key.split("|");
    return { mainCategory: main, subCategory: sub, key };
  });
};
