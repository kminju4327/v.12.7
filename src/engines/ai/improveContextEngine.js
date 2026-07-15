export function buildImproveContext({
  productInfo = {},
  category = "",
  targetCustomer = "",
  brainKnowledge = {},
  tone = "",
  instruction = ""
}) {
  return {
    product: productInfo,
    category,
    targetCustomer,
    brainKnowledge,
    tone,
    instruction,
    goal: "Create a persuasive commerce detail page improvement while preserving product accuracy and category-specific selling logic."
  };
}
