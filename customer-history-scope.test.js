'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const app=fs.readFileSync(path.join(__dirname,'app.js'),'utf8');
function history({phone='11999990000',sessionPhone=phone}={}){
 const data={profile:{telefone:phone},history:{session:'test-session',phone:sessionPhone},orders:[{id:'own',cliente:{telefone:'11999990000'}},{id:'other',cliente:{telefone:'21988887777'}}]};let calls=0;
 const context=vm.createContext({data,readJson:(k,f)=>data[k]||f,writeJson:(k,v)=>{data[k]=v},CUSTOMER_PROFILE_KEY:'profile',CUSTOMER_HISTORY_KEY:'history',ORDERS_KEY:'orders',S:v=>String(v??''),N:v=>Number(v)||0,A:v=>Array.isArray(v)?v:[],E:()=>null,STORE:'caseirinho',historySyncBusy:null,api:async()=>{calls++;return{orders:data.orders}},Date,encodeURIComponent});
 const source=app.slice(app.indexOf('function customerProfile(){'),app.indexOf('function saveCustomerProfileFromBody('));vm.runInContext(source+';this.historyApi={ownOrders,syncCustomerHistory,saveCustomerHistory};',context);return{api:context.historyApi,data,get calls(){return calls}};
}
test('a number change cannot reuse another contact history session',async()=>{
 const h=history({phone:'11999990000',sessionPhone:'21988887777'});const orders=await h.api.syncCustomerHistory();assert.equal(h.calls,0);assert.deepEqual(Array.from(orders,x=>x.id),['own']);
});
test('verified history sync keeps only orders belonging to the current customer',async()=>{
 const h=history();const orders=await h.api.syncCustomerHistory();assert.equal(h.calls,1);assert.deepEqual(Array.from(orders,x=>x.id),['own']);
});
test('recovered session is scoped to the phone used in the recovery proof',()=>{
 const h=history();h.api.saveCustomerHistory('new-session',{phone:'21988887777'});assert.equal(h.data.history.phone,'21988887777');
});
test('order review shows every item, production date and cashback decision safely',()=>{
 const source=app.slice(app.indexOf('function reviewDetailsHtml('),app.indexOf('function ordersCardsHtml('));const ctx=vm.createContext({S:v=>String(v??''),A:v=>Array.isArray(v)?v:[],esc:v=>String(v??'').replace(/</g,'&lt;').replace(/>/g,'&gt;')});vm.runInContext(source,ctx);
 const html=ctx.reviewDetailsHtml({analisePedido:{status:'APROVADO'},cashbackAprovacao:{status:'REJEITADO'},encomendaConfirmacao:{itens:[{nome:'Massa',decisao:'PRODUZIR',previsao:'2026-10-30',observacao:'<script>teste</script>'}]}});assert.match(html,/30\/10\/2026/);assert.match(html,/não aprovado para este pedido/);assert.match(html,/Massa/);assert.doesNotMatch(html,/<script>/);
});
