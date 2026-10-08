const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const context=vm.createContext({});
vm.runInContext(fs.readFileSync(__dirname+'/order-amounts.js','utf8'),context);
const api=context.JohnOrderAmounts;

const pack={
 modalidade:'RETIRADA',subtotal:43.96,total:43.96,valorFrete:0,
 itens:[
 {quantidade:3,precoUnitario:6.66,total:19.98,economia:9.99,promocaoAplicada:'Leve 5, pague 4'},
 {quantidade:2,precoUnitario:11.99,total:23.98,economia:0}
 ]
};
test('pedido com pack Leve 5 pague 4 mantém o desconto apenas uma vez',()=>{
 const b=api.breakdown(pack);
 assert.equal(b.products,53.95);
 assert.equal(b.promoDiscount,9.99);
 assert.equal(b.discounts,9.99);
 assert.equal(b.total,43.96);
 assert.match(api.text(pack),/Desconto - Leve 5, pague 4: - R\$\s*9,99/);
 assert.match(api.celebration(pack),/economizou R\$\s*9,99/);
});
test('sem pack mostra somente os valores corretos',()=>{
 const b=api.breakdown({subtotal:20,total:25,valorFrete:5,itens:[{quantidade:1,precoUnitario:20}]});
 assert.equal(b.promoDiscount,0);
 assert.equal(b.total,25);
 assert.equal(api.celebration({subtotal:20,total:25,valorFrete:5}), '');
});
test('com cupom e pack apresenta descontos distintos',()=>{
 const b=api.breakdown({...pack,subtotalOriginal:53.95,total:39.96,descontoCupom:4});
 assert.equal(b.promoDiscount,9.99);
 assert.equal(b.otherDiscounts,4);
 assert.equal(b.total,39.96);
});
test('checkout e comprovante usam o mesmo discriminador centralizado',()=>{
 const app=fs.readFileSync(__dirname+'/app.js','utf8');
 const html=fs.readFileSync(__dirname+'/index.html','utf8');
 const receipt=fs.readFileSync(__dirname+'/order-receipt-pdf-v9-4-1.js','utf8');
 assert.match(html,/id="packDiscountLine"/);
 assert.match(app,/E\('packDiscountTotal'\)\.textContent/);
 assert.match(receipt,/JohnOrderAmounts\.lines\(o\)/);
 assert.match(receipt,/PARABÉNS PELA ECONOMIA!/);
});
