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
function patch(){
  const list=read();
  document.querySelectorAll('.order-card').forEach(card=>{
    const shown=S(card.querySelector('.order-top b')?.textContent).trim();
    const o=list.find(x=>code(x)===shown);
    if(!o||!acceptedPix(o)||card.querySelector('.pix-card'))return;
    const box=document.createElement('div');
    box.className='pix-card';
    box.dataset.pix939='1';
    box.dataset.orderId=S(o.id||shown);
    box.innerHTML='<div class="pix-title">💠 PIX disponível para pagamento</div><div><small>QR Code com o valor exato deste pedido</small></div>';
    card.appendChild(box);
  });
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(patch,500),{once:true});else setTimeout(patch,250);
let scheduled=false;
function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;patch()})}
const mo=new MutationObserver(records=>{if(records.some(r=>[...r.addedNodes].some(n=>n.nodeType===1&&(n.matches?.('.order-card')||n.querySelector?.('.order-card')))))schedule()});
try{if(document.body)mo.observe(document.body,{childList:true,subtree:true});else document.addEventListener('DOMContentLoaded',()=>mo.observe(document.body,{childList:true,subtree:true}),{once:true})}catch(_){}
[1000,2500,5000].forEach(ms=>setTimeout(patch,ms));
window.CaseirinhoPixEnsure939={version:'9.3.9',stability:'9.4.2',patch};
})();