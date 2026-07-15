// 원료 순도(%) / 실제 함량(mg) / EPA·DHA 개별 함량을 프롬프트에 정확히 반영하기 위한
// 문자열 빌더 모음.
//
// 테스트 중 발견된 핵심 이슈:
//   - "88.1%"가 순도인지 최종 함량인지 불명확 → 거짓·과장 위반
//   - "1000mg"이 원료 총중량인지 EPA+DHA인지 불명확 → 소비자 기만 위반
//   - EPA·DHA 수치를 모른 채 "XXmg" 플레이스홀더로 비워둠 → 표시 의무 위반
// 이를 데이터 입력 단에서 구분받아 프롬프트에 명확히 박아넣는다.

// 제품 정보 블록에 붙일 '순도' 라인
export function buildPurityLine(product) {
  if (!product.purity) return "";
  return `
원료 순도: ${product.ingredientName || "핵심 원료"} 중 ${product.purity}% (이는 원료 자체의 순도이며, 최종 제품 1일 섭취량 기준 총 함량과는 다른 수치임)`;
}

// 제품 정보 블록에 붙일 '실제 함량(mg)' 라인 (원료 총중량 vs 핵심 활성성분 구분)
export function buildActualAmountLine(product) {
  if (!product.actualAmount) return "";
  const basisNote =
    product.amountBasis === "핵심 활성성분"
      ? "예: EPA+DHA처럼 기능성 인정의 근거가 되는 활성성분 자체의 합산량"
      : "예: 정제어유 전체처럼 원료의 총 중량이며, 그 안의 핵심 활성성분 함량과는 다를 수 있음";
  return `
1일 섭취량 기준 실제 함량: ${product.actualAmount}mg — 이 수치는 "${product.amountBasis}" 기준입니다 (${basisNote})`;
}

// 제품 정보 블록에 붙일 'EPA/DHA 개별 함량' 라인
export function buildEpaLine(product) {
  if (!(product.epa || product.dha)) return "";
  return `
1일 섭취량 기준 활성성분 함량: EPA ${product.epa || "미입력"}mg / DHA ${product.dha || "미입력"}mg (식약처 기능성 인정 근거 성분)`;
}

// EPA/DHA 관련 프롬프트 지침 (수치 있으면 실제 표기, 없으면 성분표 참조 안내)
export function buildEpaGuidance(product) {
  if (product.epa || product.dha) {
    return `
- EPA/DHA 함량이 제공됐습니다. 상세페이지에 "EPA ${product.epa || "?"}mg, DHA ${product.dha || "?"}mg"를 실제 수치로 명시하세요. "XXmg" 같은 플레이스홀더 절대 금지.`;
  }
  return `
- EPA/DHA 개별 함량이 입력되지 않았습니다. 상세페이지에서 EPA·DHA 수치를 추측하거나 플레이스홀더(XXmg 등)로 비워두지 마세요. "정확한 EPA·DHA 함량은 성분표에서 확인하세요"로만 안내하세요.`;
}

// 순도/함량/EPA/DHA를 종합한 '수치 표기 지침' 블록
export function buildNumericGuidance(product) {
  const epaGuidance = buildEpaGuidance(product);
  if (product.purity || product.actualAmount) {
    return `

[수치 표기 지침] 위에 제공된 순도(%)와 실제 함량(mg)은 서로 다른 의미이니 절대 혼용하지 마세요. 순도만 있으면 '원료 순도 X%'라고만 쓰고 실제 섭취량으로 단정하지 마세요. 실제 함량(mg)이 있으면, 그게 "원료 총중량" 기준인지 "핵심 활성성분" 기준인지 반드시 명시하고 절대 서로 바꿔쓰지 마세요. 특히 "원료 총중량"이 제공된 경우, 이를 핵심 활성성분(예: EPA+DHA, 기능성 성분 등) 함량인 것처럼 표현하면 안 되고, 활성성분 함량이 궁금하면 성분표를 참조하라고 안내하세요.${epaGuidance}`;
  }
  return `

[수치 표기 지침] 원료 함량(%)의 정확한 의미(순도인지 최종 함량인지, 원료 총중량인지 활성성분인지)가 제공되지 않았다면, 추측해서 단정하지 말고 '정확한 함량은 성분표를 참조하세요' 수준으로만 언급하세요.${epaGuidance}`;
}

// 제품 정보를 프롬프트용 텍스트 블록으로 조립한다.
export function buildProductBlock(product) {
  const purityLine = buildPurityLine(product);
  const actualAmountLine = buildActualAmountLine(product);
  const epaLine = buildEpaLine(product);
  return (
    `제품명: ${product.name}
` +
    `카테고리: ${product.category}
` +
    `타깃 고객: ${product.target}
` +
    `핵심 장점: ${product.benefits}
` +
    `인증정보: ${product.certs || "없음"}` +
    purityLine +
    actualAmountLine +
    epaLine
  );
}
