// Noll-beroende enhetstester for STRIDE-tool.
// Korning: node --test test.mjs
//
// Metod: vi laser index.html, klipper ut script-innehallet fram till
// "── Init ──"-blocket (sa init aldrig kors) och evaluerar det i en
// node:vm-context med stubbar for document/localStorage/window m.fl.
// De rena funktionerna exponeras sedan via en tillagd retur-rad.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

function loadSandbox() {
  const html = readFileSync(new URL('./index.html', import.meta.url), 'utf8');
  const open = html.indexOf('<script>') + '<script>'.length;
  const body = html.slice(open);
  const initIdx = body.indexOf('// ── Init ──');
  assert.ok(initIdx > 0, 'kunde inte hitta Init-markoren');
  const code = body.slice(0, initIdx);

  // Stub-element: alla DOM-uppslag pa toppniva ar addEventListener/value/style.
  const stubEl = { addEventListener() {}, value: '', style: {} };
  const sandbox = {
    document: { addEventListener() {}, getElementById: () => stubEl },
    localStorage: { getItem: () => null, setItem() {} },
    window: {}, requestAnimationFrame() {},
    confirm: () => false, alert() {}, prompt: () => null,
    Math, JSON, Number, String, Object, Array, console,
  };
  vm.createContext(sandbox);
  // Exponera de funktioner/globaler vi vill testa.
  vm.runInContext(
    code + '\nthis.__exp = { esc, tkey, dreadSum, fresh, maxDread, get state(){return state}, set state(v){state=v}, CATS, getT };',
    sandbox
  );
  return sandbox.__exp;
}

const M = loadSandbox();

test('esc escapar specialtecken', () => {
  assert.equal(M.esc('&'), '&amp;');
  assert.equal(M.esc('<'), '&lt;');
  assert.equal(M.esc('>'), '&gt;');
  assert.equal(M.esc('"'), '&quot;');
  assert.equal(M.esc('a & b <c> "d"'), 'a &amp; b &lt;c&gt; &quot;d&quot;');
});

test('esc lamnar vanlig text orord', () => {
  assert.equal(M.esc('hello world 123'), 'hello world 123');
});

test('tkey bygger nyckel cid_cat', () => {
  assert.equal(M.tkey('abc', 'S'), 'abc_S');
  assert.equal(M.tkey('x1', 'E'), 'x1_E');
});

test('dreadSum summerar de fem falten', () => {
  assert.equal(M.dreadSum({ dread: { dmg:5, rep:5, aff:5, exp:5, dis:5 } }), 25);
  assert.equal(M.dreadSum({ dread: { dmg:10, rep:10, aff:10, exp:10, dis:10 } }), 50);
});

test('dreadSum ger 0 for saknad/undefined/null', () => {
  assert.equal(M.dreadSum(undefined), 0);
  assert.equal(M.dreadSum(null), 0);
  assert.equal(M.dreadSum({}), 0);
  assert.equal(M.dreadSum({ dread: null }), 0);
});

test('dreadSum ignorerar icke-numeriska falt', () => {
  assert.equal(M.dreadSum({ dread: { dmg:3, rep:'x', aff:2 } }), 5);
});

test('fresh returnerar forvantad form', () => {
  const f = M.fresh();
  // fresh() skapas i vm-realmen, sa jamfor strukturellt via JSON.
  assert.deepEqual(JSON.parse(JSON.stringify(f)), {
    name:'', boundaries:[], components:[], threats:{},
    pos:{}, bpos:{}, flows:[], threshold:25,
  });
  assert.deepEqual([...Object.keys(f)].sort(), [
    'boundaries','bpos','components','flows','name','pos','threats','threshold',
  ]);
  // ny referens varje anrop
  assert.ok(M.fresh() !== f);
});

test('maxDread ger hogsta DREAD-summan bland kategorier', () => {
  M.state = {
    ...M.fresh(),
    threats: {
      [M.tkey('c1','S')]: { dread: { dmg:1, rep:1, aff:1, exp:1, dis:1 } }, // 5
      [M.tkey('c1','E')]: { dread: { dmg:5, rep:5, aff:5, exp:5, dis:5 } }, // 25
    },
  };
  assert.equal(M.maxDread('c1'), 25);
});

test('maxDread ger 0 nar komponenten saknar hot', () => {
  M.state = M.fresh();
  assert.equal(M.maxDread('nope'), 0);
});
