(()=>{'use strict';
if(window.__CASEIRINHO_CASHBACK_ORDER_YIELD_964__)return;
window.__CASEIRINHO_CASHBACK_ORDER_YIELD_964__=true;

const CFG=window.CASEIRINHO_CONFIG||{};
const STORE=String(new URLSearchParams(location.search).get('empresa')||new URLSearchParams(location.search).get('loja')||CFG.storeSlug||'caseirinho').trim().toLowerCase();
const ORDERS_KEY='john_store_'+STORE+'_orders_v1';
const S=v=>String(v??'');
const N=v=>Number(v)||0;
const money=v=>N(v).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});

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

function findOrderForCard(card,orders){
  const text=S(card?.textContent);
  return orders.find(o=>S(o?.codigo||o?.code).trim()&&text.includes(S(o.codigo||o.code).trim()))||null;
}

function decorate(){
  injectStyle();
  const root=document.getElementById('simpleBody');
  if(!root)return;
  const cards=[...root.querySelectorAll('.order-card')];
  if(!cards.length)return;
  const orders=readOrders();

  for(const card of cards){
    const order=findOrderForCard(card,orders);
    const existing=card.querySelector('.cashback-order-yield');
    if(!order){existing?.remove();continue}
    const field=fieldFor(order);
    if(!field){existing?.remove();continue}
    const grid=card.querySelector('.order-customer-grid');
    if(!grid)continue;
    const box=existing||document.createElement('div');
    box.className='cashback-order-yield '+field.className;
    box.innerHTML=`<small>${field.label}</small><b>${field.value}</b>`;
    if(!existing)grid.appendChild(box);
  }
}

function init(){
  injectStyle();
  decorate();
  const root=document.getElementById('simpleBody')||document.body;
  new MutationObserver(()=>decorate()).observe(root,{subtree:true,childList:true});
  window.addEventListener('storage',e=>{if(e.key===ORDERS_KEY)decorate()});
  document.getElementById('navOrders')?.addEventListener('click',()=>setTimeout(decorate,120));
  setInterval(decorate,2500);
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
window.CaseirinhoCashbackOrderYield964={decorate,fieldFor};
})();
