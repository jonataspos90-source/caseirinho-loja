'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const src=fs.readFileSync('app.js','utf8');
const fn=src.slice(src.indexOf('async function startMercadoPagoPayment'),src.indexOf('function migrateLegacyCaseirinhoStorage'));
test('Pix abre código dentro do app sem redirecionar nem marcar pago',async()=>{
 let shown,redirected=false,request;const ctx={mercadoPagoOnline:true,STORE:'caseirinho',S:String,URL,api:async(path,opts)=>{request={path,opts};return{pix:{copiaECola:'000201pix'},payment:{status:'PENDENTE'}}},showPixCopyAndPaste:(o,p)=>shown=p,window:{location:{assign:()=>redirected=true}},toast:m=>assert.fail(m)};
 vm.runInNewContext(fn,ctx);const b={};await ctx.startMercadoPagoPayment({id:'1',publicToken:'secret'},b);assert.equal(shown.copiaECola,'000201pix');assert.equal(redirected,false);assert.equal(b.disabled,false);assert.equal(JSON.parse(request.opts.body).publicToken,'secret');
});
test('cartões continuam no checkout HTTPS e rejeitam URL de terceiros',async()=>{
 let redirect,warning;const ctx={mercadoPagoOnline:true,STORE:'caseirinho',S:String,URL,api:async()=>({url:'https://www.mercadopago.com.br/checkout'}),window:{location:{assign:x=>redirect=x}},toast:x=>warning=x};vm.runInNewContext(fn,ctx);await ctx.startMercadoPagoPayment({id:'1',publicToken:'secret'},{});assert.match(redirect,/mercadopago/);ctx.api=async()=>({url:'https://example.com'});redirect=null;await ctx.startMercadoPagoPayment({id:'1',publicToken:'secret'},{});assert.equal(redirect,null);assert.match(warning,/inválido/);
});
