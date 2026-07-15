import { resolveCategoryStory } from "../categoryStoryEngine";
import { normalizeKoreanParticles, topic } from "../../utils/koreanLanguage.js";
import { resolveProductReasoning } from "../../data/productReasoningProfiles.js";

const compact = (values = []) => values.flat().map((v) => String(v ?? "").trim()).filter((v) => v && !["null", "undefined"].includes(v.toLowerCase()));
const includesAny = (text, words) => words.some((word) => String(text || "").toLowerCase().includes(String(word).toLowerCase()));
const particle = (name, withBatchim, withoutBatchim) => {
  const last = String(name || "").trim().slice(-1);
  if (!last) return withoutBatchim;
  const code = last.charCodeAt(0);
  const has = code >= 0xac00 && code <= 0xd7a3 ? (code - 0xac00) % 28 !== 0 : false;
  return has ? withBatchim : withoutBatchim;
};

export function getProductProfile(product = {}) {
  const name = String(product.name || "제품").trim();
  const normalized = name.toLowerCase();
  const story = resolveCategoryStory(product);
  const productReasoning = resolveProductReasoning(name);
  return {
    name,
    story,
    storyKey: story?.key || null,
    productReasoning,
    isOmega3: includesAny(normalized, ["오메가3", "omega3", "omega-3"]),
    isBerberine: includesAny(normalized, ["베르베린", "berberine"]),
    isRedGinseng: includesAny(normalized, ["홍삼", "red ginseng"]),
    ingredient: product.ingredientName || "",
    epa: product.epa || "",
    dha: product.dha || "",
    purity: product.purity || "",
    actualAmount: product.actualAmount || "",
    daily: product.dailyIntake || product.intake || product.howToUse || "",
    certs: product.certs || "",
  };
}

const GENERIC_COPY = {
  origin: ["생산지에서 시작되는 품질", "어디에서 생산됐는지와 생산 환경을 살펴보면 제품의 기본 품질을 더 분명하게 이해할 수 있습니다."],
  variety: ["종류에 따라 달라지는 특징", "품종과 상품 특성, 맛과 식감의 차이를 살펴보면 취향에 맞는 기준을 찾기 쉽습니다."],
  harvest: ["좋은 상태를 고르는 선별 과정", "수확 시기와 크기·색·상태를 확인하는 선별 기준은 균일한 품질을 만드는 중요한 과정입니다."],
  shipping: ["품질을 지키는 포장과 배송", "포장 방식과 배송 과정에서 제품 상태를 어떻게 지키는지 확인하면 도착 순간의 품질까지 가늠할 수 있습니다."],
  storage: ["좋은 상태를 오래 지키는 보관법", "제품 특성에 맞는 온도와 보관 방법을 지키면 맛과 품질을 더 오래 유지할 수 있습니다."],
  grade: ["등급이 보여주는 품질 기준", "등급과 육질, 선별 기준을 확인하면 원하는 맛과 용도에 맞게 비교하기 쉽습니다."],
  cut: ["부위마다 다른 맛과 활용", "부위별 식감과 풍미, 어울리는 조리법을 함께 살펴보면 용도에 맞는 선택이 쉬워집니다."],
  aging: ["숙성과 손질이 만드는 차이", "숙성과 손질 과정은 식감과 풍미, 조리 편의성에 직접적인 차이를 만듭니다."],
  farming: ["생산 이력으로 확인하는 신뢰", "사육 환경과 생산 이력을 살펴보면 제품이 어떤 기준으로 관리됐는지 확인할 수 있습니다."],
  catch: ["어획과 양식 정보를 확인하세요", "자연산·양식 여부와 생산 방식을 살펴보면 수산물의 특징을 더 정확히 이해할 수 있습니다."],
  freshness: ["신선도를 결정하는 유통 기준", "냉장·냉동 상태와 온도 유지 방식은 맛과 품질을 지키는 핵심 기준입니다."],
  trimming: ["손질 상태가 조리의 편의성을 만듭니다", "손질 범위와 조리 전 준비 과정을 확인하면 실제 사용 장면을 더 쉽게 떠올릴 수 있습니다."],
  cooking: ["맛있게 즐기는 조리 방법", "제품의 특징에 맞는 조리법과 팁을 확인하면 맛과 식감을 더 잘 살릴 수 있습니다."],
  mainIngredient: ["무엇으로 만들었는지부터 확인하세요", "주원료와 제품 구성을 살펴보면 맛과 품질의 기준을 더 쉽게 이해할 수 있습니다."],
  process: ["제조 방식이 제품의 차이를 만듭니다", "가공과 제조 과정이 맛, 식감, 보관성에 어떤 차이를 만드는지 살펴보세요."],
  extraction: ["압착과 추출 방식이 풍미를 만듭니다", "볶음, 압착, 추출 방식에 따라 향과 맛의 깊이, 활용 방식이 달라질 수 있습니다."],
  taste: ["맛과 식감으로 확인하는 제품의 개성", "맛과 향, 식감의 특징을 비교하면 취향과 활용 목적에 맞는 제품을 고르기 쉽습니다."],
  convenience: ["바쁜 일상에 맞춘 간편한 구성", "조리 시간과 구성품, 준비 과정을 확인하면 실제 사용 편의성을 판단하기 쉽습니다."],
  recipe: ["누구나 쉽게 따라 하는 조리법", "필요한 시간과 조리 순서를 간단히 정리해 실패 없이 즐길 수 있도록 안내합니다."],
  baking: ["굽는 방식에서 완성도가 달라집니다", "굽기와 제조 방식은 촉촉함, 바삭함, 풍미에 중요한 차이를 만듭니다."],
  texture: ["한입에서 느껴지는 식감과 풍미", "바삭함과 부드러움, 향과 맛의 조화를 구체적으로 보여주면 제품의 매력이 더 선명해집니다."],
  portion: ["보관과 휴대가 편한 포장", "용량과 개별 포장 여부를 확인하면 일상에서 얼마나 편하게 즐길 수 있는지 알 수 있습니다."],
  pairing: ["일상 속 잘 어울리는 순간", "식사, 간식, 휴식 시간 등 제품이 잘 어울리는 장면을 제안합니다."],
  beanOrigin: ["원산지와 원두가 향미의 시작입니다", "원두의 산지와 품종은 산미, 단맛, 향과 바디감의 기본 인상을 만듭니다."],
  roast: ["로스팅이 완성하는 맛의 깊이", "로스팅 정도와 방식에 따라 향, 산미, 단맛과 쌉쌀함의 균형이 달라집니다."],
  flavor: ["한 잔의 향미를 미리 그려보세요", "산미와 단맛, 바디감과 향의 인상을 정리하면 취향에 맞는 커피를 고르기 쉽습니다."],
  brew: ["원두에 맞는 추출법", "분쇄도와 물 온도, 추출 방식에 따라 원두의 향미를 더 균형 있게 즐길 수 있습니다."],
  teaLeaf: ["찻잎과 산지에서 시작되는 향", "찻잎의 종류와 산지, 가공 방식은 차의 향과 맛을 결정하는 기본 기준입니다."],
  steep: ["향을 살리는 우림 기준", "물 온도와 우리는 시간을 맞추면 찻잎이 가진 향과 맛을 더 균형 있게 즐길 수 있습니다."],
  beverageIngredient: ["원료와 제조 방식부터 살펴보세요", "어떤 원료를 사용하고 어떻게 추출·착즙·혼합했는지 확인하면 음료의 특징을 이해하기 쉽습니다."],
  drink: ["가장 맛있게 마시는 방법", "온도와 희석, 페어링 등 제품에 맞는 음용 방법을 확인해 보세요."],
  ingredients: ["원재료와 가공 방식", "사용한 원재료와 가공 과정을 살펴보면 맛과 식감의 차이를 이해하기 쉽습니다."],
  flavorUse: ["요리에 더하는 풍미와 활용", "어떤 맛을 더하고 어떤 요리에 잘 어울리는지 살펴보면 활용 범위가 더 선명해집니다."],
  giftComposition: ["받는 순간 이해되는 세트 구성", "구성품과 수량, 조합을 한눈에 보여주면 선물의 가치가 더 분명해집니다."],
  giftPackage: ["마음을 완성하는 선물 포장", "포장 완성도와 전달하기 좋은 상태를 보여주면 선물에 대한 기대와 신뢰를 높일 수 있습니다."],
  giftMoment: ["어떤 순간에도 잘 어울리는 선물", "선물 대상과 상황을 구체적으로 제안하면 선택의 이유가 더 분명해집니다."],
  overview: ["제품의 핵심 가치", "제품을 선택할 때 필요한 핵심 정보를 순서대로 살펴볼 수 있도록 정리했습니다."],
};

function heroCopy(profile, sourceTitle = "") {
  const { name, isOmega3, isBerberine, isRedGinseng, story, productReasoning } = profile;
  if (productReasoning?.hero) return { title: productReasoning.hero[0], body: productReasoning.hero[1] };
  if (story) return { title: story.hero(name), body: story.heroBody };
  if (isOmega3) return { title: "캡슐보다 먼저 봐야 할 숫자가 있습니다", body: `${topic(name)} EPA·DHA 함량과 원료, 품질 관리 기준을 함께 살펴보는 것이 중요합니다.` };
  if (isBerberine) return { title: "원료가 다르면 선택도 달라집니다", body: `${topic(name)} 원료의 출처와 배합 구성, 품질 정보를 함께 살펴볼 때 제품의 기준이 더 분명해집니다.` };
  if (isRedGinseng) return { title: `${name}, 원산지와 제조 기준을 함께 보세요`, body: "원료의 출처와 제조 과정, 품질 관리 정보를 함께 살펴보면 제품의 기준이 더 선명해집니다." };
  return { title: sourceTitle || `${name}, 선택 기준부터 분명하게`, body: "제품을 고를 때 필요한 핵심 정보를 순서대로 정리했습니다." };
}

function makeCopyRaw(intent, profile, source = {}, index = 0) {
  const { name, isOmega3, isBerberine, isRedGinseng, story, productReasoning } = profile;
  const sourceTitle = String(source?.message || source?.title || "").trim();
  if (intent === "hero") return heroCopy(profile, sourceTitle);
  if (productReasoning?.copy?.[intent]) {
    const [title, body] = productReasoning.copy[intent];
    return { title, body };
  }

  if (story && GENERIC_COPY[intent]) {
    const [title, body] = GENERIC_COPY[intent];
    return { title, body };
  }

  if (intent === "amount") {
    if (isOmega3) {
      const values = compact([profile.epa ? `EPA ${profile.epa}mg` : null, profile.dha ? `DHA ${profile.dha}mg` : null]);
      return values.length ? { title: "캡슐 크기보다 EPA·DHA 함량", body: `${values.join(" · ")}으로 표시된 기능성 성분 함량을 확인해 보세요.` } : { title: "캡슐 크기보다 EPA·DHA 함량", body: "캡슐 전체 중량이 아니라 제품에 표시된 EPA와 DHA의 합산량을 비교하는 것이 중요합니다." };
    }
    const numeric = compact([profile.purity ? `${profile.ingredient || "핵심 원료"} 순도 ${profile.purity}%` : null, profile.actualAmount ? `1일 기준 ${profile.actualAmount}mg` : null]);
    return numeric.length ? { title: "수치로 확인하는 핵심 기준", body: `${numeric.join(" · ")} 정보를 기준으로 제품의 구성을 살펴볼 수 있습니다.` } : { title: "함량은 객관적인 비교 기준입니다", body: "제품에 표시된 성분 함량과 기준량을 함께 살펴보세요." };
  }
  if (intent === "ingredient") {
    if (isOmega3) return { title: "같은 오메가3라도 원료는 다를 수 있습니다", body: "원료의 출처와 형태가 어떻게 표시되어 있는지 살펴보면 제품의 특징을 더 구체적으로 이해할 수 있습니다." };
    if (isBerberine) return { title: "베르베린의 시작은 원료입니다", body: "원료의 출처와 형태를 살펴보는 것이 제품의 구성과 차이를 이해하는 첫 단계입니다." };
    if (isRedGinseng) return { title: "원산지가 보여주는 원료의 기준", body: "홍삼의 원산지와 재배 정보를 살펴보면 제품이 어떤 원료에서 시작됐는지 알 수 있습니다." };
    return { title: sourceTitle || "원료를 보면 제품의 기준이 보입니다", body: "사용된 원료와 출처 정보를 차근차근 살펴보세요." };
  }
  if (intent === "formula") return isBerberine ? { title: "배합 구성이 제품의 방향을 보여줍니다", body: "주원료와 함께 담은 원료를 살펴보면 어떤 기준으로 구성했는지 이해하기 쉽습니다." } : { title: "구성에는 분명한 이유가 있습니다", body: "주원료와 함께 구성된 정보를 살펴보면 제품의 방향을 이해하기 쉽습니다." };
  if (intent === "quality") return { title: "매일 접하는 제품일수록 품질 기준은 분명하게", body: profile.certs ? `${profile.certs} 등 표시된 제조·검사·인증 정보를 통해 품질 기준을 살펴볼 수 있습니다.` : "제조 정보와 검사 기준, 인증 여부를 함께 살펴보면 선택의 불안을 줄일 수 있습니다." };
  if (intent === "usage") return { title: "일상에 맞춰 꾸준히 챙기는 방법", body: profile.daily || "제품 표시사항의 사용 방법과 보관 기준을 확인해 일상에 맞게 활용해 보세요." };
  if (intent === "closing") {
    if (story) return { title: story.ctaTitle, body: story.ctaBody };
    if (isOmega3) return { title: "EPA·DHA 함량부터 원료와 품질까지 비교해 보세요", body: "기능성 성분 함량과 원료 형태, 품질 관리와 섭취 기준을 함께 살펴보세요." };
    if (isBerberine) return { title: "원료와 배합, 품질 정보를 비교해 선택의 기준을 세워보세요", body: "원료 출처와 배합 구성, 제조·품질 정보와 섭취 기준을 함께 살펴보세요." };
    return { title: "정보를 확인할수록 선택은 더 분명해집니다", body: `${name}의 구성과 품질, 사용 정보를 비교해 보세요.` };
  }
  if (intent === "comparison") return { title: `${story?.label || "제품"}마다 선택 기준은 다릅니다`, body: "핵심 구매 기준을 하나씩 비교하면 나에게 맞는 제품을 더 분명하게 고를 수 있습니다." };
  return { title: sourceTitle || `꼭 확인할 정보 ${index + 1}`, body: String(source?.goal || source?.description || "").replace(/입력된|확인된|표시된 내용만|추측하지 않[^.]*\.?/g, "").trim() || `${name}을 선택할 때 필요한 정보를 정리했습니다.` };
}


export function makeCopy(intent, profile, source = {}, index = 0) {
  const copy = makeCopyRaw(intent, profile, source, index);
  return { title: normalizeKoreanParticles(copy?.title), body: normalizeKoreanParticles(copy?.body) };
}
