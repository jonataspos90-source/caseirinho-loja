const CACHE='caseirinho-loja-v8.10.4-ui-cleanup';
const BASE_PATCH='./storefront-hotfix-v8-10-3.js';
const PATCH='./storefront-hotfix-v8-10-4.js';
const PATCH_TAG='<script src="./storefront-hotfix-v8-10-4.js?v=20260909"></'+'script>';
const SHELL=[
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
  BASE_PATCH,
  PATCH
];

async function cacheShell(){
  const c=await caches.open(CACHE);
  for(const url of SHELL){
    try{
      const r=await fetch(url,{cache:'reload'});
      if(r.ok) await c.put(url,r.clone());
    }catch(_){}
  }
}

/*
 V8.10.4:
 - continua injetando somente antes do ÚLTIMO </body> real;
 - injeta a V8.10.4, que carrega a base V8.10.3;
 - mantém o cache da Loja isolado do ERP;
 - não apaga localStorage, IndexedDB, pedidos ou carrinho.
*/
async function injectPatch(response){
  if(!response) return response;
  const ct=response.headers.get('content-type')||'';
  if(!ct.includes('text/html')) return response;

  let html=await response.text();
  if(!html.includes('storefront-hotfix-v8-10-4.js')){
    const lower=html.toLowerCase();
    const pos=lower.lastIndexOf('</body>');
    html=pos>=0
      ? html.slice(0,pos)+PATCH_TAG+html.slice(pos)
      : html+PATCH_TAG;
  }

  const h=new Headers(response.headers);
  h.delete('content-length');
  h.set('Cache-Control','no-cache');
  return new Response(html,{
    status:response.status,
    statusText:response.statusText,
    headers:h
  });
}

self.addEventListener('install',e=>{
  e.waitUntil(cacheShell().then(()=>self.skipWaiting()));
});

self.addEventListener('activate',e=>{
  e.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(
        keys
          .filter(k=>k!==CACHE && k.startsWith('caseirinho-loja-'))
          .map(k=>caches.delete(k))
      ))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener('message',e=>{
  if(e.data&&e.data.type==='SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url);

  /* API sempre direto na rede. */
  if(/john-cloud-api-production\.up\.railway\.app/.test(u.host)) return;
  if(e.request.method!=='GET') return;

  if(e.request.mode==='navigate'){
    e.respondWith((async()=>{
      try{
        const net=await fetch(e.request,{cache:'no-store'});
        const out=await injectPatch(net);
        if(out&&out.ok){
          caches.open(CACHE).then(c=>c.put('./index.html',out.clone())).catch(()=>{});
        }
        return out;
      }catch(_){
        const cached=await caches.match('./index.html');
        return injectPatch(cached);
      }
    })());
    return;
  }

  if(u.origin===self.location.origin){
    e.respondWith(
      fetch(e.request,{cache:'no-cache'})
        .then(r=>{
          if(r.ok) caches.open(CACHE).then(c=>c.put(e.request,r.clone())).catch(()=>{});
          return r;
        })
        .catch(()=>caches.match(e.request))
    );
  }
});