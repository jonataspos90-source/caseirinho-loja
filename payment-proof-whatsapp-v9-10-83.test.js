'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'payment-proof-whatsapp-v9-10-83.js'),'utf8');

function browser(phone='(11) 93456-7890'){
 const nodes={},handlers={};
 function element(tag='div'){
  return{
   tagName:tag.toUpperCase(),id:'',children:[],dataset:{},style:{},className:'',textContent:'',hidden:false,
   append(...nodes){this.children.push(...nodes);},
   appendChild(node){this.children.push(node);return node;},
   replaceChildren(...nodes){this.children=[...nodes];},
   setAttribute(){},addEventListener(){},scrollIntoView(){},
   insertAdjacentElement(position,node){this.lastInserted=node;if(node.id)nodes[node.id]=node;},
   querySelector(selector){return selector==='.caseirinho-proof-notice'?this.children.find(c=>c.className?.includes('caseirinho-proof-notice'))||null:null;},
   querySelectorAll(){return[];},closest(){return this;}
  };
 }
 const payment=element('select'),label=element('label');
 payment.value='PIX_SINAL_50_MANUAL';payment.closest=()=>label;
 const success=element();success.textContent='Pedido nº 100100 recebido! Sinal de 50%: R$ 29,99.';
 const checkoutResult=element();checkoutResult.querySelector=selector=>selector==='.result:not(.err)'?success:null;
 const simpleBody=element();
 nodes.payment=payment;nodes.checkoutResult=checkoutResult;nodes.simpleBody=simpleBody;
 const document={
  readyState:'loading',body:element('body'),
  getElementById:id=>nodes[id]||null,createElement:element,
  addEventListener:(event,cb)=>handlers[event]=cb,execCommand:()=>true
 };
 const window={
  CaseirinhoCurrentPublicCatalog:()=>({loja:{whatsapp:phone}}),
  CASEIRINHO_CONFIG:{storeSlug:'caseirinho'}
 };
 class MutationObserver{observe(){}}
 vm.runInNewContext(source,{
  window,document,MutationObserver,
  navigator:{clipboard:{writeText:async()=>{}}},
  setTimeout(){},requestAnimationFrame:fn=>fn(),
  URL,console
 });
 assert.equal(typeof handlers.DOMContentLoaded,'function');
 handlers.DOMContentLoaded();
 return{window,nodes,payment,success};
}

test('checkout PIX destaca CNPJ e pedido recebido mostra comprovante',()=>{
 const {nodes,success}=browser();
 assert.equal(nodes.caseirinhoPixCnpj91083.hidden,false);
 assert.match(JSON.stringify(nodes.caseirinhoPixCnpj91083),/69\.195\.483\/0001-23/);
 assert.equal(success.children.filter(x=>x.className.includes('caseirinho-proof-notice')).length,1);
});

test('WhatsApp usa número cadastrado e inclui pedido e sinal de 50%',()=>{
 const {window}=browser();
 const url=window.CaseirinhoPaymentProof91083.whatsUrl(['100100'],true);
 assert.match(url,/^https:\/\/wa\.me\/5511934567890\?text=/);
 assert.match(decodeURIComponent(url),/100100/);
 assert.match(decodeURIComponent(url),/50%/);
 assert.match(decodeURIComponent(url),/comprovante/i);
});

test('CNPJ não aparece na seleção de cartão e códigos de pedidos mistos são reconhecidos',()=>{
 const {window,nodes,payment}=browser();
 payment.value='Cartão de crédito online (Mercado Pago)';
 window.CaseirinhoPaymentProof91083.refresh();
 assert.equal(nodes.caseirinhoPixCnpj91083.hidden,true);
 assert.deepEqual(
  Array.from(window.CaseirinhoPaymentProof91083.codeFromText('Encomenda nº 101 e Pedido comum nº 102')),
  ['101','102']
 );
});

test('whatsapp sem configuração não abre contato incorreto e DDD 55 funciona',()=>{
 const none=browser('');
 assert.equal(none.window.CaseirinhoPaymentProof91083.whatsUrl(['100100'],false),'');
 const ddd55=browser('(55) 99999-1234');
 assert.match(ddd55.window.CaseirinhoPaymentProof91083.whatsUrl(['2'],false),/^https:\/\/wa\.me\/5555999991234/);
});
