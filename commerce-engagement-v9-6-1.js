(function(){'use strict';
if(window.__CASEIRINHO_ENGAGEMENT_961__)return;
window.__CASEIRINHO_ENGAGEMENT_961__=true;

const S=v=>String(v??'');
const N=v=>Number(v)||0;
const A=v=>Array.isArray(v)?v:[];
const E=id=>document.getElementById(id);
const esc=v=>S(v).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const STORE_ID=()=>S(window.STORE||(typeof STORE!=='undefined'?STORE:'caseirinho')||'caseirinho');
const scope=()=>S((typeof STORE_SCOPE!=='undefined'?STORE_SCOPE:window.STORE_SCOPE)||('john_store_'+STORE_ID()+'_'));
const SESSION_KEY=()=>scope()+'commerce_session_v1';
const RATED_KEY=()=>scope()+'engagement_rated_orders_v1';
let cfg={abandonedCart:{enabled:true,minutes:30},ratings:{enabled:true}};
let snapshotTimer=null;
let lastFingerprint='';
let lastSentAt=0;
let wrapped=false;

function sessionId(){
  let x='';try{x=localStorage.getItem(SESSION_KEY())||''}catch(_){}
  if(!x){x=(crypto.randomUUID?.()||('s'+Date.now()+Math.random().toString(36).slice(2)));try{localStorage.setItem(SESSION_KEY(),x)}catch(_){}}
  return x;
}
function rows(){try{return A(typeof cart!=='undefined'?cart:window.cart)}catch(_){return A(window.cart)}}
function customer(){return{name:S(E('cName')?.value).trim(),phone:S(E('cPhone')?.value).trim(),email:S(E('cEmail')?.value).trim(),cpf:S(E('cCpf')?.value).trim()}}
function itemName(x){return S(x?.nome||x?.nomeComercial||x?.descricao||x?.produto?.nome||x?.produtoId||'Item')}
function itemQty(x){return Math.max(0,N(x?.quantidade||x?.qty||1))}
function itemPrice(x){return Math.max(0,N(x?.precoUnitario??x?.preco??x?.valorUnitario))}
function cartData(){
  const c=rows(),who=customer();
  const details=c.map(x=>({productId:S(x?.produtoId||x?.id),name:itemName(x),quantity:itemQty(x),unitPrice:itemPrice(x)}));
  return{...who,total:details.reduce((s,x)=>s+x.quantity*x.unitPrice,0),items:details.reduce((s,x)=>s+x.quantity,0),itemNames:details.map(x=>x.quantity+'x '+x.name).join(', '),itemDetails:details,lastActivityAt:new Date().toISOString()};
}
async function callApi(path,opt={}){
  const fn=window.api||(typeof api==='function'?api:null);
  if(!fn)throw new Error('API da Loja indisponível.');
  return fn('/api/v1/public/store/'+encodeURIComponent(STORE_ID())+path,opt);
}
async function postEvent(type,data={},extra={}){
  try{
    return await callApi('/commerce-events',{method:'POST',keepalive:!!extra.keepalive,body:JSON.stringify({type,sessionId:sessionId(),phone:S(data.phone||customer().phone),orderId:S(extra.orderId||data.orderId||''),data})});
  }catch(e){console.warn('[Engagement] evento '+type,e);return null}
}
function fingerprint(d){return JSON.stringify({phone:d.phone,name:d.name,email:d.email,total:Number(d.total).toFixed(2),items:d.items,itemNames:d.itemNames})}
async function sendSnapshot(force=false,keepalive=false){
  const d=cartData(),now=Date.now();
  if(d.items<=0){
    if(force||lastFingerprint){await postEvent('CART_CLEARED',{...customer(),items:0,total:0},{keepalive});lastFingerprint='';lastSentAt=now}
    return;
  }
  const fp=fingerprint(d);
  if(!force&&fp===lastFingerprint&&now-lastSentAt<15000)return;
  await postEvent('CART_SNAPSHOT',d,{keepalive});
  lastFingerprint=fp;lastSentAt=now;
}
function queueSnapshot(force=false){clearTimeout(snapshotTimer);snapshotTimer=setTimeout(()=>sendSnapshot(force,false),force?120:650)}

function ratedSet(){try{return new Set(JSON.parse(localStorage.getItem(RATED_KEY())||'[]')||[])}catch(_){return new Set()}}
function saveRated(set){try{localStorage.setItem(RATED_KEY(),JSON.stringify([...set].slice(-100)))}catch(_){}}
function successOrderCode(){const text=S(E('checkoutResult')?.textContent);const m=text.match(/Pedido\s+([^\s]+)\s+recebido/i);return m?.[1]||''}
function ensureRatingPrompt(){
  if(cfg?.ratings?.enabled===false)return false;
  const host=E('checkoutResult'),code=successOrderCode();
  if(!host||!code||host.querySelector('#eng961Rating'))return false;
  const rated=ratedSet();if(rated.has(code))return false;
  const c=customer();
  const box=document.createElement('div');box.id='eng961Rating';box.className='eng961-rating';
  box.innerHTML=`<div class="eng961-title">⭐ Como foi sua experiência de compra?</div><div class="eng961-sub">Avalie o processo do pedido no Caseirinho.</div><div class="eng961-stars">${[1,2,3,4,5].map(n=>`<button type="button" data-eng-rating="${n}" aria-label="${n} estrela${n>1?'s':''}">★</button>`).join('')}</div><textarea id="eng961Comment" maxlength="500" placeholder="Conte para nós (opcional)"></textarea><button type="button" id="eng961Send" disabled>Enviar avaliação</button><div id="eng961Status" class="eng961-status"></div>`;
  host.appendChild(box);
  let selected=0;
  box.querySelectorAll('[data-eng-rating]').forEach(b=>b.onclick=()=>{selected=N(b.dataset.engRating);box.querySelectorAll('[data-eng-rating]').forEach(x=>x.classList.toggle('selected',N(x.dataset.engRating)<=selected));E('eng961Send').disabled=!selected});
  E('eng961Send').onclick=async()=>{
    const btn=E('eng961Send');if(!selected||!btn)return;btn.disabled=true;btn.textContent='Enviando...';
    const data={...c,orderId:code,rating:selected,comment:S(E('eng961Comment')?.value).trim(),source:'CHECKOUT'};
    const r=await postEvent('RATING',data,{orderId:code});
    if(r){rated.add(code);saveRated(rated);box.innerHTML='<b>Obrigado! Sua avaliação foi registrada. ⭐</b>'}
    else{btn.disabled=false;btn.textContent='Enviar avaliação';const st=E('eng961Status');if(st)st.textContent='Não foi possível enviar agora. Tente novamente.'}
  };
  return true;
}
function style(){if(E('eng961Style'))return;const s=document.createElement('style');s.id='eng961Style';s.textContent=`
.eng961-rating{margin-top:14px;padding:15px;border:1px solid #ead7dc;border-radius:14px;background:#fffafb;text-align:left}.eng961-title{font-size:17px;font-weight:900;color:#172554}.eng961-sub{font-size:13px;color:#64748b;margin:4px 0 10px}.eng961-stars{display:flex;gap:6px;margin:8px 0}.eng961-stars button{border:1px solid #e2e8f0;background:#fff;color:#cbd5e1;border-radius:9px;font-size:25px;padding:6px 9px;line-height:1;cursor:pointer}.eng961-stars button.selected{color:#f59e0b;background:#fffbeb;border-color:#fcd34d}.eng961-rating textarea{width:100%;min-height:72px;box-sizing:border-box;border:1px solid #cbd5e1;border-radius:9px;padding:9px;margin:6px 0 9px;resize:vertical}.eng961-rating #eng961Send{border:0;border-radius:9px;background:#7b1438;color:#fff;font-weight:900;padding:9px 13px}.eng961-rating #eng961Send:disabled{opacity:.5}.eng961-status{font-size:12px;color:#b91c1c;margin-top:6px}`;document.head.appendChild(s)}

async function refreshConfig(){try{const r=await callApi('/commerce-engine',{cache:'no-store'});cfg={...cfg,...(r?.config||{})}}catch(e){console.warn('[Engagement] configuração',e)}}
function wrapCart(){
  if(window.__ENG961_CART_WRAPPED__)return;const old=window.renderCart;if(typeof old!=='function')return;
  window.__ENG961_CART_WRAPPED__=true;
  window.renderCart=function(){const r=old.apply(this,arguments);queueSnapshot(true);return r};
}
function wrapSubmit(){
  if(window.__ENG961_SUBMIT_WRAPPED__)return;const old=window.submitOrder;if(typeof old!=='function')return;
  window.__ENG961_SUBMIT_WRAPPED__=true;
  window.submitOrder=async function(){
    const before=cartData();
    const r=await old.apply(this,arguments);
    setTimeout(async()=>{
      const code=successOrderCode();
      if(code){await postEvent('ORDER_CREATED',{...before,orderId:code,source:'CHECKOUT'},{orderId:code});await postEvent('CART_CLEARED',{...customer(),items:0,total:0,orderId:code},{orderId:code});lastFingerprint='';ensureRatingPrompt()}
      else queueSnapshot(true);
    },120);
    return r;
  };
  const f=E('checkout');if(f)f.onsubmit=window.submitOrder;
}
function bindIdentity(){
  ['cName','cPhone','cEmail','cCpf'].forEach(id=>{const el=E(id);if(!el||el.dataset.eng961Bound==='1')return;el.dataset.eng961Bound='1';el.addEventListener('input',()=>{if(rows().length)queueSnapshot(false)});el.addEventListener('change',()=>{if(rows().length)queueSnapshot(true)})});
}
function install(){style();wrapCart();wrapSubmit();bindIdentity();if(rows().length)queueSnapshot(true);ensureRatingPrompt()}

refreshConfig().finally(()=>{install();[300,900,1800,3500].forEach(ms=>setTimeout(install,ms))});
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden'&&rows().length)sendSnapshot(true,true)});
window.addEventListener('pagehide',()=>{if(rows().length)sendSnapshot(true,true)});
const obs=new MutationObserver(()=>{wrapCart();wrapSubmit();bindIdentity();ensureRatingPrompt()});obs.observe(document.documentElement,{childList:true,subtree:true});
window.CaseirinhoEngagement961={snapshot:()=>sendSnapshot(true,false),rating:ensureRatingPrompt,refreshConfig};
})();
