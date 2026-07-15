// V11.4 AI Commerce Strategy Report
export function buildStrategyReport({product,analysis,category}){
 return {
  product,
  category,
  customer: analysis?.customer || [],
  buyingReason: analysis?.persuasivePoints || [],
  storyFlow: analysis?.pageStructure || [],
  designDirection: analysis?.design || null,
  createdAt:new Date().toISOString()
 };
}
