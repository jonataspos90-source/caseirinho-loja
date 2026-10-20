'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const app=fs.readFileSync('app.js','utf8'),index=fs.readFileSync('index.html','utf8');
const pixOld=fs.readFileSync('pix-payment-v9-3-7.js','utf8');
const pixEns=fs.readFileSync('pix-payment-ensure-v9-3-9.js','utf8');
const sw=fs.readFileSync('service-worker.js','utf8');
test('cartão crédito/débito e Pix online só entram no catálogo quando API autoriza',()=>{
 assert.match(app,/MP_CREDIT_LABEL='Cartão de crédito online \(Mercado Pago\)'/);
 assert.match(app,/MP_DEBIT_LABEL='Cartão de débito online \(Mercado Pago\)'/);
 assert.match(app,/MP_PIX_LABEL='Pix online \(Mercado Pago\)'/);
 assert.match(app,/\(mercadoPagoOnline\|\|PAYMENT_UI_PREVIEW\)&&catalogConnected/);
 assert.match(app,/PAYMENT_UI_PREVIEW\)\s*return toast\('Prévia de interface/);
});
test('pedido usa checkout autenticado e link HTTPS validado',()=>{
 assert.match(app,/mercadopago\/checkout/);
 assert.match(app,/publicToken:order\.publicToken/);
 assert.match(app,/mercadopago\\\.com/);
 assert.match(app,/pagamentoOnline\?\.status/);
 assert.match(app,/status==='APROVADO'/);
});
test('Pix direto não se confunde com Pix online pelo Mercado Pago',()=>{
 assert.match(pixOld,/!\/MERCADO\[ _-\]\?PAGO\/i\.test/);
 assert.match(pixEns,/!\/MERCADO\[ _-\]\?PAGO\/i\.test/);
 assert.match(app,/MP_PIX_LABEL/);
});
test('PWA aponta para versão nova do checkout',()=>{
 assert.match(index,/Loja Online · V9\.10\.21/);
 assert.match(index,/app\.js\?v=910210/);
 assert.match(sw,/caseirinho-loja-v9\.10\.21-mercadopago-credito-debito-pix/);
});
