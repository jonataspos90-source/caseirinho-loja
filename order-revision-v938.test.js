const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

const rev=fs.readFileSync('order-revision-v9-3-8.js','utf8');
const pix=fs.readFileSync('pix-payment-ensure-v9-3-9.js','utf8');
const sw=fs.readFileSync('service-worker.js','utf8');

test('scripts novos possuem sintaxe válida',()=>{
  assert.doesNotThrow(()=>new Function(rev));
  assert.doesNotThrow(()=>new Function(pix));
});

test('cliente pode aceitar ou rejeitar proposta revisada',()=>{
  assert.match(rev,/revision-decision/);
  assert.match(rev,/Aceitar novo pedido/);
  assert.match(rev,/Não aceitar/);
  assert.match(rev,/SUBSTITUIDO/);
});

test('pedido PIX aceito ganha ação de QR mesmo sem cartão PIX legado',()=>{
  assert.match(pix,/acceptedPix/);
  assert.match(pix,/Gerar QR Code PIX/);
  assert.match(pix,/CaseirinhoPixPayment937\.generateForOrder/);
});

test('PWA carrega revisão e garantia PIX preservando compatibilidade 9.3.6',()=>{
  assert.match(sw,/caseirinho-loja-v9\.3\.6-parmesao-checkout/);
  assert.match(sw,/order-revision-v9-3-8\.js/);
  assert.match(sw,/pix-payment-ensure-v9-3-9\.js/);
});
