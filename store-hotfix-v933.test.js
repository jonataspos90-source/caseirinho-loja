const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

const src=fs.readFileSync('store-hotfix-v9-3-3.js','utf8');
const sw=fs.readFileSync('service-worker.js','utf8');
const html=fs.readFileSync('index.html','utf8');

class FakeStorage{
  constructor(){this.map=new Map()}
  getItem(k){return this.map.has(String(k))?this.map.get(String(k)):null}
  setItem(k,v){this.map.set(String(k),String(v))}
  removeItem(k){this.map.delete(String(k))}
}
function boot(){
  const localStorage=new FakeStorage();
  const context={
    window:{CASEIRINHO_CONFIG:{storeSlug:'caseirinho'}},
    location:{search:''},
    URLSearchParams,
    Storage:FakeStorage,
    localStorage,
    console
  };
  vm.runInNewContext(src,context);
  return {localStorage};
}

test('uma rejeição já exibida continua marcada mesmo quando updatedAt muda',()=>{
  const {localStorage}=boot();
  const ordersKey='john_store_caseirinho_orders_v1';
  const noticeKey='john_store_caseirinho_customer_notice_v1';
  localStorage.setItem(ordersKey,JSON.stringify([{id:'PED-1',status:'REJEITADO',updatedAt:'2026-09-16T10:00:00Z'}]));
  localStorage.setItem(noticeKey,JSON.stringify({'PED-1:rejected:2026-09-16T10:00:00Z':'2026-09-16T10:00:01Z'}));
  localStorage.setItem(ordersKey,JSON.stringify([{id:'PED-1',status:'REJEITADO',updatedAt:'2026-09-16T10:05:00Z'}]));
  const seen=JSON.parse(localStorage.getItem(noticeKey));
  assert.ok(seen['PED-1:rejected:once']);
  assert.ok(seen['PED-1:rejected:2026-09-16T10:05:00Z']);
});

test('pedido rejeitado ainda não avisado não é marcado antecipadamente',()=>{
  const {localStorage}=boot();
  const ordersKey='john_store_caseirinho_orders_v1';
  const noticeKey='john_store_caseirinho_customer_notice_v1';
  localStorage.setItem(ordersKey,JSON.stringify([{id:'PED-2',status:'REJEITADO',updatedAt:'2026-09-16T11:00:00Z'}]));
  const seen=JSON.parse(localStorage.getItem(noticeKey));
  assert.equal(seen['PED-2:rejected:once'],undefined);
  assert.equal(seen['PED-2:rejected:2026-09-16T11:00:00Z'],undefined);
});

test('PWA mantém a correção V9.3.3 junto da V9.3.4',()=>{
  assert.match(sw,/caseirinho-loja-v9\.3\.4-rejection-history/);
  assert.match(sw,/store-hotfix-v9-3-3\.js/);
  assert.match(sw,/store-hotfix-v9-3-4\.js/);
  assert.match(html,/store-hotfix-v9-3-3\.js\?v=934/);
  assert.match(html,/version:'9\.3\.4'/);
});
