import { buildImprovePrompt } from "./improvePromptEngine";
import { callClaude } from "../../services/claudeClient";

export function runAIImproveEngine({section={}, productInfo={}, category="", targetCustomer="", brainKnowledge={}, tone="", instruction=""}={}) {
  const prompt = buildImprovePrompt({section, productInfo, category, targetCustomer, brainKnowledge, tone, instruction});

  return {
    prompt,
    result: {
      title: `${section.title || ""}${instruction ? ` (${instruction})` : ""}`,
      body: section.body || "",
      generatedBy: "aiImproveEngine"
    }
  };
}


export async function runAIImproveEngineAsync({
  section = {},
  productInfo = {},
  category = "",
  targetCustomer = "",
  brainKnowledge = {},
  tone = "",
  instruction = ""
} = {}) {
  const prompt = buildImprovePrompt({
    section,
    productInfo,
    category,
    targetCustomer,
    brainKnowledge,
    tone,
    instruction
  });

  // ✅ 수정: instruction을 context에 추가 (Mock 모드 대응)
  const result = await callClaude(
    prompt,
    1200,
    { 
      product: productInfo,
      instruction: instruction
    },
    "regenerate"
  );

  return {
    prompt,
    result: {
      title: result?.title || result?.hero_headline || result?.sections?.[0]?.title || section.title || "",
      body: result?.body || result?.hero_subcopy || result?.sections?.[0]?.body || section.body || "",
      items: result?.items || result?.sections?.[0]?.items || section.items || [],
      raw: result,
      generatedBy: "aiImproveEngineAsync"
    }
  };
}
