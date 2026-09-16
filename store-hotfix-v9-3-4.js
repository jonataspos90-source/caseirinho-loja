(()=>{'use strict';
if(window.__CASEIRINHO_STORE_HOTFIX_934__)return;
window.__CASEIRINHO_STORE_HOTFIX_934__=true;
const VERSION='9.3.4';
const CFG=window.CASEIRINHO_CONFIG||{};
const qs=new URLSearchParams(location.search);
const STORE=String(qs.get('empresa')||qs.get('loja')||CFG.storeSlug||'caseirinho').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9-]/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'')||'caseirinho';
const SCOPE='john_store_'+STORE+'_';
const ORDERS_KEY=SCOPE+'orders_v1';
const NOTICE_KEY=SCOPE+'customer_notice_v1';
const ONCE_KEY=SCOPE+'rejection_once_v934';
const S=v=>String(v??'');
const A=v=>Array.isArray(v)?v:[];
const norm=v=>S(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toUpperCase().replace(/[\s-]+/g,'_');
function read(k,f){try{return JSON.parse(localStorage.getItem(k)||'null')??f}catch(_){return f}}
function write(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(_){}}
function eventTime(o){const v=o?.rejeitadoEm||o?.updatedAt||o?.atualizadoEm||o?.criadoEm||o?.createdAt||o?.savedAt;const t=v?new Date(v).getTime():0;return Number.isFinite(t)?t:0}
function rejectedOrders(){return A(read(ORDERS_KEY,[])).filter(o=>o?.id&&norm(o.status)==='REJEITADO')}
function latestRejected(){return rejectedOrders().slice().sort((a,b)=>eventTime(b)-eventTime(a))[0]||null}
function seenOnce(){const x=read(ONCE_KEY,{});return x&&typeof x==='object'&&!Array.isArray(x)?x:{}}
function markOnce(id,meta={}){if(!id)return;const x=seenOnce();x[S(id)]={at:new Date().toISOString(),...meta};write(ONCE_KEY,x)}
function migrateHistorical(){
 const notices=read(NOTICE_KEY,{}),once=seenOnce();let changed=false;
 for(const key of Object.keys(notices||{})){
  const p=key.indexOf(':rejected:');
  if(p<=0)continue;
  const id=key.slice(0,p);
  if(!once[id]){once[id]={at:notices[key]||new Date().toISOString(),migrated:true};changed=true}
 }
 if(changed)write(ONCE_KEY,once);
}
function rejectionDialogOpen(){
 const ov=document.getElementById('customerExperienceOverlay');
 if(!ov||!ov.classList.contains('open'))return false;
 const title=S(document.getElementById('customerExperienceTitle')?.textContent);
 const body=S(document.getElementById('customerExperienceBody')?.textContent);
 return /atualiza[cç][aã]o do pedido/i.test(title)&&/pedido\s+foi\s+rejeitado/i.test(body);
}
function guardDialog(){
 if(!rejectionDialogOpen())return;
 const order=latestRejected();if(!order?.id)return;
 const once=seenOnce();
 if(once[S(order.id)]){
  const ok=[...document.querySelectorAll('#customerExperienceActions button')].find(b=>/^ok$/i.test(S(b.textContent).trim()));
  if(ok&&!ok.dataset.autoClosed934){ok.dataset.autoClosed934='1';queueMicrotask(()=>ok.click())}
  return;
 }
 markOnce(order.id,{status:'REJEITADO',shown:true});
}
function installObserver(){
 const obs=new MutationObserver(()=>queueMicrotask(guardDialog));
 obs.observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['class','aria-hidden']});
 setTimeout(guardDialog,0);
}
migrateHistorical();
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',installObserver,{once:true});else installObserver();
window.CaseirinhoStoreHotfix934={version:VERSION,store:STORE,onceKey:ONCE_KEY,migrateHistorical,guardDialog};
})();
