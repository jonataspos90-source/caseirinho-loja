'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

const js=fs.readFileSync('customer-cashback-wallet-v9-6-3.js','utf8');
const index=fs.readFileSync('index.html','utf8');

test('customer cashback wallet has valid JavaScript',()=>{
  assert.doesNotThrow(()=>new Function(js));
});

test('cashback is inserted immediately before WhatsApp in bottom navigation',()=>{
  assert.match(js,/nav\.insertBefore\(btn,whats\)/);
  assert.match(js,/btn\.id='navCashback'/);
  assert.match(js,/Cashback/);
});

test('wallet consults cashback balance directly from ERP',()=>{
  assert.match(js,/\/cashback\/balance/);
  assert.match(js,/Saldo disponível/);
  assert.match(js,/Total na carteira/);
  assert.match(js,/Reservado em pedido/);
  assert.match(js,/Percentual vigente/);
});

test('bottom navigation displays the customer cashback amount when available',()=>{
  assert.match(js,/cashback-wallet-nav-value/);
  assert.match(js,/available>0/);
  assert.match(js,/tag\.textContent=money\(available\)/);
});

test('wallet keeps coupon and cashback non-cumulative rule visible',()=>{
  assert.match(js,/não acumula com cupom de desconto/i);
});

test('store loads cashback wallet v9.6.3',()=>{
  assert.match(index,/Loja Online · V9\.6\.3/);
  assert.match(index,/cashbackWalletVersion:'9\.6\.3'/);
  assert.match(index,/customer-cashback-wallet-v9-6-3\.js\?v=9630/);
});
