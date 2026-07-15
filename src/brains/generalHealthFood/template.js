// ═══════════════════════════════════════════════════════════════
// GENERAL HEALTH FOOD TEMPLATE
// 역할: 섹션 구조와 목적만 정의
// 특징: "각 섹션이 뭔지, 왜 필요한지, 어디에 위치하는지"만 명시
// ═══════════════════════════════════════════════════════════════

export const GENERAL_HEALTH_FOOD_TEMPLATE = {
  // ═══════════════════════════════════════════════════════════════
  // 전체 구조
  // ═══════════════════════════════════════════════════════════════
  
  structure: [
    {
      order: 1,
      sectionId: "hero",
      displayName: "Hero",
      purpose: "공감과 희망",
      goal: "고객의 작은 불편함을 인정하고, 관리로 해결 가능함을 암시",
      wordCount: "50-80자",
      role: "신뢰 형성의 첫 단계"
    },
    
    {
      order: 2,
      sectionId: "problem",
      displayName: "고객의 일상 불편함",
      purpose: "공감",
      goal: "구체적 일상 상황을 통해 공감하되, 문제로 진단하지 않기",
      wordCount: "120-160자",
      role: "신뢰 깊이화"
    },
    
    {
      order: 3,
      sectionId: "ingredient",
      displayName: "원료 소개",
      purpose: "신뢰도 확보",
      goal: "주 원료가 무엇이고, 왜 신뢰할 수 있는 원료인지 전달",
      wordCount: "100-150자",
      role: "설득의 핵심 (효능을 말할 수 없으므로 원료 신뢰만 가능)"
    },
    
    {
      order: 4,
      sectionId: "trustHistory",
      displayName: "원료의 신뢰도와 역사",
      purpose: "원료 신뢰 강화",
      goal: "원료의 연구 역사, 학술 발표, 국제적 인정을 통해 신뢰도 증명",
      wordCount: "100-150자",
      role: "원료 신뢰의 객관화"
    },
    
    {
      order: 5,
      sectionId: "formula",
      displayName: "함량 및 배합의 의도",
      purpose: "품질 신뢰",
      goal: "왜 이 함량으로, 이렇게 배합했는가를 통해 과학성 전달",
      wordCount: "120-160자",
      role: "제조 신뢰의 기초"
    },
    
    {
      order: 6,
      sectionId: "manufacturing",
      displayName: "제조 신뢰와 품질 관리",
      purpose: "품질 신뢰",
      goal: "인증, 검사, 기준을 통해 원료를 제대로 만들었음을 증명",
      wordCount: "120-160자",
      role: "제조 신뢰의 증명"
    },
    
    {
      order: 7,
      sectionId: "routine",
      displayName: "일상의 관리 루틴",
      purpose: "관리 개념 강화",
      goal: "섭취법을 통해 '매일의 습관', '일관성'을 강조",
      wordCount: "100-140자",
      role: "능동적 선택 유도"
    },
    
    {
      order: 8,
      sectionId: "cta",
      displayName: "CTA - 일상 관리의 시작",
      purpose: "행동 유도",
      goal: "좋은 원료로 일상을 관리하기 시작하도록 자연스럽게 유도",
      wordCount: "40-60자",
      role: "최종 결정"
    }
  ],

  // ═══════════════════════════════════════════════════════════════
  // 섹션별 상세 정보
  // ═══════════════════════════════════════════════════════════════
  
  sections: {
    hero: {
      id: "hero",
      name: "Hero",
      order: 1,
      wordCount: "50-80자",
      
      purpose: "공감과 희망의 시작",
      
      goal: {
        primary: "고객의 작은 불편함을 인정",
        secondary: "그것을 '관리'로 해결 가능함을 암시",
        avoid: "효능 표현, 의약품처럼 보이기"
      },
      
      structure: "불편함 인정 + 관리의 가치",
      
      audience: "일상의 작은 불편함으로 고민하는 고객",
      
      nextSection: "problem (공감 심화)"
    },

    problem: {
      id: "problem",
      name: "고객의 일상 불편함",
      order: 2,
      wordCount: "120-160자",
      
      purpose: "신뢰 깊이화",
      
      goal: {
        primary: "구체적 일상 상황 제시로 공감 형성",
        secondary: "불편함을 인정하되, 문제로 진단하지 않기",
        avoid: "질병 언어, 원인 설명, 효능 표현"
      },
      
      structure: "구체적 상황 3-4가지 + 공감 + 관리의 필요성",
      
      audience: "자신의 일상을 반영하고 싶은 고객",
      
      nextSection: "ingredient (해결책 제시)"
    },

    ingredient: {
      id: "ingredient",
      name: "원료 소개",
      order: 3,
      wordCount: "100-150자",
      
      purpose: "신뢰도 확보 (가장 중요한 섹션)",
      
      goal: {
        primary: "주 원료를 소개",
        secondary: "왜 이 원료를 선택했는가 (신뢰도 측면)",
        avoid: "효능 표현, 임상 개선 표현"
      },
      
      structure: "원료명 + 신뢰도 배경 + 선택 이유",
      
      criticalPoint: "효능을 말할 수 없으므로 원료 신뢰만이 유일한 설득 요소",
      
      audience: "제품 선택을 고민하는 고객",
      
      nextSection: "trustHistory (신뢰도 객관화)"
    },

    trustHistory: {
      id: "trustHistory",
      name: "원료의 신뢰도와 역사",
      order: 4,
      wordCount: "100-150자",
      
      purpose: "원료 신뢰 강화",
      
      goal: {
        primary: "원료의 연구 역사를 통해 신뢰도 증명",
        secondary: "국제적 인정, 학술 발표 수 등으로 객관화",
        avoid: "임상 개선 결과, 효능 표현"
      },
      
      structure: "연구 역사 + 학술 발표 + 국제적 인정 + 안전성",
      
      keyMetrics: [
        "연구 기간 (몇 년)",
        "학술 발표 수 (몇 회)",
        "연구 국가/기관 수",
        "국제 기준 포함 여부"
      ],
      
      audience: "원료의 신뢰성을 객관적으로 확인하고 싶은 고객",
      
      nextSection: "formula (품질 신뢰)"
    },

    formula: {
      id: "formula",
      name: "함량 및 배합의 의도",
      order: 5,
      wordCount: "120-160자",
      
      purpose: "제조 신뢰 기초",
      
      goal: {
        primary: "정확한 함량을 명시",
        secondary: "배합의 의도를 설명 (왜 이 원료들을 함께)",
        avoid: "이 함량으로 효과가, 더 많을수록"
      },
      
      structure: "주성분 함량 + 1일 섭취량 + 부원료 + 배합 의도",
      
      requiredInfo: [
        "주 성분명 (명확하게)",
        "함량 (mg 단위)",
        "1일 섭취량",
        "부원료 소개",
        "배합이 과학적인 이유"
      ],
      
      audience: "제품 구성을 자세히 알고 싶은 고객",
      
      nextSection: "manufacturing (제조 검증)"
    },

    manufacturing: {
      id: "manufacturing",
      name: "제조 신뢰와 품질 관리",
      order: 6,
      wordCount: "120-160자",
      
      purpose: "제조 신뢰 증명",
      
      goal: {
        primary: "좋은 원료를 제대로 만들었음을 증명",
        secondary: "투명한 품질 관리 체계 제시",
        avoid: "100% 안전, 부작용 없음, 최고 품질"
      },
      
      structure: "인증 + 검사 항목 + 기준 + 투명성",
      
      requiredInfo: [
        "제조 시설 인증 (GMP, HACCP 등)",
        "검사 항목 (구체적으로)",
        "기준 또는 수치",
        "각 배치마다 검사",
        "제3기관 검사 여부"
      ],
      
      audience: "제조 과정의 신뢰성을 확인하고 싶은 고객",
      
      nextSection: "routine (실천)"
    },

    routine: {
      id: "routine",
      name: "일상의 관리 루틴",
      order: 7,
      wordCount: "100-140자",
      
      purpose: "관리 개념 강화",
      
      goal: {
        primary: "섭취 방법을 제시",
        secondary: "매일의 습관, 일관성을 강조",
        avoid: "4주 후 변화, 효과 기간, 빠른 결과"
      },
      
      structure: "섭취량 + 섭취 시간 + 일상성과 일관성",
      
      requiredInfo: [
        "1일 섭취량",
        "섭취 시간 (있으면)",
        "일상 루틴화의 중요성",
        "일관성 강조 (최소 기간)",
        "꾸준함의 가치"
      ],
      
      avoidInfo: [
        "효과가 나타나는 기간",
        "빨리 효과를 보려면",
        "최대 효과는"
      ],
      
      audience: "제품을 어떻게 사용할지 알고 싶은 고객",
      
      nextSection: "cta (최종 결정)"
    },

    cta: {
      id: "cta",
      name: "CTA - 일상 관리의 시작",
      order: 8,
      wordCount: "40-60자",
      
      purpose: "최종 결정",
      
      goal: {
        primary: "좋은 원료로 일상을 관리하기 시작하도록 유도",
        secondary: "자연스럽고 격려적으로",
        avoid: "지금 당장, 서두르세요, 강압"
      },
      
      structure: "행동 + 긍정적 일상",
      
      tone: "따뜻하고 격려하는, 강요하지 않는",
      
      audience: "구매 결정을 내리려는 고객",
      
      nextSection: "없음 (끝)"
    }
  },

  // ═══════════════════════════════════════════════════════════════
  // 섹션 흐름
  // ═══════════════════════════════════════════════════════════════
  
  flow: {
    stage1: {
      name: "신뢰 형성",
      sections: ["hero", "problem"],
      goal: "공감을 통한 신뢰 기초"
    },
    
    stage2: {
      name: "신뢰 증명",
      sections: ["ingredient", "trustHistory"],
      goal: "원료 신뢰의 객관화"
    },
    
    stage3: {
      name: "품질 증명",
      sections: ["formula", "manufacturing"],
      goal: "제조 신뢰 확보"
    },
    
    stage4: {
      name: "실천 유도",
      sections: ["routine", "cta"],
      goal: "능동적 선택과 행동"
    }
  },

  // ═══════════════════════════════════════════════════════════════
  // 검증 포인트
  // ═══════════════════════════════════════════════════════════════
  
  validationPoints: {
    completeness: {
      description: "모든 섹션이 포함되어 있는가?",
      check: "8개 섹션이 모두 있는가?"
    },
    
    flow: {
      description: "섹션 순서가 논리적인가?",
      check: "신뢰 형성 → 신뢰 증명 → 품질 증명 → 실천 유도 순서인가?"
    },
    
    wordCount: {
      description: "각 섹션이 적절한 길이인가?",
      check: "지정된 글자수 범위 내인가?"
    },
    
    purpose: {
      description: "각 섹션이 목적을 달성했는가?",
      check: "각 섹션의 goal이 달성되었는가?"
    }
  }
};

// ═══════════════════════════════════════════════════════════════
// 설명: Template
// ═══════════════════════════════════════════════════════════════

/*
GENERAL_HEALTH_FOOD_TEMPLATE는
"어떻게 구성할 것인가"를 정의합니다.

이 Template는:
- 섹션이 뭔지
- 각 섹션의 목적이 뭔지
- 어디에 위치하는지
- 전체 흐름이 어떤지

만을 명시합니다.

사용 흐름:
1. Brain의 사고방식을 이해한 후
2. Template의 섹션 구조를 확인한 후
3. Prompt에게 "이 섹션에 대해 글을 써줘" 지시

확장 시:
다른 카테고리의 Template도 동일한 구조를 따릅니다:
- Fruit Template
- Coffee Template
- Cosmetic Template
- Health Functional Food Template
각각은 구조만 다르고, 구조 정의 방식은 동일합니다.
*/

// Simple alias for V6 architecture
export const generalHealthFoodTemplate = GENERAL_HEALTH_FOOD_TEMPLATE;
