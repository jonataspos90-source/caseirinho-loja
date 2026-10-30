'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const read=name=>fs.readFileSync(path.join(__dirname,name),'utf8');
const app=read('app.js');
const native=app.slice(app.indexOf('async function submitOrder(ev){'),app.indexOf('\nfunction openOverlay(',app.indexOf('async function submitOrder(ev){')));
assert.ok(native.startsWith('async function submitOrder'));
function harness({preview=false,connected=true,fail=false}={}){
  const button={textContent:'Confirmar meu pedido',disabled:false};
  const nodes={checkout:{querySelector:()=>button},checkoutResult:{innerHTML:'',textContent:''},payment:{value:'Dinheiro'},mode:{value:'RETIRADA'},cName:{value:'Cliente teste'},cPhone:{value:'11999990000'},cEmail:{value:''},cCpf:{value:''},consent:{checked:true},date:{value:'2026-10-28'},time:{value:'16:00'},obs:{value:''},openSavedOrders:{}};
  const document={getElementById:id=>nodes[id]};const requests=[],messages=[],storage={};
  const window={JohnOrderAmounts:{celebration:()=>'',lines:()=>[]}};
  const deps={E:id=>nodes[id],document,window,cart:[{produtoId:'produto-teste',quantidade:1,precoUnitario:10}],catalog:{produtos:[],loja:{}},catalogConnected:connected,loadCatalog:async()=>{},toast:msg=>messages.push(msg),PAYMENT_UI_PREVIEW:preview,S:v=>String(v??''),N:v=>Number(v)||0,STORE:'caseirinho',paymentOptionsFor:()=>['Dinheiro'],mpSelected:()=>false,mercadoPagoOnline:false,PIX_CNPJ_LABEL:'Pix CNPJ',validPhone:()=>true,allowedDate:()=>true,pendingOrderItems:()=>[],storeHoursStatus:()=>null,clientRequestIdFor:()=> 'stable-request',ORDERS_KEY:'orders',PENDING_ORDER_KEY:'pending',api:async(url,opt)=>{requests.push({url,body:JSON.parse(opt.body)});if(fail)throw Error('Falha simulada');return{id:'pedido-simulado',codigo:'TESTE',publicToken:'token-simulado',subtotal:10,total:10}},promoApi:()=>null,roundMoney:x=>x,readJson:(key,fallback)=>storage[key]||fallback,writeJson:(key,value)=>{storage[key]=value},saveCustomerProfileFromBody:()=>{},bootstrapHistorySession:async()=>{},syncCustomerHistory:async()=>{},removeLocal:key=>{delete storage[key]},esc:v=>String(v??''),money:v=>String(v),showOrders:()=>{},renderCart:()=>{}};
  const ctx=vm.createContext({window,document,deps,console,URL,URLSearchParams,location:{search:preview?'?preview_cartoes=1&utm_source=chatgpt.com':'',href:'https://jonataspos90-source.github.io/caseirinho-loja/'+(preview?'?preview_cartoes=1&utm_source=chatgpt.com':'')},setTimeout:()=>{throw Error('Incompatible legacy module must not install timers')}});
  const names=Object.keys(deps).filter(x=>x!=='cart').join(',');
  const getCart=vm.runInContext('(function(){const {'+names+'}=deps;let cart=deps.cart;'+native+';document.getElementById("checkout").onsubmit=submitOrder;return()=>cart})()',ctx);
  const handler=nodes.checkout.onsubmit;
  vm.runInContext(read('commerce-engine-v9-3-0.js'),ctx);
  return{nodes,button,requests,messages,window,handler,getCart,submit:()=>nodes.checkout.onsubmit({preventDefault(){},submitter:button})};
}
test('legacy commerce module preserves the isolated app checkout handler',()=>{
  const h=harness();assert.equal(h.nodes.checkout.onsubmit,h.handler);assert.equal(h.window.submitOrder,undefined);assert.equal(h.window.renderCart,undefined);
});
test('confirmation reaches the simulated order API and clears cart only after success',async()=>{
  const h=harness();await h.submit();assert.equal(h.requests.length,1);assert.match(h.requests[0].url,/\/store\/caseirinho\/orders$/);assert.equal(h.requests[0].body.itens[0].quantidade,1);assert.equal(h.getCart().length,0);assert.match(h.nodes.checkoutResult.innerHTML,/recebido/);assert.equal(h.button.disabled,false);
});
test('failed order keeps cart and shows an actionable error',async()=>{
  const h=harness({fail:true});await h.submit();assert.equal(h.getCart().length,1);assert.match(h.nodes.checkoutResult.innerHTML,/Pedido não enviado/);assert.match(h.nodes.checkoutResult.innerHTML,/Falha simulada/);assert.equal(h.button.disabled,false);
});
test('preview mode continues to block real orders',async()=>{
  const h=harness({preview:true});await h.submit();assert.equal(h.requests.length,0);assert.equal(h.getCart().length,1);assert.match(h.messages[0],/Prévia de interface/);assert.match(h.nodes.checkoutResult.innerHTML,/Abrir loja oficial e finalizar/);assert.doesNotMatch(h.nodes.checkoutResult.innerHTML,/preview_cartoes/);
});
test('disconnected catalog cannot submit an unverified order',async()=>{
  const h=harness({connected:false});await h.submit();assert.equal(h.requests.length,0);assert.match(h.nodes.checkoutResult.textContent,/Sem conexão/);
});
