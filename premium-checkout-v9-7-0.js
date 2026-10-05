(()=>{'use strict';
if(window.__CASEIRINHO_PREMIUM_CHECKOUT_970__)return;
window.__CASEIRINHO_PREMIUM_CHECKOUT_970__=true;

const CFG=window.CASEIRINHO_CONFIG||{};
const S=v=>String(v??'');
const STORE=S(new URLSearchParams(location.search).get('empresa')||new URLSearchParams(location.search).get('loja')||CFG.storeSlug||'caseirinho')
  .trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9-]/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'');
if(STORE!=='caseirinho')return;

const E=id=>document.getElementById(id);
let observer=null;
let busy=false;

function addIntro(){
  const panel=E('cartDrawer')?.querySelector('.drawer-panel');
  const head=panel?.querySelector('.drawer-head');
  if(!panel||!head||E('caseirinhoCheckoutIntro970'))return;
  const box=document.createElement('div');
  box.id='caseirinhoCheckoutIntro970';
  box.className='caseirinho-checkout-intro';
  box.innerHTML=`<div class="mark">♥</div><div><b>Seu momento Caseirinho começa aqui</b><span>Revise tudo com calma. Produtos, adicionais, entrega e total serão mostrados de forma clara antes de você enviar.</span></div>`;
  head.insertAdjacentElement('afterend',box);
}

function addTrustRow(){
  const form=E('checkout'),submit=form?.querySelector('.submit');
  if(!form||!submit||E('premiumTrustRow970'))return;
  const row=document.createElement('div');
  row.id='premiumTrustRow970';
  row.className='premium-trust-row';
  row.innerHTML='<span>🔒 Pedido seguro</span><span>✓ Valores conferidos</span><span>💬 Acompanhamento pelo WhatsApp</span>';
  submit.insertAdjacentElement('afterend',row);
}

function decorateTotals(){
  const totals=document.querySelector('.totals');
  if(!totals)return;
  totals.classList.add('premium-totals');
  const labels=[...totals.querySelectorAll(':scope > div > span')];
  for(const label of labels){
    const t=S(label.textContent).trim();
    if(t==='Produtos'&&!label.dataset.premiumIcon){label.dataset.premiumIcon='1';label.textContent='🍝 Produtos'}
    else if(t==='Entrega'&&!label.dataset.premiumIcon){label.dataset.premiumIcon='1';label.textContent='🛵 Entrega'}
    else if(t==='Total'&&!label.dataset.premiumIcon){label.dataset.premiumIcon='1';label.textContent='Total do pedido'}
  }
}

function decorateDeliveryConfirm(){
  const card=E('deliveryMotoConfirm954')?.querySelector('.dm954-card');
  if(!card)return;
  card.classList.add('premium-final-summary');
  const h=card.querySelector('h2');
  if(h&&h.textContent.trim()==='Fazer o Pedido?')h.textContent='Fazer o pedido?';
  const note=card.querySelector(':scope > .dm954-note');
  if(note&&!note.dataset.premiumText){
    note.dataset.premiumText='1';
    note.textContent='Confira os valores antes de enviar. Tudo certo? Seu pedido já vai para o Caseirinho.';
  }
}

function customerTotalState(){
  try{
    const s=window.CaseirinhoParmesaoUpsell936?.totalState?.();
    if(s)return s;
  }catch(_){}
  return null;
}

function decorateCustomerDialog(){
  const ov=E('customerExperienceOverlay');
  if(!ov)return;
  const title=E('customerExperienceTitle');
  const body=E('customerExperienceBody');
  const text=S(title?.textContent).trim();
  if(!title||!body)return;

  ov.classList.toggle('premium-delivery-dialog',text==='Confirme sua entrega');
  ov.classList.toggle('premium-accepted-dialog',/pedido foi aceito/i.test(text));
  ov.classList.toggle('premium-rating-dialog',/avalie seu pedido/i.test(text));

  if(text==='Confirme sua entrega'){
    const state=customerTotalState();
    if(state&&!E('premiumDeliveryTotal970')){
      const line=document.createElement('div');
      line.id='premiumDeliveryTotal970';
      line.className='premium-delivery-total';
      line.innerHTML=`<span>🛒 Total com entrega</span><b>${state.pending?state.productsAfter.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})+' + entrega':state.total.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</b>`;
      const highlight=body.querySelector('.cx-highlight');
      highlight?.insertAdjacentElement('afterend',line);
    }
  }else{
    E('premiumDeliveryTotal970')?.remove();
  }

  if(/pedido foi aceito/i.test(text)&&!E('premiumAcceptedMessage970')){
    const msg=document.createElement('div');
    msg.id='premiumAcceptedMessage970';
    msg.className='premium-delivery-total';
    msg.innerHTML='<span>❤️ Obrigado por escolher o Caseirinho</span><b>Pedido confirmado</b>';
    body.insertAdjacentElement('afterbegin',msg);
  }
}

function decorateParmesao(){
  const box=E('parmesaoUpsell936');
  if(!box)return;
  const title=box.querySelector('.parmesao-upsell-copy b');
  const copy=box.querySelector('.parmesao-upsell-copy span');
  if(title&&!title.dataset.premiumCopy){
    title.dataset.premiumCopy='1';
    title.textContent='Um toque especial para deixar ainda mais gostoso?';
  }
  if(copy&&!copy.dataset.premiumCopy){
    copy.dataset.premiumCopy='1';
    copy.textContent='Acrescente Queijo Parmesão Vale ao seu pedido.';
  }
}

function decorateCheckout(){
  document.body.classList.add('caseirinho-premium-ui');
  const submit=E('checkout')?.querySelector('.submit');
  if(submit&&!submit.dataset.premiumCopy){submit.dataset.premiumCopy='1';submit.textContent='Confirmar meu pedido  →'}
  addIntro();addTrustRow();decorateTotals();decorateDeliveryConfirm();decorateCustomerDialog();decorateParmesao();
}

function sync(){
  if(busy)return;busy=true;
  try{decorateCheckout()}finally{busy=false}
}

function boot(){
  sync();
  if(!observer&&document.body){
    observer=new MutationObserver(()=>queueMicrotask(sync));
    observer.observe(document.body,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['class','aria-hidden','style']});
  }
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
[150,500,1000,2000].forEach(ms=>setTimeout(sync,ms));
window.CaseirinhoPremiumCheckout970={version:'9.7.0',sync};
})();
