import {request,dataMode} from './client';
import {seedWork,WORK_KEY} from '../../features/work/seed';
import {normalizeWork} from '../../features/work/normalize';
import type {WorkState} from '../../features/work/types';
export const workspaceKey=['workspace',dataMode] as const;
export async function loadWorkspace():Promise<WorkState>{
 if(dataMode==='api')return request<WorkState>('/workspace');
 try{const cached=normalizeWork(JSON.parse(localStorage.getItem(WORK_KEY)||'null'));if(cached)return cached;}catch{/* A broken preview may be reset. */}
 return seedWork();
}
export function persistPreview(state:WorkState){if(dataMode!=='demo')throw new Error('Preview mutations are unavailable in API mode');localStorage.setItem(WORK_KEY,JSON.stringify(state));}
