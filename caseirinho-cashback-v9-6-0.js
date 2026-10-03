(()=>{'use strict';
if(window.__CASEIRINHO_CASHBACK_960__)return;window.__CASEIRINHO_CASHBACK_960__=true;

const CFG=window.CASEIRINHO_CONFIG||{};
const API=String(CFG.apiUrl||'').replace(/\/+$/,'');
const STORE=String(new URLSearchParams(location.search).get('empresa')||new URLSearchParams(location.search).get('loja')||CFG.storeSlug||'caseirinho').trim().toLowerCase();
const KEY='john_store_'+STORE+'_cashback_v1';
const previousFetch=window.fetch.bind(window);

const S=v=>String(v??'');
const N=v=>Number(v)||0;
const round2=v=>Math.round((N(v)+Number.EPSILON)*100)/100;
const money=v=>N(v).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const phone=v=>{let d=S(v).replace(/\D/g,'');if(d.startsWith('55')&&d.length>11)d=d.slice(2);return d.slice(-11)};
const doc=v=>S(v).replace(/\D/g,'');
function parseMoney(v){const s=S(v).replace(/\s/g,'').replace(/R\$/gi,'').replace(/\./g,'').replace(',','.').replace(/[^0-9.-]/g,'');const n=Number(s);return Number.isFinite(n)?n:0}
function readState(){try{return JSON.parse(localStorage.getItem(KEY)||'null')}catch(_){return null}}
function saveState(v){try{localStorage.setItem(KEY,JSON.stringify(v))}catch(_){}renderAll()}
function removeState(){try{localStorage.removeItem(KEY)}catch(_){}renderAll()}
function customer(){return{phone:phone(document.getElementById('cPhone')?.value),cpf:doc(document.getElementById('cCpf')?.value),name:S(document.getElementById('cName')?.value).trim()}}
function validIdentity(c=customer()){return c.phone.length>=10||c.cpf.length>=11}
function newOrderRef(){try{return 'cashback-'+crypto.randomUUID()}catch(_){return 'cashback-'+Date.now()+'-'+Math.random().toString(36).slice(2)}}
function couponDiscount(){const row=document.getElementById('coupon958DiscountRow');if(!row||row.hidden)return 0;return Math.max(0,parseMoney(document.getElementById('coupon958DiscountValue')?.textContent||''))}
function subtotal(){return Math.max(0,parseMoney(document.getElementById('subtotal')?.textContent||''))}
function eligibleProducts(){return round2(Math.max(0,subtotal()-couponDiscount()))}
function shipping(){const el=document.getElementById('shipping'),txt=S(el?.textContent);return{pending:/cot|pend/i.test(txt),value:parseMoney(txt)}}
function expired(st){return !!(st?.expiresAt&&new Date(st.expiresAt).getTime()<=Date.now())}
function activeReservation(st=readState()){return !!(st?.reservationId&&st.status==='ACTIVE'&&!expired(st)&&N(st.reservedAmount)>0)}
function effectiveUse(st=readState()){return activeReservation(st)?round2(Math.min(N(st.reservedAmount),eligibleProducts())):0}
function setStatus(text,type=''){const el=document.getElementById('cashback960Status');if(!el)return;el.className='cashback960-status '+type;el.textContent=text}

async function api(path,opt={}){
  const r=await previousFetch(API+path+(path.includes('?')?'&':'?')+'_t='+Date.now(),{
    cache:'no-store',...opt,headers:{'Content-Type':'application/json','Cache-Control':'no-cache',...(opt.headers||{})}
  });
  let data={};try{data=await r.json()}catch(_){}
  if(!r.ok){const e=new Error(data.error||('Erro HTTP '+r.status));e.status=data.status||'';e.data=data;throw e}
  return data;
}

function injectStyle(){
  if(document.getElementById('cashback960Style'))return;
  const s=document.createElement('style');s.id='cashback960Style';s.textContent=`
  .cashback960-box{margin:14px 0;padding:14px;border:1px solid #d7e8df;border-radius:16px;background:#f5fbf7;display:none}
  .cashback960-box.show{display:block}.cashback960-title{font-weight:900;color:#14532d;font-size:16px;margin-bottom:4px}
  .cashback960-balance{font-size:13px;color:#365b47;line-height:1.45}.cashback960-balance b{font-size:19px;color:#166534}
  .cashback960-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}.cashback960-actions button{border:0;border-radius:12px;padding:9px 12px;font-weight:800;cursor:pointer}
  .cashback960-use{background:#166534;color:#fff}.cashback960-skip{background:#e7f3eb;color:#14532d}.cashback960-release{background:#fee2e2;color:#991b1b}
  .cashback960-status{font-size:12.5px;line-height:1.4;margin-top:8px}.cashback960-status.ok{color:#166534}.cashback960-status.warn{color:#92400e}.cashback960-status.err{color:#991b1b}.cashback960-status.loading{color:#475569}
  #cashback960DiscountRow{color:#166534;font-weight:800}#cashback960DiscountRow[hidden]{display:none!important}
  `;document.head.appendChild(s)
}

function mount(){
  injectStyle();
  if(document.getElementById('cashback960Box'))return;
  const box=document.createElement('section');box.id='cashback960Box';box.className='cashback960-box';box.innerHTML=`
    <div class="cashback960-title">💰 Cashback Caseirinho</div>
    <div class="cashback960-balance" id="cashback960Balance"></div>
    <div class="cashback960-actions" id="cashback960Actions"></div>
    <div class="cashback960-status" id="cashback960Status"></div>`;
  const coupon=document.getElementById('coupon958Box');
  if(coupon)coupon.insertAdjacentElement('afterend',box);
  else document.getElementById('deliveryBox')?.insertAdjacentElement('beforebegin',box);
  renderBox();renderTotals();
}

function renderBox(){
  const box=document.getElementById('cashback960Box');if(!box)return;
  const st=readState(),balance=document.getElementById('cashback960Balance'),actions=document.getElementById('cashback960Actions');
  if(!st||st.enabled===false||(!N(st.available)&&!activeReservation(st))){box.classList.remove('show');return}
  box.classList.add('show');
  if(activeReservation(st)){
    const use=effectiveUse(st);
    balance.innerHTML=`Você escolheu usar <b>${money(use)}</b> de cashback nesta compra.<br><small>O valor será confirmado pelo ERP ao finalizar o pedido.</small>`;
    actions.innerHTML='<button type="button" class="cashback960-release" id="cashback960Release">Não usar cashback</button>';
    document.getElementById('cashback960Release').onclick=releaseReservation;
    if(expired(st))setStatus('A reserva expirou. Consulte o saldo novamente para utilizar cashback.','warn');
    return;
  }
  balance.innerHTML=`Você possui <b>${money(st.available)}</b> de cashback disponível.<br>Deseja utilizar nesta compra?`;
  actions.innerHTML='<button type="button" class="cashback960-use" id="cashback960Use">Usar cashback</button><button type="button" class="cashback960-skip" id="cashback960Skip">Agora não</button>';
  document.getElementById('cashback960Use').onclick=reserveCashback;
  document.getElementById('cashback960Skip').onclick=()=>{saveState({...st,declined:true});setStatus('Cashback não será usado nesta compra.','')};
}

let rendering=false;
function renderTotals(){
  if(rendering)return;rendering=true;
  try{
    const totals=document.querySelector('.totals'),grand=document.getElementById('grandTotal');if(!totals||!grand)return;
    let row=document.getElementById('cashback960DiscountRow');
    if(!row){row=document.createElement('div');row.id='cashback960DiscountRow';row.innerHTML='<span>💰 Cashback utilizado</span><b id="cashback960DiscountValue">- R$ 0,00</b>';totals.insertBefore(row,totals.querySelector('.grand')||null)}
    const use=effectiveUse(),ship=shipping(),sub=subtotal(),coupon=couponDiscount();
    row.hidden=use<=0;
    const value=document.getElementById('cashback960DiscountValue');if(value)value.textContent='- '+money(use);
    const productsAfter=Math.max(0,sub-coupon-use),total=round2(productsAfter+ship.value);
    const target=ship.pending?money(productsAfter)+' + frete':money(total);
    if(grand.textContent!==target)grand.textContent=target;
  }finally{rendering=false}
}
function renderAll(){mount();renderBox();renderTotals()}

let queryTimer=0,lastIdentity='';
async function queryBalance(force=false){
  const c=customer();if(!validIdentity(c))return;
  const key=c.phone+'|'+c.cpf;if(!force&&key===lastIdentity)return;lastIdentity=key;
  mount();setStatus('Consultando seu cashback...','loading');
  try{
    const data=await api('/api/v1/public/store/'+encodeURIComponent(STORE)+'/cashback/balance',{method:'POST',body:JSON.stringify(c)});
    const old=readState();
    if(old&&activeReservation(old)&&old.phone===c.phone){renderAll();return}
    if(!data.enabled){removeState();return}
    saveState({enabled:true,phone:c.phone,cpf:c.cpf,available:N(data.available),balance:N(data.balance),reserved:N(data.reserved),percentage:N(data.percentage),maxRedemptionPercent:N(data.maxRedemptionPercent)||100,status:'BALANCE',checkedAt:new Date().toISOString()});
    setStatus(N(data.available)>0?'Saldo confirmado pelo ERP.':'Você ainda não possui cashback disponível.','ok');
  }catch(e){
    console.warn('[CASHBACK 9.6.0] saldo indisponível',e);removeState();mount();
    const box=document.getElementById('cashback960Box');if(box){box.classList.add('show');document.getElementById('cashback960Balance').textContent='Cashback temporariamente indisponível.';document.getElementById('cashback960Actions').innerHTML=''}
    setStatus('Sem comunicação com o ERP, o uso de cashback fica bloqueado para evitar divergência de saldo.','warn');
  }
}

async function reserveCashback(){
  const st=readState(),c=customer();if(!st||N(st.available)<=0||!validIdentity(c))return;
  const orderAmount=eligibleProducts();if(orderAmount<=0)return setStatus('Adicione produtos ao carrinho antes de usar o cashback.','warn');
  const maxByOrder=round2(orderAmount*(N(st.maxRedemptionPercent)||100)/100),wanted=round2(Math.min(N(st.available),maxByOrder));
  if(wanted<=0)return setStatus('Não há valor elegível para usar nesta compra.','warn');
  setStatus('Reservando seu cashback no ERP...','loading');
  const orderRef=st.orderRef||newOrderRef();
  try{
    const data=await api('/api/v1/public/store/'+encodeURIComponent(STORE)+'/cashback/reservations',{method:'POST',body:JSON.stringify({...c,amount:wanted,orderAmount,orderRef,idempotencyKey:'STORE:'+orderRef})});
    saveState({...st,...c,orderRef,reservationId:data.reservationId,reservedAmount:N(data.amount),expiresAt:data.expiresAt,status:'ACTIVE',declined:false});
    setStatus('Cashback reservado. O desconto será confirmado ao finalizar o pedido.','ok');
  }catch(e){
    console.warn('[CASHBACK 9.6.0] reserva recusada',e);setStatus(e.message||'Não foi possível reservar o cashback.','err');
    await queryBalance(true).catch(()=>{});
  }
}

async function releaseReservation(){
  const st=readState();if(!st?.reservationId){removeState();return}
  setStatus('Liberando a reserva...','loading');
  try{await api('/api/v1/public/store/'+encodeURIComponent(STORE)+'/cashback/reservations/'+encodeURIComponent(st.reservationId)+'/release',{method:'POST',body:JSON.stringify({orderRef:st.orderRef})})}catch(e){console.warn('[CASHBACK 9.6.0] liberação pendente',e)}
  const available=round2(N(st.available)+N(st.reservedAmount));
  saveState({enabled:true,phone:st.phone,cpf:st.cpf,available,balance:Math.max(N(st.balance),available),percentage:st.percentage,maxRedemptionPercent:st.maxRedemptionPercent,status:'BALANCE'});
  setStatus('Cashback não será usado nesta compra.','');
}

function watchCustomer(){
  const p=document.getElementById('cPhone'),cpf=document.getElementById('cCpf'),name=document.getElementById('cName');
  const onChange=()=>{
    const c=customer(),st=readState();
    if(st&&activeReservation(st)&&st.phone&&c.phone!==st.phone){releaseReservation().catch(()=>{});lastIdentity=''}
    clearTimeout(queryTimer);queryTimer=setTimeout(()=>queryBalance(false),550);
  };
  p?.addEventListener('input',onChange);p?.addEventListener('blur',()=>queryBalance(true));
  cpf?.addEventListener('input',onChange);cpf?.addEventListener('blur',()=>queryBalance(true));
  name?.addEventListener('blur',()=>queryBalance(false));
  if(validIdentity())setTimeout(()=>queryBalance(true),650);
}
function watchTotals(){
  const totals=document.querySelector('.totals');if(!totals)return;
  const obs=new MutationObserver(()=>{clearTimeout(watchTotals.t);watchTotals.t=setTimeout(()=>{renderTotals();renderBox()},0)});
  obs.observe(totals,{childList:true,characterData:true,subtree:true});
}

function stateForOrder(){const st=readState();if(!activeReservation(st))return null;const c=customer();if(st.phone&&c.phone!==st.phone)return null;return st}
window.fetch=async function(input,opt={}){
  const method=S(opt?.method||(input instanceof Request?input.method:'GET')).toUpperCase();
  const raw=typeof input==='string'?input:input?.url;let url;try{url=new URL(raw,location.href)}catch(_){return previousFetch(input,opt)}
  const orderPath=new RegExp('/api/v1/public/store/'+STORE.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'/orders/?$','i');
  const cashback=method==='POST'&&orderPath.test(url.pathname)?stateForOrder():null;
  const response=await previousFetch(input,opt);
  if(!cashback||!response.ok)return response;
  try{
    const created=await response.clone().json();if(!created?.id||!created?.publicToken)return response;
    const r=await previousFetch(API+'/api/v1/public/store/'+encodeURIComponent(STORE)+'/orders/'+encodeURIComponent(created.id)+'/cashback/confirm?_t='+Date.now(),{method:'POST',cache:'no-store',headers:{'Content-Type':'application/json','Cache-Control':'no-cache'},body:JSON.stringify({token:created.publicToken,reservationId:cashback.reservationId})});
    let data={};try{data=await r.json()}catch(_){}
    if(!r.ok){setStatus(data.error||'O cashback não pôde ser confirmado. O pedido foi criado sem baixa do benefício.','err');return response}
    removeState();lastIdentity='';
    const body={...created,...data,total:N(data.total),cashback:{used:N(data.cashbackUsed),available:N(data.available),generatedEstimate:N(data.cashbackGeneratedEstimate),percentage:N(data.percentage)}};
    const headers=new Headers(response.headers);headers.set('Content-Type','application/json');headers.delete('content-length');
    return new Response(JSON.stringify(body),{status:response.status,statusText:response.statusText,headers});
  }catch(e){console.warn('[CASHBACK 9.6.0] confirmação pós-pedido falhou',e);return response}
};

function init(){mount();watchCustomer();watchTotals();renderAll()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else setTimeout(init,0);
window.CaseirinhoCashback960={queryBalance,reserveCashback,releaseReservation,renderTotals,readState,effectiveUse};
})();
