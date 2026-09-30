(()=>{'use strict';
if(window.__CASEIRINHO_PIX_ENSURE_939__)return;
window.__CASEIRINHO_PIX_ENSURE_939__=true;
const CFG=window.CASEIRINHO_CONFIG||{};
const STORE=String(new URLSearchParams(location.search).get('empresa')||new URLSearchParams(location.search).get('loja')||CFG.storeSlug||'caseirinho').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9-]/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'')||'caseirinho';
const KEY='john_store_'+STORE+'_orders_v1';
const S=v=>String(v??'');
const A=v=>Array.isArray(v)?v:[];
const norm=v=>S(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toUpperCase().replace(/[\s-]+/g,'_');
function read(){try{return A(JSON.parse(localStorage.getItem(KEY)||'[]'))}catch(_){return[]}}
function code(o){return S(o?.codigo||o?.code||o?.id)}
function acceptedPix(o){return norm(o?.status)==='ACEITO'&&/PIX/i.test(S(o?.formaPagamento||o?.payload?.formaPagamento))}
function toast(m){const e=document.getElementById('toast');if(e){e.textContent=m;e.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>e.classList.remove('show'),2600)}else alert(m)}
function patch(){document.querySelectorAll('.order-card').forEach(card=>{const shown=S(card.querySelector('.order-top b')?.textContent).trim(),o=read().find(x=>code(x)===shown);if(!o||!acceptedPix(o)||card.querySelector('.pix-card'))return;const box=document.createElement('div');box.className='pix-card';box.dataset.pix939='1';box.innerHTML='<div class="pix-title">💠 PIX disponível para pagamento</div><div><small>QR Code com o valor exato deste pedido</small></div><button class="soft" type="button" data-pix939>Gerar QR Code PIX</button>';card.appendChild(box);box.querySelector('[data-pix939]').onclick=async e=>{const b=e.currentTarget;b.disabled=true;const old=b.textContent;b.textContent='Gerando QR Code...';try{if(!window.CaseirinhoPixPayment937?.generateForOrder)throw new Error('Pagamento PIX ainda está carregando.');await window.CaseirinhoPixPayment937.generateForOrder(o.id)}catch(err){toast(err.message||'Não foi possível gerar o QR Code PIX.')}finally{b.disabled=false;b.textContent=old}}})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(patch,500),{once:true});else setTimeout(patch,250);
const mo=new MutationObserver(()=>patch());try{mo.observe(document.documentElement,{childList:true,subtree:true})}catch(_){}
[1000,2500,5000,9000].forEach(ms=>setTimeout(patch,ms));setInterval(()=>{if(!document.hidden)patch()},3000);
window.CaseirinhoPixEnsure939={version:'9.3.9',patch};
})();