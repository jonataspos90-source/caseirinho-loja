'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

const js=fs.readFileSync('caseirinho-cashback-v9-6-0.js','utf8');
const index=fs.readFileSync('index.html','utf8');
const sw=fs.readFileSync('service-worker.js','utf8');

test('cashback v9.6.0 has valid JavaScript',()=>{
  assert.doesNotThrow(()=>new Function(js));
});

test('store consults ERP balance and reserves before redemption',()=>{
  assert.match(js,/\/cashback\/balance/);
  assert.match(js,/\/cashback\/reservations/);
  assert.match(js,/\/cashback\/confirm/);
  assert.match(js,/Sem comunicação com o ERP, o uso de cashback fica bloqueado/);
});

test('cashback is a separate checkout discount and does not discount freight',()=>{
  assert.match(js,/Cashback utilizado/);
  assert.match(js,/eligibleProducts/);
  assert.match(js,/sub-coupon-use/);
  assert.match(js,/productsAfter\+ship\.value/);
});

test('release never manufactures a local balance and rechecks ERP',()=>{
  assert.match(js,/async function releaseReservation/);
  assert.match(js,/await queryBalance\(true\)/);
  assert.match(js,/Saldo reconfirmado pelo ERP/);
  assert.doesNotMatch(js,/st\.available\)\+N\(st\.reservedAmount/);
});

test('cashback loads after coupons and before app',()=>{
  const coupon=index.indexOf('caseirinho-john-coupon-v9-5-9.js');
  const cashback=index.indexOf('caseirinho-cashback-v9-6-0.js');
  const app=index.indexOf('./app.js?v=9600');
  assert.ok(coupon>=0&&cashback>coupon&&app>cashback);
  assert.match(index,/Loja Online · V9\.6\.0/);
});

test('PWA caches and injects cashback module',()=>{
  assert.match(sw,/cashback960/);
  assert.match(sw,/CASHBACKJS960/);
  assert.match(sw,/caseirinho-cashback-v9-6-0\.js\?v=9600/);
});
