'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844}});
  const errors=[],calls=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('request',r=>{if(r.method()==='POST'&&r.url().includes('/orders/'))calls.push(r.url())});
  const fakePix={chave:'69195483000123',nome:'CASEIRINHO MASSAS',valor:34.99,txid:'TEST-001',copiaECola:'000201260014BR.GOV.BCB.PIX520400005303986540534.995802BR5915CASEIRINHO MASS6009SAO PAULO6304A1B2',qrCodeDataUrl:'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScL/nwAAAABJRU5ErkJggg=='};
  await page.route('https://john-cloud-api-production.up.railway.app/**',async route=>{
   const request=route.request(),path=new URL(request.url()).pathname;
   const headers={'content-type':'application/json','access-control-allow-origin':'*','access-control-allow-methods':'GET,POST,OPTIONS','access-control-allow-headers':'content-type'};
   if(request.method()==='OPTIONS')return route.fulfill({status:204,headers,body:''});
   let body={ok:true};
   if(path.includes('/orders/TEST-001/pix'))body={ok:true,pix:fakePix};
   else if(path.endsWith('/catalog'))body={loja:{nome:'Caseirinho',ativo:true,categorias:[]},produtos:[],publicadoEm:'2026-11-21T00:00:00Z'};
   else if(path.endsWith('/seasonal-campaigns'))body={ok:true,campaigns:[]};
   else if(path.endsWith('/customers/pre-register'))body={ok:true,id:'fixture-client'};
   else if(path.includes('/orders'))body={ok:true,orders:[]};
   await route.fulfill({status:200,headers,body:JSON.stringify(body)});
  });
  await page.goto('http://127.0.0.1:8080/',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>typeof window.CaseirinhoPixPayment937?.generateForOrder==='function',{timeout:15000});
  await page.locator('#identityName').fill('Cliente de Teste');
  await page.locator('#identityPhone').fill('11991234567');
  await page.locator('#identityConsent').check();
  await page.locator('#identityContinue').click();
  await page.locator('#customerIdentityGate').waitFor({state:'hidden',timeout:12000});
  await page.evaluate(()=>{
   localStorage.setItem('john_store_caseirinho_orders_v1',JSON.stringify([{id:'TEST-001',code:'T001',status:'ACEITO',formaPagamento:'PIX',publicToken:'fixture-only'}]));
  });
  await page.evaluate(()=>window.CaseirinhoPixPayment937.generateForOrder('TEST-001'));
  const dialog=page.locator('#pix937Overlay');
  await dialog.waitFor({state:'visible',timeout:10000});
  assert.equal(await dialog.locator('.pix937-brand-row img').count(),1);
  assert.match(await dialog.textContent(),/Caseirinho Massas Artesanais/);
  assert.match(await dialog.textContent(),/Falta pouco/);
  assert.match(await dialog.textContent(),/não solicita pagamentos adicionais/);
  assert.match(await dialog.textContent(),/Esta cobrança não possui prazo automático informado/);
  assert.match(await dialog.textContent(),/CASEIRINHO MASSAS/);
  assert.equal(await dialog.locator('.pix937-code').inputValue(),fakePix.copiaECola);
  assert.equal(await dialog.locator('.pix937-qr').getAttribute('src'),fakePix.qrCodeDataUrl);
  assert.doesNotMatch(await dialog.textContent(),/MOOZ|29:48/);
  assert.equal(calls.length,1,'Não gerou pedidos, apenas uma consulta de cobrança simulada');
  assert.deepEqual(errors,[]);
  console.log('PASS: recibo Pix real com dados simulados, marca correta e sem falsa quitação ou prazo inventado');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
