(()=>{'use strict';
if(window.__CASEIRINHO_PRODUCT_CARDS_949__)return;
window.__CASEIRINHO_PRODUCT_CARDS_949__=true;

const CFG=window.CASEIRINHO_CONFIG||{};
const STORE=String(new URLSearchParams(location.search).get('empresa')||new URLSearchParams(location.search).get('loja')||CFG.storeSlug||'caseirinho').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9-]/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'')||'caseirinho';
const CATALOG_KEY='john_store_'+STORE+'_catalog_v1';
const S=v=>String(v??'');
const N=v=>Number(v)||0;
const A=v=>Array.isArray(v)?v:[];
const norm=v=>S(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toUpperCase().replace(/[\s-]+/g,'_');
const money=v=>N(v).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
let raf=0;
let observer=null;
let retries=0;

function catalog(){
  try{return JSON.parse(localStorage.getItem(CATALOG_KEY)||'null')||{loja:{},produtos:[]}}catch(_){return{loja:{},produtos:[]}}
}
function canBuy(p){
  if(typeof p?.podeComprar==='boolean')return p.podeComprar;
  const d=norm(p?.disponibilidadeEfetiva||p?.disponibilidade||'AMBOS');
  return d==='SOB_ENCOMENDA'||d==='AMBOS'||N(p?.saldoDisponivel)>0;
}
function priceOf(p){return N(p?.preco??p?.precoVenda)}
function images(p){const xs=A(p?.imagens).filter(Boolean);return xs.length?xs:(p?.imagem?[p.imagem]:[])}
function productById(id){return A(catalog().produtos).find(p=>S(p?.id)===S(id))||null}
function variantsFor(p){
  if(!p?.gradeId)return[p].filter(Boolean);
  return A(catalog().produtos).filter(x=>S(x?.gradeId)===S(p.gradeId)).sort((a,b)=>N(a?.variacaoOrdem)-N(b?.variacaoOrdem)||S(a?.variacaoLabel||a?.nome).localeCompare(S(b?.variacaoLabel||b?.nome),'pt-BR'));
}
function representativeId(card){return card.querySelector('.product-pic[data-view]')?.dataset.view||card.querySelector('.view-btn[data-view]')?.dataset.view||''}
function labelOf(v){return S(v?.variacaoLabel||v?.nome||'Opção')}
function gradeTitle(p){
  const t=norm(p?.gradeTipoOpcao||'TAMANHO');
  return ({TAMANHO:'Tamanho',PESO:'Peso',SABOR:'Sabor',RECHEIO:'Recheio',APRESENTACAO:'Apresentação'})[t]||S(p?.gradeTituloOpcao||'Opção');
}
function repairImage(card,vars){
  if(card.querySelector('.product-pic img'))return;
  let src='';
  for(const v of vars){src=images(v)[0]||'';if(src)break}
  if(!src)return;
  const pic=card.querySelector('.product-pic');if(!pic)return;
  const old=pic.querySelector('.no-image');
  const img=document.createElement('img');img.src=src;img.alt=card.querySelector('h3')?.textContent||'Produto';img.loading='lazy';
  if(old)old.replaceWith(img);else pic.prepend(img);
  if(!pic.querySelector('.image-note')){
    const note=document.createElement('span');note.className='image-note';note.textContent='Imagem meramente ilustrativa';pic.appendChild(note);
  }
}
function setSelected(card,id){
  const p=productById(id);if(!p)return;
  card.dataset.selectedProductId=S(id);
  card.querySelectorAll('.card-grade-option').forEach(b=>b.classList.toggle('active',S(b.dataset.productId)===S(id)));
  const price=card.querySelector('.price');if(price)price.textContent=money(priceOf(p));
  const add=card.querySelector('.card-add-selected');
  if(add){
    add.dataset.productId=S(id);
    add.disabled=!canBuy(p)||catalog().loja?.ativo===false;
    add.textContent=add.disabled?'Indisponível':'+ Adicionar ao carrinho';
  }
}
function addSelectedThroughExistingFlow(card,id){
  const trigger=card.querySelector('.view-btn[data-view]')||card.querySelector('.product-pic[data-view]');
  if(!trigger)return;
  trigger.click();
  setTimeout(()=>{
    const variant=[...document.querySelectorAll('#variantBox [data-variant]')].find(b=>S(b.dataset.variant)===S(id));
    if(variant&&!variant.disabled)variant.click();
    setTimeout(()=>{
      const add=document.getElementById('modalAdd');
      if(add&&!add.disabled){
        add.click();
        document.getElementById('productClose')?.click();
      }
    },30);
  },30);
}
function enhanceCard(card){
  if(!card||card.dataset.cardUi949==='done'||card.dataset.cardUi949==='working')return false;
  const id=representativeId(card);if(!id)return false;
  const p=productById(id);if(!p)return false;
  const vars=variantsFor(p);if(!vars.length)return false;

  // Marca antes de alterar o DOM: as próprias alterações não podem causar novo processamento.
  card.dataset.cardUi949='working';
  try{
    repairImage(card,vars);
    const body=card.querySelector('.product-body');
    const actions=card.querySelector('.actions');
    if(!body||!actions){card.dataset.cardUi949='done';return true}

    const title=body.querySelector('h3');
    if(title&&vars.length>1)title.textContent=S(p.gradeNome||p.nome)||title.textContent;

    if(vars.length===1){
      const existingAdd=actions.querySelector('.add-btn');
      if(existingAdd&&existingAdd.textContent.trim()==='+ Carrinho')existingAdd.textContent='+ Adicionar ao carrinho';
      card.dataset.cardUi949='done';
      return true;
    }

    body.querySelector('.variant-summary')?.remove();
    let panel=body.querySelector('.card-grade-panel');
    if(!panel){
      panel=document.createElement('div');panel.className='card-grade-panel';
      const heading=document.createElement('div');heading.className='card-grade-title';heading.textContent='Escolha '+gradeTitle(p).toLowerCase()+' e veja o valor';
      const options=document.createElement('div');options.className='card-grade-options';
      vars.forEach(v=>{
        const b=document.createElement('button');b.type='button';b.className='card-grade-option';b.dataset.productId=S(v.id);b.disabled=!canBuy(v);
        const name=document.createElement('span');name.textContent=labelOf(v);
        const price=document.createElement('strong');price.textContent=money(priceOf(v));
        b.append(name,price);
        b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();setSelected(card,v.id)});
        options.appendChild(b);
      });
      panel.append(heading,options);
      const availability=body.querySelector('.availability');
      if(availability)availability.before(panel);else actions.before(panel);
    }

    let add=actions.querySelector('.card-add-selected');
    if(!add){
      add=document.createElement('button');add.type='button';add.className='add-btn card-add-selected';add.textContent='+ Adicionar ao carrinho';
      add.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();const selected=card.dataset.selectedProductId||add.dataset.productId;if(selected)addSelectedThroughExistingFlow(card,selected)});
      actions.appendChild(add);
    }

    const preferred=vars.find(v=>S(v.id)===S(p.id)&&canBuy(v))||vars.find(canBuy)||vars[0];
    setSelected(card,preferred.id);
    card.dataset.cardUi949='done';
    return true;
  }catch(err){
    console.warn('[Caseirinho cards 9.4.9]',err);
    card.dataset.cardUi949='error';
    return false;
  }
}
function enhanceAll(){
  raf=0;
  document.querySelectorAll('#products .product-card,#featured .product-card').forEach(enhanceCard);
}
function schedule(){
  if(raf)return;
  raf=requestAnimationFrame(enhanceAll);
}
function boot(){
  const roots=[document.getElementById('products'),document.getElementById('featured')].filter(Boolean);
  observer=new MutationObserver(mutations=>{
    if(mutations.some(m=>[...m.addedNodes].some(n=>n.nodeType===1)))schedule();
  });
  roots.forEach(r=>observer.observe(r,{childList:true,subtree:true}));
  schedule();
  // Tenta novamente por alguns segundos enquanto o app termina de carregar o catálogo.
  const timer=setInterval(()=>{
    schedule();retries++;
    if(retries>=20||document.querySelectorAll('#products .product-card,#featured .product-card').length>0)clearInterval(timer);
  },300);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
window.CaseirinhoProductCards949={version:'9.4.9',enhanceAll};
})();