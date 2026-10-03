(()=>{'use strict';
if(window.__CASEIRINHO_CUSTOMER_CASHBACK_WALLET_963__)return;
window.__CASEIRINHO_CUSTOMER_CASHBACK_WALLET_963__=true;

const CFG=window.CASEIRINHO_CONFIG||{};
const API=String(CFG.apiUrl||'').replace(/\/+$/,'');
const STORE=String(new URLSearchParams(location.search).get('empresa')||new URLSearchParams(location.search).get('loja')||CFG.storeSlug||'caseirinho').trim().toLowerCase();
const CASHBACK_KEY='john_store_'+STORE+'_cashback_v1';
const S=v=>String(v??'');
const N=v=>Number(v)||0;
const money=v=>N(v).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const phone=v=>{let d=S(v).replace(/\D/g,'');if(d.startsWith('55')&&d.length>11)d=d.slice(2);return d.slice(-11)};
const doc=v=>S(v).replace(/\D/g,'');

function readState(){try{return JSON.parse(localStorage.getItem(CASHBACK_KEY)||'null')}catch(_){return null}}
function saveState(next){try{localStorage.setItem(CASHBACK_KEY,JSON.stringify(next))}catch(_){}updateNavAmount(next)}
function currentIdentity(){
  const st=readState()||{};
  return{
    phone:phone(document.getElementById('cPhone')?.value||st.phone),
    cpf:doc(document.getElementById('cCpf')?.value||st.cpf),
    name:S(document.getElementById('cName')?.value||st.name).trim()
  };
}
function validIdentity(c){return phone(c?.phone).length>=10||doc(c?.cpf).length>=11}
function maskPhone(v){const d=phone(v);if(d.length<10)return d;const ddd=d.slice(0,2),a=d.slice(2,-4),b=d.slice(-4);return `(${ddd}) ${a}-${b}`}
function formatCpf(v){const d=doc(v).slice(0,11);return d.replace(/(\d{3})(\d)/,'$1.$2').replace(/(\d{3})(\d)/,'$1.$2').replace(/(\d{3})(\d{1,2})$/,'$1-$2')}

function injectStyle(){
  if(document.getElementById('cashbackWallet963Style'))return;
  const style=document.createElement('style');
  style.id='cashbackWallet963Style';
  style.textContent=`
    .bottom-nav.cashback-wallet-enabled{grid-template-columns:repeat(6,minmax(0,1fr))}
    #navCashback{color:#166534}
    #navCashback .cashback-wallet-nav-value{display:none;position:absolute;top:-5px;right:1px;min-width:35px;max-width:64px;padding:3px 5px;border-radius:999px;background:#166534;color:#fff;font-size:8px;font-weight:950;line-height:1.1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;box-shadow:0 3px 10px #0002}
    #navCashback.has-balance .cashback-wallet-nav-value{display:block}
    .cashback-wallet-overlay{position:fixed;inset:0;z-index:180;background:#15101aa3;backdrop-filter:blur(7px);display:none;place-items:center;padding:16px}
    .cashback-wallet-overlay.open{display:grid}
    .cashback-wallet-card{width:min(470px,100%);max-height:90vh;overflow:auto;background:#fff;border-radius:24px;padding:20px;box-shadow:0 30px 90px #0004}
    .cashback-wallet-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;padding-bottom:13px;border-bottom:1px solid #e6e8ef}
    .cashback-wallet-head h2{margin:0;color:#14532d;font-size:22px}.cashback-wallet-head p{margin:4px 0 0;color:#6f7688;font-size:12px;line-height:1.4}
    .cashback-wallet-close{border:1px solid #e6e8ef;background:#f7f7f9;border-radius:12px;padding:8px 11px;font-weight:850;color:#17223b}
    .cashback-wallet-balance{margin:16px 0;padding:18px;border-radius:18px;background:linear-gradient(135deg,#ecfdf5,#f0fdf4);border:1px solid #86efac;text-align:center}
    .cashback-wallet-balance small{display:block;color:#166534;font-weight:800}.cashback-wallet-balance strong{display:block;margin-top:4px;color:#14532d;font-size:34px;line-height:1.05}
    .cashback-wallet-details{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:10px 0 14px}.cashback-wallet-detail{padding:11px;border-radius:13px;background:#f8fafc;border:1px solid #e6e8ef}.cashback-wallet-detail span{display:block;color:#6f7688;font-size:10px;font-weight:800}.cashback-wallet-detail b{display:block;margin-top:3px;color:#17223b;font-size:13px}
    .cashback-wallet-form{display:grid;gap:10px}.cashback-wallet-form label{display:grid;gap:5px;font-size:11px;font-weight:850;color:#17223b}.cashback-wallet-form input{width:100%;border:1px solid #dfe3ea;border-radius:12px;padding:12px;outline:none}.cashback-wallet-form input:focus{border-color:#22c55e;box-shadow:0 0 0 3px #22c55e18}
    .cashback-wallet-actions{display:flex;gap:8px;margin-top:12px}.cashback-wallet-actions button{flex:1;border:0;border-radius:13px;padding:12px 14px;font-weight:900}.cashback-wallet-consult{background:#166534;color:#fff}.cashback-wallet-refresh{background:#e7f6ec;color:#14532d}
    .cashback-wallet-status{min-height:18px;margin-top:10px;font-size:12px;line-height:1.4;color:#64748b}.cashback-wallet-status.ok{color:#166534}.cashback-wallet-status.err{color:#b4233c}.cashback-wallet-status.loading{color:#475569}
    .cashback-wallet-rule{margin-top:12px;padding:10px 11px;border-radius:12px;background:#fff7ed;border:1px solid #fed7aa;color:#9a3412;font-size:11px;line-height:1.45}
    @media(max-width:420px){.bottom-nav.cashback-wallet-enabled button{font-size:16px;padding-left:1px;padding-right:1px}.bottom-nav.cashback-wallet-enabled button span{font-size:8px}.cashback-wallet-details{grid-template-columns:1fr}.cashback-wallet-balance strong{font-size:30px}}
  `;
  document.head.appendChild(style);
}

function mountNav(){
  const nav=document.querySelector('.bottom-nav');
  const whats=document.getElementById('navWhats');
  if(!nav||!whats||document.getElementById('navCashback'))return;
  nav.classList.add('cashback-wallet-enabled');
  const btn=document.createElement('button');
  btn.id='navCashback';btn.type='button';btn.setAttribute('aria-label','Consultar meu cashback');
  btn.innerHTML='💰<span>Cashback</span><i class="cashback-wallet-nav-value" id="cashbackWallet963NavValue"></i>';
  nav.insertBefore(btn,whats);
  btn.addEventListener('click',openWallet);
  updateNavAmount(readState());
}

function updateNavAmount(st=readState()){
  const btn=document.getElementById('navCashback'),tag=document.getElementById('cashbackWallet963NavValue');if(!btn||!tag)return;
  const available=Math.max(0,N(st?.available));
  if(st?.enabled!==false&&available>0){btn.classList.add('has-balance');tag.textContent=money(available).replace(/\s/g,' ')}
  else{btn.classList.remove('has-balance');tag.textContent=''}
}

function mountOverlay(){
  if(document.getElementById('cashbackWallet963Overlay'))return;
  const ov=document.createElement('div');ov.id='cashbackWallet963Overlay';ov.className='cashback-wallet-overlay';ov.setAttribute('aria-hidden','true');
  ov.innerHTML=`
    <section class="cashback-wallet-card" role="dialog" aria-modal="true" aria-labelledby="cashbackWallet963Title">
      <div class="cashback-wallet-head">
        <div><h2 id="cashbackWallet963Title">💰 Meu Cashback</h2><p>Consulte quanto você já tem disponível no Caseirinho.</p></div>
        <button type="button" class="cashback-wallet-close" id="cashbackWallet963Close">Fechar</button>
      </div>
      <div class="cashback-wallet-balance" id="cashbackWallet963Balance" hidden><small>Saldo disponível</small><strong id="cashbackWallet963BalanceValue">R$ 0,00</strong></div>
      <div class="cashback-wallet-details" id="cashbackWallet963Details" hidden></div>
      <div class="cashback-wallet-form">
        <label>WhatsApp<input id="cashbackWallet963Phone" inputmode="tel" autocomplete="tel" placeholder="(11) 99999-9999"></label>
        <label>CPF (opcional)<input id="cashbackWallet963Cpf" inputmode="numeric" autocomplete="off" placeholder="000.000.000-00"></label>
      </div>
      <div class="cashback-wallet-actions">
        <button type="button" class="cashback-wallet-consult" id="cashbackWallet963Consult">Consultar saldo</button>
        <button type="button" class="cashback-wallet-refresh" id="cashbackWallet963Refresh" hidden>Atualizar</button>
      </div>
      <div class="cashback-wallet-status" id="cashbackWallet963Status">Informe seu WhatsApp ou CPF para consultar.</div>
      <div class="cashback-wallet-rule">O cashback é consultado diretamente no ERP. Quando houver cupom de desconto aplicado, o cashback continua visível aqui, mas não é cumulativo com o cupom no mesmo pedido.</div>
    </section>`;
  document.body.appendChild(ov);
  const close=()=>{ov.classList.remove('open');ov.setAttribute('aria-hidden','true')};
  document.getElementById('cashbackWallet963Close').onclick=close;
  ov.addEventListener('click',e=>{if(e.target===ov)close()});
  document.getElementById('cashbackWallet963Consult').onclick=()=>lookupFromForm();
  document.getElementById('cashbackWallet963Refresh').onclick=()=>lookupFromForm(true);
  const p=document.getElementById('cashbackWallet963Phone');
  const cpf=document.getElementById('cashbackWallet963Cpf');
  p.addEventListener('input',()=>{const d=phone(p.value);p.value=d.length>2?maskPhone(d):d});
  cpf.addEventListener('input',()=>{cpf.value=formatCpf(cpf.value)});
}

function setStatus(text,type=''){
  const el=document.getElementById('cashbackWallet963Status');if(!el)return;el.className='cashback-wallet-status '+type;el.textContent=text;
}
function renderBalance(data,identity){
  const balance=document.getElementById('cashbackWallet963Balance'),value=document.getElementById('cashbackWallet963BalanceValue'),details=document.getElementById('cashbackWallet963Details'),refresh=document.getElementById('cashbackWallet963Refresh');
  if(!balance||!value||!details)return;
  const available=Math.max(0,N(data.available));
  const total=Math.max(available,N(data.balance));
  const reserved=Math.max(0,N(data.reserved));
  value.textContent=money(available);balance.hidden=false;
  details.innerHTML=`
    <div class="cashback-wallet-detail"><span>Total na carteira</span><b>${money(total)}</b></div>
    <div class="cashback-wallet-detail"><span>Reservado em pedido</span><b>${money(reserved)}</b></div>
    <div class="cashback-wallet-detail"><span>Percentual vigente</span><b>${N(data.percentage).toLocaleString('pt-BR')}%</b></div>
    <div class="cashback-wallet-detail"><span>Identificação</span><b>${identity.phone?maskPhone(identity.phone):'CPF informado'}</b></div>`;
  details.hidden=false;if(refresh)refresh.hidden=false;
  const old=readState()||{};
  const hasActive=old.reservationId&&old.status==='ACTIVE';
  saveState({...old,enabled:data.enabled!==false,phone:identity.phone||old.phone,cpf:identity.cpf||old.cpf,available,balance:total,reserved,percentage:N(data.percentage),maxRedemptionPercent:N(data.maxRedemptionPercent)||old.maxRedemptionPercent||100,...(hasActive?{reservationId:old.reservationId,reservedAmount:old.reservedAmount,expiresAt:old.expiresAt,status:old.status,orderRef:old.orderRef}:{}),checkedAt:new Date().toISOString()});
  setStatus(available>0?'Saldo atualizado diretamente pelo ERP.':'Você ainda não possui cashback disponível.','ok');
}

async function lookupBalance(identity){
  if(!validIdentity(identity))throw new Error('Informe um WhatsApp válido ou CPF para consultar.');
  if(!API)throw new Error('Serviço de cashback indisponível.');
  const ctl=new AbortController();const timer=setTimeout(()=>ctl.abort(),9000);
  try{
    const r=await fetch(API+'/api/v1/public/store/'+encodeURIComponent(STORE)+'/cashback/balance?_t='+Date.now(),{method:'POST',cache:'no-store',signal:ctl.signal,headers:{'Content-Type':'application/json','Cache-Control':'no-cache'},body:JSON.stringify({phone:phone(identity.phone),cpf:doc(identity.cpf),name:S(identity.name).trim()})});
    let data={};try{data=await r.json()}catch(_){}
    if(!r.ok)throw new Error(data.error||('Não foi possível consultar o cashback (HTTP '+r.status+').'));
    return data;
  }catch(e){if(e?.name==='AbortError')throw new Error('A consulta demorou mais que o esperado. Tente novamente.');throw e}
  finally{clearTimeout(timer)}
}

async function lookupFromForm(){
  const identity={phone:phone(document.getElementById('cashbackWallet963Phone')?.value),cpf:doc(document.getElementById('cashbackWallet963Cpf')?.value),name:S(document.getElementById('cName')?.value).trim()};
  setStatus('Consultando seu cashback...','loading');
  try{const data=await lookupBalance(identity);renderBalance(data,identity)}catch(e){setStatus(e.message||'Não foi possível consultar agora.','err')}
}

function openWallet(){
  mountOverlay();
  const ov=document.getElementById('cashbackWallet963Overlay'),p=document.getElementById('cashbackWallet963Phone'),cpf=document.getElementById('cashbackWallet963Cpf');
  const identity=currentIdentity();
  if(p&&!p.value&&identity.phone)p.value=maskPhone(identity.phone);
  if(cpf&&!cpf.value&&identity.cpf)cpf.value=formatCpf(identity.cpf);
  ov.classList.add('open');ov.setAttribute('aria-hidden','false');
  const st=readState();
  if(st?.enabled!==false&&(N(st?.balance)>0||N(st?.available)>=0)&&st?.checkedAt){renderBalance({enabled:st.enabled,available:st.available,balance:st.balance,reserved:st.reserved,percentage:st.percentage,maxRedemptionPercent:st.maxRedemptionPercent},identity)}
  else setStatus('Informe seu WhatsApp ou CPF para consultar.','');
}

function syncWithCashbackState(){
  updateNavAmount(readState());
  window.addEventListener('storage',e=>{if(e.key===CASHBACK_KEY)updateNavAmount(readState())});
  const phoneInput=document.getElementById('cPhone'),cpfInput=document.getElementById('cCpf');
  const refresh=()=>setTimeout(()=>updateNavAmount(readState()),50);
  phoneInput?.addEventListener('blur',refresh);cpfInput?.addEventListener('blur',refresh);
  setInterval(()=>updateNavAmount(readState()),5000);
}

function init(){injectStyle();mountNav();mountOverlay();syncWithCashbackState()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
window.CaseirinhoCashbackWallet963={open:openWallet,lookupBalance,updateNavAmount};
})();
