import { normalizeSectionItems } from "../../utils/sectionItem.js";
import { normalizeKoreanParticles } from "../../utils/koreanLanguage.js";

const ENDINGS = ["살펴보세요", "비교해 보세요", "확인해 보세요", "기준으로 삼아보세요", "차근차근 짚어보세요"];

function normalize(value) {
  return String(value || "")
    .replace(/[\s,.!?·:()'\"-]/g, "")
    .toLowerCase();
}

function similarity(a, b) {
  const left = normalize(a);
  const right = normalize(b);
  if (!left || !right) return 0;
  if (left === right) return 1;
  if (left.includes(right) || right.includes(left)) return Math.min(left.length, right.length) / Math.max(left.length, right.length);

  const leftSet = new Set(left.match(/.{1,2}/g) || []);
  const rightSet = new Set(right.match(/.{1,2}/g) || []);
  const intersection = [...leftSet].filter((token) => rightSet.has(token)).length;
  const union = new Set([...leftSet, ...rightSet]).size;
  return union ? intersection / union : 0;
}

function replaceRepeatedEnding(text, usedEndings) {
  let result = String(text || "");
  const pattern = /확인하세요|살펴보세요|비교해 보세요|확인해 보세요|선택하세요|챙겨보세요/g;
  const matches = result.match(pattern) || [];

  for (const match of matches) {
    const count = usedEndings.get(match) || 0;
    usedEndings.set(match, count + 1);
    if (count > 0) {
      const replacement = ENDINGS[(count + usedEndings.size) % ENDINGS.length];
      result = result.replace(match, replacement);
    }
  }
  return result;
}

function uniqueTitle(title, intent, usedTitles) {
  let result = String(title || "");
  const duplicate = usedTitles.some((used) => similarity(used, result) >= 0.88);
  if (!duplicate) {
    usedTitles.push(result);
    return result;
  }

  const alternatives = {
    ingredient: "원료에서 찾는 제품의 기준",
    formula: "구성에서 드러나는 제품의 방향",
    amount: "수치로 비교하는 핵심 정보",
    quality: "신뢰를 더하는 품질 관리",
    shipping: "포장과 배송에서 지키는 품질",
    usage: "일상에서 지키는 사용 기준",
    comparison: "나에게 맞는 선택 기준",
    closing: "마지막으로 확인할 선택 포인트",
  };
  result = alternatives[intent] || `${result}의 핵심`;
  usedTitles.push(result);
  return result;
}

function uniqueBody(body, usedBodies) {
  let result = String(body || "");
  const duplicate = usedBodies.some((used) => similarity(used, result) >= 0.82);
  if (duplicate) {
    result = result
      .replace(/살펴보면/g, "비교하면")
      .replace(/더 쉽게 이해할 수 있습니다/g, "선택 기준이 한층 분명해집니다")
      .replace(/중요합니다/g, "핵심 기준이 됩니다");
  }
  usedBodies.push(result);
  return result;
}

export function removeCopyRepetition(page = {}) {
  const usedEndings = new Map();
  const usedTitles = [String(page.hero_headline || "")];
  const usedBodies = [String(page.hero_subcopy || "")];

  const next = {
    ...page,
    hero_headline: normalizeKoreanParticles(replaceRepeatedEnding(page.hero_headline, usedEndings)),
    hero_subcopy: normalizeKoreanParticles(replaceRepeatedEnding(page.hero_subcopy, usedEndings)),
  };

  next.sections = (page.sections || []).map((section) => {
    const title = uniqueTitle(replaceRepeatedEnding(section.title, usedEndings), section.intent, usedTitles);
    const body = uniqueBody(replaceRepeatedEnding(section.body, usedEndings), usedBodies);
    return {
      ...section,
      title: normalizeKoreanParticles(title),
      body: normalizeKoreanParticles(body),
      items: Array.isArray(section.items) ? normalizeSectionItems(section.items) : section.items,
    };
  });

  return next;
}
