export const dataMode=import.meta.env.VITE_DATA_MODE==='demo'?'demo':'api';
export class APIError extends Error {constructor(public status:number,public code:string,message:string){super(message);}}
export async function request<T>(path:string,init?:RequestInit):Promise<T>{
 const response=await fetch((import.meta.env.VITE_API_BASE_URL||'')+'/api/v1'+path,{...init,credentials:'same-origin',headers:{'Content-Type':'application/json',...init?.headers}});
 const payload=await response.json().catch(()=>null);
 if(!response.ok)throw new APIError(response.status,payload?.error?.code||'HTTP_ERROR',payload?.error?.message||'Request failed');
 return payload as T;
}
export type SystemInfo={name:string;version:string;stage:string;capabilities:Record<string,boolean>};
