(()=>{'use strict';
if(window.__CASEIRINHO_PRODUCT_CARDS_950__)return;
window.__CASEIRINHO_PRODUCT_CARDS_950__=true;

const CFG=window.CASEIRINHO_CONFIG||{};
const API=String(CFG.apiUrl||'').replace(/\/+$/,'');
const STORE=String(new URLSearchParams(location.search).get('empresa')||new URLSearchParams(location.search).get('loja')||CFG.storeSlug||'caseirinho').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9-]/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'')||'caseirinho';
const CART_KEY='john_store_'+STORE+'_cart_v1';
const S=v=>String(v??'');
const N=v=>Number(v)||0;
const A=v=>Array.isArray(v)?v:[];
const norm=v=>S(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toUpperCase().replace(/[\s-]+/g,'_');
const money=v=>N(v).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const clean=v=>S(v).replace(/\s+/g,' ').replace(/^[\s·|,:;\-–—/]+|[\s·|,:;\-–—/]+$/g,'').trim();
let remoteCatalog={loja:{},produtos:[]};
let catalogLoad=null;
let raf=0;
let cardObserver=null;
let modalObserver=null;
let cartObserver=null;
let refreshTimer=0;
let explicitModalVariant='';

function catalog(){return remoteCatalog}
async function loadRemoteCatalog(force=false){
  if(!API)return remoteCatalog;
  if(catalogLoad&&!force)return catalogLoad;
  catalogLoad=(async()=>{
    try{
      const url=API+'/api/v1/public/store/'+encodeURIComponent(STORE)+'/catalog?_cards='+Date.now();
      const r=await fetch(url,{cache:'no-store',headers:{'Cache-Control':'no-cache'}});
      if(!r.ok)throw new Error('HTTP '+r.status);
      const data=await r.json();
      if(data&&Array.isArray(data.produtos))remoteCatalog=data;
    }catch(err){
      console.warn('[Caseirinho cards 9.5.0] catálogo auxiliar indisponível',err);
    }finally{catalogLoad=null}
    schedule();
    enhanceModal();
    enhanceCart();
    return remoteCatalog;
  })();
  return catalogLoad;
}
function canBuy(p){
  if(typeof p?.podeComprar==='boolean')return p.podeComprar;
  const d=norm(p?.disponibilidadeEfetiva||p?.disponibilidade||'AMBOS');
  return d==='SOB_ENCOMENDA'||d==='AMBOS'||N(p?.saldoDisponivel)>0;
}
function promoApi(){return window.CaseirinhoPromotions}
function isPromotion(p){return !!promoApi()?.isFeatured(p,catalog().produtos)}
function priceOf(p){return N(promoApi()?.priceInfo(p,catalog().produtos)?.current??p?.preco??p?.precoVenda)}
function priceMarkup(p){const x=promoApi()?.priceInfo(p,catalog().produtos);if(x&&x.current<x.regular)return '<span style="font-size:.8em;color:#64748b">De </span><s style="color:#64748b;font-size:.82em">'+money(x.regular)+'</s> <strong style="color:#15803d">Por '+money(x.current)+'</strong>';return money(priceOf(p))}
function images(p){const xs=A(p?.imagens).filter(Boolean);return xs.length?xs:(p?.imagem?[p.imagem]:[])}
function productById(id){return A(catalog().produtos).find(p=>S(p?.id)===S(id))||null}
function variantsFor(p){
  if(!p?.gradeId)return[p].filter(Boolean);
  if(isPromotion(p))return[p];
  const variants=A(catalog().produtos).filter(x=>S(x?.gradeId)===S(p.gradeId)&&!isPromotion(x)).sort((a,b)=>N(a?.variacaoOrdem)-N(b?.variacaoOrdem)||S(a?.variacaoLabel||a?.nome).localeCompare(S(b?.variacaoLabel||b?.nome),'pt-BR'));
  return variants.length?variants:[p];
}
function representativeId(card){return card.querySelector('.product-pic[data-view]')?.dataset.view||card.querySelector('.view-btn[data-view]')?.dataset.view||''}
function primaryLabel(v){return clean(v?.variacaoLabel||v?.nome||'Opção')||'Opção'}
function stripPart(text,part){
  text=S(text);part=clean(part);if(!part)return text;
  const i=norm(text).indexOf(norm(part));
  if(i<0)return text;
  const before=text.slice(0,i),after=text.slice(i+part.length);
  return before+' '+after;
}
function detailFromDescription(v){
  const d=clean(v?.descricao||'');if(!d)return'';
  const patterns=[
    /(?:recheio|sabor)\s*(?:de|:|-)?\s*([^.;,]+)/i,
    /(?:com)\s+([^.;,]+?)(?:\s+(?:de|com)\s+\d|$)/i
  ];
  for(const rx of patterns){const m=d.match(rx);if(m&&clean(m[1]).length>2)return clean(m[1])}
  return'';
}
function contextualLabel(v,base,primary){
  const direct=clean(v?.sabor||v?.recheio||v?.variacaoSabor||v?.opcaoSabor||v?.descricaoVariacao||'');
  if(direct)return direct;
  let name=clean(v?.nome||'');
  name=clean(stripPart(name,base));
  name=clean(stripPart(name,primary));
  if(name&&norm(name)!==norm(primary)&&!/^\d+(?:[.,]\d+)?\s*(?:KG|G|ML|L|UN|UNIDADE|UNIDADES)$/i.test(name))return name;
  return detailFromDescription(v);
}
function gradeMeta(p,vars=variantsFor(p)){
  const g=A(catalog().loja?.grades).find(x=>S(x?.id)===S(p?.gradeId))||{};
  const type=norm(p?.gradeTipoOpcao||g?.tipoOpcao||'TAMANHO');
  const map={TAMANHO:['Tamanho','Tamanhos','📏'],SABOR:['Sabor','Sabores','😋'],RECHEIO:['Recheio','Recheios','🥟'],PESO:['Peso','Pesos','⚖️'],APRESENTACAO:['Apresentação','Apresentações','📦']};
  const m=map[type]||['Opção','Opções','✨'];
  const base=clean(p?.gradeNome||g?.nome||p?.nome||'');
  const primaries=vars.map(primaryLabel);
  const counts=new Map();primaries.forEach(x=>counts.set(norm(x),(counts.get(norm(x))||0)+1));
  const contexts=vars.map((v,i)=>contextualLabel(v,base,primaries[i]));
  const duplicatePrimary=primaries.some(x=>(counts.get(norm(x))||0)>1);
  const distinctContexts=[...new Set(contexts.map(norm).filter(Boolean))];
  const hasSecondDimension=duplicatePrimary&&distinctContexts.length>1;
  let title=clean(p?.gradeTituloOpcao||g?.tituloOpcao||m[0])||m[0];
  let plural=clean(p?.gradePluralOpcao||g?.pluralOpcao||m[1])||m[1];
  let icon=m[2];
  if(hasSecondDimension){
    if(type==='PESO'){title='Sabor e peso';plural='Sabores e pesos';icon='😋'}
    else if(type==='TAMANHO'){title='Sabor e tamanho';plural='Sabores e tamanhos';icon='😋'}
    else if(type==='SABOR'||type==='RECHEIO'){title='Sabor e opção';plural='Sabores e opções';icon='😋'}
    else{title='Opção';plural='Opções';icon='✨'}
  }
  return{title,plural,icon,type,base,primaries,contexts,counts,hasSecondDimension};
}
function optionLabel(v,p,vars,meta=gradeMeta(p,vars)){
  const primary=primaryLabel(v);
  if(!meta.hasSecondDimension)return primary;
  const i=vars.findIndex(x=>S(x?.id)===S(v?.id));
  const ctx=clean(meta.contexts[i]||contextualLabel(v,meta.base,primary));
  if(ctx&&norm(ctx)!==norm(primary))return `${ctx} · ${primary}`;
  const full=clean(v?.nome||'');
  return full&&norm(full)!==norm(meta.base)?full:primary;
}
function cartProductName(p){
  if(!p)return'';
  if(!p.gradeId)return clean(p.nome);
  const vars=variantsFor(p),meta=gradeMeta(p,vars),label=optionLabel(p,p,vars,meta),base=clean(p.gradeNome||meta.base||p.nome);
  return base&&norm(label).indexOf(norm(base))<0?`${base} · ${label}`:label;
}
function repairImage(card,vars){
  if(card.querySelector('.product-pic img'))return;
  let src='';for(const v of vars){src=images(v)[0]||'';if(src)break}
  if(!src)return;
  const pic=card.querySelector('.product-pic');if(!pic)return;
  const img=document.createElement('img');img.src=src;img.alt=card.querySelector('h3')?.textContent||'Produto';img.loading='lazy';
  const old=pic.querySelector('.no-image');if(old)old.replaceWith(img);else pic.prepend(img);
  if(!pic.querySelector('.image-note')){const note=document.createElement('span');note.className='image-note';note.textContent='Imagem meramente ilustrativa';pic.appendChild(note)}
}
function resetCardSelection(card,p,vars,meta){
  delete card.dataset.selectedProductId;
  card.querySelectorAll('.card-grade-option').forEach(b=>b.classList.remove('active'));
  const prices=vars.map(priceOf).filter(v=>v>=0),min=prices.length?Math.min(...prices):priceOf(p);
  const price=card.querySelector('.price');if(price)price.textContent=(vars.length>1?'A partir de ':'')+money(min);
  const selected=card.querySelector('.card-selected-choice');if(selected)selected.textContent='Nenhuma opção selecionada';
  const add=card.querySelector('.card-add-selected');if(add){add.disabled=true;add.textContent='Escolha uma opção'}
  const desc=card.querySelector('.description');
  if(desc&&meta.hasSecondDimension)desc.textContent=`Escolha abaixo ${meta.title.toLowerCase()} para saber exatamente o que irá no pedido.`;
}
function setSelected(card,id,p,vars,meta){
  const selectedProduct=productById(id);if(!selectedProduct)return;
  card.dataset.selectedProductId=S(id);
  card.querySelectorAll('.card-grade-option').forEach(b=>b.classList.toggle('active',S(b.dataset.productId)===S(id)));
  const price=card.querySelector('.price');if(price)price.innerHTML=priceMarkup(selectedProduct);
  const selected=card.querySelector('.card-selected-choice');if(selected)selected.textContent='Selecionado: '+optionLabel(selectedProduct,p,vars,meta);
  const add=card.querySelector('.card-add-selected');
  if(add){add.dataset.productId=S(id);add.disabled=!canBuy(selectedProduct)||catalog().loja?.ativo===false;add.textContent=add.disabled?'Indisponível':'+ Adicionar ao carrinho'}
  const src=images(selectedProduct)[0],img=card.querySelector('.product-pic img');if(src&&img)img.src=src;
}
function addSelectedThroughExistingFlow(card,id){
  const trigger=card.querySelector('.view-btn[data-view]')||card.querySelector('.product-pic[data-view]');
  if(!trigger)return;
  trigger.click();
  setTimeout(()=>{
    const variant=[...document.querySelectorAll('#variantBox [data-variant]')].find(b=>S(b.dataset.variant)===S(id));
    if(variant&&!variant.disabled)variant.click();
    setTimeout(()=>{const add=document.getElementById('modalAdd');if(add&&!add.disabled){add.click();document.getElementById('productClose')?.click()}},70);
  },70);
}
function enhanceCard(card){
  if(!card||card.dataset.cardUi950==='done'||card.dataset.cardUi950==='working')return false;
  const id=representativeId(card);if(!id)return false;
  const p=productById(id);if(!p)return false;
  const vars=variantsFor(p);if(!vars.length)return false;
  card.dataset.cardUi950='working';
  try{
    repairImage(card,vars);
    const body=card.querySelector('.product-body'),actions=card.querySelector('.actions');
    if(!body||!actions){card.dataset.cardUi950='done';return true}
    const title=body.querySelector('h3');if(title&&vars.length>1)title.textContent=clean(p.gradeNome||p.nome)||title.textContent;
    if(vars.length===1){const existingAdd=actions.querySelector('.add-btn');if(existingAdd&&existingAdd.textContent.trim()==='+ Carrinho')existingAdd.textContent='+ Adicionar ao carrinho';card.dataset.cardUi950='done';return true}
    const meta=gradeMeta(p,vars);
    body.querySelector('.variant-summary')?.remove();
    body.querySelector('.card-grade-panel')?.remove();
    body.querySelector('.card-selected-choice')?.remove();
    const panel=document.createElement('div');panel.className='card-grade-panel';
    const heading=document.createElement('div');heading.className='card-grade-title';heading.textContent=meta.icon+' Escolha '+meta.title.toLowerCase();
    const options=document.createElement('div');options.className='card-grade-options';
    vars.forEach(v=>{
      const b=document.createElement('button');b.type='button';b.className='card-grade-option';b.dataset.productId=S(v.id);b.disabled=!canBuy(v);
      const name=document.createElement('span');name.textContent=optionLabel(v,p,vars,meta);
      const price=document.createElement('strong');price.textContent=money(priceOf(v));
      b.append(name,price);
      b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();setSelected(card,v.id,p,vars,meta)});
      options.appendChild(b);
    });
    panel.append(heading,options);
    const selected=document.createElement('div');selected.className='card-selected-choice';selected.textContent='Nenhuma opção selecionada';panel.appendChild(selected);
    const availability=body.querySelector('.availability');if(availability)availability.before(panel);else actions.before(panel);
    actions.querySelector('.card-add-selected')?.remove();
    const add=document.createElement('button');add.type='button';add.className='add-btn card-add-selected';add.disabled=true;add.textContent='Escolha uma opção';
    add.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();const selectedId=card.dataset.selectedProductId;if(selectedId)addSelectedThroughExistingFlow(card,selectedId)});
    actions.appendChild(add);
    const view=actions.querySelector('.view-btn');if(view)view.textContent='Ver detalhes / fotos';
    resetCardSelection(card,p,vars,meta);
    card.dataset.cardUi950='done';
    return true;
  }catch(err){console.warn('[Caseirinho cards 9.5.0]',err);delete card.dataset.cardUi950;return false}
}
function enhanceAll(){
  raf=0;if(!A(catalog().produtos).length)return;
  document.querySelectorAll('#products>.product-card,#featured>.product-card').forEach(enhanceCard);
}
function schedule(){if(raf)return;raf=requestAnimationFrame(enhanceAll)}
function refreshCatalogSoon(){clearTimeout(refreshTimer);refreshTimer=setTimeout(()=>loadRemoteCatalog(true),120)}
function enhanceModal(){
  if(!A(catalog().produtos).length)return;
  const box=document.getElementById('variantBox'),add=document.getElementById('modalAdd'),price=document.getElementById('modalPrice');
  if(!box||!add)return;
  const buttons=[...box.querySelectorAll('[data-variant]')];if(buttons.length<2)return;
  const vars=buttons.map(b=>productById(b.dataset.variant)).filter(Boolean);if(vars.length<2)return;
  const p=vars[0],meta=gradeMeta(p,vars);
  const title=box.querySelector('.variant-title');if(title)title.textContent=meta.icon+' Escolha '+meta.title.toLowerCase();
  buttons.forEach(b=>{const v=productById(b.dataset.variant),span=b.querySelector('span');if(v&&span)span.textContent=optionLabel(v,p,vars,meta)});
  const explicit=vars.find(v=>S(v.id)===S(explicitModalVariant));
  if(!explicit){
    buttons.forEach(b=>b.classList.remove('active'));
    const prices=vars.map(priceOf),min=Math.min(...prices);if(price)price.textContent='A partir de '+money(min);
    add.disabled=true;add.textContent='Escolha uma opção';
    const d=document.getElementById('modalDescription');if(d&&meta.hasSecondDimension)d.textContent=`Escolha ${meta.title.toLowerCase()} abaixo. O item selecionado ficará destacado antes de adicionar ao carrinho.`;
  }else{
    buttons.forEach(b=>b.classList.toggle('active',S(b.dataset.variant)===S(explicit.id)));
    if(price)price.innerHTML=priceMarkup(explicit);
    add.disabled=!canBuy(explicit)||catalog().loja?.ativo===false;add.textContent=add.disabled?'Indisponível no momento':'Adicionar ao carrinho';
    const d=document.getElementById('modalDescription');if(d)d.textContent=clean(explicit.descricao||'Produto selecionado da loja.');
  }
}
function enhanceCart(){
  if(!A(catalog().produtos).length)return;
  let items=[];try{items=JSON.parse(localStorage.getItem(CART_KEY)||'[]')}catch(_){}
  const rows=[...document.querySelectorAll('#cartItems>.cart-item')];
  rows.forEach((row,i)=>{const p=productById(items[i]?.produtoId),h=row.querySelector('h4');if(p&&h)h.textContent=cartProductName(p)});
}
function boot(){
  const roots=[document.getElementById('products'),document.getElementById('featured')].filter(Boolean);
  cardObserver=new MutationObserver(m=>{if(m.some(x=>x.addedNodes.length||x.removedNodes.length)){schedule();if(!A(catalog().produtos).length)refreshCatalogSoon()}});
  roots.forEach(r=>cardObserver.observe(r,{childList:true}));
  const box=document.getElementById('variantBox');if(box){modalObserver=new MutationObserver(()=>setTimeout(enhanceModal,0));modalObserver.observe(box,{childList:true})}
  const cart=document.getElementById('cartItems');if(cart){cartObserver=new MutationObserver(()=>setTimeout(enhanceCart,0));cartObserver.observe(cart,{childList:true})}
  document.addEventListener('click',e=>{
    const variant=e.target.closest?.('#variantBox [data-variant]');
    if(variant){explicitModalVariant=S(variant.dataset.variant);setTimeout(enhanceModal,0);return}
    const view=e.target.closest?.('[data-view]');if(view&&!e.target.closest?.('#variantBox')){explicitModalVariant='';setTimeout(enhanceModal,0)}
  },true);
  loadRemoteCatalog();schedule();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
window.CaseirinhoProductCards950={version:'9.5.0',enhanceAll,enhanceModal,enhanceCart,loadRemoteCatalog};
})();