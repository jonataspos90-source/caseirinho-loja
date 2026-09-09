(function(){
'use strict';
if(window.__CASEIRINHO_HOTFIX_8104__) return;
window.__CASEIRINHO_HOTFIX_8104__ = true;

const VERSION='8.10.4';
const BASE='./storefront-hotfix-v8-10-3.js?v=20260909';
const E=id=>document.getElementById(id);
const S=v=>String(v??'');
const N=v=>Number(v)||0;
const A=v=>Array.isArray(v)?v:[];
let currentProductId='';
let scheduled=false;

function ensureBaseHotfix(){
  if(window.__CASEIRINHO_HOTFIX_8103__) return;
  if(document.querySelector('script[data-case-base-8103]')) return;
  const s=document.createElement('script');
  s.src=BASE;
  s.async=false;
  s.dataset.caseBase8103='1';
  s.onerror=()=>console.warn('[Caseirinho Loja] não foi possível recarregar a base V8.10.3; V8.10.4 permanece ativa.');
  document.head.appendChild(s);
}

function installStyle(){
  if(E('case-v8104-cleanup-style')) return;
  const s=document.createElement('style');
  s.id='case-v8104-cleanup-style';
  s.textContent=`
    /* Estado indisponível precisa parecer indisponível, não um botão ativo. */
    #productModal #modalAdd:disabled,
    #productModal #modalAdd.case-v8104-disabled,
    #products .add:disabled{
      opacity:.42!important;
      filter:grayscale(.35)!important;
      cursor:not-allowed!important;
      pointer-events:none!important;
      box-shadow:none!important;
      background:#a8afbd!important;
      color:#fff!important;
    }
    #productModal #modalQty:disabled{
      opacity:.55!important;
      cursor:not-allowed!important;
      background:#f1f5f9!important;
    }
    #productModal #modalAvail.case-v8104-unavailable,
    #products .availability.case-v8104-unavailable{
      color:#b4233c!important;
      font-weight:900!important;
    }
    #productModal #modalAvail.case-v8104-available,
    #products .availability.case-v8104-available{
      color:#24a56a!important;
    }
  `;
  document.head.appendChild(s);
}

/*
  O index atual possui separadores órfãos entre blocos de versões antigas.
  Em alguns caches eles aparecem no rodapé como: \n\n\n\n
  Removemos SOMENTE nós de texto diretos do <body> compostos por escapes,
  sem tocar em textos de produto, scripts, estilos, pedidos ou dados locais.
*/
function removeOrphanEscapeText(){
  try{
    if(!document.body) return;
    [...document.body.childNodes].forEach(n=>{
      if(n.nodeType!==Node.TEXT_NODE) return;
      const raw=S(n.nodeValue);
      const compact=raw.replace(/\s+/g,'');
      if(!compact || compact.length>80) return;
      if(/^(?:\\[nrt]|\\)+$/.test(compact)){
        n.nodeValue='';
      }
    });
  }catch(_){}
}

function removeOldLeakedSource(){
  /* Mantém também a proteção da V8.10.3 contra HTML/JS vazado por cache antigo. */
  try{
    const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
    const bad=[];
    let n;
    while((n=walker.nextNode())){
      const t=S(n.nodeValue);
      const parent=n.parentElement?.tagName||'';
      if(['SCRIPT','STYLE','PRE','TEXTAREA','CODE'].includes(parent)) continue;
      if(
        (t.includes("w.document.close()}") && t.includes("function enhanceSuccess")) ||
        (t.includes("caseV83Overlay") && t.includes("caseV83CartCount") && t.length>250)
      ) bad.push(n);
    }
    bad.forEach(n=>{n.nodeValue='';});
  }catch(_){}
}

function catalog(){
  try{
    return window.__caseirinhoCatalog ||
      JSON.parse(localStorage.getItem('john_ecommerce_public_v1')||'{}') || {};
  }catch(_){
    return window.__caseirinhoCatalog || {};
  }
}

function productById(id){
  return A(catalog()?.produtos).find(p=>S(p?.id)===S(id));
}

function productAvailable(p){
  if(!p || p.ativo===false) return false;
  const d=S(p.disponibilidade).trim().toUpperCase();
  return d==='SOB_ENCOMENDA' || d==='AMBOS' || N(p.saldoDisponivel)>0;
}

function selectedProductId(){
  const active=E('caseV88VariantPicker')?.querySelector('[data-v88-variant].active');
  return S(active?.dataset?.v88Variant || currentProductId);
}

function cleanZeroDay(el){
  if(!el) return;
  const t=S(el.textContent);
  if(/sob encomenda\s*[·\-–—]\s*0\s*dia\(s\)/i.test(t)){
    el.textContent=t.replace(/\s*[·\-–—]\s*0\s*dia\(s\)/i,'').trim();
  }
}

function syncCardAvailability(){
  document.querySelectorAll('#products .availability').forEach(el=>{
    cleanZeroDay(el);
    const unavailable=/indispon[ií]vel/i.test(S(el.textContent));
    el.classList.toggle('case-v8104-unavailable',unavailable);
    el.classList.toggle('case-v8104-available',!unavailable);
  });
}

function syncModalAvailability(){
  const modal=E('productModal');
  const add=E('modalAdd');
  const qty=E('modalQty');
  const avail=E('modalAvail');
  if(!modal || !add || !avail) return;

  const id=selectedProductId();
  const p=productById(id);
  if(!p){
    cleanZeroDay(avail);
    return;
  }

  const storeOn=catalog()?.loja?.ativo!==false;
  const ok=storeOn && productAvailable(p);
  const unavailable=!ok;

  add.disabled=unavailable;
  add.setAttribute('aria-disabled',unavailable?'true':'false');
  add.classList.toggle('case-v8104-disabled',unavailable);
  add.textContent=unavailable
    ? (storeOn?'Indisponível no momento':'Loja indisponível')
    : 'Adicionar ao carrinho';

  if(qty){
    qty.disabled=unavailable;
    qty.setAttribute('aria-disabled',unavailable?'true':'false');
  }

  if(!productAvailable(p) && storeOn){
    avail.textContent='Indisponível no momento';
  }else{
    cleanZeroDay(avail);
  }

  avail.classList.toggle('case-v8104-unavailable',unavailable);
  avail.classList.toggle('case-v8104-available',!unavailable);
}

function captureProduct(ev){
  const target=ev.target instanceof Element ? ev.target : null;
  if(!target) return;

  const variant=target.closest('[data-v88-variant]');
  if(variant?.dataset?.v88Variant){
    currentProductId=S(variant.dataset.v88Variant);
    scheduleSync();
    return;
  }

  const view=target.closest('[data-view]');
  if(view?.dataset?.view){
    currentProductId=S(view.dataset.view);
    scheduleSync();
  }
}

function scheduleSync(){
  if(scheduled) return;
  scheduled=true;
  requestAnimationFrame(()=>{
    scheduled=false;
    removeOrphanEscapeText();
    removeOldLeakedSource();
    syncCardAvailability();
    syncModalAvailability();
  });
}

function normalizeTitle(){
  const current=S(document.title);
  if(/V\d+\.\d+(?:\.\d+)?/i.test(current)){
    document.title=current.replace(/V\d+\.\d+(?:\.\d+)?/i,'V'+VERSION);
  }
}

function init(){
  ensureBaseHotfix();
  installStyle();
  normalizeTitle();
  removeOrphanEscapeText();
  removeOldLeakedSource();
  syncCardAvailability();
  syncModalAvailability();

  document.addEventListener('pointerdown',captureProduct,true);
  document.addEventListener('click',captureProduct,true);

  const modal=E('productModal');
  if(modal){
    new MutationObserver(scheduleSync).observe(modal,{
      childList:true,
      subtree:true,
      attributes:true,
      attributeFilter:['class','disabled']
    });
  }

  const products=E('products');
  if(products){
    new MutationObserver(scheduleSync).observe(products,{
      childList:true,
      subtree:true,
      characterData:true
    });
  }

  new MutationObserver(scheduleSync).observe(document.body,{
    childList:true
  });

  [100,400,1000,2500,5000].forEach(ms=>setTimeout(scheduleSync,ms));
  window.addEventListener('focus',scheduleSync,{passive:true});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden) scheduleSync();});

  console.info('[Caseirinho Loja] hotfix V8.10.4 ativo');
}

if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded',init,{once:true});
}else{
  init();
}
})();