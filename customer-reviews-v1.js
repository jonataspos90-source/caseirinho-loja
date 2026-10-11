(function(){'use strict';
if(window.__caseirinhoReviewsV1)return;
window.__caseirinhoReviewsV1=true;
const CFG=window.CASEIRINHO_CONFIG||{};
const API=String(CFG.apiUrl||'https://john-cloud-api-production.up.railway.app').replace(/\/+$/,'');
const STORE=String(new URLSearchParams(location.search).get('empresa')||
  new URLSearchParams(location.search).get('loja')||CFG.storeSlug||'caseirinho')
  .trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')
  .replace(/[^a-z0-9-]/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'')||'caseirinho';
const PREFIX='john_store_'+STORE+'_';
const ORDERS_KEY=PREFIX+'orders_v1';
const REVIEWED_PREFIX=PREFIX+'verified_review_v1_';
const url=API+'/api/v1/public/store/'+encodeURIComponent(STORE);
const E=id=>document.getElementById(id);
const S=x=>String(x??'');
const statusDone=x=>['ENTREGUE','RETIRADO'].includes(S(x).trim().toUpperCase());
let eligible=[],selected=0,submitting=false,loading=false,lastLoad=0,enabled=true;
function readOrders(){
  try{
    const list=JSON.parse(localStorage.getItem(ORDERS_KEY)||'[]');
    return Array.isArray(list)?list:[];
  }catch(_){return []}
}
function wasReviewed(id){
  try{return localStorage.getItem(REVIEWED_PREFIX+id)==='1'}catch(_){return false}
}
function markReviewed(id){
  try{localStorage.setItem(REVIEWED_PREFIX+id,'1')}catch(_){}
}
function message(text,error=false){
  const el=E('experienceResult');if(!el)return;
  el.textContent=text;el.classList.toggle('error',error);
}
function stars(){
  document.querySelectorAll('#rating-stars .review-star').forEach(btn=>{
    const active=Number(btn.dataset.value)<=selected;
    btn.classList.toggle('active',active);
    btn.setAttribute('aria-pressed',String(Number(btn.dataset.value)===selected));
  });
  toggle();
}
function toggle(){
  const order=E('experienceOrder'),submit=E('experienceSubmit');
  const available=enabled&&eligible.length>0&&!submitting;
  if(order)order.disabled=!available;
  if(submit)submit.disabled=!available||!selected;
  document.querySelectorAll('#rating-stars .review-star').forEach(b=>b.disabled=!available);
}
function paint(list){
  const host=E('lista-avaliacoes');
  if(!host)return;
  host.replaceChildren();
  if(!list.length){
    const empty=document.createElement('p');empty.className='review-empty';
    empty.textContent='Ainda não há avaliações publicadas. Seja o primeiro a avaliar após receber seu pedido!';
    host.appendChild(empty);return;
  }
  for(const item of list){
    const review=document.createElement('article');review.className='review-item';
    const meta=document.createElement('div');meta.className='review-meta';
    const name=document.createElement('strong');name.textContent=S(item.name||'Cliente Caseirinho');
    const date=document.createElement('time');
    const d=new Date(item.date);
    date.textContent=Number.isFinite(d.getTime())?d.toLocaleDateString('pt-BR'):'';
    meta.append(name,date);
    const rating=document.createElement('div');rating.className='review-stars';
    rating.setAttribute('aria-label',S(item.rating)+' de 5 estrelas');
    const n=Math.min(5,Math.max(1,Number(item.rating)||1));
    rating.textContent='★'.repeat(n)+'☆'.repeat(5-n);
    review.append(meta,rating);
    if(item.comment){
      const comment=document.createElement('p');
      comment.textContent=S(item.comment).slice(0,500);
      review.appendChild(comment);
    }
    host.appendChild(review);
  }
}
async function loadReviews(){
  const summary=E('experienceSummary'),list=E('lista-avaliacoes');
  try{
    const response=await fetch(url+'/reviews?_t='+Date.now(),{cache:'no-store'});
    const data=await response.json();
    if(!response.ok)throw Error(data.error||'Servidor indisponível');
    enabled=data.enabled!==false;
    const count=Math.max(0,Number(data.count)||0);
    const avg=Math.max(0,Math.min(5,Number(data.average)||0));
    if(summary)summary.textContent=count?
      '★ Média geral '+avg.toLocaleString('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:1})+
      '/5 · '+count.toLocaleString('pt-BR')+' '+(count===1?'avaliação recebida':'avaliações recebidas'):
      '0 avaliações recebidas · Média ainda indisponível';
    paint(Array.isArray(data.reviews)?data.reviews:[]);
    E('experienceForm')?.toggleAttribute('hidden',!enabled);
    toggle();
  }catch(_){
    if(summary)summary.textContent='Avaliações temporariamente indisponíveis';
    if(list)list.textContent='Não foi possível consultar as avaliações agora. Tente novamente.';
  }
}
async function verifyOrder(order){
  if(!order?.id||!order?.publicToken||wasReviewed(order.id))return null;
  try{
    const r=await fetch(url+'/orders/'+encodeURIComponent(order.id)+'/experience?token='+encodeURIComponent(order.publicToken),{cache:'no-store'});
    if(!r.ok)return null;
    const d=await r.json();
    return statusDone(d.status)?{id:S(order.id),token:S(order.publicToken),code:S(d.codigo||order.codigo||order.code||order.id)}:null;
  }catch(_){return null}
}
async function loadEligible(){
  if(loading)return;
  loading=true;lastLoad=Date.now();
  const select=E('experienceOrder'),hint=E('experienceEligibility');
  if(hint)hint.textContent='Conferindo seus pedidos entregues...';
  try{
    const unique=new Map();
    readOrders().slice(-30).reverse().forEach(o=>{
      if(o&&o.id&&o.publicToken&&!unique.has(S(o.id)))unique.set(S(o.id),o);
    });
    const verified=await Promise.all([...unique.values()].slice(0,12).map(verifyOrder));
    eligible=verified.filter(Boolean);
    if(!select)return;
    const previous=select.value;
    select.replaceChildren();
    if(!eligible.length){
      const placeholder=new Option('Nenhum pedido entregue disponível','');
      select.add(placeholder);
      if(hint)hint.textContent='Para avaliar, aguarde a entrega ou retirada. Se comprou em outro dispositivo, recupere seu pedido na aba Pedidos.';
    }else{
      eligible.forEach(o=>select.add(new Option('Pedido '+o.code,o.id)));
      if(eligible.some(o=>o.id===previous))select.value=previous;
      if(hint)hint.textContent='Selecione o pedido entregue ou retirado que deseja avaliar.';
    }
    toggle();
  }finally{loading=false}
}
async function submit(){
  const select=E('experienceOrder'),comment=E('input-comentario'),btn=E('experienceSubmit');
  const order=eligible.find(o=>o.id===select?.value);
  if(!order){message('Escolha um pedido já entregue para avaliar.',true);return}
  if(!selected){message('Por favor, escolha de 1 a 5 estrelas.',true);return}
  if(submitting)return;
  submitting=true;toggle();message('Enviando sua avaliação...');
  try{
    const response=await fetch(url+'/reviews',{
      method:'POST',cache:'no-store',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({orderId:order.id,token:order.token,rating:selected,comment:S(comment?.value).trim().slice(0,500)})
    });
    const result=await response.json();
    if(!response.ok)throw Error(result.error||'Não foi possível registrar sua avaliação.');
    markReviewed(order.id);
    if(comment)comment.value='';
    selected=0;stars();
    message('Obrigado! Sua avaliação foi registrada e já pode ser vista na loja.');
    await Promise.all([loadReviews(),loadEligible()]);
  }catch(err){message(S(err.message||'Falha de conexão. Tente novamente.'),true)}
  finally{submitting=false;toggle()}
}
function start(){
  if(!E('avaliacoes'))return;
  document.querySelectorAll('#rating-stars .review-star').forEach(b=>{
    b.addEventListener('click',()=>{selected=Number(b.dataset.value);stars();message('')});
  });
  E('experienceSubmit')?.addEventListener('click',submit);
  E('experienceRefresh')?.addEventListener('click',()=>{loadReviews();loadEligible()});
  E('experienceOrder')?.addEventListener('change',()=>message(''));
  window.addEventListener('storage',e=>{if(e.key===ORDERS_KEY)loadEligible()});
  window.addEventListener('focus',()=>{
    if(Date.now()-lastLoad>25000){loadEligible();loadReviews()}
  });
  document.addEventListener('visibilitychange',()=>{
    if(!document.hidden&&Date.now()-lastLoad>25000){loadEligible();loadReviews()}
  });
  stars();loadReviews();loadEligible();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
