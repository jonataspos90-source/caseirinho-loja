(()=>{'use strict';
if(window.__CASEIRINHO_STORE_HOTFIX_934__)return;
window.__CASEIRINHO_STORE_HOTFIX_934__=true;
const VERSION='9.3.5';
const CFG=window.CASEIRINHO_CONFIG||{};
const qs=new URLSearchParams(location.search);
const STORE=String(qs.get('empresa')||qs.get('loja')||CFG.storeSlug||'caseirinho').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9-]/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'')||'caseirinho';
const SCOPE='john_store_'+STORE+'_';
const ORDERS_KEY=SCOPE+'orders_v1';
const NOTICE_KEY=SCOPE+'customer_notice_v1';
const CATALOG_KEY=SCOPE+'catalog_v1';
const LEGACY_CATALOG_KEY='john_ecommerce_public_v1';
const S=v=>String(v??'');
const A=v=>Array.isArray(v)?v:[];
const norm=v=>S(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toUpperCase().replace(/[\s-]+/g,'_');
if(typeof Storage==='undefined')return;
const nativeGet=Storage.prototype.getItem;
const nativeSet=Storage.prototype.setItem;
const nativeRemove=Storage.prototype.removeItem;
function parse(raw,fallback){try{const x=JSON.parse(raw||'null')??fallback;return x}catch(_){return fallback}}
function notices(storage){const x=parse(nativeGet.call(storage,NOTICE_KEY),{});return x&&typeof x==='object'&&!Array.isArray(x)?{...x}:{}}
function stableKey(id,type){return `${S(id)}:${type}:once`}
function eventKey(o,type){return type==='rejected'?`${o.id}:rejected:${o.rejeitadoEm||o.updatedAt}`:`${o.id}:cancelled:${o.canceladoEm||o.updatedAt}`}
function terminalType(o){const st=norm(o?.status);return st==='REJEITADO'?'rejected':st==='CANCELADO'?'cancelled':''}
function upgradeDynamicSeen(seen){const out={...(seen||{})};for(const [key,value] of Object.entries(out)){for(const type of ['rejected','cancelled']){const token=`:${type}:`,p=key.indexOf(token);if(p>0&&!key.endsWith(`${token}once`)){const stable=stableKey(key.slice(0,p),type);if(!out[stable])out[stable]=value||new Date().toISOString()}}}return out}
function persist(storage,seen){nativeSet.call(storage,NOTICE_KEY,JSON.stringify(seen))}
function markTerminalSeen(storage,o,type,seen=notices(storage)){const out=upgradeDynamicSeen(seen),now=out[stableKey(o.id,type)]||new Date().toISOString();out[stableKey(o.id,type)]=now;out[eventKey(o,type)]=now;return out}
function primeExistingTerminalOrders(storage){try{let seen=upgradeDynamicSeen(notices(storage)),changed=false;for(const o of A(parse(nativeGet.call(storage,ORDERS_KEY),[]))){if(!o?.id)continue;const type=terminalType(o);if(!type)continue;const stable=stableKey(o.id,type),dynamic=eventKey(o,type);if(!seen[stable]||!seen[dynamic]){seen=markTerminalSeen(storage,o,type,seen);changed=true}}if(changed)persist(storage,seen)}catch(_){}}
function isCatalogKey(key){const k=S(key);return k===CATALOG_KEY||k===LEGACY_CATALOG_KEY||(/^john_store_.+_catalog_v1$/.test(k))}
Storage.prototype.getItem=function(key){
  try{
    if(this===localStorage&&isCatalogKey(key))return null;
    const raw=nativeGet.call(this,key);
    if(this===localStorage&&S(key)===NOTICE_KEY){let seen=upgradeDynamicSeen(parse(raw,{}));for(const o of A(parse(nativeGet.call(this,ORDERS_KEY),[]))){if(!o?.id)continue;const type=terminalType(o);if(!type)continue;if(seen[stableKey(o.id,type)])seen=markTerminalSeen(this,o,type,seen)}return JSON.stringify(seen)}
    return raw;
  }catch(_){return nativeGet.call(this,key)}
};
Storage.prototype.setItem=function(key,value){try{
  if(this===localStorage&&isCatalogKey(key))return;
  if(this===localStorage&&S(key)===NOTICE_KEY)return nativeSet.call(this,key,JSON.stringify(upgradeDynamicSeen(parse(value,{}))));
  if(this===localStorage&&S(key)===ORDERS_KEY){const before=A(parse(nativeGet.call(this,ORDERS_KEY),[])),beforeMap=new Map(before.filter(x=>x?.id).map(x=>[S(x.id),x])),result=nativeSet.call(this,key,value),after=A(parse(value,[]));let seen=upgradeDynamicSeen(notices(this)),changed=false;for(const o of after){if(!o?.id)continue;const type=terminalType(o);if(!type)continue;const previous=beforeMap.get(S(o.id)),alreadyTerminal=terminalType(previous)===type,alreadyAcknowledged=!!seen[stableKey(o.id,type)];if(alreadyTerminal||alreadyAcknowledged){seen=markTerminalSeen(this,o,type,seen);changed=true}}if(changed)persist(this,seen);return result}
}catch(_){}return nativeSet.call(this,key,value)};
try{nativeRemove.call(localStorage,CATALOG_KEY);nativeRemove.call(localStorage,LEGACY_CATALOG_KEY)}catch(_){}
primeExistingTerminalOrders(localStorage);

/* V9.3.5: catálogo publicado na API é a única fonte de verdade.
   O app pode manter carrinho, pedidos e perfil localmente, mas nunca o catálogo. */
const nativeFetch=typeof window.fetch==='function'?window.fetch:null;
function isCanonicalCatalogUrl(value){try{const u=new URL(typeof value==='string'?value:value?.url,location.href);return /\/api\/v1\/public\/store\/[^/]+\/catalog\/?$/i.test(u.pathname)}catch(_){return false}}
if(nativeFetch){
 window.fetch=async function(input,init){
  const response=await nativeFetch(input,init);
  if(response?.ok&&isCanonicalCatalogUrl(input)){
    try{nativeRemove.call(localStorage,CATALOG_KEY)}catch(_){}
  }
  return response;
 };
}
window.CaseirinhoStoreHotfix934={version:VERSION,noticeKey:NOTICE_KEY,ordersKey:ORDERS_KEY,catalogKey:CATALOG_KEY,stableKey,primeExistingTerminalOrders,serverAuthoritative:true};
})();
