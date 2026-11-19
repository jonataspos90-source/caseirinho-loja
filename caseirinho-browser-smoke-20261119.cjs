/* Smoke real em navegador com API simulada: nunca cria pedido na produção. */
'use strict';
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const root='http://127.0.0.1:8080/';
const catalogue={
 loja:{nome:'Caseirinho - Ambiente de Testes',ativo:true,categorias:[{id:'massas',nome:'Massas',emoji:'🍝',ativo:true,ordem:1}],grades:[],meiosPagamento:['PIX']},
 produtos:[{id:'sku-teste-1',codigo:'T1',nome:'Nhoque Artesanal Teste',nomeComercial:'Nhoque Artesanal Teste',categoriaId:'massas',preco:34.99,precoEcommerce:34.99,ativo:true,publicado:true,disponivelVenda:true,unidade:'UN',imagens:[]}],
 publicadoEm:'2026-11-19T18:00:00.000Z'
};
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 let ordersSent=0;
 try{
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,deviceScaleFactor:1});
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  let catalogDown=false;
  await page.route('https://john-cloud-api-production.up.railway.app/**',async route=>{
   const req=route.request(),path=new URL(req.url()).pathname;
   const headers={'content-type':'application/json','access-control-allow-origin':'*','access-control-allow-methods':'GET,POST,OPTIONS','access-control-allow-headers':'content-type,authorization'};
   if(req.method()==='OPTIONS')return route.fulfill({status:204,headers,body:''});
   if(/\/orders(?:\/|$)/.test(path)&&req.method()==='POST'){
    ordersSent++;
    return route.fulfill({status:403,headers,body:JSON.stringify({error:'Pedido real bloqueado no teste de navegador'})});
   }
   let status=200,body={ok:true};
   if(path.endsWith('/catalog')){if(catalogDown){status=503;body={error:'API simulada indisponível'}}else body=catalogue}
   else if(path.endsWith('/catalog/version'))body={ok:true,version:'test-1',publishedAt:catalogue.publicadoEm};
   else if(path.endsWith('/seasonal-campaigns'))body={ok:true,campaigns:[],serverToday:'2026-11-19'};
   else if(path.endsWith('/customers/pre-register'))body={ok:true,id:'cliente-simulado-1'};
   else if(path.endsWith('/home-cards'))body={ok:true,images:{}};
   else if(path.includes('/orders'))body={ok:true,orders:[]};
   await route.fulfill({status,headers,body:JSON.stringify(body)});
  });
  await page.goto(root,{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForFunction(()=>window.CaseirinhoCurrentPublicCatalog?.()?.produtos?.length>0,{timeout:15000});
  await page.waitForSelector('#caseirinhoShopHub',{state:'visible',timeout:10000});
  assert.equal(await page.locator('#hubCards [data-hub-card="cardapio"]').count(),1,'Atalho principal do cardápio ausente');
  assert.equal(await page.locator('#catalogStatusLine').isVisible(),true,'Status de conexão oculto');
  assert.equal(await page.locator('#customerIdentityGate').isVisible(),true,'Tela de identificação não apareceu');
  await page.fill('#identityName','Cliente de Teste');
  await page.fill('#identityPhone','11991234567');
  await page.check('#identityConsent');
  await page.click('#identityContinue');
  await page.waitForFunction(()=>document.querySelector('#customerIdentityGate')?.hidden===true,{timeout:15000});
  await page.locator('#caseirinhoHubTabs [data-hub-target="cardapio"]').click();
  assert.equal(await page.locator('#catalogSection').isVisible(),true,'Cardápio não abriu');
  await page.waitForSelector('#products [data-view="sku-teste-1"]',{state:'visible',timeout:15000});
  const add=page.locator('#products [data-add="sku-teste-1"]').first();
  assert.equal(await add.count()>0,true,'Adicionar ao carrinho não encontrado');
  await add.click();
  await page.waitForFunction(()=>Number(document.querySelector('#cartCount')?.textContent||'0')>=1,{timeout:10000});
  await page.locator('#caseirinhoHubTabs [data-hub-target="inicio"]').click();
  assert.equal(await page.locator('#caseirinhoShopHub').isVisible(),true,'Não voltou à página inicial');
  catalogDown=true;
  await page.evaluate(()=>document.getElementById('retryCatalog')?.click());
  await page.waitForFunction(()=>document.getElementById('catalogStatusLine')?.dataset.connection==='offline',{timeout:15000});
  assert.equal(await page.locator('#retryCatalog').isVisible(),true,'Falta ação de tentar novamente durante falha');
  assert.equal(ordersSent,0,'Um pedido foi enviado durante o smoke');
  assert.deepEqual(errors,[], 'Erros de JavaScript durante navegação');
  console.log('PASS: identificação, catálogo, carrinho, retorno à home, recuperação segura e nenhum pedido real');
  await context.close();
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
