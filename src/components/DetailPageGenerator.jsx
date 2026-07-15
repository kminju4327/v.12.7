import { useState, useRef, useEffect } from "react";
import { Image as ImageIcon, X, Sparkles, ShieldAlert, ShieldCheck, RotateCw, CheckCircle2, Circle, Loader2, Copy, RefreshCw, Check, MessageSquare, Code, Download } from "lucide-react";
import { callClaude } from "../services/claudeClient.js";
import { formatSectionItem, normalizeSectionItems } from "../utils/sectionItem";

const STAGE_LABELS = ["상세페이지 생성", "컴플라이언스 체크"];

const CONCEPTS = [
  { id: "minimal", label: "미니멀", desc: "여백 중심, 얇은 선, 정보 위주" },
  { id: "warm", label: "따뜻함", desc: "둥근 카드, 부드러운 파스텔 톤" },
  { id: "premium", label: "프리미엄", desc: "진한 대비, 명조 헤드라인, 다크 강조" },
  { id: "natural", label: "내추럴", desc: "유기농·친환경 무드, 연한 배경" },
  { id: "bold", label: "임팩트", desc: "굵은 강조, 큰 배지, 시선을 끄는 느낌" },
  { id: "editorial", label: "에디토리얼", desc: "매거진풍, 큰 여백, 라인 구분" },
];

const PRESET_COLORS = ["#2F4739", "#5A6E52", "#A6543C", "#B8894A", "#6E3B3B", "#4A4038", "#2B3A42", "#7A6A80"];

// 포인트(강조) 컬러 프리셋 — 라벨/배지/강조에 쓰는 보조색
const POINT_COLORS = ["#A6543C", "#B8894A", "#2F4739", "#6E3B3B", "#C9A227", "#5A6E52", "#8C6239", "#3E5C63", "#8A4A54", "#2B3A42"];

// 폰트 무드 옵션. 한글 지원 구글 폰트 위주.
// family는 CSS font-family 값, google은 구글폰트 로드용 키.
const FONTS = [
  { id: "pretendard", label: "프리텐다드 (기본)", family: '"Pretendard", "Apple SD Gothic Neo", sans-serif', google: null },
  { id: "notosans", label: "노토 산스 (모던 고딕)", family: '"Noto Sans KR", sans-serif', google: "Noto+Sans+KR:wght@400;700;800" },
  { id: "notoserif", label: "노토 세리프 (명조)", family: '"Noto Serif KR", serif', google: "Noto+Serif+KR:wght@400;600;700;900" },
  { id: "gothica1", label: "고딕 A1 (깔끔 고딕)", family: '"Gothic A1", sans-serif', google: "Gothic+A1:wght@400;700;800" },
  { id: "nanumgothic", label: "나눔고딕 (친근)", family: '"Nanum Gothic", sans-serif', google: "Nanum+Gothic:wght@400;700;800" },
  { id: "nanummyeongjo", label: "나눔명조 (클래식)", family: '"Nanum Myeongjo", serif', google: "Nanum+Myeongjo:wght@400;700;800" },
  { id: "jua", label: "주아 (둥근 발랄)", family: '"Jua", sans-serif', google: "Jua" },
  { id: "dohyeon", label: "도현 (두꺼운 임팩트)", family: '"Do Hyeon", sans-serif', google: "Do+Hyeon" },
  { id: "gaegu", label: "개구 (손글씨 느낌)", family: '"Gaegu", cursive', google: "Gaegu:wght@400;700" },
  { id: "songmyung", label: "송명 (감성 명조)", family: '"Song Myung", serif', google: "Song+Myung" },
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
  const extra = rules.extraRules ? "\n- " + rules.extraRules.join("\n- ") : "";
  return `${rules.generationGuidance}
- 절대 사용 금지 단어/맥락: ${rules.forbiddenWords.join(", ")}
- "~걱정", "~불안", "~증상" 같은 표현도 특정 질환/건강 이상을 암시하면 안 됨
- 타사 제품을 직접 비교·비하하는 뉘앙스 금지, 자사 제품 사실만 서술
- 원료 함량 수치(%)는 순도인지 최종 섭취량 기준 함량인지 모호하지 않게, 확실하지 않으면 "정확한 함량은 성분표를 참조하세요" 수준으로만 언급${extra}`;
}

function buildComplianceFocus(category) {
  const rules = getCategoryRules(category);
  return rules.complianceFocus.map((f) => "- " + f).join("\n");
}

export default function DetailPageGenerator() {
  const [product, setProduct] = useState({
    name: "",
    category: "건강기능식품",
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
  const [themeColor, setThemeColor] = useState(PRESET_COLORS[0]);
  const [pointColors, setPointColors] = useState([]); // 최대 2개
  const [headingFont, setHeadingFont] = useState("pretendard");
  const [bodyFont, setBodyFont] = useState("pretendard");
  const [concept, setConcept] = useState("minimal");

  const [stage, setStage] = useState(-1); // -1 idle, 0..3 running, 4 done
  const [error, setError] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [draft, setDraft] = useState(null);
  const [compliance, setCompliance] = useState(null);
  const [regenIndex, setRegenIndex] = useState(null);
  const [copied, setCopied] = useState(false);
  const [htmlCopied, setHtmlCopied] = useState(false);
  const fileInputRef = useRef(null);
  const isGenerating = stage >= 0 && stage < 4;

  const update = (k, v) => setProduct((p) => ({ ...p, [k]: v }));

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

  async function runPipeline() {
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

    const productBlock = `제품명: ${product.name}
카테고리: ${product.category}
타깃 고객: ${product.target}
핵심 장점: ${product.benefits}
인증정보: ${product.certs || "없음"}${purityLine}${actualAmountLine}${epaLine}`;

    let phase = "상세페이지 생성";
    try {
      const categoryConstraint = buildGenerationConstraint(product.category);

      // 1+2단계 병합: 타깃 분석과 상세페이지 생성을 한 번의 호출로 처리
      const genResult = await callClaude(`당신은 이커머스 소비자 심리 분석가이자 상세페이지 카피라이터입니다. 먼저 아래 제품의 타깃 고객이 구매 전 느끼는 pain_points와 의심(objections)을 머릿속으로 분석한 뒤, 그 분석을 근거로 진부하지 않고 타깃을 정확히 겨냥한 상세페이지 구성안을 작성하세요.

[제품 정보]
${productBlock}

[제품 카테고리 제약 - ${product.category}]
${categoryConstraint}

${product.purity || product.actualAmount || product.epa || product.dha ? numericGuidance : ""}

진부한 상투적 표현("이제는 ~해보세요", "여러분의 건강을 책임집니다" 등)을 쓰지 말고, 제공된 정보에 없는 성분·효능·인증은 지어내지 마세요.

반드시 아래 JSON 형식으로만 답하세요. 설명 문구 없이 JSON만.
{"hero_headline": "string", "hero_subcopy": "string", "sections": [{"type": "problem", "title": "string", "body": "string"}, {"type": "solution", "title": "string", "body": "string"}, {"type": "objection_handling", "title": "string", "body": "string"}, {"type": "benefit_list", "items": ["string"]}, {"type": "how_to_use", "body": "string"}, {"type": "trust_badges", "items": ["string"]}]}`, 3500, { product }, "generation");
      const finalContent = genResult;
      setDraft(finalContent);
      setStage(2);
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

반드시 대상과 동일한 JSON 구조로만, 새로 작성된 내용을 반환하세요. 설명 없이 JSON만.`, 1200, { product }, "regenerate");
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

  const canGenerate = product.name && product.target && product.benefits && !isGenerating;

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
        const title = s.title ? `<h2 class="sec-title">${esc(s.title)}</h2>` : "";
        const body = s.body ? `<p class="sec-body">${esc(s.body)}</p>` : "";
        const isHighlight = s.type === "benefit_list" || s.type === "solution";
        const isBadges = s.type === "trust_badges";
        const isList = s.type === "benefit_list";
        let items = "";
        if (s.items && isBadges) {
          items = `<div class="badges">${normalizeSectionItems(s.items).map((it) => `<span class="badge">${esc(it)}</span>`).join("")}</div>`;
        } else if (s.items && isList) {
          items = `<div class="benefit-rows">${normalizeSectionItems(s.items)
            .map((it) => `<div class="benefit-row"><span class="benefit-tick">—</span><span>${esc(it)}</span></div>`)
            .join("")}</div>`;
        } else if (s.items) {
          items = `<ul class="sec-list">${normalizeSectionItems(s.items).map((it) => `<li>${esc(it)}</li>`).join("")}</ul>`;
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
    const pageBg = cs.pageBg || "#F4F3EE";

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
    background: ${pageBg};
    font-family: ${bodyFamily};
    color: #1F2A24;
    padding: 32px 16px;
  }
  .wrap { max-width: 640px; margin: 0 auto; }
  .card {
    background: #fff;
    border-radius: ${cs.radius};
    box-shadow: ${cs.shadow};
    border: ${cs.border};
    padding: 30px 32px;
    margin-bottom: ${Math.max(14, cs.sectionGap)}px;
  }
  .card.highlight {
    background: ${highlightBg};
    ${highlightBorderLeft}
  }
  .card.highlight .sec-body, .card.highlight .sec-list, .card.highlight .benefit-row { color: ${highlightText}; }
  .card.highlight .sec-title { color: ${highlightTitle}; }
  .hero {
    background: #fff;
    border-radius: ${cs.radius};
    box-shadow: ${cs.shadow};
    border: ${cs.border};
    padding: 40px 36px;
    margin-bottom: ${Math.max(14, cs.sectionGap)}px;
  }
  .hero-img { width: 100%; height: 220px; object-fit: cover; border-radius: ${cs.radius}; margin-bottom: 26px; }
  .hero-overline { font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: ${esc(accent1)}; margin-bottom: 14px; }
  .hero-headline { font-family: ${headingFamily}; font-weight: ${cs.headWeight}; font-size: 32px; line-height: 1.25; letter-spacing: -0.01em; margin: 0 0 16px; }
  .hero-rule { width: 40px; height: 3px; background: ${esc(accent1)}; margin: 0 0 16px; }
  .hero-sub { font-size: 15.5px; color: #6B6A61; line-height: 1.7; margin: 0; }
  .sec-head { display: flex; align-items: baseline; gap: 12px; margin-bottom: 12px; }
  .sec-num { font-family: ${headingFamily}; font-size: 13px; font-weight: 700; color: ${esc(accent1)}; opacity: .5; }
  .sec-label { font-size: 11px; font-weight: 700; color: ${esc(accent1)}; text-transform: uppercase; letter-spacing: .5px; }
  .sec-title { font-family: ${headingFamily}; font-weight: ${cs.headWeight}; font-size: 19px; line-height: 1.4; margin: 0 0 10px; }
  .sec-body { font-size: 14.5px; color: #4A4940; line-height: 1.75; margin: 0; }
  .sec-list { margin: 0; padding-left: 18px; font-size: 14.5px; color: #4A4940; line-height: 1.8; }
  .benefit-rows { display: flex; flex-direction: column; gap: 10px; }
  .benefit-row { display: flex; align-items: flex-start; gap: 10px; font-size: 14.5px; color: #4A4940; line-height: 1.6; }
  .benefit-tick { color: ${esc(accent1)}; font-weight: 700; }
  .badges { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 4px; }
  .badge { display: inline-block; font-size: 12px; font-weight: 600; padding: 5px 12px; ${badgeCss} }
</style>
</head>
<body>
  <div class="wrap">
    <div class="hero">
      ${imgHtml}
      ${overline}
      <h1 class="hero-headline">${esc(draft.hero_headline)}</h1>
      <div class="hero-rule"></div>
      <p class="hero-sub">${esc(draft.hero_subcopy)}</p>
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
    <div style={{ fontFamily: '"Pretendard", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif', background: "#F4F3EE", minHeight: "100%", color: "#1F2A24" }}>
      <div className="app-grid" style={{ display: "grid", gridTemplateColumns: "340px 1fr", minHeight: "100%" }}>
        {/* LEFT: input rail */}
        <div style={{ background: "#1F2A24", color: "#F4F3EE", padding: "28px 24px", display: "flex", flexDirection: "column", gap: 20 }}>
          <div>
            <div style={{ fontSize: 11, letterSpacing: 1.5, opacity: 0.6, textTransform: "uppercase", marginBottom: 4 }}>AI Detail Page</div>
            <div style={{ fontSize: 20, fontWeight: 800 }}>제품 정보 입력</div>
          </div>

          <Field label="제품명 *">
            <input style={inputStyle} disabled={isGenerating} value={product.name} onChange={(e) => update("name", e.target.value)} placeholder="예: 식물성 베르베린 88" />
          </Field>

          <Field label="카테고리 *">
            <div style={{ display: "flex", gap: 8 }}>
              {["건강기능식품", "일반식품"].map((c) => (
                <button
                  key={c}
                  onClick={() => update("category", c)}
                  disabled={isGenerating}
                  style={{
                    flex: 1,
                    padding: "9px 10px",
                    borderRadius: 8,
                    border: product.category === c ? `1.5px solid ${themeColor}` : "1.5px solid rgba(244,243,238,0.2)",
                    background: product.category === c ? "rgba(244,243,238,0.1)" : "rgba(244,243,238,0.06)",
                    color: "#F4F3EE",
                    fontSize: 13,
                    fontWeight: product.category === c ? 700 : 400,
                    cursor: "pointer",
                  }}
                >
                  {c}
                </button>
              ))}
            </div>
          </Field>

          <Field label="타깃 고객 *">
            <textarea style={{ ...inputStyle, height: 56, resize: "vertical" }} disabled={isGenerating} value={product.target} onChange={(e) => update("target", e.target.value)} placeholder="예: 40-60대 갱년기 여성, 혈당 관리 필요 성인" />
          </Field>

          <Field label="핵심 장점 *">
            <textarea style={{ ...inputStyle, height: 56, resize: "vertical" }} disabled={isGenerating} value={product.benefits} onChange={(e) => update("benefits", e.target.value)} placeholder="예: 베르베린 복합물 88.1%, 해썹 인증, 1일 2정" />
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
                      border: product.amountBasis === b ? `1.5px solid ${themeColor}` : "1.5px solid rgba(244,243,238,0.2)",
                      background: product.amountBasis === b ? "rgba(244,243,238,0.1)" : "rgba(244,243,238,0.06)",
                      color: "#F4F3EE",
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
              <button onClick={() => fileInputRef.current?.click()} style={{ ...inputStyle, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, cursor: "pointer", color: "rgba(244,243,238,0.6)" }}>
                <ImageIcon size={15} /> 사진 업로드
              </button>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImage} style={{ display: "none" }} />
          </Field>

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
                      background: "rgba(244,243,238,0.1)",
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
                        background: "rgba(244,243,238,0.15)",
                        borderRadius: "50%",
                        width: 16,
                        height: 16,
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#F4F3EE",
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
                    color: "rgba(244,243,238,0.5)",
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

          <Field label="디자인 컨셉">
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {CONCEPTS.map((c) => (
                <button key={c.id} onClick={() => setConcept(c.id)} style={{ textAlign: "left", padding: "8px 10px", borderRadius: 8, border: concept === c.id ? `1.5px solid ${themeColor}` : "1.5px solid rgba(244,243,238,0.15)", background: concept === c.id ? "rgba(244,243,238,0.06)" : "transparent", color: "#F4F3EE", cursor: "pointer" }}>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{c.label}</div>
                  <div style={{ fontSize: 11, opacity: 0.55 }}>{c.desc}</div>
                </button>
              ))}
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
              background: canGenerate ? themeColor : "rgba(244,243,238,0.15)",
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
            {stage >= 0 && stage < 4 ? "생성 중..." : "상세페이지 생성"}
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
            </div>
          )}
          {error && <div style={{ fontSize: 12, color: "#E8998D" }}>{error}</div>}
        </div>

        {/* RIGHT: preview / results */}
        <div style={{ padding: "36px 48px", overflowY: "auto" }}>
          {draft && (
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginBottom: 18, flexWrap: "wrap" }}>
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
          )}

          {!draft && stage < 0 && (
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

          {draft && (
            <div style={{ maxWidth: 640, margin: "0 auto", fontFamily: bodyFamily }}>
              <PreviewSection idx="hero" onRegen={regenerateSection} loading={regenIndex === "hero"} accent={themeColor}>
                <div style={{ borderRadius: conceptStyle.radius, boxShadow: conceptStyle.shadow, border: conceptStyle.border, padding: "40px 36px", background: "#fff" }}>
                  {image && <img src={image} alt="product" style={{ width: "100%", height: 220, objectFit: "cover", borderRadius: conceptStyle.radius, marginBottom: 26 }} />}
                  {product.name && (
                    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: accent1, marginBottom: 14 }}>
                      {product.name}
                    </div>
                  )}
                  <div style={{ fontFamily: conceptStyle.headFont, fontWeight: conceptStyle.headWeight, fontSize: 32, lineHeight: 1.25, color: "#1F2A24", marginBottom: 16, letterSpacing: "-0.01em" }}>
                    {draft.hero_headline}
                  </div>
                  <div style={{ width: 40, height: 3, background: accent1, marginBottom: 16 }} />
                  <div style={{ fontSize: 15.5, color: "#6B6A61", lineHeight: 1.7 }}>{draft.hero_subcopy}</div>
                </div>
              </PreviewSection>

              {draft.sections?.map((s, i) => {
                const isHighlight = s.type === "benefit_list" || s.type === "solution";
                const isBadges = s.type === "trust_badges";
                const isList = s.type === "benefit_list";
                const cardBg = isHighlight ? conceptStyle.highlightBg : "#fff";
                const isDarkBox = isHighlight && conceptStyle.highlightBg === "#1F2A24";
                const textColor = isDarkBox ? "#EDEBE4" : "#4A4940";
                const titleColor = isDarkBox ? "#fff" : "#1F2A24";
                const accentInBox = isDarkBox ? "#fff" : accent1;
                return (
                  <PreviewSection key={i} idx={i} onRegen={regenerateSection} loading={regenIndex === i} accent={themeColor}>
                    <div
                      style={{
                        borderRadius: conceptStyle.radius,
                        boxShadow: conceptStyle.shadow,
                        border: isHighlight ? conceptStyle.highlightBorder || conceptStyle.border : conceptStyle.border,
                        borderLeft: isHighlight && conceptStyle.highlightBorder !== "none" ? conceptStyle.highlightBorder : undefined,
                        padding: "30px 32px",
                        background: cardBg,
                        marginBottom: Math.max(0, conceptStyle.sectionGap - 18),
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 12 }}>
                        <span style={{ fontFamily: conceptStyle.headFont, fontSize: 13, fontWeight: 700, color: accentInBox, opacity: 0.5, minWidth: 22 }}>
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <ConceptLabel labelStyle={conceptStyle.labelStyle} themeColor={accentInBox} dark={isDarkBox}>
                          {sectionLabel(s.type)}
                        </ConceptLabel>
                      </div>
                      {s.title && (
                        <div style={{ fontFamily: conceptStyle.headFont, fontWeight: conceptStyle.headWeight, fontSize: 19, marginBottom: 10, color: titleColor, lineHeight: 1.4 }}>
                          {s.title}
                        </div>
                      )}
                      {s.body && <div style={{ fontSize: 14.5, color: textColor, lineHeight: 1.75 }}>{s.body}</div>}
                      {s.items && isList && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 4 }}>
                          {normalizeSectionItems(s.items).map((it, j) => (
                            <div key={j} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 14.5, color: textColor, lineHeight: 1.6 }}>
                              <span style={{ color: accentInBox, fontWeight: 700, marginTop: 1 }}>—</span>
                              <span>{it}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {s.items && !isBadges && !isList && (
                        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 14.5, color: textColor, lineHeight: 1.8 }}>
                          {normalizeSectionItems(s.items).map((it, j) => (
                            <li key={j}>{it}</li>
                          ))}
                        </ul>
                      )}
                      {s.items && isBadges && (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 4 }}>
                          {normalizeSectionItems(s.items).map((it, j) => (
                            <ConceptBadge key={j} badgeStyle={conceptStyle.badgeStyle} themeColor={accent1}>
                              {it}
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
      </div>
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
                  border: selected ? `1.5px solid ${themeColor}` : "1.5px solid rgba(244,243,238,0.15)",
                  background: selected ? "rgba(244,243,238,0.08)" : "transparent",
                  color: "#F4F3EE",
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

function PreviewSection({ idx, onRegen, loading, accent, children }) {
  const [open, setOpen] = useState(false);
  const [feedback, setFeedback] = useState("");

  const submit = () => {
    onRegen(idx, feedback.trim());
    setFeedback("");
    setOpen(false);
  };

  return (
    <div style={{ position: "relative", marginBottom: 18 }}>
      {children}
      <div style={{ position: "absolute", top: 10, right: 10, display: "flex", gap: 6 }}>
        <button
          onClick={() => setOpen((o) => !o)}
          title="수정 요청해서 다시 생성"
          style={{
            width: 26,
            height: 26,
            borderRadius: "50%",
            border: "none",
            background: open ? accent : "rgba(0,0,0,0.05)",
            color: open ? "#fff" : accent,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
        >
          <MessageSquare size={13} />
        </button>
        <button
          onClick={() => onRegen(idx, "")}
          disabled={loading}
          title="그대로 다시 생성"
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
          <RotateCw size={13} className={loading ? "spin" : ""} />
        </button>
      </div>

      {open && (
        <div
          style={{
            position: "absolute",
            top: 44,
            right: 10,
            width: 260,
            background: "#fff",
            border: "1px solid #E3E1DA",
            borderRadius: 10,
            boxShadow: "0 6px 20px rgba(0,0,0,0.12)",
            padding: 12,
            zIndex: 10,
          }}
        >
          <div style={{ fontSize: 11.5, color: "#6B6A61", marginBottom: 6 }}>
            어떻게 고칠까요? (예: 더 짧게, 더 캐주얼하게)
          </div>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit();
            }}
            placeholder="예: 첫 문장만 더 강하게, 이모지 빼고"
            style={{
              width: "100%",
              height: 54,
              padding: "8px 10px",
              borderRadius: 8,
              border: "1px solid #E3E1DA",
              fontSize: 12.5,
              resize: "vertical",
              outline: "none",
              boxSizing: "border-box",
              fontFamily: "inherit",
            }}
          />
          <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
            <button
              onClick={submit}
              disabled={loading || !feedback.trim()}
              style={{
                flex: 1,
                padding: "7px 0",
                borderRadius: 8,
                border: "none",
                background: feedback.trim() ? accent : "#E3E1DA",
                color: "#fff",
                fontSize: 12.5,
                fontWeight: 600,
                cursor: feedback.trim() ? "pointer" : "not-allowed",
              }}
            >
              이 요청으로 수정
            </button>
            <button
              onClick={() => setOpen(false)}
              style={{
                padding: "7px 12px",
                borderRadius: 8,
                border: "1px solid #E3E1DA",
                background: "#fff",
                color: "#6B6A61",
                fontSize: 12.5,
                cursor: "pointer",
              }}
            >
              취소
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "9px 11px",
  borderRadius: 8,
  border: "1px solid rgba(244,243,238,0.2)",
  background: "rgba(244,243,238,0.06)",
  color: "#F4F3EE",
  fontSize: 13.5,
  outline: "none",
  boxSizing: "border-box",
};
