'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {base,priceInfo,cartTotals}=require('./ecommerce-promotions-v910.js');

const pack={ativo:true,tipo:'LEVE_X_PAGUE_Y',packId:'pack-panquecas',
  quantidadeLeve:6,quantidadePague:5,produtoIds:['palmito','frango','carne']};
const products=[
  {id:'palmito',nome:'Panqueca Palmito',precoEcommerce:13.99,
    promocao:{ativo:true,precoPromocional:11.99},packVirtual:pack},
  {id:'frango',nome:'Panqueca Frango',precoEcommerce:11.99,packVirtual:pack},
  {id:'carne',nome:'Panqueca Carne',precoEcommerce:11.99,packVirtual:pack}
];

test('no card do pack aparece valor base do Palmito; promocao individual e independente',()=>{
  assert.equal(base(products[0]),13.99);
  assert.equal(priceInfo(products[0],products).regular,13.99);
  assert.equal(priceInfo(products[0],products).current,11.99);
  const app=fs.readFileSync(__dirname+'/app.js','utf8');
  const start=app.indexOf('function promoPackHtml(');
  const end=app.indexOf('function wireProductCards(',start);
  assert.ok(start>=0&&end>start,'renderizador de pack misto encontrado');
  const render=app.slice(start,end);
  assert.match(render,/price=productPriceInfo\(p\)\.regular/);
  assert.doesNotMatch(render,/price=productPriceInfo\(p\)\.current/);
});

test('fora do pack o Palmito continua na promocao individual',()=>{
  const pricing=cartTotals([{produtoId:'palmito',quantidade:1}],products);
  assert.equal(pricing.subtotal,11.99);
});

test('pack de 6 combina sabores com maior preco cobrado e desconto separado',()=>{
  const cart=[{produtoId:'palmito',quantidade:2},{produtoId:'frango',quantidade:4}];
  const pricing=cartTotals(cart,products);
  assert.equal(pricing.subtotal,63.95);
  assert.equal(pricing.savings,11.99);
});
