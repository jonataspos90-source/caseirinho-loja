(()=>{
'use strict';
if(window.__CASEIRINHO_SERVER_CATALOG_935__)return;
window.__CASEIRINHO_SERVER_CATALOG_935__=true;

const isCatalogKey=key=>{
  const k=String(key||'');
  return k==='john_ecommerce_public_v1'||(/^john_store_.+_catalog_v1$/.test(k));
};

try{
  const storage=window.localStorage;
  const proto=Object.getPrototypeOf(storage);
  const originalGet=proto.getItem;
  const originalSet=proto.setItem;
  const originalRemove=proto.removeItem;

  for(let i=storage.length-1;i>=0;i--){
    const key=storage.key(i);
    if(isCatalogKey(key))originalRemove.call(storage,key);
  }

  if(!proto.__caseirinhoCatalogAuthority935){
    Object.defineProperty(proto,'__caseirinhoCatalogAuthority935',{value:true,configurable:true});
    proto.getItem=function(key){
      if(this===storage&&isCatalogKey(key))return null;
      return originalGet.call(this,key);
    };
    proto.setItem=function(key,value){
      if(this===storage&&isCatalogKey(key))return;
      return originalSet.call(this,key,value);
    };
    proto.removeItem=function(key){
      return originalRemove.call(this,key);
    };
  }
}catch(err){
  console.error('[Caseirinho 9.3.5] não foi possível neutralizar cache local do catálogo:',err);
}

window.addEventListener('pageshow',()=>{
  try{
    if('caches' in window){
      caches.keys().then(keys=>Promise.all(keys.filter(k=>/caseirinho-loja-v9\.3\.[0-4]/i.test(k)).map(k=>caches.delete(k)))).catch(()=>{});
    }
  }catch(_){}
});
})();
