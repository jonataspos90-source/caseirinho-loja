const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

const index=fs.readFileSync('index.html','utf8');
const manifest=fs.readFileSync('manifest.webmanifest','utf8');
const script=fs.readFileSync('pwa-install-v9-6-6.js','utf8');

test('index possui metadados específicos para app no iPhone',()=>{
  assert.match(index,/apple-mobile-web-app-capable" content="yes"/);
  assert.match(index,/apple-mobile-web-app-title" content="Caseirinho"/);
  assert.match(index,/rel="apple-touch-icon"/);
  assert.match(index,/pwa-install-v9-6-6\.js\?v=9660/);
});

test('manifest está configurado como aplicativo standalone',()=>{
  const data=JSON.parse(manifest);
  assert.equal(data.display,'standalone');
  assert.equal(data.short_name,'Caseirinho');
  assert.ok(data.icons.some(i=>i.sizes==='192x192'));
  assert.ok(data.icons.some(i=>i.sizes==='512x512'));
});

test('assistente de instalação cobre iPhone e prompt nativo',()=>{
  assert.match(script,/iphone\|ipad\|ipod/i);
  assert.match(script,/beforeinstallprompt/);
  assert.match(script,/Adicionar à Tela de Início/);
  assert.match(script,/navigator\.standalone===true/);
  assert.match(script,/display-mode: standalone/);
});
