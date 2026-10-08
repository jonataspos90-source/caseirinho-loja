'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const app=fs.readFileSync(path.join(__dirname,'app.js'),'utf8');
const snippet=(start,end)=>{
 const from=app.indexOf(start),to=app.indexOf(end,from+start.length);
 assert.ok(from>=0&&to>from,'Código de catálogo não localizado: '+start);
 return app.slice(from,to);
};
const money=v=>Number(v).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
function make(overrides={}){
  const elements={syncStatus:{textContent:''},catalogStatusLine:{dataset:{}},
    retryCatalog:{hidden:true},products:{innerHTML:''}};
  const queue=[];const catalog={loja:{},produtos:[]};
  const ctx={
    API:'https://john-cloud-api-production.up.railway.app',
    STORE:'caseirinho',CATALOG_PATH:'/api/v1/public/store/caseirinho/catalog',
    CATALOG_KEY:'john_store_caseirinho_catalog_v1',
    CATALOG_BACKUP_CACHE:'john-storefront-catalog-backup-v1',
    catalog,catalogBusy:false,catalogConnected:false,catalogRecoveryTimer:null,catalogRecoveryCount:0,
    S:v=>String(v??''),A:v=>Array.isArray(v)?v:[],
    E:id=>elements[id],
    images:p=>p.imagens||[],
    readJson:(key,alt)=>overrides.cache?.[key]||alt,
    writeJson:(key,v)=>{(overrides.writes||(overrides.writes=[])).push([key,v])},
    api:overrides.api||(async()=>({loja:{nome:'Caseirinho'},produtos:[{id:'pao',nome:'Pão'}]})),
    window:{},
    document:{hidden:false},
    caches:null,
    setTimeout:(fn,ms)=>{if(ms<1000){fn();return 2}queue.push({fn,ms});return 3},
    clearTimeout:()=>{},
    console:{warn:()=>{}},toast:()=>{},Date,Promise,Response,
    mount:()=>{ctx.mounts=(ctx.mounts||0)+1},
    money
  };
  ctx.window={};
  vm.createContext(ctx);
  vm.runInContext(snippet('async function catalogBackup(){','function showProduct('),ctx);
  return{ctx,elements,queue};
}
test('GET público não dispara preflight por Content-Type nem Cache-Control customizados',async()=>{
  let called;const src=snippet('async function api(path,opt={}){','function canonicalAvailability(');
  const ctx={API:'https://api.test',Date,S:v=>String(v??''),fetch:async(url,options)=>{
    called={url,options};return{ok:true,json:async()=>({produtos:[]})}
  }};
  vm.createContext(ctx);vm.runInContext(src,ctx);
  await ctx.api('/api/v1/public/store/caseirinho/catalog');
  assert.match(called.url,/catalog\?_t=/);
  assert.deepEqual(Object.keys(called.options.headers),[]);
  await ctx.api('/api/v1/public/store/caseirinho/orders',{method:'POST',body:'{}'});
  assert.equal(called.options.headers['Content-Type'],'application/json');
});
test('falha transitória, segunda tentativa retorna produtos e oculta botão',async()=>{
 let calls=0;const{ctx,elements}=make({api:async()=>{
  if(++calls===1)throw new TypeError('Failed to fetch');
  return{loja:{nome:'Caseirinho'},produtos:[{id:'pao',nome:'Pão Caseiro'}]}
 }});
 await ctx.loadCatalog();
 assert.equal(calls,2);
 assert.equal(ctx.catalogConnected,true);
 assert.equal(ctx.catalog.produtos.length,1);
 assert.equal(elements.retryCatalog.hidden,true);
 assert.equal(ctx.mounts,1);
});
test('API indisponível mostra cópia local e agenda uma nova tentativa',async()=>{
 let attempts=0;const snapshot={loja:{nome:'Caseirinho'},produtos:[{id:'empada',nome:'Empada Palmito'}]};
 const {ctx,elements,queue}=make({api:async()=>{attempts++;throw new TypeError('Failed to fetch')},
 cache:{john_store_caseirinho_catalog_v1:snapshot}});
 await ctx.loadCatalog();
 assert.equal(attempts,3);
 assert.equal(ctx.catalogConnected,false);
 assert.equal(elements.retryCatalog.hidden,false);
 assert.equal(ctx.catalog.produtos[0].id,'empada');
 assert.equal(ctx.mounts,1);
 assert.equal(queue.length,1);
 assert.equal(queue[0].ms,5000);
});
test('sem cache, nunca finge que a loja está online e permite nova tentativa',async()=>{
 const{ctx,elements}=make({api:async()=>{throw new Error('Failed to fetch')}});
 await ctx.loadCatalog();
 assert.equal(ctx.catalogConnected,false);
 assert.equal(elements.catalogStatusLine.dataset.connection,'offline');
 assert.equal(elements.retryCatalog.hidden,false);
 assert.match(elements.syncStatus.textContent,/Tentando reconectar/);
 assert.match(elements.products.innerHTML,/Tentar novamente/);
});
test('PWA usa versão atual da lógica de cardápio e mantém script único',()=>{
 const sw=fs.readFileSync(path.join(__dirname,'service-worker.js'),'utf8');
 const html=fs.readFileSync(path.join(__dirname,'index.html'),'utf8');
 assert.match(sw,/caseirinho-loja-v9\.10\.11-catalog-auto-retry/);
 assert.match(sw,/prefix\+'910110'/);
 assert.match(html,/id="retryCatalog"/);
 assert.match(html,/\.\/app\.js\?v=910110/);
});
