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
    code + '\nthis.__exp = { esc, skey, migrate, dreadSum, dreadComplete, fresh, maxDread, cnt, catMax, sane, uid, crosses, emptyThreat, rmTid, get state(){return state}, set state(v){state=v}, CATS, getT };',
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
  assert.equal(M.esc("'"), '&#39;');
});

test('esc lamnar vanlig text orord', () => {
  assert.equal(M.esc('hello world 123'), 'hello world 123');
});

test('skey bygger typad nyckel kind:id_cat', () => {
  assert.equal(M.skey('c', 'abc', 'S'), 'c:abc_S');
  assert.equal(M.skey('f', 'def', 'T'), 'f:def_T');
});

test('migrate typar om gamla otypade nycklar till komponenthot (och lindar value)', () => {
  const s = { threats: { 'abc123_S': { x:1 } } };
  M.migrate(s);
  assert.deepEqual(Object.keys(s.threats), ['c:abc123_S']);
  const [t] = s.threats['c:abc123_S'];
  assert.match(t.id, /^[a-z0-9]{1,9}$/);
  assert.equal(t.title, '');
  assert.equal(t.x, 1);
});

test('migrate lamnar redan typade nycklar (lindar value till array)', () => {
  const s = { threats: { 'c:abc_S': { a:1 }, 'f:def_T': { b:2 } } };
  M.migrate(s);
  assert.deepEqual(Object.keys(s.threats).sort(), ['c:abc_S', 'f:def_T']);
  assert.equal(s.threats['c:abc_S'][0].a, 1);
  assert.equal(s.threats['f:def_T'][0].b, 2);
});

test('migrate lindar enstaka hotobjekt till array med ett element', () => {
  const s = { threats: { 'c:abc_S': { description:'d', controls:'c', gaps:'g', dread:{ dmg:1 } } } };
  M.migrate(s);
  const list = s.threats['c:abc_S'];
  assert.ok(Array.isArray(list) && list.length === 1);
  assert.deepEqual({ ...list[0], id:undefined }, { id:undefined, title:'', description:'d', controls:'c', gaps:'g', dread:{ dmg:1 } });
});

test('migrate ar idempotent pa arrayer', () => {
  const s = { threats: { 'abc123_S': { x:1 } } };
  M.migrate(s);
  const snap = JSON.stringify(s.threats);
  M.migrate(s);
  assert.equal(JSON.stringify(s.threats), snap);
});

test('migrate tar bort tom-array-key', () => {
  const s = { threats: { 'c:abc_S': [], 'c:abc_T': [{ id:'x1', title:'' }] } };
  M.migrate(s);
  assert.deepEqual(Object.keys(s.threats), ['c:abc_T']);
});

test('migrate tar bort key med ogiltigt (icke-objekt) value', () => {
  const s = { threats: { 'c:abc_S': 42, 'c:abc_T': null } };
  M.migrate(s);
  assert.deepEqual(s.threats, {});
});

test('migrate: vid kollision bevaras den typade, otypad kastas', () => {
  const s = { threats: { 'abc_S': { description:'bare' }, 'c:abc_S': { description:'typed' } } };
  M.migrate(s);
  assert.deepEqual(Object.keys(s.threats), ['c:abc_S']);
  assert.equal(s.threats['c:abc_S'][0].description, 'typed');
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

test('dreadComplete: alla fem falt 1-10 ger true', () => {
  assert.equal(M.dreadComplete({ dread: { dmg:5, rep:5, aff:5, exp:5, dis:5 } }), true);
  assert.equal(M.dreadComplete({ dread: { dmg:1, rep:10, aff:3, exp:7, dis:2 } }), true);
});

test('dreadComplete: ofullstandig eller ogiltig ger false', () => {
  assert.equal(M.dreadComplete({ dread: { dmg:9 } }), false);              // bara ett falt
  assert.equal(M.dreadComplete({ dread: { dmg:5, rep:5, aff:5, exp:5, dis:11 } }), false); // utanfor 1-10
  assert.equal(M.dreadComplete({ dread: { dmg:5, rep:5, aff:5, exp:5, dis:0 } }), false);  // 0
});

test('dreadComplete: tom/saknad ger false', () => {
  assert.equal(M.dreadComplete(undefined), false);
  assert.equal(M.dreadComplete(null), false);
  assert.equal(M.dreadComplete({}), false);
  assert.equal(M.dreadComplete({ dread: {} }), false);
});

test('maxDread ger hogsta DREAD-summan bland kategorier', () => {
  M.state = {
    ...M.fresh(),
    threats: {
      [M.skey('c','c1','S')]: [{ id:'a', dread: { dmg:1, rep:1, aff:1, exp:1, dis:1 } }], // 5
      [M.skey('c','c1','E')]: [{ id:'b', dread: { dmg:5, rep:5, aff:5, exp:5, dis:5 } }], // 25
    },
  };
  assert.equal(M.maxDread('c', 'c1'), 25);
});

test('maxDread aggregerar over flera hot i samma lista', () => {
  M.state = {
    ...M.fresh(),
    threats: {
      [M.skey('c','c1','S')]: [
        { id:'a', dread: { dmg:1, rep:1, aff:1, exp:1, dis:1 } }, // 5
        { id:'b', dread: { dmg:4, rep:4, aff:4, exp:4, dis:4 } }, // 20
      ],
    },
  };
  assert.equal(M.maxDread('c', 'c1'), 20);
});

test('maxDread ger 0 nar komponenten saknar hot', () => {
  M.state = M.fresh();
  assert.equal(M.maxDread('c', 'nope'), 0);
});

test('catMax ger hogsta dreadSum inom en lista, 0 for tom/undefined', () => {
  assert.equal(M.catMax(undefined), 0);
  assert.equal(M.catMax([]), 0);
  assert.equal(M.catMax([
    { dread: { dmg:1, rep:1, aff:1, exp:1, dis:1 } }, // 5
    { dread: { dmg:2, rep:2, aff:2, exp:2, dis:2 } }, // 10
  ]), 10);
});

test('getT returnerar arrayen; cnt raknar flera hotobjekt', () => {
  M.state = {
    ...M.fresh(),
    threats: {
      'c:abc_S': [
        { id:'a', dread: { dmg:2, rep:2, aff:2, exp:2, dis:2 } }, // 10
        { id:'b', dread: { dmg:1, rep:1, aff:1, exp:1, dis:1 } }, // 5
      ],
      'c:abc_T': [{ id:'c', dread: { dmg:3, rep:3, aff:3, exp:3, dis:3 } }], // 15
    },
  };
  assert.ok(Array.isArray(M.getT('c', 'abc', 'S')));
  assert.equal(M.getT('c', 'abc', 'S').length, 2);
  assert.equal(M.getT('c', 'abc', 'D'), undefined);
  assert.equal(M.cnt('c', 'abc'), 3);
  assert.equal(M.maxDread('c', 'abc'), 15);
});

test('emptyThreat: helt tomt hot ar tomt, ifyllt falt gor det icke-tomt', () => {
  assert.equal(M.emptyThreat({ title:'', description:'', controls:'', gaps:'', dread:{} }), true);
  assert.equal(M.emptyThreat({ title:'', description:'', controls:'', gaps:'' }), true);
  assert.equal(M.emptyThreat({ title:'x', description:'', controls:'', gaps:'', dread:{} }), false);
  assert.equal(M.emptyThreat({ title:'', description:'d', controls:'', gaps:'' }), false);
  assert.equal(M.emptyThreat({ title:'', description:'', controls:'', gaps:'', dread:{ dmg:5 } }), false);
});

test('rmTid tar bort hotet med angivet id och lamnar resten', () => {
  const J = v => JSON.stringify(v);
  const list = [{ id:'a' }, { id:'b' }, { id:'c' }];
  assert.equal(J(M.rmTid(list, 'b')), J([{ id:'a' }, { id:'c' }]));
  assert.equal(J(M.rmTid(list, 'x')), J(list)); // okant id → orort (ny array)
  assert.equal(J(M.rmTid(undefined, 'a')), J([]));
  assert.equal(J(M.rmTid([{ id:'a' }], 'a')), J([])); // tom lista efter borttagning
});

test('sane godkanner fresh-state', () => {
  assert.equal(M.sane(M.fresh()), true);
});

test('sane godkanner tom och partiell state', () => {
  assert.equal(M.sane({}), true);
  assert.equal(M.sane({ name:'x', components:[{ id:'abc' }], pos:{} }), true); // utan flows/threats/bpos
});

test('uid matchar id-formatet', () => {
  for (let i = 0; i < 50; i++) assert.match(M.uid(), /^[a-z0-9]{1,9}$/);
});

test('sane godkanner giltig state med data', () => {
  assert.equal(M.sane({
    name:'Min analys',
    boundaries:[{ id:'b1a2c', name:'DMZ' }],
    components:[{ id:'c0mp1', name:'API', bid:'b1a2c' }, { id:'c0mp2', name:'DB', bid:null }],
    flows:[{ id:'f1x', from:'c0mp1', to:'c0mp2', label:'SQL' }],
    threats:{ 'c:c0mp1_S': [{ id:'t1', title:'', description:'spoofing', dread:{ dmg:1, rep:5, aff:10, exp:7, dis:3 } }] },
    pos:{ c0mp1:{ x:1, y:2 } }, bpos:{ b1a2c:{ x:0, y:0, w:1, h:1 } },
    threshold:25,
  }), true);
});

test('sane avvisar id med citationstecken', () => {
  assert.equal(M.sane({ ...M.fresh(), boundaries:[{ id:'x" onmouseover="alert(1)" data-x="', name:'x' }] }), false);
});

test('sane avvisar id med apostrof', () => {
  assert.equal(M.sane({ ...M.fresh(), components:[{ id:"a'b", name:'x' }] }), false);
});

test('sane godkanner typade threat-nycklar med listformat', () => {
  assert.equal(M.sane({ ...M.fresh(), threats:{ 'c:abc_S': [{ id:'t1' }] } }), true);
  assert.equal(M.sane({ ...M.fresh(), threats:{ 'f:def_T': [{ id:'t2', title:'x' }] } }), true);
});

test('sane accepterar flera hot i samma lista', () => {
  assert.equal(M.sane({ ...M.fresh(), threats:{ 'c:abc_S': [{ id:'t1' }, { id:'t2' }] } }), true);
});

test('sane avvisar value som inte ar array', () => {
  assert.equal(M.sane({ ...M.fresh(), threats:{ 'c:abc_S': {} } }), false);
  assert.equal(M.sane({ ...M.fresh(), threats:{ 'c:abc_S': { id:'t1' } } }), false);
});

test('sane avvisar tom array', () => {
  assert.equal(M.sane({ ...M.fresh(), threats:{ 'c:abc_S': [] } }), false);
});

test('sane avvisar hot med ogiltigt id', () => {
  assert.equal(M.sane({ ...M.fresh(), threats:{ 'c:abc_S': [{ id:'ABBB' }] } }), false);
  assert.equal(M.sane({ ...M.fresh(), threats:{ 'c:abc_S': [{ id:'a"b' }] } }), false);
  assert.equal(M.sane({ ...M.fresh(), threats:{ 'c:abc_S': [{}] } }), false); // id saknas
});

test('sane avvisar hot med icke-strang textfalt', () => {
  assert.equal(M.sane({ ...M.fresh(), threats:{ 'c:abc_S': [{ id:'t1', title:5 }] } }), false);
  assert.equal(M.sane({ ...M.fresh(), threats:{ 'c:abc_S': [{ id:'t1', description:{} }] } }), false);
});

test('sane avvisar threats-nyckel med fel format', () => {
  assert.equal(M.sane({ ...M.fresh(), threats:{ 'abc_S': [{ id:'t1' }] } }), false);   // otypad (post-v2)
  assert.equal(M.sane({ ...M.fresh(), threats:{ 'x:abc_S': [{ id:'t1' }] } }), false);  // fel prefix
  assert.equal(M.sane({ ...M.fresh(), threats:{ 'c:abc_X': [{ id:'t1' }] } }), false);  // fel kategori
  assert.equal(M.sane({ ...M.fresh(), threats:{ 'c:ABBB_S': [{ id:'t1' }] } }), false); // ogiltigt id
  assert.equal(M.sane({ ...M.fresh(), threats:{ 'c:a"b_S': [{ id:'t1' }] } }), false);
});

test('sane avvisar fel typ pa faltet', () => {
  assert.equal(M.sane({ ...M.fresh(), components:{ id:'abc' } }), false);
  assert.equal(M.sane({ ...M.fresh(), threats:[] }), false);
});

test('sane avvisar daliga id-varianter', () => {
  assert.equal(M.sane({ ...M.fresh(), flows:[{ id:'f1', from:'a"b', to:'abc' }] }), false);
  assert.equal(M.sane({ ...M.fresh(), flows:[{ id:'f1', from:'abc', to:42 }] }), false);
  assert.equal(M.sane({ ...M.fresh(), pos:{ 'a b':{ x:1, y:2 } } }), false);
  assert.equal(M.sane({ ...M.fresh(), components:[{ id:'abcdefghij' }] }), false); // 10 tecken
  assert.equal(M.sane({ ...M.fresh(), boundaries:[{ id:123 }] }), false);
});

test('sane avvisar ogiltiga dread-varden', () => {
  const t = d => ({ ...M.fresh(), threats:{ 'c:abc_S':[{ id:'t1', dread:d }] } });
  assert.equal(M.sane(t({ dmg:'" onfocus=alert(1) autofocus x="' })), false);
  assert.equal(M.sane(t({ dmg:0 })), false);
  assert.equal(M.sane(t({ dmg:11 })), false);
  assert.equal(M.sane({ ...M.fresh(), threats:{ 'c:abc_S':null } }), false);
  assert.equal(M.sane({ ...M.fresh(), threats:{ 'c:abc_S':[] } }), false);
});

test('sane avvisar ogiltig threshold', () => {
  assert.equal(M.sane({ ...M.fresh(), threshold:'25' }), false);
  assert.equal(M.sane({ ...M.fresh(), threshold:4 }), false);
  assert.equal(M.sane({ ...M.fresh(), threshold:51 }), false);
});

test('crosses: samma bid → false, olika bid → true', () => {
  M.state = { ...M.fresh(),
    components:[{ id:'a', bid:'b1' }, { id:'b', bid:'b1' }, { id:'c', bid:'b2' }] };
  assert.equal(M.crosses({ from:'a', to:'b' }), false);
  assert.equal(M.crosses({ from:'a', to:'c' }), true);
});

test('crosses: en null bid → true, båda null → false', () => {
  M.state = { ...M.fresh(),
    components:[{ id:'a', bid:'b1' }, { id:'b', bid:null }, { id:'c', bid:null }] };
  assert.equal(M.crosses({ from:'a', to:'b' }), true);
  assert.equal(M.crosses({ from:'b', to:'c' }), false);
});

test('crosses: saknad komponent → false', () => {
  M.state = { ...M.fresh(), components:[{ id:'a', bid:'b1' }] };
  assert.equal(M.crosses({ from:'a', to:'nope' }), false);
  assert.equal(M.crosses({ from:'nope', to:'a' }), false);
});

test('sane avvisar ogiltiga pos/bpos-varden', () => {
  assert.equal(M.sane({ ...M.fresh(), pos:{ abc:{ x:'10', y:2 } } }), false);
  assert.equal(M.sane({ ...M.fresh(), pos:{ abc:null } }), false);
  assert.equal(M.sane({ ...M.fresh(), bpos:{ abc:{ x:1, y:2 } } }), false); // saknar w/h
});
