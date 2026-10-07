'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

const base=fs.readFileSync('caseirinho-coupon-assistant-v9-5-8.js','utf8');
const john=fs.readFileSync('caseirinho-john-coupon-v9-5-9.js','utf8');
const index=fs.readFileSync('index.html','utf8');
const sw=fs.readFileSync('service-worker.js','utf8');

test('assistentes base e John V9.5.9 possuem JavaScript válido',()=>{
  assert.doesNotThrow(()=>new Function(base));
  assert.doesNotThrow(()=>new Function(john));
});

test('fluxo CASEIRINHO10 continua solicitando WhatsApp e validando primeira compra',()=>{
  assert.match(base,/CASEIRINHO10 dá 10% na primeira compra/);
  assert.match(base,/PRIMEIRA_COMPRA_OK/);
  assert.match(base,/CLIENTE_JA_USOU/);
  assert.match(base,/CUPOM_EXPIRADO/);
  assert.match(base,/\/api\/v1\/cupons\/validar/);
  assert.match(john,/validateFirstPurchase/);
});

test('cupom genérico usa validação privada no servidor e não depende do campo nativo oculto',()=>{
  assert.match(john,/async function applyGenericCoupon/);
  assert.match(john,/GENERIC_OK/);
  assert.match(john,/\/coupon\/validate\?_t=/);
  assert.match(john,/\/commercial-apply\?_t=/);
  assert.doesNotMatch(john,/\/commerce-engine\?_t=/);
  assert.doesNotMatch(john,/syncNativeGeneric/);
  assert.doesNotMatch(john,/ceCouponInput/);
});

test('loja não revela lista de cupons ativos ao cliente',()=>{
  assert.match(john,/A validade e as regras serão conferidas automaticamente/);
  assert.match(john,/os cupons ativos não são exibidos na loja/);
  assert.doesNotMatch(john,/Cupons ativos:/);
});

test('John consulta contexto real da loja e responde além de cupons',()=>{
  assert.match(john,/Fale com John/);
  assert.match(john,/\/catalog\?_t=/);
  assert.match(john,/currentPaymentOptions/);
  assert.match(john,/currentOrder/);
  assert.match(john,/findProducts/);
  assert.match(john,/carrinho/);
  assert.match(john,/entrega/);
  assert.match(john,/pagamento/);
});

test('index V9.9.0 preserva cupons e carrega cashback antes do app principal',()=>{
  assert.ok(index.includes('<title>Loja Online · V9.9.0</title>'));
  assert.ok(index.includes("version:'9.9.0'"));
  assert.ok(index.includes("johnAssistantVersion:'9.9.0'"));
  assert.ok(index.includes("cashbackVersion:'9.6.0'"));
  const basePos=index.indexOf('caseirinho-coupon-assistant-v9-5-8.js');
  const johnPos=index.indexOf('caseirinho-john-coupon-v9-5-9.js');
  const cashbackPos=index.indexOf('caseirinho-cashback-v9-6-0.js');
  const appPos=index.indexOf('./app.js?v=9850');
  assert.ok(basePos>=0&&johnPos>basePos&&cashbackPos>johnPos&&appPos>cashbackPos);
});

test('PWA V9.9.0 preserva John e inclui Cashback',()=>{
  assert.ok(sw.includes('caseirinho-loja-v9.9.0-john-assistant'));
  assert.ok(sw.includes('JOHNJS959'));
  assert.ok(sw.includes('CASHBACKJS960'));
  assert.ok(sw.includes('caseirinho-john-coupon-v9-5-9.js?v=9901'));
  assert.ok(sw.includes('caseirinho-cashback-v9-6-0.js?v=9600'));
  assert.ok(sw.includes("injectBeforeApp(html,'caseirinho-john-coupon-v9-5-9.js',JOHNJS959_TAG)"));
  assert.ok(sw.includes("injectBeforeApp(html,'caseirinho-cashback-v9-6-0.js',CASHBACKJS960_TAG)"));
});


test('Fale com John fica no cabeçalho ao lado do carrinho e começa fechado',()=>{
  assert.ok(index.includes('class="head-actions"'));
  assert.ok(index.indexOf('id="assistant958Toggle"')<index.indexOf('id="cartTop"'));
  assert.ok(index.includes('aria-expanded="false"'));
  assert.ok(base.includes("panel.classList.toggle('open',open)"));
  assert.ok(base.includes('#assistant958Panel{position:fixed'));
  assert.ok(base.includes('display:none'));
  assert.ok(!base.includes('position:fixed;right:18px;bottom:92px'));
});

test('John filtra catálogo por peso, sabor e orçamento usando preço publicado',()=>{
  const start=john.indexOf('function productPrice(p)');
  const end=john.indexOf('function currentPaymentOptions()');
  const pure=john.slice(start,end)+String.fromCharCode(10)+'globalThis.findProducts=findProducts;globalThis.budgetLimit=budgetLimit;globalThis.formatProduct=formatProduct;';
  const context={
    S:v=>String(v??''),N:v=>Number(v)||0,A:v=>Array.isArray(v)?v:[],
    textNorm:v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9%]+/g,' ').trim(),
    money:v=>'R$ '+Number(v).toFixed(2).replace('.',','),Math,Number,String,Set
  };
  vm.runInNewContext(pure,context);
  const catalog={loja:{categorias:[{id:'n',nome:'Nhoque'},{id:'p',nome:'Panquecas'}]},produtos:[
    {id:'n500',gradeId:'g1',gradeNome:'Nhoque de Batata',nome:'Nhoque 500g',variacaoLabel:'500 g',categoriaId:'n',preco:12.99},
    {id:'n1k',gradeId:'g1',gradeNome:'Nhoque de Batata',nome:'Nhoque 1kg',variacaoLabel:'1 kg',categoriaId:'n',preco:22.99},
    {id:'p1',nome:'Panqueca de Frango',categoriaId:'p',preco:11.99}
  ]};
  const byWeight=context.findProducts(catalog,'nhoque 500 g');
  assert.equal(byWeight.length,1);assert.deepEqual(Array.from(byWeight[0].variants,v=>v.id),['n500']);
  assert.equal(context.budgetLimit('até R$ 15'),15);
  const byBudget=context.findProducts(catalog,'quais opções tenho até R$ 15?');
  assert.ok(byBudget.length>=2);assert.ok(byBudget.every(x=>x.minPrice<=15));
  assert.equal(context.findProducts(catalog,'panqueca frango')[0].p.id,'p1');
  assert.ok(context.formatProduct(byWeight[0],true).includes('500 g (R$ 12,99)'));
});
