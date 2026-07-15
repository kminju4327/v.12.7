// V12 Project Storage Engine
// Single source of truth for project persistence.

const KEY = 'dpg_projects';
const LEGACY_KEYS = ['brand_engine_projects', 'brand_projects', 'projects'];
const MAX_PROJECTS = 20;
const SAVED_EVENT = 'brand-engine-project-saved';

// 메모리 기반 저장소 (StackBlitz localStorage 문제 대응)
const memoryStoreData = {};
const memoryStore = {
  getItem: (key) => memoryStoreData[key] || null,
  setItem: (key, value) => { memoryStoreData[key] = value; },
  removeItem: (key) => { delete memoryStoreData[key]; },
  clear: () => { Object.keys(memoryStoreData).forEach(k => delete memoryStoreData[k]); }
};

function getStorage() {
  // StackBlitz 등에서 localStorage가 제한되어 있을 수 있으므로
  // 1. localStorage 시도
  // 2. 실패하면 메모리 저장소 사용
  
  if (typeof window === 'undefined') {
    return memoryStore;
  }
  
  try {
    // localStorage 접근 테스트
    const testKey = '__ls_test_' + Date.now();
    window.localStorage.setItem(testKey, 'test');
    window.localStorage.removeItem(testKey);
    return window.localStorage;
  } catch (error) {
    console.warn('[ProjectStorage] localStorage 사용 불가, 메모리에 저장합니다:', error.message);
    return memoryStore;
  }
}

function parseProjectList(raw) {
  if (!raw) return [];
  const parsed = JSON.parse(raw);
  return Array.isArray(parsed) ? parsed : [];
}

function readStorage() {
  try {
    const storage = getStorage();
    const current = parseProjectList(storage.getItem(KEY));
    if (current.length > 0 || storage.getItem(KEY) !== null) return current;

    // Older builds used different keys. Import once so previously saved projects reappear.
    for (const legacyKey of LEGACY_KEYS) {
      const legacy = parseProjectList(storage.getItem(legacyKey));
      if (legacy.length > 0) {
        storage.setItem(KEY, JSON.stringify(legacy.slice(0, MAX_PROJECTS)));
        return legacy.slice(0, MAX_PROJECTS);
      }
    }
    return [];
  } catch (error) {
    console.warn('[ProjectStorage] storage read failed', error);
    return [];
  }
}

function makeSerializable(value) {
  const seen = new WeakSet();
  return JSON.parse(
    JSON.stringify(value, (_key, item) => {
      if (typeof item === 'function' || typeof item === 'symbol') return undefined;
      if (typeof item === 'bigint') return String(item);
      if (item && typeof item === 'object') {
        if (seen.has(item)) return undefined;
        seen.add(item);
      }
      return item;
    })
  );
}

function dispatchSaved(projectId) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(SAVED_EVENT, { detail: { projectId } }));
}

function writeStorage(projects, projectId) {
  const storage = getStorage();
  let next = projects.slice(0, MAX_PROJECTS);

  // If the browser quota is tight, keep the newest projects rather than failing silently.
  while (next.length > 0) {
    try {
      storage.setItem(KEY, JSON.stringify(next));
      dispatchSaved(projectId);
      return next;
    } catch (error) {
      const quotaError = error?.name === 'QuotaExceededError' || error?.code === 22;
      if (!quotaError || next.length === 1) throw error;
      next = next.slice(0, -1);
    }
  }

  storage.setItem(KEY, '[]');
  dispatchSaved(projectId);
  return [];
}

export function saveProject(project = {}) {
  const list = readStorage();
  const now = new Date().toISOString();
  const projectId = project.projectId || `project_${Date.now()}`;
  const previous = list.find((item) => item.projectId === projectId);

  const savedProject = makeSerializable({
    ...project,
    projectId,
    updatedAt: now,
    createdAt: project.createdAt || previous?.createdAt || now,
  });

  const next = list.filter((item) => item.projectId !== projectId);
  next.unshift(savedProject);
  writeStorage(next, projectId);

  // Verify the same record can immediately be read back.
  const verified = readStorage().find((item) => item.projectId === projectId);
  if (!verified) throw new Error('프로젝트 저장 후 확인에 실패했습니다.');
  return verified;
}

export function loadProjects() {
  return readStorage();
}

export function getProject(projectId) {
  return readStorage().find((project) => project.projectId === projectId) || null;
}

export function deleteProject(projectId) {
  const next = readStorage().filter((project) => project.projectId !== projectId);
  return writeStorage(next, projectId);
}

export { KEY as PROJECT_STORAGE_KEY, SAVED_EVENT as PROJECT_SAVED_EVENT };
