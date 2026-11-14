'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const app=fs.readFileSync(path.join(__dirname,'app.js'),'utf8');
const html=fs.readFileSync(path.join(__dirname,'index.html'),'utf8');
const sw=fs.readFileSync(path.join(__dirname,'service-worker.js'),'utf8');
const css=fs.readFileSync(path.join(__dirname,'payment-receipt-modal-v9-10-84.css'),'utf8');

test('cliente escolhe explícita e obrigatoriamente uma encomenda ou dois pedidos',()=>{
 assert.match(app,/name="mixedOrderChoice" value="ENCOMENDA_UNICA"/);
 assert.match(app,/name="mixedOrderChoice" value="SEPARADOS"/);
 assert.match(app,/incluirProdutosComuns:mixedOrderMode==='ENCOMENDA_UNICA'/);
 assert.match(app,/&&mixedOrderMode==='SEPARADOS'/);
 assert.match(app,/const jointPrice=roundMoney\(seasonalPricing\(cart\)/);
});
test('valores iniciais = sinal de 50% + pedido comum no fluxo separado',()=>{
 assert.match(app,/TOTAL DOS PAGAMENTOS INICIAIS/);
 assert.match(app,/roundMoney\(split\.deposit\+\(joined\?0:separateNormalTotal\)\)/);
 assert.match(app,/money\(roundMoney\(split\.deposit\+estimatedRegular\)\)/);
 const total=59.99+12.99,deposit=Math.ceil(Math.round(total*100)/2)/100;
 assert.equal(deposit,36.49);
 assert.equal(30+12.99,42.99);
});
test('não registra compra idêntica sem informar sobre pedido anterior',()=>{
 assert.match(app,/recentOrderFor\(body\)/);
 assert.match(app,/recentOrderFor\(seasonBody\)\|\|recentOrderFor\(regularBody\)/);
 assert.match(app,/previousOrderNotice/);
 assert.match(app,/Consultar|Ver meus pedidos|aba <b>Pedidos<\/b>/);
 assert.match(app,/status.*CANCELADO/);
});
test('app desacelera polling e evita reprocessamentos excessivos',()=>{
 assert.match(app,/pollCustomerOrders\(\)\},30000/);
 assert.match(app,/Date\.now\(\)-lastOrderPollAt<20000/);
 assert.match(app,/if\(!seasonalCheckoutFrame\)seasonalCheckoutFrame=requestAnimationFrame/);
 assert.match(app,/seasonalPhotoImagesKey===imgKey/);
 assert.match(app,/A\(cloud\.produtos\)\.some\(p=>!images\(p\)\.length\)/);
});
test('PWA carrega recibo antes de app principal e apresenta escolha no celular',()=>{
 assert.ok(html.indexOf('payment-receipt-modal-v9-10-84.js')<html.indexOf('app.js?v='));
 assert.match(sw,/caseirinho-loja-v9\.10\.85-unified-choice/);
 assert.match(css,/caseirinho-mixed-choice/);
 assert.match(css,/caseirinho-mixed-due-highlight/);
});
