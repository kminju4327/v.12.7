import { object, uniqueTextItems } from "../utils/koreanLanguage.js";

const text = (value) => String(value ?? "").trim();
const includesAny = (value, words) => {
  const normalized = text(value).toLowerCase();
  return words.some((word) => normalized.includes(String(word).toLowerCase()));
};

const CATEGORY_ALIASES = {
  health: ["건강·영양식품", "건강영양식품", "건강관리 식품", "건강관리식품", "건강,영양식품", "건강·영양식품"],
  fresh: ["신선식품"],
  livestock: ["축산물"],
  seafood: ["수산물"],
  processed: ["가공식품"],
  meal: ["면·간편식", "면,간편식", "면/간편식", "간편식"],
  bakery: ["베이커리·디저트", "베이커리디저트", "베이커리/디저트"],
  beverage: ["음료"],
  snack: ["간식"],
  seasoning: ["조미료·식재료", "조미료,식재료", "조미료/식재료"],
  gift: ["선물세트"],
  other: ["기타 식품", "기타식품"],
};

const FLOW_LABELS = {
  origin: ["산지·원산지", "어디에서 생산됐는지와 생산 환경을 보여줍니다."],
  variety: ["품종과 상품 특성", "품종별 맛, 향, 식감처럼 구매 판단에 필요한 차이를 정리합니다."],
  harvest: ["수확과 선별 기준", "수확 시기와 크기·상태를 확인하는 선별 과정을 설명합니다."],
  shipping: ["포장과 배송", "상품 상태를 지키는 포장 방식과 배송 과정을 안내합니다."],
  storage: ["보관과 활용", "품질을 오래 유지하는 보관 기준과 활용 방법을 안내합니다."],
  grade: ["등급과 품질 기준", "등급, 육질, 선별 기준처럼 품질을 비교하는 정보를 보여줍니다."],
  cut: ["부위와 특징", "부위별 식감과 용도, 조리 특징을 이해하기 쉽게 정리합니다."],
  aging: ["숙성과 손질", "숙성 또는 손질 과정이 맛과 편의성에 어떤 차이를 만드는지 설명합니다."],
  farming: ["사육과 생산 정보", "사육 환경과 생산 이력을 확인할 수 있는 정보를 정리합니다."],
  catch: ["어획·양식 정보", "자연산·양식 여부와 생산 방식을 확인할 수 있도록 안내합니다."],
  freshness: ["신선도와 유통 기준", "냉장·냉동 상태와 온도 유지 방식 등 신선도 기준을 보여줍니다."],
  trimming: ["손질 상태", "손질 범위와 조리 전 준비가 얼마나 필요한지 명확히 안내합니다."],
  cooking: ["조리와 즐기는 방법", "제품에 맞는 조리법과 맛있게 즐기는 방법을 정리합니다."],
  mainIngredient: ["주원료와 구성", "무엇으로 만들었는지와 제품 구성을 명확하게 보여줍니다."],
  process: ["제조 방식", "가공·제조 과정이 맛과 품질에 어떤 차이를 만드는지 설명합니다."],
  extraction: ["압착·추출 방식", "압착, 볶음, 추출 방식이 풍미와 품질에 어떤 차이를 만드는지 설명합니다."],
  taste: ["맛과 식감", "맛, 향, 식감의 특징을 구매자가 상상할 수 있도록 전달합니다."],
  convenience: ["간편함과 구성", "조리 시간, 구성품, 준비 과정 등 사용 편의성을 보여줍니다."],
  recipe: ["조리 방법", "누구나 쉽게 따라 할 수 있도록 조리 순서를 안내합니다."],
  baking: ["굽는 방식과 완성도", "굽기와 제조 방식이 식감과 풍미에 미치는 차이를 설명합니다."],
  pairing: ["즐기는 순간", "간식, 디저트, 식사 등 어울리는 상황과 페어링을 제안합니다."],
  beanOrigin: ["원산지와 원두", "원두의 산지와 품종이 향미에 어떤 차이를 만드는지 보여줍니다."],
  roast: ["로스팅 포인트", "로스팅 정도와 방식에 따른 향과 맛의 특징을 설명합니다."],
  flavor: ["향미 프로필", "산미, 단맛, 바디감과 향의 인상을 이해하기 쉽게 정리합니다."],
  brew: ["추천 추출법", "분쇄도, 물 온도, 추출 방식 등 맛있게 즐기는 기준을 안내합니다."],
  teaLeaf: ["찻잎과 산지", "찻잎의 산지와 종류, 가공 방식에 따른 특징을 보여줍니다."],
  steep: ["우리는 방법", "물 온도와 시간 등 차를 맛있게 우리는 기준을 안내합니다."],
  beverageIngredient: ["원료와 제조", "사용한 원료와 착즙·추출·혼합 방식을 설명합니다."],
  drink: ["맛있게 마시는 방법", "온도, 희석, 페어링 등 제품에 맞는 음용 방법을 제안합니다."],
  texture: ["식감과 풍미", "바삭함, 부드러움, 진한 풍미 등 제품의 감각적 특징을 전달합니다."],
  portion: ["포장과 휴대성", "개별 포장, 용량, 보관 편의성을 안내합니다."],
  flavorUse: ["풍미와 활용", "요리에 더하는 맛과 어울리는 활용 장면을 제안합니다."],
  ingredients: ["원재료와 가공", "원재료의 출처와 가공 방식을 확인할 수 있도록 정리합니다."],
  giftComposition: ["세트 구성", "구성품과 수량, 조합을 한눈에 이해할 수 있게 보여줍니다."],
  giftPackage: ["선물 포장", "포장 완성도와 전달하기 좋은 상태를 시각적으로 보여줍니다."],
  giftMoment: ["선물하기 좋은 이유", "어떤 대상과 상황에 잘 어울리는지 구체적으로 제안합니다."],
  overview: ["제품의 핵심 가치", "제품을 선택할 때 필요한 핵심 정보를 순서대로 정리합니다."],
  quality: ["품질과 신뢰", "제조·검사·표시 정보를 바탕으로 신뢰 기준을 보여줍니다."],
  selection: ["구매 전 최종 확인", "구매 전에 확인할 핵심 기준을 다시 정리합니다."],
};

const CATEGORY_DEFS = {
  fresh: {
    label: "신선식품", design: "Fresh Origin", tone: "신선하고 생생한 정보 중심",
    flow: ["origin", "variety", "harvest", "shipping", "storage"],
    features: ["산지와 생산 환경", "품종과 맛의 특징", "수확·선별 기준", "포장·배송과 보관"],
    forbidden: ["기능성", "배합", "섭취량", "원료 형태", "임상"],
    hero: (n) => `${n}, 신선함의 기준은 생산 과정에서 시작됩니다`,
    heroBody: "산지와 품종, 수확·선별, 포장·배송과 보관 정보를 따라가면 맛과 신선함의 이유를 쉽게 이해할 수 있습니다.",
    target: "맛과 신선도를 기준으로 신선식품을 고르는 고객",
  },
  livestock: {
    label: "축산물", design: "Origin & Grade", tone: "신뢰감 있고 정직한 품질 중심",
    flow: ["origin", "farming", "grade", "cut", "aging", "shipping", "storage"],
    features: ["원산지와 생산 이력", "등급과 품질 기준", "부위와 육질", "숙성·포장·보관"],
    forbidden: ["배합", "재배 환경", "기능성", "섭취량"],
    hero: (n) => `${n}, 원산지와 등급에서 품질의 차이가 시작됩니다`,
    heroBody: "생산 이력과 등급, 부위, 숙성·손질, 포장과 보관 기준을 확인하면 원하는 육질과 용도에 맞게 선택할 수 있습니다.",
    target: "원산지와 등급, 부위를 꼼꼼히 비교하는 고객",
  },
  seafood: {
    label: "수산물", design: "Fresh Catch", tone: "깔끔하고 신뢰감 있는 신선도 중심",
    flow: ["origin", "catch", "freshness", "trimming", "shipping", "cooking", "storage"],
    features: ["원산지와 어획·양식 정보", "신선도와 유통 기준", "손질 상태", "포장·조리·보관"],
    forbidden: ["배합", "재배 환경", "품종과 당도", "섭취량", "기능성"],
    hero: (n) => `${n}, 원산지와 신선도부터 확인하세요`,
    heroBody: "어획·양식 정보와 손질 상태, 냉장·냉동 유통, 포장과 보관 기준을 확인하면 더 안심하고 선택할 수 있습니다.",
    target: "신선도와 손질 상태를 확인해 수산물을 고르는 고객",
  },
  processed: {
    label: "가공식품", design: "Clear Process", tone: "명확하고 실용적인 정보 중심",
    flow: ["mainIngredient", "process", "taste", "quality", "storage", "cooking"],
    features: ["주원료와 구성", "제조 방식", "맛과 식감", "품질·보관·활용"],
    forbidden: ["임상", "기능성 단정", "치료"],
    hero: (n) => `${n}, 무엇으로 어떻게 만들었는지부터 살펴보세요`,
    heroBody: "주원료와 제조 방식, 맛과 식감, 보관과 활용 정보를 차례로 확인하면 제품의 차이를 쉽게 이해할 수 있습니다.",
    target: "원재료와 제조 정보를 확인해 가공식품을 고르는 고객",
  },
  meal: {
    label: "면·간편식", design: "Easy Meal", tone: "간편하고 실용적인 생활 중심",
    flow: ["convenience", "mainIngredient", "taste", "recipe", "storage", "pairing"],
    features: ["조리 편의성", "제품 구성", "맛과 식감", "조리·보관·활용"],
    forbidden: ["섭취량", "기능성", "임상", "건강 개선"],
    hero: (n) => `${n}, 간편함과 맛을 함께 확인하세요`,
    heroBody: "구성과 조리 시간, 맛과 식감, 보관과 활용 방법을 살펴보면 바쁜 일상에 잘 맞는지 판단하기 쉽습니다.",
    target: "빠르고 맛있는 한 끼를 찾는 고객",
  },
  bakery: {
    label: "베이커리·디저트", design: "Warm Bakery", tone: "따뜻하고 감각적인 식감 중심",
    flow: ["mainIngredient", "baking", "texture", "pairing", "portion", "storage"],
    features: ["재료와 제조 방식", "굽기와 식감", "풍미", "포장·보관·즐기는 방법"],
    forbidden: ["기능성", "섭취량", "임상", "배합 효능"],
    hero: (n) => `${n}, 한입의 식감과 풍미를 먼저 만나보세요`,
    heroBody: "재료와 굽는 방식, 식감과 풍미, 포장과 보관 정보를 따라가면 제품의 매력을 더 생생하게 느낄 수 있습니다.",
    target: "식감과 풍미를 중요하게 보는 디저트 고객",
  },
  beverage: {
    label: "음료", design: "Refresh Story", tone: "감각적이고 라이프스타일 중심",
    flow: ["beverageIngredient", "process", "taste", "drink", "storage"],
    features: ["원료와 제조 방식", "맛과 향", "음용 방법", "보관 기준"],
    forbidden: ["기능성 단정", "피로 회복", "치료", "섭취량"],
    hero: (n) => `${n}, 원료와 맛의 개성부터 확인하세요`,
    heroBody: "원료와 제조 방식, 맛과 향, 음용 방법과 보관 기준을 살펴보면 취향에 맞는 선택이 쉬워집니다.",
    target: "맛과 향, 음용 경험을 중요하게 보는 고객",
  },
  coffee: {
    label: "커피", design: "Roast & Aroma", tone: "감성적이고 전문적인 향미 중심",
    flow: ["beanOrigin", "roast", "flavor", "brew", "storage", "pairing"],
    features: ["원산지와 원두 품종", "로스팅 포인트", "향미 프로필", "추출·보관 가이드"],
    forbidden: ["배합 구성", "섭취량", "기능성", "건강 개선"],
    hero: (n) => `${n}, 향과 로스팅에서 취향의 차이가 시작됩니다`,
    heroBody: "원두의 산지와 품종, 로스팅, 향미와 추출 방법을 따라가면 내 취향에 맞는 한 잔을 더 쉽게 찾을 수 있습니다.",
    target: "원두의 향미와 로스팅 취향을 비교하는 고객",
  },
  tea: {
    label: "차", design: "Tea Origin", tone: "차분하고 섬세한 향 중심",
    flow: ["teaLeaf", "process", "flavor", "steep", "storage", "pairing"],
    features: ["찻잎과 산지", "가공 방식", "향과 맛", "우림·보관 가이드"],
    forbidden: ["배합 효능", "치료", "기능성 단정"],
    hero: (n) => `${n}, 찻잎과 향에서 차이가 시작됩니다`,
    heroBody: "찻잎의 산지와 가공 방식, 향과 맛, 우리는 방법을 차례로 살펴보면 취향에 맞는 차를 찾기 쉽습니다.",
    target: "찻잎의 향과 우림 방식을 중요하게 보는 고객",
  },
  snack: {
    label: "간식", design: "Snack Moment", tone: "경쾌하고 감각적인 맛 중심",
    flow: ["ingredients", "texture", "portion", "storage", "pairing"],
    features: ["원재료와 가공", "맛과 식감", "포장과 휴대성", "보관·즐기는 방법"],
    forbidden: ["기능성", "치료", "섭취량"],
    hero: (n) => `${n}, 맛과 식감에서 즐거움이 시작됩니다`,
    heroBody: "원재료와 가공 방식, 맛과 식감, 포장과 보관 정보를 살펴보면 원하는 간식 경험을 쉽게 찾을 수 있습니다.",
    target: "맛과 식감, 간편한 포장을 중요하게 보는 고객",
  },
  seasoning: {
    label: "조미료·식재료", design: "Kitchen Origin", tone: "정직하고 풍미 중심의 실용적 정보",
    flow: ["origin", "ingredients", "extraction", "flavorUse", "quality", "storage"],
    features: ["원산지와 원재료", "가공 방식", "풍미와 활용", "품질·보관 기준"],
    forbidden: ["기능성 단정", "치료", "섭취량"],
    hero: (n) => `${n}, 원재료와 풍미에서 요리의 차이가 시작됩니다`,
    heroBody: "원산지와 원재료, 가공 방식, 풍미와 활용법을 확인하면 요리에 맞는 식재료를 더 쉽게 고를 수 있습니다.",
    target: "원재료와 풍미, 활용도를 꼼꼼히 보는 고객",
  },
  gift: {
    label: "선물세트", design: "Gift Signature", tone: "품격 있고 배려가 느껴지는 구성 중심",
    flow: ["giftComposition", "origin", "quality", "giftPackage", "giftMoment", "storage"],
    features: ["세트 구성", "원산지와 품질", "선물 포장", "선물 대상·보관 안내"],
    forbidden: ["섭취량", "기능성 단정", "치료"],
    hero: (n) => `${n}, 구성과 포장에 마음을 담았습니다`,
    heroBody: "구성품과 품질, 포장 완성도와 선물하기 좋은 순간을 살펴보면 받는 사람까지 생각한 선택이 쉬워집니다.",
    target: "구성과 포장 완성도를 중요하게 보는 선물 고객",
  },
  other: {
    label: "기타 식품", design: "Clear Choice", tone: "명확하고 균형 잡힌 정보 중심",
    flow: ["overview", "mainIngredient", "process", "taste", "quality", "storage"],
    features: ["제품의 핵심 특징", "구성과 제조 방식", "맛과 활용", "품질·보관 정보"],
    forbidden: ["치료", "확정적 효능"],
    hero: (n) => `${n}, 핵심 정보부터 차근차근 살펴보세요`,
    heroBody: "제품의 구성과 제조 방식, 맛과 활용, 품질과 보관 정보를 순서대로 확인할 수 있도록 정리했습니다.",
    target: "제품 정보를 비교해 합리적으로 선택하는 고객",
  },
};


const PRODUCT_CATEGORY_EXCEPTIONS = [
  ["meal", ["라면", "컵라면", "우동", "국수", "파스타", "냉동볶음밥", "볶음밥", "즉석밥", "햇반", "밀키트", "도시락", "죽", "간편식"]],
  ["seasoning", ["벌꿀", "꿀", "올리브오일", "참기름", "들기름", "소금", "간장", "고춧가루", "식초", "시럽"]],
  ["processed", ["김치", "잼", "통조림", "참치캔", "햄", "소시지"]],
  ["fresh", ["쌀", "현미", "잡곡", "사과", "배", "복숭아", "포도", "수박", "딸기", "감귤", "토마토"]],
  ["coffee", ["원두", "커피", "드립백", "에스프레소"]],
  ["tea", ["홍차", "녹차", "우롱차", "허브티", "보이차"]],
];

function exceptionCategory(name = "", sub = "") {
  const source = `${name} ${sub}`;
  for (const [key, words] of PRODUCT_CATEGORY_EXCEPTIONS) if (includesAny(source, words)) return key;
  return null;
}

function categoryCta(key, name) {
  const ctas = {
    fresh: ["산지부터 보관까지 확인하고 더 만족스러운 신선식품을 골라보세요", `산지와 품종, 선별과 배송 기준을 함께 살펴 ${name}의 맛과 신선도를 비교해 보세요.`],
    livestock: ["원산지와 등급, 부위를 비교해 원하는 용도에 맞게 선택하세요", `생산 이력과 등급, 부위와 손질 상태를 함께 살펴 ${name}의 품질 기준을 세워보세요.`],
    seafood: ["신선도와 손질 상태를 확인하고 조리 목적에 맞게 골라보세요", `원산지와 어획·양식 정보, 유통과 손질 기준을 살펴 ${name}을 더 안심하고 선택해 보세요.`],
    processed: ["원재료와 제조 방식, 맛을 비교해 내 취향에 맞게 선택하세요", `${name}의 주원료와 제조 과정, 맛과 보관 정보를 차례로 확인해 보세요.`],
    meal: ["조리 시간과 구성, 맛을 비교해 간편한 한 끼를 골라보세요", `${name}의 구성과 조리법, 맛과 보관 편의성을 확인해 일상에 맞는지 살펴보세요.`],
    bakery: ["식감과 풍미, 보관 방식을 확인해 원하는 디저트를 골라보세요", `${name}의 재료와 굽기, 식감과 포장 정보를 비교해 즐기는 순간을 떠올려 보세요.`],
    beverage: ["원료와 맛, 마시는 방법을 비교해 취향에 맞는 음료를 찾아보세요", `${name}의 원료와 제조 방식, 향과 음용 경험을 차례로 살펴보세요.`],
    coffee: ["로스팅과 향미를 비교해 내 취향에 맞는 원두를 찾아보세요", `${name}의 산지와 로스팅, 향미와 추출법을 비교해 원하는 한 잔을 골라보세요.`],
    tea: ["찻잎과 향, 우림 방식을 비교해 취향에 맞는 차를 선택하세요", `${name}의 산지와 가공, 향과 우리는 방법을 살펴보세요.`],
    snack: ["원재료와 식감, 포장을 비교해 즐기기 좋은 간식을 골라보세요", `${name}의 맛과 식감, 휴대성과 보관 편의성을 확인해 보세요.`],
    seasoning: ["원재료와 가공 방식, 풍미를 비교해 요리에 맞게 선택하세요", `${name}의 원산지와 압착·추출 방식, 풍미와 활용법을 살펴보세요.`],
    gift: ["구성과 포장, 선물 대상을 함께 고려해 마음에 맞는 세트를 선택하세요", `${name}의 구성과 품질, 포장 완성도와 전달하기 좋은 순간을 확인해 보세요.`],
    other: ["제품의 핵심 정보와 활용 방법을 비교해 합리적으로 선택하세요", `${name}의 구성과 제조 방식, 맛과 품질, 보관 정보를 차례로 확인해 보세요.`],
  };
  return ctas[key] || ctas.other;
}

function reasoningFor(key, def) {
  const map = {
    fresh: { identity: "산지와 생산 과정이 맛과 신선도를 좌우하는 제품", purchaseReason: "원하는 맛·식감과 신선한 상태", comparison: ["산지", "품종", "선별", "배송", "보관"], resistance: "실물을 보기 전 품질과 신선도를 판단하기 어렵다는 불안", strategy: "생산 과정과 도착 상태를 순서대로 증명" },
    livestock: { identity: "원산지·등급·부위에 따라 맛과 용도가 달라지는 제품", purchaseReason: "원하는 육질과 조리 용도", comparison: ["생산 이력", "등급", "부위", "숙성·손질"], resistance: "등급과 부위 차이를 이해하기 어렵다는 불안", strategy: "등급과 부위를 조리 장면에 연결" },
    seafood: { identity: "신선도와 유통·손질 상태가 구매 만족도를 좌우하는 제품", purchaseReason: "안심할 수 있는 신선도와 조리 편의", comparison: ["원산지", "어획·양식", "유통", "손질"], resistance: "비린내·해동·선도에 대한 불안", strategy: "유통과 손질 기준을 구체적으로 제시" },
    meal: { identity: "짧은 준비 시간에 한 끼의 만족을 제공하는 제품", purchaseReason: "간편함과 안정적인 맛", comparison: ["조리 시간", "구성", "맛", "보관"], resistance: "간편하지만 맛이나 양이 부족할 수 있다는 우려", strategy: "조리 편의와 실제 식사 장면을 함께 제시" },
    coffee: { identity: "산지·로스팅·추출에 따라 취향이 갈리는 음료", purchaseReason: "내 취향에 맞는 향미 경험", comparison: ["원두", "로스팅", "향미", "추출"], resistance: "맛을 마시기 전 상상하기 어렵다는 문제", strategy: "향미를 구체적인 감각 언어로 번역" },
  };
  return map[key] || { identity: `${def.label}의 핵심 구매 기준이 분명한 제품`, purchaseReason: "제품 특성에 맞는 만족과 활용", comparison: def.flow.map((id) => FLOW_LABELS[id]?.[0] || id), resistance: "구매 전 차이를 판단하기 어렵다는 불안", strategy: "핵심 기준을 실제 사용 장면 순서로 제시" };
}

function categoryKey(product = {}) {
  const main = text(product.mainCategory || product.category);
  const sub = text(product.subCategory);
  const name = text(product.name);
  if (CATEGORY_ALIASES.health.some((v) => main.includes(v))) return "health";
  const exception = exceptionCategory(name, sub);
  if (exception) return exception;
  for (const [key, aliases] of Object.entries(CATEGORY_ALIASES)) {
    if (key === "health") continue;
    if (aliases.some((v) => main.includes(v))) {
      if (key === "beverage") {
        if (includesAny(`${sub} ${name}`, ["커피", "원두", "드립", "에스프레소"])) return "coffee";
        if (includesAny(`${sub} ${name}`, ["차", "티", "홍차", "녹차", "허브티"])) return "tea";
      }
      return key;
    }
  }
  if (includesAny(sub, ["과일", "채소"])) return "fresh";
  if (includesAny(sub, ["생선", "해산물", "갑각류", "조개"])) return "seafood";
  if (includesAny(sub, ["커피"])) return "coffee";
  return "other";
}

export function resolveCategoryStory(product = {}) {
  const key = categoryKey(product);
  if (key === "health") return null;
  const def = CATEGORY_DEFS[key] || CATEGORY_DEFS.other;
  const name = text(product.name) || def.label;
  const [ctaTitle, ctaBody] = categoryCta(key, name);
  return {
    key,
    ...def,
    name,
    ctaTitle,
    ctaBody,
    reasoning: reasoningFor(key, def),
    flowItems: def.flow.map((id) => ({ id, title: FLOW_LABELS[id]?.[0] || id, description: FLOW_LABELS[id]?.[1] || "" })),
  };
}

export function buildCategoryDesignProfile(product = {}) {
  const story = resolveCategoryStory(product);
  if (!story) return null;
  const target = text(product.target) || story.target;
  const flow = story.flowItems.map((item) => [item.title, item.description]);
  return {
    storyKey: story.key,
    summary: `${story.name}은 ${story.features.join(", ")}를 중심으로 구매 기준을 보여주는 것이 중요합니다. 카테고리와 맞지 않는 표현은 제외하고 실제로 확인 가능한 정보 순서로 설계합니다.`,
    features: story.features,
    points: story.features.map((label, index) => ({ label, level: index < 2 ? "매우 중요" : "중요", reason: `${label}은 ${story.label}을 선택할 때 확인해야 할 핵심 기준입니다.` })),
    targets: uniqueTextItems([
      { label: target, reason: `${story.label}의 핵심 구매 기준을 비교해 선택하는 고객입니다.` },
      { label: story.target, reason: "카테고리 특성에 맞는 정보를 꼼꼼히 확인하는 고객입니다." },
    ]),
    flow,
    designReason: `${story.label}은 ${story.flowItems.map((v) => v.title).join(" → ")} 순서로 보여줄 때 구매자가 제품의 차이를 자연스럽게 이해할 수 있습니다.`,
    design: { name: story.design, score: 5, reason: `${story.tone}으로 카테고리의 핵심 정보를 전달하기 좋습니다.` },
    images: story.flowItems.slice(0, 5).map((item, index) => ({
      label: index === 0 ? "Hero" : item.title.split("과")[0],
      recommendation: index === 0 ? `${story.name} 실물과 핵심 구매 기준을 함께 보여주는 메인 이미지` : `${item.title}을 직관적으로 보여주는 이미지`,
      reason: item.description,
    })),
    forbidden: story.forbidden,
    hero: { title: story.hero(story.name), body: story.heroBody },
    reasoning: story.reasoning,
    cta: { title: story.ctaTitle, body: story.ctaBody },
  };
}
