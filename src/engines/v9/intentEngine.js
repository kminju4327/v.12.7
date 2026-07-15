const clean = (value) => String(value ?? "").trim();

const INTENT_RULES = [
  ["amount", /함량|EPA|DHA|수치|순도|성분량|기능성 성분/i],
  ["beanOrigin", /원산지와 원두|원두.*산지|원두 품종/i],
  ["roast", /로스팅/i],
  ["flavor", /향미|맛 프로필|향과 맛/i],
  ["brew", /추출/i],
  ["teaLeaf", /찻잎/i],
  ["steep", /우리는|우림/i],
  ["catch", /어획|양식|자연산/i],
  ["freshness", /신선도|유통 기준|냉장|냉동/i],
  ["trimming", /손질 상태|손질 정보/i],
  ["grade", /등급|육질/i],
  ["cut", /부위/i],
  ["aging", /숙성/i],
  ["farming", /사육|생산 이력/i],
  ["harvest", /수확.*선별|선별 기준/i],
  ["variety", /품종|상품 특성|맛의 특징|당도|식감/i],
  ["shipping", /포장|배송/i],
  ["origin", /산지|원산지|재배 환경/i],
  ["convenience", /간편|구성품|조리 편의/i],
  ["recipe", /조리 방법|조리 순서/i],
  ["cooking", /조리와|즐기는 방법/i],
  ["baking", /굽는|베이킹/i],
  ["texture", /식감과 풍미|식감/i],
  ["portion", /휴대|개별 포장|용량/i],
  ["pairing", /즐기는 순간|페어링|어울리는/i],
  ["flavorUse", /풍미와 활용|활용법/i],
  ["beverageIngredient", /원료와 제조/i],
  ["ingredients", /원재료와 가공|원재료/i],
  ["mainIngredient", /주원료와 구성|주원료/i],
  ["extraction", /압착|추출 방식|착유/i],
  ["process", /제조 방식|가공 방식/i],
  ["taste", /맛과 식감|맛의 특징/i],
  ["giftComposition", /세트 구성/i],
  ["giftPackage", /선물 포장/i],
  ["giftMoment", /선물하기 좋은/i],
  ["quality", /품질|제조|검사|인증|안전|신뢰/i],
  ["storage", /보관/i],
  ["usage", /섭취|사용|활용|먹는 법/i],
  ["formula", /배합|포뮬러|부원료/i],
  ["ingredient", /원료|출처|형태/i],
  ["comparison", /비교|차이|고르는|선택 기준/i],
  ["closing", /마무리|최종|결정|CTA|최종 확인/i],
  ["overview", /핵심 가치|제품 소개/i],
];

export function inferIntent(section = {}, index = 0) {
  const title = clean(section.title);
  const description = clean(section.description || section.body || section.purpose);
  const joined = `${title} ${description}`;
  if (index === 0 && /선택 기준|핵심|도입|첫 화면|시작/i.test(joined)) return "hero";
  for (const [intent, pattern] of INTENT_RULES) if (pattern.test(joined)) return intent;
  if (index === 0) return "hero";
  return "information";
}

function requiredFlow(profile = {}) {
  if (profile.productReasoning?.flow?.length) return profile.productReasoning.flow;
  if (profile.story?.flow?.length) return ["hero", ...profile.story.flow, "closing"];
  if (profile.isOmega3) return ["hero", "amount", "ingredient", "quality", "usage", "closing"];
  if (profile.isBerberine) return ["hero", "ingredient", "formula", "quality", "usage", "closing"];
  if (profile.isRedGinseng) return ["hero", "ingredient", "quality", "usage", "closing"];
  return ["hero", "ingredient", "quality", "usage", "closing"];
}

function defaultMessage(type, profile = {}) {
  if (type === "hero") return profile.story?.hero?.title || "제품 선택의 핵심 기준";
  if (type === "closing") return "구매 전 최종 확인";
  const found = profile.story?.flowItems?.find((item) => item.id === type);
  if (found) return found.title;
  const messages = {
    amount: profile.isOmega3 ? "기능성 성분 함량" : "함량과 수치 정보",
    ingredient: "원료 정보", formula: "배합 구성", quality: "품질 관리", usage: "섭취 방법",
  };
  return messages[type] || "제품 정보";
}

export function createSectionIntents(pageDesign = {}, profile = {}) {
  const structure = Array.isArray(pageDesign.pageStructure) ? pageDesign.pageStructure.filter(Boolean) : [];
  const original = structure.map((section, index) => ({
    id: section.id || `intent_${index + 1}`,
    order: index,
    type: inferIntent(section, index),
    goal: clean(section.description || section.purpose),
    message: clean(section.title),
    source: section,
    locked: true,
    synthesized: false,
  }));

  const flow = requiredFlow(profile);
  const byType = new Map();
  for (const intent of original) if (!byType.has(intent.type)) byType.set(intent.type, intent);

  const locked = flow.map((type, index) => byType.get(type) || ({
    id: `required_${type}`,
    order: index,
    type,
    goal: "",
    message: defaultMessage(type, profile),
    source: {},
    locked: true,
    synthesized: true,
  }));

  return locked.map((intent, index) => ({ ...intent, order: index }));
}
