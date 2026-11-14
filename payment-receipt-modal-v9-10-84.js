/* Caseirinho 9.10.84 | recibo pós-compra em modal, com cobrança mista discriminada. */
(()=>{
'use strict';
if(window.__CASEIRINHO_MIXED_RECEIPT_91084__)return;
window.__CASEIRINHO_MIXED_RECEIPT_91084__=true;
const $=id=>document.getElementById(id);
const S=v=>String(v??''),N=v=>Number(v),F=v=>v!==null&&v!==undefined&&v!==''&&Number.isFinite(N(v)),brl=v=>F(v)?N(v).toLocaleString('pt-BR',{style:'currency',currency:'BRL'}):'A confirmar';
const esc=v=>S(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
const METHOD=value=>S(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase();
const isPix=v=>METHOD(v).includes('PIX'),isCard=v=>/CARTAO|CREDITO|DEBITO/.test(METHOD(v));
const CPF='69195483000123',CNPJ='69.195.483/0001-23';
let keyListener=null;
function safeCode(o){return S(o?.codigo||o?.code||o?.id||'').trim()}
function firstAvailable(...values){return values.find(v=>v!==undefined&&v!==null&&v!=='')??null}
function phoneLink(codes,seasonal){
  try{return window.CaseirinhoPaymentProof91083?.whatsUrl?.(codes,seasonal)||''}catch(_){return''}
}
function whatsappButton(codes,seasonal,label){
  const a=document.createElement('a');
  a.className='caseirinho-receipt-whats';
  a.href=phoneLink(codes,seasonal)||'#';
  a.target='_blank';a.rel='noopener noreferrer';
  a.textContent=label||'📲 Enviar comprovante pelo WhatsApp';
  a.addEventListener('click',event=>{
    const live=phoneLink(codes,seasonal);
    if(!live){event.preventDefault();alert('WhatsApp da loja ainda não configurado. Entre em contato pelo botão WhatsApp do cardápio.');}
    else a.href=live;
  });
  return a;
}
async function copyPix(){
 try{await navigator.clipboard.writeText(CPF)}catch(_){
  const inp=document.createElement('textarea');inp.value=CPF;inp.style.cssText='position:fixed;opacity:0';document.body.appendChild(inp);inp.select();
  try{document.execCommand('copy')}catch(_){}inp.remove();
 }
 const out=$('caseirinhoReceiptCopyStatus');
 if(out)out.textContent='✅ CNPJ copiado: '+CNPJ;
}
function copyBlock(){
 const row=document.createElement('div');row.className='caseirinho-receipt-pix';
 const text=document.createElement('div');
 const small=document.createElement('span');small.textContent='💠 Chave PIX · CNPJ Caseirinho';
 const value=document.createElement('strong');value.textContent=CNPJ;
 text.append(small,value);
 const btn=document.createElement('button');btn.type='button';btn.textContent='📋 Copiar';btn.addEventListener('click',copyPix);
 const info=document.createElement('small');info.id='caseirinhoReceiptCopyStatus';info.setAttribute('role','status');
 row.append(text,btn,info);
 return row;
}
function closeModal(){
 const modal=$('caseirinhoReceiptModal');
 if(modal)modal.remove();
 if(keyListener){document.removeEventListener('keydown',keyListener);keyListener=null;}
 document.body.style.overflow='';
}
function dismissCart(){
 const cart=$('cartDrawer');
 if(cart){cart.classList.remove('open');cart.setAttribute('aria-hidden','true');}
 document.body.style.overflow='';
}
function modal(title,heading){
 closeModal();dismissCart();
 const outer=document.createElement('div');outer.id='caseirinhoReceiptModal';outer.className='caseirinho-receipt-backdrop';
 const shell=document.createElement('section');shell.className='caseirinho-receipt-dialog';
 shell.setAttribute('role','dialog');shell.setAttribute('aria-modal','true');shell.setAttribute('aria-labelledby','caseirinhoReceiptTitle');
 const header=document.createElement('header');header.className='caseirinho-receipt-header';
 const titles=document.createElement('div');const eyebrow=document.createElement('small');
 eyebrow.textContent='✅ PEDIDO RECEBIDO • CASEIRINHO';
 const h=document.createElement('h2');h.id='caseirinhoReceiptTitle';h.textContent=title;
 titles.append(eyebrow,h);
 const close=document.createElement('button');close.type='button';close.className='caseirinho-receipt-close';
 close.setAttribute('aria-label','Fechar confirmação');close.textContent='✕';close.onclick=closeModal;
 header.append(titles,close);
 const body=document.createElement('div');body.className='caseirinho-receipt-body';
 if(heading){const p=document.createElement('p');p.className='caseirinho-receipt-lead';p.textContent=heading;body.appendChild(p);}
 const actions=document.createElement('div');actions.className='caseirinho-receipt-footer';
 shell.append(header,body,actions);outer.appendChild(shell);document.body.appendChild(outer);
 document.body.style.overflow='hidden';
 keyListener=e=>{if(e.key==='Escape')closeModal();};
 document.addEventListener('keydown',keyListener);
 close.focus();
 return{outer,shell,body,actions};
}
function navigationButtons(actions,onOrders){
 const orders=document.createElement('button');
 orders.type='button';orders.className='caseirinho-receipt-orders';orders.textContent='📦 Acompanhar meus pedidos';
 orders.onclick=()=>{closeModal();if(typeof onOrders==='function')onOrders();};
 const back=document.createElement('button');back.type='button';back.className='caseirinho-receipt-back';
 back.textContent='Voltar ao cardápio';back.onclick=closeModal;
 actions.append(orders,back);
}
function pairLine(label,value,description,kind=''){
 const row=document.createElement('div');row.className='caseirinho-receipt-row'+(kind?' '+kind:'');
 const main=document.createElement('div');main.className='caseirinho-receipt-row-copy';
 const title=document.createElement('b');title.textContent=label;main.appendChild(title);
 if(description){const small=document.createElement('small');small.textContent=description;main.appendChild(small);}
 const amount=document.createElement('strong');amount.textContent=value;row.append(main,amount);
 return row;
}
function section(title,code){
 const el=document.createElement('article');el.className='caseirinho-receipt-section';
 const head=document.createElement('h3');head.textContent=title+(code?' · nº '+code:'');
 el.appendChild(head);return el;
}
function commonPaymentNote(method){
 if(isCard(method))return'Pagamento por cartão em etapa separada, quando o link seguro estiver disponível. Não transfira este valor por PIX.';
 if(isPix(method))return'PIX próprio do pedido comum, somente após conferir a cobrança liberada em Meus pedidos. Não some esse valor ao PIX do sinal.';
 if(/DINHEIRO|ESPECIE/.test(METHOD(method)))return'Pagamento em dinheiro conforme a modalidade combinada com o Caseirinho.';
 return'Pagamento separado do sinal da encomenda, conforme a modalidade escolhida.';
}
function showMixed({season,regular,regularPaymentLabel='',onOrders}={}){
 if(!season||!regular)return false;
 const sc=safeCode(season),rc=safeCode(regular);
 const st=season.encomendaSazonal||{};
 const deposit=firstAvailable(st.depositDue,st.sinalDevido,st.sinal);
 const balance=firstAvailable(st.balanceDue,st.saldoDevido,st.saldo);
 const method=firstAvailable(regular.formaPagamento,regularPaymentLabel,'A definir');
 const publicMethod=S(regularPaymentLabel||method);
 const {body,actions}=modal('Seus dois pedidos foram registrados!','São dois pagamentos independentes. Confira os valores e quando pagar cada um.');
 const seasonal=section('🎄 1. Encomenda',sc);
 seasonal.appendChild(pairLine('Valor total da encomenda',brl(season.total),'Valor confirmado pelo servidor'));
 seasonal.appendChild(pairLine('💚 SINAL VIA PIX',brl(deposit),'Este é o valor do PIX para iniciar a produção após confirmação','due'));
 seasonal.appendChild(pairLine('📦 Restante na entrega/retirada',brl(balance),'Não pague esse saldo antecipadamente','later'));
 body.appendChild(seasonal);
 const normal=section('🛒 2. Pedido comum',rc);
 normal.appendChild(pairLine('Valor do pedido comum',brl(regular.total),'Forma de pagamento: '+publicMethod,'due-regular'));
 const note=document.createElement('p');note.className='caseirinho-receipt-note';note.textContent=commonPaymentNote(method);normal.appendChild(note);
 body.appendChild(normal);
 if(F(season.total)&&F(regular.total)){
  const total=document.createElement('p');total.className='caseirinho-receipt-grand';
  total.innerHTML='<span>Total dos dois pedidos (não é um único pagamento)</span><b>'+brl(N(season.total)+N(regular.total))+'</b>';
  body.appendChild(total);
 }
 const proof=document.createElement('section');proof.className='caseirinho-receipt-proof';
 const title=document.createElement('h3');title.textContent='🔔 Para liberar a produção, envie o comprovante do sinal';
 const detail=document.createElement('p');
 detail.textContent='Pague somente o sinal de '+brl(deposit)+' no CNPJ abaixo e envie a foto ou PDF do comprovante pelo WhatsApp. O Caseirinho verificará o pagamento. O valor do pedido comum não deve ser incluído neste PIX.';
 proof.append(title,detail,copyBlock(),whatsappButton(sc?[sc]:[],true,'📲 Enviar comprovante do sinal pelo WhatsApp'));
 const small=document.createElement('small');small.textContent='A mensagem do WhatsApp é preparada apenas para a encomenda nº '+(sc||'informada')+'. Anexe o comprovante manualmente. O envio não confirma automaticamente o pagamento.';
 proof.appendChild(small);body.appendChild(proof);
 navigationButtons(actions,onOrders);
 return true;
}
function showSingle({order,receiptNode,onOrders,publicPaymentLabel=''}={}){
 if(!order)return false;
 const code=safeCode(order),seasonal=!!order.encomendaSazonal,payment=order.formaPagamento;
 const {body,actions}=modal('Pedido '+(code?'nº '+code+' ':'')+'recebido!','Seu carrinho foi concluído. Acompanhe aqui os próximos passos para pagamento e produção.');
 const intro=section(seasonal?'🎄 Sua encomenda':'🛒 Seu pedido',code);
 intro.appendChild(pairLine('Total do pedido',brl(order.total),'Forma de pagamento: '+S(publicPaymentLabel||payment||'A definir')));
 if(seasonal){
  intro.appendChild(pairLine('💚 Pagar via PIX agora (sinal de 50%)',brl(order.encomendaSazonal.depositDue),'A produção começa após confirmação','due'));
  intro.appendChild(pairLine('📦 Saldo na entrega/retirada',brl(order.encomendaSazonal.balanceDue),'Não pague 100% antecipadamente','later'));
 }else if(isCard(payment)){
  const p=document.createElement('p');p.className='caseirinho-receipt-note';p.textContent='Pague pelo ambiente seguro de cartão quando o link de pagamento estiver liberado. Não faça PIX para quitar uma compra em cartão.';intro.appendChild(p);
 }else if(isPix(payment)){
  const p=document.createElement('p');p.className='caseirinho-receipt-note';p.textContent='No PIX de pedido comum, aguarde a liberação do QR Code em Meus pedidos antes de pagar.';intro.appendChild(p);
 }
 body.appendChild(intro);
 if(receiptNode){
  const oldPay=receiptNode.querySelector('#mpPayNow');
  if(oldPay){oldPay.classList.add('caseirinho-receipt-mp');body.appendChild(oldPay);}
  const details=document.createElement('details');details.className='caseirinho-receipt-details';
  const summary=document.createElement('summary');summary.textContent='Ver detalhes e condições do pedido';
  details.append(summary,receiptNode);body.appendChild(details);
 }
 const proof=document.createElement('section');proof.className='caseirinho-receipt-proof';
 const title=document.createElement('h3');title.textContent='🔔 Envie seu comprovante após o pagamento';
 const text=document.createElement('p');text.textContent=seasonal?
  'Pague apenas o sinal de 50% e anexe o comprovante no WhatsApp para conferência e início da produção.':
  'Após concluir o pagamento da modalidade escolhida, envie o comprovante no WhatsApp para conferência. Não significa pagamento aprovado.';
 proof.append(title,text);
 if(isPix(payment))proof.appendChild(copyBlock());
 proof.appendChild(whatsappButton(code?[code]:[],seasonal,'📲 Enviar comprovante pelo WhatsApp'));
 body.appendChild(proof);
 navigationButtons(actions,onOrders);
 return true;
}
window.CaseirinhoReceiptModal91084={version:'9.10.84',showMixed,showSingle,close:closeModal,commonPaymentNote};
})();