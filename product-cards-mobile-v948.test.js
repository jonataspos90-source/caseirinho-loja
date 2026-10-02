const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

const css=fs.readFileSync('product-cards-mobile-v9-4-8.css','utf8');
const js=fs.readFileSync('product-cards-mobile-v9-5-0.js','utf8');
const html=fs.readFileSync('index.html','utf8');
const sw=fs.readFileSync('service-worker.js','utf8');

test('card mobile continua em uma coluna e sem corte lateral',()=>{
  assert.match(css,/display:flex!important/);
  assert.match(css,/flex-direction:column!important/);
  assert.match(css,/grid-template-columns:none!important/);
  assert.match(css,/aspect-ratio:4\/3!important/);
});

test('grade inteligente distingue sabor e peso quando o peso se repete',()=>{
  assert.match(js,/hasSecondDimension/);
  assert.match(js,/duplicatePrimary/);
  assert.match(js,/Sabor e peso/);
  assert.match(js,/contextualLabel/);
  assert.match(js,/detailFromDescription/);
  assert.match(js,/optionLabel/);
});

test('produto com grade exige escolha explícita antes de adicionar',()=>{
  assert.match(js,/Nenhuma opção selecionada/);
  assert.match(js,/add\.disabled=true/);
  assert.match(js,/Escolha uma opção/);
  assert.match(js,/selectedProductId/);
  assert.match(js,/Selecionado:/);
});

test('modal também mostra rótulo completo e exige escolha consciente',()=>{
  assert.match(js,/function enhanceModal/);
  assert.match(js,/explicitModalVariant/);
  assert.match(js,/buttons\.forEach/);
  assert.match(js,/A partir de /);
  assert.match(js,/Adicionar ao carrinho/);
});

test('carrinho recompõe nome completo do SKU selecionado',()=>{
  assert.match(js,/function cartProductName/);
  assert.match(js,/function enhanceCart/);
  assert.match(js,/CART_KEY/);
  assert.match(js,/produtoId/);
});

test('observadores 9.5.0 são restritos e não observam subtree dos cards',()=>{
  assert.match(js,/requestAnimationFrame\(enhanceAll\)/);
  assert.match(js,/loadRemoteCatalog/);
  assert.match(js,/cache:'no-store'/);
  assert.match(js,/cardObserver\.observe\(r,\{childList:true\}\)/);
  assert.doesNotMatch(js,/cardObserver\.observe\(r,\{childList:true,subtree:true\}\)/);
});

test('Loja 9.5.3 preserva seletor 9.5.0, agrupamento 9.5.1 e sync 9.5.2',()=>{
  assert.match(html,/productCardVersion:'9\.5\.3'/);
  assert.match(html,/product-cards-mobile-v9-4-8\.css\?v=9510/);
  assert.match(html,/product-cards-mobile-v9-5-0\.js\?v=9500/);
  assert.match(html,/variant-grouping-v9-5-1\.js\?v=9510/);
  assert.match(html,/variant-selection-sync-v9-5-2\.js\?v=9520/);
  assert.match(html,/delivery-moto-v9-5-3\.js\?v=9530/);
  assert.doesNotMatch(html,/product-cards-mobile-v9-4-9\.js/);
  assert.match(sw,/cards953-delivery/);
  assert.match(sw,/product-cards-mobile-v9-5-0\.js/);
  assert.match(sw,/variant-grouping-v9-5-1\.js/);
  assert.match(sw,/variant-selection-sync-v9-5-2\.js/);
  assert.match(sw,/delivery-moto-v9-5-3\.js/);
  assert.match(sw,/stripOldCardScripts/);
});

test('JavaScript 9.5.0 possui sintaxe válida',()=>{
  assert.doesNotThrow(()=>new Function(js));
});
