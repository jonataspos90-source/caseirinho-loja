'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const read=name=>fs.readFileSync(path.join(__dirname,name),'utf8');
const sw=read('service-worker.js'),app=read('app.js');
function section(start,end,content){
 const from=content.indexOf(start),to=content.indexOf(end,from+start.length);
 assert.ok(from>=0&&to>from,'Trecho ausente: '+start);
 return content.slice(from,to);
}
test('PWA preserva versão publicada do script principal e de campanhas',async()=>{
 const source=section('function injectOne(html,needle,tag){','function canonicalUrl(req){',sw);
 const ctx={Headers,Response};
 // Reaproveita os próprios helpers do SW; os tags opcionais não afetam a verificação
 // de preservação das versões de scripts já presentes no HTML.
 for(const name of new Set(source.match(/[A-Z][A-Z0-9_]*_TAG/g)||[]))ctx[name]='';
 vm.createContext(ctx);vm.runInContext(source,ctx);
 const before='<html><head></head><body><script src="./app.js?v=20261119-stable-checkout"></script><script src="./commerce-engagement-v9-6-1.js?v=20261119-seasonal-new"></script></body></html>';
 const response=new Response(before,{headers:{'content-type':'text/html'}});
 const after=await (await ctx.injectHotfix(response)).text();
 assert.match(after,/app\.js\?v=20261119-stable-checkout/);
 assert.match(after,/commerce-engagement-v9-6-1\.js\?v=20261119-seasonal-new/);
 assert.doesNotMatch(after,/app\.js\?v=20261116-store-hours-2/);
});
test('consultas GET nunca aguardam indefinidamente e não abortam POST financeiro',async()=>{
 const source=section('async function api(path,opt={}){','function canonicalAvailability(p){',app);
 let fetchOptions=[],abortWasCalled=false;
 const ctx={API:'https://example.test',S:v=>String(v??''),Date,AbortController,
  setTimeout(fn){setImmediate(()=>{abortWasCalled=true;fn()});return 1},
  clearTimeout(){},
  fetch:async(url,opts)=>{
   fetchOptions.push(opts);
   if(opts.signal)return new Promise((resolve,reject)=>{
    opts.signal.addEventListener('abort',()=>reject(Object.assign(new Error('aborted'),{name:'AbortError'})),{once:true});
   });
   return {ok:true,json:async()=>({ok:true})};
  }
 };
 vm.createContext(ctx);vm.runInContext(source,ctx);
 await assert.rejects(ctx.api('/catalog'),/12 segundos/);
 assert.ok(abortWasCalled);
 await ctx.api('/orders',{method:'POST',body:'{}'});
 assert.equal(fetchOptions.length,2);
 assert.equal(fetchOptions[1].signal,undefined);
});
test('catálogo temporariamente vazio preserva os produtos conhecidos e falha em modo seguro',async()=>{
 const source=section('async function fetchCatalogWithRetry(){','async function loadCatalog(silent=false){',app);
 const ctx={
  A:x=>Array.isArray(x)?x:[],catalog:{produtos:[{id:'p1'}]},CATALOG_PATH:'/catalog',
  api:async()=>({loja:{},produtos:[]}),catalogBackup:async()=>null,
  setTimeout:fn=>{fn();return 1},Promise
 };
 vm.createContext(ctx);vm.runInContext(source,ctx);
 await assert.rejects(ctx.fetchCatalogWithRetry(),/inesperadamente vazio/);
 assert.equal(ctx.catalog.produtos.length,1);
});
test('encomendas continuam tentando recuperar mesmo após cinco falhas',()=>{
 const source=section('function scheduleSeasonalRetry(){','async function loadSeasonalCampaigns(){',app);
 let ms=0;
 const ctx={
  document:{hidden:false},seasonalLoadFailures:12,seasonalRetryTimer:null,
  setTimeout(fn,delay){ms=delay;return 8;},loadSeasonalCampaigns(){}
 };
 vm.createContext(ctx);vm.runInContext(source,ctx);
 ctx.scheduleSeasonalRetry();
 assert.equal(ms,60000);
 assert.equal(ctx.seasonalRetryTimer,8);
});
test('o carregamento de campanhas é serializado e continua com checkout bloqueado no fallback',()=>{
 assert.match(app,/seasonalLoadBusy/);
 assert.match(app,/seasonalCampaigns=backup\.map\(c=>\(\{\.\.\.c,status:'FECHADA'\}\)\)/);
 assert.match(app,/if\(!catalogConnected\)/);
});
