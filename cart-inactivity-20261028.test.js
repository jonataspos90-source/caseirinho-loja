'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'commerce-engagement-v9-6-1.js'),'utf8');
const prefix='john_store_caseirinho_';
const cartKey=prefix+'cart_v1';
const sentKey=prefix+'engagement_last_snapshot_v961';
function harness(storage=new Map()){
  const calls=[],intervals=[],timeouts=[],events={};
  const document={readyState:'loading',visibilityState:'visible',getElementById:()=>null,addEventListener:(name,fn)=>{events[name]=fn}};
  const window={addEventListener:(name,fn)=>{events[name]=fn}};
  const context=vm.createContext({window,document,URLSearchParams,location:{search:'',pathname:'/caseirinho-loja/'},crypto:{randomUUID:()=> 'test-session'},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},Date,console,setInterval:(fn,ms)=>intervals.push({fn,ms}),setTimeout:(fn)=>timeouts.push(fn),clearTimeout:()=>{},fetch:async(url,opt)=>{calls.push(JSON.parse(opt.body));return{ok:!context.fail,status:503}}});
  vm.runInContext(source.replace('window.CaseirinhoEngagement961={','window.CaseirinhoEngagement961={watchCart,'),context);
  return {api:window.CaseirinhoEngagement961,storage,calls,intervals,events,context,setCart:items=>storage.set(cartKey,JSON.stringify(items)),flush:async()=>{while(timeouts.length)await timeouts.shift()();await new Promise(resolve=>setImmediate(resolve))}};
}
const item={produtoId:'empada',nome:'Empada',quantidade:1,precoUnitario:11.99};

test('unchanged cart remains inactive through timers, visibility and reload',async()=>{
  const h=harness();h.setCart([item]);
  h.storage.set(prefix+'customer_profile_v1',JSON.stringify({telefone:'(11) 99999-0000',nome:'Cliente teste'}));
  await h.api.sendSnapshot();h.api.watchCart();
  for(let n=0;n<12;n++)await h.intervals.find(x=>x.ms===30000).fn();
  h.events.visibilitychange();await h.flush();h.events.pagehide();await h.flush();
  await h.api.sendSnapshot(true,true);
  assert.equal(h.calls.length,1);
  assert.equal(h.calls[0].phone,'11999990000');
  const reloaded=harness(h.storage);await reloaded.api.sendSnapshot(true);
  assert.equal(reloaded.calls.length,0);
});
test('quantity, price and identity changes produce new snapshots',async()=>{
  const h=harness();h.setCart([item]);await h.api.sendSnapshot();
  h.setCart([{...item,quantidade:2}]);await h.api.sendSnapshot();
  h.setCart([{...item,quantidade:2,precoUnitario:12}]);await h.api.sendSnapshot();
  h.storage.set(prefix+'customer_profile_v1',JSON.stringify({telefone:'11999990000'}));await h.api.sendSnapshot();
  assert.equal(h.calls.length,4);assert.equal(h.calls[3].data.total,24);assert.equal(h.calls[3].data.items,2);
});
test('failed snapshots retry, and acknowledged state suppresses further retries',async()=>{
  const h=harness();h.setCart([item]);h.context.fail=true;
  assert.equal(await h.api.sendSnapshot(),false);assert.equal(h.storage.has(sentKey),false);
  h.context.fail=false;assert.equal(await h.api.sendSnapshot(),true);
  assert.equal(await h.api.sendSnapshot(),false);assert.equal(h.calls.length,2);
});
test('failed empty-cart event retries on periodic timer and clears only after success',async()=>{
  const h=harness();h.setCart([item]);await h.api.sendSnapshot();h.api.watchCart();h.setCart([]);
  h.context.fail=true;await h.api.sendSnapshot();
  assert.equal(JSON.parse(h.storage.get(sentKey)).hadCart,true);
  h.context.fail=false;await h.intervals.find(x=>x.ms===30000).fn();
  assert.equal(JSON.parse(h.storage.get(sentKey)).hadCart,false);
  await h.api.sendSnapshot();assert.deepEqual(h.calls.map(x=>x.type),['CART_SNAPSHOT','CART_CLEARED','CART_CLEARED']);
  h.setCart([item]);assert.equal(await h.api.sendSnapshot(),true);
});
test('cart changes during an in-flight request are sent on the next retry',async()=>{
  const h=harness();h.setCart([item]);let release;
  h.context.fetch=async(url,opt)=>{h.calls.push(JSON.parse(opt.body));await new Promise(resolve=>{release=resolve});return{ok:true}};
  const first=h.api.sendSnapshot();h.setCart([{...item,quantidade:3}]);
  assert.equal(await h.api.sendSnapshot(),false);release();await first;
  h.context.fetch=async(url,opt)=>{h.calls.push(JSON.parse(opt.body));return{ok:true}};
  await h.api.sendSnapshot();assert.equal(h.calls[1].data.items,3);
});
test('PWA upgrades old cached HTML to the new engagement script without duplication',async()=>{
  const worker=fs.readFileSync(path.join(__dirname,'service-worker.js'),'utf8');
  const ctx=vm.createContext({self:{addEventListener:()=>{}},Headers,Response});vm.runInContext(worker,ctx);
  const html='<body><script src="./commerce-engagement-v9-6-1.js?v=20261020b" defer></script></body>';
  ctx.response=new Response(html,{headers:{'content-type':'text/html'}});
  const out=await vm.runInContext('injectHotfix(response)',ctx);const updated=await out.text();
  assert.match(updated,/commerce-engagement-v9-6-1\.js\?v=20261028-cart-inactivity/);
  assert.equal((updated.match(/commerce-engagement-v9-6-1\.js/g)||[]).length,1);
});
