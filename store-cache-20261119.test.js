'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname);
const sw=fs.readFileSync(path.join(root,'service-worker.js'),'utf8');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
test('service worker permanece sintaticamente válido',()=>assert.doesNotThrow(()=>new Function(sw)));
test('navegação usa rede, não preserva dados de API em cache',()=>{
 assert.match(sw,/if\(req\.mode==='navigate'\)/);
 assert.match(sw,/if\(url\.origin!==self\.location\.origin\)return/);
 assert.match(sw,/if\(req\.method!=='GET'\)return/);
});
test('versões de assets estáticos têm chave completa e revalidação',()=>{
 assert.match(sw,/cache\.match\(req\)/);
 assert.match(sw,/event\.waitUntil\(fresh\.catch/);
 assert.match(sw,/const staticAsset=\/\\\.\(\?:js\|css/);
 assert.doesNotMatch(sw,/const staticAsset=\/\\\\\./);
});
test('loja pré-conecta API e estilo de interação tem arquivo real',()=>{
 assert.match(html,/rel="preconnect" href="https:\/\/john-cloud-api-production\.up\.railway\.app"/);
 assert.match(html,/styles\.css\?v=20261119-interaction1/);
 const css=fs.readFileSync(path.join(root,'styles.css'),'utf8');
 assert.match(css,/focus-visible/);
});
