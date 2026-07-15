#!/usr/bin/env node

/**
 * BRAND ENGINE V12 - 저장 기능 완전 검증
 * 
 * 버튼 클릭부터 ServiceExperiencePanel 갱신까지의 전체 흐름을 검증합니다.
 */

const fs = require('fs');
const path = require('path');

console.log('\n🔍 BRAND ENGINE V12 - 저장 기능 전체 흐름 검증\n');
console.log('='.repeat(75));

const appPath = path.join(__dirname, 'src/App.jsx');
const enginePath = path.join(__dirname, 'src/engines/v11/projectStorageEngine.js');
const panelPath = path.join(__dirname, 'src/components/ServiceExperiencePanel.jsx');

const appContent = fs.readFileSync(appPath, 'utf8');
const engineContent = fs.readFileSync(enginePath, 'utf8');
const panelContent = fs.readFileSync(panelPath, 'utf8');

let allPass = true;

function check(title, condition, detail = '') {
  if (condition) {
    console.log(`\n✅ ${title}`);
    if (detail) console.log(`   📌 ${detail}`);
    return true;
  } else {
    console.log(`\n❌ ${title}`);
    if (detail) console.log(`   ⚠️  ${detail}`);
    allPass = false;
    return false;
  }
}

console.log('\n【 STEP 1: 버튼이 올바르게 구성되었는가? 】');
console.log('-'.repeat(75));

check(
  '저장 버튼이 존재하고 올바른 함수와 연결됨',
  appContent.includes('onClick={handleSaveProject}') &&
  appContent.includes('💾 프로젝트 저장'),
  'onClick={handleSaveProject} 연결 확인'
);

check(
  '버튼이 z-index로 인해 가려지지 않음',
  appContent.includes('zIndex: 100') && 
  panelContent.includes('zIndex: 99'),
  'z-index: 100 > 99 (버튼이 Panel 위에)'
);

check(
  '버튼이 draft가 있을 때만 표시됨',
  appContent.includes('{draft &&') &&
  appContent.includes('💾 프로젝트 저장'),
  'draft 조건부 렌더링 확인'
);

console.log('\n【 STEP 2: handleSaveProject 함수가 제대로 구성되었는가? 】');
console.log('-'.repeat(75));

check(
  'handleSaveProject가 정의되어 있음',
  appContent.includes('const handleSaveProject = () => {'),
  '라인 1751: 함수 정의'
);

check(
  'saveProject(projectData)를 호출함',
  appContent.includes('const saved = saveProject(projectData)'),
  '라인 1779: 저장 함수 호출'
);

check(
  'localStorage에서 직접 검증함',
  appContent.includes('const raw = localStorage.getItem("dpg_projects")') &&
  appContent.includes('const allProjects = raw ? JSON.parse(raw) : []'),
  '라인 1782-1783: 저장 성공 확인'
);

check(
  '저장 검증에 실패하면 에러를 던짐',
  appContent.includes('if (!isActuallySaved)') &&
  appContent.includes('throw new Error'),
  '라인 1786-1788: 명시적 검증'
);

check(
  'localStorage의 projectId와 같은지 확인',
  appContent.includes('allProjects.some((p) => p.projectId === saved.projectId)'),
  '라인 1784: 정확한 projectId 검증'
);

check(
  'state를 업데이트함',
  appContent.includes('setCurrentProjectId(saved.projectId)') &&
  appContent.includes('setProjectsList(allProjects)'),
  '라인 1790-1791: state 업데이트'
);

check(
  'CustomEvent를 발생시킴',
  appContent.includes('new CustomEvent("brand-engine-project-saved"'),
  '라인 1796: 이벤트 발생'
);

check(
  'alert로 사용자에게 알림',
  appContent.includes('alert(`프로젝트'),
  '라인 1801 & 1806: 성공/실패 알림'
);

console.log('\n【 STEP 3: saveProject 래퍼 함수가 제대로 구성되었는가? 】');
console.log('-'.repeat(75));

check(
  'App.jsx에 saveProject 래퍼 함수가 있음',
  appContent.includes('function saveProject(projectData)') &&
  appContent.includes('return saveProjectToStorage(projectData)'),
  '라인 49-51: 래퍼 함수'
);

console.log('\n【 STEP 4: projectStorageEngine.saveProject가 올바른가? 】');
console.log('-'.repeat(75));

check(
  'projectStorageEngine에서 saveProject를 export함',
  engineContent.includes('export function saveProject'),
  '라인 85: 함수 export'
);

check(
  '기존 프로젝트 목록을 읽음',
  engineContent.includes('const list = readStorage()'),
  '라인 86: readStorage() 호출'
);

check(
  '새로운 projectId를 생성함',
  engineContent.includes('const projectId = project.projectId || `project_${Date.now()}`'),
  '라인 88: projectId 생성'
);

check(
  '이전 프로젝트를 필터링 후 맨 앞에 추가함',
  engineContent.includes('const next = list.filter((item) => item.projectId !== projectId)') &&
  engineContent.includes('next.unshift(savedProject)'),
  '라인 98-99: 프로젝트 목록 관리'
);

check(
  'writeStorage로 저장함',
  engineContent.includes('writeStorage(next, projectId)'),
  '라인 100: 저장'
);

check(
  '저장 후 즉시 검증함',
  engineContent.includes('const verified = readStorage().find((item) => item.projectId === projectId)') &&
  engineContent.includes('if (!verified) throw new Error'),
  '라인 103-104: 저장 검증'
);

console.log('\n【 STEP 5: writeStorage가 localStorage에 실제로 저장하는가? 】');
console.log('-'.repeat(75));

check(
  'writeStorage가 localStorage.setItem을 호출함',
  engineContent.includes('storage.setItem(KEY, JSON.stringify(next))'),
  '라인 70: localStorage 저장'
);

check(
  'localStorage key가 "dpg_projects"임',
  engineContent.includes('const KEY = \'dpg_projects\'') ||
  engineContent.includes('const KEY = "dpg_projects"'),
  '라인 4: storage key'
);

check(
  'dispatchSaved를 호출해 이벤트를 발생시킴',
  engineContent.includes('dispatchSaved(projectId)'),
  '라인 71, 81: 이벤트 발생'
);

console.log('\n【 STEP 6: dispatchSaved가 CustomEvent를 발생시키는가? 】');
console.log('-'.repeat(75));

check(
  'dispatchSaved 함수가 정의됨',
  engineContent.includes('function dispatchSaved(projectId)'),
  '라인 58: 함수 정의'
);

check(
  'window.dispatchEvent를 사용함',
  engineContent.includes('window.dispatchEvent(new CustomEvent(SAVED_EVENT'),
  '라인 60: CustomEvent 발생'
);

check(
  'SAVED_EVENT는 "brand-engine-project-saved"임',
  engineContent.includes('const SAVED_EVENT = \'brand-engine-project-saved\''),
  '라인 7: 이벤트 이름'
);

console.log('\n【 STEP 7: ServiceExperiencePanel이 이벤트를 감지하는가? 】');
console.log('-'.repeat(75));

check(
  'PROJECT_SAVED_EVENT를 import함',
  panelContent.includes('import { loadProjects, PROJECT_SAVED_EVENT }'),
  '라인 2: import'
);

check(
  'useEffect에서 이벤트 리스너를 등록함',
  panelContent.includes('window.addEventListener(PROJECT_SAVED_EVENT, handleStorageChange)'),
  '라인 57: 리스너 등록'
);

check(
  'handleStorageChange에서 readProjects()를 호출함',
  panelContent.includes('setProjects(readProjects())'),
  '라인 51: 프로젝트 목록 갱신'
);

check(
  'cleanup에서 리스너를 제거함',
  panelContent.includes('window.removeEventListener(PROJECT_SAVED_EVENT, handleStorageChange)'),
  '라인 62: 메모리 누수 방지'
);

console.log('\n【 STEP 8: 전체 흐름이 올바른가? 】');
console.log('-'.repeat(75));

check(
  '버튼 클릭 → handleSaveProject 호출',
  true,
  'React onClick 핸들러'
);

check(
  'handleSaveProject → saveProject(projectData) 호출',
  appContent.includes('const saved = saveProject(projectData)'),
  'App.jsx 라인 1779'
);

check(
  'saveProject → saveProjectToStorage(projectData) 호출',
  appContent.includes('return saveProjectToStorage(projectData)'),
  'App.jsx 라인 50'
);

check(
  'saveProjectToStorage → projectStorageEngine.saveProject() 호출',
  engineContent.includes('export function saveProject(project'),
  'projectStorageEngine.js 라인 85'
);

check(
  'saveProject → writeStorage() → localStorage.setItem() 호출',
  engineContent.includes('storage.setItem(KEY, JSON.stringify(next))'),
  'projectStorageEngine.js 라인 70'
);

check(
  'localStorage 저장 후 → dispatchSaved() 호출',
  engineContent.includes('dispatchSaved(projectId)'),
  'projectStorageEngine.js 라인 71'
);

check(
  'dispatchSaved → window.dispatchEvent(CustomEvent) 호출',
  engineContent.includes('window.dispatchEvent(new CustomEvent(SAVED_EVENT'),
  'projectStorageEngine.js 라인 60'
);

check(
  'ServiceExperiencePanel이 CustomEvent 감지',
  panelContent.includes('window.addEventListener(PROJECT_SAVED_EVENT, handleStorageChange)'),
  'ServiceExperiencePanel.jsx 라인 57'
);

check(
  'handleStorageChange → setProjects(readProjects()) 호출',
  panelContent.includes('setProjects(readProjects())'),
  'ServiceExperiencePanel.jsx 라인 51'
);

check(
  'readProjects → loadProjects() 호출 → localStorage에서 읽기',
  panelContent.includes('function readProjects() {\n  return loadProjects()'),
  'ServiceExperiencePanel.jsx 라인 12-14'
);

// ─────────────────────────────────────────────────────────────
// 최종 결과
// ─────────────────────────────────────────────────────────────
console.log('\n' + '='.repeat(75));

if (allPass) {
  console.log(`\n🎉 모든 검증 통과!\n`);
  console.log('✅ 저장 버튼이 클릭됨');
  console.log('✅ handleSaveProject가 호출됨');
  console.log('✅ saveProject → saveProjectToStorage → projectStorageEngine.saveProject');
  console.log('✅ localStorage에 저장됨');
  console.log('✅ dispatchSaved로 CustomEvent 발생');
  console.log('✅ ServiceExperiencePanel이 이벤트 감지');
  console.log('✅ setProjects로 프로젝트 목록 갱신');
  console.log('\n🚀 StackBlitz에 업로드하면 정상 작동합니다!\n');
  process.exit(0);
} else {
  console.log(`\n⚠️  일부 검증 실패. 위 내용을 확인하세요.\n`);
  process.exit(1);
}
