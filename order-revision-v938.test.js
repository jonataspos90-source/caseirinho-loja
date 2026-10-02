const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

const rev=fs.readFileSync('order-revision-v9-3-8.js','utf8');
const pixEnsure=fs.readFileSync('pix-payment-ensure-v9-3-9.js','utf8');
const pixMain=fs.readFileSync('pix-payment-v9-3-7.js','utf8');
const dedupe=fs.readFileSync('order-actions-dedupe-v9-4-2.js','utf8');
const sw=fs.readFileSync('service-worker.js','utf8');

test('scripts novos possuem sintaxe válida',()=>{
  assert.doesNotThrow(()=>new Function(rev));
  assert.doesNotThrow(()=>new Function(pixEnsure));
  assert.doesNotThrow(()=>new Function(pixMain));
  assert.doesNotThrow(()=>new Function(dedupe));
});

test('cliente pode aceitar ou rejeitar proposta revisada',()=>{
  assert.match(rev,/revision-decision/);
  assert.match(rev,/Aceitar novo pedido/);
  assert.match(rev,/Não aceitar/);
  assert.match(rev,/SUBSTITUIDO/);
});

test('pedido PIX aceito ganha um único botão de QR',()=>{
  assert.match(pixEnsure,/acceptedPix/);
  assert.match(pixEnsure,/pix-card/);
  assert.doesNotMatch(pixEnsure,/Gerar QR Code PIX/);
  assert.match(pixMain,/Gerar QR Code PIX/);
  assert.match(pixMain,/CaseirinhoPixPayment937/);
  assert.match(dedupe,/removePixDuplicates/);
  assert.match(dedupe,/removePdfDuplicates/);
});

test('PWA carrega revisão e garantia PIX preservando compatibilidade 9.3.6',()=>{
  assert.match(sw,/caseirinho-loja-v9\.3\.6-parmesao-checkout/);
  assert.match(sw,/order-revision-v9-3-8\.js/);
  assert.match(sw,/pix-payment-ensure-v9-3-9\.js/);
  assert.match(sw,/order-actions-dedupe-v9-4-2\.js/);
});
