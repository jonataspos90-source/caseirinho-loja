'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const engine=require('./seasonal-pack-engine');
const markup=fs.readFileSync(path.join(__dirname,'seasonal-storefront-merch.js'),'utf8');
const ui=fs.readFileSync(path.join(__dirname,'seasonal-best-deal-store.js'),'utf8');
const html=fs.readFileSync(path.join(__dirname,'index.html'),'utf8');
const sw=fs.readFileSync(path.join(__dirname,'service-worker.js'),'utf8');
const pack={id:'virtual-empadas',name:'5 Empadas',quantity:5,price:47.99,active:true,
 productIds:['frango','palmito'],sortOrder:0};
function simulate(frango,palmito){
 const items=[{produtoId:'frango',quantidade:frango},{produtoId:'palmito',quantidade:palmito}].filter(x=>x.quantidade);
 const rows=new Map();
 if(frango)rows.set('frango',{total:Math.round(frango*999)/100,savings:0,unitPrice:9.99});
 if(palmito)rows.set('palmito',{total:Math.round(palmito*1199)/100,savings:0,unitPrice:11.99});
 return engine.apply({lines:rows,subtotal:0,savings:0},items,[pack]);
}
test('cinco empadas de diferentes sabores custam R$ 47,99 e geram pack único',()=>{
 const r=simulate(2,3);
 assert.equal(r.subtotal,47.99);
 assert.equal(r.appliedPacks[0].sets,1);
});
test('cinco do mesmo sabor ou cinco de outro sabor custam R$ 47,99',()=>{
 assert.equal(simulate(5,0).subtotal,47.99);
 assert.equal(simulate(0,5).subtotal,47.99);
});
test('seis unidades ficam com um pack de cinco mais um item avulso',()=>{
 assert.equal(simulate(6,0).subtotal,57.98);
});
test('vitrine mostra os packs antes dos produtos e permite selecionar sabores',()=>{
 assert.ok(html.indexOf('id="seasonalPacks"')<html.indexOf('id="seasonalProducts"'));
 assert.match(markup,/Packs Virtuais de Encomendas/);
 assert.match(markup,/PACK VIRTUAL DE ENCOMENDAS/);
 assert.match(markup,/data-season-pack-qty/);
 assert.match(ui,/btn\.disabled=!ready/);
 assert.match(sw,/caseirinho-loja-v9\.10\.90-virtual-packs/);
 assert.match(html,/seasonal-storefront-merch\.js\?v=20261116-virtual1/);
});
