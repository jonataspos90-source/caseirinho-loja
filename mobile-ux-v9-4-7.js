(()=>{'use strict';
if(window.__CASEIRINHO_MOBILE_UX_947__)return;
window.__CASEIRINHO_MOBILE_UX_947__=true;

const doc=document;
const root=doc.documentElement;
const body=doc.body;
const vv=window.visualViewport;
let focusTimer=0;

function mobile(){return matchMedia('(max-width: 720px)').matches}
function updateViewport(){
  const h=vv?.height||window.innerHeight||0;
  const top=vv?.offsetTop||0;
  root.style.setProperty('--caseirinho-vvh',Math.max(320,h)+'px');
  root.style.setProperty('--caseirinho-vvtop',top+'px');
  const layoutH=window.innerHeight||h;
  const keyboard=mobile()&&(layoutH-h>120);
  body?.classList.toggle('caseirinho-keyboard-open',keyboard);
}

function fieldTarget(el){
  return el&&el.matches?.('input:not([type="checkbox"]):not([type="radio"]),select,textarea');
}
function reveal(el,delay){
  clearTimeout(focusTimer);
  focusTimer=setTimeout(()=>{
    if(!fieldTarget(el)||doc.activeElement!==el)return;
    try{el.scrollIntoView({behavior:'smooth',block:'center',inline:'nearest'})}catch(_){try{el.scrollIntoView()}catch(__){}}
  },delay);
}
function onFocus(e){
  const el=e.target;
  if(!fieldTarget(el))return;
  updateViewport();
  reveal(el,80);
  setTimeout(()=>{updateViewport();reveal(el,40)},280);
}
function onBlur(){
  setTimeout(()=>{updateViewport();body?.classList.remove('caseirinho-keyboard-open')},180);
}

function hardenForms(){
  doc.querySelectorAll('input,select,textarea').forEach(el=>{
    if(el.matches('input[type="checkbox"],input[type="radio"]'))return;
    if(parseFloat(getComputedStyle(el).fontSize)<16)el.style.fontSize='16px';
  });
}
function boot(){
  updateViewport();hardenForms();
  doc.addEventListener('focusin',onFocus,true);
  doc.addEventListener('focusout',onBlur,true);
  window.addEventListener('resize',updateViewport,{passive:true});
  window.addEventListener('orientationchange',()=>setTimeout(updateViewport,150),{passive:true});
  vv?.addEventListener('resize',updateViewport,{passive:true});
  vv?.addEventListener('scroll',updateViewport,{passive:true});
  const mo=new MutationObserver(records=>{
    if(records.some(r=>[...r.addedNodes].some(n=>n.nodeType===1&&(n.matches?.('input,select,textarea')||n.querySelector?.('input,select,textarea')))))hardenForms();
  });
  try{mo.observe(doc.body,{childList:true,subtree:true})}catch(_){}
}
if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
window.CaseirinhoMobileUx947={version:'9.4.7',updateViewport,hardenForms};
})();