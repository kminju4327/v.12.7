// ═══════════════════════════════════════════════════════════════
// HEALTH FUNCTIONAL FOOD PRODUCT KNOWLEDGE
// 역할: 건강기능식품 제품 정보
// 원칙: 인정된 정보만, 추측 금지, 임상 데이터 필수
// ═══════════════════════════════════════════════════════════════

/**
 * Facts: 식약처 인정 사항, 공개 임상 데이터
 * SafeElements: 불명확할 때 사용 가능한 일반 정보
 * ForbiddenAssumptions: 절대 사용 금지 (인정 안 된 정보)
 */

export const HEALTH_FUNCTIONAL_FOOD_KNOWLEDGE_BASE = {
  // ═══════════════════════════════════════════════════════════════
  // 예: 루테인 (눈 건강 기능식품)
  // ═══════════════════════════════════════════════════════════════
  "루테인": {
    facts: {
      approvedFunctionality: "눈 건강 유지에 도움",
      approvedBy: "식약처 (2015년)",
      requiredDailyDose: "10mg 이상",
      activeIngredient: "루테인",
      manufactureStandard: "GMP 인증"
    },
    
    safeElements: {
      commonQualities: [
        "명확한 기능성 인정",
        "과학적 근거 있음",
        "정확한 용량",
        "정제된 원료"
      ],
      commonUsages: [
        "일상의 눈 건강 관리",
        "꾸준한 섭취",
        "과학 기반 선택"
      ],
      commonFeelings: [
        "신뢰할 수 있는",
        "과학적인",
        "안심되는",
        "명확한"
      ]
    },
    
    forbiddenAssumptions: {
      neverSay: [
        "다른 기능성 (\"항산화\", \"피로 개선\" 등)",
        "임상 수치 (사용자가 제공하지 않은)",
        "미승인 함량 정보",
        "다른 나라 승인 (사용자가 미제시)",
        "구체적 연구 수 (사용자가 미제시)",
        "속도 (\"빠른 효과\", \"며칠\")",
        "부작용 언급 (사용자 제시 외)"
      ]
    }
  }
};

// ═══════════════════════════════════════════════════════════════
// Export 함수
// ═══════════════════════════════════════════════════════════════

export const getHealthFunctionalFoodKnowledge = (productName) => {
  if (!productName) return null;
  
  // 정확한 매칭만 허용 (부분 매칭 금지 - 인정 안 된 정보 사용 방지)
  if (HEALTH_FUNCTIONAL_FOOD_KNOWLEDGE_BASE[productName]) {
    return HEALTH_FUNCTIONAL_FOOD_KNOWLEDGE_BASE[productName];
  }

  // 건강기능식품은 정보가 없으면 사용자 입력에만 의존
  console.log(`⚠️ "${productName}"은 건강기능식품 정보에 없습니다. 사용자 입력만 사용합니다.`);
  return null;
};

// 안전한 기능 추출 (사용자 입력 기반)
export const getSafeHealthFunctionalFoodFeatures = (productName, userInput = {}) => {
  const knowledge = getHealthFunctionalFoodKnowledge(productName);
  
  if (!knowledge) {
    // 사용자가 제공한 정보만 사용
    return {
      approvedFunctionality: userInput.functionality || "",
      requiredDailyDose: userInput.dailyDose || "",
      clinicalInfo: userInput.clinicalData || "",
      activeIngredient: userInput.ingredient || ""
    };
  }
  
  return {
    approvedFunctionality: knowledge.facts?.approvedFunctionality || "",
    requiredDailyDose: knowledge.facts?.requiredDailyDose || "",
    activeIngredient: knowledge.facts?.activeIngredient || "",
    manufactureStandard: knowledge.facts?.manufactureStandard || ""
  };
};

// 금지된 정보 검사
export const checkForbiddenAssumptions = (productName, generatedText) => {
  const knowledge = getHealthFunctionalFoodKnowledge(productName);
  
  if (!knowledge) {
    // 일반적인 금지 사항 체크
    const forbiddenPatterns = [
      /(\d+)년[^을]?.*연구|(\d+)건.*논문|(\d+)명.*임상|(\d+)%.*효과|(\d+)배.*흡수/gi,
      /완치|치료|특효|기적|확실한 효과|부작용 없음|100% 개선/gi
    ];
    
    const violations = [];
    forbiddenPatterns.forEach((pattern, idx) => {
      if (pattern.test(generatedText)) {
        violations.push(`추측 정보 사용 금지 (패턴 ${idx + 1})`);
      }
    });
    
    return violations;
  }
  
  return [];
};
