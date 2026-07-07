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
    code + '\nthis.__exp = { esc, skey, migrate, dreadSum, dreadComplete, fresh, maxDread, maxDreadBy, cnt, catMax, sane, uid, crosses, emptyThreat, rmTid, coverage, statusCount, reportStats, topThreats, initialTheme, STATUSES, get state(){return state}, set state(v){state=v}, CATS, getT };',
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
  assert.deepEqual({ ...list[0], id:undefined }, { id:undefined, title:'', description:'d', controls:'c', gaps:'g', dread:{ dmg:1 }, status:'open', mitigation:'', owner:'' });
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

test('migrate satter status:open + tom mitigation/owner pa gamla hot', () => {
  const s = { threats: { 'c:abc_S': [{ id:'t1', title:'x' }] } };
  M.migrate(s);
  const t = s.threats['c:abc_S'][0];
  assert.equal(t.status, 'open');
  assert.equal(t.mitigation, '');
  assert.equal(t.owner, '');
});

test('migrate normaliserar okant status till open', () => {
  const s = { threats: { 'c:abc_S': [{ id:'t1', status:'bogus' }] } };
  M.migrate(s);
  assert.equal(s.threats['c:abc_S'][0].status, 'open');
});

test('migrate bevarar giltigt status', () => {
  const s = { threats: { 'c:abc_S': [{ id:'t1', status:'accepted', mitigation:'m', owner:'o' }] } };
  M.migrate(s);
  const t = s.threats['c:abc_S'][0];
  assert.equal(t.status, 'accepted');
  assert.equal(t.mitigation, 'm');
  assert.equal(t.owner, 'o');
});

test('migrate satter analysisDone:false pa gamla komponenter', () => {
  const s = { components: [{ id:'abc', name:'API' }] };
  M.migrate(s);
  assert.equal(s.components[0].analysisDone, false);
});

test('migrate bevarar analysisDone:true', () => {
  const s = { components: [{ id:'abc', name:'API', analysisDone:true }] };
  M.migrate(s);
  assert.equal(s.components[0].analysisDone, true);
});

test('migrate ar idempotent pa livscykelfalt', () => {
  const s = { threats: { 'c:abc_S': [{ id:'t1' }] }, components: [{ id:'abc' }] };
  M.migrate(s);
  const snap = JSON.stringify(s);
  M.migrate(s);
  assert.equal(JSON.stringify(s), snap);
});

test('sane accepterar giltiga statusvarden', () => {
  for (const st of ['open','accepted','mitigated'])
    assert.equal(M.sane({ ...M.fresh(), threats:{ 'c:abc_S':[{ id:'t1', status:st }] } }), true);
});

test('sane avvisar ogiltigt status', () => {
  assert.equal(M.sane({ ...M.fresh(), threats:{ 'c:abc_S':[{ id:'t1', status:'bogus' }] } }), false);
});

test('sane avvisar icke-strang mitigation/owner', () => {
  assert.equal(M.sane({ ...M.fresh(), threats:{ 'c:abc_S':[{ id:'t1', mitigation:5 }] } }), false);
  assert.equal(M.sane({ ...M.fresh(), threats:{ 'c:abc_S':[{ id:'t1', owner:{} }] } }), false);
});

test('sane avvisar icke-boolean analysisDone', () => {
  assert.equal(M.sane({ ...M.fresh(), components:[{ id:'abc', analysisDone:'true' }] }), false);
  assert.equal(M.sane({ ...M.fresh(), components:[{ id:'abc', analysisDone:true }] }), true);
});

test('coverage: utan hot & !analysisDone → unanalyzed', () => {
  M.state = M.fresh();
  assert.equal(M.coverage({ id:'abc' }), 'unanalyzed');
  assert.equal(M.coverage({ id:'abc', analysisDone:false }), 'unanalyzed');
});

test('coverage: med hot & !analysisDone → started', () => {
  M.state = { ...M.fresh(), threats:{ 'c:abc_S':[{ id:'t1' }] } };
  assert.equal(M.coverage({ id:'abc' }), 'started');
});

test('coverage: analysisDone:true → analyzed (med/utan hot)', () => {
  M.state = M.fresh();
  assert.equal(M.coverage({ id:'abc', analysisDone:true }), 'analyzed');
  M.state = { ...M.fresh(), threats:{ 'c:abc_S':[{ id:'t1' }] } };
  assert.equal(M.coverage({ id:'abc', analysisDone:true }), 'analyzed');
});

test('statusCount raknar hot per status over flera kategorier', () => {
  M.state = { ...M.fresh(), threats:{
    'c:abc_S':[{ id:'a', status:'open' }, { id:'b', status:'accepted' }],
    'c:abc_T':[{ id:'c', status:'mitigated' }, { id:'d', status:'open' }],
  } };
  assert.equal(JSON.stringify(M.statusCount('c', 'abc')), JSON.stringify({ open:2, accepted:1, mitigated:1 }));
});

test('statusCount defaultar hot utan status till open', () => {
  M.state = { ...M.fresh(), threats:{ 'c:abc_S':[{ id:'a' }] } };
  assert.equal(JSON.stringify(M.statusCount('c', 'abc')), JSON.stringify({ open:1, accepted:0, mitigated:0 }));
});

test('maxDreadBy: max over open+accepted, exkluderar mitigated', () => {
  M.state = { ...M.fresh(), threats: {
    [M.skey('c','c1','S')]: [{ id:'a', status:'open',      dread:{ dmg:2, rep:2, aff:2, exp:2, dis:2 } }],  // 10
    [M.skey('c','c1','T')]: [{ id:'b', status:'accepted',  dread:{ dmg:3, rep:3, aff:3, exp:3, dis:3 } }],  // 15
    [M.skey('c','c1','E')]: [{ id:'c', status:'mitigated', dread:{ dmg:9, rep:9, aff:9, exp:9, dis:9 } }],  // 45
  } };
  assert.equal(M.maxDreadBy('c', 'c1', ['open','accepted']), 15);
  assert.equal(M.maxDreadBy('c', 'c1', ['open']), 10);
  assert.equal(M.maxDreadBy('c', 'c1', ['accepted']), 15);
  assert.equal(M.maxDreadBy('c', 'c1', ['mitigated']), 45);
});

test('maxDreadBy: hot utan status raknas som open', () => {
  M.state = { ...M.fresh(), threats: {
    [M.skey('c','c1','S')]: [{ id:'a', dread:{ dmg:1, rep:1, aff:1, exp:1, dis:1 } }], // 5
  } };
  assert.equal(M.maxDreadBy('c', 'c1', ['open']), 5);
  assert.equal(M.maxDreadBy('c', 'c1', ['accepted']), 0);
});

test('maxDreadBy: 0 nar inga hot matchar statuslistan', () => {
  M.state = { ...M.fresh(), threats: {
    [M.skey('c','c1','S')]: [{ id:'a', status:'mitigated', dread:{ dmg:5, rep:5, aff:5, exp:5, dis:5 } }],
  } };
  assert.equal(M.maxDreadBy('c', 'c1', ['open','accepted']), 0);
  assert.equal(M.maxDreadBy('c', 'nope', ['open','accepted']), 0);
});

test('STATUSES har de tre livscykel-lagena', () => {
  assert.equal(JSON.stringify(M.STATUSES.map(s => s.id)), JSON.stringify(['open','accepted','mitigated']));
});

const hi = { dmg:5, rep:5, aff:5, exp:5, dis:5 }; // dreadSum 25 == default threshold

test('reportStats: komponenttackning per lage', () => {
  M.state = { ...M.fresh(), components:[
    { id:'c1', analysisDone:true },              // analyzed, inga hot
    { id:'c2' },                                  // started (har hot)
    { id:'c3' },                                  // unanalyzed
  ], threats:{ [M.skey('c','c2','S')]:[{ id:'a', status:'open', dread:hi }] } };
  const s = M.reportStats();
  assert.equal(s.comps, 3);
  assert.equal(s.analyzed, 1);
  assert.equal(s.started, 1);
  assert.equal(s.unanalyzed, 1);
  assert.equal(s.analyzedNoThreat, 1);
});

test('reportStats: statusfordelning over komponenter + floden', () => {
  M.state = { ...M.fresh(),
    components:[{ id:'c1' }],
    flows:[{ id:'f1', from:'c1', to:'c1' }],
    threats:{
      [M.skey('c','c1','S')]:[{ id:'a', status:'open' }, { id:'b', status:'accepted' }],
      [M.skey('f','f1','T')]:[{ id:'c', status:'mitigated' }, { id:'d' }],
    } };
  const s = M.reportStats();
  assert.equal(s.open, 2);      // 'a' + 'd' (default)
  assert.equal(s.accepted, 1);
  assert.equal(s.mitigated, 1);
});

test('topThreats: sorterar fallande pa dreadSum', () => {
  M.state = { ...M.fresh(), components:[{ id:'c1', name:'API' }], threats:{
    [M.skey('c','c1','S')]:[{ id:'a', status:'open', dread:{ dmg:1, rep:1, aff:1, exp:1, dis:1 } }], // 5
    [M.skey('c','c1','T')]:[{ id:'b', status:'open', dread:{ dmg:4, rep:4, aff:4, exp:4, dis:4 } }], // 20
    [M.skey('c','c1','E')]:[{ id:'c', status:'open', dread:{ dmg:2, rep:2, aff:2, exp:2, dis:2 } }], // 10
  } };
  assert.equal(JSON.stringify(M.topThreats(10).map(t => t.score)), JSON.stringify([20, 10, 5]));
});

test('topThreats: exkluderar mitigerade, inkluderar open+accepted', () => {
  M.state = { ...M.fresh(), components:[{ id:'c1', name:'API' }], threats:{
    [M.skey('c','c1','S')]:[{ id:'a', status:'open',      dread:hi }],
    [M.skey('c','c1','T')]:[{ id:'b', status:'accepted',  dread:hi }],
    [M.skey('c','c1','E')]:[{ id:'c', status:'mitigated', dread:hi }],
  } };
  const ids = M.topThreats(10).map(t => t.status);
  assert.equal(ids.length, 2);
  assert.ok(ids.includes('open') && ids.includes('accepted') && !ids.includes('mitigated'));
});

test('topThreats: hot utan status raknas som open', () => {
  M.state = { ...M.fresh(), components:[{ id:'c1', name:'API' }], threats:{
    [M.skey('c','c1','S')]:[{ id:'a', dread:hi }],
  } };
  const top = M.topThreats(10);
  assert.equal(top.length, 1);
  assert.equal(top[0].status, 'open');
});

test('topThreats: blandar komponent- och flodeshot', () => {
  M.state = { ...M.fresh(),
    components:[{ id:'c1', name:'API', bid:'b1' }, { id:'c2', name:'DB', bid:'b2' }],
    flows:[{ id:'f1', from:'c1', to:'c2', label:'SQL' }],
    threats:{
      [M.skey('c','c1','S')]:[{ id:'a', status:'open', dread:{ dmg:3, rep:3, aff:3, exp:3, dis:3 } }], // 15
      [M.skey('f','f1','T')]:[{ id:'b', status:'open', dread:{ dmg:5, rep:5, aff:5, exp:5, dis:5 } }], // 25
    } };
  const top = M.topThreats(10);
  assert.equal(top.length, 2);
  assert.equal(top[0].kind, 'f');
  assert.equal(top[0].subject, 'API → DB (SQL)');
  assert.equal(top[0].crossing, true);
  assert.equal(top[1].kind, 'c');
  assert.equal(top[1].subject, 'API');
});

test('topThreats: titellost hot far Hot N-fallback bara nar kategorin har flera', () => {
  M.state = { ...M.fresh(), components:[{ id:'c1', name:'API' }], threats:{
    [M.skey('c','c1','S')]:[{ id:'a', status:'open', dread:{ dmg:1, rep:1, aff:1, exp:1, dis:1 } }], // ensamt → ''
    [M.skey('c','c1','T')]:[
      { id:'b', title:'Namngivet', status:'open', dread:{ dmg:2, rep:2, aff:2, exp:2, dis:2 } },
      { id:'c', status:'open', dread:{ dmg:3, rep:3, aff:3, exp:3, dis:3 } }, // titellost, index 1 → 'Hot 2'
    ],
  } };
  const flat = M.topThreats(10);
  assert.equal(flat.find(t => t.cat === 'S').title, '');                    // ensamt titellost
  assert.ok(flat.some(t => t.cat === 'T' && t.title === 'Hot 2'));          // flera → Hot N
});

test('topThreats: respekterar limit', () => {
  M.state = { ...M.fresh(), components:[{ id:'c1', name:'API' }], threats:{
    [M.skey('c','c1','S')]:[{ id:'a', status:'open', dread:hi }, { id:'b', status:'open', dread:hi }, { id:'c', status:'open', dread:hi }],
  } };
  assert.equal(M.topThreats(2).length, 2);
});

test('topThreats: tom vid inga oppna/accepterade', () => {
  M.state = { ...M.fresh(), components:[{ id:'c1', name:'API' }], threats:{
    [M.skey('c','c1','S')]:[{ id:'a', status:'mitigated', dread:hi }],
  } };
  assert.equal(M.topThreats(10).length, 0);
  M.state = M.fresh();
  assert.equal(M.topThreats(10).length, 0);
});

test('initialTheme: sparat val vinner over systempreferens', () => {
  assert.equal(M.initialTheme('light', true), 'light');
  assert.equal(M.initialTheme('dark', false), 'dark');
});

test('initialTheme: utan sparat val foljer prefersDark', () => {
  assert.equal(M.initialTheme(null, true), 'dark');
  assert.equal(M.initialTheme(null, false), 'light');
  assert.equal(M.initialTheme('bogus', true), 'dark'); // ogiltigt sparat → systemet
});

test('reportStats: kritiska skiljer oppna fran atgardade', () => {
  M.state = { ...M.fresh(), components:[{ id:'c1' }], threats:{
    [M.skey('c','c1','S')]:[{ id:'a', status:'open',      dread:hi }],  // kritisk + oppen
    [M.skey('c','c1','T')]:[{ id:'b', status:'accepted',  dread:hi }],  // kritisk, ej oppen
    [M.skey('c','c1','E')]:[{ id:'c', status:'mitigated', dread:hi }],  // ej kritisk (mitigerad)
  } };
  const s = M.reportStats();
  assert.equal(s.crit, 2);      // open + accepted >= threshold
  assert.equal(s.critOpen, 1);  // bara open
});
