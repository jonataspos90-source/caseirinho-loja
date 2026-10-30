'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const app=fs.readFileSync('app.js','utf8');
const html=fs.readFileSync('index.html','utf8');
const sw=fs.readFileSync('service-worker.js','utf8');
test('Caseirinho recebe pedido de todo produto ativo, inclusive saldo zero',()=>{
 assert.match(app,/if\(STORE==='caseirinho'\)return true/);
 assert.match(app,/p\?\.ativo===false/);
 assert.match(app,/\['INATIVO','ARQUIVADO','EXCLUIDO'\]/);
});
test('checkout não cria observação nem modal automático de disponibilidade',()=>{
 const submit=app.slice(app.indexOf('async function submitOrder(ev){'),app.indexOf('function openOverlay(',app.indexOf('async function submitOrder(ev){')));
 assert.ok(submit);
 assert.doesNotMatch(submit,/\[DISPONIBILIDADE A CONFIRMAR/);
 assert.doesNotMatch(submit,/pendingEncomendas/);
 assert.match(submit,/\[PEDIDO FORA DO HORÁRIO/);
});
test('ERP informa indisponibilidade por proposta e cliente recebe aviso no app',()=>{
 assert.match(app,/st==='AGUARDANDO_CLIENTE_REVISAO'/);
 assert.match(app,/CaseirinhoOrderRevision938\.openForOrder/);
 assert.match(html,/order-revision-v9-3-8\.js/);
});
test('versão do PWA publica alteração de pedido e proteção do modo demonstração',()=>{
 assert.match(html,/app\.js\?v=910353/);
 assert.match(sw,/caseirinho-loja-v9\.10\.37-order-stock-revision-alert/);
 assert.match(app,/PAYMENT_UI_PREVIEW/);
});
