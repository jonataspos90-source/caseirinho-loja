const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

const js=fs.readFileSync('delivery-moto-v9-5-3.js','utf8');
const html=fs.readFileSync('index.html','utf8');
const sw=fs.readFileSync('service-worker.js','utf8');

test('Entrega Moto V9.5.3 possui sintaxe válida',()=>{
  assert.doesNotThrow(()=>new Function(js));
});

test('checkout consulta cotação de entrega em tempo real',()=>{
  assert.match(js,/delivery-quote/);
  assert.match(js,/scheduleQuote/);
  assert.match(js,/Envios Moto - Uber\/99/);
  assert.match(js,/distanceKm/);
  assert.match(js,/quote\.amount/);
});

test('resumo final pergunta Fazer o Pedido e discrimina valores',()=>{
  assert.match(js,/Fazer o Pedido\?/);
  assert.match(js,/Produtos/);
  assert.match(js,/Taxa de entrega/);
  assert.match(js,/Total/);
  assert.match(js,/requestSubmit/);
});

test('endereço fora do limite bloqueia conclusão',()=>{
  assert.match(js,/canDeliver===false/);
  assert.match(js,/setCheckoutBlocked\(true\)/);
  assert.match(js,/Fora da área/);
});

test('Loja e PWA carregam V9.5.3',()=>{
  assert.match(html,/Loja Online · V9\.5\.3/);
  assert.match(html,/productCardVersion:'9\.5\.3'/);
  assert.match(html,/delivery-moto-v9-5-3\.js\?v=9530/);
  assert.match(sw,/cards953-delivery/);
  assert.match(sw,/delivery-moto-v9-5-3\.js/);
});
