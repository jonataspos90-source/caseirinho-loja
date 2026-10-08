const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const {cartTotals}=require('./ecommerce-promotions-v910.js');

const products=[
 {id:'frango',precoEcommerce:9.99,packVirtual:{ativo:true,tipo:'LEVE_X_PAGUE_Y',quantidadeLeve:5,quantidadePague:4,produtoIds:['frango','carne','escarola'],packId:'pack-empadas'}},
 {id:'carne',precoEcommerce:11.99},
 {id:'escarola',precoEcommerce:11.99}
];
const cart=[
 {produtoId:'frango',quantidade:3},
 {produtoId:'carne',quantidade:2},
 {produtoId:'escarola',quantidade:1}
];
const brl=n=>n.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
function fakeContext(chosenCart=cart){
 const ids=['subtotal','originalProductsLine','originalProductsValue','packDiscountLine','packDiscountTotal','packDiscountLabel'];
 const elements=Object.fromEntries(ids.map(id=>[id,{id,textContent:'',hidden:true}]));
 const source=fs.readFileSync(__dirname+'/app.js','utf8');
 const begin=source.indexOf('function syncPackPriceRows(pricing){');
 const end=source.indexOf('// Corrige valores de um script/cache antigo',begin);
 assert.ok(begin>=0&&end>begin,'função de reconciliação presente');
 const code=source.slice(begin,end);
 const context=vm.createContext({
  cart:chosenCart,catalog:{produtos:products},promoApi:()=>({cartTotals}),
  roundMoney:v=>Math.round((Number(v)+Number.EPSILON)*100)/100,
  N:v=>Number(v)||0,S:v=>String(v??''),money:brl,E:id=>elements[id]
 });
 vm.runInContext(code,context);
 return{elements,update:()=>context.syncPackPriceRows()};
}
test('6 empadas: preço cheio 65,94, desconto 9,99 e valor líquido 55,95',()=>{
 const pricing=cartTotals(cart,products);
 assert.equal(pricing.subtotal,55.95);
 assert.equal(pricing.savings,9.99);
 const {elements,update}=fakeContext();
 elements.subtotal.textContent='R$ 65,94'; // Outra rotina usou indevidamente o total bruto.
 update();
 assert.equal(elements.subtotal.textContent,brl(55.95));
 assert.equal(elements.originalProductsValue.textContent,brl(65.94));
 assert.equal(elements.packDiscountTotal.textContent,brl(9.99));
 assert.match(elements.packDiscountLabel.textContent,/Leve 5, pague 4/);
 assert.equal(elements.packDiscountLine.hidden,false);
 assert.equal(elements.originalProductsLine.hidden,false);
});
test('5 empadas mantém o mesmo desconto e cobra 43,96',()=>{
 const items=cart.slice(0,2),pricing=cartTotals(items,products);
 assert.equal(pricing.subtotal,43.96);
 assert.equal(pricing.savings,9.99);
 const {elements,update}=fakeContext(items);
 update();
 assert.equal(elements.subtotal.textContent,brl(43.96));
 assert.equal(elements.originalProductsValue.textContent,brl(53.95));
});
test('quantidade abaixo do limiar oculta o benefício',()=>{
 const items=[{produtoId:'frango',quantidade:1},{produtoId:'carne',quantidade:2}];
 const {elements,update}=fakeContext(items);
 update();
 assert.equal(elements.subtotal.textContent,brl(33.97));
 assert.equal(elements.packDiscountLine.hidden,true);
});
test('linha de economia é de apresentação e não entra em descontos de cupom/cashback novamente',()=>{
 const html=fs.readFileSync(__dirname+'/index.html','utf8');
 const app=fs.readFileSync(__dirname+'/app.js','utf8');
 const sw=fs.readFileSync(__dirname+'/service-worker.js','utf8');
 assert.match(html,/<strong id="packDiscountTotal">R\$\s*0,00<\/strong>/);
 assert.doesNotMatch(html,/<b id="packDiscountTotal">/);
 assert.match(app,/observer\.observe\(subtotal,\{childList:true,subtree:true,characterData:true\}\)/);
 assert.match(html,/\.\/app\.js\?v=91090/);
 assert.match(sw,/caseirinho-loja-v9\.10\.9-desconto-sem-duplicacao/);
});
