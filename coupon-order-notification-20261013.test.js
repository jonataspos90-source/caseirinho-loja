'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

const script=fs.readFileSync('caseirinho-coupon-assistant-v9-5-8.js','utf8');

test('marca intenção somente quando cupom validado pertence ao WhatsApp do pedido',()=>{
  assert.match(script,/couponIntent:FIRST_CODE/);
  assert.match(script,/stateValidForCheckout\(\)/);
  assert.match(script,/sanitizePhone\(sent\?\.cliente\?\.telefone\)===st\.phone/);
});

test('preserva a criação e aplicação autoritativa do CASEIRINHO10',()=>{
  assert.match(script,/rawFetch\(input,requestOptions\)/);
  assert.match(script,/coupon-caseirinho10/);
  assert.match(script,/adjusted\.total/);
});
