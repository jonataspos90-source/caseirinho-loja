const CACHE='caseirinho-loja-v9.6.1-commerce-engagement';
const HOTFIX931='./store-hotfix-v9-3-1.js';
const HOTFIX932='./store-hotfix-v9-3-2.js';
const HOTFIX933='./store-hotfix-v9-3-3.js';
const HOTFIX934='./store-hotfix-v9-3-4.js';
const HOTFIX935='./store-hotfix-v9-3-5.js';
const PARMESAO936='./checkout-parmesao-v9-3-6.js';
const PIX937='./pix-payment-v9-3-7.js';
const REV938='./order-revision-v9-3-8.js';
const PIX939='./pix-payment-ensure-v9-3-9.js';
const RECEIPT941='./order-receipt-pdf-v9-4-1.js';
const DEDUPE942='./order-actions-dedupe-v9-4-2.js';
const MOBILECSS947='./mobile-ux-v9-4-7.css';
const MOBILEJS947='./mobile-ux-v9-4-7.js';
const CARDSCSS948='./product-cards-mobile-v9-4-8.css';
const CARDSJS950='./product-cards-mobile-v9-5-0.js';
const GROUPJS951='./variant-grouping-v9-5-1.js';
const SYNCJS952='./variant-selection-sync-v9-5-2.js';
const DELIVERYJS954='./delivery-moto-v9-5-4.js';
const DELIVERYMODE955='./delivery-mode-v9-5-5.js';
const DESKTOPCSS956='./desktop-ux-v9-5-6.css';
const VARIANTCSS957='./mobile-variant-carousel-v9-5-7.css';
const VARIANTJS957='./mobile-variant-carousel-v9-5-7.js';
const COUPONJS958='./caseirinho-coupon-assistant-v9-5-8.js';
const JOHNJS959='./caseirinho-john-coupon-v9-5-9.js';
const CASHBACKJS960='./caseirinho-cashback-v9-6-0.js';
const ENGAGEMENTJS961='./commerce-engagement-v9-6-1.js';
const HOTFIX931_TAG='<script src="./store-hotfix-v9-3-1.js?v=9490"></'+'script>';
const HOTFIX932_TAG='<script src="./store-hotfix-v9-3-2.js?v=9490"></'+'script>';
const HOTFIX933_TAG='<script src="./store-hotfix-v9-3-3.js?v=937"></'+'script>';
const HOTFIX934_TAG='<script src="./store-hotfix-v9-3-4.js?v=9490"></'+'script>';
const HOTFIX935_TAG='<script src="./store-hotfix-v9-3-5.js?v=9490"></'+'script>';
const PARMESAO936_TAG='<script src="./checkout-parmesao-v9-3-6.js?v=9361"></'+'script>';
const PIX937_TAG='<script src="./pix-payment-v9-3-7.js?v=9490"></'+'script>';
const REV938_TAG='<script src="./order-revision-v9-3-8.js?v=9381"></'+'script>';
const PIX939_TAG='<script src="./pix-payment-ensure-v9-3-9.js?v=9490"></'+'script>';
const RECEIPT941_TAG='<script src="./order-receipt-pdf-v9-4-1.js?v=9490"></'+'script>';
const DEDUPE942_TAG='<script src="./order-actions-dedupe-v9-4-2.js?v=9490"></'+'script>';
const MOBILECSS947_TAG='<link rel="stylesheet" href="./mobile-ux-v9-4-7.css?v=9490">';
const MOBILEJS947_TAG='<script src="./mobile-ux-v9-4-7.js?v=9490" defer></'+'script>';
const CARDSCSS948_TAG='<link rel="stylesheet" href="./product-cards-mobile-v9-4-8.css?v=9510">';
const CARDSJS950_TAG='<script src="./product-cards-mobile-v9-5-0.js?v=9500" defer></'+'script>';
const GROUPJS951_TAG='<script src="./variant-grouping-v9-5-1.js?v=9510" defer></'+'script>';
const SYNCJS952_TAG='<script src="./variant-selection-sync-v9-5-2.js?v=9520" defer></'+'script>';
const DELIVERYJS954_TAG='<script src="./delivery-moto-v9-5-4.js?v=9560" defer></'+'script>';
const DELIVERYMODE955_TAG='<script src="./delivery-mode-v9-5-5.js?v=9550" defer></'+'script>';
const DESKTOPCSS956_TAG='<link rel="stylesheet" href="./desktop-ux-v9-5-6.css?v=9560">';
const VARIANTCSS957_TAG='<link rel="stylesheet" href="./mobile-variant-carousel-v9-5-7.css?v=9570">';
const VARIANTJS957_TAG='<script src="./mobile-variant-carousel-v9-5-7.js?v=9570" defer></'+'script>';
const COUPONJS958_TAG='<script src="./caseirinho-coupon-assistant-v9-5-8.js?v=9580" defer></'+'script>';
const JOHNJS959_TAG='<script src="./caseirinho-john-coupon-v9-5-9.js?v=9590" defer></'+'script>';
const CASHBACKJS960_TAG='<script src="./caseirinho-cashback-v9-6-0.js?v=9600" defer></'+'script>';
const ENGAGEMENTJS961_TAG='<script src="./commerce-engagement-v9-6-1.js?v=9610" defer></'+'script>';
const SHELL=['./','./index.html','./styles.css',MOBILECSS947,CARDSCSS948,VARIANTCSS957,DESKTOPCSS956,COUPONJS958,JOHNJS959,CASHBACKJS960,ENGAGEMENTJS961,'./app.js','./commerce-engine-v9-3-0.js',HOTFIX931,HOTFIX932,HOTFIX933,HOTFIX934,HOTFIX935,PARMESAO936,PIX937,REV938,PIX939,RECEIPT941,DEDUPE942,MOBILEJS947,CARDSJS950,GROUPJS951,SYNCJS952,VARIANTJS957,DELIVERYJS954,DELIVERYMODE955,'./manifest.webmanifest','./icons/icon-192.png','./icons/icon-512.png','./icons/icon-maskable-512.png','./icons/apple-touch-icon.png'];
function injectOne(html,needle,tag){if(html.includes(needle))return html;const low=html.toLowerCase(),p=low.lastIndexOf('</body>');return p>=0?html.slice(0,p)+tag+html.slice(p):html+tag}
function injectHead(html,needle,tag){if(html.includes(needle))return html;const low=html.toLowerCase(),p=low.lastIndexOf('</head>');return p>=0?html.slice(0,p)+tag+html.slice(p):tag+html}
function injectBeforeApp(html,needle,tag){if(html.includes(needle))return html;const p=html.indexOf('<script src="./app.js');return p>=0?html.slice(0,p)+tag+html.slice(p):injectOne(html,needle,tag)}
function stripOldCardScripts(html){return html.split(/<script[^>]*product-cards-mobile-v9-4-(?:8|9)\.js[^>]*><\/script>/gi).join('')}
function stripOldDeliveryScripts(html){return html.split(/<script[^>]*delivery-moto-v9-5-3\.js[^>]*><\/script>/gi).join('')}
function injectHotfix(response){if(!response)return response;const ct=response.headers.get('content-type')||'';if(!ct.includes('text/html'))return response;return response.text().then(html=>{html=stripOldCardScripts(html);html=stripOldDeliveryScripts(html);html=injectHead(html,'mobile-ux-v9-4-7.css',MOBILECSS947_TAG);html=injectHead(html,'product-cards-mobile-v9-4-8.css',CARDSCSS948_TAG);html=injectHead(html,'mobile-variant-carousel-v9-5-7.css',VARIANTCSS957_TAG);html=injectHead(html,'desktop-ux-v9-5-6.css',DESKTOPCSS956_TAG);html=injectBeforeApp(html,'store-hotfix-v9-3-4.js',HOTFIX934_TAG);html=injectBeforeApp(html,'caseirinho-coupon-assistant-v9-5-8.js',COUPONJS958_TAG);html=injectBeforeApp(html,'caseirinho-john-coupon-v9-5-9.js',JOHNJS959_TAG);html=injectBeforeApp(html,'caseirinho-cashback-v9-6-0.js',CASHBACKJS960_TAG);html=injectOne(html,'store-hotfix-v9-3-1.js',HOTFIX931_TAG);html=injectOne(html,'store-hotfix-v9-3-2.js',HOTFIX932_TAG);html=injectOne(html,'store-hotfix-v9-3-3.js',HOTFIX933_TAG);html=injectOne(html,'store-hotfix-v9-3-5.js',HOTFIX935_TAG);html=injectOne(html,'checkout-parmesao-v9-3-6.js',PARMESAO936_TAG);html=injectOne(html,'pix-payment-v9-3-7.js',PIX937_TAG);html=injectOne(html,'order-revision-v9-3-8.js',REV938_TAG);html=injectOne(html,'pix-payment-ensure-v9-3-9.js',PIX939_TAG);html=injectOne(html,'order-receipt-pdf-v9-4-1.js',RECEIPT941_TAG);html=injectOne(html,'order-actions-dedupe-v9-4-2.js',DEDUPE942_TAG);html=injectOne(html,'mobile-ux-v9-4-7.js',MOBILEJS947_TAG);html=injectOne(html,'product-cards-mobile-v9-5-0.js',CARDSJS950_TAG);html=injectOne(html,'variant-grouping-v9-5-1.js',GROUPJS951_TAG);html=injectOne(html,'variant-selection-sync-v9-5-2.js',SYNCJS952_TAG);html=injectOne(html,'mobile-variant-carousel-v9-5-7.js',VARIANTJS957_TAG);html=injectOne(html,'delivery-moto-v9-5-4.js',DELIVERYJS954_TAG);html=injectOne(html,'delivery-mode-v9-5-5.js',DELIVERYMODE955_TAG);html=injectOne(html,'commerce-engagement-v9-6-1.js',ENGAGEMENTJS961_TAG);const h=new Headers(response.headers);h.delete('content-length');h.set('Cache-Control','no-cache, no-store, must-revalidate');return new Response(html,{status:response.status,statusText:response.statusText,headers:h})})}
function canonicalUrl(req){const u=new URL(req.url);return u.origin+u.pathname}
async function cachedAsset(req){return (await caches.match(req))||(await caches.match(canonicalUrl(req)))||null}
async function cacheNetworkResponse(req,response){if(!response?.ok)return;const cache=await caches.open(CACHE);await cache.put(req,response.clone());const canonical=canonicalUrl(req);if(canonical!==req.url)await cache.put(canonical,response.clone())}
self.addEventListener('install',event=>{event.waitUntil((async()=>{const cache=await caches.open(CACHE);for(const url of SHELL){try{const response=await fetch(url,{cache:'reload'});if(response.ok)await cache.put(url,response.clone())}catch(_){}}await self.skipWaiting()})())});
self.addEventListener('activate',event=>{event.waitUntil((async()=>{const keys=await caches.keys();await Promise.all(keys.filter(k=>k.startsWith('caseirinho-loja-')&&k!==CACHE).map(k=>caches.delete(k)));await self.clients.claim()})())});
self.addEventListener('fetch',event=>{const req=event.request;if(req.method!=='GET')return;const url=new URL(req.url);if(url.origin!==self.location.origin)return;if(req.mode==='navigate'){event.respondWith((async()=>{try{const net=await fetch(req,{cache:'no-store'});const out=await injectHotfix(net);if(out.ok)(await caches.open(CACHE)).put('./index.html',out.clone()).catch(()=>{});return out}catch(_){const cached=(await caches.match('./index.html'))||Response.error();return injectHotfix(cached)}})());return}event.respondWith((async()=>{try{const net=await fetch(req,{cache:'no-store'});cacheNetworkResponse(req,net).catch(()=>{});return net}catch(_){return (await cachedAsset(req))||Response.error()}})())});