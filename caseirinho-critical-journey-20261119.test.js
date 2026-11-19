'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const file=n=>fs.readFileSync(path.join(__dirname,n),'utf8');
test('nova loja tem scripts válidos e uma única origem para catálogo e checkout',()=>{
 for(const n of ['caseirinho-shop-hub.js','caseirinho-customer-favorites.js','app.js'])new vm.Script(file(n),{filename:n});
 const html=file('index.html');
 assert.match(html,/caseirinho-shop-hub\.js\?v=/);
 assert.match(html,/caseirinho-customer-favorites\.js\?v=/);
 assert.match(html,/id="checkout"/);
 assert.match(html,/id="seasonalSection"/);
 assert.match(html,/id="featured"/);
 assert.equal((html.match(/<script src="\.\/app\.js\?/g)||[]).length,1);
});
test('cliente pode recuperar catálogo quando a API falhar',()=>{
 const hub=file('caseirinho-shop-hub.js'),app=file('app.js');
 assert.match(hub,/catalogStatusLine/);
 assert.match(hub,/home\.after\(statusLine\)/);
 assert.match(app,/retryCatalog/);
 assert.match(app,/seasonalFallback/);
});
test('ofertas e encomendas permanecem vinculadas às regras comerciais existentes',()=>{
 const hub=file('caseirinho-shop-hub.js');
 assert.match(hub,/CaseirinhoPromotions/);
 assert.match(hub,/seasonalSection/);
 assert.match(hub,/data-hub-target/);
 assert.match(hub,/activeBF/);
});
test('favoritos não modificam preços nem finalização e são separados por telefone',()=>{
 const fav=file('caseirinho-customer-favorites.js');
 assert.match(fav,/customer_profile_v1/);
 assert.match(fav,/favorites_.*phone/);
 assert.match(fav,/CaseirinhoCurrentPublicCatalog/);
 assert.doesNotMatch(fav,/fetch\s*\(/);
 assert.doesNotMatch(fav,/orders\/.*POST/);
});
test('versão instalável do PWA inclui as novas telas',()=>{
 const sw=file('service-worker.js');
 for(const name of ['caseirinho-shop-hub.js','caseirinho-shop-hub.css','caseirinho-customer-favorites.js','caseirinho-customer-favorites.css'])assert.ok(sw.includes(name),name);
});