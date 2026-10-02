(()=>{'use strict';
if(window.__CASEIRINHO_ORDER_ACTIONS_DEDUPE_942__)return;
window.__CASEIRINHO_ORDER_ACTIONS_DEDUPE_942__=true;

function removeNode(n){try{n?.remove()}catch(_){}}
function nearestOrder(el){return el?.closest?.('.order-card')||null}
const PDF_SELECTOR='[data-receipt-pdf-941],[data-receipt-pdf941],.receipt-pdf-btn';

function cleanPdf(){
  let changed=false;
  const allRows=[...document.querySelectorAll('.receipt-pdf-actions')];
  const allButtons=[...document.querySelectorAll(PDF_SELECTOR)];

  for(const row of allRows){
    if(!nearestOrder(row)){removeNode(row);changed=true}
  }
  for(const btn of allButtons){
    if(!nearestOrder(btn)){removeNode(btn);changed=true}
  }

  document.querySelectorAll('.order-card').forEach(card=>{
    const rows=[...card.querySelectorAll('.receipt-pdf-actions')].filter(r=>nearestOrder(r)===card);
    const buttons=[...card.querySelectorAll(PDF_SELECTOR)].filter(b=>nearestOrder(b)===card);
    if(!rows.length&&!buttons.length)return;

    let keepBtn=buttons[0]||null;
    let keepRow=(keepBtn&&keepBtn.closest('.receipt-pdf-actions'))||rows[0]||null;

    if(!keepRow&&keepBtn){
      keepRow=document.createElement('div');
      keepRow.className='receipt-pdf-actions';
      keepBtn.parentNode?.insertBefore(keepRow,keepBtn);
      keepRow.appendChild(keepBtn);
      changed=true;
    }

    for(const row of rows){
      if(row!==keepRow){removeNode(row);changed=true}
    }

    const currentButtons=keepRow?[...keepRow.querySelectorAll(PDF_SELECTOR)]:[];
    if(currentButtons.length)keepBtn=currentButtons[0];
    for(let i=1;i<currentButtons.length;i++){removeNode(currentButtons[i]);changed=true}

    for(const btn of [...card.querySelectorAll(PDF_SELECTOR)]){
      if(nearestOrder(btn)!==card||btn===keepBtn)continue;
      removeNode(btn.closest('.receipt-pdf-actions')||btn);
      changed=true;
    }

    if(keepBtn){
      keepBtn.setAttribute('data-receipt-pdf-941','1');
      keepBtn.removeAttribute('data-receipt-pdf941');
      keepBtn.textContent='Baixar PDF do pedido';
      keepBtn.dataset.orderActionUnique='pdf';
    }
    if(keepRow){
      keepRow.dataset.orderActionUnique='pdf-row';
      keepRow.setAttribute('data-pdf-action-single','1');
    }
  });
  return changed;
}

function cleanPix(){
  let changed=false;
  for(const box of [...document.querySelectorAll('.pix-card')]){
    if(!nearestOrder(box)){removeNode(box);changed=true}
  }

  document.querySelectorAll('.order-card').forEach(card=>{
    const boxes=[...card.querySelectorAll('.pix-card')].filter(p=>nearestOrder(p)===card);
    if(!boxes.length)return;
    const keep=boxes.find(p=>p.querySelector('[data-generate-pix-937]'))||boxes[0];
    for(const box of boxes){if(box!==keep){removeNode(box);changed=true}}

    const modern=[...keep.querySelectorAll('[data-generate-pix-937]')];
    const legacy=[...keep.querySelectorAll('[data-pix939]')];
    const primary=modern[0]||legacy[0]||null;
    for(const b of modern){if(b!==primary){removeNode(b);changed=true}}
    for(const b of legacy){if(b!==primary){removeNode(b);changed=true}}

    const groups=[...keep.querySelectorAll('.pix-pay-actions')];
    if(groups.length>1){for(let i=1;i<groups.length;i++){removeNode(groups[i]);changed=true}}
    if(primary){
      primary.textContent='Gerar QR Code PIX';
      primary.dataset.orderActionUnique='pix';
    }
    keep.dataset.orderActionUnique='pix-card';
  });
  return changed;
}

function clean(){
  const pdf=cleanPdf();
  const pix=cleanPix();
  return pdf||pix;
}

let timer=0;
function schedule(){
  clearTimeout(timer);
  timer=setTimeout(()=>{timer=0;clean()},40);
}
function boot(){
  clean();
  const root=document.body||document.documentElement;
  if(root){
    const mo=new MutationObserver(records=>{
      const relevant=records.some(r=>[...r.addedNodes].some(n=>n.nodeType===1&&(
        n.matches?.('.order-card,.receipt-pdf-actions,.receipt-pdf-btn,.pix-card,[data-receipt-pdf-941],[data-receipt-pdf941],[data-generate-pix-937],[data-pix939]')||
        n.querySelector?.('.order-card,.receipt-pdf-actions,.receipt-pdf-btn,.pix-card,[data-receipt-pdf-941],[data-receipt-pdf941],[data-generate-pix-937],[data-pix939]')
      )));
      if(relevant)schedule();
    });
    try{mo.observe(root,{childList:true,subtree:true})}catch(_){}
  }
  [50,120,250,500,900,1500,2500,4000,7000].forEach(ms=>setTimeout(clean,ms));
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
window.CaseirinhoOrderActionsDedupe942={version:'9.4.6',clean};
})();