// 생성된 상세페이지(draft)를 미리보기와 동일한 디자인의 독립 실행 HTML 문서로 변환한다.
// 테마 컬러, 디자인 컨셉(conceptStyle), 제품 사진을 그대로 반영한다.

import { CONCEPT_STYLES, sectionLabel } from "../styles/theme.js";
import { normalizeSectionItems } from "./sectionItem";

function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// draft → 완전한 HTML 문서 문자열
export function buildHtmlDocument({ draft, image, concept, themeColor }) {
  if (!draft) return "";
  const cs = CONCEPT_STYLES[concept];

  const sectionsHtml = (draft.sections || [])
    .map((s) => {
      const label = sectionLabel(s.type);
      const title = s.title ? `<h2 class="sec-title">${esc(s.title)}</h2>` : "";
      const body = s.body ? `<p class="sec-body">${esc(s.body)}</p>` : "";
      const items = s.items
        ? `<ul class="sec-list">${normalizeSectionItems(s.items).map((it) => `<li>${esc(it)}</li>`).join("")}</ul>`
        : "";
      return `<section class="card">
  <div class="sec-label">${esc(label)}</div>
  ${title}
  ${body}
  ${items}
</section>`;
    })
    .join("\n");

  const imgHtml = image
    ? `<img class="hero-img" src="${image}" alt="${esc(draft.hero_headline)}" />`
    : "";

  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(draft.hero_headline)}</title>
<style>
  * { box-sizing: border-box; }
  body {
    margin: 0;
    background: #F4F3EE;
    font-family: "Pretendard", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif;
    color: #1F2A24;
    padding: 32px 16px;
  }
  .wrap { max-width: 640px; margin: 0 auto; }
  .card {
    background: #fff;
    border-radius: ${cs.radius};
    box-shadow: ${cs.shadow};
    border: ${cs.border};
    padding: 20px 24px;
    margin-bottom: 18px;
  }
  .hero {
    background: #fff;
    border-radius: ${cs.radius};
    box-shadow: ${cs.shadow};
    border: ${cs.border};
    padding: 28px;
    margin-bottom: 18px;
  }
  .hero-img { width: 100%; height: 200px; object-fit: cover; border-radius: ${cs.radius}; margin-bottom: 18px; }
  .hero-headline { font-family: ${cs.headFont}; font-weight: ${cs.headWeight}; font-size: 26px; line-height: 1.3; margin: 0 0 8px; }
  .hero-sub { font-size: 14.5px; color: #6B6A61; margin: 0; }
  .sec-label { font-size: 11px; font-weight: 700; color: ${esc(themeColor)}; margin-bottom: 6px; text-transform: uppercase; letter-spacing: .5px; }
  .sec-title { font-family: ${cs.headFont}; font-weight: ${cs.headWeight}; font-size: 17px; margin: 0 0 6px; }
  .sec-body { font-size: 14px; color: #4A4940; line-height: 1.6; margin: 0; }
  .sec-list { margin: 0; padding-left: 18px; font-size: 14px; color: #4A4940; line-height: 1.8; }
</style>
</head>
<body>
  <div class="wrap">
    <div class="hero">
      ${imgHtml}
      <h1 class="hero-headline">${esc(draft.hero_headline)}</h1>
      <p class="hero-sub">${esc(draft.hero_subcopy)}</p>
    </div>
    ${sectionsHtml}
  </div>
</body>
</html>`;
}

// HTML 문서를 .html 파일로 다운로드시킨다.
export function downloadHtmlFile(html, productName) {
  if (!html) return;
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const safeName = (productName || "detail-page").replace(/[^\w가-힣-]+/g, "_");
  a.href = url;
  a.download = `${safeName}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
