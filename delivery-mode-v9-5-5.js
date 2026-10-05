(()=>{'use strict';
if(window.__CASEIRINHO_DELIVERY_MODE_955__)return;
window.__CASEIRINHO_DELIVERY_MODE_955__=true;
const CFG=window.CASEIRINHO_CONFIG||{};
const STORE=String(new URLSearchParams(location.search).get('empresa')||new URLSearchParams(location.search).get('loja')||CFG.storeSlug||'caseirinho')
  .trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9-]/g,'-');
if(STORE!=='caseirinho')return;
const E=id=>document.getElementById(id);
let preferredMode='RETIRADA';
let applying=false;
let userChanged=false;

function ensureOption(select,value,label,first=false){
  let option=[...select.options].find(o=>o.value===value);
  if(!option){
    option=document.createElement('option');
    option.value=value;
    option.textContent=label;
    if(first&&select.firstChild)select.insertBefore(option,select.firstChild);else select.appendChild(option);
  }
  return option;
}

function applyPreferred(dispatch=true){
  const select=E('mode');
  if(!select)return false;
  ensureOption(select,'RETIRADA','Retirada',true);
  ensureOption(select,'ENTREGA','Entrega');
  const target=userChanged?preferredMode:'RETIRADA';
  if(select.value!==target){
    applying=true;
    select.value=target;
    if(dispatch)select.dispatchEvent(new Event('change',{bubbles:true}));
    applying=false;
  }
  return true;
}

function boot(){
  const select=E('mode');
  if(!select){setTimeout(boot,180);return}

  // Regra comercial: cada novo checkout começa em Retirada.
  // Entrega continua disponível, mas somente quando o cliente escolher.
  preferredMode='RETIRADA';
  userChanged=false;
  applyPreferred(true);

  select.addEventListener('change',e=>{
    if(applying)return;
    if(e.isTrusted){
      userChanged=true;
      preferredMode=select.value==='ENTREGA'?'ENTREGA':'RETIRADA';
    }
  });

  new MutationObserver(()=>applyPreferred(true)).observe(select,{childList:true});
  [350,900,1600].forEach(ms=>setTimeout(()=>applyPreferred(true),ms));
  setInterval(()=>applyPreferred(true),1800);
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,260),{once:true});
else setTimeout(boot,260);
window.CaseirinhoDeliveryMode955={version:'9.5.6',ensureDeliveryOption:applyPreferred};
})();
