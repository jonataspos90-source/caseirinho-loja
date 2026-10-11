'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {base,fixedPromo,priceInfo,isFeatured,offerText,linkedPack,cartTotals}=require('./ecommerce-promotions-v910.js');

test('empadas no Pack Leve 5 Pague 4: só o menor dos cinco produtos fica grátis',()=>{
 const ids=['frango','carne','escarola','palmito','camarao'];
 const values=[9.99,11.99,11.99,9.99,11.99];
 const rule={ativo:true,tipo:'LEVE_X_PAGUE_Y',packId:'empadas-5-4',nome:'Empadas mistas',quantidadeLeve:5,quantidadePague:4,produtoIds:ids};
 const products=ids.map((id,i)=>({id,nome:'Empada '+id,precoEcommerce:values[i],...(i===0?{packVirtual:rule}:{})}));
 const five=cartTotals(ids.map(produtoId=>({produtoId,quantidade:1})),products);
 assert.equal(five.subtotal,45.96);
 assert.equal(five.savings,9.99);
 assert.equal(five.lines.get('frango').promotionGroupId,five.lines.get('camarao').promotionGroupId);
 assert.equal(linkedPack(products[1],products).packId,'empadas-5-4');
 assert.equal(isFeatured(products[2],products),true);
 assert.match(offerText(products[3],products),/Leve 5, pague 4/);
});

test('a sexta empada barata não retira desconto já conquistado com cinco',()=>{
 const ids=['a','b','c','d','e','extra'];
 const prices=[16,15,14,13,12,5];
 const products=ids.map((id,i)=>({id,precoEcommerce:prices[i],...(i===0?{packVirtual:{ativo:true,tipo:'LEVE_X_PAGUE_Y',packId:'6-empadas',quantidadeLeve:5,quantidadePague:4,produtoIds:ids}}:{})}));
 const five=cartTotals(ids.slice(0,5).map(produtoId=>({produtoId,quantidade:1})),products);
 const six=cartTotals(ids.map(produtoId=>({produtoId,quantidade:1})),products);
 assert.equal(five.savings,12);
 assert.equal(five.subtotal,58);
 assert.equal(six.savings,12);
 assert.equal(six.subtotal,63);
});

test('Panqueca Palmito segue promoção ativa do ERP sem descontar outros sabores',()=>{
 const palmito={id:'palmito',nome:'Panqueca Palmito',precoEcommerce:13.99,promocao:{ativo:true,precoPromocional:10.99}};
 const frango={id:'frango',nome:'Panqueca Frango',precoEcommerce:13.99};
 assert.equal(priceInfo(palmito).current,10.99);
 assert.equal(priceInfo(frango).current,13.99);
 assert.equal(cartTotals([{produtoId:'palmito',quantidade:1},{produtoId:'frango',quantidade:1}],[palmito,frango]).subtotal,24.98);
 palmito.promocao={ativo:false};
 assert.equal(fixedPromo(palmito),null);
 assert.equal(priceInfo(palmito).current,13.99);
});

test('REPLICAR usa preço publicado pelo ERP e não valor E-commerce antigo',()=>{
 const p={id:'empada',precoModo:'REPLICAR',preco:11.99,precoEcommerce:9.99};
 assert.equal(base(p),11.99);
 assert.equal(cartTotals([{produtoId:'empada',quantidade:2}],[p]).subtotal,23.98);
});

test('desconto condicionado da panqueca só aparece no carrinho após gatilho',()=>{
 const trigger={id:'panqueca',nome:'Panqueca',preco:12,packVirtual:{ativo:true,tipo:'COMPRA_X_LEVE_Y_POR_VALOR',quantidadeGatilho:2,produtoBeneficioId:'empada',precoBeneficio:5}};
 const bonus={id:'empada',nome:'Empada',preco:10};
 const before=priceInfo(bonus,[trigger,bonus]);
 assert.equal(before.current,10);
 assert.equal(before.benefitPrice,5);
 assert.match(offerText(bonus,[trigger,bonus]),/R\$ 5,00/);
 assert.equal(cartTotals([{produtoId:'panqueca',quantidade:1},{produtoId:'empada',quantidade:1}],[trigger,bonus]).lines.get('empada').total,10);
 assert.equal(cartTotals([{produtoId:'panqueca',quantidade:2},{produtoId:'empada',quantidade:1}],[trigger,bonus]).lines.get('empada').total,5);
});
