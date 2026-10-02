const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

const js=fs.readFileSync('delivery-moto-v9-5-4.js','utf8');
const mode=fs.readFileSync('delivery-mode-v9-5-5.js','utf8');
const html=fs.readFileSync('index.html','utf8');
const sw=fs.readFileSync('service-worker.js','utf8');

test('Entrega Moto V9.5.4 possui sintaxe válida',()=>{
  assert.doesNotThrow(()=>new Function(js));
});

test('checkout consulta cotação de entrega sem travar interface',()=>{
  assert.match(js,/delivery-quote/);
  assert.match(js,/scheduleQuote/);
  assert.match(js,/AbortController/);
  assert.match(js,/Tempo limite ao calcular a rota/);
  assert.doesNotMatch(js,/new MutationObserver/);
  assert.match(js,/setInterval/);
});

test('Uber e 99 aparecem apenas como informação logística',()=>{
  assert.match(js,/Entrega por Moto · Uber\/99/);
  assert.match(js,/Não há contratação automática dessas plataformas pelo app/);
  assert.match(js,/cálculo serve somente para definir distância e taxa de entrega/);
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

test('falha de cálculo não bloqueia o pedido',()=>{
  assert.match(js,/quote=\{fallback:true/);
  assert.match(js,/setCheckoutBlocked\(false\)/);
  assert.match(js,/Você pode continuar o pedido normalmente/);
});

test('V9.5.5 garante a opção Entrega e preserva a escolha',()=>{
  assert.doesNotThrow(()=>new Function(mode));
  assert.match(mode,/ensureDeliveryOption/);
  assert.match(mode,/option\.value='ENTREGA'/);
  assert.match(mode,/preferredMode==='ENTREGA'/);
  assert.match(mode,/MutationObserver/);
});

test('Loja e PWA publicam V9.5.5 com cálculo V9.5.4',()=>{
  assert.match(html,/Loja Online · V9\.5\.5/);
  assert.match(html,/productCardVersion:'9\.5\.5'/);
  assert.match(html,/delivery-moto-v9-5-4\.js\?v=9540/);
  assert.match(html,/delivery-mode-v9-5-5\.js\?v=9550/);
  assert.doesNotMatch(html,/delivery-moto-v9-5-3\.js/);
  assert.match(sw,/cards955-delivery-mode/);
  assert.match(sw,/DELIVERYJS954/);
  assert.match(sw,/DELIVERYMODE955/);
  assert.match(sw,/stripOldDeliveryScripts/);
});
