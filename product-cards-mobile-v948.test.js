const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

const css=fs.readFileSync('product-cards-mobile-v9-4-8.css','utf8');
const js=fs.readFileSync('product-cards-mobile-v9-4-9.js','utf8');
const html=fs.readFileSync('index.html','utf8');
const sw=fs.readFileSync('service-worker.js','utf8');

test('card mobile sobrescreve o grid antigo de 430px',()=>{
  assert.match(css,/display:flex!important/);
  assert.match(css,/flex-direction:column!important/);
  assert.match(css,/grid-template-columns:none!important/);
  assert.match(css,/aspect-ratio:4\/3!important/);
});

test('grade exibe opções com preços e CTA de adicionar',()=>{
  assert.match(js,/card-grade-options/);
  assert.match(js,/variacaoLabel/);
  assert.match(js,/money\(priceOf\(v\)\)/);
  assert.match(js,/\+ Adicionar ao carrinho/);
  assert.match(js,/card-add-selected/);
});

test('card usa fluxo existente do modal para adicionar variante correta',()=>{
  assert.match(js,/#variantBox \[data-variant\]/);
  assert.match(js,/modalAdd/);
  assert.match(js,/productClose/);
});

test('observador 9.4.9 não reprocessa o próprio card',()=>{
  assert.match(js,/cardUi949==='done'/);
  assert.match(js,/cardUi949==='working'/);
  assert.match(js,/requestAnimationFrame\(enhanceAll\)/);
  assert.match(js,/retries>=20/);
});

test('Loja e PWA carregam correção segura 9.4.9',()=>{
  assert.match(html,/product-cards-mobile-v9-4-8\.css\?v=9490/);
  assert.match(html,/product-cards-mobile-v9-4-9\.js\?v=9490/);
  assert.doesNotMatch(html,/product-cards-mobile-v9-4-8\.js/);
  assert.match(sw,/cards949/);
  assert.match(sw,/product-cards-mobile-v9-4-8\.css/);
  assert.match(sw,/product-cards-mobile-v9-4-9\.js/);
});

test('JavaScript 9.4.9 possui sintaxe válida',()=>{
  assert.doesNotThrow(()=>new Function(js));
});
