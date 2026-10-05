(()=>{'use strict';
if(window.__CASEIRINHO_DELIVERY_MODE_955__)return;
window.__CASEIRINHO_DELIVERY_MODE_955__=true;
const CFG=window.CASEIRINHO_CONFIG||{};
const STORE=String(new URLSearchParams(location.search).get('empresa')||new URLSearchParams(location.search).get('loja')||CFG.storeSlug||'caseirinho')
  .trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9-]/g,'-');
if(STORE!=='caseirinho')return;
const E=id=>document.getElementById(id);
let preferredMode='';
let restoreQueued=false;

function ensureDeliveryOption(){
  const select=E('mode');
  if(!select)return false;
  let option=[...select.options].find(o=>o.value==='ENTREGA');
  if(!option){
    option=document.createElement('option');
    option.value='ENTREGA';
    option.textContent='Entrega';
    select.appendChild(option);
  }
  if(preferredMode==='ENTREGA'&&select.value!=='ENTREGA'&&!restoreQueued){
    select.value='ENTREGA';
    restoreQueued=true;
    queueMicrotask(()=>{
      restoreQueued=false;
      if(select.value==='ENTREGA')select.dispatchEvent(new Event('change',{bubbles:true}));
    });
  }
  return true;
}

function boot(){
  const select=E('mode');
  if(!select){setTimeout(boot,250);return}
  preferredMode=select.value||'RETIRADA';
  ensureDeliveryOption();
  select.addEventListener('change',()=>{
    preferredMode=select.value;
    ensureDeliveryOption();
  });
  new MutationObserver(()=>ensureDeliveryOption()).observe(select,{childList:true});
  setInterval(ensureDeliveryOption,2500);
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,300),{once:true});
else setTimeout(boot,300);
window.CaseirinhoDeliveryMode955={version:'9.5.5',ensureDeliveryOption};
})();
