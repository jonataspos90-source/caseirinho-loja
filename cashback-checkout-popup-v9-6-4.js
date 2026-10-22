(()=>{'use strict';
if(window.__CASEIRINHO_CASHBACK_CHECKOUT_964__)return;
window.__CASEIRINHO_CASHBACK_CHECKOUT_964__=true;

const CFG=window.CASEIRINHO_CONFIG||{};
const API=String(CFG.apiUrl||'').replace(/\/+$/,'');
const STORE=String(new URLSearchParams(location.search).get('empresa')||new URLSearchParams(location.search).get('loja')||CFG.storeSlug||'caseirinho').trim().toLowerCase();
const KEY='john_store_'+STORE+'_cashback_v1';
const S=v=>String(v??'');
const N=v=>Number(v)||0;
const round2=v=>Math.round((N(v)+Number.EPSILON)*100)/100;
const money=v=>N(v).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const phone=v=>{let d=S(v).replace(/\D/g,'');if(d.startsWith('55')&&d.length>11)d=d.slice(2);return d.slice(-11)};
const doc=v=>S(v).replace(/\D/g,'');
let bypassOnce=false;
let checking=false;
let submitterToResume=null;

function parseMoney(v){
  const s=S(v).replace(/\s/g,'').replace(/R\$/gi,'').replace(/\./g,'').replace(',','.').replace(/[^0-9.-]/g,'');
  const n=Number(s);return Number.isFinite(n)?n:0;
}
function readState(){
  try{return window.CaseirinhoCashback960?.readState?.()||JSON.parse(localStorage.getItem(KEY)||'null')}catch(_){return null}
}
function writeState(v){
  try{localStorage.setItem(KEY,JSON.stringify(v))}catch(_){}
}
function customer(){
  return{
    phone:phone(document.getElementById('cPhone')?.value),
    cpf:doc(document.getElementById('cCpf')?.value),
    name:S(document.getElementById('cName')?.value).trim()
  };
}
function validIdentity(c=customer()){return c.phone.length>=10||c.cpf.length>=11}
function subtotal(){return Math.max(0,parseMoney(document.getElementById('subtotal')?.textContent||''))}
function couponDiscount(){
  const row=document.getElementById('coupon958DiscountRow');
  if(!row||row.hidden)return 0;
  return Math.max(0,parseMoney(document.getElementById('coupon958DiscountValue')?.textContent||''));
}
function eligibleProducts(){return round2(Math.max(0,subtotal()-couponDiscount()))}
function expired(st){return !!(st?.expiresAt&&new Date(st.expiresAt).getTime()<=Date.now())}
function activeReservation(st=readState()){return !!(st?.reservationId&&st.status==='ACTIVE'&&!expired(st)&&N(st.reservedAmount)>0)}
function maxUsable(st=readState()){
  if(!st)return 0;
  const order=eligibleProducts();
  const pct=Math.max(0,N(st.maxRedemptionPercent)||100);
  return round2(Math.min(Math.max(0,N(st.available)),order*pct/100,order));
}
function newOrderRef(){
  try{return 'cashback-'+crypto.randomUUID()}catch(_){return 'cashback-'+Date.now()+'-'+Math.random().toString(36).slice(2)}
}
async function api(path,opt={}){
  const r=await fetch(API+path+(path.includes('?')?'&':'?')+'_t='+Date.now(),{
    cache:'no-store',...opt,headers:{'Content-Type':'application/json','Cache-Control':'no-cache',...(opt.headers||{})}
  });
  let data={};try{data=await r.json()}catch(_){}
  if(!r.ok)throw new Error(data.error||('Erro HTTP '+r.status));
  return data;
}

function injectStyle(){
  if(document.getElementById('cashbackCheckout964Style'))return;
  const s=document.createElement('style');s.id='cashbackCheckout964Style';s.textContent=`
    .cashback964-overlay{position:fixed;inset:0;z-index:260;background:#111827a8;backdrop-filter:blur(8px);display:none;place-items:center;padding:16px}
    .cashback964-overlay.open{display:grid}
    .cashback964-card{width:min(500px,100%);max-height:min(92vh,760px);overflow:auto;background:#fff;border-radius:26px;box-shadow:0 30px 100px #0005;border:1px solid #e5e7eb;padding:22px}
    .cashback964-head{display:flex;align-items:flex-start;justify-content:space-between;gap:14px}.cashback964-head h2{margin:0;color:#14532d;font-size:24px;line-height:1.15}.cashback964-head p{margin:6px 0 0;color:#64748b;font-size:13px;line-height:1.45}.cashback964-close{border:1px solid #e5e7eb;background:#f8fafc;color:#17223b;border-radius:12px;padding:8px 11px;font-weight:850;cursor:pointer}
    .cashback964-balance{margin:18px 0 12px;padding:18px;border:1px solid #86efac;border-radius:18px;background:linear-gradient(135deg,#ecfdf5,#f0fdf4);text-align:center}.cashback964-balance small{display:block;color:#166534;font-weight:850}.cashback964-balance strong{display:block;margin-top:4px;color:#14532d;font-size:34px;line-height:1.05}
    .cashback964-grid{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin:0 0 14px}.cashback964-stat{padding:11px 12px;border:1px solid #e5e7eb;border-radius:14px;background:#f8fafc}.cashback964-stat span{display:block;color:#64748b;font-size:10px;font-weight:850;text-transform:uppercase;letter-spacing:.02em}.cashback964-stat b{display:block;margin-top:4px;color:#17223b;font-size:14px}
    .cashback964-field{display:grid;gap:7px;margin-top:6px;color:#17223b;font-size:13px;font-weight:900}.cashback964-input-row{display:flex;gap:8px}.cashback964-input{flex:1;min-width:0;border:1px solid #cbd5e1;border-radius:14px;padding:13px 14px;font-size:20px;font-weight:900;color:#14532d;outline:none}.cashback964-input:focus{border-color:#22c55e;box-shadow:0 0 0 4px #22c55e1f}.cashback964-max{border:0;border-radius:14px;padding:10px 13px;background:#dcfce7;color:#14532d;font-weight:900;cursor:pointer;white-space:nowrap}
    .cashback964-hint{margin-top:8px;color:#64748b;font-size:11px;line-height:1.45}.cashback964-note{margin-top:12px;padding:11px 12px;border-radius:13px;background:#fff7ed;border:1px solid #fed7aa;color:#9a3412;font-size:11.5px;line-height:1.45}.cashback964-note[hidden]{display:none!important}
    .cashback964-status{min-height:19px;margin-top:10px;color:#64748b;font-size:12px;font-weight:700}.cashback964-status.err{color:#b4233c}.cashback964-status.ok{color:#166534}.cashback964-status.loading{color:#475569}
    .cashback964-actions{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:15px}.cashback964-actions button{border:0;border-radius:14px;padding:13px 14px;font-weight:950;cursor:pointer}.cashback964-back{background:#f1f5f9;color:#334155}.cashback964-skip{background:#e7f3eb;color:#14532d}.cashback964-apply{grid-column:1/-1;background:#14532d;color:#fff;font-size:15px}.cashback964-actions button:disabled{opacity:.55;cursor:wait}
    @media(max-width:520px){.cashback964-card{padding:18px;border-radius:22px}.cashback964-head h2{font-size:21px}.cashback964-balance strong{font-size:30px}.cashback964-grid{grid-template-columns:1fr}.cashback964-input-row{display:grid;grid-template-columns:1fr}.cashback964-actions{grid-template-columns:1fr}.cashback964-apply{grid-column:auto}}
  `;document.head.appendChild(s);
}

function mount(){
  if(document.getElementById('cashbackCheckout964Overlay'))return;
  injectStyle();
  const ov=document.createElement('div');ov.id='cashbackCheckout964Overlay';ov.className='cashback964-overlay';ov.setAttribute('aria-hidden','true');
  ov.innerHTML=`
    <section class="cashback964-card" role="dialog" aria-modal="true" aria-labelledby="cashbackCheckout964Title">
      <div class="cashback964-head">
        <div><h2 id="cashbackCheckout964Title">💰 Você tem cashback!</h2><p>Antes de finalizar, escolha quanto do seu saldo deseja utilizar neste pedido.</p></div>
        <button type="button" class="cashback964-close" id="cashbackCheckout964Close">Fechar</button>
      </div>
      <div class="cashback964-balance"><small>Saldo disponível</small><strong id="cashbackCheckout964Balance">R$ 0,00</strong></div>
      <div class="cashback964-grid">
        <div class="cashback964-stat"><span>Valor dos produtos</span><b id="cashbackCheckout964Order">R$ 0,00</b></div>
        <div class="cashback964-stat"><span>Máximo neste pedido</span><b id="cashbackCheckout964Max">R$ 0,00</b></div>
      </div>
      <label class="cashback964-field">Quanto deseja usar?
        <div class="cashback964-input-row">
          <input id="cashbackCheckout964Amount" class="cashback964-input" inputmode="decimal" autocomplete="off" placeholder="Ex.: 10,00" aria-label="Valor de cashback a utilizar">
          <button type="button" class="cashback964-max" id="cashbackCheckout964UseMax">Usar máximo</button>
        </div>
      </label>
      <div class="cashback964-hint">Você pode usar somente uma parte do saldo. O restante continuará disponível para uma próxima compra.</div>
      <div class="cashback964-note" id="cashbackCheckout964Coupon" hidden>Existe um cupom aplicado neste pedido. Cashback e cupom não são cumulativos no mesmo pedido. Para usar o cashback, volte ao carrinho e retire o cupom.</div>
      <div class="cashback964-status" id="cashbackCheckout964Status"></div>
      <div class="cashback964-actions">
        <button type="button" class="cashback964-back" id="cashbackCheckout964Back">Voltar e revisar</button>
        <button type="button" class="cashback964-skip" id="cashbackCheckout964Skip">Não usar agora</button>
        <button type="button" class="cashback964-apply" id="cashbackCheckout964Apply">Aplicar cashback e continuar</button>
      </div>
    </section>`;
  document.body.appendChild(ov);
  document.getElementById('cashbackCheckout964Close').onclick=closePopup;
  document.getElementById('cashbackCheckout964Back').onclick=closePopup;
  document.getElementById('cashbackCheckout964Skip').onclick=skipAndContinue;
  document.getElementById('cashbackCheckout964Apply').onclick=applyAndContinue;
  document.getElementById('cashbackCheckout964UseMax').onclick=()=>{
    const st=readState();document.getElementById('cashbackCheckout964Amount').value=maxUsable(st).toFixed(2).replace('.',',');
    setPopupStatus('');
  };
  document.getElementById('cashbackCheckout964Amount').addEventListener('input',()=>setPopupStatus(''));
  ov.addEventListener('click',e=>{if(e.target===ov)closePopup()});
}
function setPopupStatus(text,type=''){
  const el=document.getElementById('cashbackCheckout964Status');if(!el)return;el.className='cashback964-status '+type;el.textContent=text;
}
function openPopup(st){
  mount();
  const available=Math.max(0,N(st?.available)),order=eligibleProducts(),max=maxUsable(st),hasCoupon=couponDiscount()>0;
  document.getElementById('cashbackCheckout964Balance').textContent=money(available);
  document.getElementById('cashbackCheckout964Order').textContent=money(order);
  document.getElementById('cashbackCheckout964Max').textContent=money(max);
  document.getElementById('cashbackCheckout964Amount').value=max>0?max.toFixed(2).replace('.',','):'';
  document.getElementById('cashbackCheckout964Coupon').hidden=!hasCoupon;
  const input=document.getElementById('cashbackCheckout964Amount'),maxBtn=document.getElementById('cashbackCheckout964UseMax'),apply=document.getElementById('cashbackCheckout964Apply');
  input.disabled=hasCoupon||max<=0;maxBtn.disabled=hasCoupon||max<=0;apply.disabled=hasCoupon||max<=0;
  document.getElementById('cashbackCheckout964Skip').textContent=hasCoupon?'Continuar com o cupom':'Não usar agora';
  setPopupStatus(hasCoupon?'Seu saldo continua guardado para outra compra ou para este pedido após retirar o cupom.':'','');
  const ov=document.getElementById('cashbackCheckout964Overlay');ov.classList.add('open');ov.setAttribute('aria-hidden','false');
  document.body.style.overflow='hidden';
  if(!hasCoupon)setTimeout(()=>input.focus(),80);
}
function closePopup(){
  const ov=document.getElementById('cashbackCheckout964Overlay');if(!ov)return;ov.classList.remove('open');ov.setAttribute('aria-hidden','true');document.body.style.overflow='';
}
function setBusy(on){
  ['cashbackCheckout964Skip','cashbackCheckout964Apply','cashbackCheckout964Back','cashbackCheckout964Close','cashbackCheckout964UseMax'].forEach(id=>{const b=document.getElementById(id);if(b)b.disabled=!!on});
  const input=document.getElementById('cashbackCheckout964Amount');if(input)input.disabled=!!on||couponDiscount()>0;
}
function resumeCheckout(){
  const form=document.getElementById('checkout');if(!form)return;
  closePopup();
  bypassOnce=true;
  const submitter=submitterToResume&&submitterToResume.form===form?submitterToResume:form.querySelector('[type="submit"]');
  try{form.requestSubmit(submitter||undefined)}catch(_){
    bypassOnce=false;
    try{submitter?.click()}catch(__){}
  }
}
function skipAndContinue(){
  const st=readState();if(st)writeState({...st,declined:true,declinedAt:new Date().toISOString()});
  resumeCheckout();
}

async function refreshBalance(){
  try{
    if(window.CaseirinhoCashback960?.queryBalance)await window.CaseirinhoCashback960.queryBalance(true);
  }catch(e){console.warn('[Cashback checkout 9.6.4] consulta de saldo',e)}
  return readState();
}
async function applyAndContinue(){
  const st=readState(),c=customer();
  if(!st||N(st.available)<=0)return setPopupStatus('Seu saldo não está mais disponível. Atualize e tente novamente.','err');
  if(!validIdentity(c))return setPopupStatus('Informe um WhatsApp válido ou CPF antes de usar o cashback.','err');
  if(couponDiscount()>0)return setPopupStatus('Retire o cupom para utilizar o cashback neste pedido.','err');
  const orderAmount=eligibleProducts(),max=maxUsable(st),raw=document.getElementById('cashbackCheckout964Amount')?.value;
  const amount=round2(parseMoney(raw));
  if(amount<=0)return setPopupStatus('Informe quanto de cashback deseja utilizar.','err');
  if(amount>max+.001)return setPopupStatus('O máximo disponível para este pedido é '+money(max)+'.','err');
  const orderRef=st.orderRef||newOrderRef();
  setBusy(true);setPopupStatus('Reservando '+money(amount)+' no seu saldo...','loading');
  try{
    const data=await api('/api/v1/public/store/'+encodeURIComponent(STORE)+'/cashback/reservations',{
      method:'POST',
      body:JSON.stringify({...c,amount,orderAmount,orderRef,idempotencyKey:'STORE:'+orderRef+':CHECKOUT964:'+amount.toFixed(2)})
    });
    const reserved=round2(N(data.amount)||amount);
    writeState({...st,...c,orderRef,reservationId:data.reservationId,reservedAmount:reserved,expiresAt:data.expiresAt,status:'ACTIVE',declined:false,chosenAt:new Date().toISOString()});
    try{await window.CaseirinhoCashback960?.queryBalance?.(true)}catch(_){}
    setPopupStatus(money(reserved)+' aplicado. Continuando para a confirmação do pedido...','ok');
    setTimeout(resumeCheckout,180);
  }catch(e){
    console.warn('[Cashback checkout 9.6.4] reserva',e);
    setBusy(false);setPopupStatus(e.message||'Não foi possível reservar o cashback.','err');
    await refreshBalance().catch(()=>{});
    const fresh=readState();if(fresh&&N(fresh.available)>0)openPopup(fresh);
  }
}

async function interceptSubmit(ev){
  if(bypassOnce){bypassOnce=false;return}
  if(checking)return;
  const form=document.getElementById('checkout');if(!form||ev.target!==form)return;
  if(!validIdentity())return;
  if(eligibleProducts()<=0)return;

  ev.preventDefault();
  ev.stopImmediatePropagation();
  checking=true;submitterToResume=ev.submitter||form.querySelector('[type="submit"]');
  try{
    let st=readState();
    if(activeReservation(st)){resumeCheckout();return}
    st=await refreshBalance();
    if(activeReservation(st)){resumeCheckout();return}
    if(!st||st.enabled===false||N(st.available)<=0||maxUsable(st)<=0){resumeCheckout();return}
    openPopup(st);
  }catch(e){
    console.warn('[Cashback checkout 9.6.4] verificação',e);
    resumeCheckout();
  }finally{checking=false}
}
function bind(){
  mount();
  const form=document.getElementById('checkout');
  if(!form||form.dataset.cashbackCheckout964==='1')return;
  form.dataset.cashbackCheckout964='1';
  form.addEventListener('submit',interceptSubmit,true);
}
function init(){injectStyle();mount();bind()}
init();
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
window.addEventListener('pageshow',()=>setTimeout(bind,50));
window.CaseirinhoCashbackCheckout964={open:()=>{const st=readState();if(st)openPopup(st)},refreshBalance,readState,maxUsable};
})();
