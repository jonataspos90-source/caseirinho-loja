const CACHE='caseirinho-loja-v9.3.4-rejection-loop';
const HOTFIX931='./store-hotfix-v9-3-1.js';
const HOTFIX932='./store-hotfix-v9-3-2.js';
const HOTFIX933='./store-hotfix-v9-3-3.js';
const HOTFIX934='./store-hotfix-v9-3-4.js';
const HOTFIX931_TAG='<script src="./store-hotfix-v9-3-1.js?v=934"></'+'script>';
const HOTFIX932_TAG='<script src="./store-hotfix-v9-3-2.js?v=934"></'+'script>';
const HOTFIX933_TAG='<script src="./store-hotfix-v9-3-3.js?v=934"></'+'script>';
const HOTFIX934_TAG='<script src="./store-hotfix-v9-3-4.js?v=934"></'+'script>';
const SHELL=[
  './',
  './index.html',
  './styles.css',
  './app.js',
  './commerce-engine-v9-3-0.js',
  HOTFIX931,
  HOTFIX932,
  HOTFIX933,
  HOTFIX934,
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png'
];
function injectOne(html,needle,tag){if(html.includes(needle))return html;const low=html.toLowerCase(),p=low.lastIndexOf('</body>');return p>=0?html.slice(0,p)+tag+html.slice(p):html+tag}
function injectHotfix(response){
  if(!response)return response;
  const ct=response.headers.get('content-type')||'';
  if(!ct.includes('text/html'))return response;
  return response.text().then(html=>{
    html=injectOne(html,'store-hotfix-v9-3-1.js',HOTFIX931_TAG);
    html=injectOne(html,'store-hotfix-v9-3-2.js',HOTFIX932_TAG);
    html=injectOne(html,'store-hotfix-v9-3-3.js',HOTFIX933_TAG);
    html=injectOne(html,'store-hotfix-v9-3-4.js',HOTFIX934_TAG);
    const h=new Headers(response.headers);h.delete('content-length');h.set('Cache-Control','no-cache');
    return new Response(html,{status:response.status,statusText:response.statusText,headers:h});
  });
}
self.addEventListener('install',event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE);
    for(const url of SHELL){try{const response=await fetch(url,{cache:'reload'});if(response.ok)await cache.put(url,response.clone())}catch(_){}}
    await self.skipWaiting();
  })());
});
self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(k=>k.startsWith('caseirinho-loja-')&&k!==CACHE).map(k=>caches.delete(k)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch',event=>{
  const req=event.request;if(req.method!=='GET')return;const url=new URL(req.url);
  if(/john-cloud-api-production\.up\.railway\.app$/.test(url.host)||/viacep\.com\.br$/.test(url.host))return;
  if(req.mode==='navigate'){
    event.respondWith((async()=>{try{const net=await fetch(req,{cache:'no-store'});const out=await injectHotfix(net);if(out.ok)(await caches.open(CACHE)).put('./index.html',out.clone()).catch(()=>{});return out}catch(_){const cached=(await caches.match('./index.html'))||Response.error();return injectHotfix(cached)}})());
    return;
  }
  if(url.origin===self.location.origin){event.respondWith((async()=>{try{const net=await fetch(req,{cache:'no-cache'});if(net.ok)(await caches.open(CACHE)).put(req,net.clone()).catch(()=>{});return net}catch(_){return (await caches.match(req))||Response.error()}})())}
});
