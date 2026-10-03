'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

const base=fs.readFileSync('caseirinho-coupon-assistant-v9-5-8.js','utf8');
const john=fs.readFileSync('caseirinho-john-coupon-v9-5-9.js','utf8');
const index=fs.readFileSync('index.html','utf8');
const sw=fs.readFileSync('service-worker.js','utf8');

test('assistentes base e John V9.5.9 possuem JavaScript válido',()=>{
  assert.doesNotThrow(()=>new Function(base));
  assert.doesNotThrow(()=>new Function(john));
});

test('fluxo CASEIRINHO10 continua solicitando WhatsApp e validando primeira compra',()=>{
  assert.match(base,/CASEIRINHO10 dá 10% na primeira compra/);
  assert.match(base,/PRIMEIRA_COMPRA_OK/);
  assert.match(base,/CLIENTE_JA_USOU/);
  assert.match(base,/CUPOM_EXPIRADO/);
  assert.match(base,/\/api\/v1\/cupons\/validar/);
  assert.match(john,/validateFirstPurchase/);
});

test('cupom genérico usa validação privada no servidor e não depende do campo nativo oculto',()=>{
  assert.match(john,/async function applyGenericCoupon/);
  assert.match(john,/GENERIC_OK/);
  assert.match(john,/\/coupon\/validate\?_t=/);
  assert.match(john,/\/commercial-apply\?_t=/);
  assert.doesNotMatch(john,/\/commerce-engine\?_t=/);
  assert.doesNotMatch(john,/syncNativeGeneric/);
  assert.doesNotMatch(john,/ceCouponInput/);
});

test('loja não revela lista de cupons ativos ao cliente',()=>{
  assert.match(john,/A validade e as regras serão conferidas automaticamente/);
  assert.match(john,/os cupons ativos não são exibidos na loja/);
  assert.doesNotMatch(john,/Cupons ativos:/);
});

test('John consulta contexto real da loja e responde além de cupons',()=>{
  assert.match(john,/Fale com John/);
  assert.match(john,/\/catalog\?_t=/);
  assert.match(john,/currentPaymentOptions/);
  assert.match(john,/currentOrder/);
  assert.match(john,/findProducts/);
  assert.match(john,/carrinho/);
  assert.match(john,/entrega/);
  assert.match(john,/pagamento/);
});

test('index V9.6.0 preserva cupons e carrega cashback antes do app principal',()=>{
  assert.match(index,/Loja Online · V9\.6\.0/);
  assert.match(index,/johnAssistantVersion:'9\.5\.9'/);
  assert.match(index,/cashbackVersion:'9\.6\.0'/);
  const basePos=index.indexOf('caseirinho-coupon-assistant-v9-5-8.js');
  const johnPos=index.indexOf('caseirinho-john-coupon-v9-5-9.js');
  const cashbackPos=index.indexOf('caseirinho-cashback-v9-6-0.js');
  const appPos=index.indexOf('./app.js?v=9600');
  assert.ok(basePos>=0&&johnPos>basePos&&cashbackPos>johnPos&&appPos>cashbackPos);
});

test('PWA V9.6.0 preserva John e inclui Cashback',()=>{
  assert.match(sw,/coupon-assistant-john959-cashback960/);
  assert.match(sw,/JOHNJS959/);
  assert.match(sw,/CASHBACKJS960/);
  assert.match(sw,/caseirinho-john-coupon-v9-5-9\.js\?v=9590/);
  assert.match(sw,/caseirinho-cashback-v9-6-0\.js\?v=9600/);
  assert.match(sw,/injectBeforeApp\(html,'caseirinho-john-coupon-v9-5-9\.js',JOHNJS959_TAG\)/);
  assert.match(sw,/injectBeforeApp\(html,'caseirinho-cashback-v9-6-0\.js',CASHBACKJS960_TAG\)/);
});
