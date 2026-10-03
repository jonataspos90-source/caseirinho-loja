'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

const src=fs.readFileSync('caseirinho-coupon-assistant-v9-5-8.js','utf8');
const index=fs.readFileSync('index.html','utf8');
const sw=fs.readFileSync('service-worker.js','utf8');

test('assistente V9.5.8 possui JavaScript válido',()=>{
  assert.doesNotThrow(()=>new Function(src));
});

test('fluxo CASEIRINHO10 solicita WhatsApp e trata respostas do ERP',()=>{
  assert.match(src,/CASEIRINHO10 dá 10% na primeira compra/);
  assert.match(src,/Informe seu WhatsApp/);
  assert.match(src,/PRIMEIRA_COMPRA_OK/);
  assert.match(src,/CLIENTE_JA_USOU/);
  assert.match(src,/CUPOM_EXPIRADO/);
  assert.match(src,/\/api\/v1\/cupons\/validar/);
});

test('cupons do Motor Comercial são carregados e sincronizados no checkout',()=>{
  assert.match(src,/\/commerce-engine\?_t=/);
  assert.match(src,/GENERIC_OK/);
  assert.match(src,/syncNativeGeneric/);
  assert.match(src,/ceCouponInput/);
  assert.match(src,/Cupons ativos:/);
});

test('telefone é higienizado e CASEIRINHO10 é revalidado no pedido',()=>{
  assert.match(src,/startsWith\('55'\)/);
  assert.match(src,/while\(d\.startsWith\('0'\)/);
  assert.match(src,/d\.length===9/);
  assert.match(src,/coupon-caseirinho10/);
  assert.match(src,/publicToken/);
  assert.match(src,/descontoCupom/);
});

test('index carrega assistente antes do app principal',()=>{
  assert.match(index,/Loja Online · V9\.5\.8/);
  assert.match(index,/couponAssistantVersion:'9\.5\.8'/);
  const coupon=index.indexOf('caseirinho-coupon-assistant-v9-5-8.js');
  const app=index.indexOf('./app.js?v=9580');
  assert.ok(coupon>=0&&app>coupon);
});

test('PWA V9.5.8 inclui e injeta assistente antes do app',()=>{
  assert.match(sw,/cards958-coupon-assistant/);
  assert.match(sw,/COUPONJS958/);
  assert.match(sw,/caseirinho-coupon-assistant-v9-5-8\.js\?v=9580/);
  assert.match(sw,/injectBeforeApp\(html,'caseirinho-coupon-assistant-v9-5-8\.js',COUPONJS958_TAG\)/);
});
