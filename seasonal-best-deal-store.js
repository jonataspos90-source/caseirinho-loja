/* Vitrine de melhor negocio para os packs sazonais oficiais (precos validados no servidor). */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const B=()=>window.CaseirinhoSeasonalBridge;
const val=x=>String(x==null?'':x);
const n=x=>Number(x)||0;
const cents=x=>Math.round((n(x)+Number.EPSILON)*100);
const brl=x=>(Number(x)||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
function activeCampaign(){
 const b=B();return b?.seasonalCampaign?.(b.getSelectedCampaignId?.())||null;
}
function packFor(card){
 const c=activeCampaign(),pack=(c?.packs||[]).find(p=>val(p.id)===card.dataset.seasonPack);
 if(!pack)return null;
 const products=(c.products||[]).filter(p=>(pack.productIds||[]).map(String).includes(val(p.id)));
 return{pack,products,c};
}
function update(card){
 const info=packFor(card);if(!info)return;
 const {pack,products,c}=info,byId=new Map(products.map(p=>[val(p.id),p]));
 const rows=[...card.querySelectorAll('[data-season-pack-qty]')];
 const selection=rows.map(input=>({input,p:byId.get(input.dataset.seasonPackQty),qty:n(input.value)}));
 const count=selection.reduce((a,x)=>a+x.qty,0),need=n(pack.quantity);
 const total=selection.reduce((a,x)=>a+cents(x.p?.price)*x.qty,0),paid=cents(pack.price),saving=total-paid;
 const valid=selection.every(x=>Number.isInteger(x.qty)&&x.qty>=0&&(x.qty===0||x.qty>=Math.max(1,n(x.p?.minQuantity)))&&(!(n(x.p?.maxQuantity)>0)||x.qty<=n(x.p.maxQuantity)));
 const ready=count===need&&valid&&c.status==='ABERTA'&&saving>0;
 const msg=card.querySelector('[data-bestdeal-message]');
 if(msg){
  if(!count)msg.textContent='Escolha os sabores e distribua '+need+' unidades para formar seu combo.';
  else if(!valid)msg.textContent='Confira a quantidade mínima e máxima de cada sabor.';
  else if(count>need)msg.textContent='Você selecionou '+count+' unidades. Retire '+(count-need)+' para completar o kit.';
  else if(count<need)msg.textContent='Faltam '+(need-count)+' unidades para completar seu combo.';
  else if(saving<=0)msg.textContent='Esta combinação sai mais barata comprando avulso. Ajuste os sabores para obter desconto.';
  else msg.textContent='✅ Seu combo ficou pronto: de '+brl(total/100)+' por '+brl(pack.price)+' · você economiza '+brl(saving/100)+'!';
  msg.classList.toggle('is-ready',ready);
 }
 const btn=card.querySelector('[data-season-pack-add]');
 if(btn){btn.disabled=!ready;btn.textContent=ready?'🛒 Aproveitar meu Melhor Negócio':'🎁 Adicionar combo à encomenda';}
 const bar=card.querySelector('[data-bestdeal-fill]');
 if(bar)bar.style.width=Math.min(100,Math.max(0,count/Math.max(need,1)*100))+'%';
 const reset=card.querySelector('[data-bestdeal-clear]');
 if(reset)reset.disabled=!count;
}
function decorate(card){
 if(card.dataset.bestDealReady==='1')return;
 const info=packFor(card);if(!info)return;
 const {pack,products}=info,quantity=Math.floor(n(pack.quantity));
 const prices=products.map(p=>cents(p.price)).filter(x=>x>0);
 if(!prices.length||quantity<2)return;
 const cheapest=Math.min(...prices),dearest=Math.max(...prices),fullMin=cheapest*quantity,fullMax=dearest*quantity,packPrice=cents(pack.price);
 const best=packPrice>0&&packPrice<fullMin;
 card.dataset.bestDealReady='1';card.classList.add('seasonal-bestdeal-card');
 if(best)card.classList.add('seasonal-bestdeal-verified');
 const body=card.querySelector('.seasonal-pack-body');
 if(!body)return;
 const flag=card.querySelector('.seasonal-pack-flag');
 if(flag)flag.textContent=best?'🔥 MELHOR NEGÓCIO':'🎁 COMBO DE ENCOMENDAS';
 const title=document.createElement('div');title.className='seasonal-bestdeal-lead';
 title.innerHTML='<strong>Monte seu combo de '+quantity+' unidades</strong><span>Escolha os sabores e pague um valor fechado</span>';
 body.insertBefore(title,body.querySelector('h3'));
 const oldPrice=card.querySelector('.seasonal-pack-price');
 if(oldPrice){
  const deal=document.createElement('div');deal.className='seasonal-bestdeal-comparison';
  deal.innerHTML=(best?'<del>De '+brl(fullMin/100)+'</del>':'<small>Preço do combo</small>')+
   '<span>Por '+brl(pack.price)+'</span>'+
   '<small>Equivale a '+brl(n(pack.price)/quantity)+' por unidade</small>'+
   (best?'<em>Economize no mínimo '+brl((fullMin-packPrice)/100)+' nesta oferta</em>':'');
  oldPrice.replaceWith(deal);
 }
 const p=card.querySelector('.seasonal-pack-progress');
 if(p){
  const track=document.createElement('div');track.className='seasonal-bestdeal-track';
  track.innerHTML='<span data-bestdeal-fill></span>';
  p.insertAdjacentElement('afterend',track);
  const message=document.createElement('p');message.className='seasonal-bestdeal-message';message.setAttribute('data-bestdeal-message','');
  track.insertAdjacentElement('afterend',message);
 }
 const builder=card.querySelector('.seasonal-pack-builder');
 if(builder){
  builder.querySelectorAll('[data-season-pack-qty]').forEach(input=>{
   input.setAttribute('inputmode','numeric');
   const holder=document.createElement('span');holder.className='seasonal-bestdeal-stepper';
   const dec=document.createElement('button');dec.type='button';dec.dataset.bestdealStep='-1';dec.textContent='−';dec.setAttribute('aria-label','Reduzir '+(input.getAttribute('aria-label')||'quantidade'));
   const inc=document.createElement('button');inc.type='button';inc.dataset.bestdealStep='1';inc.textContent='+';inc.setAttribute('aria-label','Aumentar '+(input.getAttribute('aria-label')||'quantidade'));
   input.before(holder);holder.append(dec,input,inc);
  });
  const clear=document.createElement('button');clear.type='button';clear.className='seasonal-bestdeal-clear';clear.dataset.bestdealClear='';clear.textContent='Limpar seleção';
  builder.insertAdjacentElement('afterend',clear);
 }
 update(card);
}
function scan(){
 document.querySelectorAll('#seasonalPacks [data-season-pack]').forEach(decorate);
}
function boot(){
 const root=$('seasonalPacks');if(!root)return;
 scan();
 new MutationObserver(scan).observe(root,{childList:true,subtree:false});
 document.addEventListener('input',e=>{
  const input=e.target.closest?.('[data-season-pack-qty]');
  if(input)update(input.closest('[data-season-pack]'));
 });
 document.addEventListener('click',e=>{
  const step=e.target.closest?.('[data-bestdeal-step]');
  if(step){
   const card=step.closest('[data-season-pack]'),input=step.parentElement.querySelector('[data-season-pack-qty]'),info=packFor(card);
   if(!info||!input)return;
   const p=info.products.find(p=>val(p.id)===input.dataset.seasonPackQty);
   const min=Math.max(1,n(p?.minQuantity)),max=n(p?.maxQuantity),old=n(input.value);
   const chosen=[...card.querySelectorAll('[data-season-pack-qty]')].reduce((s,x)=>s+n(x.value),0);
   let next=old;
   if(step.dataset.bestdealStep==='1'){
    const add=old===0?min:1;
    if(chosen+add<=n(info.pack.quantity)&&(max<=0||old+add<=max))next=old+add;
   }else if(old>0)next=old<=min?0:old-1;
   if(next!==old){input.value=next;input.dispatchEvent(new Event('input',{bubbles:true}));}
   return;
  }
  const clear=e.target.closest?.('[data-bestdeal-clear]');
  if(clear){
   const card=clear.closest('[data-season-pack]'),inputs=[...card.querySelectorAll('[data-season-pack-qty]')];
   inputs.forEach(x=>x.value=0);
   if(inputs.length)inputs[0].dispatchEvent(new Event('input',{bubbles:true}));
  }
 });
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();