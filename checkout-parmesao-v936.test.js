const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

const js=fs.readFileSync('checkout-parmesao-v9-3-6.js','utf8');
const html=fs.readFileSync('index.html','utf8');
const sw=fs.readFileSync('service-worker.js','utf8');

test('checkout oferece Queijo Parmesão Vale por R$ 4,00',()=>{
  assert.match(js,/Queijo Parmesão Vale/);
  assert.match(js,/const PRICE=4/);
  assert.match(js,/ADDON_PARMESAO_VALE/);
  assert.match(js,/parmesaoVale:true/);
  assert.match(js,/Opcional · 1 unidade por pedido/);
});

test('cliente precisa marcar a oferta e o total unificado inclui o adicional',()=>{
  assert.match(js,/type=\"checkbox\"/);
  assert.match(js,/selected=!!e\.target\.checked/);
  assert.match(js,/products\+addon-discounts/);
  assert.match(js,/productsAfter\+freight/);
  assert.match(js,/syncMainTotal/);
});

test('popups de entrega e confirmação usam o mesmo estado de valores',()=>{
  assert.match(js,/dm954ConfirmTotal/);
  assert.match(js,/parmesaoConfirmRow936/);
  assert.match(js,/Confirme sua entrega/);
  assert.match(js,/parmesaoUnifiedDelivery936/);
  assert.match(js,/patchDeliveryConfirm/);
  assert.match(js,/patchCustomerDeliveryDialog/);
});

test('requisição envia somente a decisão e servidor continua sendo autoridade do preço',()=>{
  assert.match(js,/body\.checkoutUpsell=\{\.\.\.\(body\.checkoutUpsell\|\|\{\}\),parmesaoVale:true\}/);
  assert.doesNotMatch(js,/body\.checkoutUpsell\s*=\s*\{[^}]*preco/);
});

test('PWA preserva o módulo do parmesão e busca ativos pela rede',()=>{
  assert.match(html,/checkout-parmesao-v9-3-6\.js/);
  assert.match(sw,/checkout-parmesao-v9-3-6\.js/);
  assert.match(sw,/cache:'no-store'/);
});