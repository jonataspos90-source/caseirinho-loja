'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const app=fs.readFileSync('app.js','utf8');
const sw=fs.readFileSync('service-worker.js','utf8');
const html=fs.readFileSync('index.html','utf8');
test('Pix CNPJ é a única forma para entrega e retirada, sem exigir banco',()=>{
 assert.match(app,/const PIX_CNPJ_LABEL='Pix pelo QR Code do CNPJ \(conferência manual\)'/);
 assert.match(app,/function paymentOptionsFor\(mode\)\{\s*return catalogConnected\?\[PIX_CNPJ_LABEL\]:\[\]/);
 assert.match(app,/const MP_PAYMENT_OPTIONS=\[\]/);
 assert.match(app,/paymentChoice!==PIX_CNPJ_LABEL/);
 assert.doesNotMatch(app,/BANK_CHOICES|Selecione o banco que vai usar/);
 assert.doesNotMatch(app,/pixBank:paymentGroup\(E\('payment'\)\.value\)/);
});
test('cliente informa o pagamento Pix sem confirmar automaticamente a quitação',()=>{
 const pix=fs.readFileSync('pix-payment-v9-3-7.js','utf8');
 assert.match(pix,/\/pix\/reported/);
 assert.match(pix,/Já paguei — avisar o Caseirinho/);
 assert.match(pix,/continua pendente até a equipe conferir o extrato/);
 assert.match(app,/Próxima data disponível:/);
});
test('cliente consegue editar pagamento com token de pedido antes da aprovação',()=>{
 assert.match(app,/function canChangeOrderPayment/);
 assert.match(app,/data-edit-payment/);
 assert.match(app,/\/payment-method/);
 assert.match(app,/publicToken:order\.publicToken/);
 assert.match(app,/if\(!canChangeOrderPayment\(order\)\)/);
});
test('PWA atualiza versão de pagamento sem usar cache antigo',()=>{
 assert.match(html,/Loja Online · V9\.10\.34/);
 assert.match(sw,/caseirinho-loja-v9\.10\.34-pix-only-manual-confirmation/);
 assert.match(sw,/prefix\+'910340'/);
});
