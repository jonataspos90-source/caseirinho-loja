'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const app=fs.readFileSync(__dirname+'/app.js','utf8');
const html=fs.readFileSync(__dirname+'/index.html','utf8');
test('Loja só oferece Mercado Pago quando habilitado pelo backend',()=>{
 assert.match(app,/\(mercadoPagoOnline\|\|PAYMENT_UI_PREVIEW\)&&catalogConnected/);
 assert.match(app,/MP_CREDIT_LABEL='Cartão de crédito online \(Mercado Pago\)'/);
 assert.match(app,/MP_DEBIT_LABEL='Cartão de débito online \(Mercado Pago\)'/);
 assert.match(app,/for\(const option of MP_PAYMENT_OPTIONS\)/);
 assert.match(app,/\.filter\(x=>!mpSelected\(x\)\)/);
 assert.match(app,/mercadoPagoOnline\|\|PAYMENT_UI_PREVIEW/);
 assert.match(app,/if\(PAYMENT_UI_PREVIEW\)/);
 assert.match(html,/id="paymentPreviewNotice"/);
 assert.match(app,/loadMercadoPagoConfig/);
 assert.match(app,/\/mercadopago\/config/);
 assert.match(app,/if\(mpSelected\(E\('payment'\)\?\.value\)&&!mercadoPagoOnline\)/);
});
test('Checkout segura criação do pedido antes do pagamento e libera após encomenda',()=>{
 assert.match(app,/if\(mpSelected\(saved\.formaPagamento\)\)/);
 assert.match(app,/pendingEncomendas\.length\|\|result\.freteStatus/);
 assert.match(app,/\/mercadopago\/checkout/);
 assert.match(app,/publicToken:order\.publicToken/);
 assert.match(app,/location\.assign\(url\.href\)/);
});
test('Cliente recebe estado do servidor e nenhum dado sensível do cartão é coletado',()=>{
 assert.match(app,/pagamentoOnline\?\.status/);
 assert.match(app,/mpStatusHtml\(o\)/);
 assert.doesNotMatch(app,/cardNumber|cvv|securityCode/);
});
test('Frontend e PWA usam nova versão de checkout',()=>{
 assert.match(html,/app\.js\?v=910200/);
 assert.match(fs.readFileSync(__dirname+'/service-worker.js','utf8'),/v9\.10\.20-credito-debito-gated/);
});