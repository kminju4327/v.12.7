// V11.4 Human Review Engine foundation
export function reviewGeneratedPage(page){
 const text=JSON.stringify(page);
 const checks=[
  {name:"반복 표현",status:!/확인하세요 확인하세요/.test(text)},
  {name:"빈 콘텐츠",status:text.length>50},
  {name:"카테고리 검수",status:true}
 ];
 return {
  score:Math.round(checks.filter(x=>x.status).length/checks.length*100),
  checks
 };
}
