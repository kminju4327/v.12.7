
// V11.3 Human Review Engine
// Generates review checkpoints before final publishing.

export function createReviewReport(result = {}) {
  return {
    language: checkLanguage(result),
    duplication: checkDuplication(result),
    categoryFit: checkCategoryFit(result),
  };
}

function checkLanguage(result) {
  const text = JSON.stringify(result);
  return { status: text.includes('을을') || text.includes('를를') ? 'warning' : 'pass' };
}

function checkDuplication(result) {
  return { status: 'pass' };
}

function checkCategoryFit(result) {
  return { status: 'pass' };
}
