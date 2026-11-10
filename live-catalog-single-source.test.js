'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const main=fs.readFileSync('app.js','utf8');
const variants=fs.readFileSync('variant-selection-sync-v9-5-2.js','utf8');
const cards=fs.readFileSync('product-cards-mobile-v9-5-0.js','utf8');
const html=fs.readFileSync('index.html','utf8'),sw=fs.readFileSync('service-worker.js','utf8');
function extract(src,name,next){
 const a=src.indexOf('function '+name+'('),b=src.indexOf(next,a);
 assert.ok(a>=0&&b>a,'Função '+name+' encontrada');
 return src.slice(a,b);
}
const A=x=>Array.isArray(x)?x:[],S=x=>String(x??'');
function setup(){
 let live={produtos:[{id:'sku-g',nome:'Nhoque 900 gr',descricao:'Nhoque G - Molho Bolonhesa'},
 {id:'sku-p',nome:'Nhoque 450 gr',descricao:'Nhoque 450 g'}]};
 const window={CaseirinhoCurrentPublicCatalog:()=>live};
 const cardCatalog=new Function('window','remoteCatalog','A',
   extract(cards,'catalog','async function loadRemoteCatalog')+';return catalog;'
 )(window,{produtos:[{id:'sku-g',descricao:'Antigo do cartão'}]},A);
 const cardProduct=new Function('catalog','A','S',
   extract(cards,'productById','function variantsFor')+';return productById;')(cardCatalog,A,S);
 const variantProduct=new Function('window','A','S','catalog',
   extract(variants,'productById','function displayName')+';return productById;')(window,A,S,{produtos:[{id:'sku-g',descricao:'Antigo do seletor'}]});
 return{setLive:next=>{live=next},cardProduct,variantProduct};
}
test('Ambos os componentes usam a descrição pública atual, não a cópia antiga',()=>{
 const x=setup();
 assert.equal(x.cardProduct('sku-g').descricao,'Nhoque G - Molho Bolonhesa');
 assert.equal(x.variantProduct('sku-g').descricao,'Nhoque G - Molho Bolonhesa');
 x.setLive({produtos:[{id:'sku-g',descricao:'Nhoque artesanal com molho bolonhesa caseiro.'},
 {id:'sku-p',descricao:'Nhoque individual 450 g.'}]});
 assert.equal(x.cardProduct('sku-g').descricao,'Nhoque artesanal com molho bolonhesa caseiro.');
 assert.equal(x.variantProduct('sku-g').descricao,'Nhoque artesanal com molho bolonhesa caseiro.');
 assert.equal(x.cardProduct('sku-p').descricao,'Nhoque individual 450 g.');
 assert.equal(x.variantProduct('sku-p').descricao,'Nhoque individual 450 g.');
});
test('App fornece um snapshot dinâmico do catálogo para seleção de peso',()=>{
 assert.match(main,/window\.CaseirinhoCurrentPublicCatalog=\(\)=>catalog/);
 assert.match(cards,/window\.CaseirinhoCurrentPublicCatalog/);
 assert.match(variants,/window\.CaseirinhoCurrentPublicCatalog/);
});
test('PWA invalida os scripts que tinham catálogo próprio',()=>{
 assert.match(sw,/caseirinho-loja-v9\.10\.75-catalog-single-source-20261110/);
 assert.match(html,/app\.js\?v=20261110-live-description-3/);
 assert.match(html,/product-cards-mobile-v9-5-0\.js\?v=20261110-live-source-1/);
 assert.match(html,/variant-selection-sync-v9-5-2\.js\?v=20261110-live-source-1/);
 assert.match(sw,/product-cards-mobile-v9-5-0\.js\?v=20261110-live-source-1/);
 assert.match(sw,/variant-selection-sync-v9-5-2\.js\?v=20261110-live-source-1/);
 for(const [name,src] of [['app.js',main],['cards',cards],['variants',variants],['SW',sw]])
  assert.doesNotThrow(()=>new vm.Script(src),name);
});
