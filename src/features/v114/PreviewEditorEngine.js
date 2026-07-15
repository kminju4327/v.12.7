// V11.4 Preview Editor foundation
export function updateSection(sections,index,patch){
 return sections.map((s,i)=>i===index?{...s,...patch}:s);
}
export function regenerateSectionPrompt(section){
 return `다음 섹션만 재생성합니다.
현재 내용:${section.title}
목표:구매전환 개선`;
}
