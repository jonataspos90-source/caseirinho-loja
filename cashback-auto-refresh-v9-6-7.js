(()=>{'use strict';
if(window.__CASEIRINHO_CASHBACK_AUTO_REFRESH_967__)return;
window.__CASEIRINHO_CASHBACK_AUTO_REFRESH_967__=true;

const CFG=window.CASEIRINHO_CONFIG||{};
const STORE=String(new URLSearchParams(location.search).get('empresa')||new URLSearchParams(location.search).get('loja')||CFG.storeSlug||'caseirinho').trim().toLowerCase();
const KEY='john_store_'+STORE+'_cashback_v1';
const S=v=>String(v??'');
const N=v=>Number(v)||0;
const phone=v=>{let d=S(v).replace(/\D/g,'');if(d.startsWith('55')&&d.length>11)d=d.slice(2);return d.slice(-11)};
const doc=v=>S(v).replace(/\D/g,'');
const money=v=>N(v).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
let busy=false,lastRefresh=0;

function read(){try{return JSON.parse(localStorage.getItem(KEY)||'null')||{}}catch(_){return{}}}
function write(v){try{localStorage.setItem(KEY,JSON.stringify(v));return true}catch(_){return false}}
function identity(){const st=read();return{phone:phone(document.getElementById('cPhone')?.value||st.phone),cpf:doc(document.getElementById('cCpf')?.value||st.cpf),name:S(document.getElementById('cName')?.value||st.name).trim()}}
function valid(i){return phone(i?.phone).length>=10||doc(i?.cpf).length>=11}
function maskPhone(v){const d=phone(v);if(d.length<10)return d;return `(${d.slice(0,2)}) ${d.slice(2,-4)}-${d.slice(-4)}`}
function wallet(){return window.CaseirinhoCashbackWallet963||window.CaseirinhoCashbackWallet967||null}
function overlayOpen(){return document.getElementById('cashbackWallet963Overlay')?.classList.contains('open')===true}

function saveBalance(data,i){
  const old=read(),available=Math.max(0,N(data?.available)),balance=Math.max(available,N(data?.balance)),reserved=Math.max(0,N(data?.reserved));
  const active=old.reservationId&&old.status==='ACTIVE';
  const next={...old,enabled:data?.enabled!==false,phone:i.phone||old.phone,cpf:i.cpf||old.cpf,name:i.name||old.name,available,balance,reserved,percentage:N(data?.percentage),maxRedemptionPercent:N(data?.maxRedemptionPercent)||old.maxRedemptionPercent||100,...(active?{reservationId:old.reservationId,reservedAmount:old.reservedAmount,expiresAt:old.expiresAt,status:old.status,orderRef:old.orderRef}:{}),checkedAt:new Date().toISOString(),autoUpdated:true};
  write(next);wallet()?.updateNavAmount?.(next);return next;
}

function renderOpenWallet(data,i){
  if(!overlayOpen())return;
  const available=Math.max(0,N(data?.available)),balance=Math.max(available,N(data?.balance)),reserved=Math.max(0,N(data?.reserved));
  const box=document.getElementById('cashbackWallet963Balance'),value=document.getElementById('cashbackWallet963BalanceValue'),details=document.getElementById('cashbackWallet963Details'),refresh=document.getElementById('cashbackWallet963Refresh'),status=document.getElementById('cashbackWallet963Status');
  if(box)box.hidden=false;if(value)value.textContent=money(available);
  if(details){details.innerHTML=`<div class="cashback-wallet-detail"><span>Total na carteira</span><b>${money(balance)}</b></div><div class="cashback-wallet-detail"><span>Reservado em pedido</span><b>${money(reserved)}</b></div><div class="cashback-wallet-detail"><span>Percentual vigente</span><b>${N(data?.percentage).toLocaleString('pt-BR')}%</b></div><div class="cashback-wallet-detail"><span>Identificação</span><b>${i.phone?maskPhone(i.phone):'CPF informado'}</b></div>`;details.hidden=false}
  if(refresh){refresh.hidden=false;refresh.textContent='Atualizar agora'}
  const consult=document.getElementById('cashbackWallet963Consult');if(consult)consult.textContent='Atualizar agora';
  if(status){status.className='cashback-wallet-status ok';status.textContent=available>0?'Saldo atualizado automaticamente pelo ERP.':'Saldo atualizado automaticamente. Você ainda não possui cashback disponível.'}
  const title=document.querySelector('#cashbackWallet963Title + p');if(title)title.textContent='Seu saldo é atualizado automaticamente quando seus pedidos são concluídos.';
}

async function refresh({force=false,render=false}={}){
  const api=wallet(),i=identity();
  if(!api?.lookupBalance||!valid(i)||busy)return false;
  if(!force&&Date.now()-lastRefresh<30000)return false;
  busy=true;
  try{
    const data=await api.lookupBalance(i);saveBalance(data,i);lastRefresh=Date.now();if(render||overlayOpen())renderOpenWallet(data,i);return true;
  }catch(e){
    if(overlayOpen()){
      const status=document.getElementById('cashbackWallet963Status');if(status){status.className='cashback-wallet-status err';status.textContent='Não foi possível atualizar automaticamente agora. Toque em Atualizar agora para tentar novamente.'}
    }
    console.warn('[Cashback 9.6.7] atualização automática',e?.message||e);return false;
  }finally{busy=false}
}

function improveCopy(){
  const btn=document.getElementById('navCashback');if(btn)btn.setAttribute('aria-label','Meu cashback');
  const consult=document.getElementById('cashbackWallet963Consult');if(consult)consult.textContent='Atualizar agora';
  const status=document.getElementById('cashbackWallet963Status');if(status&&!valid(identity()))status.textContent='Informe seu WhatsApp ou CPF uma vez. Depois o saldo será atualizado automaticamente.';
  const rule=document.querySelector('.cashback-wallet-rule');if(rule)rule.textContent='Quando o pedido é marcado como entregue ou retirado, o cashback elegível é lançado automaticamente no ERP. Esta tela apenas mostra o saldo; você não precisa consultar para liberar o crédito.';
}

function bind(){
  improveCopy();
  document.addEventListener('click',e=>{
    if(e.target?.closest?.('#navCashback'))setTimeout(()=>{improveCopy();refresh({force:true,render:true})},80);
    if(e.target?.closest?.('#navOrders'))setTimeout(()=>refresh({force:false}),250);
  });
  for(const id of ['cPhone','cCpf'])document.getElementById(id)?.addEventListener('blur',()=>setTimeout(()=>refresh({force:true}),80));
  window.addEventListener('focus',()=>setTimeout(()=>refresh({force:false}),120));
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)setTimeout(()=>refresh({force:false}),120)});
  setTimeout(()=>refresh({force:false}),700);
  setInterval(()=>{if(!document.hidden)refresh({force:false})},60000);
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();
window.CaseirinhoCashbackAuto967={refresh,identity};
})();
