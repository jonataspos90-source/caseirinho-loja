'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const app=fs.readFileSync('app.js','utf8');
const sw=fs.readFileSync('service-worker.js','utf8');
const html=fs.readFileSync('index.html','utf8');
test('entrega só oferece crédito débito e Pix online sem repetir modalidade',()=>{
 assert.match(app,/mode==='ENTREGA'\?online:\[\.\.\.online,\.\.\.onsite\]/);
 assert.match(app,/const seen=new Set\(\)/);
 assert.match(app,/if\(seen\.has\(k\)\)return false/);
 assert.match(app,/if\(E\('mode'\)\?\.value==='ENTREGA'&&!mpSelected\(paymentChoice\)\)/);
});
test('Pix pede banco como referência sem vincular autorização a um banco específico',()=>{
 assert.match(app,/BANK_CHOICES=/);
 assert.match(app,/bankPix/);
 assert.match(app,/QR Code Pix pode ser pago por qualquer instituição participante/);
 assert.match(app,/pixBank:paymentGroup\(E\('payment'\)\.value\)==='PIX'/);
});
test('cliente consegue editar pagamento com token de pedido antes da aprovação',()=>{
 assert.match(app,/function canChangeOrderPayment/);
 assert.match(app,/data-edit-payment/);
 assert.match(app,/\/payment-method/);
 assert.match(app,/publicToken:order\.publicToken/);
 assert.match(app,/if\(!canChangeOrderPayment\(order\)\)/);
});
test('PWA atualiza versão de pagamento sem usar cache antigo',()=>{
 assert.match(html,/Loja Online · V9\.10\.25/);
 assert.match(sw,/caseirinho-loja-v9\.10\.25-pronta-entrega/);
 assert.match(sw,/prefix\+'910250'/);
});
