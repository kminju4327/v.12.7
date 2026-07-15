
// V11.3 AI Design -> Page Generation Bridge
// Connects analysis results with final page strategy without changing templates.

export function buildPageStrategy(analysis = {}) {
  return {
    purchaseCriteria: analysis.purchaseCriteria || analysis.keyPoints || [],
    storyFlow: analysis.storyFlow || analysis.sections || [],
    imageDirection: analysis.imageDirection || analysis.recommendedImages || [],
    customer: analysis.targetCustomer || analysis.recommendedCustomer || null,
    design: analysis.designDirection || null,
  };
}
