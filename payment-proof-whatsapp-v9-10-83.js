/* Caseirinho | Comprovante no WhatsApp + CNPJ PIX, sem mudar os pagamentos oficiais. */
(()=>{
'use strict';
if(window.__CASEIRINHO_PROOF_WHATSAPP_91083__)return;
window.__CASEIRINHO_PROOF_WHATSAPP_91083__=true;
const KEY='69195483000123',PRETTY='69.195.483/0001-23';
const $=id=>document.getElementById(id);
const S=value=>String(value==null?'':value);
const norm=value=>S(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase();
function storePhone(){
  let value='';
  try{value=S(window.CaseirinhoCurrentPublicCatalog?.()?.loja?.whatsapp||'');}catch(_){}
  if(!value)value=S(window.CASEIRINHO_CONFIG?.whatsapp||'');
  let digits=value.replace(/\D/g,'');
  if(!digits)return'';
  if(!digits.startsWith('55'))digits='55'+digits;
  return /^55\d{10,11}$/.test(digits)?digits:'';
}
function codeFromText(value){
  const matches=[...S(value).matchAll(/(?:encomenda|pedido(?:\s+comum)?)\s*n[º°o]?\s*[:#]?\s*([a-z0-9_-]+)/gi)];
  return [...new Set(matches.map(m=>m[1]))].slice(0,3);
}
function messageFor(codes,seasonal){
  const ref=(codes||[]).filter(Boolean).join(' e ');
  return 'Olá, Caseirinho! 😊 Realizei '+(seasonal?'minha encomenda':'meu pedido')+
    (ref?' nº '+ref:'')+'. Já efetuei o pagamento'+(seasonal?' do sinal de 50%':'')+
    ' e vou anexar o comprovante nesta conversa. Por favor, confirmem o recebimento para liberar o início da produção. Obrigado!';
}
function whatsUrl(codes,seasonal){
 const phone=storePhone();
 return phone?'https://wa.me/'+phone+'?text='+encodeURIComponent(messageFor(codes,seasonal)):'';
}
function feedback(text){
 const t=$('toast');
 if(t){t.textContent=text;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),3500);}
 else alert(text);
}
async function copyKey(){
 try{
  if(!navigator.clipboard?.writeText)throw Error('clipboard unavailable');
  await navigator.clipboard.writeText(KEY);feedback('✅ CNPJ copiado: '+PRETTY);
 }catch(_){
  const input=document.createElement('textarea');input.value=KEY;input.readOnly=true;input.style.cssText='position:fixed;opacity:0;left:-1000px';document.body.appendChild(input);input.select();
  let ok=false;try{ok=document.execCommand('copy')}catch(_){}
  input.remove();feedback(ok?'✅ CNPJ copiado: '+PRETTY:'Copie o CNPJ '+KEY+' manualmente.');
 }
}
function action(codes,seasonal){
 const a=document.createElement('a');
 a.className='caseirinho-proof-button';
 a.target='_blank';a.rel='noopener noreferrer';
 a.textContent='📲 Enviar comprovante pelo WhatsApp';
 a.href=whatsUrl(codes,seasonal)||'#';
 a.addEventListener('click',event=>{
  const url=whatsUrl(codes,seasonal);
  if(!url){event.preventDefault();feedback('O WhatsApp da loja ainda não está cadastrado. Entre em contato pelo botão WhatsApp do cardápio.');return;}
  a.href=url;
 });
 return a;
}
function cnpjLine({manual=true}={}){
 const row=document.createElement('div');
 row.className='caseirinho-proof-cnpj';
 const text=document.createElement('div');
 const label=document.createElement('span');
 label.textContent=manual?'💠 Chave PIX · CNPJ Caseirinho':'💠 CNPJ do Caseirinho';
 const value=document.createElement('strong');value.textContent=PRETTY;
 text.append(label,value);row.appendChild(text);
 const btn=document.createElement('button');btn.type='button';btn.className='caseirinho-proof-copy';btn.textContent='📋 Copiar CNPJ';
 btn.addEventListener('click',copyKey);row.appendChild(btn);
 return row;
}
function proofBanner({codes=[],seasonal=false,pix=false,compact=false,online=false}={}){
 const el=document.createElement('section');
 el.className='caseirinho-proof-notice'+(compact?' compact':'');
 el.setAttribute('aria-label','Envio de comprovante de pagamento');
 const title=document.createElement('strong');title.className='caseirinho-proof-title';
 title.textContent='🔔 ATENÇÃO! ENVIE SEU COMPROVANTE';
 const desc=document.createElement('p');
 desc.textContent='Após concluir o pagamento, toque no botão abaixo e anexe a foto ou PDF do comprovante no WhatsApp. A produção começa somente após a equipe conferir e confirmar o recebimento.';
 el.append(title,desc);
 if(seasonal){
  const special=document.createElement('p');special.className='caseirinho-proof-special';
  special.textContent='🎄 Encomendas: envie o comprovante do sinal de 50%. O restante será pago na entrega ou retirada. Não pague duas vezes.';
  el.appendChild(special);
 }
 if(pix)el.appendChild(cnpjLine({manual:!online}));
 el.appendChild(action(codes,seasonal));
 const fine=document.createElement('small');
 fine.textContent='O WhatsApp abre com uma mensagem pronta e o número do pedido. Anexe o comprovante na conversa. O envio não confirma automaticamente o pagamento.';
 el.appendChild(fine);
 return el;
}
function isPix(value){return /PIX/i.test(S(value))}
function isOnlinePix(value){return /MERCADO.?PAGO|PIX ONLINE/i.test(norm(value))}
function checkoutPix(){
 const payment=$('payment');if(!payment)return;
 const selected=S(payment.value);
 const show=isPix(selected),isManual=!isOnlinePix(selected);
 const label=payment.closest('label');if(!label)return;
 let notice=$('caseirinhoPixCnpj91083');
 if(!notice){
  notice=document.createElement('div');notice.id='caseirinhoPixCnpj91083';notice.className='caseirinho-pix-checkout';
  label.insertAdjacentElement('afterend',notice);
 }
 notice.hidden=!show;
 if(show){
  notice.replaceChildren();
  const heading=document.createElement('b');heading.textContent='💠 PIX CASEIRINHO · '+(selected==='PIX_SINAL_50_MANUAL'?'SINAL DE 50%':'IDENTIFICAÇÃO DO RECEBEDOR');
  const body=document.createElement('p');
  body.textContent=isManual?'Use o CNPJ abaixo como chave PIX, seguindo os valores e a liberação do seu pedido.':'Use o código PIX gerado pelo ambiente seguro de pagamento; o CNPJ abaixo identifica o Caseirinho.';
  const line=cnpjLine({manual:isManual});
  const help=document.createElement('small');
  help.textContent='Pagou? Envie o comprovante pelo WhatsApp para conferência. A produção só começa após confirmação do recebimento.';
  notice.append(heading,body,line,help);
 }
}
function successResult(){
 const root=$('checkoutResult');if(!root)return;
 const result=root.querySelector('.result:not(.err)');
 if(!result||result.querySelector('.caseirinho-proof-notice'))return;
 const text=S(result.textContent);
 if(!(/pedido.{0,35}recebid/i.test(text)||/dois pedidos foram recebidos/i.test(text)))return;
 const codes=codeFromText(text);
 const seasonal=!!result.querySelector('.cx-note b')&&!!result.querySelector('[data-copy-season-pix]')||/sinal de 50%|sinal\s*\(50%\)/i.test(text);
 const selected=S($('payment')?.value);
 const pix=isPix(selected)||seasonal;
 result.appendChild(proofBanner({codes,seasonal,pix,online:isOnlinePix(selected)}));
 const banner=result.querySelector('.caseirinho-proof-notice');
 if(banner&&!result.dataset.caseirinhoProofScrolled){
  result.dataset.caseirinhoProofScrolled='1';
  requestAnimationFrame(()=>banner.scrollIntoView?.({behavior:'smooth',block:'nearest'}));
 }
}
function orderCards(){
 const root=$('simpleBody');if(!root)return;
 for(const card of root.querySelectorAll('.order-card')){
  if(card.querySelector('.caseirinho-proof-notice'))continue;
  const status=norm(card.querySelector('.status-badge')?.textContent);
  if(/CANCELADO|REJEITADO|ENTREGUE|RETIRADO|CONCLUIDO|FINALIZADO/.test(status))continue;
  const line=[...card.querySelectorAll('.cx-note')].find(el=>/forma de pagamento:/i.test(S(el.textContent)));
  const pix=isPix(line?.textContent);
  if(!pix)continue;
  const code=S(card.querySelector('.order-top b')?.textContent).trim();
  const seasonal=!!card.querySelector('.seasonal-finance-summary');
  const confirmed=!!card.querySelector('.cx-note.ok')&&/Pix conferido e confirmado manualmente/i.test(S(card.textContent));
  if(confirmed||seasonal&&/✅ Confirmado/i.test(S(card.querySelector('.seasonal-finance-summary')?.textContent)))continue;
  const mount=card.querySelector('.order-actions')||card;
  const notice=proofBanner({codes:code?[code]:[],seasonal,pix,compact:true,online:isOnlinePix(line?.textContent)});
  mount.insertAdjacentElement('beforebegin',notice);
 }
}
function pixDialog(){
 const modal=$('pix937Overlay');
 const card=modal?.querySelector('.pix937-card');
 if(card&&!card.querySelector('.caseirinho-proof-notice')){
  const order=S(card.querySelector('.pix937-head small')?.textContent).replace(/^\s*Pedido\s*/i,'').trim();
  const banner=proofBanner({codes:order?[order]:[],pix:true,compact:true});
  const actions=card.querySelector('.pix937-actions');
  (actions||card).insertAdjacentElement(actions?'afterend':'beforeend',banner);
 }
 const online=$('pixOnlineDialog');
 const content=online?.querySelector('[role="dialog"]');
 if(content&&!content.querySelector('.caseirinho-proof-notice')){
  const order=codeFromText(content.textContent);
  const banner=proofBanner({codes:order,pix:true,compact:true,online:true});
  content.appendChild(banner);
 }
}
function boot(){
 const payment=$('payment'),result=$('checkoutResult'),simple=$('simpleBody');
 if(!payment||!result)return;
 checkoutPix();successResult();orderCards();pixDialog();
 payment.addEventListener('change',checkoutPix);
 document.addEventListener('change',e=>{if(e.target?.id==='mixedRegularPayment')checkoutPix()});
 const ro=new MutationObserver(()=>successResult());ro.observe(result,{childList:true});
 if(simple)new MutationObserver(()=>orderCards()).observe(simple,{childList:true});
 new MutationObserver(records=>{
  if(records.some(record=>[...record.addedNodes].some(node=>node.nodeType===1&&(node.id==='pix937Overlay'||node.id==='pixOnlineDialog'))))pixDialog();
 }).observe(document.body,{childList:true});
 window.CaseirinhoPaymentProof91083={version:'9.10.83',storePhone,whatsUrl,codeFromText,refresh:()=>{checkoutPix();successResult();orderCards();pixDialog();}};
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
