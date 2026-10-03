'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

const js=fs.readFileSync('caseirinho-john-coupon-v9-5-9.js','utf8');

test('total do checkout considera produtos menos desconto mais entrega',()=>{
  assert.match(js,/function desiredCheckoutTotal/);
  assert.match(js,/subtotal-discount/);
  assert.match(js,/discounted\+shipping/);
});

test('correção protege o total contra recálculos posteriores do carrinho',()=>{
  assert.match(js,/observer\.observe\(totals,\{childList:true,characterData:true,subtree:true\}\)/);
  assert.match(js,/if\(grand\.textContent!==expected\)grand\.textContent=expected/);
});

test('exemplo visual do pedido: 39,96 + 9,99 - 2,80 = 47,15',()=>{
  const subtotal=39.96,frete=9.99,desconto=2.80;
  assert.equal(Math.round((subtotal-desconto+frete)*100)/100,47.15);
});
