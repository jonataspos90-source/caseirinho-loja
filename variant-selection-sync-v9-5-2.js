(()=>{'use strict';
if(window.__CASEIRINHO_VARIANT_SELECTION_SYNC_952__)return;
window.__CASEIRINHO_VARIANT_SELECTION_SYNC_952__=true;

const CFG=window.CASEIRINHO_CONFIG||{};
const API=String(CFG.apiUrl||'').replace(/\/+$/,'');
const STORE=String(new URLSearchParams(location.search).get('empresa')||new URLSearchParams(location.search).get('loja')||CFG.storeSlug||'caseirinho').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9-]/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'')||'caseirinho';
const S=v=>String(v??'');
const A=v=>Array.isArray(v)?v:[];
const clean=v=>S(v).replace(/\s+/g,' ').trim();
const norm=v=>clean(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase();
let catalog={produtos:[]};
let loading=null;

function images(p){const xs=A(p?.imagens).filter(Boolean);return xs.length?xs:(p?.imagem?[p.imagem]:[])}
function productById(id){return A(catalog.produtos).find(p=>S(p?.id)===S(id))||null}
function displayName(p){
  if(!p)return'';
  const name=clean(p.nome),base=clean(p.gradeNome),label=clean(p.variacaoLabel);
  if(name&&(!base||norm(name)!==norm(base)))return name;
  if(base&&label&&!norm(base).includes(norm(label)))return `${base} · ${label}`;
  return name||base||label||'Produto';
}
function displayDescription(p){return clean(p?.descricao||p?.gradeDescricao||'Produto selecionado da loja.')}
function priceText(p){const n=Number(p?.preco??p?.precoVenda)||0;return n.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}

async function loadCatalog(){
  if(A(catalog.produtos).length)return catalog;
  if(loading)return loading;
  loading=(async()=>{
    try{
      if(!API)return catalog;
      const r=await fetch(API+'/api/v1/public/store/'+encodeURIComponent(STORE)+'/catalog?_sync952='+Date.now(),{cache:'no-store',headers:{'Cache-Control':'no-cache'}});
      if(r.ok){const data=await r.json();if(data&&Array.isArray(data.produtos))catalog=data}
    }catch(err){console.warn('[Caseirinho variant sync 9.5.2] catálogo indisponível',err)}
    finally{loading=null}
    return catalog;
  })();
  return loading;
}

function renderGallery(p){
  const imgs=images(p),main=document.getElementById('galleryMain'),thumbs=document.getElementById('thumbs');
  if(!main||!thumbs)return;
  const render=index=>{
    const src=imgs[index]||'';
    main.innerHTML=src?`<img src="${src.replace(/"/g,'&quot;')}" alt="${displayName(p).replace(/"/g,'&quot;')}"><span class="image-note">Imagem meramente ilustrativa</span>`:'<div class="no-image">🍽️</div>';
    thumbs.innerHTML=imgs.length>1?imgs.map((x,i)=>`<button class="thumb ${i===index?'active':''}" data-sync952-thumb="${i}" type="button"><img src="${S(x).replace(/"/g,'&quot;')}" alt=""></button>`).join(''):'';
    thumbs.querySelectorAll('[data-sync952-thumb]').forEach(b=>b.onclick=()=>render(Number(b.dataset.sync952Thumb)||0));
  };
  render(0);
}

function applyCard(card,id){
  const p=productById(id);if(!card||!p)return;
  card.dataset.selectedProductId=S(id);
  const name=displayName(p),desc=displayDescription(p),img=card.querySelector('.product-pic img');
  const h=card.querySelector('.product-body h3');if(h)h.textContent=name;
  const d=card.querySelector('.product-body .description');if(d)d.textContent=desc;
  const price=card.querySelector('.product-body .price');if(price)price.textContent=priceText(p);
  const src=images(p)[0];if(img&&src){img.src=src;img.alt=name}
  const pic=card.querySelector('.product-pic[data-view]');if(pic)pic.dataset.view=S(id);
  const view=card.querySelector('.view-btn[data-view]');if(view)view.dataset.view=S(id);
}

function applyModal(id){
  const p=productById(id);if(!p)return;
  const name=document.getElementById('modalName');if(name)name.textContent=displayName(p);
  const desc=document.getElementById('modalDescription');if(desc)desc.textContent=displayDescription(p);
  const price=document.getElementById('modalPrice');if(price)price.textContent=priceText(p);
  renderGallery(p);
  document.querySelectorAll('#variantBox [data-variant]').forEach(b=>b.classList.toggle('active',S(b.dataset.variant)===S(id)));
}

function cardFromButton(button){return button?.closest?.('.product-card')||null}
function scheduleModal(id){[0,30,90,180].forEach(ms=>setTimeout(()=>applyModal(id),ms))}

async function boot(){
  await loadCatalog();
  document.addEventListener('click',event=>{
    const cardOption=event.target.closest?.('.card-grade-option[data-product-id]');
    if(cardOption){
      const id=S(cardOption.dataset.productId),card=cardFromButton(cardOption);
      setTimeout(()=>applyCard(card,id),0);
      return;
    }
    const modalOption=event.target.closest?.('#variantBox [data-variant]');
    if(modalOption){scheduleModal(S(modalOption.dataset.variant));return}
    const view=event.target.closest?.('[data-view]');
    if(view&&!event.target.closest?.('#variantBox'))scheduleModal(S(view.dataset.view));
  },true);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
