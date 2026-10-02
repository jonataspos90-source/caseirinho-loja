(()=>{'use strict';
if(window.__CASEIRINHO_DELIVERY_OPTION_954_FIX__)return;
window.__CASEIRINHO_DELIVERY_OPTION_954_FIX__=true;
const CFG=window.CASEIRINHO_CONFIG||{};
const params=new URLSearchParams(location.search);
const STORE=String(params.get('empresa')||params.get('loja')||CFG.storeSlug||'caseirinho').trim().toLowerCase();
if(STORE!=='caseirinho')return;

let applying=false;
function ensureDeliveryOption(){
  if(applying)return false;
  const mode=document.getElementById('mode');
  if(!mode)return false;
  if([...mode.options].some(o=>String(o.value).toUpperCase()==='ENTREGA'))return true;
  applying=true;
  try{
    const opt=document.createElement('option');
    opt.value='ENTREGA';
    opt.textContent='Entrega';
    mode.appendChild(opt);
    mode.dataset.caseirinhoDeliveryEnabled='1';
    return true;
  }finally{applying=false}
}

function watch(){
  const mode=document.getElementById('mode');
  if(!mode)return false;
  ensureDeliveryOption();
  const obs=new MutationObserver(()=>queueMicrotask(ensureDeliveryOption));
  obs.observe(mode,{childList:true});
  return true;
}

function boot(){
  let attempts=0;
  const timer=setInterval(()=>{
    attempts++;
    if(watch()||attempts>=20)clearInterval(timer);
  },250);
  ensureDeliveryOption();
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
else boot();

window.CaseirinhoDeliveryOptionFix={version:'9.5.4-fix',ensureDeliveryOption};
})();
