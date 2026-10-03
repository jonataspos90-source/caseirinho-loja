(()=>{'use strict';
if(window.__CASEIRINHO_CASHBACK_ORDER_YIELD_964__)return;
window.__CASEIRINHO_CASHBACK_ORDER_YIELD_964__=true;

const CFG=window.CASEIRINHO_CONFIG||{};
const STORE=String(new URLSearchParams(location.search).get('empresa')||new URLSearchParams(location.search).get('loja')||CFG.storeSlug||'caseirinho').trim().toLowerCase();
const ORDERS_KEY='john_store_'+STORE+'_orders_v1';
const S=v=>String(v??'');
const N=v=>Number(v)||0;
const money=v=>N(v).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
let scheduled=false;

function readOrders(){try{const x=JSON.parse(localStorage.getItem(ORDERS_KEY)||'[]');return Array.isArray(x)?x:[]}catch(_){return[]}}
function cashbackValue(o,key,fallback){return N(o?.[key]??o?.cashback?.[fallback])}
function cashbackStatus(o){return S(o?.cashbackStatus||o?.cashback?.status).trim().toUpperCase()}

function injectStyle(){
  if(document.getElementById('cashbackOrderYield964Style'))return;
  const s=document.createElement('style');
  s.id='cashbackOrderYield964Style';
  s.textContent=`
    .cashback-order-yield{background:#ecfdf5!important;border:1px solid #86efac!important}
    .cashback-order-yield small{color:#166534!important}
    .cashback-order-yield b{color:#14532d!important}
    .cashback-order-yield.pending{background:#fff7ed!important;border-color:#fed7aa!important}
    .cashback-order-yield.pending small,.cashback-order-yield.pending b{color:#9a3412!important}
    .cashback-order-yield.reversed{background:#fff1f2!important;border-color:#fecdd3!important}
    .cashback-order-yield.reversed small,.cashback-order-yield.reversed b{color:#9f1239!important}
  `;
  document.head.appendChild(s);
}

function fieldFor(o){
  const status=cashbackStatus(o);
  const generated=cashbackValue(o,'cashbackGerado','gerado');
  const predicted=cashbackValue(o,'cashbackPrevisto','previsto');
  const reversed=cashbackValue(o,'cashbackEstornado','estornado');
  if(generated>0||status==='GERADO')return{label:'Cashback gerado',value:'+'+money(generated),className:''};
  if(status==='ESTORNADO'&&reversed>0)return{label:'Cashback estornado',value:money(reversed),className:'reversed'};
  if(['AGUARDANDO_CONCLUSAO','AGUARDANDO_CREDITO'].includes(status)&&predicted>0){
    return{label:status==='AGUARDANDO_CREDITO'?'Cashback processando':'Cashback previsto',value:money(predicted),className:'pending'};
  }
  return null;
}

function orderMap(){
  const map=new Map();
  for(const o of readOrders()){
    const code=S(o?.codigo||o?.code).trim();
    if(code)map.set(code,o);
  }
  return map;
}

function findOrderForCard(card,map){
  const text=S(card?.textContent);
  for(const [code,order] of map){if(text.includes(code))return order}
  return null;
}

function ordersViewOpen(){
  const overlay=document.getElementById('simpleOverlay');
  const title=S(document.getElementById('simpleTitle')?.textContent).trim().toLowerCase();
  return !!(overlay?.classList.contains('open')&&title.includes('pedid'));
}

function decorate(){
  scheduled=false;
  if(!ordersViewOpen())return;
  const root=document.getElementById('ordersCardsArea');
  if(!root)return;
  const cards=[...root.querySelectorAll('.order-card')];
  if(!cards.length)return;
  const map=orderMap();

  for(const card of cards){
    const order=findOrderForCard(card,map);
    const existing=card.querySelector('.cashback-order-yield');
    const field=order?fieldFor(order):null;
    if(!field){if(existing)existing.remove();continue}
    const grid=card.querySelector('.order-customer-grid');
    if(!grid)continue;
    const sig=[field.label,field.value,field.className].join('|');
    if(existing?.dataset?.renderSig===sig)continue;
    const box=existing||document.createElement('div');
    box.className=('cashback-order-yield '+field.className).trim();
    box.dataset.renderSig=sig;
    box.innerHTML=`<small>${field.label}</small><b>${field.value}</b>`;
    if(!existing)grid.appendChild(box);
  }
}

function scheduleDecorate(){
  if(scheduled)return;
  scheduled=true;
  const run=()=>requestAnimationFrame(decorate);
  if('requestIdleCallback'in window)requestIdleCallback(run,{timeout:250});else setTimeout(run,30);
}

function relevantMutation(mutations){
  return mutations.some(m=>{
    const target=m.target instanceof Element?m.target:m.target?.parentElement;
    if(target?.closest?.('.cashback-order-yield'))return false;
    return [...m.addedNodes,...m.removedNodes].some(n=>{
      if(!(n instanceof Element))return false;
      return n.matches?.('.order-card,#ordersCardsArea')||!!n.querySelector?.('.order-card,#ordersCardsArea');
    });
  });
}

function init(){
  injectStyle();
  const root=document.getElementById('simpleBody');
  if(root){
    new MutationObserver(m=>{if(relevantMutation(m))scheduleDecorate()}).observe(root,{subtree:true,childList:true});
  }
  window.addEventListener('storage',e=>{if(e.key===ORDERS_KEY)scheduleDecorate()});
  document.getElementById('navOrders')?.addEventListener('click',()=>setTimeout(scheduleDecorate,80));
  document.getElementById('openSavedOrders')?.addEventListener('click',()=>setTimeout(scheduleDecorate,80));
  scheduleDecorate();
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
window.CaseirinhoCashbackOrderYield964={decorate:scheduleDecorate,fieldFor};
})();
