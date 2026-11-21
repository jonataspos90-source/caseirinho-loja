'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const read=file=>fs.readFileSync(file,'utf8');
test('Caseirinho mantém logo oficial em acesso, cabeçalho, vitrine e aplicativo',()=>{
 const html=read('index.html'),hub=read('caseirinho-shop-hub.js'),manifest=JSON.parse(read('manifest.webmanifest'));
 assert.match(html,/identity-logo.*icons\/icon-192\.png/);
 assert.match(html,/brand-mark.*icons\/icon-192\.png/);
 assert.match(hub,/hub-official-logo.*icons\/icon-192\.png/);
 assert.equal(manifest.name.includes('Caseirinho'),true);
 assert.ok(manifest.icons.some(x=>x.src.includes('icon-192.png')));
});
test('recibo PIX usa somente QR, valor, código e recebedor emitidos pelo servidor',()=>{
 const pix=read('pix-payment-v9-3-7.js');
 new vm.Script(pix,{filename:'pix-payment-v9-3-7.js'});
 assert.match(pix,/qrCodeDataUrl/);
 assert.match(pix,/copiaECola/);
 assert.match(pix,/pix\?\.nome/);
 assert.match(pix,/requestPix\(o\)/);
 assert.match(pix,/reportPixPayment\(o\)/);
 assert.match(pix,/Esta cobrança não possui prazo automático informado/);
 assert.doesNotMatch(pix,/MOOZ SOLU/);
 assert.doesNotMatch(pix,/pix\?\.chave\|\|OFFICIAL_KEY/);
});
test('recibo não trata copiar o código ou avisar pagamento como liquidação financeira',()=>{
 const pix=read('pix-payment-v9-3-7.js');
 assert.match(pix,/Pagamento continua pendente até a equipe conferir o extrato/);
 assert.match(pix,/data-pix-reported/);
 assert.match(pix,/INFORMADO_PELO_CLIENTE/);
 assert.doesNotMatch(pix,/paymentStatus\s*=\s*['"]PAID['"]/);
 const html=read('index.html');
 assert.match(html,/caseirinho-pix-receipt-20261121\.css/);
 assert.match(html,/pix-payment-v9-3-7\.js\?v=9372-receipt/);
});
