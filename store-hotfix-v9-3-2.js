(()=>{'use strict';
if(window.__CASEIRINHO_STORE_HOTFIX_932__)return;
window.__CASEIRINHO_STORE_HOTFIX_932__=true;
const VERSION='9.3.2';
const CFG=window.CASEIRINHO_CONFIG||{};
const API=String(CFG.apiUrl||'https://john-cloud-api-production.up.railway.app').replace(/\/+$/,'');
const qs=new URLSearchParams(location.search);
const STORE=String(qs.get('empresa')||qs.get('loja')||CFG.storeSlug||'caseirinho').trim().toLowerCase()||'caseirinho';
const SCOPE='john_store_'+STORE+'_';
const ORDERS_KEY=SCOPE+'orders_v1';
const NOTICE_KEY=SCOPE+'customer_notice_v1';
const RATING_KEY=SCOPE+'rating_prompt_v932';
const SESSION_KEY=SCOPE+'commerce_session_v1';
const STARTED_AT=Date.now();
const A=v=>Array.isArray(v)?v:[];
const S=v=>String(v??'');
const N=v=>Number(v)||0;
const norm=v=>S(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toUpperCase().replace(/[\s-]+/g,'_');
let ratingsEnabled=true;
let ratingOpen=false;
function read(k,f={}){try{return JSON.parse(localStorage.getItem(k)||'null')??f}catch(_){return f}}
function write(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(_){}}
function orderTime(o){const v=o?.criadoEm||o?.createdAt||o?.savedAt||o?.data;const t=v?new Date(v).getTime():0;return Number.isFinite(t)?t:0}
function updateTime(o){const v=o?.entregueEm||o?.retiradoEm||o?.concluidoEm||o?.finalizadoEm||o?.updatedAt||o?.atualizadoEm;const t=v?new Date(v).getTime():0;return Number.isFinite(t)?t:0}
function completed(o){return ['ENTREGUE','RETIRADO','CONCLUIDO','FINALIZADO'].includes(norm(o?.status))}
function terminalOld(o){return ['REJEITADO','CANCELADO','FRETE_RECUSADO_CLIENTE'].includes(norm(o?.status))&&orderTime(o)>0&&orderTime(o)<STARTED_AT-120000}
function primeHistoricalNotices(){
 const seen=read(NOTICE_KEY,{});let changed=false;
 for(const o of A(read(ORDERS_KEY,[]))){
  if(!o?.id||!terminalOld(o))continue;
  const st=norm(o.status);
  if(st==='REJEITADO'){
   const key=`${o.id}:rejected:${o.rejeitadoEm||o.updatedAt}`;
   if(!seen[key]){seen[key]=new Date().toISOString();changed=true}
  }
  if(st==='CANCELADO'){
   const key=`${o.id}:cancelled:${o.canceladoEm||o.updatedAt}`;
   if(!seen[key]){seen[key]=new Date().toISOString();changed=true}
  }
 }
 if(changed)write(NOTICE_KEY,seen);
}
function installStorageBridge(){
 if(window.__STORE932_STORAGE_BRIDGE__||typeof Storage==='undefined')return;
 window.__STORE932_STORAGE_BRIDGE__=true;
 const base=Storage.prototype.setItem;
 Storage.prototype.setItem=function(key,value){
  const r=base.call(this,key,value);
  try{if(this===localStorage&&String(key)===ORDERS_KEY)queueMicrotask(()=>{primeHistoricalNotices();setTimeout(checkCompletedRatings,0)})}catch(_){}
  return r;
 };
}
function sessionId(){let x='';try{x=localStorage.getItem(SESSION_KEY)||''}catch(_){}if(!x){x=(crypto.randomUUID?.()||('s'+Date.now()+Math.random().toString(36).slice(2)));try{localStorage.setItem(SESSION_KEY,x)}catch(_){}}return x}
async function commerceEvent(type,order,rating){
 try{await fetch(API+'/api/v1/public/store/'+encodeURIComponent(STORE)+'/commerce-events',{method:'POST',cache:'no-store',headers:{'Content-Type':'application/json','Cache-Control':'no-cache'},body:JSON.stringify({type,sessionId:sessionId(),orderId:S(order?.id),data:{orderId:S(order?.id),rating:N(rating),stage:type==='CHECKOUT_RATING'?'CHECKOUT':'ORDER_COMPLETED',at:new Date().toISOString()}})})}catch(e){console.warn('[Loja 9.3.2] avaliação:',e)}
}
function starsHtml(prefix){return [1,2,3,4,5].map(n=>`<button type="button" data-${prefix}-rate="${n}" aria-label="${n} estrela${n>1?'s':''}">${'★'.repeat(n)}</button>`).join('')}
function installStyle(){if(document.getElementById('store932Style'))return;const s=document.createElement('style');s.id='store932Style';s.textContent=`.store932-rate{margin-top:12px;padding:12px;border:1px solid #f1cbd8;border-radius:12px;background:#fff8fb}.store932-rate b{display:block;margin-bottom:7px}.store932-stars{display:flex;gap:6px;flex-wrap:wrap}.store932-stars button{border:1px solid #e7aabd;background:#fff;color:#a60046;border-radius:9px;padding:7px 9px;font-weight:900;cursor:pointer}.store932-overlay{position:fixed;inset:0;z-index:10050;background:#18111acc;display:flex;align-items:center;justify-content:center;padding:18px}.store932-card{width:min(430px,95vw);background:#fff;border-radius:20px;padding:22px;border-top:5px solid #b0004b;box-shadow:0 24px 70px #0005}.store932-card h2{margin:0 0 8px;color:#8f003d}.store932-card p{color:#5b6473}.store932-actions{display:flex;justify-content:flex-end;margin-top:14px}.store932-actions button{border:0;border-radius:9px;padding:9px 13px;font-weight:800;cursor:pointer}.store932-thanks{color:#166534;font-weight:800}`;document.head.appendChild(s)}
function latestOrder(){return A(read(ORDERS_KEY,[])).slice().sort((a,b)=>orderTime(b)-orderTime(a))[0]||null}
function enhanceCheckoutRating(){
 if(!ratingsEnabled)return;
 const host=document.getElementById('checkoutResult');if(!host||host.querySelector('#checkoutRating932'))return;
 const ok=host.querySelector('.result:not(.err)');if(!ok||!/pedido\s+.+\s+recebido/i.test(ok.textContent||''))return;
 const o=latestOrder();if(!o?.id||['REJEITADO','CANCELADO','FRETE_RECUSADO_CLIENTE'].includes(norm(o.status)))return;
 const state=read(RATING_KEY,{});if(state[`checkout:${o.id}`])return;
 const box=document.createElement('div');box.id='checkoutRating932';box.className='store932-rate';box.innerHTML=`<b>Como foi sua experiência para fazer este pedido?</b><div class="store932-stars">${starsHtml('checkout')}</div><small>Sua nota ajuda a melhorar a Loja.</small>`;
 ok.appendChild(box);
 box.querySelectorAll('[data-checkout-rate]').forEach(b=>b.onclick=async()=>{const rating=N(b.dataset.checkoutRate);const st=read(RATING_KEY,{});st[`checkout:${o.id}`]={rating,at:new Date().toISOString()};write(RATING_KEY,st);await commerceEvent('CHECKOUT_RATING',o,rating);box.innerHTML='<span class="store932-thanks">Obrigado! Sua avaliação da experiência de compra foi registrada.</span>'});
}
function closeRating(){document.getElementById('store932RatingOverlay')?.remove();ratingOpen=false}
function showCompletedRating(o){
 if(ratingOpen||!ratingsEnabled||!o?.id)return;
 ratingOpen=true;const ov=document.createElement('div');ov.id='store932RatingOverlay';ov.className='store932-overlay';ov.innerHTML=`<div class="store932-card"><h2>Avalie seu pedido</h2><p>Seu pedido <b>${S(o.codigo||o.id)}</b> foi concluído. Que nota você dá?</p><div class="store932-stars">${starsHtml('order')}</div><div class="store932-actions"><button type="button" id="store932Later">Avaliar depois</button></div></div>`;document.body.appendChild(ov);
 const state=read(RATING_KEY,{});state[`prompt:${o.id}`]={shownAt:new Date().toISOString()};write(RATING_KEY,state);
 ov.querySelectorAll('[data-order-rate]').forEach(b=>b.onclick=async()=>{const rating=N(b.dataset.orderRate);const st=read(RATING_KEY,{});st[`order:${o.id}`]={rating,at:new Date().toISOString()};write(RATING_KEY,st);await commerceEvent('RATING',o,rating);const card=ov.querySelector('.store932-card');card.innerHTML='<h2>Obrigado!</h2><p class="store932-thanks">Sua avaliação do pedido foi registrada.</p>';setTimeout(closeRating,1200)});
 ov.querySelector('#store932Later').onclick=closeRating;
}
function checkCompletedRatings(){
 if(!ratingsEnabled||ratingOpen)return;
 const state=read(RATING_KEY,{}),orders=A(read(ORDERS_KEY,[]));
 const candidates=orders.filter(completed).sort((a,b)=>(updateTime(b)||orderTime(b))-(updateTime(a)||orderTime(a)));
 for(const o of candidates){
  if(state[`order:${o.id}`]||state[`prompt:${o.id}`])continue;
  const recent=(updateTime(o)||orderTime(o))>=STARTED_AT-120000;
  if(!recent){state[`prompt:${o.id}`]={historical:true,shownAt:new Date().toISOString()};write(RATING_KEY,state);continue}
  showCompletedRating(o);break;
 }
}
async function loadConfig(){try{const r=await fetch(API+'/api/v1/public/store/'+encodeURIComponent(STORE)+'/commerce-engine?_t='+Date.now(),{cache:'no-store'});if(r.ok){const j=await r.json();ratingsEnabled=j?.config?.ratings?.enabled!==false}}catch(_){}
}
function tick(){primeHistoricalNotices();enhanceCheckoutRating();checkCompletedRatings()}
function init(){installStyle();installStorageBridge();primeHistoricalNotices();loadConfig().finally(()=>{tick();[250,600,1100,1800,2800,4200,6500,9500,14000].forEach(ms=>setTimeout(tick,ms));setInterval(tick,2500)});const host=document.getElementById('checkoutResult');if(host)new MutationObserver(()=>setTimeout(enhanceCheckoutRating,30)).observe(host,{childList:true,subtree:true});document.addEventListener('visibilitychange',()=>{if(!document.hidden)setTimeout(tick,100)});window.addEventListener('focus',()=>setTimeout(tick,100))}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else setTimeout(init,50);
window.CaseirinhoStoreHotfix932={version:VERSION,primeHistoricalNotices,enhanceCheckoutRating,checkCompletedRatings,installStorageBridge};
})();
