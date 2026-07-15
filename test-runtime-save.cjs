#!/usr/bin/env node

/**
 * BRAND ENGINE V12 - 런타임 저장 기능 시뮬레이션
 * 
 * 이 테스트는 projectStorageEngine.js의 모든 함수를 직접 테스트합니다.
 * 실제 localStorage를 사용해서 저장, 읽기, 검증을 수행합니다.
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 BRAND ENGINE V12 - 런타임 저장 기능 시뮬레이션\n');
console.log('='.repeat(70));

// Mock localStorage (Node.js에서 사용)
const mockStorage = {};
global.localStorage = {
  getItem: (key) => mockStorage[key] || null,
  setItem: (key, value) => { mockStorage[key] = value; },
  removeItem: (key) => { delete mockStorage[key]; },
  clear: () => { Object.keys(mockStorage).forEach(k => delete mockStorage[k]); },
};

global.window = {
  localStorage: global.localStorage,
  dispatchEvent: (event) => {
    console.log(`   📢 이벤트 발생: ${event.type}`);
  },
};

// projectStorageEngine 코드를 직접 포함 (테스트 목적)
const engineContent = fs.readFileSync(path.join(__dirname, 'src/engines/v11/projectStorageEngine.js'), 'utf8');

// 코드 추출 및 실행 (eval은 테스트용이므로 OK)
try {
  eval(engineContent.replace(/export /g, ''));
} catch (e) {
  console.error('❌ projectStorageEngine 로드 실패:', e.message);
  process.exit(1);
}

let testsPassed = 0;
let testsFailed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✅ ${name}`);
    testsPassed++;
  } catch (error) {
    console.log(`❌ ${name}`);
    console.log(`   오류: ${error.message}`);
    testsFailed++;
  }
}

// ─────────────────────────────────────────────────────────────
// 테스트 시작
// ─────────────────────────────────────────────────────────────
console.log('\n📋 테스트 시나리오: 프로젝트 저장 → 읽기 → 검증\n');
console.log('-'.repeat(70));

// 1. 초기 상태: localStorage 비어있음
test('Step 1: localStorage 초기화 (비어있음)', () => {
  global.localStorage.clear();
  const items = loadProjects();
  if (items.length !== 0) throw new Error('초기 프로젝트가 있음');
  console.log(`   └─ 저장된 프로젝트: 0개`);
});

// 2. 프로젝트 저장
let savedProject;
test('Step 2: 프로젝트 저장 (saveProject 호출)', () => {
  const projectData = {
    projectName: '테스트 프로젝트',
    product: {
      name: '상품명',
      mainCategory: '건강·영양식품',
      subCategory: '일반 건강식품',
    },
    themeColor: '#A87535',
    pointColors: ['#C8785F'],
    headingFont: 'pretendard',
    bodyFont: 'pretendard',
    concept: 'minimal',
    additionalRequest: '더 짧게',
    draft: { hero_headline: '테스트 헤드라인' },
    analysisResult: null,
    strategyResult: null,
    compliance: null,
  };

  savedProject = saveProject(projectData);
  
  if (!savedProject.projectId) throw new Error('projectId 생성 실패');
  if (!savedProject.projectName) throw new Error('projectName 없음');
  
  console.log(`   └─ projectId: ${savedProject.projectId}`);
  console.log(`   └─ projectName: ${savedProject.projectName}`);
  console.log(`   └─ createdAt: ${savedProject.createdAt}`);
});

// 3. localStorage에 실제로 저장됨
test('Step 3: localStorage에 실제로 저장됨', () => {
  const raw = global.localStorage.getItem('dpg_projects');
  if (!raw) throw new Error('localStorage에 데이터 없음');
  
  const projects = JSON.parse(raw);
  if (!Array.isArray(projects)) throw new Error('프로젝트 배열 형식 아님');
  if (projects.length === 0) throw new Error('프로젝트 저장 실패');
  
  console.log(`   └─ localStorage 저장됨: ${projects.length}개 프로젝트`);
});

// 4. loadProjects로 읽어지는지 확인
test('Step 4: loadProjects로 저장된 프로젝트 읽기', () => {
  const projects = loadProjects();
  if (projects.length === 0) throw new Error('프로젝트를 읽을 수 없음');
  
  const found = projects.find(p => p.projectId === savedProject.projectId);
  if (!found) throw new Error('저장된 프로젝트를 찾을 수 없음');
  
  console.log(`   └─ 읽은 프로젝트: ${found.projectName}`);
  console.log(`   └─ 프로젝트 상태: ${found.saveStatus}`);
});

// 5. 같은 projectId로 업데이트
let updatedProject;
test('Step 5: 프로젝트 업데이트 (같은 projectId)', () => {
  const updateData = {
    projectId: savedProject.projectId,
    projectName: '업데이트된 프로젝트',
    product: savedProject.product,
    themeColor: '#C89A5A', // 색상 변경
    draft: savedProject.draft,
  };

  updatedProject = saveProject(updateData);
  
  if (updatedProject.projectName !== '업데이트된 프로젝트') {
    throw new Error('프로젝트명 업데이트 실패');
  }
  
  console.log(`   └─ 업데이트됨: ${updatedProject.projectName}`);
  console.log(`   └─ 여전히 같은 projectId: ${updatedProject.projectId === savedProject.projectId}`);
});

// 6. 프로젝트 개수 확인 (중복 없음)
test('Step 6: 프로젝트 개수 확인 (중복이 없어야 함)', () => {
  const projects = loadProjects();
  const sameIdCount = projects.filter(p => p.projectId === savedProject.projectId).length;
  
  if (sameIdCount !== 1) {
    throw new Error(`같은 projectId가 ${sameIdCount}개 있음 (1개여야 함)`);
  }
  
  console.log(`   └─ 저장된 프로젝트 총 개수: ${projects.length}`);
  console.log(`   └─ 같은 ID 프로젝트: ${sameIdCount}개 (올바름)`);
});

// 7. 여러 프로젝트 저장
test('Step 7: 추가 프로젝트 저장 (여러 프로젝트)', () => {
  const project2 = saveProject({
    projectName: '프로젝트 2',
    product: { name: '상품2', mainCategory: '건강·영양식품', subCategory: '일반 건강식품' },
    draft: { hero_headline: '헤드라인 2' },
  });

  const project3 = saveProject({
    projectName: '프로젝트 3',
    product: { name: '상품3', mainCategory: '신선식품', subCategory: '과일' },
    draft: { hero_headline: '헤드라인 3' },
  });

  const projects = loadProjects();
  if (projects.length < 3) throw new Error('프로젝트가 충분하지 않음');
  
  console.log(`   └─ 저장된 프로젝트 총 개수: ${projects.length}`);
  console.log(`   └─ 최신 프로젝트: ${projects[0].projectName} (가장 위에)`);
});

// 8. Event Dispatch 확인 (CustomEvent 시뮬레이션)
let eventFired = false;
test('Step 8: CustomEvent 발생 (dispatchSaved 시뮬레이션)', () => {
  global.window.dispatchEvent = (event) => {
    if (event.type === 'brand-engine-project-saved') {
      eventFired = true;
      console.log(`   └─ 이벤트 타입: ${event.type}`);
      console.log(`   └─ 이벤트 projectId: ${event.detail.projectId}`);
    }
  };

  // 저장할 때 자동으로 dispatchSaved가 호출됨
  const testProject = saveProject({
    projectName: '이벤트 테스트',
    product: { name: '상품', mainCategory: '건강·영양식품', subCategory: '일반 건강식품' },
    draft: null,
  });

  if (!eventFired) throw new Error('CustomEvent가 발생하지 않음');
});

// 9. 저장 실패 케이스 처리
test('Step 9: 저장 검증 실패 시 에러 던짐', () => {
  // quota exceeded 시뮬레이션
  const originalSetItem = global.localStorage.setItem;
  let callCount = 0;
  
  global.localStorage.setItem = () => {
    callCount++;
    if (callCount === 1) {
      const error = new Error('QuotaExceededError');
      error.name = 'QuotaExceededError';
      throw error;
    }
  };

  try {
    saveProject({
      projectName: '저장 테스트',
      product: { name: '상품', mainCategory: '건강·영양식품', subCategory: '일반 건강식품' },
      draft: null,
    });
    throw new Error('에러를 던져야 함');
  } catch (e) {
    if (e.message.includes('저장 후 확인에 실패')) {
      console.log(`   └─ 올바른 에러 처리됨`);
    } else if (e.message.includes('에러를 던져야 함')) {
      throw e;
    }
  } finally {
    global.localStorage.setItem = originalSetItem;
  }
});

// 10. 최종 상태 확인
test('Step 10: 최종 상태 확인', () => {
  const projects = loadProjects();
  const raw = global.localStorage.getItem('dpg_projects');
  const parsedSize = JSON.stringify(projects).length;

  console.log(`   └─ 총 저장된 프로젝트: ${projects.length}개`);
  console.log(`   └─ localStorage 크기: ${parsedSize} bytes`);
  console.log(`   └─ 첫 번째 프로젝트: ${projects[0]?.projectName}`);
  console.log(`   └─ 마지막 프로젝트: ${projects[projects.length - 1]?.projectName}`);
  
  if (projects.length === 0) throw new Error('프로젝트가 없음');
});

// ─────────────────────────────────────────────────────────────
// 결과 출력
// ─────────────────────────────────────────────────────────────
console.log('\n' + '='.repeat(70));
console.log(`\n📊 런타임 테스트 결과:`);
console.log(`   ✅ PASS: ${testsPassed}개`);
console.log(`   ❌ FAIL: ${testsFailed}개`);
console.log(`   📈 성공률: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%\n`);

if (testsFailed === 0) {
  console.log('🎉 모든 런타임 테스트 통과!');
  console.log('✅ 저장 버튼 클릭 → saveProject 호출 → localStorage 저장 → 이벤트 발생');
  console.log('✅ 모든 단계가 정상 작동합니다!\n');
  process.exit(0);
} else {
  console.log(`⚠️  ${testsFailed}개 항목 실패. 위 내용을 확인하세요.\n`);
  process.exit(1);
}
