const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

const src=fs.readFileSync('store-hotfix-v9-3-4.js','utf8');
const sw=fs.readFileSync('service-worker.js','utf8');
const html=fs.readFileSync('index.html','utf8');
const ordersKey='john_store_caseirinho_orders_v1';
const noticeKey='john_store_caseirinho_customer_notice_v1';

function boot(initialOrders=[]){
  class FakeStorage{
    constructor(){this.map=new Map()}
    getItem(k){return this.map.has(String(k))?this.map.get(String(k)):null}
    setItem(k,v){this.map.set(String(k),String(v))}
    removeItem(k){this.map.delete(String(k))}
  }
  const localStorage=new FakeStorage();
  if(initialOrders.length)FakeStorage.prototype.setItem.call(localStorage,ordersKey,JSON.stringify(initialOrders));
  const context={window:{CASEIRINHO_CONFIG:{storeSlug:'caseirinho'}},location:{search:''},URLSearchParams,Storage:FakeStorage,localStorage,console};
  vm.runInNewContext(src,context);
  return {localStorage};
}

test('rejeição que já existia ao abrir o app é considerada histórica e não volta a aparecer',()=>{
  const {localStorage}=boot([{id:'PED-ANTIGO',status:'REJEITADO',updatedAt:'2026-09-16T11:00:00Z'}]);
  const seen=JSON.parse(localStorage.getItem(noticeKey));
  assert.ok(seen['PED-ANTIGO:rejected:once']);
  assert.ok(seen['PED-ANTIGO:rejected:2026-09-16T11:00:00Z']);
});

test('nova rejeição aparece uma vez e depois continua marcada mesmo com updatedAt diferente',()=>{
  const {localStorage}=boot([{id:'PED-NOVO',status:'PENDENTE',updatedAt:'2026-09-16T11:00:00Z'}]);
  localStorage.setItem(ordersKey,JSON.stringify([{id:'PED-NOVO',status:'REJEITADO',updatedAt:'2026-09-16T11:01:00Z'}]));
  let seen=JSON.parse(localStorage.getItem(noticeKey)||'{}');
  assert.equal(seen['PED-NOVO:rejected:once'],undefined);
  localStorage.setItem(noticeKey,JSON.stringify({'PED-NOVO:rejected:2026-09-16T11:01:00Z':'2026-09-16T11:01:01Z'}));
  localStorage.setItem(ordersKey,JSON.stringify([{id:'PED-NOVO',status:'REJEITADO',updatedAt:'2026-09-16T11:05:00Z'}]));
  seen=JSON.parse(localStorage.getItem(noticeKey));
  assert.ok(seen['PED-NOVO:rejected:once']);
  assert.ok(seen['PED-NOVO:rejected:2026-09-16T11:05:00Z']);
});

test('V9.3.5 carrega a proteção antes do app e invalida o cache anterior',()=>{
  assert.match(sw,/caseirinho-loja-v9\.3\.5-server-authority/);
  assert.match(sw,/injectBeforeApp/);
  assert.match(sw,/store-hotfix-v9-3-4\.js/);
  const guard=html.indexOf('store-hotfix-v9-3-4.js');
  const app=html.indexOf('./app.js');
  assert.ok(guard>=0&&app>=0&&guard<app);
  assert.match(html,/version:'9\.3\.4'/);
});
