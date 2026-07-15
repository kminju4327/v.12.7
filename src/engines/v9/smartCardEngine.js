const normalize = (value) => String(value ?? "").trim();
const valid = (value) => {
  const text = normalize(value).toLowerCase();
  return Boolean(text && text !== "null" && text !== "undefined" && text !== "없음" && text !== "미입력" && text !== "[object object]");
};

function featureText(item) {
  if (typeof item === "string" || typeof item === "number") return normalize(item);
  if (item && typeof item === "object") return normalize(item.value || item.point || item.label || item.title || item.description);
  return "";
}

function isFreshProduct(product = {}) {
  const category = `${product.mainCategory || ""} ${product.subCategory || ""}`;
  const name = normalize(product.name);
  return /신선식품|과일|채소|수산/.test(category) || /사과|배|복숭아|포도|감귤|딸기|수박|참외/.test(name);
}

export function buildSmartCards(product = {}, pageDesign = {}) {
  const cards = [];
  const features = (Array.isArray(pageDesign.productFeatures) ? pageDesign.productFeatures : []).map(featureText).filter(valid);
  const push = (label, value) => {
    const normalized = featureText(value);
    if (!valid(normalized)) return;
    if (cards.some((card) => card.label === label || card.value === normalized)) return;
    cards.push({ label, value: normalized });
  };

  if (isFreshProduct(product)) {
    push("산지", product.origin || product.productionArea || features.find((item) => /산지|재배 환경/.test(item)) || "재배 지역과 환경");
    push("품종", product.variety || features.find((item) => /품종|맛|당도|식감/.test(item)) || "품종과 맛의 특징");
    push("선별", product.selection || features.find((item) => /수확|선별/.test(item)) || "수확·선별 기준");
    push("보관", product.storage || features.find((item) => /포장|배송|보관/.test(item)) || "포장·배송과 보관 안내");
    return cards.slice(0, 4);
  }

  push("원료", product.ingredientName || features[0]);
  if (valid(product.epa) || valid(product.dha)) {
    const amount = [valid(product.epa) ? `EPA ${product.epa}mg` : "", valid(product.dha) ? `DHA ${product.dha}mg` : ""].filter(Boolean).join(" · ");
    push("함량", amount);
  } else if (valid(product.actualAmount)) {
    push("함량", `${product.actualAmount}mg${product.amountBasis ? ` · ${product.amountBasis}` : ""}`);
  } else if (valid(product.purity)) {
    push("순도", `${product.purity}%`);
  }
  push("품질", product.certs || features.find((item) => /품질|제조|검사|인증/.test(item)));
  push("섭취", product.dailyIntake || product.intake || product.howToUse || features.find((item) => /섭취|하루|1일/.test(item)));
  for (const feature of features) {
    if (cards.length >= 4) break;
    push("핵심", feature);
  }
  return cards.slice(0, 4);
}
