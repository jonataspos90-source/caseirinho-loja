const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

const hotfix=fs.readFileSync('store-hotfix-v9-3-4.js','utf8');
const app=fs.readFileSync('app.js','utf8');
const index=fs.readFileSync('index.html','utf8');

test('catálogo publicado não pode ser lido do localStorage',()=>{
  assert.match(hotfix,/if\(this===localStorage&&isCatalogKey\(key\)\)return null/);
  assert.match(hotfix,/if\(this===localStorage&&isCatalogKey\(key\)\)return;/);
  assert.match(hotfix,/serverAuthoritative:true/);
});

test('hotfix de autoridade carrega antes do app da loja',()=>{
  const hotfixPos=index.indexOf('store-hotfix-v9-3-4.js');
  const appPos=index.indexOf('app.js');
  assert.ok(hotfixPos>=0,'hotfix V9.3.4/9.3.5 não está no HTML');
  assert.ok(appPos>hotfixPos,'hotfix deve executar antes do app.js');
});

test('consulta do catálogo continua sem cache HTTP',()=>{
  assert.match(app,/cache:'no-store'/);
  assert.match(app,/'Cache-Control':'no-cache'/);
});
