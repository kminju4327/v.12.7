import { normalizeKoreanParticles } from './koreanLanguage.js';

const clean = (v) => String(v ?? '').replace(/\s+/g,' ').trim();
const BANNED_PATTERNS = [
  [/살펴보면\s+([^.!?]+?)\s*(이해|판단)하기 쉽습니다\.?/g, '$1을 더 분명하게 알 수 있습니다.'],
  [/확인하면\s+([^.!?]+?)\s*(이해|판단)하기 쉽습니다\.?/g, '$1을 비교하는 기준이 됩니다.'],
  [/누구나 쉽게 따라 하는 조리법/g, '간단한 조리 방법'],
];

export function polishKoreanText(value, forbidden = []) {
  let out = normalizeKoreanParticles(clean(value));
  for (const [pattern, replacement] of BANNED_PATTERNS) out = out.replace(pattern, replacement);
  for (const word of forbidden || []) {
    if (!word) continue;
    const re = new RegExp(String(word).replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'g');
    out = out.replace(re,'').replace(/\s{2,}/g,' ').trim();
  }
  return out.replace(/\s+([,.!?])/g,'$1').replace(/\.\./g,'.');
}

export function dedupeSections(sections=[]) {
  const seen = new Set();
  return sections.filter((s) => {
    const key = `${s.intent||''}|${clean(s.title).replace(/[\s·,./()-]/g,'').toLowerCase()}`;
    if (!s.title || seen.has(key)) return false;
    seen.add(key); return true;
  });
}

export function polishResult(result, forbidden=[]) {
  const sections = dedupeSections((result.sections||[]).map((s) => ({
    ...s,
    title: polishKoreanText(s.title, forbidden),
    body: polishKoreanText(s.body, forbidden),
    items: Array.isArray(s.items) ? [...new Set(s.items.map((v)=>polishKoreanText(v, forbidden)).filter(Boolean))] : s.items,
  })));
  return {
    ...result,
    hero_headline: polishKoreanText(result.hero_headline, forbidden),
    hero_subcopy: polishKoreanText(result.hero_subcopy, forbidden),
    sections,
  };
}
