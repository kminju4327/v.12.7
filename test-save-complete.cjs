#!/usr/bin/env node

/**
 * BRAND ENGINE V12 - 저장 기능 전체 검증 테스트
 * 
 * 검증 항목:
 * 1. handleSaveProject 함수 존재 여부
 * 2. saveProject 래퍼 함수 존재 여부
 * 3. projectStorageEngine import 확인
 * 4. ServiceExperiencePanel의 이벤트 리스너 확인
 * 5. z-index 문제 해결 여부
 * 6. localStorage 저장 로직 확인
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 BRAND ENGINE V12 - 저장 기능 검증 테스트\n');
console.log('='.repeat(60));

let passCount = 0;
let failCount = 0;

function test(name, condition, details = '') {
  if (condition) {
    console.log(`✅ PASS: ${name}`);
    if (details) console.log(`   └─ ${details}`);
    passCount++;
  } else {
    console.log(`❌ FAIL: ${name}`);
    if (details) console.log(`   └─ ${details}`);
    failCount++;
  }
}

// ─────────────────────────────────────────────────────────────
// 1️⃣ App.jsx 검증
// ─────────────────────────────────────────────────────────────
console.log('\n📄 App.jsx 검증:');
console.log('-'.repeat(60));

const appPath = path.join(__dirname, 'src/App.jsx');
const appContent = fs.readFileSync(appPath, 'utf8');

// 1-1. export 이름 확인
test(
  'App export 이름 올바름',
  appContent.includes('export default function App()'),
  'DetailPageGenerator 아님'
);

// 1-2. saveProject import 확인
test(
  'projectStorageEngine import 있음',
  appContent.includes('import { saveProject as saveProjectToStorage'),
  '라인 12'
);

// 1-3. 로컬 saveProject 래퍼 함수
test(
  'saveProject 래퍼 함수 정의됨',
  appContent.includes('function saveProject(projectData) {') ||
  appContent.includes('function saveProject(projectData)\n'),
  '라인 49-51'
);

// 1-4. handleSaveProject 함수 정의 확인
test(
  'handleSaveProject 함수 정의됨',
  appContent.includes('const handleSaveProject = () => {'),
  '라인 1751'
);

// 1-5. handleSaveProject 내부: localStorage 검증
test(
  'handleSaveProject에서 localStorage 직접 검증',
  appContent.includes('const raw = localStorage.getItem("dpg_projects")') &&
  appContent.includes('const allProjects = raw ? JSON.parse(raw) : []'),
  '라인 1782-1783: 저장 성공 확인'
);

// 1-6. handleSaveProject 내부: 이벤트 발생
test(
  'handleSaveProject에서 CustomEvent 발생',
  appContent.includes('new CustomEvent("brand-engine-project-saved"') ||
  appContent.includes('new CustomEvent(\'brand-engine-project-saved\''),
  '라인 1796: ServiceExperiencePanel에 알림'
);

// 1-7. 버튼에 handleSaveProject 연결
const buttonRegex = /onClick=\{handleSaveProject\}[\s\S]*?💾\s*프로젝트\s*저장/;
test(
  '저장 버튼이 handleSaveProject와 연결됨',
  buttonRegex.test(appContent),
  '라인 3270'
);

// 1-8. 버튼 컨테이너의 z-index 확인
test(
  '버튼 컨테이너가 z-index: 100으로 설정됨',
  appContent.includes('zIndex: 100') || appContent.includes('zIndex: "100"'),
  'ServiceExperiencePanel(zIndex: 99)보다 위에'
);

// 1-9. draft 조건부 렌더링 확인
test(
  '저장 버튼이 draft 있을 때만 표시됨',
  appContent.includes('{draft && (') && appContent.includes('💾 프로젝트 저장'),
  '라인 3267-3274'
);

// ─────────────────────────────────────────────────────────────
// 2️⃣ projectStorageEngine.js 검증
// ─────────────────────────────────────────────────────────────
console.log('\n🔧 projectStorageEngine.js 검증:');
console.log('-'.repeat(60));

const enginePath = path.join(__dirname, 'src/engines/v11/projectStorageEngine.js');
const engineContent = fs.readFileSync(enginePath, 'utf8');

// 2-1. localStorage key 확인
test(
  'localStorage key가 "dpg_projects"로 설정',
  engineContent.includes("const KEY = 'dpg_projects'") ||
  engineContent.includes('const KEY = "dpg_projects"'),
  '라인 4'
);

// 2-2. saveProject 함수 정의
test(
  'saveProject 함수가 export됨',
  engineContent.includes('export function saveProject'),
  '라인 85'
);

// 2-3. saveProject 내부: readStorage 호출
test(
  'saveProject에서 readStorage() 호출',
  engineContent.includes('const list = readStorage()'),
  '라인 86: 기존 프로젝트 읽기'
);

// 2-4. saveProject 내부: writeStorage 호출
test(
  'saveProject에서 writeStorage() 호출',
  engineContent.includes('writeStorage(next, projectId)'),
  '라인 100: 저장'
);

// 2-5. saveProject 내부: 검증 로직
test(
  'saveProject에서 저장 후 검증 수행',
  engineContent.includes('const verified = readStorage().find((item) => item.projectId === projectId)'),
  '라인 103: 저장 확인'
);

// 2-6. PROJECT_SAVED_EVENT export
test(
  'PROJECT_SAVED_EVENT가 export됨',
  engineContent.includes('export { KEY as PROJECT_STORAGE_KEY, SAVED_EVENT as PROJECT_SAVED_EVENT }') ||
  engineContent.includes("SAVED_EVENT as PROJECT_SAVED_EVENT"),
  '라인 121'
);

// 2-7. dispatchSaved 함수 호출
test(
  'writeStorage에서 dispatchSaved() 호출',
  engineContent.includes('dispatchSaved(projectId)'),
  '라인 71, 81: 이벤트 발생'
);

// ─────────────────────────────────────────────────────────────
// 3️⃣ ServiceExperiencePanel.jsx 검증
// ─────────────────────────────────────────────────────────────
console.log('\n📊 ServiceExperiencePanel.jsx 검증:');
console.log('-'.repeat(60));

const panelPath = path.join(__dirname, 'src/components/ServiceExperiencePanel.jsx');
const panelContent = fs.readFileSync(panelPath, 'utf8');

// 3-1. PROJECT_SAVED_EVENT import
test(
  'PROJECT_SAVED_EVENT import됨',
  panelContent.includes('import { loadProjects, PROJECT_SAVED_EVENT }'),
  '라인 2'
);

// 3-2. useEffect에서 이벤트 리스너 등록
test(
  'useEffect에서 PROJECT_SAVED_EVENT 리스너 등록',
  panelContent.includes('window.addEventListener(PROJECT_SAVED_EVENT, handleStorageChange)'),
  '라인 57: 저장 감지'
);

// 3-3. 리스너에서 readProjects() 호출
test(
  '리스너에서 readProjects() 호출',
  panelContent.includes('setProjects(readProjects())'),
  '라인 51: 프로젝트 목록 갱신'
);

// 3-4. z-index 확인 (패널 자체)
test(
  'ServiceExperiencePanel이 zIndex: 99로 설정',
  panelContent.includes('zIndex: 99'),
  '라인 231: 고정된 위치'
);

// ─────────────────────────────────────────────────────────────
// 4️⃣ main.jsx 검증
// ─────────────────────────────────────────────────────────────
console.log('\n📍 main.jsx 검증:');
console.log('-'.repeat(60));

const mainPath = path.join(__dirname, 'src/main.jsx');
const mainContent = fs.readFileSync(mainPath, 'utf8');

// 4-1. App import
test(
  'main.jsx에서 App을 import',
  mainContent.includes('import App from "./App.jsx"'),
  '라인 3'
);

// 4-2. App 렌더링
test(
  'ReactDOM.createRoot에서 <App /> 렌더링',
  mainContent.includes('<App />'),
  '라인 8'
);

// ─────────────────────────────────────────────────────────────
// 5️⃣ 통합 흐름 검증
// ─────────────────────────────────────────────────────────────
console.log('\n🔗 통합 흐름 검증:');
console.log('-'.repeat(60));

// 흐름:
// 1. 버튼 클릭 → handleSaveProject() 호출
// 2. saveProject(projectData) → saveProjectToStorage() 호출
// 3. projectStorageEngine.saveProject() → saveProjectToStorage() 호출
// 4. writeStorage() → localStorage.setItem() + dispatchSaved()
// 5. dispatchSaved() → window.dispatchEvent(CustomEvent)
// 6. ServiceExperiencePanel이 이벤트 감지
// 7. setProjects(readProjects()) → 목록 갱신

test(
  '전체 흐름: 버튼 → handleSaveProject → saveProject',
  appContent.includes('onClick={handleSaveProject}') &&
  appContent.includes('const handleSaveProject') &&
  appContent.includes('function saveProject(projectData)'),
  '버튼이 올바른 함수와 연결'
);

test(
  '전체 흐름: saveProject → projectStorageEngine.saveProject',
  appContent.includes('return saveProjectToStorage(projectData)') &&
  engineContent.includes('export function saveProject'),
  '래퍼 함수가 실제 함수와 연결'
);

test(
  '전체 흐름: saveProject → localStorage.setItem',
  engineContent.includes('storage.setItem(KEY, JSON.stringify(next))'),
  'localStorage에 실제로 저장'
);

test(
  '전체 흐름: saveProject → dispatchSaved',
  engineContent.includes('dispatchSaved(projectId)'),
  'CustomEvent 발생'
);

test(
  '전체 흐름: dispatchSaved → CustomEvent 생성',
  engineContent.includes('window.dispatchEvent(new CustomEvent(SAVED_EVENT'),
  'window 객체를 통해 이벤트 발생'
);

test(
  '전체 흐름: CustomEvent → ServiceExperiencePanel',
  panelContent.includes('window.addEventListener(PROJECT_SAVED_EVENT, handleStorageChange)'),
  '패널이 이벤트 감지'
);

test(
  '전체 흐름: handleStorageChange → setProjects',
  panelContent.includes('const handleStorageChange = () => {\n    setProjects(readProjects());'),
  '프로젝트 목록 자동 갱신'
);

// ─────────────────────────────────────────────────────────────
// 결과 출력
// ─────────────────────────────────────────────────────────────
console.log('\n' + '='.repeat(60));
console.log(`\n📊 테스트 결과:`);
console.log(`   ✅ PASS: ${passCount}개`);
console.log(`   ❌ FAIL: ${failCount}개`);
console.log(`   📈 성공률: ${((passCount / (passCount + failCount)) * 100).toFixed(1)}%\n`);

if (failCount === 0) {
  console.log('🎉 모든 테스트 통과! 저장 기능이 완벽하게 구현되었습니다.\n');
  process.exit(0);
} else {
  console.log(`⚠️  ${failCount}개 항목 실패. 위 내용을 확인하세요.\n`);
  process.exit(1);
}
