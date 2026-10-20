(function(){'use strict';
// V2: vitrine de avaliações junto ao Cardápio e modal dos produtos em Meus Pedidos.
if(window.__caseirinhoReviewsV2)return;
window.__caseirinhoReviewsV2=true;
const CFG=window.CASEIRINHO_CONFIG||{};
const API=String(CFG.apiUrl||'https://john-cloud-api-production.up.railway.app').replace(/\/+$/,'');
const STORE=String(new URLSearchParams(location.search).get('empresa')||
  new URLSearchParams(location.search).get('loja')||CFG.storeSlug||'caseirinho')
  .trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')
  .replace(/[^a-z0-9-]/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'')||'caseirinho';
const PREFIX='john_store_'+STORE+'_';
const ORDERS_KEY=PREFIX+'orders_v1';
const REVIEWED_PREFIX=PREFIX+'product_review_done_v2_';
const SHOWN_PREFIX=PREFIX+'product_review_shown_v2_';
const url=API+'/api/v1/public/store/'+encodeURIComponent(STORE);
const E=id=>document.getElementById(id);
const S=v=>String(v??'');
const n=v=>Math.max(0,Number(v)||0);
const fmt=v=>n(v).toLocaleString('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:1});
let enabled=true,opened=false,checking=false,latestRequest=0;
let activeReviewKind='ALL',lastReviews=[],reviewCounts={APP:0,PRODUCT:0};
function orders(){try{const r=JSON.parse(localStorage.getItem(ORDERS_KEY)||'[]');return Array.isArray(r)?r:[]}catch(_){return []}}
function productRated(id){try{return localStorage.getItem(REVIEWED_PREFIX+id)==='1'}catch(_){return false}}
function markProductRated(id){try{localStorage.setItem(REVIEWED_PREFIX+id,'1')}catch(_){}}
function wasShown(id){try{return localStorage.getItem(SHOWN_PREFIX+id)==='1'}catch(_){return false}}
function markShown(id){try{localStorage.setItem(SHOWN_PREFIX+id,'1')}catch(_){}}
function date(v){const d=new Date(v);return Number.isFinite(d.getTime())?d.toLocaleDateString('pt-BR'):''}
function setMessage(text){const el=E('reviewsFetchStatus');if(el)el.textContent=text}
function paint(reviews){
  const target=E('lista-avaliacoes');if(!target)return;
  target.replaceChildren();
  const list=(Array.isArray(reviews)?reviews:[]).filter(r=>activeReviewKind==='ALL'||r.kind===activeReviewKind).slice(0,100);
  if(!list.length){const p=document.createElement('p');p.className='review-empty';p.textContent=activeReviewKind==='ALL'?'Ainda não há avaliações públicas disponíveis.':'Ainda não há comentários disponíveis nesta categoria.';target.appendChild(p);return}
  for(const r of list){
    const item=document.createElement('article');item.className='review-item';
    const meta=document.createElement('div');meta.className='review-meta';
    const name=document.createElement('strong');name.textContent=S(r.name||'Cliente Caseirinho');
    const when=document.createElement('time');when.textContent=date(r.date);
    meta.append(name,when);
    const tag=document.createElement('div');tag.className='review-topic';
    tag.textContent=r.kind==='PRODUCT'?'😋 Produtos e sabor':'📱 App e experiência';
    const stars=document.createElement('div');stars.className='review-stars';
    const rating=Math.max(1,Math.min(5,Number(r.rating)||1));
    stars.textContent='★'.repeat(rating)+'☆'.repeat(5-rating);
    stars.setAttribute('aria-label',rating+' de 5 estrelas');
    item.append(meta,tag,stars);
    if(r.comment){const p=document.createElement('p');p.textContent=S(r.comment);item.appendChild(p)}
    target.appendChild(item);
  }
}
function updateReviewsFilter(){
  const root=E('avaliacoes');if(!root)return;
  for(const [kind,selector] of [['APP','[data-review-filter="APP"]'],['PRODUCT','[data-review-filter="PRODUCT"]']]){
    const el=root.querySelector(selector);if(el){el.classList.toggle('reviews-metric-active',activeReviewKind===kind);el.setAttribute('aria-pressed',String(activeReviewKind===kind));}
  }
  const reset=E('reviewsShowAll');if(reset)reset.hidden=activeReviewKind==='ALL';
  const total=activeReviewKind==='ALL'?reviewCounts.APP+reviewCounts.PRODUCT:reviewCounts[activeReviewKind];
  const count=E('experienceSummary');if(count)count.textContent=total+' '+(total===1?'avaliação registrada':'avaliações registradas')+(activeReviewKind==='ALL'?'':activeReviewKind==='APP'?' · App e experiência':' · Produtos e sabor');
  paint(lastReviews);
}
function filterReviews(kind){activeReviewKind=['APP','PRODUCT'].includes(kind)?kind:'ALL';updateReviewsFilter();loadReviews();}
async function loadReviews(){
  try{
    const params=new URLSearchParams({_t:String(Date.now()),limit:'200'});
    if(activeReviewKind!=='ALL')params.set('kind',activeReviewKind);
    const response=await fetch(url+'/reviews?'+params.toString(),{cache:'no-store'});
    const data=await response.json();
    if(!response.ok||data.ok!==true)throw Error('Não foi possível carregar as avaliações.');
    enabled=data.enabled!==false;
    const app=data.app||{},product=data.product||{};
    const ids=[['reviewsAppAvg',app.count?fmt(app.average)+'/5':'—'],['reviewsAppCount',n(app.count)+' avaliação(ões)'],
      ['reviewsProductAvg',product.count?fmt(product.average)+'/5':'—'],['reviewsProductCount',n(product.count)+' avaliação(ões)'],
      ['experienceSummary',n(data.total)+' avaliações registradas']];
    for(const [id,value] of ids){const e=E(id);if(e)e.textContent=value}
    reviewCounts={APP:n(app.count),PRODUCT:n(product.count)};
    lastReviews=Array.isArray(data.reviews)?data.reviews:[];
    updateReviewsFilter();
    setMessage(enabled?'Notas e comentários reais de clientes · nomes abreviados.':'Avaliações temporariamente desativadas.');
  }catch(e){setMessage('Não foi possível atualizar as avaliações. Tente novamente.');}
}
function getOrder(id,provided){
  const a=Array.isArray(provided)?provided:orders();
  return a.find(o=>S(o?.id)===S(id)&&S(o?.publicToken).length>=20)||null;
}
async function status(order){
  if(!order?.id||!order?.publicToken)return null;
  try{
    const r=await fetch(url+'/orders/'+encodeURIComponent(order.id)+'/reviews/status?token='+encodeURIComponent(order.publicToken),{cache:'no-store'});
    if(!r.ok)return null;
    return await r.json();
  }catch(_){return null}
}
function popupToast(msg){
  let el=E('reviewsToast');
  if(!el){el=document.createElement('div');el.id='reviewsToast';el.className='reviews-toast';document.body.appendChild(el)}
  el.textContent=msg;
  window.setTimeout(()=>{if(el.textContent===msg)el.remove()},4500);
}
function renderPopup(order,reviewed={}){
  const overlay=document.createElement('div');overlay.id='reviewProductPopup';overlay.className='reviews-overlay';
  overlay.innerHTML=
    '<section class="reviews-dialog" role="dialog" aria-modal="true" aria-labelledby="productReviewTitle">'+
    '<header class="reviews-dialog-head"><span>🌟 Sua experiência importa</span><button type="button" id="productReviewClose" aria-label="Fechar avaliação">×</button></header>'+
    '<div class="reviews-dialog-body">'+
      '<span class="reviews-chip">Pedido '+S(order.codigo||order.code||order.id).replace(/[&<>"']/g,'')+'</span>'+
      '<h2 id="productReviewTitle">😋 Como estavam os produtos?</h2>'+
      '<p>Avalie sua compra uma única vez após a entrega ou retirada. Você pode dar notas diferentes para produtos e aplicativo.</p>'+
      '<div class="reviews-aspect-info">✅ Avalie os produtos e, se desejar, a experiência no aplicativo nesta mesma tela.</div>'+
      '<label class="reviews-field-label" id="productRatingLabel">Sua nota para os produtos</label>'+
      '<div class="reviews-modal-stars" role="group" aria-labelledby="productRatingLabel">'+
        [1,2,3,4,5].map(x=>'<button type="button" data-product-star="'+x+'" aria-label="'+x+' estrelas" aria-pressed="false">★</button>').join('')+
      '</div><p id="productRatingHint" class="reviews-star-hint">Toque nas estrelas para dar sua nota ⭐</p>'+
      (reviewed.APP?'<p class="reviews-aspect-info">📱 O aplicativo já foi avaliado neste pedido.</p>':
        '<label class="reviews-field-label" id="appRatingLabel">📱 Experiência no aplicativo (opcional)</label>'+
        '<div class="reviews-modal-stars" role="group" aria-labelledby="appRatingLabel">'+
        [1,2,3,4,5].map(x=>'<button type="button" data-app-star="'+x+'" aria-label="'+x+' estrelas para o app" aria-pressed="false">★</button>').join('')+
        '</div><p class="reviews-star-hint">Facilidade para comprar e acompanhar o pedido.</p>')+
      '<label class="reviews-field-label" for="productReviewComment">Comentário sobre os produtos <small>(opcional)</small></label>'+
      '<textarea id="productReviewComment" maxlength="500" placeholder="O nhoque estava delicioso? Gostou do sabor, da temperatura e da apresentação?"></textarea>'+
      '<p class="reviews-privacy">🔒 Seu nome será exibido somente pelas iniciais; a nota e o comentário poderão aparecer em Avaliações.</p>'+
      '<button type="button" id="productReviewSend" class="reviews-dialog-send" disabled>Enviar avaliação dos produtos</button>'+
      '<p id="productReviewStatus" class="reviews-modal-status" role="status"></p>'+
    '</div></section>';
  document.body.appendChild(overlay);
  let rating=0,appRating=0,appSaved=!!reviewed.APP,submitting=false;
  const close=()=>{overlay.remove();opened=false;};
  E('productReviewClose').onclick=close;
  overlay.addEventListener('click',ev=>{if(ev.target===overlay)close()});
  const stars=[...overlay.querySelectorAll('[data-product-star]')];
  stars.forEach(button=>button.addEventListener('click',()=>{
    rating=Number(button.dataset.productStar);
    stars.forEach(b=>{const active=Number(b.dataset.productStar)<=rating;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active))});
    E('productRatingHint').textContent=['','😕 Vamos melhorar','🙂 Obrigado por contar','😊 Que bom!','😍 Que delícia!','🤩 Que alegria!'][rating];
    E('productReviewSend').disabled=false;
  }));
  const appStars=[...overlay.querySelectorAll('[data-app-star]')];
  appStars.forEach(button=>button.addEventListener('click',()=>{
    appRating=Number(button.dataset.appStar);
    appStars.forEach(b=>{const active=Number(b.dataset.appStar)<=appRating;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active))});
  }));
  E('productReviewSend').onclick=async()=>{
    if(submitting||!rating)return;
    const button=E('productReviewSend'),msg=E('productReviewStatus');
    submitting=true;button.disabled=true;button.textContent='Enviando avaliação...';msg.textContent='';
    try{
      // Avaliações independentes por aspecto, com verificação de duplicidade no servidor.
      if(appRating&&!appSaved){
        const appResponse=await fetch(url+'/reviews',{
          method:'POST',cache:'no-store',headers:{'Content-Type':'application/json'},
          body:JSON.stringify({orderId:S(order.id),token:S(order.publicToken),
            kind:'APP',rating:appRating,comment:''})
        });
        const appResult=await appResponse.json();
        if(!appResponse.ok&&appResponse.status!==409)throw Error(appResult.error||'Erro ao avaliar o aplicativo.');
        appSaved=true;
      }
      const response=await fetch(url+'/reviews',{
        method:'POST',cache:'no-store',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({orderId:S(order.id),token:S(order.publicToken),
          kind:'PRODUCT',rating,comment:S(E('productReviewComment').value).trim().slice(0,500)})
      });
      const result=await response.json();
      if(!response.ok)throw Error(result.error||'Falha ao salvar. Tente novamente.');
      markProductRated(order.id);
      document.querySelectorAll('[data-review-order]').forEach(b=>{if(b.dataset.reviewOrder===S(order.id))b.remove()});
      await loadReviews();
      overlay.querySelector('.reviews-dialog-body').innerHTML=
        '<div class="reviews-thanks"><div>🎉 😋 ⭐</div><h2>Obrigado pelo carinho!</h2>'+
        '<p>Sua avaliação dos produtos foi registrada e vai ajudar outros clientes.</p>'+
        '<button class="reviews-dialog-send" id="productReviewDone" type="button">Concluir</button></div>';
      E('productReviewDone').onclick=close;
    }catch(err){msg.textContent=S(err.message);button.textContent='Tentar novamente';button.disabled=false;submitting=false}
  };
  return overlay;
}
async function openProductReview(id,provided,automatic=false){
  if(opened||!enabled)return;
  const order=getOrder(id,provided);
  if(!order){if(!automatic)popupToast('Recupere seu pedido em Meus Pedidos para avaliar.');return}
  const check=await status(order);
  if(!check?.ok){if(!automatic)popupToast('Não conseguimos conferir o pedido. Atualize e tente novamente.');return}
  if(!check.allowedProduct){
    if(check.reviewed?.PRODUCT)markProductRated(order.id);
    if(!automatic)popupToast(check.reviewed?.PRODUCT?'Os produtos deste pedido já foram avaliados.':'A avaliação dos produtos fica disponível após a entrega ou retirada do pedido.');
    return;
  }
  if(opened)return;
  opened=true;markShown(order.id);
  renderPopup(order,check.reviewed||{});
}
async function onOrdersViewed(list){
  if(checking||opened||!enabled)return;
  const nonce=++latestRequest;checking=true;
  try{
    const recent=(Array.isArray(list)?list:orders()).slice().reverse()
      .filter(o=>o&&o.id&&o.publicToken&&['ENTREGUE','RETIRADO','CONCLUIDO','FINALIZADO'].includes(S(o.status||'').toUpperCase())&&!productRated(o.id)&&!wasShown(o.id)).slice(0,8);
    for(const order of recent){
      if(nonce!==latestRequest||opened)break;
      const check=await status(order);
      if(!check?.ok)continue;
      if(check.reviewed?.PRODUCT){markProductRated(order.id);continue}
      if(check.allowedProduct){await openProductReview(order.id,list,true);break}
    }
  }finally{checking=false}
}
function init(){
  if(!E('reviewsViewTemplate')||!E('navReviews'))return;
  document.addEventListener('click',e=>{if(e.target.closest?.('#experienceRefresh'))loadReviews()});
  document.addEventListener('click',e=>{const control=e.target.closest?.('[data-review-filter]');if(control&&E('avaliacoes'))filterReviews(control.dataset.reviewFilter)});
  document.addEventListener('keydown',e=>{const control=e.target.closest?.('[data-review-filter]');if(control&&(e.key==='Enter'||e.key===' ')){e.preventDefault();filterReviews(control.dataset.reviewFilter)}});
  document.addEventListener('click',e=>{
    const button=e.target.closest?.('[data-review-order]');
    if(!button)return;
    e.preventDefault();
    openProductReview(button.dataset.reviewOrder);
  });
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&E('reviewProductPopup'))E('productReviewClose')?.click()});
  window.addEventListener('focus',()=>{if(E('avaliacoes'))loadReviews()});
}
window.CaseirinhoReviewsV2={loadReviews,openShowcase:()=>{activeReviewKind='ALL';if(E('avaliacoes'))return loadReviews()},onOrdersViewed,openProductReview,productRated};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();