import test from 'node:test';
import assert from 'node:assert/strict';
import {seedWork} from '../../web/src/features/work/seed.ts';
import {assignPositions} from '../../web/src/features/work/actions.ts';
test('assigning existing members requires project management and does not change existing work identities',()=>{
  const state=seedWork();
  assert.equal(assignPositions(state,'leaf','周宁',['build-role']).error,'permission');
  state.currentUser='林然';
  const result=assignPositions(state,'leaf','林然',['build-role']);
  assert.ok(result.state);
  assert.deepEqual(result.state.seats.slice(0,state.seats.length),state.seats);
  assert.deepEqual(result.state.projects,state.projects);
  assert.equal(result.state.seats.at(-1).person,'林然');
  assert.equal(assignPositions(result.state,'leaf','林然',['build-role']).error,'required');
  assert.equal(assignPositions(state,'leaf','项目外的人',['build-role']).error,'required');
  assert.equal(assignPositions(state,'leaf','林然',['brand-role']).error,'scope');
});
