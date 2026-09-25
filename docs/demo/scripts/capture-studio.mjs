import {chromium} from '@playwright/test';
import {mkdir} from 'node:fs/promises';
await mkdir('.runtime/screenshots',{recursive:true});
const browser=await chromium.launch({channel:'msedge'});
try{const p=await browser.newPage({viewport:{width:1680,height:1100}});
for(const [name,url] of [['home','/?design=studio'],['tree','/?design=studio&view=plan&item=leaf-first'],['tasks','/?design=studio&view=tasks']]){await p.goto('http://127.0.0.1:4173'+url);await p.locator('.judex-next-app').waitFor();await p.screenshot({path:'.runtime/screenshots/studio2-'+name+'.png',animations:'disabled'});}
await p.goto('http://127.0.0.1:4173/?design=studio&view=plan&item=leaf-first');await p.getByRole('button',{name:'展开画布',exact:true}).click();await p.getByRole('button',{name:'适应画布',exact:true}).click();await p.screenshot({path:'.runtime/screenshots/studio2-tree-expanded.png',animations:'disabled'});
await p.getByRole('button',{name:'收起画布',exact:true}).click();await p.getByTestId('next-language').click();await p.getByTestId('next-theme').click();await p.screenshot({path:'.runtime/screenshots/studio2-dark-en.png',animations:'disabled'});
}finally{await browser.close();}
