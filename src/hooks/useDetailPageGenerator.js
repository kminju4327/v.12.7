// 상세페이지 생성기의 상태와 액션을 관리하는 커스텀 훅.
// App.jsx(뷰)는 이 훅이 반환하는 값/함수만 사용해 렌더링에 집중한다.

import { useState, useRef, useCallback } from "react";
import { PRESET_COLORS } from "../styles/theme.js";
import { runPipeline, regenerateSection as regenSectionService } from "../services/pipeline.js";
import { draftToPlainText } from "../utils/copyResult.js";
import { buildHtmlDocument, downloadHtmlFile } from "../utils/htmlExport.js";

const INITIAL_PRODUCT = {
  name: "",
  mainCategory: "건강·영양식품",
  subCategory: "일반 건강식품",
  category: "일반식품",
  target: "",
  benefits: "",
  certs: "",
  ingredientName: "",
  purity: "",
  actualAmount: "",
  amountBasis: "원료 총중량",
  epa: "",
  dha: "",
};

export function useDetailPageGenerator() {
  const [product, setProduct] = useState(INITIAL_PRODUCT);
  const [image, setImage] = useState(null);
  const [themeColor, setThemeColor] = useState(PRESET_COLORS[0]);
  const [concept, setConcept] = useState("minimal");

  // stage: -1 idle, 0 생성중, 2 컴플라이언스, 3 자동보완, 4 완료
  const [stage, setStage] = useState(-1);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState(null);
  const [compliance, setCompliance] = useState(null);
  const [regenIndex, setRegenIndex] = useState(null);
  const [copied, setCopied] = useState(false);
  const [htmlCopied, setHtmlCopied] = useState(false);

  const fileInputRef = useRef(null);
  const isGenerating = stage >= 0 && stage < 4;
  const canGenerate = Boolean(product.name) && !isGenerating;

  const update = useCallback((k, v) => setProduct((p) => ({ ...p, [k]: v })), []);

  const handleImage = useCallback((e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => setImage(reader.result);
    reader.readAsDataURL(f);
  }, []);

  // 파이프라인 실행
  const generate = useCallback(async () => {
    setError("");
    setDraft(null);
    setCompliance(null);
    setStage(0);
    try {
      const { draft: finalDraft, compliance: complianceResult } = await runPipeline(product, {
        onStage: setStage,
        onDraft: setDraft,
      });
      setDraft(finalDraft);
      setCompliance(complianceResult);
    } catch (e) {
      setError(e.message);
      setStage(-1);
    }
  }, [product]);

  // 부분 재생성 (feedback: 선택적 자연어 수정 요청)
  const regenerate = useCallback(
    async (idx, feedback = "") => {
      if (!draft) return;
      setRegenIndex(idx);
      try {
        const result = await regenSectionService(draft, idx, product, feedback);
        if (idx === "hero") {
          setDraft((d) => ({
            ...d,
            hero_headline: result.hero_headline,
            hero_subcopy: result.hero_subcopy,
          }));
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
    },
    [draft, product]
  );

  // 결과 초기화 (입력값은 유지)
  const resetAll = useCallback(() => {
    setStage(-1);
    setDraft(null);
    setCompliance(null);
    setError("");
  }, []);

  // 결과 텍스트 클립보드 복사
  const copyResult = useCallback(() => {
    if (!draft) return;
    navigator.clipboard.writeText(draftToPlainText(draft)).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  }, [draft]);

  // HTML 문서를 클립보드로 복사
  const copyHtml = useCallback(() => {
    const html = buildHtmlDocument({ draft, image, concept, themeColor });
    if (!html) return;
    navigator.clipboard.writeText(html).then(() => {
      setHtmlCopied(true);
      setTimeout(() => setHtmlCopied(false), 1800);
    });
  }, [draft, image, concept, themeColor]);

  // HTML 문서를 .html 파일로 다운로드
  const downloadHtml = useCallback(() => {
    const html = buildHtmlDocument({ draft, image, concept, themeColor });
    downloadHtmlFile(html, product.name);
  }, [draft, image, concept, themeColor, product.name]);

  return {
    // state
    product,
    image,
    themeColor,
    concept,
    stage,
    error,
    draft,
    compliance,
    regenIndex,
    copied,
    htmlCopied,
    fileInputRef,
    isGenerating,
    canGenerate,
    // setters/actions
    update,
    setImage,
    setThemeColor,
    setConcept,
    handleImage,
    generate,
    regenerate,
    resetAll,
    copyResult,
    copyHtml,
    downloadHtml,
  };
}
