(()=>{'use strict';
if(window.__CASEIRINHO_CASHBACK_NAV_963__)return;window.__CASEIRINHO_CASHBACK_NAV_963__=true;

const CFG=window.CASEIRINHO_CONFIG||{};
const STORE=String(new URLSearchParams(location.search).get('empresa')||new URLSearchParams(location.search).get('loja')||CFG.storeSlug||'caseirinho').trim().toLowerCase();
const STATE_KEY='john_store_'+STORE+'_cashback_v1';
const PROFILE_KEY='john_store_'+STORE+'_customer_profile_v1';
const S=v=>String(v??'');
const N=v=>Number(v)||0;
const money=v=>N(v).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const phone=v=>{let d=S(v).replace(/\D/g,'');if(d.startsWith('55')&&d.length>11)d=d.slice(2);return d.slice(-11)};
const doc=v=>S(v).replace(/\D/g,'');

function readJson(key,fallback=null){try{return JSON.parse(localStorage.getItem(key)||'null')??fallback}catch(_){return fallback}}
function cashbackState(){
  try{return window.CaseirinhoCashback960?.readState?.()||readJson(STATE_KEY,null)}catch(_){return readJson(STATE_KEY,null)}
}
function profile(){return readJson(PROFILE_KEY,{})||{}}
function balanceValue(st=cashbackState()){
  if(!st)return 0;
  const balance=Number(st.balance);
  return Number.isFinite(balance)&&balance>=0?balance:Math.max(0,N(st.available));
}
function identity(){
  const p=profile();
  const inputPhone=phone(document.getElementById('cPhone')?.value);
  const inputCpf=doc(document.getElementById('cCpf')?.value);
  return{
    phone:inputPhone||phone(p.telefone),
    cpf:inputCpf||doc(p.cpf),
    name:S(document.getElementById('cName')?.value||p.nome).trim()
  };
}
function hasIdentity(){const c=identity();return c.phone.length>=10||c.cpf.length>=11}
function hydrateIdentity(){
  const p=profile();
  const set=(id,val)=>{const el=document.getElementById(id);if(el&&!S(el.value).trim()&&S(val).trim())el.value=S(val)};
  set('cName',p.nome);set('cPhone',p.telefone);set('cCpf',p.cpf);
}

function injectStyle(){
  if(document.getElementById('cashbackNav963Style'))return;
  const style=document.createElement('style');style.id='cashbackNav963Style';style.textContent=`
    .bottom-nav.cashback-nav963{grid-template-columns:repeat(6,minmax(0,1fr))}
    #navCashback{min-width:0}
    #navCashback .cashback963-amount{display:block;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:8px;line-height:1.05;font-weight:950;color:#166534;margin-top:1px}
    #navCashback.cashback963-positive{background:#ecfdf5;color:#14532d}
    .cashback963-card{border:1px solid #bbf7d0;background:linear-gradient(145deg,#f0fdf4,#ffffff);border-radius:20px;padding:18px;margin-bottom:13px}
    .cashback963-card small{display:block;color:#64748b;font-size:12px;font-weight:750;margin-bottom:5px}
    .cashback963-card strong{display:block;color:#166534;font-size:34px;line-height:1;font-weight:950;letter-spacing:-.03em}
    .cashback963-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;margin-top:14px}
    .cashback963-metric{border:1px solid #e2e8f0;background:#fff;border-radius:14px;padding:11px}
    .cashback963-metric span{display:block;color:#64748b;font-size:11px;margin-bottom:3px}.cashback963-metric b{font-size:16px;color:#17223b}
    .cashback963-note{font-size:12px;line-height:1.55;color:#475569;margin:12px 0 0}
    .cashback963-alert{padding:11px 12px;border-radius:13px;background:#fff7ed;border:1px solid #fed7aa;color:#9a3412;font-size:12px;line-height:1.45;margin-top:11px}
    .cashback963-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:14px}.cashback963-actions button{border:0;border-radius:12px;padding:10px 13px;font-weight:850}.cashback963-refresh{background:#166534;color:#fff}.cashback963-cart{background:#f3f4f7;color:#17223b;border:1px solid #e6e8ef!important}
    .cashback963-loading{padding:24px;text-align:center;color:#64748b}
    @media(max-width:430px){.bottom-nav.cashback-nav963 button{font-size:16px}.bottom-nav.cashback-nav963 button span{font-size:8px}.cashback963-grid{grid-template-columns:1fr}}
  `;document.head.appendChild(style);
}

function updateButton(){
  const btn=document.getElementById('navCashback'),amount=document.getElementById('navCashbackAmount');if(!btn||!amount)return;
  const st=cashbackState();
  if(!st||st.enabled===false){amount.textContent=hasIdentity()?'R$ 0,00':'Consultar';btn.classList.remove('cashback963-positive');btn.title='Consultar cashback';return}
  const value=balanceValue(st);amount.textContent=money(value);btn.classList.toggle('cashback963-positive',value>0);btn.title='Saldo de cashback: '+money(value);
}

function openOverlay(){
  const overlay=document.getElementById('simpleOverlay');if(!overlay)return false;
  document.getElementById('simpleTitle').textContent='💰 Meu Cashback';
  overlay.classList.add('open');overlay.setAttribute('aria-hidden','false');return true;
}
function closeOverlay(){const overlay=document.getElementById('simpleOverlay');overlay?.classList.remove('open');overlay?.setAttribute('aria-hidden','true')}

function renderPanel(message=''){
  const body=document.getElementById('simpleBody');if(!body)return;
  const st=cashbackState();
  if(!hasIdentity()&&!st){
    body.innerHTML=`<div class="cashback963-card"><small>Seu saldo de cashback</small><strong>—</strong><p class="cashback963-note">Para consultar seu cashback com segurança, informe seu WhatsApp nos dados do pedido. Depois disso, o saldo ficará disponível neste aparelho e será atualizado pelo ERP.</p><div class="cashback963-actions"><button type="button" class="cashback963-cart" id="cashback963GoCart">Informar meus dados</button></div></div>`;
    document.getElementById('cashback963GoCart').onclick=()=>{closeOverlay();document.getElementById('navCart')?.click();setTimeout(()=>document.getElementById('cPhone')?.focus(),250)};
    return;
  }
  if(!st){body.innerHTML='<div class="cashback963-loading">Consultando seu saldo no ERP...</div>';return}
  if(st.enabled===false){body.innerHTML='<div class="cashback963-card"><small>Cashback</small><strong>Indisponível</strong><p class="cashback963-note">O programa de cashback não está disponível no momento.</p></div>';return}
  const balance=balanceValue(st),available=Math.max(0,N(st.available)),reserved=Math.max(0,N(st.reservedAmount||st.reserved));
  body.innerHTML=`
    <div class="cashback963-card">
      <small>Saldo acumulado</small>
      <strong>${money(balance)}</strong>
      <div class="cashback963-grid">
        <div class="cashback963-metric"><span>Disponível para usar</span><b>${money(available)}</b></div>
        <div class="cashback963-metric"><span>Reservado em pedido</span><b>${money(reserved)}</b></div>
      </div>
      <p class="cashback963-note">Saldo consultado diretamente no John Sistema/ERP. O valor disponível pode mudar após confirmação, cancelamento ou conclusão de pedidos.</p>
      <div class="cashback963-alert">Cupom de desconto e cashback não são cumulativos no mesmo pedido.</div>
      ${message?`<p class="cashback963-note">${message}</p>`:''}
      <div class="cashback963-actions"><button type="button" class="cashback963-refresh" id="cashback963Refresh">Atualizar saldo</button></div>
    </div>`;
  document.getElementById('cashback963Refresh').onclick=()=>refreshBalance(true);
}

async function refreshBalance(force=true){
  hydrateIdentity();
  if(!hasIdentity()){updateButton();if(document.getElementById('simpleOverlay')?.classList.contains('open'))renderPanel();return}
  if(document.getElementById('simpleOverlay')?.classList.contains('open')){
    const body=document.getElementById('simpleBody');if(body)body.innerHTML='<div class="cashback963-loading">Atualizando seu cashback...</div>';
  }
  try{
    if(window.CaseirinhoCashback960?.queryBalance)await window.CaseirinhoCashback960.queryBalance(!!force);
    updateButton();if(document.getElementById('simpleOverlay')?.classList.contains('open'))renderPanel('Saldo atualizado agora.');
  }catch(e){
    console.warn('[CASHBACK NAV 9.6.3] consulta indisponível',e);updateButton();if(document.getElementById('simpleOverlay')?.classList.contains('open'))renderPanel('Não foi possível atualizar agora. Exibindo o último saldo confirmado neste aparelho.');
  }
}
async function showCashback(){
  if(!openOverlay())return;
  renderPanel();
  if(hasIdentity())await refreshBalance(true);
}

function mount(){
  injectStyle();hydrateIdentity();
  const nav=document.querySelector('.bottom-nav'),whats=document.getElementById('navWhats');if(!nav||!whats)return;
  nav.classList.add('cashback-nav963');
  let btn=document.getElementById('navCashback');
  if(!btn){
    btn=document.createElement('button');btn.id='navCashback';btn.type='button';btn.innerHTML='💰<span>Cashback</span><small class="cashback963-amount" id="navCashbackAmount">Consultar</small>';
    nav.insertBefore(btn,whats);
  }
  btn.onclick=showCashback;
  document.getElementById('simpleClose')?.addEventListener('click',closeOverlay);
  const box=document.getElementById('cashback960Box');if(box)new MutationObserver(updateButton).observe(box,{childList:true,characterData:true,subtree:true,attributes:true});
  window.addEventListener('storage',e=>{if(e.key===STATE_KEY||e.key===PROFILE_KEY){hydrateIdentity();updateButton()}});
  document.getElementById('cPhone')?.addEventListener('blur',()=>setTimeout(updateButton,150));
  document.getElementById('cCpf')?.addEventListener('blur',()=>setTimeout(updateButton,150));
  updateButton();
  setTimeout(()=>refreshBalance(true),900);
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else setTimeout(mount,0);
window.CaseirinhoCashbackNav963={showCashback,refreshBalance,updateButton,balanceValue};
})();
