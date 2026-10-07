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

test('pack misto combina produtos diferentes e cobra os itens de maior preço',()=>{
  const deals=['palmito','frango','carne'].map((id,i)=>({
    id,nome:id,preco:[14,12,10][i],
    packVirtual:{id:'festa-mista',packId:'festa-mista',ativo:true,tipo:'LEVE_X_PAGUE_Y',quantidadeLeve:3,quantidadePague:2,produtoIds:['palmito','frango','carne']}
  }));
  const result=promo.cartTotals([
    {produtoId:'palmito',quantidade:1},{produtoId:'frango',quantidade:1},{produtoId:'carne',quantidade:1}
  ],deals);
  assert.equal(result.subtotal,26);
  assert.equal(result.savings,10);
  assert.equal(result.lines.get('carne').total,0);
  assert.match(result.lines.get('carne').promotionLabel,/maiores preços cobrados/);
  assert.equal(result.lines.get('palmito').promotionGroupId,result.lines.get('carne').promotionGroupId);
  assert.match(result.lines.get('palmito').promotionLabel,/Leve 3, pague 2/);
});

test('pack misto agrupa os itens e explica quanto falta antes de liberar a promoção',()=>{
  const ids=['palmito','frango','camarao','carne','escarola'];
  const products=ids.map((id,i)=>({id,nome:id,preco:[14,10,12,11,9][i],packVirtual:{id:'empadas-5-por-4',packId:'empadas-5-por-4',ativo:true,tipo:'LEVE_X_PAGUE_Y',quantidadeLeve:5,quantidadePague:4,produtoIds:ids}}));
  products.push({id:'panqueca',nome:'Panqueca',preco:13.99});
  const cart=[...ids.slice(0,4).map(produtoId=>({produtoId,quantidade:1})),{produtoId:'panqueca',quantidade:1}];
  const result=promo.cartTotals(cart,products);
  assert.equal(result.subtotal,60.99);
  assert.equal(result.savings,0);
  const empadaLines=ids.slice(0,4).map(id=>result.lines.get(id));
  assert.equal(new Set(empadaLines.map(line=>line.promotionGroupId)).size,1);
  assert.equal(result.lines.get('panqueca').promotionGroupId,'');
  assert.deepEqual(empadaLines[0].promotionGroupProgress,{eligible:4,required:5,remaining:1,pending:true});
  assert.match(empadaLines[0].promotionGroupHint,/Faltam 1/);
});

test('promoção fixa de um sabor não altera o preço nem o destaque do restante da grade',()=>{
  const palmito={id:'palmito',gradeId:'panqueca',preco:13.99,promocao:{ativo:true,precoPromocional:11.99}};
  const carne={id:'carne',gradeId:'panqueca',preco:13.99};
  assert.deepEqual(promo.priceInfo(palmito),{regular:13.99,current:11.99,conditional:false});
  assert.equal(promo.isFeatured(palmito,[palmito,carne]),true);
  assert.equal(promo.isFeatured(carne,[palmito,carne]),false);
});
