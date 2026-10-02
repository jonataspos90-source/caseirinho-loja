(()=>{'use strict';
if(window.__CASEIRINHO_MOBILE_VARIANT_CAROUSEL_957__)return;
window.__CASEIRINHO_MOBILE_VARIANT_CAROUSEL_957__=true;
const S=v=>String(v??'');
const clean=v=>S(v).replace(/\s+/g,' ').trim();
const mobile=()=>window.matchMedia('(max-width:720px)').matches;
let raf=0;

function singularWord(word){
  word=clean(word);
  if(/ões$/i.test(word))return word.replace(/ões$/i,'ão');
  if(/ais$/i.test(word))return word.replace(/ais$/i,'al');
  if(/es$/i.test(word)&&word.length>5)return word.slice(0,-2);
  if(/s$/i.test(word)&&word.length>4)return word.slice(0,-1);
  return word;
}
function compactLabel(button,card){
  const span=button.querySelector('span');
  let label=clean(button.dataset.fullLabel951||span?.textContent||'Opção');
  label=label.replace(/\s*\((?:unidade|unidades|un\.?|unitário|unitaria|unitária)\)\s*$/i,'').trim();
  const title=clean(card?.querySelector('.product-body h3')?.textContent||'');
  const first=singularWord((title.split(/\s+/)[0]||'').replace(/[^\p{L}\p{N}-]/gu,''));
  if(first){
    const escaped=first.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
    label=label.replace(new RegExp('^'+escaped+'s?\\s+(?:de|do|da|com)?\\s*','i'),'').trim();
  }
  label=label.replace(/^(?:sabor|recheio)\s*[:\-]?\s*/i,'').trim();
  return label||clean(span?.textContent)||'Opção';
}
function syncSelected(track){
  track.querySelectorAll('.card-grade-option').forEach(b=>b.setAttribute('aria-selected',b.classList.contains('active')?'true':'false'));
}
function transformPanel(panel){
  if(!mobile()||!panel||panel.dataset.carouselUi957==='done')return;
  const card=panel.closest('.product-card');
  const buttons=[...panel.querySelectorAll('.card-grade-option[data-product-id]')];
  if(buttons.length<2)return;
  const heading=panel.querySelector('.card-grade-title');
  if(heading){
    const raw=clean(heading.textContent).replace(/^\S+\s+/,'');
    heading.textContent=raw?`Escolha ${raw.replace(/^Escolha\s+/i,'').toLowerCase()}`:'Escolha uma opção';
  }
  const track=document.createElement('div');
  track.className='variant-chip-track957';
  track.setAttribute('role','tablist');
  track.setAttribute('aria-label','Opções do produto');
  buttons.forEach(button=>{
    const span=button.querySelector('span');
    if(span){
      if(!button.dataset.originalLabel957)button.dataset.originalLabel957=clean(span.textContent);
      span.textContent=compactLabel(button,card);
    }
    button.setAttribute('role','tab');
    button.classList.add('variant-chip957');
    track.appendChild(button);
  });
  panel.querySelectorAll('.card-grade-options,.card-grade-flavor').forEach(el=>{if(el!==track)el.remove()});
  const selected=panel.querySelector('.card-selected-choice');
  if(selected)selected.before(track);else panel.appendChild(track);
  panel.dataset.carouselUi957='done';
  syncSelected(track);
}
function transformAll(){
  raf=0;
  if(!mobile())return;
  document.querySelectorAll('#products .card-grade-panel,#featured .card-grade-panel').forEach(transformPanel);
}
function schedule(){if(raf)return;raf=requestAnimationFrame(transformAll)}
function animateSelection(button){
  const card=button.closest('.product-card');
  const track=button.closest('.variant-chip-track957');
  if(card){card.classList.add('variant-switching957');setTimeout(()=>card.classList.remove('variant-switching957'),190)}
  [0,30,120].forEach(ms=>setTimeout(()=>{if(track){syncSelected(track);try{button.scrollIntoView({behavior:ms?'smooth':'auto',block:'nearest',inline:'center'})}catch(_){}}},ms));
}
function boot(){
  schedule();
  const roots=[document.getElementById('products'),document.getElementById('featured')].filter(Boolean);
  roots.forEach(root=>new MutationObserver(schedule).observe(root,{childList:true,subtree:true}));
  document.addEventListener('click',event=>{
    const button=event.target.closest?.('.variant-chip957');
    if(button)animateSelection(button);
  },true);
  window.matchMedia('(max-width:720px)').addEventListener?.('change',schedule);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,260),{once:true});else setTimeout(boot,260);
window.CaseirinhoVariantCarousel957={version:'9.5.7',transformAll};
})();
