// ═══════════════════════════════════════════════════════════════
// GENERAL HEALTH FOOD PRODUCT KNOWLEDGE
// 역할: 일반 건강식품 제품 정보
// 원칙: Facts만 포함, 추측 정보 제거
// ═══════════════════════════════════════════════════════════════

/**
 * Facts: 공개적으로 증명된 정보
 * Safe Generic Knowledge: 일반적으로 안전한 정보 (제품 불명확할 때)
 * Forbidden Assumptions: 절대 추측하지 않을 정보
 */

export const GENERAL_HEALTH_FOOD_KNOWLEDGE_BASE = {
  // ═══════════════════════════════════════════════════════════════
  // 오메가3
  // ═══════════════════════════════════════════════════════════════
  "오메가3": {
    facts: {
      commonName: "오메가3 지방산",
      sources: ["생선유", "아마씨유", "해조류"],
      safetyProfile: "식품원료"
    },
    
    safeGenericKnowledge: {
      commonQualities: [
        "자연 유래 원료",
        "투명한 정보 공개",
        "엄격한 품질 기준",
        "국제 기준 충족"
      ],
      commonUsages: [
        "일상의 건강 관리",
        "꾸준한 습관으로",
        "신뢰 기반의 선택"
      ],
      commonFeelings: [
        "신뢰할 수 있는",
        "투명한",
        "안심되는",
        "믿을 수 있는"
      ]
    },
    
    forbiddenAssumptions: {
      absolutelyNOT: [
        "연구 기간 (\"20년 연구\", \"15년 임상\")",
        "논문 수 (\"150개 논문\", \"100건 연구\")",
        "특정 국가 (\"미국 FDA 승인\", \"EU 승인\")",
        "임상 수치 (\"혈액 검사에서 개선\", \"30% 상승\")",
        "기능성 (\"혈관 건강 개선\", \"염증 감소\")",
        "함량 (\"EPA X mg 함유\", \"DHA Y mg\")",
        "효과 (\"효과가 있습니다\", \"개선됩니다\")"
      ]
    }
  },

  // ═══════════════════════════════════════════════════════════════
  // 베르베린
  // ═══════════════════════════════════════════════════════════════
  "베르베린": {
    facts: {
      commonName: "베르베린 알칼로이드",
      sources: ["황련", "황백", "자연 식물"],
      safetyProfile: "전통 한약 원료"
    },
    
    safeGenericKnowledge: {
      commonQualities: [
        "전통 역사 있는 원료",
        "자연에서 추출",
        "엄격한 품질 관리",
        "투명한 성분 공개"
      ],
      commonUsages: [
        "일상의 건강 관리",
        "꾸준한 선택",
        "자연 기반 관리"
      ],
      commonFeelings: [
        "자연스러운",
        "역사 있는",
        "신뢰할 수 있는",
        "안전한"
      ]
    },
    
    forbiddenAssumptions: {
      absolutelyNOT: [
        "연구 기간",
        "임상 데이터",
        "국가별 승인",
        "기능성 인정",
        "효능 수치",
        "논문 수",
        "임상 결과"
      ]
    }
  },

  // ═══════════════════════════════════════════════════════════════
  // 알티지 (고함량 알티지오메가3)
  // ═══════════════════════════════════════════════════════════════
  "알티지": {
    facts: {
      commonName: "고함량 오메가3 (rTG 형태)",
      sources: ["생선유", "고도정제"],
      safetyProfile: "식품원료"
    },
    
    safeGenericKnowledge: {
      commonQualities: [
        "고도로 정제된 원료",
        "국제 기준 충족",
        "엄격한 품질 검사",
        "투명한 정보"
      ],
      commonUsages: [
        "일상 건강 관리",
        "꾸준한 섭취",
        "신뢰 기반 선택"
      ],
      commonFeelings: [
        "신뢰할 수 있는",
        "과학적인",
        "정제된",
        "안전한"
      ]
    },
    
    forbiddenAssumptions: {
      absolutelyNOT: [
        "흡수율 수치 (\"3배 이상\", \"5배 흡수\")",
        "임상 데이터",
        "효능",
        "국가 승인",
        "연구 기간",
        "함량 비교",
        "특정 효과"
      ]
    }
  }
};

// ═══════════════════════════════════════════════════════════════
// Export 함수
// ═══════════════════════════════════════════════════════════════

export const getGeneralHealthFoodKnowledge = (productName) => {
  if (!productName) return null;
  
  // 정확한 매칭
  if (GENERAL_HEALTH_FOOD_KNOWLEDGE_BASE[productName]) {
    return GENERAL_HEALTH_FOOD_KNOWLEDGE_BASE[productName];
  }

  // 부분 매칭
  for (const [key, value] of Object.entries(GENERAL_HEALTH_FOOD_KNOWLEDGE_BASE)) {
    if (productName.includes(key) || key.includes(productName)) {
      return value;
    }
  }

  // 제너릭 기본값 (추측 정보 제거)
  console.log(`⚠️ "${productName}"은 일반 건강식품 정보에 없습니다.`);
  return {
    facts: {
      commonName: productName,
      sources: [],
      safetyProfile: "식품"
    },
    safeGenericKnowledge: {
      commonQualities: [
        "투명한 정보 공개",
        "엄격한 품질 기준",
        "신뢰할 수 있는 원료",
        "안전한 제조 과정"
      ],
      commonUsages: [
        "일상의 건강 관리",
        "꾸준한 습관으로",
        "신뢰 기반의 선택"
      ],
      commonFeelings: [
        "신뢰할 수 있는",
        "투명한",
        "안심되는",
        "믿을 수 있는"
      ]
    },
    forbiddenAssumptions: {
      absolutelyNOT: [
        "모든 연구/임상 관련 정보",
        "기능성 표현",
        "효능 표현",
        "국가/승인 관련",
        "함량/수치 추측",
        "특정 결과 암시"
      ]
    }
  };
};

// 안전한 기능 추출 (실제 사용)
export const getSafeGeneralHealthFoodFeatures = (productName) => {
  const knowledge = getGeneralHealthFoodKnowledge(productName);
  if (!knowledge) return { qualities: [], usages: [], feelings: [] };
  
  return {
    qualities: knowledge.safeGenericKnowledge?.commonQualities || [],
    usages: knowledge.safeGenericKnowledge?.commonUsages || [],
    feelings: knowledge.safeGenericKnowledge?.commonFeelings || []
  };
};
