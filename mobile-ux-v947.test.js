const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

const html=fs.readFileSync('index.html','utf8');
const css=fs.readFileSync('mobile-ux-v9-4-7.css','utf8');
const js=fs.readFileSync('mobile-ux-v9-4-7.js','utf8');
const sw=fs.readFileSync('service-worker.js','utf8');

test('viewport mobile usa largura do dispositivo e teclado redimensionável',()=>{
  assert.match(html,/width=device-width/);
  assert.match(html,/viewport-fit=cover/);
  assert.match(html,/interactive-widget=resizes-content/);
});

test('inputs do checkout têm fonte mínima de 16px e touch targets adequados',()=>{
  assert.match(css,/input,select,textarea\{[\s\S]*font-size:16px !important/);
  assert.match(css,/--touch-min:44px/);
  assert.match(css,/min-height:48px/);
});

test('checkout vira uma coluna em telas mobile e evita overflow horizontal',()=>{
  assert.match(css,/@media \(max-width:720px\)/);
  assert.match(css,/\.form-grid\{grid-template-columns:minmax\(0,1fr\)!important/);
  assert.match(css,/overflow-x:clip/);
});

test('camada mobile acompanha visualViewport e revela campo focado',()=>{
  assert.doesNotThrow(()=>new Function(js));
  assert.match(js,/visualViewport/);
  assert.match(js,/scrollIntoView/);
  assert.match(js,/caseirinho-keyboard-open/);
});

test('PWA carrega e versiona camada mobile 9.4.7',()=>{
  assert.match(sw,/mobile947/);
  assert.match(sw,/mobile-ux-v9-4-7\.css/);
  assert.match(sw,/mobile-ux-v9-4-7\.js/);
});
