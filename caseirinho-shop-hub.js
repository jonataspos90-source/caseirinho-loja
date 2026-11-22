/* Caseirinho Loja — navegação comercial por setores, sem duplicar catálogo nem checkout. */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const tabs=['inicio','cardapio','ofertas','blackfriday','encomendas','presentes'];
const names={inicio:'Início',cardapio:'Cardápio',presentes:'Presentes',ofertas:'Ofertas',blackfriday:'Black Friday',encomendas:'Encomendas'};
const BEAUTY_URL='https://beauty-app-api-production.up.railway.app/';
let current='inicio',lastBF=false,customImages={},seasonalJumpPending=false;
let giftItems=[],giftStatus='loading',giftCheckedAt=0,giftLoading=false,giftOffset=0;
const catalog=()=>window.CaseirinhoCurrentPublicCatalog?.()||{};
const products=()=>Array.isArray(catalog().produtos)?catalog().produtos:[];
const promo=p=>p?.promocao||p?.ecommerce?.promocao||{};
const liveBF=p=>{
 const d=promo(p);if(d.ativo!==true||String(d.tipo).toUpperCase()!=='BLACK_FRIDAY')return false;
 const start=Date.parse(d.inicioEm),end=Date.parse(d.fimEm),price=Number(d.precoPromocional),base=window.CaseirinhoPromotions?.base?.(p)||Number(p.preco);
 return Number.isFinite(start)&&Number.isFinite(end)&&Date.now()>=start&&Date.now()<end&&price>0&&price<base;
};
const activeBF=()=>products().some(liveBF);
function safePhoto(src){
 const value=String(src||'').trim();
 return /^https:\/\//i.test(value)||/^(?:\.\/)?assets\/[\w./-]+\.(?:jpg|jpeg|png|webp)$/i.test(value)?value:'';
}
function photos(p){
 const possible=[p?.imagem,p?.foto,p?.fotoPrincipal,p?.ecommerce?.imagem,...(Array.isArray(p?.imagens)?p.imagens:[])];
 return possible.map(x=>typeof x==='string'?x:(x?.url||x?.src)).map(safePhoto).filter(Boolean);
}
const cards=[
 {key:'cardapio',eyebrow:'FEITO COM CARINHO',title:'Nosso cardápio',subtitle:'Massas, salgados e receitas artesanais',color:'green',emoji:'🍝',words:/lasanha|nhoque|talharim/i},
 {key:'ofertas',eyebrow:'VALE A PENA APROVEITAR',title:'Ofertas & combos',subtitle:'Mais sabores e vantagens no carrinho',color:'gold',emoji:'🥟',words:/empada|panqueca|combo/i},
 {key:'blackfriday',eyebrow:'TEMPO LIMITADO',title:'Black Friday',subtitle:'Descontos especiais da campanha',color:'dark',emoji:'🎁',words:/lasanha|empada/i},
 {key:'encomendas',eyebrow:'OCASIÕES ESPECIAIS',title:'Encomendas',subtitle:'Escolha sua data e reserve com carinho',color:'berry',emoji:'🎄',words:/empadão|lasanha|nhoque/i}
];
function cardImage(card){
 const customized=safePhoto(customImages[card.key]);if(customized)return customized;
 if(card.key==='encomendas'){
  const photo=$('seasonalPhoto');if(photo&&photo.getAttribute('src'))return safePhoto(photo.getAttribute('src'));
 }
 const list=products();
 const pool=card.key==='blackfriday'?list.filter(liveBF):card.key==='ofertas'?list.filter(p=>window.CaseirinhoPromotions?.isFeatured?.(p,list)):list;
 return pool.filter(p=>card.words.test(String(p.nome||'')+' '+String(p.nomeComercial||''))).flatMap(photos)[0]
 ||pool.flatMap(photos)[0]||'';
}
function shell(){
 if($('caseirinhoShopHub'))return;
 const main=document.querySelector('main');if(!main)return;
 const home=document.createElement('section');home.id='caseirinhoShopHub';home.className='caseirinho-shop-hub';
 home.innerHTML='<div class="hub-container"><div class="hub-hero"><img class="hub-official-logo" src="./icons/icon-192.png?v=clean-20261004" alt="Logo oficial Caseirinho Massas Artesanais" width="94" height="94"><span class="hub-eyebrow">💚 CASEIRINHO MASSAS ARTESANAIS</span><h1>Qual delícia vamos preparar para você?</h1><p>Encontre seus favoritos, descubra ofertas e faça encomendas especiais sem complicação.</p><button class="hub-start-shopping" type="button" data-hub-target="cardapio">Explorar cardápio <span aria-hidden="true">→</span></button></div>'+
 '<div class="hub-section-title"><div><h2>Escolha onde deseja comprar</h2><p>Cada opção tem seus próprios produtos e condições.</p></div></div>'+
 '<div class="hub-cards" id="hubCards"></div>'+

 '<section class="hub-taste" id="hubTaste" hidden><div class="hub-section-title"><div><h2>Descubra nossos sabores</h2><p>Algumas delícias do cardápio para você conhecer.</p></div><button class="hub-more" type="button" data-hub-target="cardapio">Ver cardápio completo →</button></div><div class="hub-taste-grid" id="hubTasteGrid"></div></section>'+ 

 '<div class="hub-trust"><span>🍝 Produção artesanal</span><span>💚 Feito com carinho</span><span>🛒 Compra segura</span></div><button type="button" class="hub-reviews-link" id="hubReviewsLink">⭐ Veja as avaliações de nossos clientes</button>'+
 '<aside class="hub-gift-banner" aria-labelledby="hubGiftTitle"><div class="hub-gift-icon" aria-hidden="true">🎁</div><div class="hub-gift-copy"><span class="hub-gift-eyebrow">CASEIRINHO INDICA · OUTRA LOJA</span><h2 id="hubGiftTitle">Presentes de última hora</h2><p>Beleza, acessórios e variedades.</p></div><button type="button" class="hub-gift-link hub-gift-link-internal" data-hub-target="presentes">Ver presentes <span aria-hidden="true">→</span></button></aside></div>';
 main.insertBefore(home,main.firstChild);
 const gifts=document.createElement('section');gifts.id='hubGiftsPage';gifts.className='hub-gifts-page';
 gifts.innerHTML='<div class="hub-gifts-container"><div class="hub-gifts-hero"><div class="hub-gifts-hero-icon" aria-hidden="true">🎁</div><div class="hub-gifts-hero-copy"><span class="hub-gift-eyebrow">CASEIRINHO INDICA · OUTRA LOJA</span><h1>Presentes & variedades</h1><p>Confira opções para presentear. Compra e pagamento são realizados na Beauty.</p></div></div><div class="hub-gift-products hub-gift-products-page" id="hubGiftPageItems" aria-live="polite"></div><div class="hub-gifts-bottom"><span>Produtos e valores consultados na Beauty. Disponibilidade pode mudar até a conclusão da compra.</span><button type="button" class="hub-gift-rotate" data-hub-gift-next hidden>↻ Outras sugestões</button><a class="hub-gift-link" href="https://beauty-app-api-production.up.railway.app/" target="_blank" rel="noopener noreferrer">Abrir loja de presentes <span aria-hidden="true">↗</span></a></div></div>';
 home.after(gifts);
 // O aviso de sincronização e o botão "Tentar novamente" não podem ficar dentro
 // do banner oculto; eles são essenciais quando a API do catálogo falha.
 const statusLine=$('catalogStatusLine');
 if(statusLine){home.after(statusLine);statusLine.classList.add('hub-catalog-status')}
 const nav=document.createElement('nav');nav.id='caseirinhoHubTabs';nav.className='hub-tabs';
 nav.setAttribute('aria-label','Navegação por setores da loja');
 nav.innerHTML=tabs.map(key=>'<button type="button" data-hub-target="'+key+'" aria-pressed="false">'+(key==='inicio'?'⌂ ':key==='cardapio'?'🍝 ':key==='presentes'?'🎁 ':key==='ofertas'?'🔥 ':key==='blackfriday'?'🖤 ':'🎄 ')+names[key]+'</button>').join('');
 document.querySelector('.top')?.insertAdjacentElement('afterend',nav);
 nav.querySelector('[data-hub-target="presentes"]')?.setAttribute('aria-label','Presentes e variedades, último setor');
 document.body.classList.add('caseirinho-hub-enabled');
 $('hubReviewsLink')?.addEventListener('click',()=>$('navReviews')?.click());
 document.addEventListener('click',e=>{const next=e.target.closest?.('[data-hub-gift-next]');if(!next||!giftItems.length)return;giftOffset=(giftOffset+3)%giftItems.length;renderGiftProducts()});
 document.addEventListener('click',e=>{
  const retry=e.target.closest?.('[data-hub-seasonal-retry]');
  if(!retry)return;
  retry.disabled=true;retry.textContent='Atualizando encomendas...';
  Promise.resolve(window.CaseirinhoSeasonalBridge?.refreshCampaigns?.()).catch(console.warn).finally(()=>{
    retry.disabled=false;retry.textContent='🔄 Tentar novamente';
    syncTabs();
  });
 });
 document.addEventListener('click',e=>{
  const button=e.target.closest?.('[data-hub-target]');
  if(!button)return;
  e.preventDefault();open(button.dataset.hubTarget);
 });
 document.addEventListener('click',e=>{
  const button=e.target.closest?.('[data-hub-product]');if(!button)return;
  e.preventDefault();open('cardapio');
  const id=button.dataset.hubProduct;
  const detail=[...document.querySelectorAll('#products [data-view]')].find(el=>String(el.dataset.view)===id);
  if(detail)detail.click();else $('catalogSection')?.scrollIntoView({behavior:'smooth'});
 });
 // Os controles de navegação antigos passam a abrir o setor correspondente.
 for(const key of ['homeBtn','navMenu','navStore','shopBtn']){
  $(key)?.addEventListener('click',e=>{e.stopImmediatePropagation();open(key==='homeBtn'||key==='navStore'?'inicio':'cardapio')},true);
 }
 // A busca existente continua funcionando, mas seus resultados ficam visíveis.
 $('search')?.addEventListener('input',()=>{if($('search').value.trim())open('cardapio',false)});
 // Botões anteriores e banners sazonais abrem seu setor antes de rolar.
 $('seasonalBannerButton')?.addEventListener('click',e=>{e.stopImmediatePropagation();open('encomendas')},true);
 document.addEventListener('click',e=>{
  const a=e.target.closest?.('a[href="#catalogSection"]');
  if(a){e.preventDefault();open('cardapio')}
 },true);
 const featured=$('featured'),seasonal=$('seasonalBanner');
 if(featured)new MutationObserver(()=>{decorateOffers();syncTabs();updateCards()}).observe(featured,{childList:true});
 const renderedCatalog=$('products');if(renderedCatalog)new MutationObserver(()=>{updateCards();renderTaste()}).observe(renderedCatalog,{childList:true});
 if(seasonal)new MutationObserver(()=>{syncTabs();updateCards();revealSeasonalProducts()}).observe(seasonal,{attributes:true,attributeFilter:['hidden']});
 window.addEventListener('caseirinho:seasonal-updated',()=>{syncTabs();revealSeasonalProducts()});
 if($('seasonalPhoto'))new MutationObserver(updateCards).observe($('seasonalPhoto'),{attributes:true,attributeFilter:['src']});
 renderCards();renderTaste();decorateOffers();syncTabs();open('inicio',false);
 const header=document.querySelector('.top');const syncHeader=()=>document.documentElement.style.setProperty('--hub-top-height',Math.ceil(header?.getBoundingClientRect().height||60)+'px');
 syncHeader();if(header&&window.ResizeObserver)new ResizeObserver(syncHeader).observe(header);
 loadHomeImages();
 document.addEventListener('visibilitychange',()=>{if(!document.hidden&&current==='presentes'&&Date.now()-giftCheckedAt>120000)loadGiftProducts()});
 setInterval(syncTabs,60000);
}
async function loadHomeImages(){
 const settings=window.CASEIRINHO_CONFIG||{};
 const api=String(settings.apiUrl||'').replace(/\/+$/,'');
 const slug=String(new URLSearchParams(location.search).get('empresa')||new URLSearchParams(location.search).get('loja')||settings.storeSlug||'caseirinho').trim();
 if(!api)return;
 try{
  const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),7500);
  let result;
  try{const response=await fetch(api+'/api/v1/public/store/'+encodeURIComponent(slug)+'/home-cards',{cache:'no-store',signal:controller.signal});if(!response.ok)throw Error('Imagens personalizadas indisponíveis');result=await response.json()}
  finally{clearTimeout(timeout)}
  if(result?.ok&&result.images&&typeof result.images==='object'){customImages=result.images;updateCards()}
 }catch(err){console.warn('[Caseirinho] Fotos personalizadas: usando imagens do catálogo',err.message)}
}

function giftImageUrl(value){
 const src=String(value||'').trim();
 return /^https:\/\/[a-z0-9.-]+\//i.test(src)?src:'';
}
const giftPrice=value=>Number(value).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
function selectGiftItems(data){
 if(!data||data.ok!==true||!Array.isArray(data.products))throw Error('Catálogo Beauty inválido');
 const allowed=data.products.filter(p=>p&&p.published===true&&p.purchaseAvailable===true&&p.showcaseOnly!==true
  &&Number.isFinite(Number(p.price))&&Number(p.price)>0&&Number(p.stock)>0
  &&typeof p.name==='string'&&p.name.trim());
 // Fotos primeiro, depois alternância de categorias para uma seleção mais variada.
 allowed.sort((a,b)=>Number(!!giftImageUrl(b.image))-Number(!!giftImageUrl(a.image)));
 const groups=new Map();
 for(const p of allowed){const cat=String(p.categoryId||'geral');
  if(!groups.has(cat))groups.set(cat,[]);
  groups.get(cat).push(p);
 }
 const diversified=[];
 while(diversified.length<allowed.length){
  for(const items of groups.values())if(items.length)diversified.push(items.shift());
 }
 return diversified;
}
function giftPlaceholder(icon){
 const place=document.createElement('span');place.className='hub-gift-photo-placeholder';
 const emoji=document.createElement('span');emoji.setAttribute('aria-hidden','true');emoji.textContent=String(icon||'🎁').slice(0,8);
 const caption=document.createElement('small');caption.textContent='Foto em breve';place.append(emoji,caption);return place;
}
function giftProductCard(p){
 const link=document.createElement('a');link.className='hub-gift-product';link.href=BEAUTY_URL;
 link.target='_blank';link.rel='noopener noreferrer';link.setAttribute('aria-label','Ver '+String(p.name)+' na loja de presentes (abre outra aba)');
 const frame=document.createElement('div');frame.className='hub-gift-product-photo';
 const src=giftImageUrl(p.image);
 if(src){
  const img=document.createElement('img');img.src=src;img.alt='';img.loading='lazy';img.decoding='async';
  img.addEventListener('error',()=>frame.replaceChildren(giftPlaceholder(p.icon)),{once:true});frame.append(img);
 }else frame.append(giftPlaceholder(p.icon));
 const detail=document.createElement('div');detail.className='hub-gift-product-detail';
 const availability=document.createElement('span');availability.className='hub-gift-available';availability.textContent='● Disponível na Beauty';
 const name=document.createElement('strong');name.className='hub-gift-product-name';name.textContent=String(p.name);
 const brand=document.createElement('small');brand.className='hub-gift-brand';brand.textContent=String(p.brand||p.description||'Presentes & variedades');
 const price=document.createElement('b');price.className='hub-gift-price';price.textContent=giftPrice(p.price);
 const action=document.createElement('span');action.className='hub-gift-product-action';action.textContent='Ver na loja ↗';
 detail.append(availability,name,brand,price,action);link.append(frame,detail);return link;
}
function renderGiftProducts(){
 const el=$('hubGiftPageItems');if(!el)return;
 el.replaceChildren();
 if(giftStatus==='ready'&&giftItems.length){
  const shown=giftItems.length<=3?giftItems:Array.from({length:3},(_,i)=>giftItems[(giftOffset+i)%giftItems.length]);
  for(const item of shown)el.append(giftProductCard(item));
 }else{
  const fallback=document.createElement('p');fallback.className='hub-gift-message';
  fallback.textContent=giftStatus==='loading'?'Consultando presentes disponíveis...':
   giftStatus==='error'?'Não foi possível carregar agora. Abra a Beauty para conferir os produtos.':
   'Os presentes disponíveis serão exibidos aqui. Consulte o catálogo completo na Beauty.';
  el.append(fallback);
 }
 document.querySelectorAll('[data-hub-gift-next]').forEach(b=>{b.hidden=giftStatus!=='ready'||giftItems.length<=3});
}
async function loadGiftProducts(){
 if(giftLoading)return;
 giftLoading=true;giftCheckedAt=Date.now();giftStatus='loading';renderGiftProducts();
 const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),8000);
 try{
  const response=await fetch(BEAUTY_URL+'api/public/catalog?_v='+Date.now(),{cache:'no-store',credentials:'omit',mode:'cors',signal:controller.signal});
  if(!response.ok)throw Error('Beauty '+response.status);
  giftItems=selectGiftItems(await response.json());giftOffset=0;
  giftStatus=giftItems.length?'ready':'empty';
 }catch(error){
  giftItems=[];giftStatus='error';
  console.warn('[Caseirinho] Vitrine de presentes indisponível:',error.message);
 }finally{clearTimeout(timeout);giftLoading=false;renderGiftProducts()}
}
function renderTaste(){
 const grid=$('hubTasteGrid'),holder=$('hubTaste');if(!grid||!holder)return;
 const candidates=products().filter(p=>p&&p.ativo!==false&&p.disponivelVenda!==false&&p.publicado!==false&&photos(p).length&&Number(p.precoEcommerce||p.preco)>0).slice(0,4);
 const key=candidates.map(p=>String(p.id)).join('|');
 if(grid.dataset.key===key)return;grid.dataset.key=key;
 holder.hidden=!candidates.length;
 grid.replaceChildren();
 for(const p of candidates){
  const item=document.createElement('button');item.type='button';item.className='hub-taste-card';item.dataset.hubProduct=String(p.id);
  const img=document.createElement('img');img.src=photos(p)[0];img.alt='';img.loading='lazy';img.decoding='async';
  const info=document.createElement('span');info.className='hub-taste-text';
  const name=document.createElement('strong');name.textContent=String(p.nomeComercial||p.nome||'Produto artesanal');
  const price=document.createElement('span');price.className='hub-taste-price';
  const value=window.CaseirinhoPromotions?.priceInfo?.(p,products())?.current||Number(p.precoEcommerce||p.preco);
  price.textContent=Number(value).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
  const action=document.createElement('small');action.textContent='Ver produto →';
  info.append(name,price,action);item.append(img,info);grid.append(item);
 }
}
function renderCards(){
 const el=$('hubCards');if(!el)return;
 el.innerHTML=cards.map(c=>'<button type="button" class="hub-card hub-'+c.color+'" data-hub-target="'+c.key+'" data-hub-card="'+c.key+'"><span class="hub-photo" data-hub-photo="'+c.key+'"></span><span class="hub-card-shade"></span><span class="hub-card-copy"><span class="hub-kicker">'+c.eyebrow+'</span><strong>'+c.title+'</strong><small>'+c.subtitle+'</small><span class="hub-card-action">Ver produtos <span aria-hidden="true">→</span></span></span><span class="hub-emoji" aria-hidden="true">'+c.emoji+'</span></button>').join('');
 updateCards();
}
function updateCards(){
 cards.forEach(c=>{
  const target=document.querySelector('[data-hub-photo="'+c.key+'"]');
  if(!target)return;
  const src=cardImage(c);
  if(src){target.style.backgroundImage='url("'+src.replace(/"/g,'%22')+'")';target.classList.add('has-photo')}
  else{target.style.backgroundImage='none';target.classList.remove('has-photo')}
 });
 const bf=activeBF();
 document.querySelectorAll('[data-hub-card="blackfriday"]').forEach(x=>{x.hidden=!bf});
}
function decorateOffers(){
 const featured=$('featured');if(!featured)return;
 const bf=products().filter(liveBF);
 const ids=new Set(bf.map(p=>String(p.id)));
 [...featured.children].forEach(card=>{
  const refs=[...card.querySelectorAll('[data-view],[data-add]')].map(x=>String(x.dataset.view||x.dataset.add));
  if(card.hasAttribute('data-view')||card.hasAttribute('data-add'))refs.push(String(card.dataset.view||card.dataset.add));
  const isBF=refs.some(id=>ids.has(id))||(!refs.length&&/BLACK FRIDAY/i.test(card.textContent||''));
  card.dataset.hubBlackfriday=isBF?'yes':'no';
 });
}
function revealSeasonalProducts(){
 if(!seasonalJumpPending||current!=='encomendas'||$('seasonalSection')?.hidden)return;
 seasonalJumpPending=false;
 requestAnimationFrame(()=>{
  const filters=$('seasonalCategoryFilter');
  const target=filters&&filters.children.length?filters:$('seasonalSection');
  target?.scrollIntoView({behavior:'smooth',block:'start'});
 });
}
function syncTabs(){
 const emptySeason=$('hubSeasonalEmpty');
 if(emptySeason){
  emptySeason.hidden=current!=='encomendas'||!$('seasonalSection')?.hidden;
  const label=emptySeason.querySelector('[data-hub-seasonal-message]');
  const state=window.CaseirinhoSeasonalBridge?.campaignSummary?.();
  if(label&&!emptySeason.hidden)label.textContent=state?.loading?
   'Carregando os produtos de Encomendas de Natal...':
   'O cardápio de encomendas ainda não carregou. Use o botão para tentar novamente.';
 }
 const bf=activeBF();
 const featured=$('featured');
 if(bf!==lastBF){lastBF=bf;decorateOffers();updateCards();if(!bf&&current==='blackfriday')open('ofertas',false)}
 document.querySelectorAll('[data-hub-target="blackfriday"]').forEach(x=>{x.hidden=!bf});
 const offersCount=featured?[...featured.children].filter(x=>x.dataset.hubBlackfriday!=='yes').length:0;
 const bfCount=featured?[...featured.children].filter(x=>x.dataset.hubBlackfriday==='yes').length:0;
 const offersEmpty=$('hubOffersEmpty')||document.createElement('div');
 if(!offersEmpty.id){offersEmpty.id='hubOffersEmpty';offersEmpty.className='hub-empty';featured?.after(offersEmpty)}
 offersEmpty.hidden=current!=='ofertas'||offersCount>0;
 offersEmpty.textContent='As próximas ofertas aparecerão aqui assim que forem publicadas.';
 const bfEmpty=$('hubBlackFridayEmpty')||document.createElement('div');
 if(!bfEmpty.id){bfEmpty.id='hubBlackFridayEmpty';bfEmpty.className='hub-empty';featured?.after(bfEmpty)}
 bfEmpty.hidden=current!=='blackfriday'||bfCount>0;
 bfEmpty.textContent='A campanha está ativa, mas ainda não há itens disponíveis para mostrar.';
}
function open(key,scroll=true){
 if(!tabs.includes(key))key='inicio';
 if(key==='blackfriday'&&!activeBF())key='ofertas';
 current=key;
 document.body.dataset.hubView=key;
 if(key==='presentes'&&Date.now()-giftCheckedAt>90000)loadGiftProducts();
 document.querySelectorAll('#caseirinhoHubTabs [data-hub-target]').forEach(b=>{
  const selected=b.dataset.hubTarget===key;
  b.classList.toggle('is-active',selected);b.setAttribute('aria-pressed',String(selected));
 });
 if(key==='encomendas'){
  seasonalJumpPending=scroll;
  if($('seasonalSection')?.hidden){
   let note=$('hubSeasonalEmpty');
   if(!note){
    note=document.createElement('section');note.id='hubSeasonalEmpty';note.className='hub-empty hub-seasonal-empty';
    note.setAttribute('role','status');
    note.innerHTML='<strong data-hub-seasonal-message>Carregando os produtos de Encomendas de Natal...</strong><button type="button" class="hub-seasonal-retry" data-hub-seasonal-retry>🔄 Tentar novamente</button>';
    $('caseirinhoShopHub')?.after(note);
   }
   note.hidden=false;
  }
  const bridge=window.CaseirinhoSeasonalBridge;
  if(!bridge?.campaignSummary?.().loading)Promise.resolve(bridge?.refreshCampaigns?.()).catch(console.warn);
 }else{
  seasonalJumpPending=false;
  if($('hubSeasonalEmpty'))$('hubSeasonalEmpty').hidden=true;
 }
 syncTabs();
 if(scroll){
  if(key==='encomendas'&&!$('seasonalSection')?.hidden)revealSeasonalProducts();
  else window.scrollTo({top:0,behavior:'smooth'});
 }
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',shell,{once:true});else shell();
})();