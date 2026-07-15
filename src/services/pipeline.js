// 상세페이지 생성 파이프라인.
//
// 흐름:
//   [1] 생성 (타깃 분석 + 상세페이지 작성 통합)  → onDraft 콜백
//   [2] 컴플라이언스 체크
//   [3] needs_review 이면 자동 보완 1회 → 재검토
//   [4] 최종 결과 반환
//
// UI(App.jsx)는 이 파이프라인을 호출하고, 진행 상태(stage)/중간 결과(draft)를
// 콜백으로 전달받아 화면을 갱신한다.

import { callClaude } from "./claudeClient.js";
import { buildGenerationPrompt } from "../prompts/generationPrompt.js";
import { buildCompliancePrompt } from "../prompts/compliancePrompt.js";
import { buildRemediationPrompt } from "../prompts/remediationPrompt.js";
import { buildRegeneratePrompt } from "../prompts/regeneratePrompt.js";

// 단계별 최대 토큰 (응답 잘림 방지를 위해 단계 특성에 맞게 조정)
const TOKENS = {
  generation: 3500,
  compliance: 3000,
  remediation: 2500,
  regenerate: 1200,
};

/**
 * 전체 파이프라인 실행.
 * @param {object} product - 제품 입력 값
 * @param {object} callbacks - { onStage(n), onDraft(content) }
 * @returns {Promise<{ draft, compliance }>}
 */
export async function runPipeline(product, callbacks = {}) {
  const { onStage = () => {}, onDraft = () => {} } = callbacks;
  let phase = "상세페이지 생성";

  try {
    // [1] 생성 (분석 + 작성 통합)
    console.log("🚀 파이프라인 시작", { product }); // 디버깅
    onStage(0);
    
    console.log("📝 프롬프트 생성 중..."); // 디버깅
    const prompt = buildGenerationPrompt(product);
    console.log("✅ 프롬프트 생성 완료", prompt.substring(0, 200) + "..."); // 디버깅
    
    console.log("🤖 Claude 호출 중..."); // 디버깅
    const draft = await callClaude(prompt, TOKENS.generation, { product });
    console.log("✅ Claude 응답 받음:", draft); // 디버깅
    
    onDraft(draft);
    onStage(2);

    // [2] 컴플라이언스 체크
    phase = "컴플라이언스 체크";
    const checkCompliance = (content) =>
      callClaude(buildCompliancePrompt(content, product.category), TOKENS.compliance, { product });

    let currentContent = draft;
    let complianceResult = await checkCompliance(currentContent);
    let attempts = 0;

    // [3] 자동 보완 (최대 1회)
    while (
      complianceResult.overall_status === "needs_review" &&
      complianceResult.flags?.length > 0 &&
      attempts < 1
    ) {
      onStage(3);
      currentContent = await callClaude(
        buildRemediationPrompt(currentContent, complianceResult.flags, product),
        TOKENS.remediation,
        { product }
      );
      onDraft(currentContent);
      complianceResult = await checkCompliance(currentContent);
      attempts += 1;
    }

    onStage(4);
    return { draft: currentContent, compliance: complianceResult };
  } catch (e) {
    // 어느 단계에서 실패했는지 phase를 담아 에러를 던진다
    const err = new Error(`오류 발생 (${phase} 단계): ${e.message}`);
    err.phase = phase;
    throw err;
  }
}

/**
 * 부분 재생성. 지정된 필드(hero 또는 섹션 인덱스)만 다시 작성한다.
 * @param {object} draft - 현재 전체 콘텐츠
 * @param {"hero"|number} idx - 재생성 대상
 * @param {object} product - 제품 입력 값 (카테고리 제약용)
 * @param {string} feedback - 선택. 자연어 수정 요청 ("더 짧게" 등)
 * @returns {Promise<object>} 새로 작성된 부분 JSON
 */
export async function regenerateSection(draft, idx, product, feedback = "") {
  const target =
    idx === "hero"
      ? { hero_headline: draft.hero_headline, hero_subcopy: draft.hero_subcopy }
      : draft.sections[idx];
  return callClaude(buildRegeneratePrompt(draft, target, product, feedback), TOKENS.regenerate);
}
