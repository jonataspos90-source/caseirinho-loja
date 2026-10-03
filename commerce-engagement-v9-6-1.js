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
const RATED_PREFIX=PREFIX+'rating_done_v962_';
const LEGACY_RATED_PREFIX=PREFIX+'rating_done_v961_';
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
let selectedRating=0;
let ratingOrder=null;
let benefitTimer=0;
let releasingCashback=false;
let couponWasActive=false;

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
function rated(orderId){try{return localStorage.getItem(RATED_PREFIX+S(orderId))==='1'||localStorage.getItem(LEGACY_RATED_PREFIX+S(orderId))==='1'}catch(_){return false}}
function markRated(orderId){try{localStorage.setItem(RATED_PREFIX+S(orderId),'1');localStorage.setItem(LEGACY_RATED_PREFIX+S(orderId),'1')}catch(_){}}

function injectUx(){
  if(E('ce962Style'))return;
  const s=document.createElement('style');s.id='ce962Style';s.textContent=`
    .ce961-rating{display:none!important}
    #ce962Overlay{position:fixed;inset:0;z-index:2147483300;background:#0f172a99;display:flex;align-items:center;justify-content:center;padding:18px}
    .ce962-card{width:min(470px,96vw);background:#fff;border-radius:22px;box-shadow:0 24px 80px #0005;overflow:hidden;color:#17233d}
    .ce962-head{background:linear-gradient(110deg,#7b1438,#b51f55);color:#fff;padding:18px 20px;display:flex;justify-content:space-between;gap:12px;align-items:flex-start}
    .ce962-head h3{margin:0;color:#fff;font-size:20px}.ce962-head small{display:block;margin-top:5px;opacity:.9}.ce962-close{border:1px solid #ffffff77;background:#ffffff18;color:#fff;border-radius:10px;width:38px;height:38px;font-size:22px;cursor:pointer}
    .ce962-body{padding:20px}.ce962-question{font-weight:900;font-size:17px;margin-bottom:5px}.ce962-help{color:#6b7280;font-size:13px;margin-bottom:15px}
    .ce962-stars{display:flex;gap:8px;justify-content:center;margin:8px 0 17px}.ce962-star{border:1px solid #ead7dc;background:#fff;border-radius:13px;width:56px;height:56px;font-size:31px;line-height:1;color:#cbd5e1;cursor:pointer;transition:.12s transform,.12s color,.12s background}.ce962-star:hover{transform:translateY(-1px)}.ce962-star.on{color:#eab308;background:#fff9db;border-color:#f5d76e}
    .ce962-details[hidden]{display:none!important}.ce962-details label{display:block;font-size:13px;font-weight:800;margin-bottom:7px}.ce962-details textarea{width:100%;box-sizing:border-box;border:1px solid #cbd5e1;border-radius:12px;padding:11px;font:inherit;resize:vertical;min-height:95px}.ce962-send{width:100%;margin-top:12px;border:0;border-radius:13px;background:#173f32;color:#fff;padding:13px;font-weight:900;font-size:15px;cursor:pointer}.ce962-send:disabled{opacity:.55;cursor:wait}.ce962-status{min-height:18px;font-size:12px;margin-top:8px;color:#991b1b}
    #ce962Toast{position:fixed;left:50%;bottom:92px;transform:translateX(-50%);z-index:2147483400;background:#173f32;color:#fff;border-radius:999px;padding:11px 16px;font-weight:800;box-shadow:0 12px 35px #0004;max-width:90vw;text-align:center}
    .cashback960-box.ce962-blocked{display:block!important;background:#fff8e8;border-color:#f2d38a}.cashback960-box.ce962-blocked .cashback960-title{color:#7c4a03}
  `;document.head.appendChild(s);
}
function cleanupLegacyRatings(){document.querySelectorAll('.ce961-rating').forEach(x=>x.remove())}
function toast(message){E('ce962Toast')?.remove();const x=document.createElement('div');x.id='ce962Toast';x.textContent=message;document.body.appendChild(x);setTimeout(()=>x.remove(),2600)}
function closeRating(){E('ce962Overlay')?.remove();selectedRating=0;ratingOrder=null}
function paintStars(){document.querySelectorAll('#ce962Overlay [data-ce962-star]').forEach(b=>{const n=N(b.dataset.ce962Star);b.classList.toggle('on',n<=selectedRating);b.setAttribute('aria-pressed',n===selectedRating?'true':'false')})}
function showRatingModal(order){
  if(cfg?.ratings?.enabled===false||!order?.id||rated(order.id)||E('ce962Overlay'))return;
  cleanupLegacyRatings();injectUx();ratingOrder=order;selectedRating=0;
  const code=esc(order.codigo||order.code||order.id);
  const overlay=document.createElement('div');overlay.id='ce962Overlay';overlay.innerHTML=`<section class="ce962-card" role="dialog" aria-modal="true" aria-labelledby="ce962Title"><header class="ce962-head"><div><h3 id="ce962Title">Avalie seu pedido</h3><small>${code?`Pedido ${code}`:'Sua opinião é importante para nós.'}</small></div><button type="button" class="ce962-close" aria-label="Fechar">×</button></header><div class="ce962-body"><div class="ce962-question">Como foi sua experiência?</div><div class="ce962-help">Primeiro escolha de 1 a 5 estrelas.</div><div class="ce962-stars" role="radiogroup" aria-label="Nota do pedido">${[1,2,3,4,5].map(n=>`<button type="button" class="ce962-star" data-ce962-star="${n}" aria-label="${n} estrela${n>1?'s':''}" aria-pressed="false">★</button>`).join('')}</div><div class="ce962-details" id="ce962Details" hidden><label for="ce962Comment">Quer deixar uma observação? <span style="font-weight:500;color:#6b7280">(opcional)</span></label><textarea id="ce962Comment" maxlength="500" placeholder="Conte como foi sua experiência, se quiser."></textarea><button type="button" class="ce962-send" id="ce962Send">Enviar avaliação</button><div class="ce962-status" id="ce962Status"></div></div></div></section>`;
  document.body.appendChild(overlay);
  overlay.querySelector('.ce962-close').onclick=closeRating;
  overlay.querySelectorAll('[data-ce962-star]').forEach(b=>b.onclick=()=>{selectedRating=N(b.dataset.ce962Star);paintStars();E('ce962Details').hidden=false;E('ce962Status').textContent=''});
  E('ce962Send').onclick=submitRating;
}
async function submitRating(){
  if(!ratingOrder?.id||!selectedRating)return;
  const btn=E('ce962Send'),status=E('ce962Status'),who=identity(),comment=S(E('ce962Comment')?.value).trim();
  btn.disabled=true;btn.textContent='Enviando...';status.textContent='';
  try{
    await postEvent('RATING',{orderId:S(ratingOrder.id),orderCode:S(ratingOrder.codigo||ratingOrder.code||''),rating:selectedRating,comment,name:who.name,customerName:who.name,phone:who.phone,email:who.email,cpf:who.cpf,source:'CHECKOUT_MODAL'});
    markRated(ratingOrder.id);closeRating();cleanupLegacyRatings();toast('Obrigado! Sua avaliação foi enviada.');
  }catch(_){btn.disabled=false;btn.textContent='Enviar avaliação';status.textContent='Não foi possível enviar agora. Tente novamente.'}
}
function renderCheckoutRating(){
  cleanupLegacyRatings();
  if(cfg?.ratings?.enabled===false)return;
  const host=E('checkoutResult');if(!host||!/pedido\s+.+\s+recebido/i.test(S(host.textContent)))return;
  const o=latestOrder();if(!o?.id||rated(o.id))return;
  setTimeout(()=>showRatingModal(o),80);
}
function enhanceOrderCards(){cleanupLegacyRatings()}
function watchCheckout(){const host=E('checkoutResult');if(!host)return;checkoutObserver?.disconnect();checkoutObserver=new MutationObserver(()=>setTimeout(renderCheckoutRating,30));checkoutObserver.observe(host,{childList:true,subtree:true,characterData:true});renderCheckoutRating()}
function watchOrders(){orderObserver?.disconnect();orderObserver=new MutationObserver(()=>{cleanupLegacyRatings();scheduleBenefitRule()});orderObserver.observe(document.body,{childList:true,subtree:true})}

function parseMoney(v){const s=S(v).replace(/\s/g,'').replace(/R\$/gi,'').replace(/\./g,'').replace(',','.').replace(/[^0-9.-]/g,'');const n=Number(s);return Number.isFinite(n)?Math.abs(n):0}
function couponActive(){const row=E('coupon958DiscountRow');return !!(row&&!row.hidden&&parseMoney(E('coupon958DiscountValue')?.textContent)>0)}
function setCashbackBlocked(){const box=E('cashback960Box');if(!box)return;box.classList.add('show','ce962-blocked');const bal=E('cashback960Balance'),actions=E('cashback960Actions'),status=E('cashback960Status');if(bal)bal.innerHTML='<b>Cupom de desconto ativo.</b><br>Cashback não é cumulativo com cupom neste pedido.';if(actions)actions.innerHTML='';if(status){status.className='cashback960-status warn';status.textContent='Para usar cashback, remova o cupom primeiro.'}const row=E('cashback960DiscountRow');if(row)row.hidden=true}
async function enforceBenefitRule(){
  const active=couponActive(),cb=window.CaseirinhoCashback960;
  if(active){
    setCashbackBlocked();
    const st=cb?.readState?.();
    if(st?.status==='ACTIVE'&&st?.reservationId&&!releasingCashback){
      releasingCashback=true;
      try{await cb.releaseReservation();toast('Cupom mantido. O cashback foi retirado deste pedido.')}catch(_){}
      finally{releasingCashback=false;setTimeout(setCashbackBlocked,30)}
    }
  }else if(couponWasActive){
    E('cashback960Box')?.classList.remove('ce962-blocked');
    try{await cb?.queryBalance?.(true)}catch(_){}
    try{cb?.renderTotals?.()}catch(_){}
  }
  couponWasActive=active;
}
function scheduleBenefitRule(){clearTimeout(benefitTimer);benefitTimer=setTimeout(enforceBenefitRule,50)}
function installBenefitGuard(){document.addEventListener('click',e=>{const b=e.target.closest?.('#cashback960Use');if(!b||!couponActive())return;e.preventDefault();e.stopImmediatePropagation();setCashbackBlocked();toast('Cashback não pode ser usado junto com cupom de desconto.')},true);scheduleBenefitRule()}

function watchIdentity(){['cName','cPhone','cEmail','cCpf'].forEach(id=>{const el=E(id);if(!el||el.dataset.ce961Bound==='1')return;el.dataset.ce961Bound='1';el.addEventListener('change',()=>scheduleSnapshot(true));el.addEventListener('blur',()=>scheduleSnapshot(true))})}
function watchCart(){let previous='';setInterval(()=>{const s=signature(snapshot());if(s!==previous){previous=s;scheduleSnapshot(true)}},1500);setInterval(()=>{if(cart().length)sendSnapshot(false,false)},30000);document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')sendSnapshot(true,true);else scheduleSnapshot(false)});window.addEventListener('pagehide',()=>sendSnapshot(true,true))}
async function install(){injectUx();await loadConfig();watchCheckout();watchOrders();watchIdentity();watchCart();installBenefitGuard();setTimeout(()=>{watchIdentity();scheduleSnapshot(true);cleanupLegacyRatings();renderCheckoutRating();scheduleBenefitRule()},600);setInterval(watchIdentity,3000)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
window.CaseirinhoEngagement961={snapshot:()=>snapshot(),sendSnapshot,renderCheckoutRating,enhanceOrderCards,showRatingModal,enforceBenefitRule};
})();
