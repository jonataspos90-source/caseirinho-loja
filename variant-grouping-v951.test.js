const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

const js=fs.readFileSync('variant-grouping-v9-5-1.js','utf8');
const html=fs.readFileSync('index.html','utf8');
const sw=fs.readFileSync('service-worker.js','utf8');
const css=fs.readFileSync('product-cards-mobile-v9-4-8.css','utf8');
const carousel=fs.readFileSync('mobile-variant-carousel-v9-5-7.css','utf8');

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

test('V9.5.7 converte agrupamentos mobile em vitrine horizontal compacta',()=>{
  assert.match(carousel,/\.card-grade-flavor\{display:contents!important\}/);
  assert.match(carousel,/\.card-grade-flavor-name\{display:none!important\}/);
  assert.match(carousel,/variant-chip-track957/);
});

test('Loja V9.6.0 preserva agrupamento, sincronização, desktop, Entrega e cashback',()=>{
  assert.match(html,/Loja Online · V9\.6\.0/);
  assert.match(html,/productCardVersion:'9\.5\.7'/);
  assert.match(html,/couponAssistantVersion:'9\.5\.8'/);
  assert.match(html,/cashbackVersion:'9\.6\.0'/);
  assert.match(html,/variant-grouping-v9-5-1\.js\?v=9510/);
  assert.match(html,/variant-selection-sync-v9-5-2\.js\?v=9520/);
  assert.match(html,/mobile-variant-carousel-v9-5-7\.css\?v=9570/);
  assert.match(html,/mobile-variant-carousel-v9-5-7\.js\?v=9570/);
  assert.match(html,/desktop-ux-v9-5-6\.css\?v=9560/);
  assert.match(html,/delivery-moto-v9-5-4\.js\?v=9560/);
  assert.match(html,/delivery-mode-v9-5-5\.js\?v=9550/);
  assert.match(sw,/cards958-coupon-assistant/);
  assert.match(sw,/cashback960/);
  assert.match(sw,/variant-grouping-v9-5-1\.js/);
  assert.match(sw,/variant-selection-sync-v9-5-2\.js/);
  assert.match(sw,/mobile-variant-carousel-v9-5-7\.css/);
  assert.match(sw,/mobile-variant-carousel-v9-5-7\.js/);
  assert.match(sw,/desktop-ux-v9-5-6\.css/);
  assert.match(sw,/delivery-moto-v9-5-4\.js/);
  assert.match(sw,/delivery-mode-v9-5-5\.js/);
  assert.match(sw,/caseirinho-coupon-assistant-v9-5-8\.js/);
  assert.match(sw,/caseirinho-cashback-v9-6-0\.js/);
});
