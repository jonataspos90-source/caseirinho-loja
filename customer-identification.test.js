'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'customer-identification.js'),'utf8');
function harness({profile={},search=''}={}){
  const storage=new Map([['john_store_caseirinho_customer_profile_v1',JSON.stringify(profile)]]);
  const calls=[],nodes={};let unlocked=false,identified=0;
  for(const id of ['identityConsent','identityName','identityPhone','identityStatus','identityContinue','customerIdentityForm','customerIdentityGate','cName','cPhone','cEmail','cCpf','cep','number','street','district','city','uf','comp','homeBtn'])nodes[id]={value:'',textContent:'',hidden:false,addEventListener(name,fn){this[name]=fn},focus(){}};
  const context=vm.createContext({window:{CASEIRINHO_CONFIG:{storeSlug:'caseirinho'},dispatchEvent(){},CaseirinhoEngagement961:{sendSnapshot(){identified++}}},document:{readyState:'complete',getElementById:id=>nodes[id],body:{classList:{remove(){unlocked=true}}}},location:{search},URLSearchParams,AbortController,Event,Date,setTimeout,clearTimeout,localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},fetch:async(url,opt)=>{calls.push({url,body:JSON.parse(opt.body)});assert.equal(calls.at(-1).body.lgpd?.consent,true);return{ok:true,json:async()=>({ok:true,id:'pre-123'})}}});
  vm.runInContext(source,context);
  return{context,nodes,storage,calls,get unlocked(){return unlocked},get identified(){return identified},submit:()=>nodes.customerIdentityForm.submit({preventDefault(){}}),fill:(name='Cliente Teste',phone='(11) 99999-0000')=>{nodes.identityName.value=name;nodes.identityPhone.value=phone;nodes.identityConsent.checked=true}};
}
test('requires name and Brazilian WhatsApp before any server write or catalog access',async()=>{
  const h=harness();h.fill('1','123');await h.submit();assert.equal(h.calls.length,0);assert.equal(h.unlocked,false);
  h.fill('Ana','119123');await h.submit();assert.equal(h.calls.length,0);assert.match(h.nodes.identityStatus.textContent,/WhatsApp válido/);
});
test('saves a visitor without a cart to the pre-registration base before opening the catalog',async()=>{
  const h=harness();h.fill();await h.submit();
  assert.match(h.calls[0].url,/\/store\/caseirinho\/customers\/pre-register$/);
  assert.equal(h.calls[0].body.cliente.telefone,'11999990000');assert.equal(h.unlocked,true);
  assert.equal(h.nodes.customerIdentityGate.hidden,true);assert.equal(h.nodes.cName.value,'Cliente Teste');assert.equal(h.identified,1);
  assert.equal(JSON.parse(h.storage.get('john_store_caseirinho_customer_profile_v1')).telefone,'11999990000');
  assert.equal(h.calls[0].body.lgpd.consent,true);assert.equal(h.calls[0].body.lgpd.policyVersion,'1.0');assert.ok(!Number.isNaN(Date.parse(h.calls[0].body.lgpd.consentAt)));
});
test('privacy consent starts unchecked and no request is sent without explicit acceptance',async()=>{
  const h=harness();assert.notEqual(h.nodes.identityConsent.checked,true);h.fill();h.nodes.identityConsent.checked=false;await h.submit();
  assert.equal(h.calls.length,0);assert.equal(h.unlocked,false);assert.match(h.nodes.identityStatus.textContent,/Política de Privacidade/);
});
test('server validation message is displayed instead of a misleading network error',async()=>{
  const h=harness();h.fill();h.context.fetch=async()=>({ok:false,status:400,json:async()=>({error:'É necessário aceitar a Política de Privacidade / LGPD para continuar.'})});await h.submit();
  assert.equal(h.unlocked,false);assert.match(h.nodes.identityStatus.textContent,/É necessário aceitar/);assert.doesNotMatch(h.nodes.identityStatus.textContent,/Verifique sua conexão/);
});
test('returning visitors must confirm, preserving their existing address and email',async()=>{
  const h=harness({profile:{nome:'Ana',telefone:'11999990000',email:'ana@example.com',cpf:'123',entrega:{cep:'01001000',numero:'10'}}});
  assert.equal(h.nodes.identityName.value,'Ana');assert.equal(h.unlocked,false);h.nodes.identityConsent.checked=true;await h.submit();
  assert.equal(h.calls[0].body.cliente.email,'ana@example.com');assert.equal(h.calls[0].body.endereco.numero,'10');
});
test('changing the contact does not copy the previous customer address or personal data',async()=>{
  const h=harness({profile:{nome:'Ana',telefone:'11999990000',email:'ana@example.com',cpf:'123',entrega:{numero:'10'}}});h.nodes.cEmail.value='ana@example.com';h.nodes.street.value='Endereço anterior';h.fill('Bruno','21988887777');await h.submit();
  assert.equal(h.calls[0].body.cliente.email,'');assert.deepEqual(Object.keys(h.calls[0].body.endereco),[]);
  assert.equal(JSON.parse(h.storage.get('john_store_caseirinho_customer_profile_v1')).cpf,'');
  assert.equal(h.nodes.cEmail.value,'');assert.equal(h.nodes.street.value,'');
});
test('network failure keeps access blocked and lets the visitor retry',async()=>{
  const h=harness();h.fill();const working=h.context.fetch;h.context.fetch=async()=>{throw new Error('offline')};await h.submit();
  assert.equal(h.unlocked,false);assert.equal(h.nodes.identityContinue.disabled,false);assert.match(h.nodes.identityStatus.textContent,/tentar novamente/);
  h.context.fetch=working;await h.submit();assert.equal(h.unlocked,true);
});
test('invalid server acknowledgement never releases the gate',async()=>{
  const h=harness();h.fill();h.context.fetch=async()=>({ok:true,json:async()=>({ok:false})});await h.submit();assert.equal(h.unlocked,false);
});
test('double click saves once and only unlocks after the server confirms',async()=>{
  const h=harness();h.fill();let resolve;h.context.fetch=()=>new Promise(r=>{resolve=r});
  const pending=h.submit();await h.submit();assert.equal(h.unlocked,false);assert.equal(h.nodes.identityContinue.disabled,true);
  resolve({ok:true,json:async()=>({ok:true,id:'pre-123'})});await pending;assert.equal(h.unlocked,true);
});
test('store parameters scope registration and local profile to the same tenant',async()=>{
  const h=harness({search:'?empresa=outra-loja'});h.fill();await h.submit();assert.match(h.calls[0].url,/\/store\/outra-loja\//);assert.ok(h.storage.has('john_store_outra-loja_customer_profile_v1'));
});
test('identification gate is in initial HTML and its assets are cached for the PWA',()=>{
  const html=fs.readFileSync(path.join(__dirname,'index.html'),'utf8');const worker=fs.readFileSync(path.join(__dirname,'service-worker.js'),'utf8');
  assert.match(html,/<body class="customer-identification-required">/);assert.match(html,/id="customerIdentityGate"/);assert.match(html,/customer-identification\.js\?v=20261028/);
  assert.match(worker,/const SHELL=\['\.\/customer-identification\.js','\.\/customer-identification\.css'/);
});
