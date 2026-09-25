import {defineConfig} from '@playwright/test';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../../',import.meta.url));
export default defineConfig({
 testDir:'.',testMatch:'*.spec.ts',timeout:40_000,workers:2,
 outputDir:'../results/e2e',reporter:[['list'],['html',{outputFolder:'../reports/e2e',open:'never'}]],
 use:{baseURL:'http://127.0.0.1:5174',browserName:'chromium',channel:process.env.PLAYWRIGHT_CHANNEL||'msedge',viewport:{width:1440,height:1000},screenshot:'only-on-failure',trace:'retain-on-failure'},
 webServer:[
  {command:'go run ./cmd/judex-server',cwd:root,url:'http://127.0.0.1:18080/healthz',reuseExistingServer:false,timeout:120_000,env:{JUDEX_HTTP_ADDR:'127.0.0.1:18080',JUDEX_ENV:'test',JUDEX_WEB_DIR:root+'web/dist'}},
  {command:'npm run dev:e2e --workspace @judex/web',cwd:root,url:'http://127.0.0.1:5174',reuseExistingServer:false,timeout:60_000,env:{JUDEX_API_PROXY:'http://127.0.0.1:18080'}},
 ],
});
