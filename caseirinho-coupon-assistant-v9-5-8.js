(()=>{'use strict';

const CFG=window.CASEIRINHO_CONFIG||{};
const API=String(CFG.apiUrl||'').replace(/\/+$/,'');
const STORE=String(new URLSearchParams(location.search).get('empresa')||new URLSearchParams(location.search).get('loja')||CFG.storeSlug||'caseirinho').trim().toLowerCase();
const KEY='john_store_'+STORE+'_coupon_caseirinho10_v1';
const CODE='CASEIRINHO10';
const rawFetch=window.fetch.bind(window);
let waitingPhone=false;
let validating=false;
let totalsTimer=0;

const S=v=>String(v??'');
const round2=v=>Math.round((Number(v||0)+Number.EPSILON)*100)/100;
const esc=v=>S(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const normalizeCode=v=>S(v).trim().toUpperCase().replace(/\s+/g,'');
function sanitizePhone(v){
  let d=S(v).replace(/\D/g,'');
  if(d.startsWith('55')&&d.length>11)d=d.slice(2);
  while(d.startsWith('0')&&d.length>11)d=d.slice(1);
  if(d.length===9)d='11'+d;
  return d;
}
function validPhone(v){return /^[1-9][0-9]9[0-9]{8}$/.test(sanitizePhone(v))}
function formatPhone(v){
  const d=sanitizePhone(v);
  if(d.length!==11)return d;
  return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`;
}
function readState(){try{return JSON.parse(localStorage.getItem(KEY)||'null')}catch(_){return null}}
function saveState(v){try{localStorage.setItem(KEY,JSON.stringify(v))}catch(_){}}
function clearState(reason=''){
  try{localStorage.removeItem(KEY)}catch(_){}
  const status=document.getElementById('coupon958Status');
  if(status&&reason){status.className='coupon958-status warn';status.textContent=reason}
  scheduleTotals();
}
function currentPhone(){return sanitizePhone(document.getElementById('cPhone')?.value||'')}
function stateValidForCheckout(){
  const st=readState();
  return !!st&&st.code===CODE&&st.status==='PRIMEIRA_COMPRA_OK'&&validPhone(st.phone)&&st.phone===currentPhone();
}
function money(v){return Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}
function parseMoney(t){
  const s=S(t).replace(/\s/g,'').replace(/R\$/gi,'').replace(/\./g,'').replace(',','.').replace(/[^0-9.-]/g,'');
  const n=Number(s);return Number.isFinite(n)?n:0;
}
function setStatus(text,type=''){
  const el=document.getElementById('coupon958Status');
  if(!el)return;
  el.className='coupon958-status '+type;
  el.textContent=text;
}
function exactMessage(status,phone){
  if(status==='PRIMEIRA_COMPRA_OK')return 'Perfeito! Cupom CASEIRINHO10 aplicado com sucesso. Você ganhou 10% de desconto no seu pedido!';
  if(status==='CLIENTE_JA_USOU')return `Identificamos que o número ${formatPhone(phone)} já utilizou este cupom ou já possui pedidos anteriores em nossa loja. O cupom CASEIRINHO10 é exclusivo para a primeira compra.`;
  if(status==='CUPOM_EXPIRADO')return 'Lamento, mas a promoção do cupom CASEIRINHO10 já foi encerrada.';
  if(status==='WHATSAPP_INVALIDO')return 'Por favor, informe um WhatsApp válido com DDD para validar o cupom.';
  return 'Não foi possível validar este cupom. Confira o código e tente novamente.';
}

async function validateCoupon(phoneValue,{fromChat=false}={}){
  if(validating)return null;
  const phone=sanitizePhone(phoneValue);
  if(!validPhone(phone)){
    const msg='Por favor, informe um WhatsApp válido com DDD para validar o cupom.';
    setStatus(msg,'warn');
    if(fromChat)addChat('bot',msg);
    document.getElementById('cPhone')?.focus();
    return null;
  }
  validating=true;
  setStatus('Validando seu WhatsApp com a loja...','loading');
  try{
    const r=await rawFetch(API+'/api/v1/cupons/validar?_t='+Date.now(),{
      method:'POST',cache:'no-store',
      headers:{'Content-Type':'application/json','Cache-Control':'no-cache'},
      body:JSON.stringify({cupom:CODE,whatsapp:phone,storeSlug:STORE})
    });
    let data={};try{data=await r.json()}catch(_){}
    if(!r.ok)throw new Error(data.error||'Falha ao validar cupom.');
    const msg=exactMessage(data.status,phone);
    if(data.status==='PRIMEIRA_COMPRA_OK'){
      saveState({code:CODE,status:data.status,phone,percent:10,validatedAt:new Date().toISOString(),endAt:data.endAt||null});
      setStatus(msg,'ok');
      const input=document.getElementById('coupon958Code');if(input)input.value=CODE;
      scheduleTotals();
    }else{
      clearState();
      setStatus(msg,data.status==='CUPOM_EXPIRADO'?'err':'warn');
    }
    if(fromChat)addChat('bot',msg);
    waitingPhone=false;
    return data;
  }catch(err){
    clearState();
    const msg='Não foi possível validar o cupom agora. Tente novamente em instantes.';
    setStatus(msg,'err');
    if(fromChat)addChat('bot',msg);
    return null;
  }finally{validating=false}
}

function scheduleTotals(){clearTimeout(totalsTimer);totalsTimer=setTimeout(renderDiscountTotals,0)}
function renderDiscountTotals(){
  const totals=document.querySelector('.totals');
  const subtotalEl=document.getElementById('subtotal');
  const shippingEl=document.getElementById('shipping');
  const grandEl=document.getElementById('grandTotal');
  if(!totals||!subtotalEl||!shippingEl||!grandEl)return;
  let row=document.getElementById('coupon958DiscountRow');
  if(!row){
    row=document.createElement('div');
    row.id='coupon958DiscountRow';
    row.className='coupon958-discount';
    row.innerHTML='<span>🏷️ CASEIRINHO10 (10%)</span><b id="coupon958DiscountValue">- R$ 0,00</b>';
    const grand=totals.querySelector('.grand');
    totals.insertBefore(row,grand||null);
  }
  const active=stateValidForCheckout();
  row.hidden=!active;
  if(!active)return;
  const sub=parseMoney(subtotalEl.textContent);
  const discount=round2(sub*0.10);
  document.getElementById('coupon958DiscountValue').textContent='- '+money(discount);
  const discounted=round2(Math.max(0,sub-discount));
  const pending=/cot/i.test(shippingEl.textContent||'');
  grandEl.textContent=pending?money(discounted)+' + frete':money(discounted+parseMoney(shippingEl.textContent));
}

function injectStyle(){
  if(document.getElementById('coupon958Style'))return;
  const style=document.createElement('style');
  style.id='coupon958Style';
  style.textContent=`
  .coupon958-box{margin:14px 0;padding:14px;border:1px solid #e7d8c8;border-radius:16px;background:#fffaf3}
  .coupon958-title{font-weight:800;color:#173f32;margin-bottom:4px}.coupon958-note{font-size:12px;color:#765f50;margin-bottom:10px}
  .coupon958-row{display:flex;gap:8px}.coupon958-row input{min-width:0;flex:1;text-transform:uppercase}.coupon958-row button{white-space:nowrap}
  .coupon958-status{font-size:13px;line-height:1.4;margin-top:9px}.coupon958-status.ok{color:#166534}.coupon958-status.warn{color:#92400e}.coupon958-status.err{color:#991b1b}.coupon958-status.loading{color:#334155}
  .coupon958-discount{color:#166534;font-weight:700}.coupon958-discount[hidden]{display:none!important}
  #assistant958Toggle{position:fixed;right:18px;bottom:92px;z-index:1100;border:0;border-radius:999px;padding:12px 16px;font-weight:800;box-shadow:0 10px 28px #0002;background:#173f32;color:#fff;cursor:pointer}
  #assistant958Panel{position:fixed;right:18px;bottom:148px;width:min(370px,calc(100vw - 28px));max-height:min(570px,70vh);z-index:1101;background:#fff;border:1px solid #ddd2c5;border-radius:18px;box-shadow:0 18px 50px #0003;display:none;overflow:hidden}
  #assistant958Panel.open{display:flex;flex-direction:column}.assistant958-head{padding:13px 14px;background:#173f32;color:#fff;display:flex;align-items:center;justify-content:space-between}.assistant958-head button{border:0;background:transparent;color:#fff;font-size:20px;cursor:pointer}
  #assistant958Messages{padding:12px;overflow:auto;display:flex;flex-direction:column;gap:8px;min-height:190px}.assistant958-msg{max-width:88%;padding:9px 11px;border-radius:14px;font-size:13px;line-height:1.4;white-space:pre-wrap}.assistant958-msg.bot{align-self:flex-start;background:#f4eee5;color:#24312c}.assistant958-msg.user{align-self:flex-end;background:#7b1438;color:#fff}
  .assistant958-form{display:flex;gap:7px;padding:10px;border-top:1px solid #eee}.assistant958-form input{flex:1;min-width:0}.assistant958-form button{border:0;border-radius:12px;padding:8px 12px;background:#7b1438;color:#fff;font-weight:800}
  @media(max-width:600px){#assistant958Toggle{bottom:82px;right:12px;padding:10px 13px}#assistant958Panel{right:8px;bottom:132px;width:calc(100vw - 16px);max-height:65vh}}
  `;
  document.head.appendChild(style);
}

function mountCouponBox(){
  if(document.getElementById('coupon958Box'))return;
  const checkout=document.getElementById('checkout');
  const delivery=document.getElementById('deliveryBox');
  if(!checkout)return;
  const box=document.createElement('div');
  box.id='coupon958Box';box.className='coupon958-box';
  box.innerHTML=`<div class="coupon958-title">🏷️ Tem cupom de desconto?</div><div class="coupon958-note">CASEIRINHO10 dá 10% na primeira compra. Promoção por tempo limitado e validada pelo WhatsApp.</div><div class="coupon958-row"><input id="coupon958Code" autocomplete="off" placeholder="Digite seu cupom" aria-label="Cupom de desconto"><button class="soft" id="coupon958Apply" type="button">Aplicar</button></div><div id="coupon958Status" class="coupon958-status"></div>`;
  checkout.insertBefore(box,delivery||checkout.firstChild);
  const input=document.getElementById('coupon958Code');
  document.getElementById('coupon958Apply').onclick=()=>{
    if(normalizeCode(input.value)!==CODE){clearState();setStatus('Cupom não reconhecido. Confira o código informado.','warn');return}
    const phone=currentPhone();
    if(!validPhone(phone)){
      const msg='Que ótimo! O cupom CASEIRINHO10 garante 10% de desconto na sua primeira compra. Por favor, informe seu WhatsApp para validar a promoção.';
      setStatus(msg,'warn');document.getElementById('cPhone')?.focus();return;
    }
    validateCoupon(phone);
  };
  input.addEventListener('input',()=>{input.value=input.value.toUpperCase();if(normalizeCode(input.value)!==CODE&&readState())clearState('Cupom removido.')});
  const st=readState();
  if(st?.code===CODE){input.value=CODE;if(st.phone===currentPhone()&&st.status==='PRIMEIRA_COMPRA_OK')setStatus(exactMessage(st.status,st.phone),'ok')}
}

function addChat(role,text){
  const box=document.getElementById('assistant958Messages');if(!box)return;
  const el=document.createElement('div');el.className='assistant958-msg '+role;el.textContent=text;box.appendChild(el);box.scrollTop=box.scrollHeight;
}
function mountAssistant(){
  if(document.getElementById('assistant958Toggle'))return;
  const toggle=document.createElement('button');toggle.id='assistant958Toggle';toggle.type='button';toggle.textContent='💬 Ajuda';toggle.setAttribute('aria-label','Abrir assistente do Caseirinho');
  const panel=document.createElement('div');panel.id='assistant958Panel';
  panel.innerHTML=`<div class="assistant958-head"><div><b>Assistente Caseirinho</b><br><small>Compras e cupons</small></div><button id="assistant958Close" type="button" aria-label="Fechar">×</button></div><div id="assistant958Messages"></div><form class="assistant958-form" id="assistant958Form"><input id="assistant958Input" autocomplete="off" placeholder="Digite sua dúvida..."><button type="submit">Enviar</button></form>`;
  document.body.append(toggle,panel);
  addChat('bot','Olá! Posso ajudar com o cardápio, seu pedido e cupons de desconto.');
  toggle.onclick=()=>{panel.classList.toggle('open');if(panel.classList.contains('open'))document.getElementById('assistant958Input')?.focus()};
  document.getElementById('assistant958Close').onclick=()=>panel.classList.remove('open');
  document.getElementById('assistant958Form').onsubmit=async e=>{
    e.preventDefault();const input=document.getElementById('assistant958Input'),msg=S(input.value).trim();if(!msg)return;input.value='';addChat('user',msg);
    const upper=normalizeCode(msg);
    if(upper.includes(CODE)){
      const couponInput=document.getElementById('coupon958Code');if(couponInput)couponInput.value=CODE;
      waitingPhone=true;
      addChat('bot','Que ótimo! O cupom CASEIRINHO10 garante 10% de desconto na sua primeira compra. Por favor, informe seu WhatsApp para validar a promoção.');
      return;
    }
    if(waitingPhone){
      const phone=sanitizePhone(msg);
      if(validPhone(phone)){
        const field=document.getElementById('cPhone');if(field)field.value=formatPhone(phone);
        await validateCoupon(phone,{fromChat:true});return;
      }
      addChat('bot','Por favor, informe um WhatsApp válido com DDD, por exemplo: (11) 99999-9999.');return;
    }
    const q=S(msg).toLowerCase();
    if(q.includes('cupom')||q.includes('desconto')){addChat('bot','Se você tem o cupom CASEIRINHO10, digite o código aqui. Ele dá 10% de desconto na primeira compra e precisa ser validado pelo WhatsApp.');return}
    if(q.includes('frete')||q.includes('entrega')){addChat('bot','Para entrega, adicione os produtos ao carrinho e informe seu CEP. A loja mostrará o frete automaticamente quando houver regra disponível ou enviará a cotação para sua aprovação.');return}
    if(q.includes('pedido')||q.includes('compr')||q.includes('cardáp')||q.includes('cardap')){addChat('bot','Escolha os produtos no cardápio, adicione ao carrinho e finalize preenchendo seus dados. Se quiser usar o CASEIRINHO10, valide o cupom antes de confirmar o pedido.');return}
    addChat('bot','Posso ajudar com compras, entrega, acompanhamento do pedido e com o cupom CASEIRINHO10. O que você precisa?');
  };
}

function watchPhone(){
  const phone=document.getElementById('cPhone');if(!phone)return;
  phone.addEventListener('input',()=>{
    const st=readState();
    if(st&&sanitizePhone(phone.value)!==st.phone)clearState('WhatsApp alterado. Valide o cupom novamente.');
    scheduleTotals();
  });
}
function watchTotals(){
  const sub=document.getElementById('subtotal'),ship=document.getElementById('shipping');
  if(!sub||!ship)return;
  const observer=new MutationObserver(scheduleTotals);
  observer.observe(sub,{childList:true,characterData:true,subtree:true});
  observer.observe(ship,{childList:true,characterData:true,subtree:true});
  scheduleTotals();
}

window.fetch=async function(input,opt={}){
  const response=await rawFetch(input,opt);
  try{
    const method=S(opt?.method||(input instanceof Request?input.method:'GET')).toUpperCase();
    const rawUrl=typeof input==='string'?input:input?.url;
    const url=new URL(rawUrl,location.href);
    const orderPath=new RegExp('/api/v1/public/store/'+STORE.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'/orders/?$','i');
    if(method!=='POST'||!orderPath.test(url.pathname)||!response.ok||!stateValidForCheckout())return response;
    let sent={};try{sent=JSON.parse(S(opt.body)||'{}')}catch(_){return response}
    const st=readState(),sentPhone=sanitizePhone(sent?.cliente?.telefone);
    if(!st||sentPhone!==st.phone)return response;
    const created=await response.clone().json();
    if(!created?.id||!created?.publicToken)return response;
    const apply=await rawFetch(API+'/api/v1/public/store/'+encodeURIComponent(STORE)+'/orders/'+encodeURIComponent(created.id)+'/coupon-caseirinho10?_t='+Date.now(),{
      method:'POST',cache:'no-store',headers:{'Content-Type':'application/json','Cache-Control':'no-cache'},
      body:JSON.stringify({token:created.publicToken,whatsapp:sentPhone,couponCode:CODE})
    });
    let adjusted={};try{adjusted=await apply.json()}catch(_){}
    if(!apply.ok||adjusted.status!=='PRIMEIRA_COMPRA_OK'){
      clearState('O cupom não pôde ser aplicado ao pedido. O total permanece sem desconto.');
      return response;
    }
    clearState();
    const body={...created,subtotalOriginal:adjusted.subtotalOriginal,descontoCupom:adjusted.discount,subtotal:adjusted.subtotal,total:adjusted.total,cupom:{codigo:CODE,percentual:10,desconto:adjusted.discount}};
    const headers=new Headers(response.headers);headers.set('Content-Type','application/json');headers.delete('content-length');
    return new Response(JSON.stringify(body),{status:response.status,statusText:response.statusText,headers});
  }catch(e){
    console.warn('[CASEIRINHO10] aplicação segura não concluída:',e);
    return response;
  }
};

function init(){
  injectStyle();mountCouponBox();mountAssistant();watchPhone();watchTotals();
}
window.CaseirinhoCoupon958={sanitizePhone,validPhone,validateCoupon,readState,clearState};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();

})();
