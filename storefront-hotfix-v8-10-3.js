(function(){
'use strict';
if(window.__CASEIRINHO_HOTFIX_8103__) return;
window.__CASEIRINHO_HOTFIX_8103__ = true;

const VERSION = '8.10.3';
const E = id => document.getElementById(id);

function installStyle(){
  if(E('case-v8103-mobile-fix-style')) return;
  const s = document.createElement('style');
  s.id = 'case-v8103-mobile-fix-style';
  s.textContent = `
    html,body{max-width:100%;overflow-x:hidden}
    /* Mantém apenas uma legenda de imagem. As versões anteriores criavam 2 ou 3 sobrepostas. */
    .product-pic:has(img)::after,.gallery-main:has(img)::after{display:none!important}
    .case-v870-image-note{display:none!important}
    .case-v88-image-note{
      left:10px!important;right:10px!important;bottom:9px!important;
      width:auto!important;text-align:center!important;
      background:rgba(17,24,39,.82)!important;color:#fff!important;
      padding:6px 8px!important;border-radius:10px!important;
      font-size:9px!important;font-weight:850!important;z-index:8!important;
      pointer-events:none!important;
    }

    html.case-v8103-product-open,body.case-v8103-product-open{
      overflow:hidden!important;overscroll-behavior:none!important;
    }

    #productModal.modal{
      box-sizing:border-box!important;
      overscroll-behavior:contain!important;
    }
    #productModal .product-modal{
      box-sizing:border-box!important;
      min-width:0!important;
    }
    #productModal .gallery-main{
      box-sizing:border-box!important;
      position:relative!important;
    }

    @media(max-width:720px){
      #productModal.modal{
        padding:0!important;
        align-items:stretch!important;
        justify-items:stretch!important;
        overflow:hidden!important;
      }
      #productModal.modal.open{
        display:flex!important;
        align-items:stretch!important;
        justify-content:stretch!important;
      }
      #productModal .product-modal{
        display:flex!important;
        flex-direction:column!important;
        width:100%!important;
        max-width:none!important;
        height:100dvh!important;
        max-height:100dvh!important;
        margin:0!important;
        border-radius:0!important;
        padding:
          calc(58px + env(safe-area-inset-top))
          14px
          calc(28px + env(safe-area-inset-bottom))
          14px!important;
        gap:12px!important;
        overflow-x:hidden!important;
        overflow-y:auto!important;
        -webkit-overflow-scrolling:touch!important;
        overscroll-behavior:contain!important;
      }
      #productModal .product-modal>div{
        width:100%!important;
        min-width:0!important;
      }
      #productModal .gallery-main{
        width:100%!important;
        height:min(42dvh,340px)!important;
        min-height:220px!important;
        max-height:340px!important;
        aspect-ratio:auto!important;
        border-radius:18px!important;
        overflow:hidden!important;
        background:var(--m-panel2,#f8eef2)!important;
      }
      #productModal .gallery-main img{
        display:block!important;
        width:100%!important;
        height:100%!important;
        max-width:100%!important;
        max-height:100%!important;
        object-fit:contain!important;
        object-position:center!important;
      }
      #productModal .thumbs{
        width:100%!important;
        max-width:100%!important;
        overflow-x:auto!important;
        padding-bottom:2px!important;
      }
      #productModal .modal-info{
        width:100%!important;
        min-width:0!important;
        padding:4px 2px 22px!important;
      }
      #productModal .modal-info h2{
        font-size:24px!important;
        line-height:1.15!important;
        overflow-wrap:anywhere!important;
      }
      #productModal .desc-full{
        overflow-wrap:anywhere!important;
      }
      #productModal .modal-close{
        position:fixed!important;
        top:calc(10px + env(safe-area-inset-top))!important;
        right:12px!important;
        z-index:205!important;
        width:42px!important;
        height:42px!important;
        display:grid!important;
        place-items:center!important;
      }
      #productModal .case-v88-variant-picker{
        width:100%!important;
        margin:12px 0!important;
      }
      #productModal .case-v88-variant-buttons{
        display:grid!important;
        grid-template-columns:repeat(2,minmax(0,1fr))!important;
        gap:8px!important;
        width:100%!important;
      }
      #productModal .case-v88-variant-buttons button{
        min-width:0!important;
        width:100%!important;
        max-width:100%!important;
        overflow-wrap:anywhere!important;
      }
      #productModal #modalQty{
        flex:0 0 90px!important;
        width:90px!important;
        min-width:0!important;
      }
      #productModal #modalAdd{
        min-width:0!important;
      }
    }

    @media(max-width:390px){
      #productModal .gallery-main{
        height:36dvh!important;
        min-height:190px!important;
      }
      #productModal .case-v88-variant-buttons{
        grid-template-columns:1fr 1fr!important;
      }
    }
  `;
  document.head.appendChild(s);
}

function removeLeakedSource(){
  /* Proteção adicional para uma página que tenha sido aberta por um cache antigo já corrompido. */
  try{
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const bad = [];
    let n;
    while((n = walker.nextNode())){
      const t = String(n.nodeValue || '');
      if(
        (t.includes("w.document.close()}") && t.includes("function enhanceSuccess")) ||
        (t.includes("caseV83Overlay") && t.includes("caseV83CartCount") && t.length > 250)
      ) bad.push(n);
    }
    bad.forEach(n => { n.nodeValue = ''; });
  }catch(_){}
}

let modalWasOpen = false;
function syncModal(){
  const modal = E('productModal');
  if(!modal) return;
  const open = modal.classList.contains('open');
  document.documentElement.classList.toggle('case-v8103-product-open', open);
  document.body.classList.toggle('case-v8103-product-open', open);

  if(open && !modalWasOpen){
    const panel = modal.querySelector('.product-modal');
    if(panel) panel.scrollTop = 0;
  }
  modalWasOpen = open;
}

function watchModal(){
  const modal = E('productModal');
  if(!modal) return false;
  if(!modal.dataset.v8103Observed){
    modal.dataset.v8103Observed = '1';
    new MutationObserver(syncModal).observe(modal,{attributes:true,attributeFilter:['class']});
  }
  syncModal();
  return true;
}

function normalizeTitle(){
  const current = String(document.title || '');
  if(/V\d+\.\d+(?:\.\d+)?/i.test(current)){
    document.title = current.replace(/V\d+\.\d+(?:\.\d+)?/i,'V'+VERSION);
  }
}

function init(){
  installStyle();
  normalizeTitle();
  removeLeakedSource();
  watchModal();

  document.addEventListener('click', ev => {
    const t = ev.target;
    if(t && (t.id === 'closeProduct' || t.id === 'productModal')){
      setTimeout(syncModal,0);
    }
  }, true);

  new MutationObserver(() => {
    if(!E('case-v8103-mobile-fix-style')) installStyle();
    if(!watchModal()) return;
  }).observe(document.documentElement,{childList:true,subtree:true});

  setTimeout(removeLeakedSource,300);
  setTimeout(removeLeakedSource,1200);
  console.info('[Caseirinho Loja] hotfix V8.10.3 ativo');
}

if(document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded',init,{once:true});
}else{
  init();
}
})();
