const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=__dirname;
const sw=fs.readFileSync(path.join(root,'service-worker.js'),'utf8');
const hotfix=fs.readFileSync(path.join(root,'store-hotfix-v9-3-1.js'),'utf8');
const version=fs.readFileSync(path.join(root,'VERSAO.txt'),'utf8');

test('PWA da Loja invalida cache antigo e injeta hotfix',()=>{
  assert.match(sw,/caseirinho-loja-v9\.3\.1-usage-images/);
  assert.match(sw,/store-hotfix-v9-3-1\.js/);
  assert.match(sw,/injectHotfix/);
});

test('Loja volta a enviar heartbeat próprio para Uso App',()=>{
  assert.match(hotfix,/usage\/ping/);
  assert.match(hotfix,/appVersion:'LOJA:'\+VERSION/);
  assert.match(hotfix,/store-/);
  assert.match(hotfix,/standalone\(\)/);
});

test('Rótulo ilustrativo não cobre fotos reais',()=>{
  assert.match(hotfix,/isIllustrative/);
  assert.match(hotfix,/\.image-note/);
  assert.match(hotfix,/note\.style\.display=fallback\?'':'none'/);
});

test('Contrato de versão aponta para API 1.18.0',()=>{
  assert.match(version,/API esperada: 1\.18\.0/);
});
