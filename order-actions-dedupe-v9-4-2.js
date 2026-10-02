(()=>{'use strict';
if(window.__CASEIRINHO_ORDER_ACTIONS_DEDUPE_942__)return;
window.__CASEIRINHO_ORDER_ACTIONS_DEDUPE_942__=true;

function directWithin(card,selector){
  return [...card.querySelectorAll(selector)].filter(el=>el.closest('.order-card')===card);
}
function removePdfDuplicates(card){
  const rows=directWithin(card,'.receipt-pdf-actions');
  if(!rows.length)return false;
  let changed=false;
  const keep=rows.find(r=>r.querySelector('[data-receipt-pdf-941]'))||rows[0];
  for(const r of rows){if(r!==keep){r.remove();changed=true}}
  const buttons=directWithin(card,'[data-receipt-pdf-941]');
  const first=buttons[0];
  for(let i=1;i<buttons.length;i++){
    const row=buttons[i].closest('.receipt-pdf-actions');
    if(row&&row!==keep)row.remove();else buttons[i].remove();
    changed=true;
  }
  if(first){first.textContent='Baixar PDF do pedido';first.dataset.orderActionUnique='pdf'}
  return changed;
}
function removePixDuplicates(card){
  const pixCards=directWithin(card,'.pix-card');
  if(!pixCards.length)return false;
  let changed=false;
  const keep=pixCards.find(p=>p.querySelector('[data-generate-pix-937]'))||pixCards[0];
  for(const p of pixCards){if(p!==keep){p.remove();changed=true}}

  const modern=keep.querySelectorAll('[data-generate-pix-937]');
  if(modern.length){
    for(let i=1;i<modern.length;i++){modern[i].remove();changed=true}
    keep.querySelectorAll('[data-pix939]').forEach(b=>{b.remove();changed=true});
    const actionGroups=keep.querySelectorAll('.pix-pay-actions');
    for(let i=1;i<actionGroups.length;i++){actionGroups[i].remove();changed=true}
    modern[0].textContent='Gerar QR Code PIX';
    modern[0].dataset.orderActionUnique='pix';
  }else{
    const legacy=keep.querySelectorAll('[data-pix939]');
    for(let i=1;i<legacy.length;i++){legacy[i].remove();changed=true}
    if(legacy[0]){legacy[0].textContent='Gerar QR Code PIX';legacy[0].dataset.orderActionUnique='pix'}
  }
  return changed;
}
function clean(){
  let changed=false;
  document.querySelectorAll('.order-card').forEach(card=>{
    changed=removePdfDuplicates(card)||changed;
    changed=removePixDuplicates(card)||changed;
  });
  return changed;
}
let timer=0;
function schedule(){
  clearTimeout(timer);
  timer=setTimeout(()=>{timer=0;clean()},120);
}
function boot(){
  clean();
  const root=document.body||document.documentElement;
  if(root){
    const mo=new MutationObserver(records=>{
      const relevant=records.some(r=>[...r.addedNodes].some(n=>n.nodeType===1&&(n.matches?.('.order-card,.receipt-pdf-actions,.pix-card,[data-receipt-pdf-941],[data-generate-pix-937],[data-pix939]')||n.querySelector?.('.order-card,.receipt-pdf-actions,.pix-card,[data-receipt-pdf-941],[data-generate-pix-937],[data-pix939]'))));
      if(relevant)schedule();
    });
    try{mo.observe(root,{childList:true,subtree:true})}catch(_){}
  }
  [400,1000,2200,4500].forEach(ms=>setTimeout(clean,ms));
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
window.CaseirinhoOrderActionsDedupe942={version:'9.4.2',clean};
})();