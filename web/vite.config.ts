import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
const api=process.env.JUDEX_API_PROXY||'http://127.0.0.1:8080';
export default defineConfig({plugins:[react(),tailwindcss()],optimizeDeps:{include:['mermaid']},server:{proxy:{'/api':api,'/healthz':api,'/readyz':api}},build:{sourcemap:false}});
