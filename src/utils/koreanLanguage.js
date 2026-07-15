const clean = (value) => String(value ?? "").trim();

export function hasBatchim(value) {
  const last = clean(value).replace(/[\s.,!?·:;()\[\]{}'"-]+$/g, "").slice(-1);
  if (!last) return false;
  const code = last.charCodeAt(0);
  if (code >= 0xac00 && code <= 0xd7a3) return (code - 0xac00) % 28 !== 0;
  // 숫자/영문은 읽는 방식이 다양하므로 UI에서 흔히 자연스러운 무받침형을 기본값으로 사용
  return false;
}

export function withParticle(value, batchimParticle, noBatchimParticle) {
  const word = clean(value);
  if (!word) return "";
  return `${word}${hasBatchim(word) ? batchimParticle : noBatchimParticle}`;
}

export const topic = (value) => withParticle(value, "은", "는");
export const subject = (value) => withParticle(value, "이", "가");
export const object = (value) => withParticle(value, "을", "를");
export const withAnd = (value) => withParticle(value, "과", "와");

export function normalizeKoreanParticles(value) {
  return clean(value)
    .replace(/활용를/g, "활용을")
    .replace(/방법를/g, "방법을")
    .replace(/순간를/g, "순간을")
    .replace(/정보를를/g, "정보를")
    .replace(/기준를/g, "기준을")
    .replace(/구성를/g, "구성을")
    .replace(/품질를/g, "품질을")
    .replace(/원료를를/g, "원료를")
    .replace(/과일를/g, "과일을")
    .replace(/제품를/g, "제품을")
    .replace(/베르베린는/g, "베르베린은")
    .replace(/오메가\s*3의/g, "오메가3의")
    .replace(/비타민c/g, "비타민C");
}

export function uniqueTextItems(values = []) {
  const seen = new Set();
  return values.filter(Boolean).filter((value) => {
    const key = clean(typeof value === "string" ? value : value.label || value.title || value.value)
      .replace(/[\s·,./()-]/g, "")
      .toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
