const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

const js=fs.readFileSync('checkout-parmesao-v9-3-6.js','utf8');
const html=fs.readFileSync('index.html','utf8');
const sw=fs.readFileSync('service-worker.js','utf8');

test('checkout oferece Queijo Parmesão Vale por R$ 4,00',()=>{
  assert.match(js,/Queijo Parmesão Vale/);
  assert.match(js,/const PRICE=4/);
  assert.match(js,/parmesaoVale:true/);
  assert.match(js,/Opcional · 1 unidade por pedido/);
});

test('cliente precisa marcar a oferta e o total visual recebe quatro reais',()=>{
  assert.match(js,/type=\"checkbox\"/);
  assert.match(js,/selected=!!e\.target\.checked/);
  assert.match(js,/subtotal\+shipping\+\(selected&&has\?PRICE:0\)/);
});

test('requisição do pedido envia somente a decisão; preço fica no servidor',()=>{
  assert.match(js,/checkoutUpsell=.*parmesaoVale:true/);
  assert.doesNotMatch(js,/checkoutUpsell=.*preco/);
});

test('Loja 9.3.7 preserva o upsell V9.3.6 no PWA',()=>{
  assert.match(html,/checkout-parmesao-v9-3-6\.js\?v=9360/);
  assert.match(html,/version:'9\.3\.7'/);
  assert.match(sw,/caseirinho-loja-v9\.3\.6-parmesao-checkout-pix937/);
  assert.match(sw,/checkout-parmesao-v9-3-6\.js/);
  assert.match(sw,/pix-payment-v9-3-7\.js/);
});
