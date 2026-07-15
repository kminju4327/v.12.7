import { createSectionIntents } from "./intentEngine";
import { getProductProfile, makeCopy } from "./copyLibrary";
import { buildSmartCards } from "./smartCardEngine";
import { removeCopyRepetition } from "./repetitionEngine";
import { polishResult } from "../../utils/languagePostProcessor.js";

const text = (value) => String(value ?? "").trim();
const cleanList = (values = []) => values
  .flat()
  .map((value) => text(value?.point || value?.label || value))
  .filter((value) => value && !["null", "undefined"].includes(value.toLowerCase()));

/**
 * V9.1.4 Story Flow Lock Renderer
 * - AI 설계 순서를 기반으로 제품군별 필수 섹션을 보충한다.
 * - locked intent는 중복처럼 보여도 삭제하지 않는다.
 * - Renderer는 카피만 만들고 Story Flow 순서는 변경하지 않는다.
 */
export function renderWithV9({ product = {}, pageDesign = {} } = {}) {
  const profile = getProductProfile(product);
  const intents = createSectionIntents(pageDesign, profile);

  const heroIntent = intents.find((intent) => intent.type === "hero") || intents[0] || {
    type: "hero",
    message: "",
    goal: "",
    source: {},
  };
  const hero = makeCopy("hero", profile, heroIntent, 0);

  const bodyIntents = intents.filter((intent) => intent !== heroIntent && intent.type !== "closing");
  const sections = bodyIntents.map((intent, index) => {
    const copy = makeCopy(intent.type, profile, intent, intent.order);
    return {
      type: intent.type === "quality" ? "trust" : "section",
      intent: intent.type,
      title: copy.title,
      body: copy.body,
      step: String(index + 1).padStart(2, "0"),
      locked: true,
      synthesized: Boolean(intent.synthesized),
      source_intent: {
        title: intent.message,
        purpose: intent.goal,
      },
    };
  });

  const featureSource = profile.productReasoning?.features || profile.story?.features;
  const cards = featureSource
    ? featureSource.slice(0, 4).map((value, index) => ({ label: ["핵심", "기준", "품질", "활용"][index] || "정보", value }))
    : buildSmartCards(product, pageDesign);
  if (cards.length) {
    const cardItems = cards.map((card) => `${card.label} · ${card.value}`);
    sections.push({
      type: "smart_cards",
      intent: "facts",
      title: "한눈에 보는 핵심 정보",
      items: cardItems,
      cards,
    });
  }

  const purchasePoints = profile.productReasoning?.features
    ? profile.productReasoning.features.slice(0, 6)
    : profile.story
      ? profile.story.flowItems.map((item) => item.title).slice(0, 6)
      : cleanList(pageDesign.purchasePoints || pageDesign.persuasionPoints).slice(0, 5);
  if (purchasePoints.length) {
    sections.push({ type: "trust_badges", intent: "criteria", title: "구매 전 확인할 기준", items: purchasePoints });
  }

  const closingIntent = intents.find((intent) => intent.type === "closing") || {};
  const closing = makeCopy("closing", profile, closingIntent, sections.length + 1);
  sections.push({
    type: "cta",
    intent: "closing",
    title: closing.title,
    body: closing.body,
    locked: true,
  });

  const result = removeCopyRepetition({
    hero_headline: hero.title,
    hero_subcopy: hero.body,
    analysis: {
      target_insight: text(pageDesign.aiSummary),
      emotional_appeal: purchasePoints.join(", "),
      product_positioning: text(pageDesign.designReason),
      category_reasoning: profile.story?.reasoning || pageDesign.reasoning || null,
    },
    sections,
    mock_meta: {
      mode: "v9-intent-renderer",
      source: "pageDesign.pageStructure+story-flow-lock",
      fallback: "legacy",
      templateRole: "visual-only",
      version: "11.2.0",
    },
  });
  return polishResult(result, profile.story?.forbidden || []);
}
