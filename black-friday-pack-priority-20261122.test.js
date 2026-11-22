'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const promotions=require('./ecommerce-promotions-v910');
const bf=()=>({ativo:true,tipo:'BLACK_FRIDAY',precoPromocional:9,inicioEm:new Date(Date.now()-60_000).toISOString(),fimEm:new Date(Date.now()+60_000).toISOString()});

test('Black Friday aparece no produto, prevalece sobre pack e restaura o pack ao terminar',()=>{
 const p={id:'empada',nome:'Empada',preco:12,promocao:bf(),packVirtual:{ativo:true,tipo:'LEVE_X_PAGUE_Y',quantidadeLeve:3,quantidadePague:2}};
 const list=[p],q=new Map([['empada',3]]);
 assert.equal(promotions.priceInfo(p,list).current,9);
 assert.match(promotions.offerText(p,list),/BLACK FRIDAY/);
 assert.equal(promotions.linePrice('empada',3,list,q).total,27);
 assert.equal(promotions.linePrice('empada',3,list,q).promotionLabel,'BLACK FRIDAY');
 p.promocao.fimEm=new Date(Date.now()-1000).toISOString();
 assert.equal(promotions.priceInfo(p,list).current,12);
 assert.equal(promotions.linePrice('empada',3,list,q).total,24);
 assert.match(promotions.offerText(p,list),/Leve 3, pague 2/);
 assert.equal(p.packVirtual.ativo,true);
});

test('cartinho não soma unidades Black Friday para liberar Pack misto',()=>{
 const pack={ativo:true,tipo:'LEVE_X_PAGUE_Y',packId:'empadas',quantidadeLeve:3,quantidadePague:2,produtoIds:['palmito','frango']};
 const a={id:'palmito',nome:'Palmito',preco:12,promocao:bf(),packVirtual:pack};
 const b={id:'frango',nome:'Frango',preco:12,packVirtual:pack};
 const items=[{produtoId:'palmito',quantidade:1},{produtoId:'frango',quantidade:2}];
 let totals=promotions.cartTotals(items,[a,b]);
 assert.equal(totals.subtotal,33);
 assert.equal(totals.lines.get('palmito').promotionLabel,'BLACK FRIDAY');
 a.promocao.fimEm=new Date(Date.now()-1000).toISOString();
 totals=promotions.cartTotals(items,[a,b]);
 assert.equal(totals.subtotal,24);
 assert.equal(pack.ativo,true);
});

test('Pack cruzado depende do gatilho fora da Black Friday',()=>{
 const a={id:'gatilho',preco:12,promocao:bf(),packVirtual:{ativo:true,tipo:'COMPRA_X_LEVE_Y_POR_VALOR',quantidadeGatilho:2,produtoBeneficioId:'beneficio',precoBeneficio:6}};
 const b={id:'beneficio',preco:10},products=[a,b],q=new Map([[a.id,2],[b.id,1]]);
 assert.equal(promotions.linePrice('beneficio',1,products,q).total,10);
 a.promocao.fimEm=new Date(Date.now()-1000).toISOString();
 assert.equal(promotions.linePrice('beneficio',1,products,q).total,6);
});