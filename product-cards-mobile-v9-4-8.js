(()=>{'use strict';
if(window.__CASEIRINHO_PRODUCT_CARDS_948__)return;
window.__CASEIRINHO_PRODUCT_CARDS_948__=true;

const CFG=window.CASEIRINHO_CONFIG||{};
const STORE=String(new URLSearchParams(location.search).get('empresa')||new URLSearchParams(location.search).get('loja')||CFG.storeSlug||'caseirinho').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9-]/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'')||'caseirinho';
const CATALOG_KEY='john_store_'+STORE+'_catalog_v1';
const S=v=>String(v??'');
const N=v=>Number(v)||0;
const A=v=>Array.isArray(v)?v:[];
const norm=v=>S(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toUpperCase().replace(/[\s-]+/g,'_');
const money=v=>N(v).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
let scheduled=false;

function catalog(){try{return JSON.parse(localStorage.getItem(CATALOG_KEY)||'null')||{loja:{},produtos:[]}}catch(_){return{loja:{},produtos:[]}}}
function canBuy(p){if(typeof p?.podeComprar==='boolean')return p.podeComprar;const d=norm(p?.disponibilidadeEfetiva||p?.disponibilidade||'AMBOS');return d==='SOB_ENCOMENDA'||d==='AMBOS'||N(p?.saldoDisponivel)>0}
function images(p){const xs=A(p?.imagens).filter(Boolean);return xs.length?xs:(p?.imagem?[p.imagem]:[])}
function priceOf(p){return N(p?.preco??p?.precoVenda)}
function productById(id){return A(catalog().produtos).find(p=>S(p?.id)===S(id))||null}
function variantsFor(p){if(!p?.gradeId)return[p].filter(Boolean);return A(catalog().produtos).filter(x=>S(x?.gradeId)===S(p.gradeId)).sort((a,b)=>N(a?.variacaoOrdem)-N(b?.variacaoOrdem)||S(a?.variacaoLabel||a?.nome).localeCompare(S(b?.variacaoLabel||b?.nome),'pt-BR'))}
function labelOf(v){return S(v?.variacaoLabel||v?.nome||'Opção')}
function representativeId(card){return card.querySelector('.product-pic[data-view]')?.dataset.view||card.querySelector('.view-btn[data-view]')?.dataset.view||''}
function gradeTitle(p){const t=norm(p?.gradeTipoOpcao||'TAMANHO');return({TAMANHO:'Tamanho',PESO:'Peso',SABOR:'Sabor',RECHEIO:'Recheio',APRESENTACAO:'Apresentação'})[t]||S(p?.gradeTituloOpcao||'Opção')}

function repairImage(card,vars){
  if(card.querySelector('.product-pic img'))return;
  const src=vars.flatMap(images).find(Boolean),pic=card.querySelector('.product-pic');
  if(!src||!pic)return;
  const img=document.createElement('img');img.src=src;img.alt=card.querySelector('h3')?.textContent||'Produto';img.loading='lazy';
  pic.querySelector('.no-image')?.replaceWith(img);
  if(!pic.querySelector('img'))pic.prepend(img);
  if(!pic.querySelector('.image-note')){const n=document.createElement('span');n.className='image-note';n.textContent='Imagem meramente ilustrativa';pic.appendChild(n)}
}
function setSelected(card,id){
  const p=productById(id);if(!p)return;
  card.dataset.selectedProductId=S(id);
  card.querySelectorAll('.card-grade-option').forEach(b=>b.classList.toggle('active',S(b.dataset.productId)===S(id)));
  const price=card.querySelector('.price');if(price)price.textContent=money(priceOf(p));
  const add=card.querySelector('.card-add-selected');
  if(add){add.dataset.productId=S(id);add.disabled=!canBuy(p)||catalog().loja?.ativo===false;add.textContent=add.disabled?'Indisponível':'+ Adicionar ao carrinho'}
}
function openAndAdd(card,id){
  const trigger=card.querySelector('.view-btn[data-view]')||card.querySelector('.product-pic[data-view]');
  if(!trigger)return;
  trigger.click();
  requestAnimationFrame(()=>requestAnimationFrame(()=>{
    const variant=[...document.querySelectorAll('#variantBox [data-variant]')].find(b=>S(b.dataset.variant)===S(id));
    if(variant&&!variant.disabled)variant.click();
    requestAnimationFrame(()=>requestAnimationFrame(()=>{
      const add=document.getElementById('modalAdd');
      if(add&&!add.disabled){add.click();document.getElementById('productClose')?.click()}
    }));
  }));
}
function enhanceCard(card){
  if(card.dataset.cardUi948==='single'||card.dataset.cardUi948==='grade')return;
  const id=representativeId(card),p=productById(id);if(!id||!p)return;
  const vars=variantsFor(p);if(!vars.length)return;
  const actions=card.querySelector('.actions');if(!actions)return;

  repairImage(card,vars);
  const h3=card.querySelector('.product-body h3');if(h3)h3.textContent=S(vars.length>1?(p.gradeNome||p.nome):p.nome)||h3.textContent;
  const existingAdd=actions.querySelector('.add-btn:not(.card-add-selected)');if(existingAdd&&existingAdd.textContent!=='+ Adicionar ao carrinho')existingAdd.textContent='+ Adicionar ao carrinho';

  if(vars.length<=1){card.dataset.cardUi948='single';return}
  card.querySelector('.variant-summary')?.remove();

  const panel=document.createElement('div');panel.className='card-grade-panel';
  const title=document.createElement('div');title.className='card-grade-title';title.textContent='Escolha '+gradeTitle(p).toLowerCase()+' e veja o valor';
  const opts=document.createElement('div');opts.className='card-grade-options';
  for(const v of vars){
    const b=document.createElement('button');b.type='button';b.className='card-grade-option';b.dataset.productId=S(v.id);b.disabled=!canBuy(v);
    const name=document.createElement('span');name.textContent=labelOf(v);
    const price=document.createElement('strong');price.textContent=money(priceOf(v));
    b.append(name,price);
    b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();setSelected(card,v.id)});
    opts.appendChild(b);
  }
  panel.append(title,opts);
  const availability=card.querySelector('.availability');if(availability)availability.before(panel);else actions.before(panel);

  const add=document.createElement('button');add.type='button';add.className='add-btn card-add-selected';add.textContent='+ Adicionar ao carrinho';
  add.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();const selected=card.dataset.selectedProductId||add.dataset.productId;if(selected)openAndAdd(card,selected)});
  actions.appendChild(add);

  const preferred=vars.find(v=>S(v.id)===S(p.id)&&canBuy(v))||vars.find(canBuy)||vars[0];
  setSelected(card,preferred.id);
  card.dataset.cardUi948='grade';
}
function enhanceAll(){scheduled=false;document.querySelectorAll('#products .product-card,#featured .product-card').forEach(enhanceCard)}
function schedule(){if(scheduled)return;scheduled=true;queueMicrotask(enhanceAll)}
function boot(){
  schedule();
  const roots=[document.getElementById('products'),document.getElementById('featured')].filter(Boolean);
  const mo=new MutationObserver(records=>{if(records.some(r=>r.addedNodes.length||r.removedNodes.length))schedule()});
  roots.forEach(r=>mo.observe(r,{childList:true}));
  window.addEventListener('storage',e=>{if(e.key===CATALOG_KEY)schedule()});
  [250,750,1600].forEach(ms=>setTimeout(schedule,ms));
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
window.CaseirinhoProductCards948={version:'9.4.8-fix1',enhanceAll};
})();