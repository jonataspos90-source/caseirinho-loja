const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const src=fs.readFileSync('store-hotfix-v9-3-4.js','utf8');
const html=fs.readFileSync('index.html','utf8');
const sw=fs.readFileSync('service-worker.js','utf8');

test('rejeição usa marca persistente por id do pedido',()=>{
  assert.match(src,/rejection_once_v934/);
  assert.match(src,/markOnce\(order\.id/);
  assert.match(src,/once\[S\(order\.id\)\]/);
});

test('avisos antigos de rejeição são migrados para não reaparecer',()=>{
  assert.match(src,/migrateHistorical/);
  assert.match(src,/:rejected:/);
});

test('popup repetido é encerrado pelo botão OK para liberar a promise original',()=>{
  assert.match(src,/queueMicrotask\(\(\)=>ok\.click\(\)\)/);
});

test('V9.3.4 é carregada diretamente e pelo PWA',()=>{
  assert.match(html,/store-hotfix-v9-3-4\.js\?v=934/);
  assert.match(sw,/store-hotfix-v9-3-4\.js/);
  assert.match(sw,/caseirinho-loja-v9\.3\.4-rejection-loop/);
});
