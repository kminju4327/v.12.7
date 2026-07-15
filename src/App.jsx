import { useState, useRef, useEffect } from "react";
import { runAIImproveEngine, runAIImproveEngineAsync } from "./engines/ai/aiImproveEngine";
import { Image as ImageIcon, X, Sparkles, ShieldAlert, ShieldCheck, CheckCircle2, Circle, Loader2, Copy, RefreshCw, Check, Code, Download } from "lucide-react";
import TemplateGallery, { DESIGN_TEMPLATES } from "./TemplateGallery";
import { CATEGORY_TREE, getCategoryMapping, getDefaultTarget } from "./utils/categoryTree";
import { getCategoryKnowledge } from "./data/categoryKnowledge";
import { getProductKnowledge, getSafeProductFeatures } from "./data/productKnowledge";
import { BRAIN_CONFIGS, getBrain as getBrainConfig } from "./data/brainConfigs";
import { buildGenerationPrompt } from "./prompts/generationPrompt";
import { buildImprovePrompt } from "./engines/ai/improvePromptEngine";
import { buildImproveContext } from "./engines/ai/improveContextEngine";
import { saveProject as saveProjectToStorage, loadProjects as loadProjectsFromStorage } from "./engines/v11/projectStorageEngine.js";

import { buildProductAnalysisPrompt, buildDetailPageGenerationPrompt } from "./prompts/generationPromptV8";
import { renderWithV9 } from "./engines/v9/rendererEngine";
import { buildCategoryDesignProfile } from "./engines/categoryStoryEngine";
import { formatSectionItem, normalizeSectionItems } from "./utils/sectionItem";
import ServiceExperiencePanel from "./components/ServiceExperiencePanel";
import SectionEditor from "./components/SectionEditor";

// ════════════════════════════════════════════════════════════════
// 템플릿 상수
// ════════════════════════════════════════════════════════════════
const TEMPLATES = DESIGN_TEMPLATES.map((template) => ({
  id: template.id,
  label: template.label,
  desc: template.desc,
}));

// 다국어 언어 목록
const LANGUAGES = [
  { id: "en", label: "English (영어)", flag: "🇬🇧" },
  { id: "ja", label: "日本語 (일본어)", flag: "🇯🇵" },
  { id: "zh-cn", label: "简体中文 (중국어 간체)", flag: "🇨🇳" },
  { id: "zh-tw", label: "繁體中文 (중국어 번체)", flag: "🇹🇼" },
  { id: "th", label: "ไทย (태국어)", flag: "🇹🇭" },
];

// ════════════════════════════════════════════════════════════════
// localStorage 프로젝트 관리 유틸
// ════════════════════════════════════════════════════════════════
const PROJECTS_STORAGE_KEY = "dpg_projects";
const MAX_PROJECTS = 20;

function loadProjects() {
  return loadProjectsFromStorage();
}

function saveProject(projectData) {
  return saveProjectToStorage(projectData);
}

// 기존 프로젝트의 product 객체 자동 보정
// mainCategory/subCategory가 없으면 category 값으로 역매핑
function migrateProductData(product) {
  // 이미 mainCategory가 있으면 그대로 반환하되, 이전 명칭은 새 UI 명칭으로 보정
  if (product.mainCategory && product.subCategory) {
    if (["건강관리 식품", "건강기능식품"].includes(product.mainCategory)) {
      return { ...product, mainCategory: "건강·영양식품" };
    }
    return product;
  }

  // mainCategory/subCategory 없으면 category 값으로 역매핑
  let mainCategory = "건강·영양식품";
  let subCategory = "일반 건강식품";
  
  if (product.category === "건강기능식품") {
    mainCategory = "건강·영양식품";
    subCategory = "건강기능식품";
  } else {
    mainCategory = "신선식품";
    subCategory = "과일";
  }

  return {
    ...product,
    mainCategory,
    subCategory,
  };
}

function getProject(projectId) {
  try {
    const projects = loadProjects();
    const foundProject = projects.find((p) => p.projectId === projectId);
    if (!foundProject) return null;
    
    // product 데이터 자동 보정
    return {
      ...foundProject,
      product: migrateProductData(foundProject.product),
    };
  } catch {
    return null;
  }
}

function deleteProject(projectId) {
  try {
    let projects = loadProjects();
    projects = projects.filter((p) => p.projectId !== projectId);
    localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects));
    return true;
  } catch (e) {
    console.error("프로젝트 삭제 오류:", e);
    return false;
  }
}

function searchProjects(query) {
  try {
    const projects = loadProjects();
    if (!query) return projects;
    const lower = query.toLowerCase();
    return projects.filter((p) => p.projectName.toLowerCase().includes(lower));
  } catch {
    return [];
  }
}

function formatDate(timestamp) {
  const d = new Date(timestamp);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const date = String(d.getDate()).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const mins = String(d.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${date} ${hours}:${mins}`;
}

const STAGE_LABELS = ["상세페이지 생성", "컬플라이언스 체크"];

const CONCEPTS = [
  { id: "minimal", label: "미니멀", desc: "여백 중심, 얇은 선, 정보 위주" },
  { id: "warm", label: "따뜻함", desc: "둥근 카드, 부드러운 파스텔 톤" },
  { id: "premium", label: "프리미엄", desc: "진한 대비, 명조 헤드라인, 다크 강조" },
  { id: "natural", label: "내추럴", desc: "유기농·친환경 무드, 연한 배경" },
  { id: "bold", label: "임팩트", desc: "굵은 강조, 큰 배지, 시선을 끄는 느낌" },
  { id: "editorial", label: "에디토리얼", desc: "매거진풍, 큰 여백, 라인 구분" },
];

const PRESET_COLORS = [
  "#D8C3A5", // Warm Beige
  "#AFC3A4", // Sage Green
  "#C8785F", // Soft Terracotta
  "#C89A5A", // Caramel Gold
  "#A86F73", // Dusty Rose
  "#7FA0AA", // Dusty Blue
  "#A896B5", // Mauve
  "#8A6A56", // Soft Brown
  "#355545", // Deep Green
];

// 포인트(강조) 컬러 프리셋 — 라벨/배지/강조에 쓰는 보조색
const POINT_COLORS = [
  "#C8785F", // Terracotta
  "#D2A15F", // Caramel
  "#2F5A46", // Forest Green
  "#A86F73", // Rose Brown
  "#D0AF39", // Soft Mustard
  "#7F9568", // Olive Sage
  "#B08355", // Cocoa Beige
  "#5F8390", // Dusty Blue
  "#B06F86", // Mauve Pink
  "#506B7C", // Blue Gray
  "#E6C7B0", // Peach Beige
  "#B8A3C7", // Lavender Mauve
  "#E0B7A4", // Blush Terracotta
  "#9DB8A3", // Pale Sage
];

// 폰트 무드 옵션. 한글 지원 구글 폰트 위주.
// family는 CSS font-family 값, google은 구글폰트 로드용 키.
const FONTS = [
  // Korean Sans
  { id: "pretendard", label: "프리텐다드 (기본)", family: '"Pretendard", "Apple SD Gothic Neo", sans-serif', google: null },
  { id: "suit", label: "SUIT (깔끔한 고딕)", family: '"SUIT", "Pretendard", sans-serif', google: null },
  { id: "paperlogy", label: "Paperlogy (브랜드 고딕)", family: '"Paperlogy", "Pretendard", sans-serif', google: null },
  { id: "spoqa", label: "Spoqa Han Sans (정돈된 고딕)", family: '"Spoqa Han Sans Neo", "Pretendard", sans-serif', google: null },
  { id: "notosans", label: "Noto Sans KR (모던 고딕)", family: '"Noto Sans KR", sans-serif', google: "Noto+Sans+KR:wght@400;500;700;800" },
  { id: "gothica1", label: "Gothic A1 (깔끔 고딕)", family: '"Gothic A1", sans-serif', google: "Gothic+A1:wght@400;500;700;800" },
  { id: "nanumgothic", label: "나눔고딕 (친근)", family: '"Nanum Gothic", sans-serif', google: "Nanum+Gothic:wght@400;700;800" },
  { id: "gmarket", label: "Gmarket Sans (커머스 고딕)", family: '"Gmarket Sans", "Pretendard", sans-serif', google: null },

  // Korean Serif / Display
  { id: "notoserif", label: "Noto Serif KR (명조)", family: '"Noto Serif KR", serif', google: "Noto+Serif+KR:wght@400;600;700;900" },
  { id: "ridibatang", label: "RIDIBatang (감성 명조)", family: '"RIDIBatang", "Noto Serif KR", serif', google: null },
  { id: "nanummyeongjo", label: "나눔명조 (클래식)", family: '"Nanum Myeongjo", serif', google: "Nanum+Myeongjo:wght@400;700;800" },
  { id: "jua", label: "주아 (둥근 발랄)", family: '"Jua", sans-serif', google: "Jua" },
  { id: "dohyeon", label: "도현 (두꺼운 임팩트)", family: '"Do Hyeon", sans-serif', google: "Do+Hyeon" },
  { id: "gaegu", label: "개구 (손글씨 느낌)", family: '"Gaegu", cursive', google: "Gaegu:wght@400;700" },
  { id: "songmyung", label: "송명 (감성 명조)", family: '"Song Myung", serif', google: "Song+Myung" },

  // English Sans
  { id: "inter", label: "Inter (EN 기본)", family: '"Inter", sans-serif', google: "Inter:wght@400;500;700;800" },
  { id: "poppins", label: "Poppins (EN 모던)", family: '"Poppins", sans-serif', google: "Poppins:wght@400;500;700;800" },
  { id: "montserrat", label: "Montserrat (EN 프리미엄)", family: '"Montserrat", sans-serif', google: "Montserrat:wght@400;500;700;800" },
  { id: "dmsans", label: "DM Sans (EN 부드러운 고딕)", family: '"DM Sans", sans-serif', google: "DM+Sans:wght@400;500;700;800" },
  { id: "outfit", label: "Outfit (EN 세련된 고딕)", family: '"Outfit", sans-serif', google: "Outfit:wght@400;500;700;800" },
  { id: "manrope", label: "Manrope (EN 깔끔)", family: '"Manrope", sans-serif', google: "Manrope:wght@400;500;700;800" },

  // English Serif
  { id: "playfair", label: "Playfair Display (EN 명조)", family: '"Playfair Display", serif', google: "Playfair+Display:wght@400;600;700;800" },
  { id: "cormorant", label: "Cormorant Garamond (EN 클래식)", family: '"Cormorant Garamond", serif', google: "Cormorant+Garamond:wght@400;500;700" },
  { id: "lora", label: "Lora (EN 감성 세리프)", family: '"Lora", serif', google: "Lora:wght@400;500;700" },
  { id: "librebaskerville", label: "Libre Baskerville (EN 고급 세리프)", family: '"Libre Baskerville", serif', google: "Libre+Baskerville:wght@400;700" },
];

// 선택된 폰트들의 구글폰트 로드 URL 생성
function buildGoogleFontsUrl(fontIds) {
  const families = FONTS.filter((f) => fontIds.includes(f.id) && f.google).map((f) => `family=${f.google}`);
  if (families.length === 0) return null;
  return `https://fonts.googleapis.com/css2?${families.join("&")}&display=swap`;
}

// 카테고리별 규칙셋. 새 카테고리(신선식품/가공식품 등) 추가 시 파이프라인 로직은 그대로 두고
// 이 객체에 항목만 추가하면 됨.
const CATEGORY_RULES = {
  "건강기능식품": {
    generationGuidance:
      "이 카테고리는 건강기능식품이므로, 식약처 고시형/개별인정형으로 실제 인정받은 기능성 문구 범위 내에서만 효능을 언급하세요. 인정 범위를 벗어난 확장 해석(예: 고시 문구보다 강한 표현)은 금지합니다.",
    forbiddenWords: ["완치", "특효", "100% 효과", "부작용 없음"],
    extraRules: [
      "감각적 효과(비린내 감소, 불쾌감 저감 등)를 단정형('낮췄습니다', '없애줍니다')으로 쓰지 마세요. 반드시 '~을 줄이기 위한 공정을 적용했습니다 (개인차 있음)' 형태로 쓰세요.",
      "근거 문헌을 특정할 수 없는 경우(예: '일부 연구에 따르면', '일부 문헌에서 보고된'), 흡수율·체내 활용률 관련 언급을 아예 하지 마세요. 공법 설명은 제조 방식 사실만 서술하세요.",
      "자사 제품을 소개할 때 '시중에서는 알기 어렵다', '구조부터 달라야 한다', '타사 제품의 표기는 불투명하다' 같은 은근한 비교·비하 맥락을 만들지 마세요. 자사 정보만 단독으로 서술하세요.",
    ],
    complianceFocus: [
      "인정받은 기능성 문구 범위를 초과해 과장하지 않았는지",
      "인정 원료가 아닌 성분(예: 공법 자체)에 효능이나 우월성을 붙이지 않았는지",
      "감각적 효과(비린내 등)를 단정형으로 표현하지 않았는지, '개인차 있음'이 병기됐는지",
      "특정할 수 없는 문헌을 인용해 흡수율 우위를 암시하지 않았는지",
      "타사 대비 은근한 우월성 구도를 만들지 않았는지",
    ],
  },
  "일반식품": {
    generationGuidance:
      "이 카테고리는 건강기능식품이 아닌 일반식품입니다. 질병 예방·치료·개선이나 신체 기능 변화를 직접·간접적으로 언급하는 표현(특정 수치·건강검진 결과를 연상시키는 표현 포함)을 사용하지 마세요. 오직 성분 함량, 원료 특성, 섭취 편의성, 위생 인증(HACCP 등)만으로 소구하세요. problem 섹션도 질환이 아니라 '정보가 불투명해서 선택이 어렵다'는 정보 격차 문제로만 구성하세요.",
    forbiddenWords: ["당뇨", "혈당", "진단", "병원 약", "처방", "치료", "개선", "예방", "복용(대신 섭취)", "질환명 전반"],
    extraRules: [
      "자사 제품을 소개할 때 '시중에서는 알기 어렵다', '다른 제품은 표기가 불투명하다' 같은 은근한 비교·비하 맥락을 만들지 마세요.",
    ],
    complianceFocus: [
      "건강기능식품으로 오인하게 하는 표현이 있는지",
      "효능을 직접 언급하지 않아도 간접적으로 암시하는 서술이 있는지",
    ],
  },
};

function getCategoryRules(category) {
  return CATEGORY_RULES[category] || CATEGORY_RULES["일반식품"];
}

function buildGenerationConstraint(category) {
  const rules = getCategoryRules(category);
  const extra = rules.extraRules
    ? "\\n- " + rules.extraRules.join("\\n- ")
    : "";
  return `${rules.generationGuidance}
- 절대 사용 금지 단어/맥락: ${rules.forbiddenWords.join(", ")}
- "~걱정", "~불안", "~증상" 같은 표현도 특정 질환/건강 이상을 암시하면 안 됨
- 타사 제품을 직접 비교·비하하는 뉘앙스 금지, 자사 제품 사실만 서술
- 원료 함량 수치(%)는 순도인지 최종 섭취량 기준 함량인지 모호하지 않게, 확실하지 않으면 "정확한 함량은 성분표를 참조하세요" 수준으로만 언급${extra}`;
}

function buildComplianceFocus(category) {
  const rules = getCategoryRules(category);
  return rules.complianceFocus.map((f) => "- " + f).join("\\n");
}


function emphasizeHtmlText(value, accentColor) {
  const esc = (s) =>
    String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  const safe = esc(value);
  return safe.replace(/(\d+(?:[.,]\d+)?\s*(?:%|mg|g|kg|ml|mL|정|포|캡슐)?)/g, `<span class="num-em">$1</span>`);
}

function EmphasizedText({ text, accent }) {
  const parts = String(text ?? "").split(/(\d+(?:[.,]\d+)?\s*(?:%|mg|g|kg|ml|mL|정|포|캡슐)?)/g);
  return (
    <>
      {parts.map((part, idx) => {
        const isNumber = /\d/.test(part) && idx % 2 === 1;
        return isNumber ? (
          <span key={idx} style={{ color: accent, fontWeight: 800, fontSize: "1.08em", letterSpacing: "-0.02em" }}>
            {part}
          </span>
        ) : (
          <span key={idx}>{part}</span>
        );
      })}
    </>
  );
}

function extractFirstJsonFromText(text) {
  const match = String(text || "").match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}

function extractJsonBetween(prompt, startLabel, endLabel) {
  const source = String(prompt || "");
  const start = source.indexOf(startLabel);
  if (start < 0) return null;
  const from = start + startLabel.length;
  const end = endLabel ? source.indexOf(endLabel, from) : -1;
  const raw = source.slice(from, end > -1 ? end : undefined).trim();
  return extractFirstJsonFromText(raw);
}

// 톤 가이드
const TONE_GUIDES = {
  default: "현재 톤 유지",
  professional: "전문적이고 신뢰도 높은 톤. 학술적 근거를 강조하고 정확한 수치와 데이터 중심으로.",
  friendly: "친근하고 대화체의 톤. '우리 함께'라는 느낌으로 고객을 동반자로 취급하고 따뜻한 표현 사용.",
  trust: "신뢰감 있게. 검증된 정보와 명확한 근거로 고객의 불안감을 해소하고 신뢰를 구축하는 톤.",
  concise: "간결하게. 핵심만 명확하게 정리해 불필요한 복잡함을 제거하고 쉽게 이해할 수 있도록 하는 톤.",
};

function buildMockPageDesign(product) {
  const brain = getBrainConfig(product.mainCategory, product.subCategory, product.name);
  const categoryProfile = buildCategoryDesignProfile(product);

  // 전문 Brain 또는 Category Story가 있으면 카테고리 전용 설계를 사용한다.
  if (brain || categoryProfile) {
    return buildBrainDesign(product, brain);
  }

  // 정의되지 않은 카테고리만 Legacy fallback 사용
  return buildLegacyDesign(product);
}

// Brain 기반 설계 함수
function getHealthProductProfile(product, brain) {
  const name = String(product.name || "제품").trim();
  const normalized = name.toLowerCase();
  const isFunctional = product.category === "건강기능식품" || product.subCategory === "건강기능식품";
  const defaultTarget = getDefaultTarget(product.mainCategory, product.subCategory);
  const target = String(product.target || defaultTarget).trim();
  const certs = String(product.certs || "").trim();
  const ingredient = String(product.ingredientName || "").trim();
  const hasLutein = normalized.includes("루테인") || normalized.includes("lutein");
  const hasBerberine = normalized.includes("베르베린") || normalized.includes("berberine");
  const hasOmega3 = normalized.includes("오메가3") || normalized.includes("omega");
  const hasRedGinseng = normalized.includes("홍삼");

  if (!isFunctional && hasBerberine) {
    return {
      summary: `${name}은 기능성을 앞세우기보다 원료의 출처와 구성, 배합 방식, 제조·품질 정보를 분명하게 보여주는 것이 중요한 일반식품입니다. 첫 화면에서 과장된 효능 대신 선택 기준을 제시하고, 이후 원료 구성과 품질 관리, 섭취·보관 안내를 연결하는 흐름이 적합합니다.`,
      features: [ingredient ? `${ingredient} 원료 정보` : "베르베린 원료 정보", "배합 구성의 투명성", certs ? `${certs} 품질 정보` : "제조·품질 정보", "섭취·보관 안내"],
      points: [
        { label: "원료 정보", level: "매우 중요", reason: "어떤 원료를 사용했는지 명확하게 보여주는 것이 첫 번째 선택 기준입니다." },
        { label: "배합 구성", level: "매우 중요", reason: "복합 원료라면 각 원료의 역할이 아니라 구성과 배합 의도를 투명하게 설명해야 합니다." },
        { label: "품질 관리", level: "중요", reason: "제조와 검사 정보를 확인할 수 있어야 구매 불안을 줄일 수 있습니다." },
        { label: "일상 활용", level: "중요", reason: "섭취와 보관 방법을 쉽게 안내하면 실제 사용 장면이 선명해집니다." },
      ],
      targets: [
        { label: target, reason: "입력한 타깃을 기준으로 원료와 품질 정보를 먼저 확인하는 고객입니다." },
        { label: "원료 구성을 꼼꼼히 비교하는 고객", reason: "효능 문구보다 제품에 실제로 들어간 정보와 제조 기준을 확인합니다." },
      ],
      flow: [
        ["왜 이 원료인가", "베르베린 제품에서 고객이 먼저 확인해야 할 원료와 제품 콘셉트를 제시합니다."],
        ["원료를 고르는 기준", "출처·형태·배합처럼 입력으로 확인 가능한 선택 기준을 정리합니다."],
        ["배합 구성", "함께 사용한 원료가 있다면 기능성을 단정하지 않고 구성 이유를 설명합니다."],
        ["품질을 확인하는 방법", "제조·검사·인증 정보는 입력된 내용만 활용해 신뢰 근거로 보여줍니다."],
        ["섭취와 보관 안내", "표시사항을 바탕으로 일상에서 이해하기 쉬운 사용 정보를 제공합니다."],
        ["선택을 위한 최종 정리", "과장 없이 확인 가능한 정보로 구매 결정을 돕습니다."],
      ],
      designReason: "일반 건강식품은 효능을 암시하는 문제 해결형 흐름보다, 원료와 품질을 차례로 확인하도록 돕는 정보 신뢰형 구조가 적합합니다. 그래서 첫 화면에서 선택 기준을 제시하고, 배합·품질·활용 정보로 신뢰를 쌓은 뒤 CTA로 마무리합니다.",
      design: { name: "Natural Trust", score: 5, reason: "식물성 원료와 품질 정보를 차분하고 신뢰감 있게 전달하기 좋습니다." },
      images: [
        { label: "Hero", recommendation: "제품 패키지 단독컷과 원료를 함께 배치한 메인 이미지", reason: "첫 화면에서 제품과 원료 콘셉트를 동시에 이해시킵니다." },
        { label: "원료", recommendation: "베르베린 원료를 보여주는 식물 또는 원료 클로즈업", reason: "원료 중심 제품이라는 인상을 강화합니다." },
        { label: "배합", recommendation: "주원료와 부원료의 구성을 한눈에 보여주는 플랫레이", reason: "복합 배합 정보를 시각적으로 쉽게 전달합니다." },
        { label: "품질", recommendation: "제조·검사·성적서 정보를 정돈해 보여주는 신뢰 이미지", reason: "확인 가능한 품질 근거를 강조합니다." },
      ],
    };
  }

  if (isFunctional && hasLutein) {
    return {
      summary: `${name}은 제품명만 강조하기보다 인정 기능성 정보, 기능성 원료와 1일 섭취 기준을 소비자가 쉽게 비교할 수 있도록 보여주는 것이 중요합니다. 화면 사용이 많은 일상에 공감한 뒤, 표시사항에 기재된 기능성 정보와 원료·함량·섭취 방법을 순서대로 연결하는 구성을 추천합니다.`,
      features: ["인정 기능성 표시 확인", ingredient ? `${ingredient} 원료 정보` : "기능성 원료 정보", product.actualAmount ? `1일 섭취량 기준 ${product.actualAmount}mg` : "1일 섭취 기준 확인", certs ? `${certs} 품질 정보` : "제조·품질 정보"],
      points: [
        { label: "인정 정보 명확성", level: "매우 중요", reason: "기능성 문구는 제품 표시사항에 기재된 인정 범위 안에서 정확히 보여줘야 합니다." },
        { label: "원료·함량 투명성", level: "매우 중요", reason: "기능성 원료와 1일 섭취 기준을 함께 보여주면 제품 비교가 쉬워집니다." },
        { label: "품질 관리", level: "중요", reason: "제조와 품질 정보는 기능성 정보에 대한 신뢰를 보완합니다." },
        { label: "섭취 편의성", level: "중요", reason: "언제, 어떻게 섭취하는지 명확할수록 구매 후 사용 장면이 선명해집니다." },
      ],
      targets: [
        { label: target, reason: "인정 기능성과 섭취 기준을 확인한 뒤 제품을 선택하는 핵심 고객입니다." },
        { label: "화면 사용이 많은 일상에서 눈 건강 정보를 확인하는 고객", reason: "제품이 표시한 기능성 범위와 원료 정보를 꼼꼼히 비교합니다." },
      ],
      flow: [
        ["눈 사용이 많은 일상", "고객이 공감할 수 있는 생활 장면에서 시작하되 질병이나 증상 개선을 단정하지 않습니다."],
        ["루테인 선택 기준", "인정 기능성, 기능성 원료, 1일 섭취량처럼 비교에 필요한 기준을 먼저 제시합니다."],
        ["핵심 기능성 원료", "제품 표시사항에 근거해 기능성 원료와 원료 형태를 설명합니다."],
        ["인정 기능성 정보", "식약처 인정 범위 안의 기능성 문구만 정확하게 안내합니다."],
        ["원료와 품질 관리", "제조·검사·인증은 사용자가 입력한 사실만 근거로 보여줍니다."],
        ["섭취 방법", "1일 섭취량과 섭취 시 주의사항을 표시사항 기준으로 정리합니다."],
        ["선택 포인트 요약", "구매 전 확인할 정보를 짧고 명확하게 다시 정리합니다."],
      ],
      designReason: "루테인은 감성적인 원료 스토리보다 소비자가 비교하는 기준을 빠르게 찾을 수 있는 정보형 구성이 중요합니다. 일상 공감으로 관심을 열고, 인정 기능성·원료·함량·품질·섭취 정보를 단계적으로 배치해 신뢰를 형성합니다.",
      design: { name: "Science Clean", score: 5, reason: "기능성, 원료, 섭취 기준을 깔끔하게 비교하기 좋은 정보 중심 디자인입니다." },
      images: [
        { label: "Hero", recommendation: "제품 패키지와 선명한 타이포 중심의 클린 메인 이미지", reason: "건강기능식품의 정보 신뢰도를 첫 화면에서 전달합니다." },
        { label: "일상 공감", recommendation: "모니터나 스마트폰을 사용하는 자연스러운 생활 장면", reason: "제품의 사용 맥락을 과장 없이 보여줍니다." },
        { label: "원료", recommendation: "기능성 원료 또는 원료 유래 식물을 보여주는 클로즈업", reason: "원료 정보를 시각적으로 이해시키는 데 도움을 줍니다." },
        { label: "품질", recommendation: "함량·검사·섭취 기준을 인포그래픽으로 정리한 이미지", reason: "비교해야 할 핵심 정보를 빠르게 확인하게 합니다." },
      ],
    };
  }

  if (isFunctional && hasOmega3) {
    return {
      summary: `${name}은 기능성 문구만 강조하기보다 EPA·DHA 등 표시된 기능성 성분 함량과 원료 형태, 품질 관리, 섭취 기준을 명확히 비교할 수 있도록 구성하는 것이 중요합니다. 입력된 수치만 사용하고, 확인되지 않은 원료 형태나 정제 방식을 추측하지 않는 정보 중심 흐름을 추천합니다.`,
      features: ["기능성 성분 함량 확인", "원료 형태와 출처 확인", "품질 관리 정보", "섭취 기준 안내"],
      points: [
        { label: "기능성 성분 함량", level: "매우 중요", reason: "EPA·DHA 등 입력된 실제 수치가 있다면 가장 명확한 비교 기준이 됩니다." },
        { label: "원료 정보", level: "매우 중요", reason: "원료 형태와 출처는 확인된 정보만 사용해 투명하게 보여줘야 합니다." },
        { label: "품질 관리", level: "중요", reason: "정제·검사·제조 정보는 입력된 근거가 있을 때 신뢰 요소가 됩니다." },
        { label: "섭취 기준", level: "중요", reason: "1일 섭취량과 섭취 방법을 쉽게 안내해야 합니다." },
      ],
      targets: [{ label: target, reason: "기능성 정보와 함량을 비교해 선택하는 고객입니다." }, { label: "원료와 수치를 꼼꼼히 확인하는 고객", reason: "제품 간 차이를 표시사항 기준으로 비교합니다." }],
      flow: [["오메가3 선택 기준", "함량·원료·품질·섭취 기준을 한눈에 제시합니다."], ["기능성 성분 정보", "입력된 EPA·DHA 수치만 정확하게 표시합니다."], ["원료 형태와 출처", "확인된 원료 정보만 설명합니다."], ["품질 관리", "제조와 검사 근거를 입력 정보 기준으로 보여줍니다."], ["섭취 방법", "표시사항에 따른 섭취 기준을 안내합니다."], ["최종 선택 요약", "구매 전 확인할 기준을 다시 정리합니다."]],
      designReason: "오메가3는 감성보다 수치와 원료 정보를 빠르게 비교할 수 있는 구조가 적합합니다. 확인 가능한 성분 함량을 먼저 보여주고, 원료·품질·섭취 정보로 신뢰를 보완합니다.",
      design: { name: "Science Clean", score: 5, reason: "수치와 품질 정보를 명확히 정돈해 보여주기 좋습니다." },
      images: [{ label: "Hero", recommendation: "제품 패키지와 핵심 수치를 함께 보여주는 이미지", reason: "비교 기준을 첫 화면에서 명확히 전달합니다." }, { label: "원료", recommendation: "확인된 원료 출처를 보여주는 이미지", reason: "원료의 성격을 이해시킵니다." }, { label: "성분", recommendation: "EPA·DHA 등 입력된 성분을 시각화한 인포그래픽", reason: "수치 비교를 쉽게 만듭니다." }, { label: "품질", recommendation: "검사와 제조 정보를 정리한 이미지", reason: "구매 신뢰를 보완합니다." }],
    };
  }

  if (!isFunctional && hasRedGinseng) {
    return {
      summary: `${name}이 일반식품으로 판매되는 경우 기능성을 단정하지 않고, 원료 형태와 배합, 제조·품질 정보, 섭취 방법을 중심으로 설계해야 합니다. 건강기능식품 홍삼과 혼동되지 않도록 제품의 법적 분류와 표시사항을 명확히 보여주는 것이 중요합니다.`,
      features: ["홍삼 원료 정보", "일반식품 분류 명확화", "배합·제조 정보", "섭취·보관 안내"],
      points: [{ label: "제품 분류 명확성", level: "매우 중요", reason: "건강기능식품으로 오인되지 않도록 일반식품임을 명확히 안내해야 합니다." }, { label: "원료와 배합", level: "매우 중요", reason: "사용된 홍삼 원료와 배합 정보를 확인 가능하게 보여줍니다." }, { label: "품질 관리", level: "중요", reason: "제조와 검사 정보가 신뢰 형성에 중요합니다." }],
      targets: [{ label: target, reason: "홍삼 원료와 제품 정보를 확인한 뒤 선택하는 고객입니다." }, { label: "건강기능식품과 일반식품의 차이를 확인하는 고객", reason: "기능성보다 원료·제조·섭취 정보를 비교합니다." }],
      flow: [["이 제품은 어떤 홍삼 식품인가", "제품 분류와 콘셉트를 명확히 소개합니다."], ["홍삼 원료 정보", "확인 가능한 원료 형태와 구성을 안내합니다."], ["배합과 제조", "배합 및 제조 정보를 투명하게 보여줍니다."], ["품질 관리", "입력된 검사와 인증 정보를 설명합니다."], ["섭취와 보관", "표시사항 기준 사용법을 안내합니다."], ["선택 포인트", "확인 가능한 기준으로 구매를 돕습니다."]],
      designReason: "홍삼 일반식품은 건강기능식품으로 오인되지 않도록 분류를 명확히 하고, 원료와 제조 정보를 중심으로 신뢰를 쌓는 구조가 필요합니다.",
      design: { name: "Heritage Trust", score: 5, reason: "홍삼 원료의 전통적 이미지와 정보 신뢰를 균형 있게 전달합니다." },
      images: [{ label: "Hero", recommendation: "제품과 홍삼 원료를 함께 보여주는 단정한 메인 이미지", reason: "제품 유형과 원료를 즉시 이해시킵니다." }, { label: "원료", recommendation: "홍삼 원료의 형태를 보여주는 이미지", reason: "원료 정보를 시각적으로 전달합니다." }, { label: "제조", recommendation: "배합·제조 과정을 상징하는 이미지", reason: "제품 신뢰를 높입니다." }, { label: "활용", recommendation: "섭취 장면 또는 보관 안내 이미지", reason: "일상 활용을 쉽게 이해시킵니다." }],
    };
  }

  const genericFunctional = {
    summary: `${name}은 인정 기능성 범위와 기능성 원료, 1일 섭취 기준, 품질 정보를 소비자가 쉽게 비교할 수 있도록 보여주는 것이 중요합니다. 입력되지 않은 기능성이나 수치는 만들지 않고 표시사항에 근거한 정보 중심 구성으로 설계합니다.`,
    features: ["인정 기능성 확인", "기능성 원료 정보", "1일 섭취 기준", "품질 관리"],
    points: [{ label: "인정 정보", level: "매우 중요", reason: "표시사항에 기재된 기능성 범위를 정확히 보여줘야 합니다." }, { label: "원료·함량", level: "매우 중요", reason: "기능성 원료와 섭취 기준을 명확히 안내해야 합니다." }, { label: "품질 관리", level: "중요", reason: "제조와 검사 정보가 신뢰를 보완합니다." }],
    targets: [{ label: target, reason: "기능성과 섭취 기준을 확인한 뒤 선택하는 고객입니다." }, { label: "제품 정보를 비교하는 고객", reason: "표시사항과 품질 정보를 꼼꼼히 확인합니다." }],
    flow: [["왜 이 제품인가", "제품의 핵심 선택 이유를 제시합니다."], ["이런 기준으로 선택하세요", "기능성·원료·섭취 기준을 정리합니다."], ["핵심 기능성 원료", "입력된 원료 정보를 설명합니다."], ["인정 기능성 정보", "표시사항 범위 안에서 기능성을 안내합니다."], ["원료와 품질 관리", "제조와 품질 정보를 보여줍니다."], ["섭취 방법", "표시사항 기준 사용법을 안내합니다."]],
    designReason: "건강기능식품은 구매자가 비교하는 기능성·원료·함량·품질 정보를 빠르게 찾을 수 있도록 정보 위계가 분명한 구조가 적합합니다.",
    design: { name: "Science Clean", score: 5, reason: "기능성 정보와 섭취 기준의 가독성을 높입니다." },
    images: [{ label: "Hero", recommendation: "제품과 핵심 선택 기준을 함께 보여주는 메인 이미지", reason: "첫 화면에서 구매 기준을 전달합니다." }, { label: "원료", recommendation: "기능성 원료를 보여주는 이미지", reason: "원료 이해를 돕습니다." }, { label: "정보", recommendation: "기능성·함량·섭취 기준 인포그래픽", reason: "비교 정보를 명확하게 전달합니다." }, { label: "품질", recommendation: "제조·검사 정보를 보여주는 이미지", reason: "신뢰를 보완합니다." }],
  };

  const genericGeneral = {
    summary: `${name}은 기능성을 약속하기보다 원료와 배합, 제조·품질, 섭취·보관 정보를 확인 가능한 기준으로 보여주는 것이 중요합니다. 과장된 문제 해결 표현 대신 제품 자체의 투명한 정보를 중심으로 구매 흐름을 설계합니다.`,
    features: [ingredient ? `${ingredient} 원료 정보` : "핵심 원료 정보", "배합 구성", certs ? `${certs} 품질 정보` : "제조·품질 정보", "섭취·보관 안내"],
    points: [{ label: "원료 정보", level: "매우 중요", reason: "제품의 핵심 원료를 명확히 보여주는 것이 중요합니다." }, { label: "배합 구성", level: "중요", reason: "구성 원료와 배합 의도를 이해하기 쉽게 설명합니다." }, { label: "품질 관리", level: "중요", reason: "입력된 제조·검사 정보를 신뢰 근거로 활용합니다." }],
    targets: [{ label: target, reason: "원료와 품질을 확인해 선택하는 고객입니다." }, { label: "제품 정보를 꼼꼼히 확인하는 고객", reason: "과장된 효능보다 실제 제품 정보를 비교합니다." }],
    flow: [["제품의 핵심 가치", "제품을 선택할 이유를 간결하게 제시합니다."], ["원료를 고르는 기준", "확인 가능한 원료 정보를 설명합니다."], ["배합 구성", "제품 구성을 이해하기 쉽게 보여줍니다."], ["품질 정보", "제조와 검사 정보를 안내합니다."], ["활용 방법", "섭취와 보관 방법을 정리합니다."], ["선택 포인트", "구매 전 확인 기준을 요약합니다."]],
    designReason: "일반 건강식품은 기능성보다 투명한 제품 정보가 중요하므로 원료·배합·품질·활용을 순서대로 확인하도록 구성합니다.",
    design: { name: "Natural Trust", score: 5, reason: "원료와 품질을 차분하고 신뢰감 있게 전달합니다." },
    images: [{ label: "Hero", recommendation: "제품과 핵심 원료를 함께 보여주는 메인 이미지", reason: "제품의 정체성을 빠르게 전달합니다." }, { label: "원료", recommendation: "핵심 원료 클로즈업", reason: "원료 중심 제품임을 강조합니다." }, { label: "배합", recommendation: "원료 구성을 보여주는 플랫레이", reason: "배합 정보를 이해시키기 좋습니다." }, { label: "품질", recommendation: "제조·검사 정보를 정리한 이미지", reason: "신뢰를 높입니다." }],
  };

  return isFunctional ? genericFunctional : genericGeneral;
}

// 신선식품 전용 설계 프로필
function getFreshProductProfile(product, brain) {
  const name = String(product.name || "제품").trim();
  const target = String(product.target || getDefaultTarget(product.mainCategory, product.subCategory)).trim();
  const certs = String(product.certs || "").trim();
  const isApple = /사과|apple/i.test(name);

  return {
    summary: `${name}은 기능성이나 배합을 설명하는 제품이 아니라 산지, 품종, 재배 환경, 수확·선별, 포장·배송, 보관 정보를 통해 맛과 신선함의 이유를 보여주는 것이 중요합니다. 고객이 한눈에 품질 기준을 이해할 수 있도록 생산 과정 중심의 흐름을 추천합니다.`,
    features: [
      "산지와 재배 환경",
      isApple ? "품종과 맛의 특징" : "품종과 상품 특성",
      "수확·선별 기준",
      "포장·배송과 보관 안내",
    ],
    points: [
      { label: "산지·재배 환경", level: "매우 중요", reason: "어디에서 어떤 환경으로 재배했는지가 맛과 신선도를 이해하는 첫 기준입니다." },
      { label: "품종·맛의 특징", level: "매우 중요", reason: "품종별 맛, 식감, 당도 정보를 알기 쉽게 보여주면 구매 판단이 쉬워집니다." },
      { label: "수확·선별", level: "중요", reason: "수확 시기와 선별 기준은 상품의 균일성과 신선도를 설명하는 핵심 정보입니다." },
      { label: "포장·보관", level: "중요", reason: "배송 과정과 보관 방법을 안내하면 구매 후 품질 유지에 대한 불안을 줄일 수 있습니다." },
    ],
    targets: [
      { label: target, reason: "신선도와 맛을 기준으로 과일을 고르는 고객입니다." },
      { label: "산지와 품종 정보를 꼼꼼히 확인하는 고객", reason: "가격보다 생산 정보와 품질 기준을 비교해 선택합니다." },
    ],
    flow: [
      ["산지에서 시작되는 맛", "재배 지역과 환경이 제품의 맛과 신선함에 어떤 기준이 되는지 보여줍니다."],
      ["품종과 맛의 특징", "품종별 맛, 향, 식감과 입력된 당도 정보를 이해하기 쉽게 정리합니다."],
      ["수확 시기와 선별 기준", "언제 수확하고 어떤 기준으로 선별하는지 설명해 품질 신뢰를 높입니다."],
      ["신선함을 지키는 포장과 배송", "포장 방식과 배송 과정에서 신선도를 어떻게 유지하는지 보여줍니다."],
      ["맛있게 즐기는 보관 방법", "가정에서 맛과 신선함을 오래 유지할 수 있는 보관 기준을 안내합니다."],
      ["구매 전 최종 확인", "산지, 품종, 선별, 배송, 보관 기준을 한눈에 다시 정리합니다."],
    ],
    designReason: "신선식품은 원료 배합이나 기능성보다 산지와 생산 과정이 구매 이유가 됩니다. 산지 → 품종과 맛 → 수확·선별 → 포장·배송 → 보관 순서로 보여주면 고객이 신선함의 근거를 자연스럽게 이해할 수 있습니다.",
    design: { name: "Fresh Origin", score: 5, reason: "산지와 과일의 색감, 신선한 질감을 중심으로 품질 정보를 직관적으로 전달하기 좋습니다." },
    images: [
      { label: "Hero", recommendation: `${name} 실물과 산지 배경을 함께 보여주는 자연광 메인 이미지`, reason: "첫 화면에서 신선함과 산지 이미지를 동시에 전달합니다." },
      { label: "산지", recommendation: "재배지 전경과 나무에서 자라는 과일을 보여주는 이미지", reason: "재배 환경과 원산지의 신뢰를 높입니다." },
      { label: "품종", recommendation: "과육 단면과 색, 식감을 보여주는 클로즈업", reason: "맛과 식감의 특징을 시각적으로 전달합니다." },
      { label: "선별", recommendation: "크기와 상태를 확인하며 선별하는 과정 이미지", reason: "품질 관리 과정을 이해시키기 좋습니다." },
      { label: "포장", recommendation: "완충 포장과 배송 박스를 정돈해 보여주는 이미지", reason: "배송 중 신선도 유지에 대한 안심을 줍니다." },
    ],
  };
}

// Brain 기반 설계 함수
function buildBrainDesign(product, brain) {
  const categoryProfile = buildCategoryDesignProfile(product);
  const isHealthCategory = /건강|영양/.test(String(product.mainCategory || "")) || /건강기능식품|일반 건강식품/.test(String(product.subCategory || product.category || ""));
  const isFreshCategory = product.mainCategory === "신선식품" || /과일|채소/.test(String(product.subCategory || ""));
  const profile = !isHealthCategory && categoryProfile
    ? categoryProfile
    : (isFreshCategory ? getFreshProductProfile(product, brain) : getHealthProductProfile(product, brain));
  const name = String(product.name || "제품").trim();
  const pageStructure = profile.flow.map(([title, description], idx) => ({
    step: String(idx + 1).padStart(2, "0"),
    title,
    description,
  }));

  return {
    aiSummary: profile.summary,
    productFeatures: profile.features.filter(Boolean),
    pageStructure,
    persuasionPoints: profile.points,
    recommendedTarget: profile.targets,
    recommendedDesign: profile.design,
    alternativeDesigns: [
      { name: "Minimal", reason: "핵심 정보의 가독성을 높이는 구성" },
      { name: "Warm Story", reason: "고객의 일상과 제품 가치를 부드럽게 연결하는 구성" },
    ],
    recommendedImages: profile.images,
    designReason: profile.designReason,
    productDiagnosis: {
      productType: categoryProfile?.storyKey || (isFreshCategory ? "신선식품" : (product.category === "건강기능식품" ? "건강기능식품" : "일반 건강식품")),
      strongestPoint: profile.features[0] || "확인 가능한 제품 정보",
    },
    storyKey: categoryProfile?.storyKey || null,
    forbiddenWords: categoryProfile?.forbidden || [],
    purchasePoints: profile.points.map((p) => ({ point: p.label, level: p.level, reason: p.reason })),
  };
}

// 기존 buildMockPageDesign 로직 (Brain이 없을 때 사용)
function buildLegacyDesign(product) {
  const safe = (value, fallback = "") => String(value || fallback).trim();
  const name = safe(product.name, "제품");
  const category = safe(product.category, "일반식품");
  const targetRaw = safe(product.target, "건강한 루틴을 원하는 고객");
  const benefitsRaw = safe(product.benefits, "제품의 핵심 장점을 명확하게 전달할 수 있는 상품");
  const ingredient = safe(product.ingredientName, name.includes("베르베린") ? "베르베린" : "핵심 원료");
  const purity = safe(product.purity);
  const amount = safe(product.actualAmount);
  const certs = safe(product.certs);

  // 카테고리 Knowledge 조회 (핵심!)
  const knowledge = getCategoryKnowledge(product.mainCategory, product.subCategory);
  const keyBuyingPoints = knowledge?.keyBuyingPoints || [ingredient, "품질", "신뢰"];
  const storyFlowFromKnowledge = knowledge?.storyFlow || null;
  const aiDiagnosisFromKnowledge = knowledge?.aiDiagnosis || null;

  const hasPurity = Boolean(purity);
  const hasAmount = Boolean(amount);
  const hasCerts = Boolean(certs && certs !== "없음");
  const isGeneralFood = category === "일반식품";
  const lowerText = `${name} ${ingredient} ${benefitsRaw}`.toLowerCase();
  const isBerberine = lowerText.includes("베르베린") || lowerText.includes("berberine");
  const hasPlantMood = /식물|자연|원료|추출|잎|열매|허브|베르베린/i.test(`${name} ${ingredient} ${benefitsRaw}`);
  const targetMain = targetRaw.split(/[,.，]/)[0] || targetRaw;

  const featureCandidates = [
    ingredient && `${ingredient} 중심의 원료 구성`,
    hasPurity && `${ingredient} ${purity}% 수치 강조 가능`,
    hasAmount && `1일 섭취량 기준 ${amount}mg 정보 제공`,
    hasCerts && `${certs} 기반 품질 신뢰 요소`,
    benefitsRaw.split(/[,.，]/)[0],
  ].filter(Boolean);

  const productFeatures = [...new Set(featureCandidates)].slice(0, 5);

  const strongestPoint = hasPurity
    ? `${ingredient} ${purity}%`
    : hasAmount
    ? `${amount}mg 함량 정보`
    : hasCerts
    ? `${certs} 품질 신뢰`
    : ingredient || "제품 핵심 장점";

  const aiSummary = isGeneralFood
    ? `이 제품은 효능을 직접 약속하기보다, 고객이 안심하고 선택할 수 있는 정보의 순서를 잘 설계하는 것이 중요합니다. 따라서 첫 화면에서는 제품과 브랜드를 간결하게 소개하고, 바로 이어서 고객의 고민에 공감한 뒤 ${strongestPoint}와 원료·품질 정보를 차례로 보여주는 흐름을 추천합니다.`
    : `이 제품은 기능성 표현 범위를 지키면서도 고객의 고민에 먼저 공감하고, 그 다음 인정된 정보와 ${strongestPoint}를 명확하게 보여주는 구성이 적합합니다. 구매 전환을 위해서는 제품 소개보다 고객의 상황을 먼저 열어주는 흐름이 유리합니다.`;

  const persuasionPoints = [
    {
      label: hasPurity || ingredient ? "원료·성분 신뢰" : "제품 정보 명확성",
      score: hasPurity ? 92 : ingredient ? 86 : 76,
      reason: hasPurity ? `${purity}% 수치가 있어 첫 신뢰 형성에 유리합니다.` : `${ingredient} 정보를 중심으로 제품의 기준을 설명할 수 있습니다.`,
    },
    {
      label: "고객 공감",
      score: targetRaw ? 84 : 70,
      reason: `${targetMain}의 일상 고민을 먼저 짚으면 상세페이지 이탈을 줄일 수 있습니다.`,
    },
    {
      label: "품질 근거",
      score: hasCerts ? 88 : 62,
      reason: hasCerts ? `${certs} 정보를 신뢰 배지와 품질 섹션으로 활용할 수 있습니다.` : "인증·제조·시험성적서 정보가 추가되면 설득력이 더 올라갑니다.",
    },
    {
      label: "섭취 편의성",
      score: /정|포|캡슐|1일|하루|간편/.test(benefitsRaw) ? 78 : 66,
      reason: "구매 직전에는 ‘어떻게 먹는지’가 망설임을 줄이는 보조 근거가 됩니다.",
    },
  ];

  const recommendedTarget = [
    { label: targetMain, reason: "입력된 타깃 중 가장 직접적인 구매 가능성이 있는 고객층입니다." },
    { label: isBerberine ? "식후 루틴에 관심 있는 고객" : "건강한 생활 루틴을 만들고 싶은 고객", reason: "제품을 질환 해결책이 아니라 일상 관리 선택지로 받아들이기 쉽습니다." },
    { label: "원료와 품질을 꼼꼼히 확인하는 고객", reason: "초기 브랜드일수록 후기보다 원료·함량·제조 정보가 신뢰 형성에 중요합니다." },
  ];

  const pageStructure = [
    { step: "01", title: "브랜드 & 제품 소개", description: `${name}이 어떤 제품인지 첫 화면에서 짧고 선명하게 인식시킵니다.` },
    { step: "02", title: "이런 고민 있으신가요?", description: `${targetMain}이 공감할 수 있는 일상 상황을 먼저 제시합니다.` },
    { step: "03", title: "왜 이 제품인가?", description: `문제 제기 후 곧바로 ${name}을 선택해야 하는 이유를 연결합니다.` },
    { step: "04", title: "핵심 원료 소개", description: `${ingredient}의 특징과 제품 안에서의 역할을 쉽게 설명합니다.` },
    { step: "05", title: "우리 제품만의 차별점", description: `${strongestPoint}를 중심으로 다른 제품과 구분되는 포인트를 정리합니다.` },
    { step: "06", title: "성분·배합 포인트", description: "주원료와 부원료가 있다면 왜 함께 구성됐는지 한눈에 보여줍니다." },
    { step: "07", title: "품질 & 신뢰 요소", description: hasCerts ? `${certs}와 제조·품질 정보를 배치해 구매 불안을 낮춥니다.` : "제조, 보관, 주의사항, 시험성적서 등 신뢰 자료를 배치합니다." },
    { step: "08", title: "섭취 방법", description: "하루 몇 회, 언제, 어떻게 섭취하는지 간단하게 안내합니다." },
    { step: "09", title: "FAQ", description: "구매 전 자주 생기는 질문을 미리 해소합니다." },
    { step: "10", title: "구매 CTA", description: "효능 단정이 아니라 ‘정보를 확인하고 선택’하는 톤으로 마무리합니다." },
  ];

  const designReason = `이 구성은 먼저 제품을 소개한 뒤, 고객의 고민을 열고, 그 다음 ${ingredient}와 ${strongestPoint}를 보여주는 순서입니다. 고객은 처음부터 성분 설명만 보면 이탈할 수 있으므로, 공감 → 제품 필요성 → 원료·차별점 → 신뢰 → 섭취 방법 순서로 설득하는 것이 구매 전환에 더 유리합니다.`;

  const recommendedDesign = {
    name: hasPlantMood ? "Luxury White" : "Modern Premium",
    score: 5,
    reason: hasPlantMood
      ? "식품·건강 제품의 신뢰감과 프리미엄 이미지를 가장 깔끔하게 전달할 수 있는 스타일입니다."
      : "정보량이 많은 제품을 정돈된 카드와 여백으로 보여주기 좋은 스타일입니다.",
  };

  const alternativeDesigns = [
    { name: "Natural Beige", reason: "식물성·자연 유래 원료를 부드럽게 강조" },
    { name: "Science Clean", reason: "수치, 함량, 인증 정보를 투명하게 보여주기 좋음" },
  ];

  const requestNote = safe(product.additionalRequest);
  if (requestNote) {
    pageStructure.splice(7, 0, {
      step: "08",
      title: "요청사항 반영 섹션",
      description: `사용자가 요청한 "${requestNote.slice(0, 28)}${requestNote.length > 28 ? "..." : ""}" 내용을 규정에 맞게 자연스럽게 배치합니다.`,
    });
    pageStructure.forEach((item, idx) => {
      item.step = String(idx + 1).padStart(2, "0");
    });
  }

  const recommendedImages = [
    { label: "Hero", recommendation: "제품 패키지와 핵심 원료가 함께 보이는 프리미엄 컷", reason: "첫 화면에서 제품 존재감과 원료 신뢰를 동시에 전달합니다." },
    { label: "공감", recommendation: "식후 루틴이나 일상 관리 상황을 은은하게 보여주는 이미지", reason: "고객이 자신의 상황을 대입하기 쉽게 만듭니다." },
    { label: "원료", recommendation: isBerberine ? "고산지대 자연 배경과 베르베린 원료를 함께 보여주는 컷" : "주원료의 질감이 보이는 깔끔한 클로즈업", reason: "제품의 핵심 경쟁력이 원료라는 점을 빠르게 인지시킵니다." },
    { label: "신뢰", recommendation: "HACCP, 시험성적서, 제조시설 등을 아이콘 또는 배지로 정리", reason: "후기가 부족해도 품질 근거로 신뢰를 보완할 수 있습니다." },
  ];

  return {
    aiSummary,
    productFeatures,
    persuasionPoints,
    recommendedTarget,
    pageStructure,
    designReason,
    recommendedDesign,
    alternativeDesigns,
    recommendedImages,
    // 기존 UI/저장 데이터 호환용 필드
    productDiagnosis: {
      productType: productFeatures[0] || "제품 정보 중심 구성",
      strongestPoint,
      weakPoint: hasCerts ? "후기와 브랜드 스토리를 보강하면 더 좋습니다." : "인증·후기·제조 정보가 추가되면 신뢰도가 올라갑니다.",
      strategyName: "공감 후 원료·차별성 중심 설계",
    },
    purchasePoints: persuasionPoints.map((p) => ({ point: p.label, stars: Math.max(1, Math.round(p.score / 20)), reason: p.reason })),
  };
}

// ════════════════════════════════════════════════════════════════
// 소구점 분석 (深層化)
// ════════════════════════════════════════════════════════════════

function analyzePainPointsDeep(target, benefits, category, ingredient) {
  // 타깃 분석
  const isWoman40s = /여성|갱년기|폐경|40|50|중년/i.test(target);
  const isYoungWorker = /직장인|20|30|바쁜|학생/i.test(target);
  const isSkinCare = /피부|미용|안티에이징|주름|탄력/i.test(target);
  const isWeightLoss = /다이어트|체중|감량/i.test(target);
  const isElderly = /60|70|노년|어르신/i.test(target);

  let analysis = {
    targetSegment: target,
    primaryPain: "",
    secondaryPain: "",
    emotionalCore: "", // 가장 깊은 감정
    timelineOfConcern: "", // 시간 흐름상 불안감
    socialContext: "", // 사회적 압박
    physicalChange: "", // 신체 변화
    psychologicalShift: "", // 심리적 변화
    trustIssue: "", // 신뢰도 문제
  };

  if (isWoman40s) {
    analysis.primaryPain = "호르몬 변화로 인한 신체 제어 불가능감";
    analysis.secondaryPain = "피부, 체력, 기억력 등 동시다발적 변화";
    analysis.emotionalCore = "\"이제 내 몸을 더 이상 신뢰할 수 없다\"는 공포";
    analysis.timelineOfConcern = "어제는 먹혀도 오늘은 안 먹힐 수 있다는 불안";
    analysis.socialContext = "주변은 자연스럽게 쇠퇴하는데, 나만 뒤처지는 기분";
    analysis.physicalChange = "같은 제품, 같은 양 → 예전과 다른 몸의 반응";
    analysis.psychologicalShift = "\"좋은 정보\"보다 \"검증된 정보\"를 신뢰";
    analysis.trustIssue = "\"효과 있다더라\"는 카더라는 이제 안 통함. 수치와 근거가 필요";
    analysis.headlineCandidates = [
      "매일 챙기기 좋은 건강 관리",
      "선택할 이유? 충분합니다",
      "간편하게, 명확하게",
      `이거 하나면 끝`,
    ];
  } else if (isYoungWorker) {
    analysis.primaryPain = "바쁘고 복잡한 일상 속 건강 관리의 어려움";
    analysis.secondaryPain = "\"지속할 수 없는\" 복잡한 복용법";
    analysis.emotionalCore = "\"나는 늘 건강 관리를 포기하는 사람\"이라는 죄책감";
    analysis.timelineOfConcern = "오늘 못 먹으면 효과가 날아가지 않을까";
    analysis.socialContext = "주변은 다 건강하게 관리하는데 나만 못할 것 같은 불안";
    analysis.physicalChange = "피로 누적 → 피부 악화 → 무기력함";
    analysis.psychologicalShift = "복잡함을 제거한 \"극도로 간편한\" 솔루션만 먹힘";
    analysis.trustIssue = "\"진짜 효과 있나?\" 보다 \"이거 진짜 매일 먹을 수 있나?\"";
    analysis.headlineCandidates = [
      "바쁠 때는 이거 하나로",
      "매일 챙기기 쉬운 제품",
      "간편함이 전부",
    ];
  } else if (isSkinCare) {
    analysis.primaryPain = "눈에 보이는 피부 변화에 대한 절박함";
    analysis.secondaryPain = "\"효과\" 나올 때까지 얼마나 기다려야 하나";
    analysis.emotionalCore = "\"지금 내 피부 상태가 계속될까봐\"라는 공포";
    analysis.timelineOfConcern = "빠를수록 좋지만, 부작용 없이";
    analysis.socialContext = "SNS로 보이는 타인의 완벽한 피부와의 비교";
    analysis.physicalChange = "작은 주름, 톤 다운, 탄력 손실";
    analysis.psychologicalShift = "\"확실한 효과\"를 보여주는 브랜드만 신뢰";
    analysis.trustIssue = "광고와 실제 효과의 괴리감";
    analysis.headlineCandidates = [
      "피부 관심층의 선택",
      "이거 먹으면 달라져요",
      "매일 챙기는 피부 관리",
    ];
  } else {
    analysis.primaryPain = "제품 선택의 불확실성";
    analysis.secondaryPain = "효과 없는 제품에 대한 경제적 손실감";
    analysis.emotionalCore = "\"이 제품이 정말 나를 위한 건가\"라는 의문";
    analysis.timelineOfConcern = "언제부터 효과를 볼 수 있을까";
    analysis.socialContext = "입소문만 믿고 구매했다가 실패한 경험";
    analysis.physicalChange = "변화를 기대하지만 확신이 없음";
    analysis.psychologicalShift = "정량적 정보와 투명성을 우선";
    analysis.trustIssue = "미디어 마케팅보다 과학적 근거";
    analysis.headlineCandidates = [
      `${ingredient || "원료"}의 진실, 이제 확인하세요`,
      "선택이 아닌, 확신으로 구매하는 제품",
      "투명한 정보, 결국 가장 강한 마케팅",
    ];
  }

  return analysis;
}

function generateTargetedHeadline(painAnalysis, productName) {
  // 캐주얼하고 자연스러운 Headline (정관장 스타일)
  const casualHeadlines = [
    `매일 챙기기 좋은, ${productName}`,
    `간편하게, 명확하게`,
    `선택할 이유? 충분합니다`,
    `이거 하나면 끝`,
    `${productName}, 이제 시작해보세요`,
  ];
  
  return casualHeadlines[Math.floor(Math.random() * casualHeadlines.length)];
}

function generateStrongCopyBySection(painAnalysis, productName, benefits) {
  // 캐주얼하고 자연스러운 카피 (정관장 스타일)
  return {
    problem: {
      title: "선택을 어렵게 만드는 정보의 차이",
      body: "비슷한 제품도 많고, 어떤 걸 고를지 헷갈리죠. 결국 확인할 수 있는 정보가 가장 중요합니다.",
      context: "명확한 정보가 신뢰입니다.",
    },
    solution: {
      title: `${productName}이 다른 이유`,
      body: `${benefits}. 이게 기준입니다. 모든 정보를 공개합니다.`,
      emphasis: "간편하게, 명확하게, 믿고 마시세요",
    },
    cta: {
      emotional: "이제 선택해보세요",
      rational: `${productName}`,
    },
  };
}

function extractPromptField(text, label, fallback = "") {
  const match = String(text || "").match(new RegExp(`${label}:\\s*(.+)`));
  return match?.[1]?.split("\n")?.[0]?.trim() || fallback;
}

function getProductAutoFeatures(name, brain) {
  const knowledge = getProductKnowledge(name);
  const safeFeatures = getSafeProductFeatures(name);
  const merged = [
    ...(safeFeatures?.qualities || []),
    ...(safeFeatures?.usages || []),
    ...(safeFeatures?.feelings || []),
    ...(knowledge?.commonQualities || []),
    ...(knowledge?.commonUsages || []),
    ...(brain?.keyElements || []),
  ].filter(Boolean);
  return [...new Set(merged)].slice(0, 6);
}

function compactMockList(values = []) {
  return [...new Set((Array.isArray(values) ? values : [])
    .flatMap((value) => Array.isArray(value) ? value : [value])
    .map((value) => typeof value === "string" ? value.trim() : value)
    .filter((value) => value !== null && value !== undefined && value !== "" && value !== "null"))];
}

function getMockProductFacts(product = {}, design = {}) {
  const name = String(product.name || "제품").trim();
  const ingredient = String(product.ingredientName || "").trim();
  const purity = String(product.purity || "").trim();
  const actualAmount = String(product.actualAmount || "").trim();
  const epa = String(product.epa || product.epaAmount || "").trim();
  const dha = String(product.dha || product.dhaAmount || "").trim();
  const certs = String(product.certs || "").trim();
  const daily = String(product.intakeMethod || product.dailyIntake || "").trim();
  const text = `${name} ${ingredient} ${product.benefits || ""}`.toLowerCase();

  return {
    name,
    ingredient,
    purity,
    actualAmount,
    epa,
    dha,
    certs: certs && certs !== "없음" ? certs : "",
    daily,
    isOmega3: /오메가\s*3|omega\s*3/.test(text),
    isBerberine: /베르베린|berberine/.test(text),
    isRedGinseng: /홍삼|red\s*ginseng/.test(text),
    isFresh: product.mainCategory === "신선식품" || /사과|과일|채소|농산물/.test(text),
    strongestPoint: design?.productDiagnosis?.strongestPoint || "",
  };
}

function inferMockSectionIntent(item = {}, index = 0) {
  const text = `${item.title || ""} ${item.description || ""}`.toLowerCase();
  if (index === 0 || /선택 기준|왜 이|첫 확인|제품 소개|핵심/.test(text)) return "choice";
  if (/epa|dha|기능성 성분|함량|수치|순도/.test(text)) return "amount";
  if (/원료|출처|산지|형태|품종/.test(text)) return "ingredient";
  if (/배합|구성|부원료/.test(text)) return "formula";
  if (/품질|제조|검사|인증|신뢰|성적서/.test(text)) return "quality";
  if (/섭취|먹는|사용|보관/.test(text)) return "usage";
  if (/고민|문제|공감/.test(text)) return "problem";
  if (/요약|마무리|최종|cta|선택/.test(text)) return "closing";
  return "information";
}

function buildMockBuyerCopy(intent, facts, item = {}, index = 0) {
  const { name, ingredient, purity, actualAmount, epa, dha, certs, daily, isOmega3, isBerberine, isRedGinseng, isFresh } = facts;
  const sourceTitle = String(item.title || "").trim();

  if (intent === "choice") {
    if (isOmega3) return {
      title: "오메가3, 이름보다 함량부터 확인하세요",
      body: "비슷해 보이는 오메가3도 실제 선택 기준은 다릅니다. 제품에 표시된 EPA·DHA 함량과 원료 정보, 품질 관리 기준을 차례로 살펴보세요.",
    };
    if (isBerberine) return {
      title: "베르베린, 원료와 배합부터 확인하세요",
      body: "좋은 선택은 화려한 표현보다 확인 가능한 정보에서 시작됩니다. 어떤 원료를 사용했고 어떻게 구성했는지부터 차근차근 살펴보세요.",
    };
    if (isRedGinseng) return {
      title: "홍삼은 원료와 제조 기준이 차이를 만듭니다",
      body: "산지와 원료의 기준, 제조 과정과 품질 정보를 함께 확인하면 제품의 가치를 더 분명하게 비교할 수 있습니다.",
    };
    if (isFresh) return {
      title: `${name}, 맛을 결정하는 기준부터`,
      body: "산지와 수확 시기, 선별과 보관까지. 신선식품은 눈에 보이지 않는 과정이 한입의 만족도를 만듭니다.",
    };
    return {
      title: `${name}, 선택의 기준을 분명하게`,
      body: "구매 전 궁금한 정보를 중요한 순서대로 확인해 보세요. 제품의 특징과 품질, 사용 방법을 한눈에 정리했습니다.",
    };
  }

  if (intent === "amount") {
    if (isOmega3) {
      const amountBits = compactMockList([
        epa ? `EPA ${epa}mg` : null,
        dha ? `DHA ${dha}mg` : null,
        actualAmount ? `1일 섭취 기준 ${actualAmount}mg` : null,
      ]);
      return {
        title: amountBits.length ? "매일 섭취하는 기능성 성분 함량" : "EPA와 DHA, 얼마나 들어 있는지 확인하세요",
        body: amountBits.length
          ? `${amountBits.join(" · ")}으로 표시된 기준을 한눈에 확인할 수 있습니다.`
          : "오메가3 제품은 캡슐 전체 중량보다 제품에 표시된 EPA와 DHA의 합산량을 확인하는 것이 중요합니다.",
      };
    }
    if (purity || actualAmount) {
      const factsText = compactMockList([
        purity ? `${ingredient || "핵심 원료"} ${purity}%` : null,
        actualAmount ? `1일 섭취 기준 ${actualAmount}mg` : null,
      ]).join(" · ");
      return { title: "수치로 확인하는 핵심 정보", body: `${factsText} 기준으로 제품 정보를 보다 명확하게 확인할 수 있습니다.` };
    }
    return { title: "표시된 수치를 먼저 확인하세요", body: "함량과 기준량은 제품을 비교할 때 가장 객관적으로 확인할 수 있는 정보입니다." };
  }

  if (intent === "ingredient") {
    if (isOmega3) return {
      title: "원료 정보도 꼼꼼하게",
      body: ingredient ? `${ingredient}을 사용한 제품으로, 표시된 원료 정보를 기준으로 구성과 특징을 확인할 수 있습니다.` : "어떤 원료를 사용했는지, 원료의 출처와 형태가 제품에 어떻게 표시되어 있는지 확인해 보세요.",
    };
    if (isBerberine) return {
      title: ingredient ? `${ingredient}, 원료부터 투명하게` : "베르베린의 시작은 원료입니다",
      body: ingredient ? `${ingredient}을 중심으로 제품의 원료 구성을 확인할 수 있도록 정리했습니다.` : "베르베린 제품은 원료의 출처와 형태, 함께 사용한 원료 구성을 확인하는 것이 선택의 출발점입니다.",
    };
    if (isFresh) return { title: "산지가 말해주는 신선함", body: "재배 환경과 수확 시기, 선별 기준은 맛과 신선도를 이해하는 중요한 정보입니다." };
    return { title: sourceTitle || "원료를 보면 제품이 보입니다", body: ingredient ? `${ingredient}을 중심으로 원료 구성과 표시 정보를 확인해 보세요.` : "제품에 사용된 원료와 출처 정보를 확인하면 제품의 특징을 더 쉽게 이해할 수 있습니다." };
  }

  if (intent === "formula") return {
    title: "함께 담은 원료에도 이유가 있습니다",
    body: "주원료와 함께 구성된 원료를 한눈에 확인할 수 있도록 정리했습니다. 과장된 약속보다 실제 배합 구성을 기준으로 살펴보세요.",
  };

  if (intent === "quality") return {
    title: "매일 접하는 제품일수록 품질 기준은 분명하게",
    body: certs ? `${certs} 등 제품에 표시된 제조·품질 정보를 바탕으로 신뢰할 수 있는 기준을 확인하세요.` : "제조 정보와 검사 기준, 인증 여부처럼 제품에 표시된 품질 정보를 확인하면 선택의 불안을 줄일 수 있습니다.",
  };

  if (intent === "usage") return {
    title: isFresh ? "맛있게 오래 즐기는 보관 방법" : "꾸준히 챙기기 쉬운 섭취 안내",
    body: daily || (isFresh
      ? "제품 특성에 맞는 보관 온도와 방법을 확인하면 신선함을 더 오래 유지할 수 있습니다."
      : "제품 표시사항에 기재된 1일 섭취량과 섭취 방법을 확인해 일상 루틴에 맞게 챙겨보세요."),
  };

  if (intent === "problem") return {
    title: "비슷해 보여도 확인해야 할 기준은 다릅니다",
    body: "광고 문구만으로는 제품의 차이를 알기 어렵습니다. 원료와 함량, 품질 정보를 하나씩 비교하면 선택이 더 쉬워집니다.",
  };

  if (intent === "closing") return {
    title: "확인할수록 선택은 더 분명해집니다",
    body: `${name}의 원료와 구성, 품질, ${isFresh ? "보관" : "섭취"} 정보를 차분히 비교하고 나에게 맞는 기준으로 선택하세요.`,
  };

  return {
    title: sourceTitle || `제품 정보 ${index + 1}`,
    body: String(item.description || "").replace(/입력된|확인된|표시된 내용만|추측하지 않[^.]*\.?/g, "").trim() || `${name}을 선택할 때 확인해야 할 정보를 이해하기 쉽게 정리했습니다.`,
  };
}

function buildLegacyDesignDrivenMockDetailPage(product = {}, pageDesign = null) {
  const design = pageDesign || product.pageDesign || buildMockPageDesign(product);
  const facts = getMockProductFacts(product, design);
  const structure = Array.isArray(design?.pageStructure) ? design.pageStructure.filter(Boolean) : [];
  const features = compactMockList(design?.productFeatures).slice(0, 6);
  const purchasePoints = Array.isArray(design?.purchasePoints)
    ? design.purchasePoints.filter(Boolean)
    : Array.isArray(design?.persuasionPoints)
      ? design.persuasionPoints.filter(Boolean)
      : [];

  // AI 설계는 무엇을 말할지 결정하고, Mock Renderer는 소비자에게 어떻게 말할지를 담당한다.
  const renderedSections = structure.map((item, idx) => {
    const intent = inferMockSectionIntent(item, idx);
    const copy = buildMockBuyerCopy(intent, facts, item, idx);
    return {
      type: intent === "problem" ? "problem" : intent === "closing" ? "cta" : intent === "quality" ? "trust" : "section",
      intent,
      title: copy.title,
      body: copy.body,
      step: item?.step || String(idx + 1).padStart(2, "0"),
      source_intent: {
        title: item?.title || "",
        purpose: item?.description || "",
      },
    };
  });

  const first = renderedSections[0] || buildMockBuyerCopy("choice", facts, {}, 0);
  const sections = renderedSections.slice(1);

  if (features.length) {
    sections.push({ type: "benefit_list", intent: "features", title: "한눈에 보는 핵심 정보", items: features });
  }

  const trustItems = compactMockList([
    ...purchasePoints.map((point) => point?.point || point?.label),
    facts.certs,
  ]).slice(0, 6);
  if (trustItems.length) {
    sections.push({ type: "trust_badges", intent: "trust", title: "구매 전 확인할 기준", items: trustItems });
  }

  const hasClosing = sections.some((section) => section.intent === "closing");
  if (!hasClosing) {
    const closing = buildMockBuyerCopy("closing", facts, {}, sections.length + 1);
    sections.push({ type: "cta", intent: "closing", title: closing.title, body: closing.body });
  }

  return {
    hero_headline: first.title,
    hero_subcopy: first.body,
    analysis: {
      target_insight: design?.aiSummary || "",
      emotional_appeal: compactMockList(purchasePoints.map((point) => point?.point || point?.label)).join(", "),
      product_positioning: design?.designReason || "",
    },
    sections,
    mock_meta: {
      mode: "intent-to-copy",
      source: "pageDesign.pageStructure",
      plannerRole: "what-to-say",
      rendererRole: "how-to-say",
      templateRole: "visual-only",
    },
  };
}

const RENDERER_MODE = import.meta.env?.VITE_RENDERER_MODE || "v9";

function buildDesignDrivenMockDetailPage(product = {}, pageDesign = null) {
  const design = pageDesign || product.pageDesign || buildMockPageDesign(product);

  if (RENDERER_MODE === "legacy") {
    return buildLegacyDesignDrivenMockDetailPage(product, design);
  }

  try {
    return renderWithV9({ product, pageDesign: design });
  } catch (error) {
    console.error("V9 Renderer 오류 - Legacy Renderer로 자동 복귀합니다.", error);
    const legacy = buildLegacyDesignDrivenMockDetailPage(product, design);
    return {
      ...legacy,
      mock_meta: {
        ...(legacy.mock_meta || {}),
        mode: "legacy-fallback",
        v9_error: error?.message || String(error),
      },
    };
  }
}

// 이전 함수명은 다른 코드와의 호환성을 위해 유지한다.
function buildBrainMockDetailPage({ name, mainCategory, subCategory, target, benefits, certs, pageDesign, product: sourceProduct }) {
  const product = sourceProduct || {
    name,
    mainCategory,
    subCategory,
    target,
    benefits,
    certs,
    category: subCategory === "건강기능식품" ? "건강기능식품" : "일반식품",
  };
  return buildDesignDrivenMockDetailPage(product, pageDesign || product.pageDesign);
}

function buildMockDetailPage(prompt) {
  const text = String(prompt || "");
  const name = extractPromptField(text, "제품명", "제품");
  const categoryLine = extractPromptField(text, "제품 분류", "");
  const [mainRaw, subRaw] = categoryLine.includes(">") ? categoryLine.split(">").map(v => v.trim()) : [extractPromptField(text, "카테고리", ""), ""];
  const mainCategory = mainRaw || "신선식품";
  const subCategory = subRaw || "";
  const target = extractPromptField(text, "타깃 고객", "");
  const benefits = extractPromptField(text, "핵심 장점", "");
  const certs = extractPromptField(text, "인증정보", "없음");

  return buildBrainMockDetailPage({ name, mainCategory, subCategory, target, benefits, certs });
}

function buildMockRegeneration(prompt) {
  const target = extractJsonBetween(prompt, "다시 작성할 대상:", "제품 카테고리 제약:");
  if (!target) return buildMockDetailPage(prompt);

  if (target.hero_headline !== undefined || target.hero_subcopy !== undefined) {
    return {
      hero_headline: target.hero_headline || "제품의 핵심을 더 선명하게 보여주는 첫 화면",
      hero_subcopy: target.hero_subcopy || "구매자가 확인해야 할 핵심 정보를 간결하게 정리했습니다.",
    };
  }

  if (target.items) {
    return { ...target, items: target.items };
  }

  return {
    ...target,
    title: target.title || "핵심 정보를 다시 정리한 섹션",
    body: target.body || "제품의 장점을 과장 없이 명확하게 전달하도록 문장을 다시 정리했습니다.",
  };
}

function buildMockCorrection(prompt) {
  const original = extractJsonBetween(prompt, "원본 콘텐츠:", "수정해야 할 리스크 목록:");
  return original || buildMockDetailPage(prompt);
}

function buildMockProductAnalysis(product, pageDesign) {
  const knowledge = getProductKnowledge(product.name);
  const structure = pageDesign?.pageStructure || [];
  return {
    coreValue: pageDesign?.aiSummary || knowledge?.buyerPsychology || `${product.name}의 확인 가능한 구매 기준`,
    customerPsychology: knowledge?.buyerPsychology || product.target || getDefaultTarget(product.mainCategory, product.subCategory),
    topCuriosity: (knowledge?.topCuriosity || pageDesign?.persuasionPoints || ["원료 구성", "품질 정보", "섭취·활용 기준"]).slice(0, 3),
    differentiation: (knowledge?.differentiators || pageDesign?.productFeatures || [product.benefits || "제품 정보의 투명성"])[0],
    optimalSequence: structure,
    salesStrategy: knowledge?.salesStrategy || pageDesign?.designReason || "제품별 핵심 정보를 우선순위에 따라 설득한다.",
    emotionalJourney: "궁금함 → 이해 → 신뢰 → 선택 확신",
    keyMessages: (pageDesign?.productFeatures || knowledge?.commonQualities || []).slice(0, 3),
    avoidMessages: knowledge?.avoidWords || [],
  };
}

async function callClaude(prompt, maxTokens = 2000, context = {}, stage = "generation") {
  const apiKey = import.meta.env?.VITE_ANTHROPIC_API_KEY;

  // API 키가 없는 개발 환경에서도 제품 카테고리와 AI 설계를 유지한 Mock을 반환한다.
  if (!apiKey) {
    await new Promise((resolve) => setTimeout(resolve, 450));

    if (stage === "analysis") {
      return buildMockProductAnalysis(context.product || {}, context.pageDesign);
    }

    if (stage === "compliance" || String(prompt).includes('"overall_status"') || String(prompt).includes("표시·광고 규정")) {
      return { flags: [], overall_status: "pass" };
    }

    if (stage === "remediation" || String(prompt).includes("수정해야 할 리스크 목록")) {
      return buildMockCorrection(prompt);
    }

    if (stage === "regenerate" || String(prompt).includes("다시 작성할 대상")) {
      return buildMockRegeneration(prompt);
    }

    const mockProduct = context.product;
    if (mockProduct) {
      return buildDesignDrivenMockDetailPage(
        mockProduct,
        context.pageDesign || mockProduct.pageDesign
      );
    }

    return buildMockDetailPage(prompt);
  }

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: import.meta.env?.VITE_ANTHROPIC_MODEL || "claude-sonnet-4-6",
      max_tokens: maxTokens,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(`API 오류 (${res.status}): ${data?.error?.message || JSON.stringify(data)}`);
  }

  const outputText = (data.content || [])
    .map((b) => (b.type === "text" ? b.text : ""))
    .join("\n");

  if (!outputText) {
    throw new Error("응답에 텍스트 내용이 없어요: " + JSON.stringify(data));
  }

  const parsed = extractFirstJsonFromText(outputText);
  if (parsed) return parsed;

  throw new Error("응답 JSON 파싱에 실패했어요. 원본 일부: " + outputText.slice(0, 200));
}

// ════════════════════════════════════════════════════════════════
// 고급 기능 헬퍼 함수들
// ════════════════════════════════════════════════════════════════

// A/B 테스트 생성 (같은 프롬프트로 2개 버전 생성)
function generateAbVersions(originalDraft) {
  // Mock: 약간 다른 버전들 반환
  const versionA = {
    ...originalDraft,
    hero_headline: originalDraft.hero_headline,
  };
  
  const versionB = {
    ...originalDraft,
    hero_headline: originalDraft.hero_headline + " (버전B)",
    sections: originalDraft.sections?.map((s, i) => ({
      ...s,
      body: s.body ? s.body.slice(0, 50) + "... (다른 각도)" : s.body,
    })),
  };
  
  return { versionA, versionB };
}

// 톤 적용 함수
async function applyToneToContent(content, tone, callClaude) {
  if (tone === "default" || !content) return content;
  
  const toneGuide = TONE_GUIDES[tone] || "";
  const prompt = `다음 상세페이지 콘텐츠를 "${tone}" 톤으로 다시 작성해주세요.

톤 가이드: ${toneGuide}

원본:
${JSON.stringify(content)}

반드시 JSON 형식으로만 답하세요.`;
  
  try {
    return await callClaude(prompt, 3500);
  } catch {
    return content;
  }
}

// 상세 컴플라이언스 레포트 생성
async function generateDetailedComplianceReport(flags, category, callClaude) {
  if (!flags || flags.length === 0) {
    return {
      overall_summary: "준수 완료. 광고 규정을 모두 만족합니다.",
      detailed_flags: [],
    };
  }

  // Mock: 상세 설명 추가
  const detailedFlags = flags.map((flag) => ({
    ...flag,
    detailed_explanation: `[${flag.violation_type}] 이 표현은 건강기능식품 표시·광고 규정 제8조에 위반됩니다.`,
    regulatory_reference: `식품 등의 표시·광고에 관한 법률 제8조 (${flag.risk_level === "high" ? "중대위반" : "경미위반"})`,
    industry_example: `이와 유사한 위반으로 ${flag.risk_level === "high" ? "과징금 처벌" : "개선 권고"} 사례가 있습니다.`,
    detailed_revision_guide: `수정 가이드: "${flag.suggested_revision}" - 이렇게 수정하면 규정을 준수합니다.`,
  }));

  return {
    overall_summary: `${flags.length}개의 위반 항목이 발견되었습니다. ${flags.filter((f) => f.risk_level === "high").length}개는 중대, ${flags.filter((f) => f.risk_level === "medium").length}개는 경미합니다.`,
    detailed_flags: detailedFlags,
    improvement_tips: [
      "제품의 실제 정보(성분, 함량, 인증)만을 객관적으로 서술하세요.",
      "질병 예방이나 치료 효과를 암시하는 표현을 피하세요.",
      "과학적 근거가 있는 정보만 사용하고, 출처를 명시하세요.",
      "다른 제품과의 직접적 또는 암묵적 비교를 피하세요.",
    ],
  };
}

// 다국어 번역 Mock 함수
function translateDraft(draft, languageId) {
  const mockTranslations = {
    en: {
      hero_headline: "Simple, Clear, and Easy to Choose",
      hero_subcopy: "Discover trusted health solutions with verified ingredients and transparent information.",
      sections: [
        { title: "Why Choose This Product", body: "Trusted formula with verified ingredients ensuring quality and safety for every customer.", items: ["Verified ingredients", "Quality guaranteed", "Transparent information", "Customer trust"] },
        { title: "Key Benefits", body: "Scientifically proven benefits with clear documentation and transparent ingredient information.", items: ["Proven effectiveness", "Clear benefits", "Safe choice", "Trusted solution"] },
        { title: "Quality Assurance", body: "Every product meets the highest quality standards. We stand behind our commitment to excellence.", items: ["Certified quality", "Tested formula", "Quality commitment", "Excellence standard"] },
        { title: "Customer Reviews", body: "Thousands of satisfied customers trust our products. Real results from real people.", items: ["Positive reviews", "Proven results", "Customer satisfaction", "Trust verified"] },
        { title: "Product Details", body: "Each product is carefully formulated with the finest ingredients. See detailed specifications.", items: ["Premium ingredients", "Exact dosage", "Safe formula", "Quality control"] },
        { title: "How to Use", body: "Easy to use and integrate into your daily routine. Follow our simple guidelines.", items: ["Simple instructions", "Daily usage", "Easy routine", "Clear directions"] },
      ],
    },
    ja: {
      hero_headline: "シンプルで、明確で、選びやすい",
      hero_subcopy: "検証された成分と透明な情報を備えた信頼できる健康ソリューション。",
      sections: [
        { title: "なぜこの製品を選ぶのか", body: "検証された成分を含む信頼できる処方。すべての顧客に品質と安全性を保証します。", items: ["検証済み成分", "品質保証", "透明な情報", "顧客信頼"] },
        { title: "主な利点", body: "科学的に証明された利点と透明な情報。自信を持って選択してください。", items: ["実証済み効果", "明確な利点", "安全な選択", "信頼できる解決策"] },
        { title: "品質保証", body: "すべての製品が最高の品質基準を満たしています。卓越性へのコミットメント。", items: ["認定品質", "テスト済み処方", "品質へのコミットメント", "優秀性基準"] },
        { title: "顧客の声", body: "数千人の満足した顧客が私たちの製品を信頼しています。本物の結果。", items: ["肯定的なレビュー", "実証済みの効果", "顧客満足度", "信頼検証済み"] },
        { title: "製品仕様", body: "各製品は最高の成分を使用して慎重に配合されています。詳細をご覧ください。", items: ["プレミアム成分", "正確な用量", "安全な処方", "品質管理"] },
        { title: "使用方法", body: "簡単に使用でき、毎日のルーティンに統合できます。当社の簡単なガイドラインに従ってください。", items: ["簡単な説明書", "毎日の使用", "簡単なルーティン", "明確な指示"] },
      ],
    },
    "zh-cn": {
      hero_headline: "简单、清晰、容易选择",
      hero_subcopy: "发现具有经过验证的成分和透明信息的可信健康解决方案。",
      sections: [
        { title: "为什么选择此产品", body: "具有经过验证的成分的值得信赖的配方。我们为每位客户确保品质和安全。", items: ["验证成分", "品质保证", "透明信息", "客户信任"] },
        { title: "关键益处", body: "科学证明的益处和透明信息。放心选择。", items: ["实证效果", "明确益处", "安全选择", "可信方案"] },
        { title: "质量保证", body: "所有产品均符合最高质量标准。我们为卓越承诺而自豪。", items: ["认证质量", "测试配方", "质量承诺", "卓越标准"] },
        { title: "客户评价", body: "数千名满意的客户信任我们的产品。真实的结果来自真实的人。", items: ["正面评价", "实证效果", "客户满意度", "信任认证"] },
        { title: "产品规格", body: "每种产品均用最优质的成分精心配制。查看我们的详细规格。", items: ["优质成分", "精确剂量", "安全配方", "质量控制"] },
        { title: "使用方法", body: "易于使用并融入日常生活。遵循我们简单的指南。", items: ["简单说明", "日常使用", "简便常规", "清晰指示"] },
      ],
    },
    "zh-tw": {
      hero_headline: "簡單、清晰、容易選擇",
      hero_subcopy: "發現具有經過驗證的成分和透明信息的可信健康解決方案。",
      sections: [
        { title: "為什麼選擇此產品", body: "具有經過驗證的成分的值得信賴的配方。我們為每位客戶確保品質和安全。", items: ["驗證成分", "品質保證", "透明信息", "客戶信任"] },
        { title: "關鍵益處", body: "科學證明的益處和透明信息。放心選擇。", items: ["實證效果", "明確益處", "安全選擇", "可信方案"] },
        { title: "質量保證", body: "所有產品均符合最高質量標準。我們為卓越承諾而自豪。", items: ["認證質量", "測試配方", "質量承諾", "卓越標準"] },
        { title: "客戶評價", body: "數千名滿意的客戶信任我們的產品。真實的結果來自真實的人。", items: ["正面評價", "實證效果", "客戶滿意度", "信任認證"] },
        { title: "產品規格", body: "每種產品均用最優質的成分精心配製。查看我們的詳細規格。", items: ["優質成分", "精確劑量", "安全配方", "質量控制"] },
        { title: "使用方法", body: "易於使用並融入日常生活。遵循我們簡單的指南。", items: ["簡單說明", "日常使用", "簡便常規", "清晰指示"] },
      ],
    },
    th: {
      hero_headline: "ง่าย ชัดเจน และเลือกง่าย",
      hero_subcopy: "ค้นพบสารองค์ประกอบที่ได้รับการตรวจสอบและข้อมูลที่โปร่งใสด้วยโซลูชั่นสุขภาพที่เชื่อถือได้",
      sections: [
        { title: "ทำไมถึงเลือกผลิตภัณฑ์นี้", body: "สูตรที่น่าเชื่อถือพร้อมส่วนประกอบที่ได้รับการตรวจสอบ เรารับประกันคุณภาพและความปลอดภัย", items: ["ส่วนประกอบที่ตรวจสอบแล้ว", "รับประกันคุณภาพ", "ข้อมูลที่โปร่งใส", "ความเชื่อใจของลูกค้า"] },
        { title: "ประโยชน์หลัก", body: "ประโยชน์ที่พิสูจน์ทางวิทยาศาสตร์และข้อมูลที่โปร่งใส เลือกด้วยความมั่นใจ", items: ["ประสิทธิภาพที่พิสูจน์", "ประโยชน์ที่ชัดเจน", "การเลือกที่ปลอดภัย", "วิธีแก้ปัญหาที่น่าเชื่อถือ"] },
        { title: "การรับประกันคุณภาพ", body: "ผลิตภัณฑ์ทั้งหมดตรงตามมาตรฐานคุณภาพสูงสุด เรายืนยันความมุ่งมั่นต่อความเป็นเลิศ", items: ["คุณภาพที่ได้รับการรับรอง", "สูตรทดสอบแล้ว", "ความมุ่งมั่นต่อคุณภาพ", "มาตรฐานความเป็นเลิศ"] },
        { title: "ความเห็นของลูกค้า", body: "ลูกค้าหลายพันคนเชื่อใจผลิตภัณฑ์ของเรา ผลลัพธ์จริงจากผู้คนจริง", items: ["รีวิวเชิงบวก", "ผลลัพธ์ที่พิสูจน์", "ความพึงพอใจของลูกค้า", "ความเชื่อถือที่ตรวจสอบ"] },
        { title: "ข้อมูลจำเพาะของผลิตภัณฑ์", body: "แต่ละผลิตภัณฑ์ได้รับการสูตรด้วยส่วนประกอบที่ดีที่สุด ดูข้อมูลจำเพาะของเรา", items: ["ส่วนประกอบพรีเมียม", "ปริมาณที่แม่นยำ", "สูตรที่ปลอดภัย", "การควบคุมคุณภาพ"] },
        { title: "วิธีการใช้", body: "ใช้ง่ายและสามารถรวมเข้ากับประจำวันของคุณ ปฏิบัติตามคำแนะนำง่ายๆของเรา", items: ["คำแนะนำง่าย", "การใช้รายวัน", "กิจวัตรง่าย", "ทิศทางที่ชัดเจน"] },
      ],
    },
  };

  const translation = mockTranslations[languageId] || mockTranslations.en;

  return {
    ...draft,
    hero_headline: translation.hero_headline,
    hero_subcopy: translation.hero_subcopy,
    sections: draft.sections?.map((s, idx) => {
      const predefinedSection = translation.sections?.[idx];
      if (predefinedSection) {
        return {
          ...s,
          title: predefinedSection.title,
          body: predefinedSection.body,
          items: predefinedSection.items || s.items,
        };
      } else {
        const lastDefined = translation.sections?.[translation.sections.length - 1];
        return {
          ...s,
          title: lastDefined?.title || s.title,
          body: lastDefined?.body || s.body,
          items: lastDefined?.items || s.items,
        };
      }
    }) || [],
  };
}

// SEO 최적화 Mock 함수
function generateSeoOptimization(draft, product) {
  const keywords = [
    product.ingredientName || "제품",
    product.target?.split(",")[0] || "고객",
    product.name?.split(" ")[0] || "상품",
    product.category === "건강기능식품" ? "건강" : "제품",
    product.benefits?.split(",")[0]?.slice(0, 10) || "효과",
  ].filter(Boolean);

  return {
    recommendedKeywords: keywords.slice(0, 5),
    metaDescription: `${product.name} - ${product.category}. ${product.benefits?.slice(0, 40)}... 전문 정보와 후기를 확인하세요.`,
    metaKeywords: keywords.slice(0, 5).join(", "),
    titleTag: `${product.name} | ${product.category} | 공식 상세페이지`,
    headingStructure: {
      h1: draft.hero_headline,
      h2_suggestions: draft.sections?.slice(0, 3).map((s) => s.title) || [],
    },
    readabilityScore: 85,
    keywordDensity: {
      primary: `${product.ingredientName}(${Math.floor(Math.random() * 3 + 2)}%)`,
      secondary: `${product.category}(${Math.floor(Math.random() * 2 + 1)}%)`,
    },
    seoTips: [
      "주요 키워드는 제목과 첫 문단에 배치하세요.",
      "제목과 meta description을 명확하고 간결하게 작성하세요.",
      "내부 링크를 추가하여 관련 페이지로 유도하세요.",
      "이미지 alt 텍스트에 키워드를 포함하세요.",
      "모바일 최적화를 확인하고 로딩 속도를 개선하세요.",
    ],
  };
}

export default function App() {
  const [product, setProduct] = useState({
    name: "",
    mainCategory: "건강·영양식품",
    subCategory: "일반 건강식품",
    category: "일반식품", // 내부 법적 분류값 (자동 설정됨, UI에서 보이지 않음)
    target: "",
    benefits: "",
    certs: "",
    ingredientName: "",
    purity: "",
    actualAmount: "",
    amountBasis: "원료 총중량",
    epa: "",
    dha: "",
  });
  const [image, setImage] = useState(null);
  const [themeColor, setThemeColor] = useState("#C89A5A");
  const [pointColors, setPointColors] = useState([]); // 최대 2개
  const [headingFont, setHeadingFont] = useState("pretendard");
  const [bodyFont, setBodyFont] = useState("pretendard");
  const [concept, setConcept] = useState("minimal"); // 내부 미리보기 스타일 호환용
  const [additionalRequest, setAdditionalRequest] = useState("");
  const [aiImproveRequest, setAiImproveRequest] = useState(null);
  const [aiImproveResult, setAiImproveResult] = useState(null);
  const [aiImproveHistory, setAiImproveHistory] = useState([]);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [strategyResult, setStrategyResult] = useState(null);
  const [storyFlow, setStoryFlow] = useState(null);

  const [stage, setStage] = useState(-1); // -1 idle, 0..3 running, 4 done
  const [error, setError] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [draft, setDraft] = useState(null);
  const [editHistory, setEditHistory] = useState([]);
  const [editingSection, setEditingSection] = useState(null);
  const [compliance, setCompliance] = useState(null);
  const [regenIndex, setRegenIndex] = useState(null);
  const [copied, setCopied] = useState(false);
  const [htmlCopied, setHtmlCopied] = useState(false);
  const fileInputRef = useRef(null);
  const isGenerating = stage >= 0 && stage < 4;


  const handleAIImproveRequest = async (request) => {
    // ✅ 수정: SectionEditor가 보낸 data를 올바르게 추출
    const currentSection = request?.data || request?.section || {};
    const userInstruction = request?.instruction || "";
    
    if (!userInstruction || userInstruction.trim() === "") {
      console.warn("❌ AI 개선 요청: instruction이 없습니다");
      return;
    }
    
    console.log("📝 AI 개선 요청 시작");
    console.log("  - 요청:", userInstruction);
    console.log("  - 제목:", currentSection.title);
    console.log("  - 본문 길이:", currentSection.body?.length || 0);
    
    setAiImproveRequest(request);

    try {
      // ✅ 수정: instruction을 명시적으로 전달 (product 변수명 수정)
      const improvePrompt = buildImprovePrompt({
        section: currentSection,
        productInfo: product || {},
        category: product?.mainCategory || "",
        tone: "신뢰감 있는",
        targetCustomer: "기본",
        brainKnowledge: {},
        instruction: userInstruction,
      });

      const improveContext = buildImproveContext({
        productInfo: product || {},
        category: product?.mainCategory || "",
        tone: "신뢰감 있는",
        targetCustomer: "기본",
        brainKnowledge: {},
        instruction: userInstruction
      });

      console.log("📄 생성된 프롬프트 길이:", improvePrompt.length, "자");

      const aiGenerated = await runAIImproveEngineAsync({
        section: currentSection,
        productInfo: product || {},
        category: product?.mainCategory || "",
        tone: "신뢰감 있는",
        targetCustomer: "기본",
        brainKnowledge: {},
        instruction: userInstruction,
      });

      console.log("🤖 AI 생성 완료");
      console.log("  - 생성된 제목:", aiGenerated?.result?.title?.substring(0, 50));
      console.log("  - 생성된 본문 길이:", aiGenerated?.result?.body?.length || 0);

      if (!aiGenerated?.result?.title || !aiGenerated?.result?.body) {
        console.error("❌ AI 생성 실패: 제목이나 본문이 없습니다");
        setAiImproveResult({
          sectionId: request?.sectionId ?? request?.section?.index ?? request?.data?.index ?? null,
          instruction: userInstruction,
          before: {
            title: currentSection.title || "",
            body: currentSection.body || "",
          },
          after: {
            title: "AI 개선 실패",
            body: "AI 개선 결과를 생성하지 못했습니다. 다시 요청해주세요.",
          },
        });
        return;
      }

      console.log("✅ AI 개선 완료");
      console.log("  - 제목 변경:", aiGenerated.result.title !== currentSection.title);
      console.log("  - 본문 변경:", aiGenerated.result.body !== currentSection.body);

      // ✅ 기존 구조 유지: improveResult 객체 생성
      const improveResult = {
        sectionId: request?.sectionId ?? request?.section?.index ?? request?.data?.index ?? null,
        instruction: userInstruction,
        before: {
          title: currentSection.title || "",
          body: currentSection.body || "",
        },
        after: {
          title: aiGenerated.result.title || currentSection.title,
          body: aiGenerated.result.body || currentSection.body,
        },
      };

      setAiImproveResult(improveResult);

      // STEP 2-7-1: AI 개선 결과 즉시 Preview 반영
      if (request?.section?.index !== undefined || request?.data?.index !== undefined) {
        handleSectionUpdate(
          improveResult.sectionId ?? "hero",
          {
            title: improveResult.after.title,
            body: improveResult.after.body,
          },
          {
            type: "ai_improve_preview_update",
            timestamp: new Date().toISOString(),
          }
        );
      }

      console.log("AI Improve Result:", improveResult);

    } catch (error) {
      console.error("❌ AI 개선 중 오류:", error);
      setAiImproveResult({
        sectionId: request?.sectionId ?? request?.section?.index ?? request?.data?.index ?? null,
        instruction: userInstruction,
        before: {
          title: currentSection.title || "",
          body: currentSection.body || "",
        },
        after: {
          title: "오류 발생",
          body: error.message || "AI 개선 중 오류가 발생했습니다. 나중에 다시 시도해주세요.",
        },
      });
    }
  };

  // STEP 2-3: AI 개선 결과 적용
  const handleApplyAIImproveResult = () => {
    if (!aiImproveResult) return;

    handleSectionUpdate(
      aiImproveResult.sectionId ?? "hero",
      {
        title: aiImproveResult.after?.title || "",
        body: aiImproveResult.after?.body || "",
      },
      {
        type: "ai_improve_apply",
        before: aiImproveResult.before,
        after: aiImproveResult.after,
        instruction: aiImproveResult.instruction,
        timestamp: new Date().toISOString(),
      }
    );

    setAiImproveResult(null);
  };

  // V11.9.1 STEP1: Section Editor → generatedPage 업데이트 엔진
  // 상세페이지 섹션 수정 시 단일 데이터 소스(generatedPage)를 기준으로 변경하기 위한 핸들러
  const handleSectionUpdate = (sectionId, updatedSection, editRecord = null) => {
    setDraft((prev) => {
      if (!prev) return prev;

      const isHero = String(sectionId) === "hero";
      const beforeSection = isHero
        ? {
            title: prev.hero_headline || "",
            body: prev.hero_subcopy || "",
            items: [],
          }
        : (prev.sections || []).find(
            (section, index) => String(section.id || section.type || index) === String(sectionId)
          ) || null;

      let nextDraft;

      if (isHero) {
        nextDraft = {
          ...prev,
          hero_headline: updatedSection.title ?? prev.hero_headline,
          hero_subcopy: updatedSection.body ?? prev.hero_subcopy,
        };
      } else {
        const currentSections = [...(prev.sections || [])];
        const targetIndex = currentSections.findIndex(
          (section, index) => String(section.id || section.type || index) === String(sectionId)
        );

        if (targetIndex >= 0) {
          currentSections[targetIndex] = {
            ...currentSections[targetIndex],
            ...updatedSection,
          };
        } else {
          currentSections.push({ id: sectionId, ...updatedSection });
        }

        nextDraft = { ...prev, sections: currentSections };
      }

      const generatedPage = {
        ...(prev.generatedPage || {}),
        hero_headline: nextDraft.hero_headline,
        hero_subcopy: nextDraft.hero_subcopy,
        sections: nextDraft.sections || [],
      };

      const historyItem = editRecord || {
        section: sectionId,
        before: beforeSection,
        after: updatedSection,
        timestamp: new Date().toISOString(),
      };

      setEditHistory((prevHistory) => [...prevHistory, historyItem]);

      return {
        ...nextDraft,
        generatedPage,
      };
    });
  };


  // 프로젝트 관리 state
  const [viewMode, setViewMode] = useState("main"); // "main" | "projects" | "templates"
  const [projectsList, setProjectsList] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [projectName, setProjectName] = useState("");
  const [currentProjectId, setCurrentProjectId] = useState(null);

  // 템플릿 및 전략 분석 state
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  // 페이지 설계 state
  const [pageDesign, setPageDesign] = useState(null);
  const [showPageDesign, setShowPageDesign] = useState(false);

  // 고급 기능 state
  const [abVersions, setAbVersions] = useState(null); // { versionA, versionB }
  const [selectedCopyTone, setSelectedCopyTone] = useState("default"); // "default" | "professional" | "friendly" | "mysterious" | "fun"
  const [toneAdjustedDraft, setToneAdjustedDraft] = useState(null);
  const [regeneratingSectionIndex, setRegeneratingSectionIndex] = useState(null);
  const [detailedComplianceReport, setDetailedComplianceReport] = useState(null);

  // 다국어 번역 & SEO state
  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [translatedDraft, setTranslatedDraft] = useState(null);
  const [activeLanguage, setActiveLanguage] = useState("ko");
  const [translatedVersions, setTranslatedVersions] = useState(null); // { en: {...}, ja: {...}, ... }
  const [translatingLanguages, setTranslatingLanguages] = useState([]);
  const [seoOptimization, setSeoOptimization] = useState(null);
  const [generatingSeo, setGeneratingSeo] = useState(false);

  const update = (k, v) => setProduct((p) => ({ ...p, [k]: v }));
  const displayDraft = translatedDraft || draft;

  // 1차 카테고리(mainCategory)와 2차 카테고리(subCategory)에 따라
  // 내부 법적 분류값(category)을 자동으로 설정하는 함수
  const updateProductCategory = (mainCategory, subCategory) => {
    const newCategory = getCategoryMapping(mainCategory, subCategory);
    setProduct((p) => ({
      ...p,
      mainCategory,
      subCategory,
      category: newCategory
    }));
  };

  // 폰트 선택 미리보기가 각자 폰트로 보이도록, 모든 구글폰트를 로드해둔다.
  useEffect(() => {
    const url = buildGoogleFontsUrl(FONTS.map((f) => f.id));
    if (!url) return;
    const existing = document.getElementById("dpg-google-fonts");
    if (existing) return; // 한 번만 로드
    const link = document.createElement("link");
    link.id = "dpg-google-fonts";
    link.rel = "stylesheet";
    link.href = url;
    document.head.appendChild(link);
  }, []);

  // 포인트 컬러 토글 (최대 2개)
  const togglePointColor = (c) => {
    setPointColors((prev) => {
      if (prev.includes(c)) return prev.filter((x) => x !== c);
      if (prev.length >= 2) return [prev[1], c]; // 오래된 것 밀어내기
      return [...prev, c];
    });
  };

  // ════════════════════════════════════════════════════════════════
  // 프로젝트 관리 함수들
  // ════════════════════════════════════════════════════════════════

  const handleSaveProject = () => {
    try {
      console.log('[SaveProject] ========== 저장 시작 ==========');
      
      // Step 1: displayName 생성
      const displayName = projectName?.trim() || product?.name || "무제";
      console.log('[SaveProject] Step 1 - displayName:', displayName);
      if (!displayName) throw new Error('프로젝트 이름이 없습니다.');
      
      // Step 2: saveStatus 결정
      const saveStatus = draft ? "completed" : "draft";
      console.log('[SaveProject] Step 2 - saveStatus:', saveStatus);
      
      // Step 3: projectData 객체 생성 (모든 필드에 기본값 설정)
      console.log('[SaveProject] Step 3 - projectData 생성 중...');
      const projectData = {
        projectId: currentProjectId || undefined,
        projectName: displayName,
        saveStatus,
        product: product || {},
        themeColor: themeColor || "#A87535",
        pointColors: pointColors || [],
        headingFont: headingFont || "pretendard",
        bodyFont: bodyFont || "pretendard",
        concept: concept || "minimal",
        additionalRequest: additionalRequest || "",
        draft: draft || null,
        generatedPage: draft || null,
        analysisResult: analysisResult || null,
        strategyResult: strategyResult || null,
        storyFlow: storyFlow || null,
        editHistory: editHistory || [],
        reviewResult: compliance || null,
        compliance: compliance || null,
        aiImproveResult: aiImproveResult || null,
        aiImproveHistory: aiImproveHistory || [],
      };
      console.log('[SaveProject] Step 3 - projectData:', projectData);
      
      // Step 4: saveProject 호출
      console.log('[SaveProject] Step 4 - saveProject 호출 중...');
      const saved = saveProject(projectData);
      console.log('[SaveProject] Step 4 - saved:', saved);
      if (!saved || !saved.projectId) {
        throw new Error('saveProject가 유효한 결과를 반환하지 않았습니다.');
      }
      
      // Step 5: loadProjects로 저장된 내용 확인
      console.log('[SaveProject] Step 5 - loadProjects 호출 중...');
      const allProjects = loadProjects();
      console.log('[SaveProject] Step 5 - allProjects:', allProjects);
      if (!Array.isArray(allProjects)) {
        throw new Error('loadProjects가 배열을 반환하지 않았습니다.');
      }
      
      // Step 6: 저장된 프로젝트 검증
      console.log('[SaveProject] Step 6 - 저장된 프로젝트 검증 중...');
      const isActuallySaved = allProjects.some((p) => p.projectId === saved.projectId);
      console.log('[SaveProject] Step 6 - isActuallySaved:', isActuallySaved);
      if (!isActuallySaved) {
        throw new Error(`저장된 프로젝트를 찾을 수 없습니다 (id: ${saved.projectId})`);
      }

      // Step 7: State 업데이트
      console.log('[SaveProject] Step 7 - State 업데이트 중...');
      setCurrentProjectId(saved.projectId);
      setProjectsList(allProjects);
      setProjectName("");
      setError("");
      console.log('[SaveProject] Step 7 - State 업데이트 완료');
      
      // Step 8: CustomEvent 발생
      console.log('[SaveProject] Step 8 - CustomEvent 발생 중...');
      const event = new CustomEvent("brand-engine-project-saved", { 
        detail: { projectId: saved.projectId } 
      });
      window.dispatchEvent(event);
      console.log('[SaveProject] Step 8 - CustomEvent 발생 완료');
      
      // Step 9: 성공 알림
      console.log('[SaveProject] ========== 저장 성공 ==========');
      alert(`✅ 프로젝트 "${displayName}"이(가) 저장되었습니다.`);
      
    } catch (saveError) {
      console.error('[SaveProject] ❌ 에러 발생:', saveError);
      console.error('[SaveProject] 에러 메시지:', saveError?.message);
      console.error('[SaveProject] 에러 스택:', saveError?.stack);
      
      const message = saveError?.message || "프로젝트를 저장하지 못했습니다.";
      console.error('[SaveProject] 최종 에러 메시지:', message);
      
      setError(message);
      alert(`❌ 저장 실패:\n${message}`);
    }
  };

  const handleOpenProjects = () => {
    const projects = loadProjects();
    setProjectsList(projects);
    setSearchQuery("");
    setViewMode("projects");
  };

  const handleBackToMain = () => {
    setViewMode("main");
    setSearchQuery("");
  };

  const handleSearchProjects = (query) => {
    setSearchQuery(query);
    if (query.trim()) {
      const results = searchProjects(query);
      setProjectsList(results);
    } else {
      setProjectsList(loadProjects());
    }
  };

  const handleLoadProject = (projectId) => {
    const project = getProject(projectId);
    if (!project) {
      alert("프로젝트를 찾을 수 없습니다.");
      return;
    }

    // 모든 상태 복원
    setProduct(project.product);
    setThemeColor(project.themeColor);
    setPointColors(project.pointColors || []);
    setHeadingFont(project.headingFont);
    setBodyFont(project.bodyFont || "pretendard");
    setConcept(project.concept || "minimal");
    setAdditionalRequest(project.additionalRequest || "");
    setDraft(project.draft);
    setCompliance(project.compliance);
    setAiImproveResult(project.aiImproveResult || null);
    setAiImproveHistory(project.aiImproveHistory || []);
    setCurrentProjectId(project.projectId);
    setImage(null); // 이미지는 복원하지 않음
    setStage(-1);

    setViewMode("main");
    setProjectName("");
  };

  const handleDeleteProject = (projectId) => {
    const project = getProject(projectId);
    if (!project) return;

    if (confirm(`"${project.projectName}" 프로젝트를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`)) {
      const success = deleteProject(projectId);
      if (success) {
        const projects = loadProjects();
        setProjectsList(projects);
        alert("프로젝트가 삭제되었습니다.");
      }
    }
  };

  // 실제 적용할 폰트 family 문자열
  const headingFamily = FONTS.find((f) => f.id === headingFont)?.family || FONTS[0].family;
  const bodyFamily = FONTS.find((f) => f.id === bodyFont)?.family || FONTS[0].family;
  // 포인트 컬러: 라벨/배지엔 1번째, 강조엔 2번째(없으면 메인/1번째로 폴백)
  const accent1 = pointColors[0] || themeColor;
  const accent2 = pointColors[1] || pointColors[0] || themeColor;

  const handleImage = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => setImage(reader.result);
    reader.readAsDataURL(f);
  };

  // 전략 분석 실행
  async function runStrategyAnalysis() {
    setError("");
    setShowPageDesign(false);
    setPageDesign(null);

    // AI 상세페이지 설계 생성
    const design = buildMockPageDesign({ ...product, additionalRequest });
    setPageDesign(design);
    setShowPageDesign(true);
  }

  // 템플릿 선택 화면 진입
  const handleOpenTemplates = () => {
    setViewMode("templates");
  };

  // 템플릿 선택
  const handleSelectTemplate = (templateId) => {
    setSelectedTemplate(templateId);

    // 현재 미리보기 렌더링과 호환되도록 디자인 템플릿을 기존 concept 스타일에 매핑
    const templateConceptMap = {
      "premium-white": "minimal",
      "soft-beige": "warm",
      editorial: "editorial",
      "dark-luxury": "premium",
      "science-lab": "minimal",
      "natural-green": "natural",
      minimal: "minimal",
      "modern-clean": "minimal",
      "bold-impact": "bold",
      "warm-story": "warm",
    };

    setConcept(templateConceptMap[templateId] || "minimal");
    // 변경: 바로 돌아가지 않음 (selectedTemplate만 저장)
  };

  // 템플릿을 선택한 후 상세페이지 생성
  const handleGenerateWithTemplate = async () => {
    if (!selectedTemplate) {
      setError("템플릿을 선택해주세요.");
      return;
    }
    
    // 메인 화면으로 이동
    setViewMode("main");
    
    // 상세페이지 생성 실행 (설계는 이미 있으므로 바로 생성)
    setTimeout(() => {
      runPipeline();
    }, 100);
  };

  // 템플릿 메뉴 돌아가기
  const handleBackFromTemplates = () => {
    setViewMode("main");
  };

  // A/B 테스트 생성
  async function generateAbTest() {
    if (!draft) return;
    setError("");
    setStage(3); // 생성 중 상태

    try {
      const versions = generateAbVersions(draft);
      setAbVersions(versions);
      setStage(4); // 완료
    } catch (err) {
      setError(err.message || "A/B 테스트 생성 실패");
      setStage(-1);
    }
  }

  // 섹션별 재생성
  async function regenerateSection(sectionIndex, feedback = "") {
    if (!draft || !draft.sections || sectionIndex < 0 || sectionIndex >= draft.sections.length) return;

    setError("");
    setRegeneratingSectionIndex(sectionIndex);
    setStage(3); // 생성 중

    try {
      const sectionData = draft.sections[sectionIndex];
      const feedbackPart = feedback ? `

사용자 피드백: ${feedback}` : "";
      const prompt = `다음 섹션을 더 나은 카피로 다시 작성해주세요:

섹션 타입: ${sectionData.type}
제목: ${sectionData.title}
본문: ${sectionData.body}${feedbackPart}

같은 JSON 형식으로 재작성된 섹션만 반환하세요.`;

      const regenerated = await callClaude(prompt, 1500);

      const updatedSections = draft.sections.map((s, i) =>
        i === sectionIndex ? { ...s, body: regenerated.body || s.body, title: regenerated.title || s.title } : s
      );

      setDraft({ ...draft, sections: updatedSections });
      setRegeneratingSectionIndex(null);
      setStage(4);
    } catch (err) {
      setError(err.message || "섹션 재생성 실패");
      setRegeneratingSectionIndex(null);
      setStage(-1);
    }
  }

  // 톤 조정
  async function applyTone(tone) {
    if (!draft || tone === "default") {
      setToneAdjustedDraft(null);
      setSelectedCopyTone("default");
      return;
    }

    setError("");
    setSelectedCopyTone(tone);
    setStage(3); // 생성 중

    try {
      const adjusted = await applyToneToContent(draft, tone, callClaude);
      setToneAdjustedDraft(adjusted);
      setStage(4);
    } catch (err) {
      setError(err.message || "톤 조정 실패");
      setStage(-1);
    }
  }

  // 상세 컴플라이언스 레포트 생성
  async function generateDetailedReport() {
    if (!compliance) return;

    setError("");
    setStage(3);

    try {
      const detailed = await generateDetailedComplianceReport(compliance.flags, product.category, callClaude);
      setDetailedComplianceReport(detailed);
      setStage(4);
    } catch (err) {
      setError(err.message || "상세 보고서 생성 실패");
      setStage(-1);
    }
  }

  // 다국어 번역 토글
  const toggleLanguage = (langId) => {

    setSelectedLanguage(selectedLanguage === langId ? "" : langId);

  };

  // 다국어 번역 생성
  async function generateTranslations() {

    if (!draft || !selectedLanguage) return;

    setError("");

    setStage(3);

    try {

      const translated = translateDraft(draft, selectedLanguage);

      setTranslatedDraft(translated);

      setActiveLanguage(selectedLanguage);

      setStage(4);

    } catch (err) {

      setError(err.message || "번역 생성 실패");

      setStage(-1);

    }

  }

  // SEO 최적화 생성
  async function generateSeoOptimizations() {
    if (!draft) return;

    setError("");
    setGeneratingSeo(true);
    setStage(3);

    try {
      const seo = generateSeoOptimization(draft, product);
      setSeoOptimization(seo);
      setStage(4);
    } catch (err) {
      setError(err.message || "SEO 최적화 생성 실패");
      setStage(-1);
    }

    setGeneratingSeo(false);
  }

  async function runPipeline() {
    // 설계가 없으면 먼저 설계 실행
    if (!showPageDesign) {
      await runStrategyAnalysis();
      return;
    }

    // 설계가 있으면 상세페이지 생성 실행
    // pageDesign은 유지 (프롬프트에 전달할 데이터이므로)
    setShowPageDesign(false);
    setError("");
    setAnalysis(null);
    setDraft(null);
    setCompliance(null);
    setStage(0);

    const purityLine = product.purity
      ? `
원료 순도: ${product.ingredientName || "핵심 원료"} 중 ${product.purity}% (이는 원료 자체의 순도이며, 최종 제품 1일 섭취량 기준 총 함량과는 다른 수치임)`
      : "";
    const actualAmountLine = product.actualAmount
      ? `
1일 섭취량 기준 실제 함량: ${product.actualAmount}mg — 이 수치는 "${product.amountBasis}" 기준입니다 (${product.amountBasis === "핵심 활성성분" ? "예: EPA+DHA처럼 기능성 인정의 근거가 되는 활성성분 자체의 합산량" : "예: 정제어유 전체처럼 원료의 총 중량이며, 그 안의 핵심 활성성분 함량과는 다를 수 있음"})`
      : "";
    const epaLine = product.epa || product.dha
      ? `
1일 섭취량 기준 활성성분 함량: EPA ${product.epa || "미입력"}mg / DHA ${product.dha || "미입력"}mg (식약처 기능성 인정 근거 성분)`
      : "";
    const epaGuidance = product.epa || product.dha
      ? `
- EPA/DHA 함량이 제공됐습니다. 상세페이지에 "EPA ${product.epa || "?"}mg, DHA ${product.dha || "?"}mg"를 실제 수치로 명시하세요. "XXmg" 같은 플레이스홀더 절대 금지.`
      : `
- EPA/DHA 개별 함량이 입력되지 않았습니다. 상세페이지에서 EPA·DHA 수치를 추측하거나 플레이스홀더(XXmg 등)로 비워두지 마세요. "정확한 EPA·DHA 함량은 성분표에서 확인하세요"로만 안내하세요.`;
    const numericGuidance =
      product.purity || product.actualAmount
        ? `

[수치 표기 지침] 위에 제공된 순도(%)와 실제 함량(mg)은 서로 다른 의미이니 절대 혼용하지 마세요. 순도만 있으면 '원료 순도 X%'라고만 쓰고 실제 섭취량으로 단정하지 마세요. 실제 함량(mg)이 있으면, 그게 "원료 총중량" 기준인지 "핵심 활성성분" 기준인지 반드시 명시하고 절대 서로 바꿔쓰지 마세요. 특히 "원료 총중량"이 제공된 경우, 이를 핵심 활성성분(예: EPA+DHA, 기능성 성분 등) 함량인 것처럼 표현하면 안 되고, 활성성분 함량이 궁금하면 성분표를 참조하라고 안내하세요.${epaGuidance}`
        : `

[수치 표기 지침] 원료 함량(%)의 정확한 의미(순도인지 최종 함량인지, 원료 총중량인지 활성성분인지)가 제공되지 않았다면, 추측해서 단정하지 말고 '정확한 함량은 성분표를 참조하세요' 수준으로만 언급하세요.${epaGuidance}`;

    // 타깃 고객: 사용자 입력이 있으면 그대로, 없으면 카테고리 기반 기본값 사용
    const effectiveTarget = product.target || getDefaultTarget(product.mainCategory, product.subCategory);

    const productBlock = `제품명: ${product.name}
제품 분류: ${product.mainCategory} > ${product.subCategory}
타깃 고객: ${effectiveTarget}
핵심 장점: ${product.benefits || "미입력 - 제품명과 Brain Knowledge 기반으로 안전하게 보완"}
인증정보: ${product.certs || "없음"}${purityLine}${actualAmountLine}${epaLine}`;

    // Product Knowledge 조회
    const productKnowledge = getProductKnowledge(product.name);
    const safeFeatures = getSafeProductFeatures(product.name);
    const productKnowledgeBlock = productKnowledge ? `
[Product Knowledge - ${product.name}]

일반적 제품 특성:
- 특징: ${productKnowledge.commonQualities?.join(", ") || "특징 없음"}
- 사용처: ${productKnowledge.commonUsages?.join(", ") || "다양한 상황"}
- 느낌: ${productKnowledge.commonFeelings?.join(", ") || "긍정적인 느낌"}

카피 톤: ${productKnowledge.copytone || "자연스러운 톤"}

🚫 절대 사용 금지 (확인 불가능한 정보):
${productKnowledge.avoidWords?.map(w => `- ${w}`).join("\n") || "- 특별한 제한 없음"}
` : "";

    // 카테고리별 Knowledge 정보 조회
    const categoryKnowledge = getCategoryKnowledge(product.mainCategory, product.subCategory);
    const categoryKnowledgeBlock = categoryKnowledge ? `
[Category Knowledge - ${product.mainCategory} > ${product.subCategory}]

구매 포인트: ${categoryKnowledge.keyBuyingPoints?.join(", ") || "제품 정보"}

고객 우려사항: ${categoryKnowledge.customerConcerns?.join(", ") || "상품 선택 고민"}

추천 판매 전략: ${categoryKnowledge.recommendedStrategy || "카테고리 기반 전략"}

상세페이지 Story Flow:
${categoryKnowledge.storyFlow?.map((step, idx) => `${idx + 1}. ${step}`).join("\n") || "기본 구조"}

신뢰 요소: ${categoryKnowledge.trustElements?.join(", ") || "신뢰 정보"}

카피 톤: ${categoryKnowledge.copyTone || "신뢰감 있는 톤"}

피해야 할 표현: ${categoryKnowledge.avoidExpressions?.join(", ") || "부적절한 표현"}
` : "";

    // V5 Brain Config 연결: 실제 생성 Prompt에 Brain을 명시적으로 전달
    const selectedBrain = getBrainConfig(product.mainCategory, product.subCategory, product.name);
    const brainConfigBlock = selectedBrain ? `
[Selected Product Type Brain - ${selectedBrain.name}]

핵심 요소: ${selectedBrain.keyElements?.join(", ") || "제품 특징"}

설득 포인트:
${selectedBrain.persuasionPoints?.map((p, idx) => `${idx + 1}. ${p.label} (${p.score}%)`).join("\n") || ""}

Brain Story Flow:
${selectedBrain.storyFlow?.map((step, idx) => `${idx + 1}. ${step}`).join("\n") || ""}

Writing Rules:
${selectedBrain.writingRules?.map(rule => `- ${rule}`).join("\n") || ""}

Example Sentences:
${selectedBrain.exampleSentences?.map(sentence => `- ${sentence}`).join("\n") || ""}

Forbidden Words:
${selectedBrain.forbiddenWords?.join(", ") || ""}

Copy Tone: ${selectedBrain.copyTone || "자연스러운 커머스 톤"}
` : "";


    let phase = "상세페이지 생성";
    try {
      const categoryConstraint = buildGenerationConstraint(product.category);

      // 템플릿 정보 추가
      const templateInfo = selectedTemplate 
        ? `

[추천 템플릿]
템플릿: ${TEMPLATES.find(t => t.id === selectedTemplate)?.label || selectedTemplate}
설명: ${TEMPLATES.find(t => t.id === selectedTemplate)?.desc || ""}`
        : "";

      // ============================================================
      // V8 Phase 2: 2단계 생성 프로세스 (분석 → 글쓰기)
      // ============================================================
      
      // STEP 1: 제품 분석 (AI가 제품을 깊이 있게 이해)
      phase = "제품 분석";
      setStage(1);
      const analysisPrompt = buildProductAnalysisPrompt(product);
      const analysisResult = await callClaude(analysisPrompt, 2500, { product: { ...product, pageDesign }, pageDesign }, "analysis");
      let analysis;
      try {
        analysis = typeof analysisResult === "string" ? JSON.parse(analysisResult) : analysisResult;
        if (!analysis || typeof analysis !== "object") throw new Error("분석 결과가 객체가 아닙니다.");
      } catch (e) {
        console.warn("제품 분석 파싱 실패, 기본값 사용:", e.message);
        analysis = {
          coreValue: product.benefits || "핵심 가치",
          customerPsychology: "제품을 찾는 고객",
          topCuriosity: ["원료", "품질", "효과"],
          differentiation: "차별화 포인트",
          optimalSequence: [],
          salesStrategy: "기본 판매 전략",
          emotionalJourney: "고객의 감정 변화",
          keyMessages: [],
          avoidMessages: []
        };
      }
      
      // STEP 2: 분석 결과를 기반으로 상세페이지 생성
      phase = "상세페이지 생성";
      setStage(2);
      const generationProduct = { ...product, pageDesign };
      const genPrompt = buildDetailPageGenerationPrompt(generationProduct, analysis);
      const genResult = await callClaude(genPrompt, 4000, { product: generationProduct, pageDesign }, "generation");
      const finalContent = genResult;
      setDraft(finalContent);
      phase = "컴플라이언스 체크";

      const complianceRules = `1.질병 예방치료 효능암시 2.의약품 오인 3.건기식 아닌것을 건기식으로 오인 4.거짓과장표현(수치 의미가 불명확한 경우 포함) 5.소비자 기만 6.타업체 비방/근거없는 부당비교(직접 언급이 없어도 "시중 제품", "다른 제품과 출발점이 다르다", "포장만 그럴싸한 제품" 같은 은근한 비교·비하도 포함) 7.사행심조장 8.상호상표오인 9.암묵적 효능암시(직접 언급 없이도 특정 수치/질환을 연상시키거나, "좋다/도움/습관" 같은 단어로 효능을 암시하는 경우)`;
      const complianceFocus = buildComplianceFocus(product.category);

      async function checkCompliance(content) {
        return callClaude(`아래 상세페이지 콘텐츠를 건강기능식품 표시·광고 규정(식품 등의 표시·광고에 관한 법률 제8조) 관점에서 검토하세요.
${JSON.stringify(content)}

제품 카테고리: ${product.category}

[체크 규칙]
${complianceRules}

[이 카테고리에서 특히 주의해서 볼 부분]
${complianceFocus}

각 항목의 suggested_revision은 1문장 이내로 간결하게 쓰세요.

반드시 아래 JSON 형식으로만 답하세요.
{"flags": [{"field": "string", "flagged_text": "string", "violation_type": "string", "risk_level": "high/medium/low", "suggested_revision": "string"}], "overall_status": "pass/needs_review"}`, 3000, { product }, "compliance");
      }

      let currentContent = finalContent;
      let complianceResult = await checkCompliance(currentContent);
      let attempts = 0;

      while (complianceResult.overall_status === "needs_review" && complianceResult.flags?.length > 0 && attempts < 1) {
        setStage(3);
        currentContent = await callClaude(`아래 상세페이지 콘텐츠에서, 명시된 리스크 항목들을 모두 제안된 방향으로 수정하세요. 리스크와 무관한 나머지 내용과 톤은 최대한 그대로 유지하세요.

원본 콘텐츠: ${JSON.stringify(currentContent)}

수정해야 할 리스크 목록: ${JSON.stringify(complianceResult.flags)}

[전체 규정 - 수정 시 새로운 위반이 생기지 않도록 참고]
${complianceRules}

제품 카테고리 제약: ${categoryConstraint}${numericGuidance}

반드시 원본과 동일한 JSON 구조로 전체 콘텐츠를 반환하세요. 설명 없이 JSON만.
{"hero_headline": "string", "hero_subcopy": "string", "sections": [{"type": "problem", "title": "string", "body": "string"}, {"type": "solution", "title": "string", "body": "string"}, {"type": "objection_handling", "title": "string", "body": "string"}, {"type": "benefit_list", "items": ["string"]}, {"type": "how_to_use", "body": "string"}, {"type": "trust_badges", "items": ["string"]}]}`, 2500, { product }, "remediation");
        setDraft(currentContent);
        complianceResult = await checkCompliance(currentContent);
        attempts += 1;
      }
      setCompliance(complianceResult);
      setStage(4);
    } catch (e) {
      setError(`오류 발생 (${phase} 단계): ${e.message}`);
      setStage(-1);
    }
  }

  async function regenerateSection(idx, feedback = "") {
    if (!draft) return;
    setRegenIndex(idx);
    try {
      const target = idx === "hero" ? { hero_headline: draft.hero_headline, hero_subcopy: draft.hero_subcopy } : draft.sections[idx];
      const categoryConstraint = buildGenerationConstraint(product.category);
      const feedbackLine = feedback
        ? `

[사용자 수정 요청] 다음 요청을 반드시 반영해서 다시 쓰세요: "${feedback}"`
        : "";
      const result = await callClaude(`아래는 상세페이지의 나머지 확정된 콘텐츠입니다. 이 톤과 맥락을 유지하면서, 지정된 필드만 다시 작성하세요.

전체 콘텐츠: ${JSON.stringify(draft)}

다시 작성할 대상: ${JSON.stringify(target)}

제품 카테고리 제약: ${categoryConstraint}${feedbackLine}

반드시 대상과 동일한 JSON 구조로만, 새로 작성된 내용을 반환하세요. 설명 없이 JSON만.`, 1200);
      if (idx === "hero") {
        setDraft((d) => ({ ...d, hero_headline: result.hero_headline, hero_subcopy: result.hero_subcopy }));
      } else {
        setDraft((d) => {
          const sections = [...d.sections];
          sections[idx] = { ...sections[idx], ...result };
          return { ...d, sections };
        });
      }
    } catch (e) {
      setError("재생성 중 오류: " + e.message);
    } finally {
      setRegenIndex(null);
    }
  }

  const conceptStyle = {
    minimal: {
      radius: "4px",
      shadow: "none",
      border: "1px solid #E3E1DA",
      headFont: '"Pretendard", "Apple SD Gothic Neo", sans-serif',
      headWeight: 700,
      sectionGap: 14,
      labelStyle: "line", // 라벨 아래 짧은 밑줄
      highlightBg: "#F7F6F1",
      highlightBorder: `2px solid ${themeColor}`,
      badgeStyle: "outline",
      divider: true,
    },
    warm: {
      radius: "18px",
      shadow: "0 4px 16px rgba(0,0,0,0.06)",
      border: "none",
      headFont: '"Pretendard", "Apple SD Gothic Neo", sans-serif',
      headWeight: 700,
      sectionGap: 18,
      labelStyle: "pill", // 라벨을 둥근 알약 형태로
      highlightBg: `${themeColor}12`,
      highlightBorder: "none",
      badgeStyle: "soft",
      divider: false,
    },
    premium: {
      radius: "2px",
      shadow: "0 2px 0 rgba(0,0,0,0.08)",
      border: "1px solid rgba(0,0,0,0.08)",
      headFont: '"Noto Serif KR", serif',
      headWeight: 800,
      sectionGap: 16,
      labelStyle: "caps", // 대문자 레터스페이싱 강조
      highlightBg: "#1F2A24",
      highlightBorder: "none",
      badgeStyle: "dark",
      divider: true,
    },
    natural: {
      radius: "12px",
      shadow: "0 2px 10px rgba(90,110,80,0.08)",
      border: "1px solid #E4E7DE",
      headFont: '"Nanum Myeongjo", serif',
      headWeight: 700,
      sectionGap: 16,
      labelStyle: "pill",
      highlightBg: "#F1F4EC",
      highlightBorder: "none",
      badgeStyle: "soft",
      divider: false,
      pageBg: "#F5F6F0",
    },
    bold: {
      radius: "14px",
      shadow: "0 6px 0 rgba(0,0,0,0.08)",
      border: "2px solid #1F2A24",
      headFont: '"Do Hyeon", sans-serif',
      headWeight: 800,
      sectionGap: 20,
      labelStyle: "pill",
      highlightBg: `${themeColor}18`,
      highlightBorder: `3px solid ${themeColor}`,
      badgeStyle: "soft",
      divider: false,
    },
    editorial: {
      radius: "0px",
      shadow: "none",
      border: "none",
      headFont: '"Song Myung", serif',
      headWeight: 700,
      sectionGap: 26,
      labelStyle: "caps",
      highlightBg: "#FAF8F3",
      highlightBorder: "none",
      badgeStyle: "outline",
      divider: true,
      pageBg: "#FBFAF6",
    },
  }[concept];

  // 사용자가 고른 폰트를 컨셉 스타일 위에 덮어쓴다 (헤딩=headingFamily).
  // 포인트 컬러가 있으면 강조 요소 색도 갈아끼운다.
  conceptStyle.headFont = headingFamily;
  if (pointColors.length > 0) {
    conceptStyle.highlightBorder =
      concept === "minimal" ? `2px solid ${accent2}` : conceptStyle.highlightBorder;
    if (concept === "warm") conceptStyle.highlightBg = `${accent2}12`;
  }

  const canGenerate = product.name && !isGenerating;

  function resetAll() {
    setStage(-1);
    setAnalysis(null);
    setDraft(null);
    setCompliance(null);
    setError("");
  }

  function copyResult() {
    if (!draft) return;
    const lines = [draft.hero_headline, draft.hero_subcopy, ""];
    draft.sections?.forEach((s) => {
      if (s.title) lines.push(s.title);
      if (s.body) lines.push(s.body);
      if (s.items) lines.push(...normalizeSectionItems(s.items).map((it) => "- " + it));
      lines.push("");
    });
    navigator.clipboard.writeText(lines.join("\n")).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  }

  // 미리보기와 동일한 디자인(테마 컬러·컨셉 반영)의 독립 실행 HTML 문서를 생성
  function buildHtmlDocument() {
    if (!draft) return "";
    const esc = (s) =>
      String(s ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
    const cs = conceptStyle;

    const sectionsHtml = (draft.sections || [])
      .map((s, i) => {
        const label = sectionLabel(s.type);
        const num = String(i + 1).padStart(2, "0");
        const title = s.title ? `<h2 class="sec-title">${emphasizeHtmlText(s.title, accent1)}</h2>` : "";
        const body = s.body ? `<p class="sec-body">${emphasizeHtmlText(s.body, accent1)}</p>` : "";
        const isHighlight = s.type === "benefit_list" || s.type === "solution";
        const isBadges = s.type === "trust_badges";
        const isList = s.type === "benefit_list";
        let items = "";
        if (s.items && isBadges) {
          items = `<div class="badges">${normalizeSectionItems(s.items).map((it) => `<span class="badge">${emphasizeHtmlText(it, accent1)}</span>`).join("")}</div>`;
        } else if (s.items && isList) {
          items = `<div class="benefit-rows">${normalizeSectionItems(s.items)
            .map((it) => `<div class="benefit-row"><span class="benefit-tick">—</span><span>${emphasizeHtmlText(it, accent1)}</span></div>`)
            .join("")}</div>`;
        } else if (s.items) {
          items = `<ul class="sec-list">${normalizeSectionItems(s.items).map((it) => `<li>${emphasizeHtmlText(it, accent1)}</li>`).join("")}</ul>`;
        }
        const cls = isHighlight ? "card highlight" : "card";
        return `<section class="${cls}">
  <div class="sec-head"><span class="sec-num">${num}</span><span class="sec-label">${esc(label)}</span></div>
  ${title}
  ${body}
  ${items}
</section>`;
      })
      .join("\n");

    const imgHtml = image
      ? `<img class="hero-img" src="${image}" alt="${esc(draft.hero_headline)}" />`
      : "";

    const overline = product.name ? `<div class="hero-overline">${esc(product.name)}</div>` : "";

    // 선택한 폰트의 구글폰트 로드 링크
    const fontsUrl = buildGoogleFontsUrl([headingFont, bodyFont]);
    const fontLink = fontsUrl ? `<link rel="stylesheet" href="${fontsUrl}" />` : "";

    // 강조 박스: conceptStyle의 highlightBg를 그대로 사용 (다크 박스면 흰 텍스트)
    const isDarkHi = cs.highlightBg === "#1F2A24";
    const highlightBg = cs.highlightBg;
    const highlightText = isDarkHi ? "#EDEBE4" : "#4A4940";
    const highlightTitle = isDarkHi ? "#ffffff" : "#1F2A24";
    const highlightBorderLeft =
      cs.highlightBorder && cs.highlightBorder !== "none" ? `border-left: ${cs.highlightBorder};` : "";
    // 배지 스타일 (badgeStyle 토큰 기반)
    const badgeCss =
      cs.badgeStyle === "dark"
        ? `background:#1F2A24;color:#fff;border-radius:4px;`
        : cs.badgeStyle === "soft"
        ? `background:${accent1}1A;color:${accent1};border-radius:999px;`
        : `background:transparent;color:${accent1};border:1px solid ${accent1};border-radius:4px;`;
    const pageBg = cs.pageBg || "#F8F5EF";

    return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(draft.hero_headline)}</title>
${fontLink}
<style>
  * { box-sizing: border-box; }
  body {
    margin: 0;
    background: radial-gradient(circle at top, #fff 0, ${pageBg} 36%, #EEECE4 100%);
    font-family: ${bodyFamily};
    color: #1F2A24;
    padding: 48px 18px;
  }
  .wrap { max-width: 680px; margin: 0 auto; }
  .hero {
    position: relative;
    overflow: hidden;
    background: linear-gradient(135deg, #FFFFFF 0%, #FBFAF6 68%, ${esc(accent1)}12 100%);
    border-radius: ${cs.radius};
    box-shadow: 0 18px 50px rgba(31,42,36,0.10);
    border: 1px solid rgba(31,42,36,0.08);
    padding: 58px 50px 54px;
    margin-bottom: 44px;
  }
  .hero:before {
    content: "";
    position: absolute;
    top: 0; left: 50px; right: 50px;
    height: 1px;
    background: linear-gradient(90deg, transparent, ${esc(accent1)}66, transparent);
  }
  .hero-img { width: 100%; height: 250px; object-fit: cover; border-radius: ${cs.radius}; margin-bottom: 32px; filter: saturate(.95) contrast(1.02); }
  .hero-overline { font-size: 10px; font-weight: 800; letter-spacing: 2.8px; text-transform: uppercase; color: ${esc(accent1)}; margin-bottom: 18px; }
  .hero-headline { font-family: ${headingFamily}; font-weight: ${cs.headWeight}; font-size: 40px; line-height: 1.18; letter-spacing: -0.035em; margin: 0 0 22px; max-width: 560px; }
  .hero-rule { width: 72px; height: 1px; background: ${esc(accent1)}; margin: 0 0 22px; opacity: .8; }
  .hero-sub { font-size: 16px; color: #5D5B52; line-height: 1.85; margin: 0; max-width: 560px; letter-spacing: -0.01em; }
  .card {
    position: relative;
    background: transparent;
    border-radius: 0;
    box-shadow: none;
    border: 0;
    border-top: 1px solid rgba(31,42,36,0.12);
    padding: 34px 4px 38px 92px;
    margin-bottom: 8px;
  }
  .card.highlight {
    background: ${highlightBg};
    border-top: none;
    border-radius: ${cs.radius};
    padding: 34px 38px 36px 98px;
    margin: 24px 0 28px;
    box-shadow: 0 14px 34px rgba(31,42,36,0.07);
    ${highlightBorderLeft}
  }
  .card.highlight .sec-body, .card.highlight .sec-list, .card.highlight .benefit-row { color: ${highlightText}; }
  .card.highlight .sec-title { color: ${highlightTitle}; }
  .sec-head { display: flex; align-items: baseline; gap: 10px; margin-bottom: 14px; }
  .sec-num { position: absolute; left: 4px; top: 26px; font-family: ${headingFamily}; font-size: 34px; font-weight: 700; color: ${esc(accent1)}; opacity: .18; letter-spacing: -0.04em; }
  .card.highlight .sec-num { left: 34px; top: 30px; opacity: .28; }
  .sec-label { font-size: 10.5px; font-weight: 800; color: ${esc(accent1)}; text-transform: uppercase; letter-spacing: 1.5px; }
  .sec-title { font-family: ${headingFamily}; font-weight: ${cs.headWeight}; font-size: 23px; line-height: 1.35; margin: 0 0 14px; letter-spacing: -0.025em; }
  .sec-body { font-size: 15px; color: #4A4940; line-height: 1.9; margin: 0; letter-spacing: -0.01em; }
  .sec-list { margin: 0; padding-left: 19px; font-size: 15px; color: #4A4940; line-height: 1.9; }
  .benefit-rows { display: flex; flex-direction: column; gap: 12px; }
  .benefit-row { display: flex; align-items: flex-start; gap: 12px; font-size: 15px; color: #4A4940; line-height: 1.75; }
  .benefit-tick { color: ${esc(accent1)}; font-weight: 800; }
  .badges { display: flex; flex-wrap: wrap; gap: 9px; margin-top: 6px; }
  .badge { display: inline-block; font-size: 12px; font-weight: 700; padding: 7px 13px; ${badgeCss} }
  .num-em { color: ${esc(accent1)}; font-weight: 900; font-size: 1.12em; letter-spacing: -0.03em; }
</style>
</head>
<body>
  <div class="wrap">
    <div class="hero">
      ${imgHtml}
      ${overline}
      <h1 class="hero-headline">${emphasizeHtmlText(draft.hero_headline, accent1)}</h1>
      <div class="hero-rule"></div>
      <p class="hero-sub">${emphasizeHtmlText(draft.hero_subcopy, accent1)}</p>
    </div>
    ${sectionsHtml}
  </div>
</body>
</html>`;
  }

  function downloadHtml() {
    const html = buildHtmlDocument();
    if (!html) return;
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const safeName = (product.name || "detail-page").replace(/[^\w가-힣-]+/g, "_");
    a.href = url;
    a.download = `${safeName}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function copyHtml() {
    const html = buildHtmlDocument();
    if (!html) return;
    navigator.clipboard.writeText(html).then(() => {
      setHtmlCopied(true);
      setTimeout(() => setHtmlCopied(false), 1800);
    });
  }

  return (
    <div style={{ fontFamily: '"Pretendard", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif', background: "#F8F5EF", minHeight: "100%", color: "#26231F" }}>
      <div className="app-grid" style={{ display: "grid", gridTemplateColumns: draft ? "168px 1fr" : "168px 390px minmax(720px, 1fr)", minHeight: "100vh" }}>
        <aside className="brand-sidebar" style={{ background: "#FBFAF7", borderRight: "1px solid #E8E1D7", padding: "26px 22px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontFamily: '"Noto Serif KR", serif', fontSize: 18, lineHeight: 1.12, fontWeight: 800, letterSpacing: "0.03em", color: "#2A241C", marginBottom: 36 }}>
              ✦ BRAND<br />ENGINE
            </div>
            <nav style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {["상세페이지 생성", "내 프로젝트", "템플릿", "가이드", "설정"].map((item, idx) => {
                const isActive = (idx === 0 && viewMode === "main") || (idx === 1 && viewMode === "projects") || (idx === 2 && viewMode === "templates");
                const isClickable = idx === 0 || idx === 1 || idx === 2;
                return (
                  <div
                    key={item}
                    onClick={() => {
                      if (idx === 0) setViewMode("main");
                      else if (idx === 1) handleOpenProjects();
                      else if (idx === 2) handleOpenTemplates();
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "11px 10px",
                      borderRadius: 10,
                      background: isActive ? "#FFFFFF" : "transparent",
                      boxShadow: isActive ? "0 10px 24px rgba(47,38,28,0.06)" : "none",
                      color: isActive ? "#9A672E" : "#6D665E",
                      fontSize: 13,
                      fontWeight: isActive ? 800 : 600,
                      cursor: isClickable ? "pointer" : "default",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <span
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: 6,
                        border: `1px solid ${isActive ? "#B8874D" : "#D8D0C5"}`,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 10,
                      }}
                    >
                      {isActive ? "✧" : ""}
                    </span>
                    {item}
                  </div>
                );
              })}
            </nav>
          </div>
          <div style={{ color: "#7B7268", fontSize: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}><span style={{ width: 26, height: 26, borderRadius: "50%", background: "#F0E8DD", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "#8B6A47", fontWeight: 800 }}>M</span>마이계정</div>
            <div style={{ marginBottom: 32 }}>로그아웃</div>
            <div style={{ opacity: 0.55 }}>© 2026 Brand Engine</div>
          </div>
        </aside>

        {/* CONDITIONAL RENDERING: viewMode 기반 화면 전환 */}
        {viewMode === "main" ? (
          <>
            {/* LEFT: input rail - 생성 완료 후 숨김 */}
            {!draft && (
            <div style={{ background: "#FFFEFB", color: "#26231F", padding: "28px 30px", display: "flex", flexDirection: "column", gap: 18, borderRight: "1px solid #E8E1D7", overflowY: "auto" }}>
              <div style={{ paddingBottom: 8, borderBottom: "1px solid #EEE7DD" }}>
                <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: "-0.04em", marginBottom: 5 }}>1. 제품 정보 입력</div>
                <div style={{ fontSize: 12.5, color: "#8B8175" }}>정확한 정보를 입력할수록 더 좋은 결과가 생성됩니다.</div>
              </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "2px 0 4px" }}>
            {["입력", "생성 중", "완료"].map((s, i) => (
              <div key={s} style={{ display: "flex", alignItems: "center", gap: 8, color: i === 0 ? "#9A672E" : "#B9B0A5", fontSize: 12, fontWeight: 700 }}>
                <span style={{ width: 22, height: 22, borderRadius: "50%", background: i === 0 ? "#9A672E" : "#EFEAE2", color: i === 0 ? "#fff" : "#8B8175", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 11 }}>{i + 1}</span>{s}
              </div>
            ))}
          </div>
          <div style={{ fontSize: 13.5, fontWeight: 800, color: "#5F4B36", marginTop: 6 }}>기본 정보</div>

          <Field label="제품명 *">
            <input style={inputStyle} disabled={isGenerating} value={product.name} onChange={(e) => update("name", e.target.value)} placeholder="예: 식물성 베르베린 88" />
          </Field>

          <Field label="카테고리 *">
            <div style={{ display: "flex", gap: 8, flexDirection: "column" }}>
              {/* 1차 카테고리 (주 분류) */}
              <select
                value={product.mainCategory}
                onChange={(e) => {
                  const main = e.target.value;
                  const subs = CATEGORY_TREE[main];
                  const sub = product.subCategory && subs.includes(product.subCategory) 
                    ? product.subCategory 
                    : subs[0];
                  updateProductCategory(main, sub);
                }}
                disabled={isGenerating}
                style={{
                  ...inputStyle,
                  flex: 1,
                  padding: "9px 10px",
                  fontSize: 13,
                  fontWeight: 500,
                }}
              >
                {Object.keys(CATEGORY_TREE).map((main) => (
                  <option key={main} value={main}>
                    {main}
                  </option>
                ))}
              </select>

              {/* 2차 카테고리 (세부 분류) */}
              <select
                value={product.subCategory}
                onChange={(e) => updateProductCategory(product.mainCategory, e.target.value)}
                disabled={isGenerating}
                style={{
                  ...inputStyle,
                  flex: 1,
                  padding: "9px 10px",
                  fontSize: 13,
                  fontWeight: 500,
                }}
              >
                {CATEGORY_TREE[product.mainCategory]?.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
              {product.mainCategory === "건강·영양식품" && (
                <div style={{ padding: "9px 10px", borderRadius: 9, background: product.subCategory === "건강기능식품" ? "#EEF5EA" : "#FFF8EA", color: "#6F665C", fontSize: 11.2, lineHeight: 1.5, border: "1px solid #E9E0D4" }}>
                  {product.subCategory === "건강기능식품"
                    ? "건강기능식품: 제품에 표시된 식약처 인정 기능성 범위 안에서만 작성합니다."
                    : "일반 건강식품: 기능성을 주장하지 않고 원료·배합·품질·섭취 정보를 중심으로 작성합니다."}
                </div>
              )}
            </div>
          </Field>

          <div style={{ height: 1, background: "#EEE7DD", margin: "4px 0 2px" }} />
          <div style={{ fontSize: 13.5, fontWeight: 800, color: "#5F4B36" }}>타깃 고객</div>

          <Field label="타깃 고객 (선택)">
            <textarea style={{ ...inputStyle, height: 56, resize: "vertical" }} disabled={isGenerating} value={product.target} onChange={(e) => update("target", e.target.value)} placeholder="예) 30대 여성, 부모님 선물용, 프리미엄 식품을 찾는 고객" />
          </Field>

          <Field label="핵심 장점 (선택)">
            <textarea style={{ ...inputStyle, height: 56, resize: "vertical" }} disabled={isGenerating} value={product.benefits} onChange={(e) => update("benefits", e.target.value)} placeholder="비워도 생성 가능해요. 예: 아삭함, 산지직송, 선물용" />
          </Field>

          <Field label="인증정보 (선택)">
            <input style={inputStyle} disabled={isGenerating} value={product.certs} onChange={(e) => update("certs", e.target.value)} placeholder="예: HACCP, 특허번호" />
          </Field>

          <Field label="핵심 원료명 (선택 — 수치 표현 정확도를 위해 추천)">
            <input style={inputStyle} disabled={isGenerating} value={product.ingredientName} onChange={(e) => update("ingredientName", e.target.value)} placeholder="예: 베르베린 복합물" />
          </Field>

          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ flex: 1 }}>
              <Field label="원료 순도 (%, 선택)">
                <input style={inputStyle} disabled={isGenerating} value={product.purity} onChange={(e) => update("purity", e.target.value)} placeholder="예: 88.1" />
              </Field>
            </div>
            <div style={{ flex: 1 }}>
              <Field label="1일 섭취량 기준 실제 함량 (mg, 선택)">
                <input style={inputStyle} disabled={isGenerating} value={product.actualAmount} onChange={(e) => update("actualAmount", e.target.value)} placeholder="예: 500" />
              </Field>
            </div>
          </div>
          {product.actualAmount && (
            <Field label="위 mg 수치는 무엇 기준인가요?">
              <div style={{ display: "flex", gap: 8 }}>
                {["원료 총중량", "핵심 활성성분"].map((b) => (
                  <button
                    key={b}
                    onClick={() => update("amountBasis", b)}
                    disabled={isGenerating}
                    style={{
                      flex: 1,
                      padding: "7px 8px",
                      borderRadius: 8,
                      border: product.amountBasis === b ? `1.5px solid ${themeColor}` : "1px solid #E1D8CB",
                      background: product.amountBasis === b ? "#F4EEE5" : "#FFFFFF",
                      color: "#2B2925",
                      fontSize: 12,
                      cursor: "pointer",
                    }}
                  >
                    {b}
                  </button>
                ))}
              </div>
              <div style={{ fontSize: 10.5, opacity: 0.5, marginTop: 4 }}>
                예: 오메가3에서 "정제어유 1000mg"은 원료 총중량, "EPA+DHA 1000mg"은 핵심 활성성분이에요.
              </div>
            </Field>
          )}
          <div style={{ fontSize: 11, opacity: 0.5, marginTop: -10 }}>
            두 값 중 하나라도 채우면, 상세페이지에 "순도 vs 실제 함량" 혼동 없이 정확하게 표기돼요.
          </div>

          {(() => {
            const omegaKeywords = ["오메가", "omega", "epa", "dha", "어유", "정제어유", "피쉬오일", "fish oil"];
            const hay = `${product.name} ${product.ingredientName} ${product.benefits}`.toLowerCase();
            const isOmega = omegaKeywords.some((k) => hay.includes(k.toLowerCase()));
            return isOmega;
          })() && (
            <div>
              <div style={{ fontSize: 11.5, opacity: 0.6, marginBottom: 6 }}>
                EPA / DHA 개별 함량 (mg, 선택 — 오메가3 제품인 경우)
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  style={{ ...inputStyle, flex: 1 }}
                  disabled={isGenerating}
                  value={product.epa}
                  onChange={(e) => update("epa", e.target.value)}
                  placeholder="EPA mg (예: 480)"
                />
                <input
                  style={{ ...inputStyle, flex: 1 }}
                  disabled={isGenerating}
                  value={product.dha}
                  onChange={(e) => update("dha", e.target.value)}
                  placeholder="DHA mg (예: 360)"
                />
              </div>
              <div style={{ fontSize: 10.5, opacity: 0.5, marginTop: 4 }}>
                입력하면 상세페이지에 실제 수치로 표기돼요. 없으면 "성분표 참조"로만 안내해요.
              </div>
            </div>
          )}

          <Field label="제품 사진 (선택)">
            {image ? (
              <div style={{ position: "relative" }}>
                <img src={image} alt="product" style={{ width: "100%", height: 120, objectFit: "cover", borderRadius: 8 }} />
                <button onClick={() => setImage(null)} style={{ position: "absolute", top: 6, right: 6, background: "rgba(0,0,0,0.6)", border: "none", borderRadius: 6, padding: 4, color: "#fff", cursor: "pointer" }}>
                  <X size={14} />
                </button>
              </div>
            ) : (
              <button onClick={() => fileInputRef.current?.click()} style={{ ...inputStyle, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, cursor: "pointer", color: "#8B8175" }}>
                <ImageIcon size={15} /> 사진 업로드
              </button>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImage} style={{ display: "none" }} />
          </Field>

          <div style={{ height: 1, background: "#EEE7DD", margin: "4px 0 2px" }} />
          <div style={{ fontSize: 13.5, fontWeight: 800, color: "#5F4B36" }}>디자인 선호도</div>

          <Field label="메인 컬러">
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {PRESET_COLORS.map((c) => (
                <button key={c} onClick={() => setThemeColor(c)} style={{ width: 28, height: 28, borderRadius: "50%", background: c, border: themeColor === c ? "2px solid #F4F3EE" : "2px solid transparent", outline: themeColor === c ? `2px solid ${c}` : "none", cursor: "pointer" }} />
              ))}
              <input type="color" value={themeColor} onChange={(e) => setThemeColor(e.target.value)} style={{ width: 28, height: 28, border: "none", background: "none", cursor: "pointer" }} />
            </div>
          </Field>

          <Field label={`포인트 컬러 (최대 2개, ${pointColors.length}/2 선택됨)`}>
            {/* 선택된 포인트 컬러: 칩 형태로 위에 표시 + X로 개별 취소 */}
            {pointColors.length > 0 && (
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
                {pointColors.map((c, i) => (
                  <div
                    key={c}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "3px 6px 3px 8px",
                      borderRadius: 999,
                      background: "#F4EEE5",
                      fontSize: 11,
                    }}
                  >
                    <span style={{ width: 12, height: 12, borderRadius: "50%", background: c, display: "inline-block" }} />
                    <span style={{ opacity: 0.8 }}>{i === 0 ? "포인트1" : "포인트2"}</span>
                    <button
                      onClick={() => togglePointColor(c)}
                      title="이 포인트 컬러 취소"
                      style={{
                        display: "flex",
                        border: "none",
                        background: "#E8E1D7",
                        borderRadius: "50%",
                        width: 16,
                        height: 16,
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#8B6A47",
                        cursor: "pointer",
                        padding: 0,
                      }}
                    >
                      <X size={10} />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => setPointColors([])}
                  style={{
                    border: "none",
                    background: "transparent",
                    color: "#9D9183",
                    fontSize: 11,
                    cursor: "pointer",
                    textDecoration: "underline",
                  }}
                >
                  전체 해제
                </button>
              </div>
            )}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {POINT_COLORS.map((c) => {
                const selected = pointColors.includes(c);
                const order = pointColors.indexOf(c) + 1;
                return (
                  <button
                    key={c}
                    onClick={() => togglePointColor(c)}
                    title={selected ? `포인트 ${order} — 클릭하면 취소` : "포인트 컬러 추가"}
                    style={{
                      position: "relative",
                      width: 28,
                      height: 28,
                      borderRadius: 7,
                      background: c,
                      border: selected ? "2px solid #F4F3EE" : "2px solid transparent",
                      outline: selected ? `2px solid ${c}` : "none",
                      cursor: "pointer",
                      color: "#fff",
                      fontSize: 12,
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {selected ? <X size={14} strokeWidth={3} /> : ""}
                  </button>
                );
              })}
              <input
                type="color"
                title="직접 포인트 컬러 추가"
                onChange={(e) => togglePointColor(e.target.value)}
                style={{ width: 28, height: 28, border: "none", background: "none", cursor: "pointer" }}
              />
            </div>
            <div style={{ fontSize: 10.5, opacity: 0.5, marginTop: 4 }}>
              라벨·인증배지엔 포인트1, 강조 박스엔 포인트2 컬러가 쓰여요. 선택된 색을 다시 누르면 취소돼요.
            </div>
          </Field>

          <Field label="제목 폰트">
            <FontPicker value={headingFont} onChange={setHeadingFont} themeColor={themeColor} />
          </Field>

          <Field label="본문 폰트">
            <FontPicker value={bodyFont} onChange={setBodyFont} themeColor={themeColor} />
          </Field>

          <Field label="추가 요청사항 (선택)">
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ fontSize: 11.5, color: "#6F665C", lineHeight: 1.45 }}>
                AI가 상세페이지를 설계할 때 반드시 반영했으면 하는 내용을 자유롭게 입력해주세요.
              </div>
              <textarea
                value={additionalRequest}
                onChange={(e) => setAdditionalRequest(e.target.value)}
                placeholder={`예)
• 인도산 원료를 강조해주세요.
• 시험성적서는 마지막에 넣어주세요.
• 브랜드 스토리를 포함해주세요.`}
                rows={5}
                disabled={isGenerating}
                style={{
                  width: "100%",
                  minHeight: 104,
                  resize: "vertical",
                  border: `1.5px solid ${additionalRequest ? themeColor : "#E7DED3"}`,
                  borderRadius: 10,
                  background: isGenerating ? "#F7F4EE" : "#FFFFFF",
                  color: "#2B2925",
                  padding: "11px 12px",
                  fontSize: 12.5,
                  lineHeight: 1.55,
                  outline: "none",
                  fontFamily: bodyFamily,
                }}
              />
            </div>
          </Field>

          <button
            onClick={runPipeline}
            disabled={!canGenerate}
            style={{
              marginTop: 8,
              padding: "12px 16px",
              borderRadius: 10,
              border: "none",
              background: canGenerate ? themeColor : "#E8E1D7",
              color: "#fff",
              fontWeight: 700,
              fontSize: 14,
              cursor: canGenerate ? "pointer" : "not-allowed",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            {stage >= 0 && stage < 4 ? <Loader2 size={16} className="spin" /> : <Sparkles size={16} />}
            {stage >= 0 && stage < 4 ? "생성 중..." : showPageDesign ? "다시 설계하기" : "🎨 AI 상세페이지 설계"}
          </button>

          {stage >= 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
              {STAGE_LABELS.map((label, i) => {
                // i=0: 생성(stage 0~1), i=1: 컴플라이언스(stage 2~3), 완료 stage 4
                const stepDone = stage >= 4 || stage > (i === 0 ? 1 : 3);
                const stepActive = i === 0 ? stage <= 1 : stage >= 2 && stage < 4;
                return (
                  <div key={label} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, opacity: stepDone || stepActive ? 1 : 0.4 }}>
                    {stepDone ? <CheckCircle2 size={14} color={themeColor} /> : stepActive ? <Loader2 size={14} className="spin" /> : <Circle size={14} />}
                    {label}
                  </div>
                );
              })}
              {getKeywordChips(product).length > 0 && (
                <div style={{ marginTop: 18, padding: "22px 28px", borderTop: "1px solid #E6DED2", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                  <span style={{ fontFamily: conceptStyle.headFont, fontSize: 24, color: accent1, opacity: 0.35, fontWeight: 700 }}>03</span>
                  <span style={{ fontSize: 13, fontWeight: 800, color: "#4C4339", marginRight: 4 }}>주요 키워드</span>
                  {getKeywordChips(product).map((kw) => (
                    <span key={kw} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 999, border: "1px solid #E3D9CC", background: "rgba(255,255,255,0.62)", color: "#8B5E2C", fontSize: 12.5, fontWeight: 700 }}>
                      <Sparkles size={12} /> {kw}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
          {error && <div style={{ fontSize: 12, color: "#E8998D" }}>{error}</div>}
        </div>

        )}

        {/* RIGHT: preview / results */}
        <div style={{ padding: "30px 40px 48px", overflowY: "auto", background: "linear-gradient(180deg, #F8F5EF 0%, #F3EDE4 100%)" }}>

          {/* AI 상세페이지 설계 - 오른쪽 즉시 미리보기 */}
          {(showPageDesign && pageDesign && !draft) || (viewMode === "templates" && pageDesign && selectedTemplate) ? (
            <div style={{ maxWidth: 1080, margin: "0 auto 28px", display: "flex", flexDirection: "column", gap: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 18, flexWrap: "wrap" }}>
                <div>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 10px", borderRadius: 999, background: viewMode === "templates" ? "#E8D5BC" : "#F2E8DA", color: viewMode === "templates" ? "#8B5E2C" : "#9A672E", fontSize: 11, fontWeight: 900, letterSpacing: "0.04em", marginBottom: 12 }}>
                    {viewMode === "templates" ? "TEMPLATE PREVIEW" : "AI PAGE PLAN"}
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 950, color: "#241F19", letterSpacing: "-0.055em", marginBottom: 6 }}>
                    {viewMode === "templates" ? "📋 템플릿 미리보기" : "🧠 제품 분석 & 판매 전략"}
                  </div>
                  <div style={{ fontSize: 13.5, color: "#8B8175", lineHeight: 1.6 }}>
                    {viewMode === "templates" 
                      ? `선택된 템플릿 '${DESIGN_TEMPLATES.find(t => t.id === selectedTemplate)?.label || ""}' 스타일로 상세페이지가 표현됩니다.`
                      : "AI가 제품을 분석하고, 구매 흐름에 맞는 판매·콘텐츠 전략을 설계했습니다."}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
                {viewMode === "templates" ? (
                  <button onClick={() => setViewMode("main")} style={{ padding: "11px 15px", borderRadius: 12, border: "1px solid #D9CDBE", background: "#fff", color: "#5F4B36", fontWeight: 850, fontSize: 12.5, cursor: "pointer" }}>← AI 설계로 돌아가기</button>
                ) : (
                  <button onClick={() => { setShowPageDesign(false); setPageDesign(null); setSelectedTemplate(null); setDraft(null); setCompliance(null); setStage(-1); }} style={{ padding: "11px 15px", borderRadius: 12, border: "1px solid #D9CDBE", background: "#fff", color: "#5F4B36", fontWeight: 850, fontSize: 12.5, cursor: "pointer" }}>← 제품 입력으로</button>
                )}
                {viewMode !== "templates" && (
                <button
                  onClick={() => setViewMode("templates")}
                  style={{
                    padding: "12px 18px",
                    borderRadius: 12,
                    border: "none",
                    background: "linear-gradient(135deg, #5A6E52 0%, #4A5E42 100%)",
                    color: "#fff",
                    fontWeight: 900,
                    fontSize: 13.5,
                    cursor: "pointer",
                    boxShadow: "0 14px 28px rgba(90,110,82,0.22)",
                  }}
                >
                  다음 단계 : 템플릿 선택 →
                </button>
                )}
              </div>
              </div>

              {pageDesign.aiSummary && (
                <div style={{ padding: "22px 24px", borderRadius: 18, background: "#2F261D", color: "#FFF8ED", boxShadow: "0 20px 42px rgba(47,38,28,0.16)" }}>
                  <div style={{ fontSize: 12, fontWeight: 900, color: "#D8B57A", marginBottom: 9 }}>종합 진단</div>
                  <div style={{ fontSize: 15.2, lineHeight: 1.85, fontWeight: 500, letterSpacing: "-0.015em" }}>{pageDesign.aiSummary}</div>
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "minmax(300px, 0.9fr) minmax(420px, 1.35fr)", gap: 18 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div style={{ padding: 20, borderRadius: 16, background: "#FFFFFF", border: "1px solid #E8E1D7", boxShadow: "0 12px 26px rgba(47,38,28,0.05)" }}>
                    <div style={{ fontSize: 12, fontWeight: 950, color: "#A87535", marginBottom: 14 }}>① 제품 핵심 특징</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                      {pageDesign.productFeatures?.map((feature, i) => (
                        <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "9px 10px", borderRadius: 12, background: i === 0 ? "#FFF8EA" : "#FBFAF7", border: "1px solid #ECE3D7" }}>
                          <span style={{ color: "#A87535", fontWeight: 950, fontSize: 12 }}>✓</span>
                          <span style={{ fontSize: 13, lineHeight: 1.5, color: "#2B2925", fontWeight: 750 }}>{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ padding: 20, borderRadius: 16, background: "#FFFFFF", border: "1px solid #E8E1D7", boxShadow: "0 12px 26px rgba(47,38,28,0.05)" }}>
                    <div style={{ fontSize: 12, fontWeight: 950, color: "#A87535", marginBottom: 14 }}>② 핵심 설득 포인트</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
                      {pageDesign.persuasionPoints?.map((item, i) => (
                        <div key={i} style={{ paddingBottom: i < pageDesign.persuasionPoints.length - 1 ? 10 : 0, borderBottom: i < pageDesign.persuasionPoints.length - 1 ? "1px solid #F0E8DD" : "none" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 5 }}>
                            <div style={{ fontSize: 13, fontWeight: 900, color: "#2B2925" }}>{i + 1}위 · {item.label}</div>
                            <span style={{ padding: "4px 8px", borderRadius: 999, background: item.level === "매우 중요" ? "#FFF0DA" : "#F2E8DA", color: "#9A672E", fontSize: 10.5, fontWeight: 900 }}>{item.level || "중요"}</span>
                          </div>
                          <div style={{ fontSize: 11.5, color: "#8B8175", lineHeight: 1.45 }}>{item.reason}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ padding: 20, borderRadius: 16, background: "#FFFFFF", border: "1px solid #E8E1D7", boxShadow: "0 12px 26px rgba(47,38,28,0.05)" }}>
                    <div style={{ fontSize: 12, fontWeight: 950, color: "#A87535", marginBottom: 12 }}>③ 추천 고객</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                      {pageDesign.recommendedTarget?.map((target, i) => (
                        <div key={i} style={{ padding: "10px 11px", borderRadius: 12, background: "#FBFAF7", border: "1px solid #ECE3D7" }}>
                          <div style={{ fontSize: 13, fontWeight: 900, color: "#2B2925", marginBottom: 4 }}>{target.label || target}</div>
                          {target.reason && <div style={{ fontSize: 11.5, color: "#8B8175", lineHeight: 1.45 }}>{target.reason}</div>}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div style={{ padding: 22, borderRadius: 18, background: "#FFFFFF", border: "1px solid #E8E1D7", boxShadow: "0 16px 34px rgba(47,38,28,0.06)" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 18 }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 950, color: "#A87535", marginBottom: 5 }}>④ 추천 상세페이지 구성</div>
                      <div style={{ fontSize: 18, fontWeight: 950, color: "#241F19", letterSpacing: "-0.04em" }}>구매 흐름에 맞춘 페이지 목차</div>
                    </div>
                    <div style={{ padding: "6px 10px", borderRadius: 999, background: "#F2E8DA", color: "#9A672E", fontSize: 11, fontWeight: 900 }}>10 sections</div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                    {pageDesign.pageStructure?.map((item, i) => (
                      <div key={i} style={{ display: "grid", gridTemplateColumns: "48px 1fr", gap: 13, position: "relative", paddingBottom: i < pageDesign.pageStructure.length - 1 ? 17 : 0 }}>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                          <div style={{ width: 36, height: 36, borderRadius: 12, background: i === 0 ? "#A87535" : "#F2E8DA", color: i === 0 ? "#fff" : "#9A672E", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 950 }}>{item.step}</div>
                          {i < pageDesign.pageStructure.length - 1 && <div style={{ width: 1, flex: 1, minHeight: 26, background: "#E3D8C9", marginTop: 6 }} />}
                        </div>
                        <div style={{ padding: "3px 0 16px", borderBottom: i < pageDesign.pageStructure.length - 1 ? "1px solid #F0E8DD" : "none" }}>
                          <div style={{ fontSize: 14.5, fontWeight: 950, color: "#2B2925", marginBottom: 4 }}>{item.title}</div>
                          <div style={{ fontSize: 12.3, color: "#8B8175", lineHeight: 1.55 }}>{item.description}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1.15fr 0.85fr", gap: 18 }}>
                <div style={{ padding: "18px 20px", borderRadius: 16, background: "#FFF8EA", border: "1px solid #E9D8B8" }}>
                  <div style={{ fontSize: 12, fontWeight: 950, color: "#8B7355", marginBottom: 8 }}>⑤ 설계 이유</div>
                  <div style={{ fontSize: 13, color: "#5A4A47", lineHeight: 1.75 }}>{pageDesign.designReason}</div>
                </div>

                <div style={{ padding: 18, borderRadius: 16, background: "#FFFFFF", border: "1.5px solid #D7B27A", boxShadow: "0 12px 26px rgba(168,117,53,0.08)" }}>
                  <div style={{ fontSize: 12, fontWeight: 950, color: "#A87535", marginBottom: 10 }}>⑥ 추천 디자인</div>
                  {pageDesign.recommendedDesign && (
                    <>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 6 }}>
                        <div style={{ fontSize: 15, fontWeight: 950, color: "#2B2925" }}>⭐ {pageDesign.recommendedDesign.name}</div>
                        <div style={{ color: "#A87535", fontSize: 12 }}>{"★".repeat(pageDesign.recommendedDesign.score || 5)}</div>
                      </div>
                      <div style={{ fontSize: 12, color: "#8B8175", lineHeight: 1.55 }}>{pageDesign.recommendedDesign.reason}</div>
                    </>
                  )}
                  {pageDesign.alternativeDesigns?.length > 0 && (
                    <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #EFE6DA", display: "flex", flexDirection: "column", gap: 7 }}>
                      <div style={{ fontSize: 10.5, fontWeight: 900, color: "#9D9183" }}>다른 스타일 보기</div>
                      {pageDesign.alternativeDesigns.map((style, i) => (
                        <div key={i} style={{ fontSize: 11.5, color: "#5F4B36", lineHeight: 1.45 }}><b>{style.name}</b> · {style.reason}</div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ padding: 20, borderRadius: 16, background: "#FFFFFF", border: "1px solid #E8E1D7", boxShadow: "0 12px 26px rgba(47,38,28,0.05)" }}>
                <div style={{ fontSize: 12, fontWeight: 950, color: "#A87535", marginBottom: 14 }}>⑦ 추천 이미지</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 10 }}>
                  {pageDesign.recommendedImages?.map((img, i) => (
                    <div key={i} style={{ padding: "12px 12px", borderRadius: 14, background: "#FBFAF7", border: "1px solid #ECE3D7" }}>
                      <div style={{ fontSize: 12.3, fontWeight: 950, color: "#A87535", marginBottom: 5 }}>{img.label}</div>
                      <div style={{ fontSize: 12.1, color: "#2B2925", fontWeight: 800, lineHeight: 1.45, marginBottom: 5 }}>{img.recommendation}</div>
                      <div style={{ fontSize: 11, color: "#8B8175", lineHeight: 1.45 }}>{img.reason}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
          {draft && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14, marginBottom: 18, flexWrap: "wrap", position: "relative", zIndex: 100 }}><div><div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}><div style={{ fontSize: 22, fontWeight: 900, letterSpacing: "-0.04em" }}>생성된 상세페이지</div><span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 999, background: "#E8F4EA", color: "#2F7D4A", fontSize: 12, fontWeight: 900 }}>✓ 생성 완료</span></div><div style={{ fontSize: 12.5, color: "#8B8175", marginTop: 4 }}>AI가 생성한 최종 상세페이지입니다. 내용을 수정하거나 다운로드할 수 있습니다.</div></div><div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button
                onClick={handleSaveProject}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 12px", borderRadius: 8, border: "1px solid #A87535", background: "#A87535", color: "#fff", fontSize: 12.5, fontWeight: 800, cursor: "pointer" }}
              >
                💾 프로젝트 저장
              </button>
              <button
                onClick={copyResult}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 12px", borderRadius: 8, border: "1px solid #DEDCD3", background: "#fff", color: "#4A4940", fontSize: 12.5, cursor: "pointer" }}
              >
                {copied ? <Check size={13} color="#2F6F45" /> : <Copy size={13} />}
                {copied ? "복사됨" : "텍스트 복사"}
              </button>
              <button
                onClick={copyHtml}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 12px", borderRadius: 8, border: "1px solid #DEDCD3", background: "#fff", color: "#4A4940", fontSize: 12.5, cursor: "pointer" }}
              >
                {htmlCopied ? <Check size={13} color="#2F6F45" /> : <Code size={13} />}
                {htmlCopied ? "복사됨" : "HTML 복사"}
              </button>
              <button
                onClick={downloadHtml}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 12px", borderRadius: 8, border: "none", background: themeColor, color: "#fff", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}
              >
                <Download size={13} /> HTML 다운로드
              </button>
              <button
                onClick={resetAll}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 12px", borderRadius: 8, border: "1px solid #DEDCD3", background: "#fff", color: "#4A4940", fontSize: 12.5, cursor: "pointer" }}
              >
                <RefreshCw size={13} /> 새로 만들기
              </button>
              </div>
            </div>
          )}


          {/* 고급 기능 버튼들 (톤 포함) */}
          {draft && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18, paddingBottom: 16, borderBottom: "1px solid #E8E1D7" }}>

              {/* 톤 조정 드롭다운 */}
              <select
                value={selectedCopyTone}
                onChange={(e) => applyTone(e.target.value)}
                disabled={isGenerating}
                style={{
                  padding: "7px 10px",
                  borderRadius: 8,
                  border: "1px solid #D4A574",
                  background: "#FFF8F0",
                  color: "#A87535",
                  fontSize: 12.5,
                  fontWeight: 600,
                  cursor: isGenerating ? "not-allowed" : "pointer",
                  opacity: isGenerating ? 0.6 : 1,
                }}
              >
                <option value="default">📝 톤 유지</option>
                <option value="professional">🎓 전문적</option>
                <option value="friendly">😊 친근함</option>
                <option value="trust">🛡️ 신뢰감 있게</option>
                <option value="concise">✂️ 간결하게</option>
              </select>

              {/* 상세 컴플라이언스 레포트 */}
              {compliance && (
                <button
                  onClick={generateDetailedReport}
                  disabled={isGenerating}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "7px 12px",
                    borderRadius: 8,
                    border: "1px solid #D4A574",
                    background: "#FFF8F0",
                    color: "#A87535",
                    fontSize: 12.5,
                    fontWeight: 600,
                    cursor: isGenerating ? "not-allowed" : "pointer",
                    opacity: isGenerating ? 0.6 : 1,
                  }}
                >
                  📋 상세 보고서
                </button>
              )}

              {/* 다국어 번역 */}
              <button
                onClick={() => {
                  // 언어 선택 모달/드롭다운 토글
                  const container = document.getElementById("language-selector");
                  if (container) {
                    container.style.display = container.style.display === "none" ? "flex" : "none";
                  }
                }}
                disabled={isGenerating}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "7px 12px",
                  borderRadius: 8,
                  border: "1px solid #D4A574",
                  background: "#FFF8F0",
                  color: "#A87535",
                  fontSize: 12.5,
                  fontWeight: 600,
                  cursor: isGenerating ? "not-allowed" : "pointer",
                  opacity: isGenerating ? 0.6 : 1,
                }}
              >
                🌍 다국어 번역
              </button>

              {/* SEO 최적화 */}
              <button
                onClick={generateSeoOptimizations}
                disabled={isGenerating || generatingSeo}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "7px 12px",
                  borderRadius: 8,
                  border: "1px solid #D4A574",
                  background: "#FFF8F0",
                  color: "#A87535",
                  fontSize: 12.5,
                  fontWeight: 600,
                  cursor: isGenerating || generatingSeo ? "not-allowed" : "pointer",
                  opacity: isGenerating || generatingSeo ? 0.6 : 1,
                }}
              >
                🔍 SEO 최적화
              </button>
            </div>
          )}

          {/* 다국어 언어 선택 섹션 */}
          {draft && (
            <div
              id="language-selector"
              style={{
                display: "none",
                flexDirection: "column",
                gap: 10,
                marginBottom: 18,
                padding: "14px",
                background: "#F5F3EF",
                borderRadius: 10,
                border: "1px solid #E8E1D7",
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 700, color: "#2B2925", marginBottom: 6 }}>
                🌍 번역할 언어 선택
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {LANGUAGES.map((lang) => (
                  <label
                    key={lang.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "8px 10px",
                      background: selectedLanguage ===(lang.id) ? "#FFF8F0" : "#fff",
                      borderRadius: 6,
                      border: selectedLanguage ===(lang.id) ? "1.5px solid #A87535" : "1px solid #E3E1DA",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedLanguage === lang.id}
                      onChange={() => toggleLanguage(lang.id)}
                      style={{ cursor: "pointer", width: 16, height: 16 }}
                    />
                    <span style={{ fontSize: 13, color: "#2B2925" }}>
                      {lang.flag} {lang.label}
                    </span>
                  </label>
                ))}
              </div>
              <button
                onClick={generateTranslations}
                disabled={!selectedLanguage || isGenerating}
                style={{
                  marginTop: 8,
                  padding: "8px 14px",
                  borderRadius: 6,
                  border: "none",
                  background: selectedLanguage && !isGenerating ? "#A87535" : "#E8E1D7",
                  color: "#fff",
                  fontWeight: 600,
                  fontSize: 12.5,
                  cursor: selectedLanguage && !isGenerating ? "pointer" : "not-allowed",
                  transition: "all 0.2s ease",
                }}
              >
                ✅ {LANGUAGES.find(l => l.id === selectedLanguage)?.label || "언어"} 번역 생성
              </button>
            </div>
          )}

          {!draft && stage < 0 && !showPageDesign && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "80%", color: "#8A897F", textAlign: "center" }}>
              <Sparkles size={28} style={{ marginBottom: 10, opacity: 0.5 }} />
              <div style={{ fontSize: 14 }}>왼쪽에 제품 정보를 입력하고 생성 버튼을 눌러주세요.</div>
            </div>
          )}

          {compliance && (
            <div
              style={{
                marginBottom: 24,
                padding: "14px 18px",
                borderRadius: 10,
                display: "flex",
                alignItems: "center",
                gap: 10,
                background: compliance.overall_status === "pass" ? "#E9F1EC" : "#FBEAE7",
                color: compliance.overall_status === "pass" ? "#2F6F45" : "#B5453A",
                fontSize: 13.5,
                fontWeight: 600,
              }}
            >
              {compliance.overall_status === "pass" ? <ShieldCheck size={18} /> : <ShieldAlert size={18} />}
              {compliance.overall_status === "pass" ? "컴플라이언스 체크 통과" : `${compliance.flags.length}건의 표시광고 리스크가 발견됐어요`}
            </div>
          )}

          {compliance && compliance.flags?.length > 0 && (
            <div style={{ marginBottom: 28, display: "flex", flexDirection: "column", gap: 10 }}>
              {compliance.flags.map((f, i) => (
                <div key={i} style={{ padding: "10px 14px", borderRadius: 8, border: "1px solid #F0C9C2", background: "#FFF9F8", fontSize: 13 }}>
                  <div style={{ fontWeight: 700, color: "#B5453A", marginBottom: 3 }}>
                    [{f.risk_level?.toUpperCase()}] {f.violation_type}
                  </div>
                  <div style={{ color: "#5A4A47", marginBottom: 3 }}>"{f.flagged_text}"</div>
                  <div style={{ color: "#8A6A63" }}>제안: {f.suggested_revision}</div>
                </div>
              ))}
            </div>
          )}

          {/* 상세 컬플라이언스 레포트 */}
          {detailedComplianceReport && (
            <div style={{ marginBottom: 28, padding: "16px", background: "#F5F3EF", borderRadius: 10, border: "1px solid #E8E1D7" }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#2B2925", marginBottom: 12 }}>📋 상세 컬플라이언스 분석</div>
              <div style={{ fontSize: 12.5, color: "#5A4A47", lineHeight: 1.7, marginBottom: 12 }}>
                {detailedComplianceReport.overall_summary}
              </div>
              {detailedComplianceReport.detailed_flags?.length > 0 && (
                <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
                  {detailedComplianceReport.detailed_flags.map((f, i) => (
                    <div key={i} style={{ padding: "10px 12px", background: "#fff", borderRadius: 6, border: "1px solid #E3E1DA", fontSize: 11 }}>
                      <div style={{ fontWeight: 700, color: "#2B2925", marginBottom: 4 }}>{f.violation_type}</div>
                      <div style={{ color: "#5A4A47", marginBottom: 3 }}>📌 규정: {f.regulatory_reference}</div>
                      <div style={{ color: "#5A4A47", marginBottom: 3 }}>💡 상세: {f.detailed_explanation}</div>
                      <div style={{ color: "#5A4A47", marginBottom: 3 }}>✏️ {f.detailed_revision_guide}</div>
                      <div style={{ color: "#6B7058", fontSize: 10, marginTop: 4, fontStyle: "italic" }}>💼 {f.industry_example}</div>
                    </div>
                  ))}
                </div>
              )}
              {detailedComplianceReport.improvement_tips && (
                <div style={{ marginTop: 12, padding: "10px", background: "#FFFCF0", borderRadius: 6, borderLeft: "3px solid #A87535" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#8B7355", marginBottom: 8 }}>🎯 개선 팁</div>
                  <div style={{ fontSize: 11, color: "#5A4A47", lineHeight: 1.6 }}>
                    {detailedComplianceReport.improvement_tips.map((tip, i) => (
                      <div key={i}>• {tip}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 톤 조정된 버전 */}
          {toneAdjustedDraft && selectedCopyTone !== "default" && (
            <div style={{ marginBottom: 28, padding: "16px", background: "#F5F3EF", borderRadius: 10, border: "1px solid #E8E1D7" }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#2B2925", marginBottom: 12 }}>
                📝 {selectedCopyTone === "professional" ? "전문적" : selectedCopyTone === "friendly" ? "친근한" : selectedCopyTone === "mysterious" ? "신비로운" : "재미있는"} 톤으로 조정됨
              </div>
              <div style={{ background: "#fff", padding: "16px", borderRadius: 6, border: "1px solid #E3E1DA", fontSize: 13, color: "#2B2925", lineHeight: 1.7 }}>
                <div style={{ fontWeight: 700, marginBottom: 10 }}>{toneAdjustedDraft.hero_headline}</div>
                <div style={{ fontSize: 12.5, color: "#5A4A47", marginBottom: 12 }}>{toneAdjustedDraft.hero_subcopy}</div>
                {toneAdjustedDraft.sections?.slice(0, 2).map((s, i) => (
                  <div key={i} style={{ marginBottom: 10, paddingBottom: 10, borderBottom: "1px solid #E8E1D7" }}>
                    <div style={{ fontWeight: 700, marginBottom: 4, color: "#2B2925" }}>{s.title}</div>
                    <div style={{ fontSize: 12.5, color: "#5A4A47" }}>{s.body?.slice(0, 100)}...</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* A/B 버전 비교 */}
          {abVersions && (
            <div style={{ marginBottom: 28, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {[{ title: "A 버전", draft: abVersions.versionA }, { title: "B 버전", draft: abVersions.versionB }].map((version, vIdx) => (
                <div key={vIdx} style={{ padding: "16px", background: "#F5F3EF", borderRadius: 10, border: "1px solid #E8E1D7" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#2B2925", marginBottom: 12 }}>{version.title}</div>
                  <div style={{ background: "#fff", padding: "12px", borderRadius: 6, border: "1px solid #E3E1DA", fontSize: 12, color: "#2B2925", lineHeight: 1.6 }}>
                    <div style={{ fontWeight: 700, marginBottom: 8, fontSize: 13 }}>{version.draft.hero_headline}</div>
                    <div style={{ fontSize: 11.5, color: "#5A4A47", marginBottom: 10 }}>{version.draft.hero_subcopy?.slice(0, 80)}...</div>
                    {version.draft.sections?.slice(0, 1).map((s, i) => (
                      <div key={i} style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid #E8E1D7" }}>
                        <div style={{ fontWeight: 600, fontSize: 11.5, marginBottom: 3 }}>{s.title}</div>
                        <div style={{ fontSize: 11, color: "#5A4A47" }}>{s.body?.slice(0, 60)}...</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* SEO 최적화 결과 */}
          {seoOptimization && (
            <div style={{ marginBottom: 28, padding: "16px", background: "#F5F3EF", borderRadius: 10, border: "1px solid #E8E1D7" }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#2B2925", marginBottom: 14 }}>🔍 SEO 최적화</div>

              {/* 추천 키워드만 표시 */}
              <div style={{ padding: "12px", background: "#fff", borderRadius: 6, border: "1px solid #E3E1DA" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#8B7355", marginBottom: 8 }}>🔑 추천 키워드</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {seoOptimization.recommendedKeywords?.map((kw, i) => (
                    <span key={i} style={{ padding: "4px 10px", background: "#FFF8F0", borderRadius: 4, fontSize: 11, color: "#A87535", fontWeight: 600 }}>
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 다국어 번역 결과 */}

          {draft && (
            <div style={{ maxWidth: 940, margin: "0 auto", fontFamily: bodyFamily }}>
              <PreviewSection idx="hero" onRegen={regenerateSection} loading={regenIndex === "hero"} accent={themeColor} onEdit={() => setEditingSection({ id: "hero", section: { title: displayDraft.hero_headline || "", body: displayDraft.hero_subcopy || "", items: [] } })}>
                <div
                  style={{
                    position: "relative",
                    overflow: "hidden",
                    borderRadius: conceptStyle.radius,
                    boxShadow: "0 18px 50px rgba(31,42,36,0.10)",
                    border: "1px solid rgba(31,42,36,0.08)",
                    padding: "58px 58px 56px",
                    background: `linear-gradient(135deg, #FFFFFF 0%, #FBFAF6 68%, ${accent1}12 100%)`,
                    marginBottom: 44,
                  }}
                >
                  <div style={{ position: "absolute", top: 0, left: 50, right: 50, height: 1, background: `linear-gradient(90deg, transparent, ${accent1}66, transparent)` }} />
                  {image && <img src={image} alt="product" style={{ width: "100%", height: 250, objectFit: "cover", borderRadius: conceptStyle.radius, marginBottom: 32, filter: "saturate(.95) contrast(1.02)" }} />}
                  {product.name && (
                    <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 2.8, textTransform: "uppercase", color: accent1, marginBottom: 18 }}>
                      {product.name}
                    </div>
                  )}
                  <div style={{ fontFamily: conceptStyle.headFont, fontWeight: conceptStyle.headWeight, fontSize: 44, lineHeight: 1.16, color: "#1F2A24", marginBottom: 22, letterSpacing: "-0.035em", maxWidth: 560 }}>
                    <EmphasizedText text={displayDraft.hero_headline} accent={accent1} />
                  </div>
                  <div style={{ width: 72, height: 1, background: accent1, marginBottom: 22, opacity: 0.8 }} />
                  <div style={{ fontSize: 16, color: "#5D5B52", lineHeight: 1.85, maxWidth: 560, letterSpacing: "-0.01em" }}>
                    <EmphasizedText text={displayDraft.hero_subcopy} accent={accent1} />
                  </div>
                </div>
              </PreviewSection>

              {displayDraft.sections?.map((s, i) => {
                const isHighlight = s.type === "benefit_list" || s.type === "solution";
                const isBadges = s.type === "trust_badges";
                const isList = s.type === "benefit_list";
                const cardBg = isHighlight ? conceptStyle.highlightBg : "#fff";
                const isDarkBox = isHighlight && conceptStyle.highlightBg === "#1F2A24";
                const textColor = isDarkBox ? "#EDEBE4" : "#4A4940";
                const titleColor = isDarkBox ? "#fff" : "#1F2A24";
                const accentInBox = isDarkBox ? "#fff" : accent1;
                return (
                  <PreviewSection key={i} idx={i} onRegen={regenerateSection} loading={regenIndex === i} accent={themeColor} onEdit={() => setEditingSection({ id: s.id || s.type || i, section: s })}>
                    <div
                      style={{
                        position: "relative",
                        borderRadius: isHighlight ? conceptStyle.radius : 0,
                        boxShadow: isHighlight ? "0 14px 34px rgba(31,42,36,0.07)" : "none",
                        border: isHighlight ? "none" : "0",
                        borderTop: isHighlight ? "none" : "1px solid rgba(31,42,36,0.12)",
                        borderLeft: isHighlight && conceptStyle.highlightBorder !== "none" ? conceptStyle.highlightBorder : undefined,
                        padding: isHighlight ? "34px 38px 36px 98px" : "34px 4px 38px 92px",
                        background: isHighlight ? cardBg : "transparent",
                        margin: isHighlight ? "24px 0 28px" : "0 0 8px",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 14 }}>
                        <span
                          style={{
                            position: "absolute",
                            left: isHighlight ? 34 : 4,
                            top: isHighlight ? 30 : 26,
                            fontFamily: conceptStyle.headFont,
                            fontSize: 34,
                            fontWeight: 700,
                            color: accentInBox,
                            opacity: isHighlight ? 0.28 : 0.18,
                            letterSpacing: "-0.04em",
                          }}
                        >
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <ConceptLabel labelStyle={conceptStyle.labelStyle} themeColor={accentInBox} dark={isDarkBox}>
                          {sectionLabel(s.type)}
                        </ConceptLabel>
                      </div>
                      {s.title && (
                        <div style={{ fontFamily: conceptStyle.headFont, fontWeight: conceptStyle.headWeight, fontSize: 23, marginBottom: 14, color: titleColor, lineHeight: 1.35, letterSpacing: "-0.025em" }}>
                          <EmphasizedText text={s.title} accent={accentInBox} />
                        </div>
                      )}
                      {s.body && <div style={{ fontSize: 15, color: textColor, lineHeight: 1.9, letterSpacing: "-0.01em" }}><EmphasizedText text={s.body} accent={accentInBox} /></div>}
                      {s.items && isList && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 4 }}>
                          {normalizeSectionItems(s.items).map((it, j) => (
                            <div key={j} style={{ display: "flex", alignItems: "flex-start", gap: 12, fontSize: 15, color: textColor, lineHeight: 1.75 }}>
                              <span style={{ color: accentInBox, fontWeight: 800, marginTop: 1 }}>—</span>
                              <span><EmphasizedText text={it} accent={accentInBox} /></span>
                            </div>
                          ))}
                        </div>
                      )}
                      {s.items && !isBadges && !isList && (
                        <ul style={{ margin: 0, paddingLeft: 19, fontSize: 15, color: textColor, lineHeight: 1.9 }}>
                          {normalizeSectionItems(s.items).map((it, j) => (
                            <li key={j}><EmphasizedText text={it} accent={accentInBox} /></li>
                          ))}
                        </ul>
                      )}
                      {s.items && isBadges && (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 4 }}>
                          {normalizeSectionItems(s.items).map((it, j) => (
                            <ConceptBadge key={j} badgeStyle={conceptStyle.badgeStyle} themeColor={accent1}>
                              <EmphasizedText text={it} accent={accent1} />
                            </ConceptBadge>
                          ))}
                        </div>
                      )}
                    </div>
                  </PreviewSection>
                );
              })}
            </div>
          )}
        </div>
          </>
        ) : viewMode === "templates" ? (
          <>
            {/* LEFT: Template Gallery */}
            <div style={{ background: "#FFFEFB", color: "#26231F", borderRight: "1px solid #E8E1D7", overflowY: "auto", minWidth: 0 }}>
              <TemplateGallery
                selectedTemplate={selectedTemplate}
                onSelectTemplate={handleSelectTemplate}
                onBack={() => setViewMode("main")}
                onGenerate={handleGenerateWithTemplate}
                themeColor={themeColor}
                pointColors={pointColors}
              />
            </div>

            {/* RIGHT: Preview with selected template style */}
            <div style={{ padding: "30px 40px 48px", overflowY: "auto", background: "linear-gradient(180deg, #F8F5EF 0%, #F3EDE4 100%)", minWidth: 0 }}>
              {pageDesign && selectedTemplate ? (
                <div style={{ maxWidth: 1080, margin: "0 auto 28px", display: "flex", flexDirection: "column", gap: 18 }}>
                  {/* 미리보기 헤더 + 버튼 */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 18 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 10px", borderRadius: 999, background: "#E8D5BC", color: "#8B5E2C", fontSize: 11, fontWeight: 900, letterSpacing: "0.04em", marginBottom: 12 }}>
                        TEMPLATE PREVIEW
                      </div>
                      <div style={{ fontSize: 22, fontWeight: 950, color: "#241F19", letterSpacing: "-0.055em", marginBottom: 4 }}>📋 템플릿 미리보기</div>
                      <div style={{ fontSize: 13, color: "#8B8175", lineHeight: 1.6 }}>
                        선택된 템플릿 '{DESIGN_TEMPLATES.find(t => t.id === selectedTemplate)?.label || ""}' 스타일로 상세페이지가 표현됩니다.
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                      <button
                        onClick={() => setViewMode("main")}
                        style={{
                          padding: "8px 12px",
                          borderRadius: 8,
                          border: "1px solid #D4A574",
                          background: "#fff",
                          color: "#A87535",
                          fontWeight: 600,
                          fontSize: 12,
                          cursor: "pointer",
                          whiteSpace: "nowrap",
                        }}
                      >
                        이전 단계로
                      </button>
                      <button
                        onClick={handleGenerateWithTemplate}
                        style={{
                          padding: "8px 12px",
                          borderRadius: 8,
                          border: "none",
                          background: "linear-gradient(135deg, #5A6E52 0%, #4A5E42 100%)",
                          color: "#fff",
                          fontWeight: 600,
                          fontSize: 12,
                          cursor: "pointer",
                          boxShadow: "0 8px 16px rgba(90,110,82,0.25)",
                          whiteSpace: "nowrap",
                        }}
                      >
                        이 템플릿으로 생성
                      </button>
                    </div>
                  </div>

                  {/* 설계 정보 미리보기 */}
                  {pageDesign.aiSummary && (
                    <div style={{ padding: "22px 24px", borderRadius: 18, background: "#2F261D", color: "#FFF8ED", boxShadow: "0 20px 42px rgba(47,38,28,0.16)" }}>
                      <div style={{ fontSize: 12, fontWeight: 900, color: "#D8B57A", marginBottom: 9 }}>종합 진단</div>
                      <div style={{ fontSize: 15.2, lineHeight: 1.85, fontWeight: 500, letterSpacing: "-0.015em" }}>{pageDesign.aiSummary}</div>
                    </div>
                  )}

                  {/* PreviewSection으로 최종 결과 표시 */}
                  <div>
                    <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: "-0.04em", marginBottom: 18 }}>최종 상세페이지 미리보기</div>
                    {draft ? (
                      <PreviewSection
                        idx="hero"
                        title={displayDraft.hero_headline}
                        subtitle={displayDraft.hero_subcopy}
                        sections={displayDraft.sections || []}
                        accent={themeColor}
                        headingFont={headingFamily}
                        bodyFont={bodyFamily}
                        concept={concept}
                        onRegen={(idx, feedback) => regenerateSection(idx, feedback)}
                        loading={regeneratingSectionIndex === idx}
                      />
                    ) : (
                      <div style={{ padding: 24, borderRadius: 12, background: "#fff", border: "1px solid #E8E1D7", textAlign: "center", color: "#8B8175" }}>
                        상세페이지가 생성되면 미리보기가 표시됩니다.
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div style={{ padding: 40, textAlign: "center", color: "#8B8175" }}>
                  <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>템플릿을 선택해주세요</div>
                  <div style={{ fontSize: 13 }}>왼쪽에서 템플릿을 선택하면 미리보기가 표시됩니다.</div>
                </div>
              )}
            </div>
          </>
        ) : (
          // 내 프로젝트 화면
          <div style={{ background: "#F4F3EE", color: "#2B2925", padding: "28px 30px", display: "flex", flexDirection: "column", gap: 18, borderRight: "1px solid #E8E1D7", overflowY: "auto", flex: 1 }}>
            {/* 헤더 */}
            <div style={{ paddingBottom: 8, borderBottom: "1px solid #EEE7DD" }}>
              <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: "-0.04em", marginBottom: 5 }}>내 프로젝트</div>
              <div style={{ fontSize: 12.5, color: "#8B8175" }}>저장된 프로젝트를 관리합니다.</div>
            </div>

            {/* 검색 입력 */}
            <input
              type="text"
              placeholder="프로젝트 검색..."
              value={searchQuery}
              onChange={(e) => handleSearchProjects(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 8,
                border: "1px solid #E1D8CB",
                background: "#FFFFFF",
                color: "#2B2925",
                fontSize: 13.5,
                outline: "none",
                boxSizing: "border-box",
                boxShadow: "0 1px 0 rgba(50,38,25,0.02)",
              }}
            />

            {/* 프로젝트 목록 */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10, flex: 1, overflowY: "auto" }}>
              {projectsList.length === 0 ? (
                <div style={{ textAlign: "center", color: "#8B8175", padding: "40px 20px" }}>
                  <div style={{ fontSize: 14, marginBottom: 8 }}>저장된 프로젝트가 없습니다.</div>
                  <div style={{ fontSize: 12 }}>프로젝트를 생성 후 저장해주세요.</div>
                </div>
              ) : (
                projectsList.map((project) => (
                  <div
                    key={project.projectId}
                    onClick={() => handleLoadProject(project.projectId)}
                    style={{
                      cursor: "pointer",
                      border: "1px solid #E3E1DA",
                      background: "#FFFFFF",
                      borderRadius: 8,
                      padding: 14,
                      display: "flex",
                      flexDirection: "column",
                      gap: 10,
                      boxShadow: "0 1px 2px rgba(50,38,25,0.02)",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#2B2925", marginBottom: 6 }}>
                          {project.projectName}
                        </div>
                        <div style={{ fontSize: 11, color: "#8B8175", lineHeight: 1.5 }}>
                          <div>저장: {formatDate(project.createdAt)}</div>
                          {project.updatedAt !== project.createdAt && (
                            <div>수정: {formatDate(project.updatedAt)}</div>
                          )}
                        </div>
                      </div>
                      <div
                        style={{
                          padding: "4px 10px",
                          background: project.saveStatus === "completed" ? "#EBF0E6" : "#F5EDE3",
                          color: project.saveStatus === "completed" ? "#5A6E52" : "#8B7355",
                          borderRadius: 4,
                          fontSize: 10,
                          fontWeight: 600,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {project.saveStatus === "completed" ? "생성 완료" : "생성 전"}
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 6, justifyContent: "flex-end", borderTop: "1px solid #E3E1DA", paddingTop: 10 }}>
                      <button
                        onClick={() => handleLoadProject(project.projectId)}
                        style={{
                          padding: "6px 10px",
                          borderRadius: 6,
                          border: "1px solid #E1D8CB",
                          background: "#FFFFFF",
                          color: "#2B2925",
                          fontSize: 12,
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                          fontWeight: 500,
                        }}
                      >
                        불러오기
                      </button>
                      <button
                        onClick={() => handleDeleteProject(project.projectId)}
                        style={{
                          padding: "6px 10px",
                          borderRadius: 6,
                          border: "1px solid #E1D8CB",
                          background: "#FFFFFF",
                          color: "#2B2925",
                          fontSize: 12,
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                          fontWeight: 500,
                        }}
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* 돌아가기 버튼 */}
            <button
              onClick={handleBackToMain}
              style={{
                marginTop: "auto",
                padding: "12px 16px",
                borderRadius: 10,
                border: "none",
                background: "#A87535",
                color: "#fff",
                fontWeight: 700,
                fontSize: 14,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                width: "100%",
                transition: "all 0.2s ease",
                boxShadow: "0 2px 6px rgba(168,117,53,0.2)",
              }}
            >
              ← 돌아가기
            </button>
          </div>
        )}
      </div>
      {editingSection && (
        <div
          onMouseDown={(event) => event.target === event.currentTarget && setEditingSection(null)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 130,
            background: "rgba(32,25,20,.38)",
            display: "grid",
            placeItems: "center",
            padding: 20,
          }}
        >
          <div style={{ width: "min(620px, 94vw)", maxHeight: "86vh", overflowY: "auto", background: "#fff", borderRadius: 16, boxShadow: "0 18px 50px rgba(0,0,0,.22)" }}>
            <SectionEditor
              section={editingSection.section}
              onSave={(updatedSection) => {
                handleSectionUpdate(editingSection.id, updatedSection);
                setEditingSection(null);
              }}
              onClose={() => setEditingSection(null)}
              onAIImproveRequest={(request) =>
                handleAIImproveRequest({
                  ...request,
                  sectionId: editingSection.id,
                })
              }
              aiResult={
                String(aiImproveResult?.sectionId) === String(editingSection.id)
                  ? aiImproveResult?.after
                  : null
              }
            />
          </div>
        </div>
      )}
      <ServiceExperiencePanel
        showPreview={!!draft}
        draft={draft}
        onDraftChange={setDraft}
        onRegenerate={regenerateSection}
        onLoadProject={handleLoadProject}
        onEditSection={handleSectionUpdate}
        onAIImproveRequest={handleAIImproveRequest}
        regeneratingIndex={regeneratingSectionIndex}
      />
      <style>{`.spin{animation:spin 1s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}
        @media (max-width: 720px) {
          .app-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

// 폰트 선택기: 버튼을 누르면 아래로 목록이 펼쳐지고, 각 옵션은 실제 그 폰트로 렌더된다.
function FontPicker({ value, onChange, themeColor }) {
  const [open, setOpen] = useState(false);
  const current = FONTS.find((f) => f.id === value) || FONTS[0];
  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          ...inputStyle,
          textAlign: "left",
          cursor: "pointer",
          fontFamily: current.family,
          fontSize: 15,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span>{current.label} <span style={{ opacity: 0.55, fontSize: 12 }}>가나다 Aa</span></span>
        <span style={{ opacity: 0.5, fontSize: 11 }}>{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 6 }}>
          {FONTS.map((f) => {
            const selected = value === f.id;
            return (
              <button
                key={f.id}
                onClick={() => {
                  onChange(f.id);
                  setOpen(false);
                }}
                style={{
                  textAlign: "left",
                  padding: "8px 10px",
                  borderRadius: 8,
                  border: selected ? `1.5px solid ${themeColor}` : "1px solid #E1D8CB",
                  background: selected ? "#F4EEE5" : "transparent",
                  color: "#2B2925",
                  cursor: "pointer",
                  fontFamily: f.family,
                  fontSize: 15,
                }}
              >
                {f.label} <span style={{ opacity: 0.6, fontSize: 12 }}>가나다 Aa</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// 라벨 스타일 (line=밑줄, pill=알약, caps=대문자 강조)
function ConceptLabel({ labelStyle, themeColor, dark, children }) {
  const color = dark ? "rgba(255,255,255,0.75)" : themeColor;
  if (labelStyle === "pill") {
    return (
      <span
        style={{
          display: "inline-block",
          fontSize: 10.5,
          fontWeight: 700,
          color: "#fff",
          background: themeColor,
          padding: "3px 10px",
          borderRadius: 999,
          marginBottom: 8,
        }}
      >
        {children}
      </span>
    );
  }
  if (labelStyle === "caps") {
    return (
      <div
        style={{
          fontSize: 10.5,
          fontWeight: 700,
          color,
          marginBottom: 8,
          textTransform: "uppercase",
          letterSpacing: 2,
        }}
      >
        {children}
      </div>
    );
  }
  // line: 라벨 + 짧은 밑줄
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>
        {children}
      </div>
      <div style={{ width: 24, height: 2, background: themeColor }} />
    </div>
  );
}

// 배지(chip) 스타일 (outline=테두리, soft=연한배경, dark=진한배경)
function ConceptBadge({ badgeStyle, themeColor, children }) {
  const styles = {
    outline: { background: "transparent", color: themeColor, border: `1px solid ${themeColor}` },
    soft: { background: `${themeColor}1A`, color: themeColor, border: "none" },
    dark: { background: "#1F2A24", color: "#fff", border: "none" },
  }[badgeStyle] || { background: "transparent", color: themeColor, border: `1px solid ${themeColor}` };
  return (
    <span
      style={{
        display: "inline-block",
        fontSize: 12,
        fontWeight: 600,
        padding: "5px 12px",
        borderRadius: badgeStyle === "soft" ? 999 : 4,
        ...styles,
      }}
    >
      {children}
    </span>
  );
}


function getKeywordChips(product) {
  const raw = `${product?.benefits || ""},${product?.target || ""},${product?.ingredientName || ""}`;
  const split = raw
    .split(/[,.·/|\n]+/)
    .map((v) => v.replace(/[*()]/g, "").trim())
    .filter(Boolean);
  const preferred = ["식후 밸런스", "체중 관리", "갱년기 케어", "대사 건강", "식물성 원료", "프리미엄 배합"];
  const result = [];
  for (const p of preferred) {
    if (raw.includes(p.replace(" 케어", "")) || raw.includes(p.split(" ")[0])) result.push(p);
  }
  for (const item of split) {
    const short = item.length > 12 ? item.slice(0, 12) : item;
    if (short.length >= 2 && !result.includes(short) && result.length < 6) result.push(short);
  }
  return result.slice(0, 6);
}

function sectionLabel(type) {
  return { problem: "고민", solution: "핵심 특징", objection_handling: "정확한 안내", benefit_list: "요약", how_to_use: "섭취 방법", trust_badges: "선택 기준", smart_cards: "핵심 정보", section: "제품 정보", trust: "품질 정보", cta: "최종 안내" }[type] || type;}

function Field({ label, children }) {
  return (
    <div>
      <div style={{ fontSize: 11.5, opacity: 0.6, marginBottom: 6 }}>{label}</div>
      {children}
    </div>
  );
}

function PreviewSection({ idx, onRegen, onEdit, loading, accent, children }) {
  return (
    <div style={{ position: "relative", marginBottom: 18 }}>
      {children}
      <div style={{ position: "absolute", top: 10, right: 10, display: "flex", gap: 6 }}>
        {onEdit && (
          <button
            onClick={onEdit}
            title="직접 편집"
            style={{
              width: 26,
              height: 26,
              borderRadius: "50%",
              border: "none",
              background: "rgba(0,0,0,0.05)",
              color: accent,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            ✏
          </button>
        )}
      </div>

    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 8,
  border: "1px solid #E1D8CB",
  background: "#FFFFFF",
  color: "#2B2925",
  fontSize: 13.5,
  outline: "none",
  boxSizing: "border-box",
  boxShadow: "0 1px 0 rgba(50,38,25,0.02)",
};
