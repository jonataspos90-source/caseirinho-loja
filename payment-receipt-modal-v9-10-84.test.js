'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'payment-receipt-modal-v9-10-84.js'),'utf8');
const app=fs.readFileSync(path.join(__dirname,'app.js'),'utf8');
const html=fs.readFileSync(path.join(__dirname,'index.html'),'utf8');

function browser(){
 const body=node('body');body.style.overflow='hidden';
 const cart=node('div');cart.id='cartDrawer';cart.classList.add('open');body.appendChild(cart);
 const window={
  CaseirinhoPaymentProof91083:{
   whatsUrl:(codes,seasonal)=>'https://wa.me/5511999999999?text='+encodeURIComponent(codes.join(' e ')+' '+(seasonal?'sinal de 50%':'pedido'))
  }
 };
 const keyListeners=new Map();
 const document={
  body,createElement:node,execCommand(){return true;},
  getElementById(id){return findId(body,id)},
  addEventListener(type,fn){keyListeners.set(type,fn)},
  removeEventListener(type,fn){if(keyListeners.get(type)===fn)keyListeners.delete(type)}
 };
 const scope={window,document,navigator:{clipboard:{writeText:async()=>{}}},alert(){},console};
 vm.runInNewContext(source,scope);
 return{body,cart,api:window.CaseirinhoReceiptModal91084,document};
}
function node(tag){
 const el={
  tagName:tag.toUpperCase(),children:[],style:{},className:'',id:'',textContent:'',_innerHTML:'',
  attrs:{},parent:null,focus(){},addEventListener(){},
  classList:{
   classes:new Set(),
   add(x){this.classes.add(x)},
   remove(x){this.classes.delete(x)},
   contains(x){return this.classes.has(x)}
  },
  setAttribute(k,v){this.attrs[k]=v},
  append(...arr){arr.forEach(x=>{this.children.push(x);x.parent=this})},
  appendChild(x){this.append(x);return x},
  remove(){if(this.parent)this.parent.children=this.parent.children.filter(x=>x!==this);this.parent=null},
  querySelector(q){if(q==='#mpPayNow')return findId(this,'mpPayNow');return null}
 };
 Object.defineProperty(el,'innerHTML',{get(){return this._innerHTML},set(v){this._innerHTML=v}});
 return el;
}
function findId(root,id){if(root.id===id)return root;for(const c of root.children){const match=findId(c,id);if(match)return match}return null}
function visibleText(el){return [el.textContent,el.innerHTML,...el.children.map(visibleText)].filter(Boolean).join(' ')}
test('checkout misto mostra cada valor real, saldo e meio de pagamento separado',()=>{
 const x=browser();
 const result=x.api.showMixed({
  season:{codigo:'100051',total:59.99,encomendaSazonal:{depositDue:30,balanceDue:29.99}},
  regular:{codigo:'100052',total:39.99,formaPagamento:'Cartão de crédito online (Mercado Pago)'},
  regularPaymentLabel:'Cartão de crédito',
  onOrders(){}
 });
 assert.equal(result,true);
 const receipt=x.document.getElementById('caseirinhoReceiptModal');
 assert.ok(receipt);
 const txt=visibleText(receipt);
 for(const part of ['100051','100052','R$ 30,00','R$ 29,99','R$ 39,99','R$ 99,98','Não transfira este valor por PIX']){
  assert.ok(txt.includes(part),part+' ausente: '+txt);
 }
 assert.equal(x.cart.classList.contains('open'),false);
 assert.equal(x.cart.attrs['aria-hidden'],'true');
});
test('saldo indisponível aparece A confirmar e não como R$ 0,00',()=>{
 const x=browser();
 x.api.showMixed({season:{codigo:'8',total:20,encomendaSazonal:{}},regular:{codigo:'9',total:10,formaPagamento:'PIX'}});
 assert.match(visibleText(x.document.getElementById('caseirinhoReceiptModal')),/A confirmar/);
});
test('janela individual também fecha carrinho e preserva acesso aos pedidos',()=>{
 const x=browser();
 let opened=0;
 x.api.showSingle({
  order:{codigo:'20050',total:55,formaPagamento:'PIX_SINAL_50_MANUAL',encomendaSazonal:{depositDue:27.5,balanceDue:27.5}},
  onOrders(){opened++}
 });
 const popup=x.document.getElementById('caseirinhoReceiptModal');
 assert.ok(popup);
 assert.equal(x.cart.classList.contains('open'),false);
 assert.match(visibleText(popup),/R\$ 27,50/);
 const btn=findButton(popup,'Acompanhar meus pedidos');
 assert.ok(btn);
 btn.onclick();
 assert.equal(opened,1);
 assert.equal(x.document.getElementById('caseirinhoReceiptModal'),null);
});
function findButton(node,label){
 if(node.tagName==='BUTTON'&&node.textContent.includes(label))return node;
 for(const child of node.children){const b=findButton(child,label);if(b)return b;}
 return null;
}
test('app usa modal após os pedidos efetivos e não deixa recibo no carrinho vazio',()=>{
 assert.match(app,/CaseirinhoReceiptModal91084\?\.showSingle/);
 assert.match(app,/window\.CaseirinhoReceiptModal91084\?\.showMixed/);
 assert.match(app,/E\('checkoutResult'\)\.innerHTML='';\s*let receiptOpened/);
 assert.match(html,/payment-receipt-modal-v9-10-84\.js/);
 assert.match(html,/payment-receipt-modal-v9-10-84\.css/);
});
