(()=>{'use strict';

const CFG=window.CASEIRINHO_CONFIG||{};
const API=String(CFG.apiUrl||'').replace(/\/+$/,'');
const STORE=String(new URLSearchParams(location.search).get('empresa')||new URLSearchParams(location.search).get('loja')||CFG.storeSlug||'caseirinho').trim().toLowerCase();
const KEY='john_store_'+STORE+'_coupon_unified_v2';
const LEGACY_KEY='john_store_'+STORE+'_coupon_caseirinho10_v1';
const FIRST_CODE='CASEIRINHO10';
const rawFetch=window.fetch.bind(window);
let waitingPhone=false;
let validating=false;
let totalsTimer=0;
let commerceCfg={coupons:[],loyalty:{}};
let configPromise=null;

const S=v=>String(v??'');
const N=v=>Number(v)||0;
const A=v=>Array.isArray(v)?v:[];
const round2=v=>Math.round((Number(v||0)+Number.EPSILON)*100)/100;
const normalizeCode=v=>S(v).trim().toUpperCase().replace(/\s+/g,'');
const norm=v=>S(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toUpperCase();
function sanitizePhone(v){let d=S(v).replace(/\D/g,'');if(d.startsWith('55')&&d.length>11)d=d.slice(2);while(d.startsWith('0')&&d.length>11)d=d.slice(1);if(d.length===9)d='11'+d;return d}
function validPhone(v){return /^[1-9][0-9]9[0-9]{8}$/.test(sanitizePhone(v))}
function formatPhone(v){const d=sanitizePhone(v);return d.length===11?`(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`:d}
function money(v){return Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}
function parseMoney(t){const s=S(t).replace(/\s/g,'').replace(/R\$/gi,'').replace(/\./g,'').replace(',','.').replace(/[^0-9.-]/g,'');const n=Number(s);return Number.isFinite(n)?n:0}
function sleep(ms){return new Promise(r=>setTimeout(r,ms))}
function readState(){try{return JSON.parse(localStorage.getItem(KEY)||localStorage.getItem(LEGACY_KEY)||'null')}catch(_){return null}}
function saveState(v){try{localStorage.setItem(KEY,JSON.stringify(v));localStorage.removeItem(LEGACY_KEY)}catch(_){}}
function currentPhone(){return sanitizePhone(document.getElementById('cPhone')?.value||'')}
function setStatus(text,type=''){const el=document.getElementById('coupon958Status');if(!el)return;el.className='coupon958-status '+type;el.textContent=text}
function activeByDate(c){if(!c||c.active===false||c.ativo===false)return false;const t=Date.now(),ini=c.startAt||c.inicio,fim=c.endAt||c.fim;if(ini&&Number.isFinite(new Date(ini).getTime())&&new Date(ini).getTime()>t)return false;if(fim&&Number.isFinite(new Date(fim).getTime())&&new Date(fim).getTime()<t)return false;return true}
function isPercent(c){return ['PERCENT','PERCENTUAL','PERCENTAGE','%'].includes(norm(c?.type||c?.tipo))}
function couponDiscount(c,subtotal){if(!c)return 0;if(N(c.minSubtotal||c.pedidoMinimo)>subtotal+1e-9)return 0;let d=isPercent(c)?subtotal*Math.max(0,Math.min(100,N(c.value||c.valor)))/100:Math.max(0,N(c.value||c.valor));const max=N(c.maxDiscount||c.descontoMaximo);if(max>0)d=Math.min(d,max);return round2(Math.min(subtotal,d))}
function couponBenefit(c){if(normalizeCode(c?.code||c?.codigo)===FIRST_CODE)return '10% na primeira compra';return isPercent(c)?`${N(c.value||c.valor)}% de desconto`:`${money(N(c.value||c.valor))} de desconto`}
function configuredCoupon(code){const key=normalizeCode(code);return A(commerceCfg.coupons).find(c=>activeByDate(c)&&normalizeCode(c.code||c.codigo)===key)||null}
function firstCoupon(){return configuredCoupon(FIRST_CODE)||{id:'caseirinho10-first-purchase',code:FIRST_CODE,type:'PERCENT',value:10,minSubtotal:0,active:true,firstPurchase:true}}
function stateValidForCheckout(){const st=readState();if(!st?.code)return false;if(st.code===FIRST_CODE)return st.status==='PRIMEIRA_COMPRA_OK'&&validPhone(st.phone)&&st.phone===currentPhone();return st.status==='GENERIC_OK'&&activeByDate(st.coupon||st)}
function scheduleTotals(){clearTimeout(totalsTimer);totalsTimer=setTimeout(renderDiscountTotals,0)}

async function loadCommerceConfig(force=false){
  if(configPromise&&!force)return configPromise;
  configPromise=(async()=>{
    try{
      const r=await rawFetch(API+'/api/v1/public/store/'+encodeURIComponent(STORE)+'/commerce-engine?_t='+Date.now(),{cache:'no-store',headers:{'Cache-Control':'no-cache'}});
      let data={};try{data=await r.json()}catch(_){}
      if(r.ok)commerceCfg={...commerceCfg,...(data.config||{}),coupons:A(data.config?.coupons)};
    }catch(e){console.warn('[CUPONS] configuração comercial indisponível:',e)}
    if(STORE==='caseirinho'&&!configuredCoupon(FIRST_CODE))commerceCfg.coupons=[firstCoupon(),...A(commerceCfg.coupons)];
    updateCouponNote();
    return commerceCfg;
  })();
  return configPromise;
}
function updateCouponNote(){
  const el=document.getElementById('coupon958Note');if(!el)return;
  const list=A(commerceCfg.coupons).filter(activeByDate).slice(0,5);
  if(!list.length){el.textContent='Digite seu cupom. A validade e as regras são conferidas antes de concluir o pedido.';return}
  el.textContent='Cupons ativos: '+list.map(c=>`${normalizeCode(c.code||c.codigo)} — ${couponBenefit(c)}`).join(' • ')+'.';
}

async function syncNativeGeneric(code){
  for(let i=0;i<10;i++){
    const input=document.getElementById('ceCouponInput'),btn=document.getElementById('ceCouponApply'),status=document.getElementById('ceCouponStatus');
    if(input&&btn){
      input.value=code;btn.click();await sleep(60);
      if(/aplicado/i.test(S(status?.textContent)))return true;
    }
    await sleep(120);
  }
  return false;
}
async function clearNativeCouponSelection(){
  for(let i=0;i<5;i++){
    const input=document.getElementById('ceCouponInput'),btn=document.getElementById('ceCouponApply'),status=document.getElementById('ceCouponStatus');
    if(input&&btn){input.value='__SEM_CUPOM__';btn.click();input.value='';if(status)status.textContent='';return true}
    await sleep(80);
  }
  return false;
}
function clearState(reason='',clearNative=true){
  try{localStorage.removeItem(KEY);localStorage.removeItem(LEGACY_KEY)}catch(_){}
  if(clearNative)clearNativeCouponSelection().catch(()=>{});
  const status=document.getElementById('coupon958Status');
  if(status&&reason){status.className='coupon958-status warn';status.textContent=reason}
  scheduleTotals();
}

function exactMessage(status,phone){
  if(status==='PRIMEIRA_COMPRA_OK')return 'Perfeito! Cupom CASEIRINHO10 aplicado com sucesso. Você ganhou 10% de desconto no seu primeiro pedido!';
  if(status==='CLIENTE_JA_USOU')return `O número ${formatPhone(phone)} já possui pedido anterior. O CASEIRINHO10 é exclusivo para a primeira compra.`;
  if(status==='CUPOM_EXPIRADO')return 'A promoção do cupom CASEIRINHO10 já foi encerrada.';
  if(status==='WHATSAPP_INVALIDO')return 'Informe um WhatsApp válido com DDD para validar o cupom.';
  return 'Não foi possível validar este cupom. Confira o código e tente novamente.';
}
async function validateFirstPurchase(phoneValue,{fromChat=false}={}){
  if(validating)return null;
  const phone=sanitizePhone(phoneValue);
  if(!validPhone(phone)){const msg='Informe um WhatsApp válido com DDD para validar o cupom.';setStatus(msg,'warn');if(fromChat)addChat('bot',msg);document.getElementById('cPhone')?.focus();return null}
  validating=true;setStatus('Validando a primeira compra pelo WhatsApp...','loading');
  try{
    const r=await rawFetch(API+'/api/v1/cupons/validar?_t='+Date.now(),{method:'POST',cache:'no-store',headers:{'Content-Type':'application/json','Cache-Control':'no-cache'},body:JSON.stringify({cupom:FIRST_CODE,whatsapp:phone,storeSlug:STORE})});
    let data={};try{data=await r.json()}catch(_){}
    if(!r.ok)throw new Error(data.error||'Falha ao validar cupom.');
    const msg=exactMessage(data.status,phone);
    if(data.status==='PRIMEIRA_COMPRA_OK'){
      await clearNativeCouponSelection();
      saveState({code:FIRST_CODE,status:data.status,phone,percent:10,coupon:firstCoupon(),validatedAt:new Date().toISOString(),endAt:data.endAt||null});
      setStatus(msg,'ok');const input=document.getElementById('coupon958Code');if(input)input.value=FIRST_CODE;scheduleTotals();
    }else{clearState('',true);setStatus(msg,data.status==='CUPOM_EXPIRADO'?'err':'warn')}
    if(fromChat)addChat('bot',msg);waitingPhone=false;return data;
  }catch(err){clearState('',true);const msg='Não foi possível validar o cupom agora. Tente novamente em instantes.';setStatus(msg,'err');if(fromChat)addChat('bot',msg);return null}
  finally{validating=false}
}
async function applyGenericCoupon(code){
  await loadCommerceConfig(true);
  const c=configuredCoupon(code);
  if(!c||normalizeCode(code)===FIRST_CODE){clearState('',true);setStatus('Cupom não reconhecido, inativo ou fora da vigência.','warn');return false}
  const sub=parseMoney(document.getElementById('subtotal')?.textContent||'');
  const min=N(c.minSubtotal||c.pedidoMinimo);
  if(min>sub+1e-9){clearState('',true);setStatus(`Este cupom exige pedido mínimo de ${money(min)}.`,'warn');return false}
  setStatus('Ativando cupom...','loading');
  const synced=await syncNativeGeneric(normalizeCode(code));
  if(!synced){clearState('',false);setStatus('Não foi possível ativar este cupom agora. Atualize a página e tente novamente.','err');return false}
  const discount=couponDiscount(c,sub);
  saveState({code:normalizeCode(code),status:'GENERIC_OK',coupon:{...c},validatedAt:new Date().toISOString()});
  setStatus(`Cupom ${normalizeCode(code)} aplicado: ${couponBenefit(c)}${discount>0?` (${money(discount)} neste carrinho)`:''}.`,'ok');
  scheduleTotals();return true;
}
async function applyTypedCoupon(){
  const input=document.getElementById('coupon958Code');const code=normalizeCode(input?.value);
  if(!code){clearState('',true);setStatus('Digite o código do cupom.','warn');return}
  if(code===FIRST_CODE){const phone=currentPhone();if(!validPhone(phone)){await clearNativeCouponSelection();const msg='O CASEIRINHO10 dá 10% na primeira compra. Informe seu WhatsApp para validar.';setStatus(msg,'warn');document.getElementById('cPhone')?.focus();return}return validateFirstPurchase(phone)}
  return applyGenericCoupon(code);
}

function renderDiscountTotals(){
  const totals=document.querySelector('.totals'),subtotalEl=document.getElementById('subtotal'),shippingEl=document.getElementById('shipping'),grandEl=document.getElementById('grandTotal');
  if(!totals||!subtotalEl||!shippingEl||!grandEl)return;
  let row=document.getElementById('coupon958DiscountRow');
  if(!row){row=document.createElement('div');row.id='coupon958DiscountRow';row.className='coupon958-discount';row.innerHTML='<span id="coupon958DiscountLabel">🏷️ Cupom</span><b id="coupon958DiscountValue">- R$ 0,00</b>';const grand=totals.querySelector('.grand');totals.insertBefore(row,grand||null)}
  const sub=parseMoney(subtotalEl.textContent),pending=/cot/i.test(shippingEl.textContent||''),ship=parseMoney(shippingEl.textContent);
  const st=readState(),active=stateValidForCheckout();
  row.hidden=!active;
  if(!active){grandEl.textContent=pending?money(sub)+' + frete':money(round2(sub+ship));return}
  const c=st.code===FIRST_CODE?firstCoupon():(st.coupon||configuredCoupon(st.code));
  const discount=st.code===FIRST_CODE?round2(sub*0.10):couponDiscount(c,sub);
  if(discount<=0&&N(c?.minSubtotal||c?.pedidoMinimo)>sub){row.hidden=true;grandEl.textContent=pending?money(sub)+' + frete':money(round2(sub+ship));return}
  document.getElementById('coupon958DiscountLabel').textContent=`🏷️ ${st.code}${isPercent(c)?` (${N(c.value||c.valor)}%)`:''}`;
  document.getElementById('coupon958DiscountValue').textContent='- '+money(discount);
  const discounted=round2(Math.max(0,sub-discount));grandEl.textContent=pending?money(discounted)+' + frete':money(round2(discounted+ship));
}

function injectStyle(){
  if(document.getElementById('coupon958Style'))return;
  const style=document.createElement('style');style.id='coupon958Style';style.textContent=`
  #ceCouponBox{display:none!important}
  .coupon958-box{margin:14px 0;padding:14px;border:1px solid #e7d8c8;border-radius:16px;background:#fffaf3}
  .coupon958-title{font-weight:800;color:#173f32;margin-bottom:4px}.coupon958-note{font-size:12px;color:#765f50;margin-bottom:10px;line-height:1.45}
  .coupon958-row{display:flex;gap:8px}.coupon958-row input{min-width:0;flex:1;text-transform:uppercase}.coupon958-row button{white-space:nowrap}
  .coupon958-status{font-size:13px;line-height:1.4;margin-top:9px}.coupon958-status.ok{color:#166534}.coupon958-status.warn{color:#92400e}.coupon958-status.err{color:#991b1b}.coupon958-status.loading{color:#334155}
  .coupon958-discount{color:#166534;font-weight:700}.coupon958-discount[hidden]{display:none!important}
  #assistant958Toggle{position:fixed;right:18px;bottom:92px;z-index:1100;border:0;border-radius:999px;padding:12px 16px;font-weight:800;box-shadow:0 10px 28px #0002;background:#173f32;color:#fff;cursor:pointer}
  #assistant958Panel{position:fixed;right:18px;bottom:148px;width:min(370px,calc(100vw - 28px));max-height:min(570px,70vh);z-index:1101;background:#fff;border:1px solid #ddd2c5;border-radius:18px;box-shadow:0 18px 50px #0003;display:none;overflow:hidden}
  #assistant958Panel.open{display:flex;flex-direction:column}.assistant958-head{padding:13px 14px;background:#173f32;color:#fff;display:flex;align-items:center;justify-content:space-between}.assistant958-head button{border:0;background:transparent;color:#fff;font-size:20px;cursor:pointer}
  #assistant958Messages{padding:12px;overflow:auto;display:flex;flex-direction:column;gap:8px;min-height:190px}.assistant958-msg{max-width:88%;padding:9px 11px;border-radius:14px;font-size:13px;line-height:1.4;white-space:pre-wrap}.assistant958-msg.bot{align-self:flex-start;background:#f4eee5;color:#24312c}.assistant958-msg.user{align-self:flex-end;background:#7b1438;color:#fff}
  .assistant958-form{display:flex;gap:7px;padding:10px;border-top:1px solid #eee}.assistant958-form input{flex:1;min-width:0}.assistant958-form button{border:0;border-radius:12px;padding:8px 12px;background:#7b1438;color:#fff;font-weight:800}
  @media(max-width:600px){#assistant958Toggle{bottom:calc(88px + env(safe-area-inset-bottom));right:12px;padding:10px 13px;transition:opacity .18s ease,transform .18s ease}body.caseirinho-hero-actions-visible #assistant958Toggle{opacity:0;pointer-events:none;transform:translateY(8px)}#assistant958Panel{right:8px;bottom:calc(138px + env(safe-area-inset-bottom));width:calc(100vw - 16px);max-height:65vh}}
  `;document.head.appendChild(style);
}
function mountCouponBox(){
  if(document.getElementById('coupon958Box'))return;
  const checkout=document.getElementById('checkout'),delivery=document.getElementById('deliveryBox');if(!checkout)return;
  const box=document.createElement('div');box.id='coupon958Box';box.className='coupon958-box';box.innerHTML=`<div class="coupon958-title">🏷️ Tem cupom de desconto?</div><div id="coupon958Note" class="coupon958-note">Carregando cupons ativos...</div><div class="coupon958-row"><input id="coupon958Code" autocomplete="off" placeholder="Digite seu cupom" aria-label="Cupom de desconto"><button class="soft" id="coupon958Apply" type="button">Aplicar</button></div><div id="coupon958Status" class="coupon958-status"></div>`;
  checkout.insertBefore(box,delivery||checkout.firstChild);
  const input=document.getElementById('coupon958Code');document.getElementById('coupon958Apply').onclick=()=>applyTypedCoupon();
  input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();applyTypedCoupon()}});
  input.addEventListener('input',()=>{input.value=input.value.toUpperCase();const st=readState();if(st&&normalizeCode(input.value)!==normalizeCode(st.code))clearState('Cupom removido.',true)});
  const st=readState();if(st?.code){input.value=st.code;if(stateValidForCheckout())setStatus(st.code===FIRST_CODE?exactMessage('PRIMEIRA_COMPRA_OK',st.phone):`Cupom ${st.code} aplicado.`,'ok')}
  updateCouponNote();
}

function addChat(role,text){const box=document.getElementById('assistant958Messages');if(!box)return;const el=document.createElement('div');el.className='assistant958-msg '+role;el.textContent=text;box.appendChild(el);box.scrollTop=box.scrollHeight}
function mountAssistant(){
  if(document.getElementById('assistant958Toggle'))return;
  const toggle=document.createElement('button');toggle.id='assistant958Toggle';toggle.type='button';toggle.textContent='💬 Ajuda';toggle.setAttribute('aria-label','Abrir assistente do Caseirinho');
  const panel=document.createElement('div');panel.id='assistant958Panel';panel.innerHTML=`<div class="assistant958-head"><div><b>Assistente Caseirinho</b><br><small>Compras e cupons</small></div><button id="assistant958Close" type="button" aria-label="Fechar">×</button></div><div id="assistant958Messages"></div><form class="assistant958-form" id="assistant958Form"><input id="assistant958Input" autocomplete="off" placeholder="Digite sua dúvida..."><button type="submit">Enviar</button></form>`;
  document.body.append(toggle,panel);addChat('bot','Olá! Posso ajudar com o cardápio, seu pedido e cupons de desconto.');toggle.onclick=()=>{panel.classList.toggle('open');if(panel.classList.contains('open'))document.getElementById('assistant958Input')?.focus()};document.getElementById('assistant958Close').onclick=()=>panel.classList.remove('open');
  document.getElementById('assistant958Form').onsubmit=async e=>{e.preventDefault();const input=document.getElementById('assistant958Input'),msg=S(input.value).trim();if(!msg)return;input.value='';addChat('user',msg);const upper=normalizeCode(msg);if(upper.includes(FIRST_CODE)){const couponInput=document.getElementById('coupon958Code');if(couponInput)couponInput.value=FIRST_CODE;waitingPhone=true;addChat('bot','O CASEIRINHO10 dá 10% de desconto na primeira compra. Informe seu WhatsApp com DDD para validar.');return}if(waitingPhone){const p=sanitizePhone(msg);if(validPhone(p)){const field=document.getElementById('cPhone');if(field)field.value=formatPhone(p);await validateFirstPurchase(p,{fromChat:true});return}addChat('bot','Informe um WhatsApp válido com DDD, por exemplo: (11) 99999-9999.');return}const q=S(msg).toLowerCase();if(q.includes('cupom')||q.includes('desconto')){addChat('bot','Digite o código no campo de cupom do checkout. Cupons cadastrados no Motor Comercial são validados automaticamente; o CASEIRINHO10 é exclusivo da primeira compra.');return}if(q.includes('frete')||q.includes('entrega')){addChat('bot','Informe seu CEP no checkout. O frete será mostrado automaticamente quando houver regra disponível ou ficará pendente para cotação.');return}if(q.includes('pedido')||q.includes('compr')||q.includes('cardáp')||q.includes('cardap')){addChat('bot','Escolha os produtos, adicione ao carrinho e finalize seus dados. Se tiver cupom, aplique antes de confirmar o pedido.');return}addChat('bot','Posso ajudar com compras, entrega, acompanhamento do pedido e cupons. O que você precisa?')};
}
function protectHeroActions(){
  const target=document.querySelector('.hero-actions');if(!target)return;
  const mq=window.matchMedia('(max-width:600px)');
  const apply=visible=>{
    const active=!!visible&&mq.matches;
    document.body.classList.toggle('caseirinho-hero-actions-visible',active);
    if(active)document.getElementById('assistant958Panel')?.classList.remove('open');
  };
  if('IntersectionObserver'in window){
    const observer=new IntersectionObserver(entries=>apply(entries.some(e=>e.isIntersecting)),{threshold:.05});
    observer.observe(target);
  }else{
    const check=()=>{const r=target.getBoundingClientRect();apply(r.bottom>0&&r.top<window.innerHeight)};
    window.addEventListener('scroll',check,{passive:true});window.addEventListener('resize',check,{passive:true});check();
  }
  const onMq=()=>{if(!mq.matches)document.body.classList.remove('caseirinho-hero-actions-visible')};
  if(mq.addEventListener)mq.addEventListener('change',onMq);else if(mq.addListener)mq.addListener(onMq);
}
function watchPhone(){const p=document.getElementById('cPhone');if(!p)return;p.addEventListener('input',()=>{const st=readState();if(st?.code===FIRST_CODE&&sanitizePhone(p.value)!==st.phone)clearState('WhatsApp alterado. Valide o CASEIRINHO10 novamente.',true);scheduleTotals()})}
function watchTotals(){const sub=document.getElementById('subtotal'),ship=document.getElementById('shipping');if(!sub||!ship)return;const observer=new MutationObserver(scheduleTotals);observer.observe(sub,{childList:true,characterData:true,subtree:true});observer.observe(ship,{childList:true,characterData:true,subtree:true});scheduleTotals()}

window.fetch=async function(input,opt={}){
  const response=await rawFetch(input,opt);
  try{
    const method=S(opt?.method||(input instanceof Request?input.method:'GET')).toUpperCase();const rawUrl=typeof input==='string'?input:input?.url;const url=new URL(rawUrl,location.href);
    if(method==='POST'&&/\/commercial-apply$/i.test(url.pathname)&&response.ok){let sent={};try{sent=JSON.parse(S(opt.body)||'{}')}catch(_){}const st=readState();if(sent.couponCode&&st?.status==='GENERIC_OK'&&normalizeCode(sent.couponCode)===st.code)clearState('',false);return response}
    const orderPath=new RegExp('/api/v1/public/store/'+STORE.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'/orders/?$','i');
    if(method!=='POST'||!orderPath.test(url.pathname)||!response.ok)return response;
    const st=readState();if(!st||st.code!==FIRST_CODE||!stateValidForCheckout())return response;
    let sent={};try{sent=JSON.parse(S(opt.body)||'{}')}catch(_){return response}const sentPhone=sanitizePhone(sent?.cliente?.telefone);if(sentPhone!==st.phone)return response;
    const created=await response.clone().json();if(!created?.id||!created?.publicToken)return response;
    const apply=await rawFetch(API+'/api/v1/public/store/'+encodeURIComponent(STORE)+'/orders/'+encodeURIComponent(created.id)+'/coupon-caseirinho10?_t='+Date.now(),{method:'POST',cache:'no-store',headers:{'Content-Type':'application/json','Cache-Control':'no-cache'},body:JSON.stringify({token:created.publicToken,whatsapp:sentPhone,couponCode:FIRST_CODE})});
    let adjusted={};try{adjusted=await apply.json()}catch(_){}
    if(!apply.ok||adjusted.status!=='PRIMEIRA_COMPRA_OK'){clearState('O CASEIRINHO10 não pôde ser aplicado ao pedido. O total permanece sem o desconto.',true);return response}
    clearState('',false);const body={...created,subtotalOriginal:adjusted.subtotalOriginal,descontoCupom:adjusted.discount,subtotal:adjusted.subtotal,total:adjusted.total,cupom:{codigo:FIRST_CODE,percentual:10,desconto:adjusted.discount,primeiraCompra:true}};const headers=new Headers(response.headers);headers.set('Content-Type','application/json');headers.delete('content-length');return new Response(JSON.stringify(body),{status:response.status,statusText:response.statusText,headers});
  }catch(e){console.warn('[CUPONS] aplicação segura não concluída:',e);return response}
};

function init(){injectStyle();mountCouponBox();mountAssistant();protectHeroActions();watchPhone();watchTotals();loadCommerceConfig();setTimeout(()=>{const st=readState();if(st?.status==='GENERIC_OK')syncNativeGeneric(st.code).catch(()=>{})},700)}
window.CaseirinhoCoupon958={sanitizePhone,validPhone,validateCoupon:validateFirstPurchase,validateFirstPurchase,applyGenericCoupon,readState,clearState,loadCommerceConfig};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
