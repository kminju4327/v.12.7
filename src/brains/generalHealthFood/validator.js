// ═══════════════════════════════════════════════════════════════
// GENERAL HEALTH FOOD VALIDATOR
// 역할: 생성된 콘텐츠의 규제 준수 및 품질 검증
// 특징: 생성 후 자동 검증, 상세한 피드백 제공
// ═══════════════════════════════════════════════════════════════

export const GENERAL_HEALTH_FOOD_VALIDATOR = {
  // ═══════════════════════════════════════════════════════════════
  // 검증 규칙
  // ═══════════════════════════════════════════════════════════════
  
  validationRules: {
    compliance: {
      name: "규제 준수",
      category: "Mandatory",
      checks: [
        {
          id: "no-treatment",
          name: "치료 표현 금지",
          forbidden: ["치료", "의약품", "약", "처방"],
          severity: "critical"
        },
        {
          id: "no-efficacy",
          name: "직접 효능 표현 금지",
          forbidden: ["개선", "도움이 된다", "효과", "효능", "낫다"],
          severity: "critical"
        },
        {
          id: "no-disease",
          name: "질병 언어 금지",
          forbidden: ["질병", "질환", "병", "증상", "불치"],
          severity: "high"
        },
        {
          id: "no-functional",
          name: "기능성 표현 금지",
          forbidden: ["기능성", "인정", "임상에서 확인", "효능 입증"],
          severity: "critical"
        },
        {
          id: "no-exaggeration",
          name: "과장 표현 금지",
          forbidden: ["100%", "기적", "완치", "부작용 없음", "모든 사람"],
          severity: "high"
        },
        {
          id: "no-time-promise",
          name: "효과 기간 표현 금지",
          forbidden: ["4주 후", "8주 후", "X주 후 효과", "X일 후 개선"],
          pattern: /\d+주\s+(후|이후)\s+(변화|효과|개선)/,
          severity: "high"
        }
      ]
    },

    quality: {
      name: "내용 품질",
      category: "Optional",
      checks: [
        {
          id: "preferred-concepts",
          name: "선호 개념 포함",
          preferred: ["관리", "선택", "신뢰", "일상", "꾸준함"],
          minCount: 3,
          severity: "medium"
        },
        {
          id: "tone-consistency",
          name: "톤앤매너 일관성",
          check: "전체 문장이 따뜻하고 공감적인가?",
          severity: "medium"
        },
        {
          id: "ingredient-focus",
          name: "원료 중심",
          check: "제품보다 원료의 신뢰도를 강조하는가?",
          sections: ["ingredient", "trustHistory", "formula"],
          severity: "high"
        },
        {
          id: "no-coercion",
          name: "강압 없음",
          forbidden: ["지금 당장", "서두르세요", "기회를 놓치지", "남은 재고"],
          severity: "medium"
        }
      ]
    },

    structure: {
      name: "구조",
      category: "Mandatory",
      checks: [
        {
          id: "section-completeness",
          name: "섹션 완성도",
          expectedSections: 8,
          severity: "critical"
        },
        {
          id: "word-count",
          name: "글자 수 확인",
          sections: {
            hero: { min: 50, max: 80 },
            problem: { min: 120, max: 160 },
            ingredient: { min: 100, max: 150 },
            trustHistory: { min: 100, max: 150 },
            formula: { min: 120, max: 160 },
            manufacturing: { min: 120, max: 160 },
            routine: { min: 100, max: 140 },
            cta: { min: 40, max: 60 }
          },
          severity: "medium"
        },
        {
          id: "section-order",
          name: "섹션 순서",
          expectedOrder: ["hero", "problem", "ingredient", "trustHistory", "formula", "manufacturing", "routine", "cta"],
          severity: "high"
        }
      ]
    }
  },

  // ═══════════════════════════════════════════════════════════════
  // 검증 함수
  // ═══════════════════════════════════════════════════════════════
  
  validate: (content, sections = null) => {
    const result = {
      status: "pending",
      score: 100,
      errors: [],
      warnings: [],
      details: {
        compliance: null,
        quality: null,
        structure: null
      }
    };

    // 1. 규제 준수 검증
    result.details.compliance = validateCompliance(content);
    if (result.details.compliance.errors.length > 0) {
      result.errors.push(...result.details.compliance.errors);
      result.score -= result.details.compliance.errors.length * 10;
    }
    if (result.details.compliance.warnings.length > 0) {
      result.warnings.push(...result.details.compliance.warnings);
      result.score -= result.details.compliance.warnings.length * 5;
    }

    // 2. 내용 품질 검증
    result.details.quality = validateQuality(content);
    if (result.details.quality.warnings.length > 0) {
      result.warnings.push(...result.details.quality.warnings);
      result.score -= result.details.quality.warnings.length * 3;
    }

    // 3. 구조 검증
    if (sections) {
      result.details.structure = validateStructure(sections);
      if (result.details.structure.errors.length > 0) {
        result.errors.push(...result.details.structure.errors);
        result.score -= result.details.structure.errors.length * 15;
      }
    }

    // 최종 상태 결정
    result.status = result.errors.length === 0 ? "passed" : "failed";
    result.score = Math.max(0, result.score);

    return result;
  },

  // ═══════════════════════════════════════════════════════════════
  // 상세 검증 함수들
  // ═══════════════════════════════════════════════════════════════
  
  validateCompliance: (content) => {
    const result = { errors: [], warnings: [] };

    const forbiddenWords = {
      critical: ["치료", "의약품", "약", "기능성", "임상에서 확인"],
      high: ["개선", "도움이 된다", "효과", "효능", "질병", "질환", "100%", "기적", "완치"]
    };

    // 중대 위반사항 체크
    forbiddenWords.critical.forEach(word => {
      if (content.includes(word)) {
        result.errors.push({
          type: "critical",
          message: `⛔ 규제 위반: "${word}" 사용 (금지어)`,
          word: word
        });
      }
    });

    // 높은 위반사항 체크
    forbiddenWords.high.forEach(word => {
      if (content.includes(word)) {
        result.warnings.push({
          type: "high",
          message: `⚠️ 위험: "${word}" 사용 (기능성처럼 들림)`,
          word: word
        });
      }
    });

    // 기간 표현 체크
    const timePatterns = [
      /\d+주\s+(후|이후)/,
      /\d+개월\s+(후|이후)/,
      /\d+일\s+(후|이후)/
    ];
    
    timePatterns.forEach(pattern => {
      if (pattern.test(content)) {
        result.warnings.push({
          type: "high",
          message: "⚠️ 위험: 효과 기간 표현 (결과를 보장하는 것처럼 보임)"
        });
      }
    });

    return result;
  },

  validateQuality: (content) => {
    const result = { warnings: [] };

    // 선호 개념 체크
    const preferredConcepts = ["관리", "선택", "신뢰", "일상", "꾸준함"];
    const foundConcepts = preferredConcepts.filter(concept => content.includes(concept));
    
    if (foundConcepts.length < 3) {
      result.warnings.push({
        type: "medium",
        message: `📌 선호 개념 부족: ${foundConcepts.length}개 포함 (권장: 3개 이상)`,
        found: foundConcepts
      });
    }

    // 강압 표현 체크
    const coerciveWords = ["지금 당장", "서두르세요", "기회를 놓치지", "남은 재고"];
    const foundCoercive = coerciveWords.filter(word => content.includes(word));
    
    if (foundCoercive.length > 0) {
      result.warnings.push({
        type: "medium",
        message: `🚫 강압 표현 감지: ${foundCoercive.join(", ")}`
      });
    }

    // 의약품 톤 체크
    const medicalWords = ["환자", "처방", "의사", "진단", "치료법"];
    const foundMedical = medicalWords.filter(word => content.includes(word));
    
    if (foundMedical.length > 0) {
      result.warnings.push({
        type: "high",
        message: `🏥 의약품 언어 감지: ${foundMedical.join(", ")}`
      });
    }

    return result;
  },

  validateStructure: (sections) => {
    const result = { errors: [] };

    const expectedSections = ["hero", "problem", "ingredient", "trustHistory", "formula", "manufacturing", "routine", "cta"];
    
    // 섹션 완성도 체크
    const foundSections = Object.keys(sections).filter(s => sections[s] && sections[s].trim().length > 0);
    
    if (foundSections.length !== expectedSections.length) {
      result.errors.push({
        type: "critical",
        message: `❌ 섹션 부족: ${foundSections.length}개/${expectedSections.length}개`,
        missing: expectedSections.filter(s => !foundSections.includes(s))
      });
    }

    // 글자 수 체크
    const wordCountRules = {
      hero: { min: 50, max: 80 },
      problem: { min: 120, max: 160 },
      ingredient: { min: 100, max: 150 },
      trustHistory: { min: 100, max: 150 },
      formula: { min: 120, max: 160 },
      manufacturing: { min: 120, max: 160 },
      routine: { min: 100, max: 140 },
      cta: { min: 40, max: 60 }
    };

    Object.entries(sections).forEach(([sectionId, content]) => {
      if (!content) return;
      
      const rule = wordCountRules[sectionId];
      const count = content.length;
      
      if (count < rule.min || count > rule.max) {
        result.errors.push({
          type: "warning",
          message: `📏 ${sectionId}: ${count}자 (권장: ${rule.min}-${rule.max}자)`,
          current: count,
          recommended: `${rule.min}-${rule.max}`
        });
      }
    });

    return result;
  },

  // ═══════════════════════════════════════════════════════════════
  // 검증 결과 포맷팅
  // ═══════════════════════════════════════════════════════════════

  formatResult: (validationResult) => {
    const lines = [];
    
    lines.push(`
${"═".repeat(60)}`);
    lines.push(`검증 결과: ${validationResult.status === "passed" ? "✅ 통과" : "❌ 실패"}`);
    lines.push(`점수: ${validationResult.score}/100`);
    lines.push(`${"═".repeat(60)}`);

    if (validationResult.errors.length > 0) {
      lines.push(`
🚫 중대 오류 (${validationResult.errors.length}건):`);
      validationResult.errors.forEach(error => {
        lines.push(`  - ${error.message}`);
      });
    }

    if (validationResult.warnings.length > 0) {
      lines.push(`
⚠️ 경고 (${validationResult.warnings.length}건):`);
      validationResult.warnings.forEach(warning => {
        lines.push(`  - ${warning.message}`);
      });
    }

    if (validationResult.errors.length === 0 && validationResult.warnings.length === 0) {
      lines.push(`
✅ 모든 검증 통과!`);
    }

    lines.push(`${"═".repeat(60)}
`);

    return lines.join("\n");
  }
};

// ═══════════════════════════════════════════════════════════════
// 내부 검증 함수들
// ═══════════════════════════════════════════════════════════════

const validateCompliance = (content) => {
  return GENERAL_HEALTH_FOOD_VALIDATOR.validateCompliance(content);
};

const validateQuality = (content) => {
  return GENERAL_HEALTH_FOOD_VALIDATOR.validateQuality(content);
};

const validateStructure = (sections) => {
  return GENERAL_HEALTH_FOOD_VALIDATOR.validateStructure(sections);
};

// ═══════════════════════════════════════════════════════════════
// 설명: Validator
// ═══════════════════════════════════════════════════════════════

/*
GENERAL_HEALTH_FOOD_VALIDATOR는
"생성된 콘텐츠를 검증"합니다.

이 Validator는:
- 규제 준수 확인 (Critical)
- 내용 품질 확인 (Optional)
- 구조 완성도 확인 (Mandatory)

사용 흐름:
1. Claude가 각 섹션 생성
2. Validator가 자동 검증
3. 오류/경고 피드백
4. 필요시 재작성

점수 시스템:
- 0-50: 불합격
- 51-79: 경고 있음
- 80-99: 양호
- 100: 완벽

확장 시:
다른 카테고리의 Validator도
동일한 구조를 따릅니다:
- Fruit Validator
- Coffee Validator
- Cosmetic Validator
각각의 고유한 검증 규칙만 추가됩니다.
*/

// Simple alias for V6 architecture
export const generalHealthFoodValidator = GENERAL_HEALTH_FOOD_VALIDATOR;
