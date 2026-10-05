(()=>{'use strict';
if(window.__CASEIRINHO_DELIVERY_MODE_955__)return;
window.__CASEIRINHO_DELIVERY_MODE_955__=true;
const CFG=window.CASEIRINHO_CONFIG||{};
const STORE=String(new URLSearchParams(location.search).get('empresa')||new URLSearchParams(location.search).get('loja')||CFG.storeSlug||'caseirinho')
  .trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9-]/g,'-');
if(STORE!=='caseirinho')return;
const E=id=>document.getElementById(id);
const S=v=>String(v??'');
const PROFILE_KEY='john_store_'+STORE+'_customer_profile_v1';
const ADDRESS_IDS=['cep','number','street','district','city','uf','comp'];
let preferredMode='';
let restoreQueued=false;
let userTouchedAddress=false;
let repairBusy=false;

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

function digits(v){return S(v).replace(/\D/g,'')}
function formatCep(v){const d=digits(v).slice(0,8);return d.length===8?d.replace(/^(\d{5})(\d{3})$/,'$1-$2'):S(v).trim()}
function savedAddress(){
  try{
    const p=JSON.parse(localStorage.getItem(PROFILE_KEY)||'null');
    const a=p?.entrega||{};
    return {
      cep:formatCep(a.cep),
      numero:S(a.numero).trim(),
      logradouro:S(a.logradouro).trim(),
      bairro:S(a.bairro).trim(),
      cidade:S(a.cidade).trim(),
      uf:S(a.uf).trim().toUpperCase(),
      complemento:S(a.complemento).trim()
    };
  }catch(_){return null}
}
function currentAddress(){return{
  cep:S(E('cep')?.value).trim(),
  numero:S(E('number')?.value).trim(),
  logradouro:S(E('street')?.value).trim(),
  bairro:S(E('district')?.value).trim(),
  cidade:S(E('city')?.value).trim(),
  uf:S(E('uf')?.value).trim().toUpperCase(),
  complemento:S(E('comp')?.value).trim()
}}
function looksCorrupted(a=currentAddress(),saved=savedAddress()){
  const cepDigits=digits(a.cep),numberDigits=digits(a.numero);
  if(/^a\s+combinar$/i.test(a.cep))return true;
  if(numberDigits.length===8&&cepDigits.length!==8)return true;
  if(saved&&digits(saved.cep).length===8){
    if(numberDigits===digits(saved.cep)&&digits(a.numero)!==digits(saved.numero))return true;
    if(cepDigits.length!==8&&a.logradouro&&a.cidade)return true;
  }
  return false;
}
function setField(id,value){const el=E(id);if(el)el.value=S(value??'')}
function notifyAddressChanged(){
  ['cep','number','comp'].forEach(id=>{
    const el=E(id);if(el)el.dispatchEvent(new Event('input',{bubbles:true}));
  });
}
function repairAddress(force=false){
  if(repairBusy||(!force&&userTouchedAddress))return false;
  const cur=currentAddress(),saved=savedAddress();
  if(!looksCorrupted(cur,saved))return false;
  repairBusy=true;
  try{
    if(saved&&digits(saved.cep).length===8){
      setField('cep',saved.cep);
      setField('number',saved.numero);
      setField('street',saved.logradouro);
      setField('district',saved.bairro);
      setField('city',saved.cidade);
      setField('uf',saved.uf);
      setField('comp',saved.complemento);
    }else if(digits(cur.numero).length===8){
      setField('cep',formatCep(cur.numero));
      setField('number','');
      if(cur.complemento&&cur.complemento.toUpperCase()===cur.uf)setField('comp','');
    }
    notifyAddressChanged();
    return true;
  }finally{repairBusy=false}
}

function protectAddressFields(){
  const attrs={
    cep:{name:'caseirinho_delivery_cep',inputmode:'numeric',autocomplete:'off',autocorrect:'off',spellcheck:'false'},
    number:{name:'caseirinho_delivery_numero',autocomplete:'off',autocorrect:'off',spellcheck:'false'},
    street:{name:'caseirinho_delivery_rua',autocomplete:'off'},
    district:{name:'caseirinho_delivery_bairro',autocomplete:'off'},
    city:{name:'caseirinho_delivery_cidade',autocomplete:'off'},
    uf:{name:'caseirinho_delivery_uf',autocomplete:'off'},
    comp:{name:'caseirinho_delivery_complemento',autocomplete:'off',autocorrect:'off',spellcheck:'false'}
  };
  Object.entries(attrs).forEach(([id,map])=>{
    const el=E(id);if(!el)return;
    Object.entries(map).forEach(([k,v])=>el.setAttribute(k,v));
  });
}

function ensureTimeHint(){
  const time=E('time');if(!time)return null;
  let hint=E('caseirinhoDeliveryTimeHint955');
  if(!hint){
    hint=document.createElement('div');
    hint.id='caseirinhoDeliveryTimeHint955';
    hint.textContent='A combinar';
    hint.style.cssText='display:none;margin-top:6px;font-size:12px;font-weight:800;color:#475569';
    time.insertAdjacentElement('afterend',hint);
  }
  return hint;
}
function fixTimeField(){
  const time=E('time'),mode=E('mode');if(!time||!mode)return;
  const delivery=mode.value==='ENTREGA';
  const hint=ensureTimeHint();
  if(delivery){
    if(time.type!=='time')time.type='time';
    if(time.value)time.value='';
    time.readOnly=false;
    time.disabled=true;
    time.setAttribute('autocomplete','off');
    time.setAttribute('aria-label','Horário de entrega a combinar');
    if(hint)hint.style.display='block';
  }else{
    time.disabled=false;
    if(time.type!=='time')time.type='time';
    time.readOnly=false;
    time.setAttribute('autocomplete','off');
    time.setAttribute('aria-label','Horário');
    if(hint)hint.style.display='none';
  }
}

function scheduleRepairs(){[0,150,500,1200,2500].forEach(ms=>setTimeout(()=>repairAddress(false),ms))}
function boot(){
  const select=E('mode');
  if(!select){setTimeout(boot,250);return}
  preferredMode=select.value||'RETIRADA';
  ensureDeliveryOption();
  protectAddressFields();
  fixTimeField();
  scheduleRepairs();

  select.addEventListener('change',()=>{
    preferredMode=select.value;
    ensureDeliveryOption();
    queueMicrotask(()=>{fixTimeField();repairAddress(false)});
  });
  new MutationObserver(()=>ensureDeliveryOption()).observe(select,{childList:true});

  const time=E('time');
  if(time)new MutationObserver(()=>queueMicrotask(fixTimeField)).observe(time,{attributes:true,attributeFilter:['type','readonly','disabled']});

  ADDRESS_IDS.forEach(id=>{
    const el=E(id);if(!el)return;
    el.addEventListener('pointerdown',()=>{userTouchedAddress=true},{passive:true});
    el.addEventListener('keydown',()=>{userTouchedAddress=true},{passive:true});
  });
  E('checkout')?.addEventListener('submit',()=>repairAddress(true),true);
  window.addEventListener('pageshow',()=>{userTouchedAddress=false;protectAddressFields();fixTimeField();scheduleRepairs()});
  setInterval(()=>{ensureDeliveryOption();protectAddressFields();fixTimeField()},2500);
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,300),{once:true});
else setTimeout(boot,300);
window.CaseirinhoDeliveryMode955={version:'9.5.5-address-autofill-fix',ensureDeliveryOption,repairAddress,fixTimeField};
})();
