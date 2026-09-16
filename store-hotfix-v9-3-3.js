(()=>{'use strict';
if(window.__CASEIRINHO_STORE_HOTFIX_933__)return;
window.__CASEIRINHO_STORE_HOTFIX_933__=true;
const VERSION='9.3.3';
const CFG=window.CASEIRINHO_CONFIG||{};
const qs=new URLSearchParams(location.search);
const STORE=String(qs.get('empresa')||qs.get('loja')||CFG.storeSlug||'caseirinho').trim().toLowerCase()||'caseirinho';
const SCOPE='john_store_'+STORE+'_';
const ORDERS_KEY=SCOPE+'orders_v1';
const NOTICE_KEY=SCOPE+'customer_notice_v1';
const S=v=>String(v??'');
const A=v=>Array.isArray(v)?v:[];
const norm=v=>S(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toUpperCase().replace(/[\s-]+/g,'_');
if(typeof Storage==='undefined')return;
const nativeGet=Storage.prototype.getItem;
const nativeSet=Storage.prototype.setItem;
function parse(raw,fallback){try{return JSON.parse(raw||'null')??fallback}catch(_){return fallback}}
function stableKey(id,type){return `${S(id)}:${type}:once`}
function upgradeSeen(seen){
 const out=seen&&typeof seen==='object'&&!Array.isArray(seen)?{...seen}:{};
 for(const [key,value] of Object.entries(out)){
  let p=key.indexOf(':rejected:');
  if(p>0&&!key.endsWith(':rejected:once')){
   const k=stableKey(key.slice(0,p),'rejected');
   if(!out[k])out[k]=value||new Date().toISOString();
  }
  p=key.indexOf(':cancelled:');
  if(p>0&&!key.endsWith(':cancelled:once')){
   const k=stableKey(key.slice(0,p),'cancelled');
   if(!out[k])out[k]=value||new Date().toISOString();
  }
 }
 return out;
}
function hasAny(seen,id,type){
 const prefix=`${S(id)}:${type}:`;
 return !!seen[stableKey(id,type)]||Object.keys(seen).some(k=>k.startsWith(prefix));
}
function enrichCurrentKeys(seen,storage){
 const out=upgradeSeen(seen);
 const orders=A(parse(nativeGet.call(storage,ORDERS_KEY),[]));
 for(const o of orders){
  if(!o?.id)continue;
  const st=norm(o.status);
  if(st==='REJEITADO'&&hasAny(out,o.id,'rejected')){
   const value=out[stableKey(o.id,'rejected')]||new Date().toISOString();
   out[stableKey(o.id,'rejected')]=value;
   out[`${o.id}:rejected:${o.rejeitadoEm||o.updatedAt}`]=value;
  }
  if(st==='CANCELADO'&&hasAny(out,o.id,'cancelled')){
   const value=out[stableKey(o.id,'cancelled')]||new Date().toISOString();
   out[stableKey(o.id,'cancelled')]=value;
   out[`${o.id}:cancelled:${o.canceladoEm||o.updatedAt}`]=value;
  }
 }
 return out;
}
Storage.prototype.getItem=function(key){
 const raw=nativeGet.call(this,key);
 try{
  if(this===localStorage&&S(key)===NOTICE_KEY){
   return JSON.stringify(enrichCurrentKeys(parse(raw,{}),this));
  }
 }catch(_){}
 return raw;
};
Storage.prototype.setItem=function(key,value){
 try{
  if(this===localStorage&&S(key)===NOTICE_KEY){
   const upgraded=upgradeSeen(parse(value,{}));
   return nativeSet.call(this,key,JSON.stringify(upgraded));
  }
 }catch(_){}
 return nativeSet.call(this,key,value);
};
function migrate(){
 try{
  const current=parse(nativeGet.call(localStorage,NOTICE_KEY),{});
  const upgraded=upgradeSeen(current);
  if(JSON.stringify(current)!==JSON.stringify(upgraded))nativeSet.call(localStorage,NOTICE_KEY,JSON.stringify(upgraded));
 }catch(_){}
}
migrate();
window.CaseirinhoStoreHotfix933={version:VERSION,noticeKey:NOTICE_KEY,ordersKey:ORDERS_KEY,stableKey};
})();
