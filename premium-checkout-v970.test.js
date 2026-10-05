const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

const html=fs.readFileSync('index.html','utf8');
const js=fs.readFileSync('premium-checkout-v9-7-0.js','utf8');
const css=fs.readFileSync('premium-checkout-v9-7-0.css','utf8');
const parmesao=fs.readFileSync('checkout-parmesao-v9-3-6.js','utf8');

test('V9.7.0 carrega tema premium no checkout',()=>{
  assert.match(html,/premium-checkout-v9-7-0\.css\?v=9700/);
  assert.match(html,/premium-checkout-v9-7-0\.js\?v=9700/);
  assert.match(html,/premiumCheckoutVersion:'9\.7\.0'/);
  assert.match(css,/--caseirinho-wine:#7b1438/);
  assert.match(css,/customer-experience-card/);
  assert.match(css,/dm954-card/);
});

test('checkout premium cria experiência emocional e selos de confiança',()=>{
  assert.match(js,/Seu momento Caseirinho começa aqui/);
  assert.match(js,/Pedido seguro/);
  assert.match(js,/Valores conferidos/);
  assert.match(js,/Acompanhamento pelo WhatsApp/);
});

test('popup de entrega reutiliza o estado unificado do parmesão e frete',()=>{
  assert.match(js,/CaseirinhoParmesaoUpsell936\?\.totalState/);
  assert.match(js,/Total com entrega/);
  assert.match(parmesao,/function totalState\(\)/);
  assert.match(parmesao,/patchDeliveryConfirm/);
  assert.match(parmesao,/patchCustomerDeliveryDialog/);
});

test('adicional continua sendo enviado ao servidor como item oficial',()=>{
  assert.match(parmesao,/checkoutUpsell/);
  assert.match(parmesao,/parmesaoVale:true/);
  assert.match(parmesao,/ADDON_PARMESAO_VALE/);
});
