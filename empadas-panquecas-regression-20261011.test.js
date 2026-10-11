'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {cartTotals,priceInfo,fixedPromo}=require('./ecommerce-promotions-v910.js');
const ids=['emp-frango','emp-palmito','emp-camarao','emp-escarola','emp-carne'];
const prices=[9.99,11.99,11.99,9.99,11.99];
const pack={ativo:true,packId:'pack-empadas-5-4',tipo:'LEVE_X_PAGUE_Y',quantidadeLeve:5,quantidadePague:4,produtoIds:ids,nome:'5 empadas, pague 4'};
const products=ids.map((id,i)=>({id,nome:'Empada '+id,precoEcommerce:prices[i],packVirtual:pack}));
const panqueca={id:'pan-palmito',nome:'Panqueca Palmito',precoEcommerce:13.99,promocao:{ativo:true,precoPromocional:11.99}};

test('cinco empadas de um mesmo sabor dentro de Pack misto dão uma grátis',()=>{
 const r=cartTotals([{produtoId:'emp-frango',quantidade:5}],products);
 assert.equal(r.subtotal,39.96);
 assert.equal(r.savings,9.99);
 assert.match(r.lines.get('emp-frango').promotionLabel,/Leve 5, pague 4/);
});
test('seis empadas de mesmo sabor: uma grátis, outra fora do pack',()=>{
 const r=cartTotals([{produtoId:'emp-frango',quantidade:6}],products);
 assert.equal(r.subtotal,49.95);
 assert.equal(r.savings,9.99);
});
test('dez empadas mistas geram dois packs e descontam os dois itens mais baratos',()=>{
 const cart=ids.map(produtoId=>({produtoId,quantidade:2}));
 const r=cartTotals(cart,products);
 assert.equal(r.subtotal,89.92);
 assert.equal(r.savings,21.98);
});
function round(n){return Math.round((n+Number.EPSILON)*100)/100}
test('panqueca palmito permanece separada do Pack de empadas no mesmo pedido',()=>{
 const r=cartTotals([{produtoId:'emp-frango',quantidade:5},{produtoId:'pan-palmito',quantidade:1}],[...products,panqueca]);
 assert.equal(r.subtotal,51.95);
 assert.equal(r.savings,11.99);
 assert.notEqual(r.lines.get('emp-frango').promotionGroupId,r.lines.get('pan-palmito').promotionGroupId);
});
test('promoção explicitamente desligada não é reativada por fallback Palmito',()=>{
 const p={...panqueca,promocao:{ativo:false}};
 assert.equal(fixedPromo(p),null);
 assert.equal(priceInfo(p).current,13.99);
});
test('preço REPLICAR usa o mesmo preço base da API',()=>{
 const p={id:'emp',precoModo:'REPLICAR',preco:14.99,precoEcommerce:9.99};
 assert.equal(priceInfo(p).current,14.99);
});
