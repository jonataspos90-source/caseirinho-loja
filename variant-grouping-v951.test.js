const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

const js=fs.readFileSync('variant-grouping-v9-5-1.js','utf8');
const html=fs.readFileSync('index.html','utf8');
const sw=fs.readFileSync('service-worker.js','utf8');
const css=fs.readFileSync('product-cards-mobile-v9-4-8.css','utf8');

test('hotfix V9.5.1 possui sintaxe válida',()=>{
  assert.doesNotThrow(()=>new Function(js));
});

test('cards agrupam sabor e tamanho/peso em blocos explícitos',()=>{
  assert.match(js,/splitChoice/);
  assert.match(js,/card-grade-flavor/);
  assert.match(js,/card-grade-flavor-name/);
  assert.match(js,/data-short-label951|shortLabel951/);
});

test('modal preserva os botões originais e agrupa por sabor',()=>{
  assert.match(js,/modal-flavor-group/);
  assert.match(js,/modal-size-options/);
  assert.match(js,/variant-buttons-smart/);
  assert.match(js,/appendChild\(button\)/);
});

test('CSS contém estilos para agrupamento de sabor e opção',()=>{
  assert.match(css,/\.card-grade-flavor/);
  assert.match(css,/\.modal-flavor-group/);
  assert.match(css,/\.modal-size-options/);
});

test('Loja carrega V9.5.1 e o PWA inclui o hotfix',()=>{
  assert.match(html,/Loja Online · V9\.5\.1/);
  assert.match(html,/productCardVersion:'9\.5\.1'/);
  assert.match(html,/variant-grouping-v9-5-1\.js\?v=9510/);
  assert.match(sw,/cards951/);
  assert.match(sw,/variant-grouping-v9-5-1\.js/);
});
