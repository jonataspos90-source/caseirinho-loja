const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

const js=fs.readFileSync('variant-selection-sync-v9-5-2.js','utf8');
const html=fs.readFileSync('index.html','utf8');
const sw=fs.readFileSync('service-worker.js','utf8');

test('sync V9.5.2 possui sintaxe válida',()=>{
  assert.doesNotThrow(()=>new Function(js));
});

test('seleção no card sincroniza nome, descrição, preço e imagem',()=>{
  assert.match(js,/function applyCard/);
  assert.match(js,/\.product-body h3/);
  assert.match(js,/\.product-body \.description/);
  assert.match(js,/\.product-body \.price/);
  assert.match(js,/img\.src=src/);
});

test('foto e botão detalhes passam a apontar para o SKU selecionado',()=>{
  assert.match(js,/pic\.dataset\.view=S\(id\)/);
  assert.match(js,/view\.dataset\.view=S\(id\)/);
});

test('modal sincroniza nome, descrição, preço e galeria da variante',()=>{
  assert.match(js,/function applyModal/);
  assert.match(js,/modalName/);
  assert.match(js,/modalDescription/);
  assert.match(js,/modalPrice/);
  assert.match(js,/renderGallery\(p\)/);
});

test('Loja V9.5.5 mantém sync V9.5.2 e Entrega disponível',()=>{
  assert.match(html,/Loja Online · V9\.5\.5/);
  assert.match(html,/variant-selection-sync-v9-5-2\.js\?v=9520/);
  assert.match(html,/delivery-moto-v9-5-4\.js\?v=9540/);
  assert.match(html,/delivery-mode-v9-5-5\.js\?v=9550/);
  assert.match(sw,/cards955-delivery-mode/);
  assert.match(sw,/SYNCJS952/);
  assert.match(sw,/variant-selection-sync-v9-5-2\.js/);
  assert.match(sw,/DELIVERYJS954/);
  assert.match(sw,/DELIVERYMODE955/);
});
