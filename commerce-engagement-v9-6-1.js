(function(){'use strict';
if(window.__CASEIRINHO_ENGAGEMENT_961__)return;
window.__CASEIRINHO_ENGAGEMENT_961__=true;

const CFG=window.CASEIRINHO_CONFIG||{};
const API=String(CFG.apiUrl||'https://john-cloud-api-production.up.railway.app').replace(/\/+$/,'');
const STORE=String(
  new URLSearchParams(location.search).get('empresa')||
  new URLSearchParams(location.search).get('loja')||
  CFG.storeSlug||'caseirinho'
).trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')
 .replace(/[^a-z0-9-]/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'')||'caseirinho';
const PREFIX='john_store_'+STORE+'_';
const CART_KEY=PREFIX+'cart_v1';
const ORDERS_KEY=PREFIX+'orders_v1';
const PROFILE_KEY=PREFIX+'customer_profile_v1';
const SESSION_KEY=PREFIX+'commerce_session_v1';
const SENT_KEY=PREFIX+'engagement_last_snapshot_v961';
const RATED_PREFIX=PREFIX+'rating_done_v961_';
const E=id=>document.getElementById(id);
const S=v=>String(v??'');
const N=v=>Number(v)||0;
const A=v=>Array.isArray(v)?v:[];
const esc=v=>S(v).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
let cfg={abandonedCart:{enabled:true,minutes:30},ratings:{enabled:true}};
let lastSignature='';
let lastSendAt=0;
let sending=false;
let checkoutObserver=null;
let orderObserver=null;

function read(k,f){try{const x=JSON.parse(localStorage.getItem(k)||'null');return x??f}catch(_){return f}}
function write(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(_){}}
function cart(){return A(read(CART_KEY,[]))}
function orders(){return A(read(ORDERS_KEY,[]))}
function profile(){return read(PROFILE_KEY,{})||{}}
function sessionId(){let x='';try{x=localStorage.getItem(SESSION_KEY)||''}catch(_){}if(!x){x=(crypto.randomUUID?.()||('s'+Date.now()+Math.random().toString(36).slice(2)));try{localStorage.setItem(SESSION_KEY,x)}catch(_){}}return x}
function phoneDigits(v){let d=S(v).replace(/\D/g,'');if(d.startsWith('55')&&d.length>=12)d=d.slice(2);return d.slice(-11)}
function identity(){const p=profile();return{name:S(E('cName')?.value||p.nome||'').trim(),phone:phoneDigits(E('cPhone')?.value||p.telefone||''),email:S(E('cEmail')?.value||p.email||'').trim(),cpf:S(E('cCpf')?.value||p.cpf||'').replace(/\D/g,'')}}
function snapshot(){const c=cart(),who=identity();const itemDetails=c.map(x=>({productId:S(x.produtoId||x.productId||x.id),name:S(x.nome||x.name||x.descricao||'Produto'),quantity:N(x.quantidade||x.quantity),unitPrice:N(x.precoUnitario??x.preco??x.price)}));const total=itemDetails.reduce((s,x)=>s+x.quantity*x.unitPrice,0);return{...who,total,items:itemDetails.reduce((s,x)=>s+x.quantity,0),cartSize:itemDetails.length,itemNames:itemDetails.map(x=>`${x.quantity}x ${x.name}`).join(', '),itemDetails,page:location.pathname,updatedAt:new Date().toISOString()}}
async function postEvent(type,data={},keepalive=false){const body=JSON.stringify({type,sessionId:sessionId(),phone:S(data.phone||identity().phone),orderId:S(data.orderId||''),data});const r=await fetch(`${API}/api/v1/public/store/${encodeURIComponent(STORE)}/commerce-events?_t=${Date.now()}`,{method:'POST',cache:'no-store',keepalive:!!keepalive,headers:{'Content-Type':'application/json','Cache-Control':'no-cache'},body});if(!r.ok)throw new Error('HTTP '+r.status);return true}
function signature(s){return JSON.stringify({ids:A(s.itemDetails).map(x=>[x.productId,x.quantity,x.unitPrice]),name:s.name,phone:s.phone,email:s.email,cpf:s.cpf,total:s.total})}
async function sendSnapshot(force=false,keepalive=false){if(sending)return false;const s=snapshot(),sig=signature(s),now=Date.now();if(!s.cartSize){const prev=read(SENT_KEY,{});if(prev?.hadCart){try{await postEvent('CART_CLEARED',{...s,items:0,cartSize:0},keepalive)}catch(_){}write(SENT_KEY,{hadCart:false,at:now});lastSignature=''}return false}if(!force&&sig===lastSignature&&now-lastSendAt<30000)return false;sending=true;try{await postEvent('CART_SNAPSHOT',s,keepalive);lastSignature=sig;lastSendAt=now;write(SENT_KEY,{hadCart:true,at:now,signature:sig});return true}catch(_){return false}finally{sending=false}}
function scheduleSnapshot(force=false){setTimeout(()=>sendSnapshot(force,false),120)}
async function loadConfig(){try{const r=await fetch(`${API}/api/v1/public/store/${encodeURIComponent(STORE)}/commerce-engine?_t=${Date.now()}`,{cache:'no-store'});const j=await r.json();if(r.ok&&j?.config)cfg={...cfg,...j.config}}catch(_){}}
function latestOrder(){return [...orders()].sort((a,b)=>new Date(b.savedAt||b.criadoEm||b.createdAt||0)-new Date(a.savedAt||a.criadoEm||a.createdAt||0))[0]||null}
function rated(orderId){try{return localStorage.getItem(RATED_PREFIX+S(orderId))==='1'}catch(_){return false}}
function markRated(orderId){try{localStorage.setItem(RATED_PREFIX+S(orderId),'1')}catch(_){}}
function ratingHtml(order,compact=false){const oid=esc(order?.id||'');const code=esc(order?.codigo||order?.code||'');return `<div class="ce961-rating" data-ce961-order="${oid}" style="margin-top:12px;padding:14px;border:1px solid #ead7dc;border-radius:14px;background:#fffafb"><b style="display:block;margin-bottom:5px">⭐ Como foi sua experiência${code?' com o pedido '+code:''}?</b><small style="display:block;color:#6b7280;margin-bottom:9px">Sua avaliação ajuda o Caseirinho a melhorar.</small><div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:9px">${[1,2,3,4,5].map(n=>`<button type="button" data-ce961-rate="${n}" style="border:1px solid #ead7dc;background:#fff;border-radius:10px;padding:8px 10px;font-size:18px;cursor:pointer" aria-label="${n} estrela${n>1?'s':''}">${'★'.repeat(n)}</button>`).join('')}</div>${compact?'':`<textarea data-ce961-comment rows="2" maxlength="500" placeholder="Quer deixar um comentário? (opcional)" style="width:100%;box-sizing:border-box;border:1px solid #d1d5db;border-radius:9px;padding:8px"></textarea>`}<div data-ce961-status style="font-size:12px;margin-top:6px"></div></div>`}
async function submitRating(box,n,order){if(!box||!order?.id||rated(order.id))return;const status=box.querySelector('[data-ce961-status]'),buttons=[...box.querySelectorAll('[data-ce961-rate]')];buttons.forEach(b=>b.disabled=true);if(status)status.textContent='Enviando sua avaliação...';const who=identity(),comment=S(box.querySelector('[data-ce961-comment]')?.value).trim();try{await postEvent('RATING',{orderId:S(order.id),orderCode:S(order.codigo||order.code||''),rating:N(n),comment,name:who.name,customerName:who.name,phone:who.phone,email:who.email,cpf:who.cpf,source:'CHECKOUT'});markRated(order.id);box.innerHTML='<b style="color:#166534">✓ Obrigado! Sua avaliação foi registrada.</b>'}catch(e){buttons.forEach(b=>b.disabled=false);if(status)status.textContent='Não foi possível enviar agora. Tente novamente.'}}
function bindRating(box,order){box?.querySelectorAll('[data-ce961-rate]').forEach(b=>b.addEventListener('click',()=>submitRating(box,N(b.dataset.ce961Rate),order)))}
function renderCheckoutRating(){if(cfg?.ratings?.enabled===false)return;const host=E('checkoutResult');if(!host||!/pedido\s+.+\s+recebido/i.test(S(host.textContent)))return;const o=latestOrder();if(!o?.id||rated(o.id)||host.querySelector('.ce961-rating'))return;host.insertAdjacentHTML('beforeend',ratingHtml(o,false));bindRating(host.querySelector('.ce961-rating'),o)}
function enhanceOrderCards(){if(cfg?.ratings?.enabled===false)return;const list=[...orders()].reverse();document.querySelectorAll('.order-card').forEach((card,i)=>{const o=list[i];if(!o?.id||rated(o.id)||card.querySelector('.ce961-rating'))return;card.insertAdjacentHTML('beforeend',ratingHtml(o,true));bindRating(card.querySelector('.ce961-rating'),o)})}
function watchCheckout(){const host=E('checkoutResult');if(!host)return;checkoutObserver?.disconnect();checkoutObserver=new MutationObserver(()=>setTimeout(renderCheckoutRating,20));checkoutObserver.observe(host,{childList:true,subtree:true,characterData:true});renderCheckoutRating()}
function watchOrders(){orderObserver?.disconnect();orderObserver=new MutationObserver(()=>{if(document.querySelector('.order-card'))setTimeout(enhanceOrderCards,60)});orderObserver.observe(document.body,{childList:true,subtree:true})}
function watchIdentity(){['cName','cPhone','cEmail','cCpf'].forEach(id=>{const el=E(id);if(!el||el.dataset.ce961Bound==='1')return;el.dataset.ce961Bound='1';el.addEventListener('change',()=>scheduleSnapshot(true));el.addEventListener('blur',()=>scheduleSnapshot(true))})}
function watchCart(){let previous='';setInterval(()=>{const s=signature(snapshot());if(s!==previous){previous=s;scheduleSnapshot(true)}},1500);setInterval(()=>{if(cart().length)sendSnapshot(false,false)},30000);document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')sendSnapshot(true,true);else scheduleSnapshot(false)});window.addEventListener('pagehide',()=>sendSnapshot(true,true))}
async function install(){await loadConfig();watchCheckout();watchOrders();watchIdentity();watchCart();setTimeout(()=>{watchIdentity();scheduleSnapshot(true);enhanceOrderCards();renderCheckoutRating()},600);setInterval(watchIdentity,3000)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
window.CaseirinhoEngagement961={snapshot:()=>snapshot(),sendSnapshot,renderCheckoutRating,enhanceOrderCards};
})();
