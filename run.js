// Pruebas sin dependencias: extrae el <script> de index.html y lo ejecuta en un contexto aislado.
const vm = require('vm'), fs = require('fs'), path = require('path'), assert = require('assert');
const raiz = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(raiz, 'index.html'), 'utf8');
const bloques = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
const js = bloques[bloques.length - 1][1];

const stub = () => new Proxy(function () {}, {
  get: (t, p) => p === Symbol.toPrimitive ? () => '' : p === 'length' ? 0 : stub(),
  apply: () => stub(), set: () => true, construct: () => stub() });
const almacen = {};
const ctx = { document: stub(), navigator: {}, history: stub(), location: { protocol: 'file:' },
  localStorage: { getItem: k => almacen[k] || null, setItem: (k, v) => { almacen[k] = v; } },
  matchMedia: () => ({ matches: false }), requestAnimationFrame() {}, setTimeout() {}, setInterval() {}, clearInterval() {},
  addEventListener() {}, confirm: () => true, console, Math, JSON, Object, Array, String, Number, Date, Proxy, Symbol,
  isFinite, parseFloat, parseInt, Blob: function () {}, URL: {}, FileReader: function () {} };
ctx.window = ctx; vm.createContext(ctx);
vm.runInContext(js, ctx);
const ev = c => vm.runInContext(c, ctx, { timeout: 60000 });

let pruebas = 0, fallos = 0;
const prueba = (nombre, fn) => { try { fn(); pruebas++; console.log('  ✓', nombre); } catch (e) { console.error('  ✗', nombre, '\n   ', e.message); fallos++; process.exitCode = 1; } };

console.log('Generadores');
prueba('todos generan problemas válidos en las 3 dificultades (sin NaN, sin bucles, MC sin duplicados)', () => {
  const r = JSON.parse(ev(`(function(){const malos=[];let n=0;
    for(const d of ['f','m','d']){S.diff=d;for(const k of Object.keys(generadores)){for(let i=0;i<300;i++){
      let q;try{q=generadores[k]();}catch(e){malos.push([d,k,'EXC '+e.message]);break;} n++;
      if(/undefined|NaN|Infinity/.test(JSON.stringify(q.statement)+JSON.stringify(q.steps)))malos.push([d,k,'texto',q.statement]);
      if(!q.mc&&!q.answer.every(a=>typeof a==='number'&&isFinite(a)))malos.push([d,k,'respuesta',q.statement]);
      if(q.mc&&(new Set(q.mc).size!==q.mc.length||q.mc[q.ci]!==q.answer[0]))malos.push([d,k,'mc',q.statement]);
      if(!q.steps||!q.steps.length)malos.push([d,k,'sin pasos']);}}}
    S.diff='m';return JSON.stringify({n,malos:malos.slice(0,5)});})()`));
  assert.deepStrictEqual(r.malos, []); assert(r.n > 30000);
});
prueba('cada tema tiene teoría', () => {
  assert.deepStrictEqual(JSON.parse(ev(`JSON.stringify(Object.keys(generadores).filter(k=>!TEO[k]))`)), []);
});
prueba('con la misma semilla se repite exactamente el mismo problema (base del repaso espaciado)', () => {
  const r = JSON.parse(ev(`(function(){const malos=[];for(const d of ['f','m','d'])for(const k of Object.keys(generadores))for(let i=0;i<40;i++){
    const s=Math.floor(Math.random()*4294967296),a=crea(k,s,d),b=crea(k,s,d);
    const f=q=>JSON.stringify([q.statement,q.answer,q.mc,q.steps]);if(f(a)!==f(b))malos.push([d,k,s]);}
    return JSON.stringify(malos.slice(0,5));})()`));
  assert.deepStrictEqual(r, []);
});
prueba('el modo Fácil usa números más pequeños en promedio', () => {
  assert(ev(`(function(){const m=d=>{S.diff=d;let t=0;for(let i=0;i<3000;i++)t+=Math.abs(ri(-9,30));return t/3000;};const f=m('f'),n=m('m');S.diff='m';return f<n;})()`));
});

console.log('Ruta de aprendizaje');
prueba('todos los temas están en alguna etapa y no hay temas inexistentes', () => {
  const r = JSON.parse(ev(`JSON.stringify({falta:Object.keys(generadores).filter(k=>!RUTA.some(e=>e.t.includes(k))),sobra:RUTA.flatMap(e=>e.t).filter(k=>!generadores[k])})`));
  assert.deepStrictEqual(r, { falta: [], sobra: [] });
});
prueba('las etapas se desbloquean en orden', () => {
  assert(ev(`(function(){const g=S.topics;S.topics={};const a=etapaAbierta(1),b=etapaAbierta(0);
    RUTA[0].t.forEach(k=>S.topics[k]={ok:10,err:2});const c=etapaDominada(0)&&etapaAbierta(1)&&!etapaAbierta(2)&&etapaActual()===1;S.topics=g;return !a&&b&&c;})()`));
});

console.log('Repaso espaciado');
prueba('fallar programa para mañana; acertar sube de caja 1, 3, 7 y 14 días y luego se retira', () => {
  assert(ev(`(function(){const L=[],q={tipo:'A',seed:7,diff:'m'},id='A:7:m';
    srsFail(L,q,'2026-01-30');if(L[0].due!=='2026-01-31')return false;
    if(srsDue(L,'2026-01-30').length!==0||srsDue(L,'2026-01-31').length!==1)return false;
    srsPass(L,id,'2026-01-31');if(L[0].due!=='2026-02-03')return false;
    srsPass(L,id,'2026-02-03');if(L[0].due!=='2026-02-10')return false;
    srsPass(L,id,'2026-02-10');if(L[0].due!=='2026-02-24')return false;
    return srsPass(L,id,'2026-02-24')==='done'&&L.length===0;})()`));
});
prueba('fallar de nuevo reinicia la caja y no duplica la tarjeta', () => {
  assert(ev(`(function(){const L=[],q={tipo:'A',seed:7,diff:'m'};srsFail(L,q,'2026-03-01');srsPass(L,'A:7:m','2026-03-02');srsFail(L,q,'2026-03-05');return L.length===1&&L[0].box===0&&L[0].due==='2026-03-06';})()`));
});

console.log('Racha');
prueba('la racha sube al practicar en días consecutivos y se reinicia si se salta un día', () => {
  assert(ev(`nuevaRacha('2026-03-01',4,'2026-03-02')===5 && nuevaRacha('2026-03-02',5,'2026-03-02')===5 && nuevaRacha('2026-02-27',9,'2026-03-02')===1 && nuevaRacha('',0,'2026-03-02')===1`));
});
prueba('la racha visible vale 0 si pasó más de un día; cruza meses y años', () => {
  assert(ev(`rachaVisible('2026-03-01',4,'2026-03-02')===4 && rachaVisible('2026-02-27',4,'2026-03-02')===0 && nuevaRacha('2025-12-31',2,'2026-01-01')===3 && nuevaRacha('2026-02-28',2,'2026-03-01')===3`));
});

console.log('Respaldo');
prueba('acepta un respaldo propio y conserva los datos', () => {
  assert(ev(`(function(){const o=JSON.parse(JSON.stringify(S));o.xp=321;o.topics={A:{ok:5,err:1}};o.last='2026-03-01';
    const v=validaBackup(JSON.stringify({app:'x',datos:o}));return v.ok&&v.datos.xp===321&&v.datos.topics.A.ok===5&&v.datos.last==='2026-03-01';})()`));
});
prueba('rechaza basura y sanea valores peligrosos', () => {
  assert(ev(`!validaBackup('no es json').ok && !validaBackup('{"a":1}').ok && !validaBackup({xp:'1',topics:{}}).ok`));
  assert(ev(`(function(){const v=validaBackup({xp:-5,topics:{A:{ok:'x',err:3}},goal:999,theme:'<script>',diff:'z',srs:[{id:1}],last:'ayer',fs:5000});
    return v.ok&&v.datos.xp===0&&v.datos.topics.A.ok===0&&v.datos.goal===10&&v.datos.theme===''&&v.datos.diff==='m'&&v.datos.srs.length===0&&v.datos.last===''&&v.datos.fs===100;})()`));
});

console.log('Respuestas del usuario');
prueba('parseResp entiende fracciones, comas, raíces y potencias', () => {
  assert(ev(`(function(){const c=(s,n,e)=>Math.abs(parseResp(s,n)[0]-e)<1e-6;return c('7/12',1,7/12)&&c('3,5',1,3.5)&&c('2√9',1,6)&&c('2^3',1,8)&&c('√16',1,4)&&parseResp('x=4, y=-2',2).join()==='4,-2';})()`));
});

console.log('Archivos del repositorio');
prueba('la versión de index.html y sw.js coinciden', () => {
  const v = ev('VERSION'), sw = fs.readFileSync(path.join(raiz, 'sw.js'), 'utf8').match(/VERSION = '([^']+)'/)[1];
  assert.strictEqual(sw, v);
  assert.strictEqual(JSON.parse(fs.readFileSync(path.join(raiz, 'package.json'), 'utf8')).version, v);
});
prueba('el manifest es válido y sus íconos existen', () => {
  const m = JSON.parse(fs.readFileSync(path.join(raiz, 'manifest.webmanifest'), 'utf8'));
  m.icons.forEach(i => assert(fs.existsSync(path.join(raiz, i.src)), 'falta ' + i.src));
});
prueba('index.html referencia solo archivos que existen', () => {
  [...html.matchAll(/(?:href|src)="((?!http|#|data:)[^"]+)"/g)].map(m => m[1]).filter(f => !f.includes('${')).forEach(f => assert(fs.existsSync(path.join(raiz, f)), 'falta ' + f));
});
prueba('todas las funciones de onclick existen y no hay ids repetidos', () => {
  const faltan = [...new Set([...html.matchAll(/onclick="(\w+)\(/g)].map(m => m[1]))].filter(f => !new RegExp('function ' + f + '\\b').test(js));
  assert.deepStrictEqual(faltan, []);
  const ids = [...html.matchAll(/ id="([^"]+)"/g)].map(m => m[1]);
  assert.strictEqual(ids.length, new Set(ids).size);
});
console.log('\n' + pruebas + ' pruebas correctas' + (fallos ? ', ' + fallos + ' con fallos' : ''));
