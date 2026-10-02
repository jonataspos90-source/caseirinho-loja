(()=>{'use strict';
if(window.__CASEIRINHO_ORDER_ACTIONS_DEDUPE_943__)return;
window.__CASEIRINHO_ORDER_ACTIONS_DEDUPE_943__=true;

const CFG=window.CASEIRINHO_CONFIG||{};
const STORE=String(new URLSearchParams(location.search).get('empresa')||new URLSearchParams(location.search).get('loja')||CFG.storeSlug||'caseirinho').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9-]/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'')||'caseirinho';
const ORDERS_KEY='john_store_'+STORE+'_orders_v1';
const S=v=>String(v??'');
const A=v=>Array.isArray(v)?v:[];
const norm=v=>S(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toUpperCase().replace(/[\s-]+/g,'_');
function readOrders(){try{return A(JSON.parse(localStorage.getItem(ORDERS_KEY)||'[]'))}catch(_){return[]}}
function code(o){return S(o?.codigo||o?.code||o?.id).trim()}
function orderForCard(card){
  const shown=S(card?.querySelector('.order-top b')?.textContent).trim();
  if(!shown)return null;
  return readOrders().find(o=>code(o)===shown||S(o?.id)===shown)||null;
}
function isAcceptedPix(o){
  if(!o)return false;
  const st=norm(o?.status||o?.payload?.status||'');
  const pay=S(o?.formaPagamento||o?.payload?.formaPagamento);
  return st==='ACEITO'&&/PIX/i.test(pay);
}
function owned(card,selector){return [...card.querySelectorAll(selector)].filter(el=>el.closest('.order-card')===card)}
function cleanupPix(card){
  const o=orderForCard(card);
  let pixCards=owned(card,'.pix-card');
  if(o&&!isAcceptedPix(o)){
    pixCards.filter(x=>x.dataset.pix937==='1'||x.dataset.pix939==='1'||x.querySelector('[data-generate-pix-937],[data-pix939]')).forEach(x=>x.remove());
    return;
  }
  if(pixCards.length>1){
    pixCards.sort((a,b)=>Number(!!b.querySelector('[data-generate-pix-937]'))-Number(!!a.querySelector('[data-generate-pix-937]')));
    const keep=pixCards[0];
    pixCards.slice(1).forEach(x=>x.remove());
    pixCards=[keep];
  }
  const box=pixCards[0];
  if(!box)return;
  const buttons=[...box.querySelectorAll('[data-generate-pix-937],[data-pix939]')];
  if(buttons.length>1){
    const keep=buttons.find(b=>b.hasAttribute('data-generate-pix-937'))||buttons[0];
    buttons.filter(b=>b!==keep).forEach(b=>b.remove());
    [...box.querySelectorAll('.pix-pay-actions')].forEach(row=>{if(!row.contains(keep)&&!row.querySelector('[data-generate-pix-937],[data-pix939]'))row.remove()});
  }
  const notes=[...box.querySelectorAll('.pix-pay-note')];
  notes.slice(1).forEach(n=>n.remove());
}
function cleanupPdf(card){
  let rows=owned(card,'.receipt-pdf-actions');
  if(rows.length>1){
    const keep=rows.find(r=>r.querySelector('[data-receipt-pdf-941]'))||rows[0];
    rows.filter(r=>r!==keep).forEach(r=>r.remove());
    rows=[keep];
  }
  const buttons=owned(card,'[data-receipt-pdf-941]');
  if(buttons.length>1){
    const keep=buttons[0];
    buttons.slice(1).forEach(b=>b.remove());
    rows.forEach(r=>{if(r!==keep.parentElement&&!r.querySelector('[data-receipt-pdf-941]'))r.remove()});
  }
}
let running=false;
function cleanup(){
  if(running)return;running=true;
  try{document.querySelectorAll('.order-card').forEach(card=>{cleanupPix(card);cleanupPdf(card)})}finally{running=false}
}
let timer=0;
function schedule(){clearTimeout(timer);timer=setTimeout(cleanup,60)}
function relevant(records){return records.some(r=>[...r.addedNodes].some(n=>n.nodeType===1&&(n.matches?.('.order-card,.pix-card,.receipt-pdf-actions,[data-generate-pix-937],[data-pix939],[data-receipt-pdf-941]')||n.querySelector?.('.order-card,.pix-card,.receipt-pdf-actions,[data-generate-pix-937],[data-pix939],[data-receipt-pdf-941]'))))}
function boot(){cleanup();const root=document.body||document.documentElement;if(root){const mo=new MutationObserver(records=>{if(relevant(records))schedule()});try{mo.observe(root,{childList:true,subtree:true})}catch(_){}}[400,1000,2200,4500].forEach(ms=>setTimeout(cleanup,ms))}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
window.CaseirinhoOrderActionsDedupe943={version:'9.4.3',cleanup};
})();