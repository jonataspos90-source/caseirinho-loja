'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const promo=require('./ecommerce-promotions-v910');

test('preço promocional aparece em verde e entra nos destaques',()=>{
  const item={id:'bolinha',nome:'Bolinha de queijo',preco:11.99,promocao:{ativo:true,precoPromocional:9.99}};
  assert.deepEqual(promo.priceInfo(item),{regular:11.99,current:9.99,conditional:false});
  assert.equal(promo.isFeatured(item),true);
});

test('pack leve X pague Y aplica conjuntos completos e mantém unidades restantes',()=>{
  const products=[{id:'nhoque',preco:12.99,packVirtual:{ativo:true,tipo:'LEVE_X_PAGUE_Y',quantidadeLeve:3,quantidadePague:2}}];
  const q=new Map([['nhoque',4]]);
  assert.equal(promo.linePrice('nhoque',4,products,q).total,38.97);
  assert.equal(promo.linePrice('nhoque',6,products,new Map([['nhoque',6]])).total,51.96);
});

test('pack cruzado só reduz o produto benefício depois da quantidade gatilho',()=>{
  const products=[
    {id:'nhoque',nome:'Nhoque',preco:12,packVirtual:{ativo:true,tipo:'COMPRA_X_LEVE_Y_POR_VALOR',quantidadeGatilho:2,produtoBeneficioId:'molho',precoBeneficio:6}},
    {id:'molho',nome:'Molho',preco:10}
  ];
  assert.equal(promo.linePrice('molho',1,products,new Map([['nhoque',1],['molho',1]])).total,10);
  assert.equal(promo.linePrice('molho',1,products,new Map([['nhoque',2],['molho',1]])).total,6);
  assert.match(promo.offerText(products[1],products),/Na compra de 2 Nhoque/);
  assert.equal(promo.isFeatured(products[1],products),true);
});

test('quando há mais de uma regra, aplica a maior economia sem acumular descontos',()=>{
  const products=[{id:'x',preco:10,promocao:{ativo:true,precoPromocional:8},packVirtual:{ativo:true,tipo:'LEVE_X_PAGUE_Y',quantidadeLeve:3,quantidadePague:2}}];
  const result=promo.linePrice('x',3,products,new Map([['x',3]]));
  assert.equal(result.total,20);
  assert.equal(result.promotionLabel,'Leve 3, pague 2');
});
