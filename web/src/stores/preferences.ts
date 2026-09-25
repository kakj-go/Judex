import {create} from 'zustand';
import type {Locale} from '../i18n';
const read=(key:string,fallback:string)=>{try{return localStorage.getItem(key)||fallback;}catch{return fallback;}};
const write=(key:string,value:string)=>{try{localStorage.setItem(key,value);}catch{/* Preferences are optional. */}};
type Preferences={locale:Locale;theme:'light'|'dark';setLocale:(locale:Locale)=>void;setTheme:(theme:string)=>void};
export const usePreferences=create<Preferences>(set=>({
 locale:read('argus.locale','zh-CN')==='en'?'en':'zh-CN',theme:read('judex.theme','light')==='dark'?'dark':'light',
 setLocale:locale=>{write('argus.locale',locale);set({locale});},setTheme:value=>{const theme=value==='dark'?'dark':'light';write('judex.theme',theme);set({theme});},
}));
