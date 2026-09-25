import test from 'node:test';
import assert from 'node:assert/strict';
import {seedWork} from '../../web/src/features/work/seed.ts';
import {createWork} from '../../web/src/features/work/actions.ts';
import {layoutTasks,TREE} from '../../web/src/features/work/taskTreeLayout.ts';
test('horizontal hierarchy puts children to the right, supports arbitrary siblings and collapse',()=>{
 const tasks=seedWork().tasks.filter(t=>t.planId==='leaf-first');const result=layoutTasks(tasks);
 assert.equal(result.positions.size,tasks.length);
 for(const task of tasks){const node=result.positions.get(task.id);if(task.parentId)assert.ok(node.x>result.positions.get(task.parentId).x);}
 const boxes=[...result.positions.values()];for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++)if(boxes[i].x===boxes[j].x)assert.ok(Math.abs(boxes[i].y-boxes[j].y)>=TREE.cardHeight);
 const collapsed=layoutTasks(tasks,new Set(['build']));assert.equal(collapsed.positions.has('empty-state'),false);assert.equal(collapsed.positions.has('guide'),true);
});
test('invalid parent cycles terminate and remain inspectable',()=>{
 const tasks=structuredClone(seedWork().tasks.slice(0,2));tasks[0].parentId=tasks[1].id;tasks[1].parentId=tasks[0].id;
 const layout=layoutTasks(tasks);assert.equal(layout.positions.size,2);assert.equal(layout.invalid,true);
});
test('subtasks stay within the same project and plan and always begin as drafts',()=>{
 const state=seedWork();const draft={kind:'task',title:'验证异常恢复',description:'验证异常场景',criteria:'附验证依据',seatId:'maker',flowId:'delivery',planId:'leaf-first',parentId:'build'};
 const result=createWork(state,'leaf',draft);assert.equal(result.state.tasks.at(-1).parentId,'build');assert.equal(result.state.tasks.at(-1).status,'draft');
 assert.equal(createWork(state,'leaf',{...draft,planId:'leaf-next'}).error,'scope');assert.equal(createWork(state,'leaf',{...draft,planId:null}).error,'scope');assert.equal(createWork(state,'leaf',{...draft,kind:'plan'}).error,'scope');
});
