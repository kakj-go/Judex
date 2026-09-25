import {useState,useEffect} from 'react';
import {Button,Card,Input,Label,TextField} from '@heroui/react';
import {useMutation,useQuery} from '@tanstack/react-query';
import WorkApp from '../features/work/App';
import {usePreferences} from '../stores/preferences';
import {translate} from '../i18n';
import {APIError,dataMode,request,type SystemInfo} from '../lib/api/client';

export default function App(){
 const {locale,theme,setLocale,setTheme}=usePreferences();const t=(key:Parameters<typeof translate>[1])=>translate(locale,key);
 useEffect(()=>{document.documentElement.lang=locale;document.documentElement.dataset.theme=theme;document.documentElement.classList.toggle('dark',theme==='dark');},[locale,theme]);
 const [screen,setScreen]=useState<'login'|'register'|null>(()=>location.pathname==='/register'?'register':location.pathname==='/login'?'login':null);
 const system=useQuery({queryKey:['system'],queryFn:()=>request<SystemInfo>('/system'),retry:false});
 if(dataMode==='demo'&&!screen)return <><div className="judex-preview-banner" role="status">{t('shellPreview')}<Button size="sm" variant="ghost" onPress={()=>setScreen('login')}>{t('shellLogin')}</Button></div><WorkApp/></>;
 return <main className="judex-entry min-h-screen flex flex-col items-center justify-center gap-6 p-8">
  <div className="judex-entry-controls"><Button variant="ghost" onPress={()=>setLocale(locale==='en'?'zh-CN':'en')}>{locale==='en'?'中文':'EN'}</Button><Button variant="ghost" onPress={()=>setTheme(theme==='dark'?'light':'dark')}>{theme==='dark'?'☀':'☾'}</Button></div>
  <Card className="judex-entry-card"><Card.Header><Card.Title>{t('shellTitle')}</Card.Title><Card.Description>{t('shellWelcome')}</Card.Description></Card.Header><Card.Content>
  <p>{t('shellDescription')}</p><div className="judex-connection" data-testid="backend-status">{system.isPending?t('shellLoading'):system.isError?t('shellNetwork'):t('shellConnected')+' · '+system.data.version}</div>
  {screen?<AuthForm kind={screen}/>:<div className="judex-entry-actions"><Button onPress={()=>setScreen('login')}>{t('shellLogin')}</Button><Button variant="secondary" onPress={()=>setScreen('register')}>{t('shellRegister')}</Button></div>}
  {screen&&<Button variant="ghost" onPress={()=>setScreen(null)}>{t('shellBack')}</Button>}
  </Card.Content></Card><small>{t('shellApiMode')} · Apache-2.0</small>
 </main>;
}
function AuthForm({kind}:{kind:'login'|'register'}){
 const {locale}=usePreferences();const t=(key:Parameters<typeof translate>[1])=>translate(locale,key);const [name,setName]=useState(''),[email,setEmail]=useState(''),[password,setPassword]=useState('');
 const mutation=useMutation({mutationFn:()=>request('/auth/'+kind,{method:'POST',body:JSON.stringify({name,email,password})}),onSettled:()=>setPassword('')});
 return <form className="judex-auth-form" onSubmit={e=>{e.preventDefault();mutation.mutate();}}>
  {kind==='register'&&<TextField isRequired name="name" value={name} onChange={setName}><Label>{t('shellName')}</Label><Input autoComplete="name"/></TextField>}
  <TextField isRequired type="email" name="email" value={email} onChange={setEmail}><Label>{t('shellEmail')}</Label><Input autoComplete="email"/></TextField>
  <TextField isRequired name="password" type="password" value={password} onChange={setPassword}><Label>{t('shellPassword')}</Label><Input autoComplete={kind==='login'?'current-password':'new-password'}/></TextField>
  <Button type="submit" isPending={mutation.isPending}>{t(mutation.isPending?'shellPending':'shellSubmit')}</Button>
  {mutation.isError&&<p role="alert">{t(mutation.error instanceof APIError&&mutation.error.code==='NOT_IMPLEMENTED'?'shellUnavailable':'shellNetwork')}</p>}
  <small>{t('shellAuthNote')}</small>
 </form>;
}
