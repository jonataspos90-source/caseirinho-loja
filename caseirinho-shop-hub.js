/* Caseirinho Loja — navegação comercial por setores, sem duplicar catálogo nem checkout. */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const tabs=['inicio','cardapio','ofertas','blackfriday','encomendas'];
const names={inicio:'Início',cardapio:'Cardápio',ofertas:'Ofertas',blackfriday:'Black Friday',encomendas:'Encomendas'};
let current='inicio',lastBF=false,customImages={};
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
 home.innerHTML='<div class="hub-container"><div class="hub-hero"><span class="hub-eyebrow">💚 CASEIRINHO MASSAS ARTESANAIS</span><h1>Qual delícia vamos preparar para você?</h1><p>Encontre seus favoritos, descubra ofertas e faça encomendas especiais sem complicação.</p><button class="hub-start-shopping" type="button" data-hub-target="cardapio">Explorar cardápio <span aria-hidden="true">→</span></button></div>'+
 '<div class="hub-section-title"><div><h2>Escolha onde deseja comprar</h2><p>Cada opção tem seus próprios produtos e condições.</p></div></div>'+
 '<div class="hub-cards" id="hubCards"></div>'+
 '<section class="hub-taste" id="hubTaste" hidden><div class="hub-section-title"><div><h2>Descubra nossos sabores</h2><p>Algumas delícias do cardápio para você conhecer.</p></div><button class="hub-more" type="button" data-hub-target="cardapio">Ver cardápio completo →</button></div><div class="hub-taste-grid" id="hubTasteGrid"></div></section>'+ 
 '<div class="hub-trust"><span>🍝 Produção artesanal</span><span>💚 Feito com carinho</span><span>🛒 Compra segura</span></div><button type="button" class="hub-reviews-link" id="hubReviewsLink">⭐ Veja as avaliações de nossos clientes</button></div>';
 main.insertBefore(home,main.firstChild);
 // O aviso de sincronização e o botão "Tentar novamente" não podem ficar dentro
 // do banner oculto; eles são essenciais quando a API do catálogo falha.
 const statusLine=$('catalogStatusLine');
 if(statusLine){home.after(statusLine);statusLine.classList.add('hub-catalog-status')}
 const nav=document.createElement('nav');nav.id='caseirinhoHubTabs';nav.className='hub-tabs';
 nav.setAttribute('aria-label','Navegação por setores da loja');
 nav.innerHTML=tabs.map(key=>'<button type="button" data-hub-target="'+key+'" aria-pressed="false">'+(key==='inicio'?'⌂ ':key==='cardapio'?'🍝 ':key==='ofertas'?'🔥 ':key==='blackfriday'?'🖤 ':'🎄 ')+names[key]+'</button>').join('');
 document.querySelector('.top')?.insertAdjacentElement('afterend',nav);
 document.body.classList.add('caseirinho-hub-enabled');
 $('hubReviewsLink')?.addEventListener('click',()=>$('navReviews')?.click());
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
 if(seasonal)new MutationObserver(()=>{syncTabs();updateCards()}).observe(seasonal,{attributes:true,attributeFilter:['hidden']});
 if($('seasonalPhoto'))new MutationObserver(updateCards).observe($('seasonalPhoto'),{attributes:true,attributeFilter:['src']});
 renderCards();renderTaste();decorateOffers();syncTabs();open('inicio',false);
 const header=document.querySelector('.top');const syncHeader=()=>document.documentElement.style.setProperty('--hub-top-height',Math.ceil(header?.getBoundingClientRect().height||60)+'px');
 syncHeader();if(header&&window.ResizeObserver)new ResizeObserver(syncHeader).observe(header);
 loadHomeImages();
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
function syncTabs(){
 const emptySeason=$('hubSeasonalEmpty');if(emptySeason)emptySeason.hidden=current!=='encomendas'||!$('seasonalSection')?.hidden;
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
 document.querySelectorAll('#caseirinhoHubTabs [data-hub-target]').forEach(b=>{
  const selected=b.dataset.hubTarget===key;
  b.classList.toggle('is-active',selected);b.setAttribute('aria-pressed',String(selected));
 });
 if(key==='encomendas'&&$('seasonalSection')?.hidden){
  let note=$('hubSeasonalEmpty');
  if(!note){note=document.createElement('section');note.id='hubSeasonalEmpty';note.className='hub-empty hub-seasonal-empty';note.textContent='Estamos preparando o próximo cardápio de encomendas. Confira novamente em breve!';$('caseirinhoShopHub')?.after(note)}
  note.hidden=false;
 }else if($('hubSeasonalEmpty'))$('hubSeasonalEmpty').hidden=true;
 syncTabs();
 if(scroll)window.scrollTo({top:0,behavior:'smooth'});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',shell,{once:true});else shell();
})();