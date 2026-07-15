// V11.4 Project Manager Extension
// Single source storage bridge
import { saveProject, loadProjects } from "../../engines/v11/projectStorageEngine.js";

export const PROJECT_STORAGE_KEY_V114 = "dpg_projects";

export function saveProjectV114(project){
  return saveProject(project);
}

export function loadProjectsV114(){
  return loadProjects();
}
