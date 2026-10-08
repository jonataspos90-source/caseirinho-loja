const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=path=>fs.readFileSync(__dirname+'/'+path,'utf8');
const money=n=>n.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const parseMoney=v=>{const s=String(v).replace(/\s/g,'').replace(/R\$/gi,'').replace(/\./g,'').replace(',','.').replace(/[^0-9.-]/g,'');return Number(s)||0};
const round2=n=>Math.round((n+Number.EPSILON)*100)/100;
function mockRow(id,amount,opts={}){
  return {id,hidden:!!opts.hidden,dataset:opts.dataset||{},classList:{contains:()=>false},
    querySelector:s=>s==='b'?(opts.strongOnly?null:{textContent:amount}):s==='span'?{textContent:id}:null};
}
function build(rows,subtotal,shipping='R$ 0,00',addon=0){
  const ui={subtotal:{textContent:money(subtotal)},shipping:{textContent:shipping},mode:{value:'RETIRADA'}};
  const context={document:{querySelector:()=>({children:rows})},S:v=>String(v??''),E:id=>ui[id],
    round2,parseMoney,mode:()=>'RETIRADA',addonAmount:()=>addon,N:v=>Number(v)||0};
  const checkout=source('checkout-parmesao-v9-3-6.js');
  const cart=checkout.slice(checkout.indexOf('function visibleDiscountTotal(){'),checkout.indexOf('function style(){'));
  vm.runInNewContext(cart,context);
  const moto=source('delivery-moto-v9-5-4.js');
  const shippingPart=moto.slice(moto.indexOf('function visibleDiscounts(){'),moto.indexOf('async function request('));
  vm.runInNewContext(shippingPart,context);
  return context;
}
test('pack 5x4 55,95 - 9,99 = 45,96 (old HTML with b tag)',()=>{
  const c=build([mockRow('packDiscountLine','- R$ 9,99')],45.96);
  assert.equal(c.visibleDiscountTotal(),0);
  assert.equal(c.discountTotal(),0);
  assert.equal(c.totalState().total,45.96);
});
test('pack remains a display-only discount, including explicit dataset marker',()=>{
  const c=build([mockRow('packDiscountLine','- R$ 9,99',{dataset:{discountIncluded:'true'}})],45.96);
  assert.equal(c.totalState().total,45.96);
  assert.equal(c.discountTotal(),0);
});
test('single promotion discount with cashback and coupon only subtracts actual extra deductions',()=>{
  const rows=[
    mockRow('packDiscountLine','- R$ 9,99'),
    mockRow('coupon958DiscountRow','- R$ 4,00'),
    mockRow('cashback960DiscountRow','- R$ 1,00')
  ];
  const c=build(rows,45.96);
  assert.equal(c.visibleDiscountTotal(),5);
  assert.equal(c.discountTotal(),5);
  assert.equal(c.totalState().total,40.96);
});
test('parmesao optional is additive, while pack does not subtract again',()=>{
  const c=build([mockRow('packDiscountLine','- R$ 9,99')],45.96,'R$ 0,00',4);
  assert.equal(c.visibleDiscountTotal(),0);
  assert.equal(c.totalState().total,49.96);
});
test('new HTML strong discount never becomes another financial deduction',()=>{
  const c=build([mockRow('packDiscountLine','R$ 9,99',{strongOnly:true})],45.96);
  assert.equal(c.visibleDiscountTotal(),0);
  assert.equal(c.discountTotal(),0);
});
test('legacy double minus glyph removed and cache versions updated',()=>{
  const app=source('app.js'),html=source('index.html'),sw=source('service-worker.js');
  assert.match(app,/updateText\('packDiscountTotal',money\(saved\)\)/);
  assert.match(html,/#packDiscountTotal::before\{content:'−';/);
  assert.match(html,/data-discount-included="true"/);
  assert.match(sw,/v9\.10\.9-desconto-sem-duplicacao/);
  assert.match(html,/checkout-parmesao-v9-3-6\.js\?v=91090/);
});
