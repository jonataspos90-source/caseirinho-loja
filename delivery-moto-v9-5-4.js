(()=>{'use strict';
if(window.__CASEIRINHO_DELIVERY_MOTO_954__)return;
window.__CASEIRINHO_DELIVERY_MOTO_954__=true;
const CFG=window.CASEIRINHO_CONFIG||{};
const API=String(CFG.apiUrl||'').replace(/\/+$/,'');
const STORE=String(new URLSearchParams(location.search).get('empresa')||new URLSearchParams(location.search).get('loja')||CFG.storeSlug||'caseirinho').trim()||'caseirinho';
const CART_KEY='john_store_'+STORE+'_cart_v1';
const E=id=>document.getElementById(id),S=v=>String(v??''),N=v=>Number(v)||0;
const money=v=>N(v).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const round2=v=>Math.round((N(v)+Number.EPSILON)*100)/100;
const esc=v=>S(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function parseMoney(v){const s=S(v).replace(/\s/g,'').replace(/R\$/gi,'').replace(/\./g,'').replace(',','.').replace(/[^0-9.-]/g,'');const n=Number(s);return Number.isFinite(n)?n:0}
let deliveryConfig=null,quote=null,timer=0,quoting=false,lastAddress='',syncing=false,requestSeq=0;

function css(){if(E('deliveryMoto954Style'))return;const s=document.createElement('style');s.id='deliveryMoto954Style';s.textContent=`
.dm954-box{margin-top:10px;border:1px solid #dbe5df;border-radius:14px;padding:12px;background:#f8fbf9}.dm954-head{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap}.dm954-badge{display:inline-flex;align-items:center;gap:6px;background:#ecfdf5;color:#065f46;border:1px solid #a7f3d0;border-radius:999px;padding:6px 10px;font-size:12px;font-weight:900}.dm954-price{font-size:20px;font-weight:950;color:#7b1438}.dm954-detail{margin-top:7px;font-size:12px;line-height:1.45;color:#475569}.dm954-box.warn{background:#fff7ed;border-color:#fed7aa}.dm954-box.bad{background:#fef2f2;border-color:#fecaca}.dm954-confirm{position:fixed;inset:0;z-index:99999;background:rgba(15,23,42,.58);display:none;align-items:center;justify-content:center;padding:18px}.dm954-confirm.open{display:flex}.dm954-card{width:min(460px,100%);background:#fff;border-radius:22px;padding:20px;box-shadow:0 24px 70px rgba(0,0,0,.25)}.dm954-card h2{margin:0 0 5px}.dm954-summary{margin:15px 0;border:1px solid #e2e8f0;border-radius:14px;overflow:hidden}.dm954-row{display:flex;justify-content:space-between;gap:12px;padding:11px 13px;border-bottom:1px solid #e2e8f0}.dm954-row:last-child{border-bottom:0}.dm954-row.discount{color:#166534;font-weight:850}.dm954-row.total{font-size:18px;font-weight:950;background:#f8fafc}.dm954-actions{display:grid;grid-template-columns:1fr 1.25fr;gap:9px}.dm954-actions button{border-radius:11px;padding:12px;border:1px solid #cbd5e1;font-weight:900;cursor:pointer}.dm954-yes{background:#173f35;color:#fff;border-color:#173f35!important}.dm954-note{font-size:11px;color:#64748b;line-height:1.4;margin-top:9px}@media(max-width:480px){.dm954-actions{grid-template-columns:1fr}}
`;document.head.appendChild(s)}
function cartSubtotal(){let items=[];try{items=JSON.parse(localStorage.getItem(CART_KEY)||'[]')}catch(_){}return items.reduce((sum,x)=>sum+N(x.total??N(x.precoUnitario??x.preco)*N(x.quantidade||1)),0)}
function mode(){return S(E('mode')?.value).toUpperCase()}
function address(){return{cep:S(E('cep')?.value).trim(),logradouro:S(E('street')?.value).trim(),numero:S(E('number')?.value).trim(),complemento:S(E('comp')?.value).trim(),bairro:S(E('district')?.value).trim(),cidade:S(E('city')?.value).trim(),uf:S(E('uf')?.value).trim().toUpperCase()}}
function addressKey(a=address()){return [a.cep,a.logradouro,a.numero,a.complemento,a.bairro,a.cidade,a.uf].join('|')}
function complete(a=address()){return a.cep.replace(/\D/g,'').length===8&&a.logradouro&&a.numero&&a.cidade&&a.uf}
function visibleDiscounts(){
  const totals=document.querySelector('.totals');if(!totals)return[];
  const rows=[...totals.children];
  return rows.map(row=>{
    if(!row||row.hidden||row.classList?.contains('grand'))return null;
    const label=row.querySelector?.('span'),value=row.querySelector?.('b');
    if(!label||!value)return null;
    const raw=S(value.textContent).trim(),known=['coupon958DiscountRow','cashback960DiscountRow'].includes(S(row.id));
    if(!known&&!/^\s*-/.test(raw))return null;
    const amount=Math.abs(parseMoney(raw));if(amount<=0)return null;
    return{label:S(label.textContent).trim()||'Desconto',amount,valueText:'- '+money(amount)};
  }).filter(Boolean)
}
function discountTotal(){return round2(visibleDiscounts().reduce((sum,x)=>sum+N(x.amount),0))}
async function request(path,opt={},timeoutMs=7000){
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),timeoutMs);
  try{
    const r=await fetch(API+path,{...opt,signal:controller.signal,cache:'no-store',headers:{'Content-Type':'application/json','Cache-Control':'no-cache',...(opt.headers||{})}});
    let j={};try{j=await r.json()}catch(_){}
    if(!r.ok){const e=new Error(j.error||('HTTP '+r.status));e.status=r.status;e.data=j;throw e}
    return j;
  }catch(e){if(e?.name==='AbortError'){const x=new Error('Tempo limite ao calcular a rota.');x.code='TIMEOUT';throw x}throw e}
  finally{clearTimeout(timeout)}
}
async function loadConfig(){try{deliveryConfig=await request('/api/v1/public/store/'+encodeURIComponent(STORE)+'/delivery-config',{},5000);renderBox();return deliveryConfig}catch(e){console.warn('[Entrega Moto 9.5.4] config',e);renderBox();return null}}
function ensureBox(){const host=E('deliveryBox');if(!host)return null;let box=E('deliveryMotoQuote954');if(!box){box=document.createElement('div');box.id='deliveryMotoQuote954';box.className='dm954-box';const status=E('cepStatus');status?status.after(box):host.appendChild(box)}return box}
function setBox(box,className,html,hidden=false){if(!box)return;const h=!!hidden;if(box.hidden!==h)box.hidden=h;if(h)return;if(box.className!==className)box.className=className;const sig=className+'|'+html;if(box.dataset.renderSig!==sig){box.innerHTML=html;box.dataset.renderSig=sig}}
function renderBox(){
  const box=ensureBox();if(!box)return;
  if(mode()!=='ENTREGA'){setBox(box,'dm954-box','',true);return}
  const label=deliveryConfig?.label||'Entrega por Moto · Uber/99';
  if(deliveryConfig?.enabled===false){setBox(box,'dm954-box',`<div class="dm954-head"><span class="dm954-badge">🛵 ${label}</span><b>Entrega disponível</b></div><div class="dm954-detail">A loja confirmará a taxa de entrega.</div>`);return}
  if(quoting){setBox(box,'dm954-box',`<div class="dm954-head"><span class="dm954-badge">🛵 ${label}</span><b>Calculando distância...</b></div><div class="dm954-detail">Aguarde alguns segundos. O cálculo serve somente para definir distância e taxa de entrega.</div>`);return}
  if(quote?.canDeliver===false){setBox(box,'dm954-box bad',`<div class="dm954-head"><span class="dm954-badge">🛵 ${label}</span><b>Fora da área</b></div><div class="dm954-detail">${S(quote.error||'Endereço fora do limite máximo de entrega.')}</div>`);return}
  if(quote?.ok){setBox(box,'dm954-box',`<div class="dm954-head"><span class="dm954-badge">🛵 ${label}</span><span class="dm954-price">${money(quote.amount)}</span></div><div class="dm954-detail"><b>${N(quote.distanceKm).toLocaleString('pt-BR',{maximumFractionDigits:2})} km</b> de distância calculada${quote.maxDistanceKm?` · limite ${N(quote.maxDistanceKm).toLocaleString('pt-BR',{maximumFractionDigits:1})} km`:''}.<br>Sua entrega será enviada pela loja por serviço de moto Uber/99. Não há contratação automática dessas plataformas pelo app.</div>`);return}
  if(quote?.fallback){setBox(box,'dm954-box warn',`<div class="dm954-head"><span class="dm954-badge">🛵 ${label}</span><b>Taxa a confirmar</b></div><div class="dm954-detail">Não foi possível calcular a distância agora. Você pode continuar o pedido normalmente; a loja confirmará a taxa antes do envio.</div>`);return}
  setBox(box,'dm954-box',`<div class="dm954-head"><span class="dm954-badge">🛵 ${label}</span><b>Informe seu endereço</b></div><div class="dm954-detail">Preencha CEP e número para calcular somente a distância e a taxa. A entrega poderá ser enviada por moto Uber/99.</div>`)
}
function syncTotals(){if(syncing)return;syncing=true;try{if(mode()!=='ENTREGA'||!quote?.ok||quote.canDeliver===false)return;const sub=cartSubtotal(),fee=N(quote.amount),shipping=E('shipping'),grand=E('grandTotal'),subtotal=E('subtotal');if(subtotal&&subtotal.textContent!==money(sub))subtotal.textContent=money(sub);if(shipping&&shipping.textContent!==money(fee))shipping.textContent=money(fee);const discounted=Math.max(0,round2(sub-discountTotal()));if(grand&&grand.textContent!==money(discounted+fee))grand.textContent=money(discounted+fee)}finally{syncing=false}}
function setCheckoutBlocked(blocked){const b=E('checkout')?.querySelector('button[type="submit"]');if(!b)return;b.disabled=!!blocked;if(blocked)b.dataset.deliveryMotoBlocked='1';else delete b.dataset.deliveryMotoBlocked}
async function quoteNow(){
  clearTimeout(timer);
  if(mode()!=='ENTREGA'){quote=null;quoting=false;setCheckoutBlocked(false);renderBox();return}
  const a=address();
  if(!complete(a)){quote=null;quoting=false;setCheckoutBlocked(false);renderBox();return}
  const key=addressKey(a);if(key===lastAddress&&quote)return;
  lastAddress=key;const seq=++requestSeq;quoting=true;renderBox();
  try{
    const out=await request('/api/v1/public/store/'+encodeURIComponent(STORE)+'/delivery-quote',{method:'POST',body:JSON.stringify({entrega:a})},7000);
    if(seq!==requestSeq)return;
    quote=out;setCheckoutBlocked(out.canDeliver===false);
  }catch(e){
    if(seq!==requestSeq)return;
    const d=e.data||{};
    if(e.status===422){quote={...d,canDeliver:false,error:e.message};setCheckoutBlocked(true)}
    else{quote={fallback:true,error:e.message,providerConfigured:d.providerConfigured!==false};setCheckoutBlocked(false)}
  }finally{if(seq===requestSeq){quoting=false;renderBox();syncTotals()}}
}
function scheduleQuote(){clearTimeout(timer);lastAddress='';timer=setTimeout(quoteNow,450)}
function ensureConfirm(){let ov=E('deliveryMotoConfirm954');if(ov)return ov;ov=document.createElement('div');ov.id='deliveryMotoConfirm954';ov.className='dm954-confirm';ov.innerHTML=`<div class="dm954-card"><h2>Fazer o Pedido?</h2><div class="dm954-note">Confira os valores antes de enviar.</div><div class="dm954-summary"><div class="dm954-row"><span>Produtos</span><b id="dm954ConfirmSub"></b></div><div id="dm954ConfirmDiscounts"></div><div class="dm954-row"><span>Taxa de entrega</span><b id="dm954ConfirmFee"></b></div><div class="dm954-row total"><span>Total</span><b id="dm954ConfirmTotal"></b></div></div><div id="dm954ConfirmDelivery" class="dm954-note"></div><div class="dm954-actions"><button type="button" id="dm954No">Voltar e revisar</button><button type="button" class="dm954-yes" id="dm954Yes">Sim, fazer o pedido</button></div></div>`;document.body.appendChild(ov);E('dm954No').onclick=()=>ov.classList.remove('open');E('dm954Yes').onclick=()=>{ov.classList.remove('open');const form=E('checkout');if(!form)return;form.dataset.deliveryMotoConfirmed='1';form.requestSubmit();setTimeout(()=>delete form.dataset.deliveryMotoConfirmed,0)};ov.addEventListener('click',e=>{if(e.target===ov)ov.classList.remove('open')});return ov}
function showConfirm(){
  const ov=ensureConfirm(),sub=cartSubtotal(),delivery=mode()==='ENTREGA',fee=delivery&&quote?.ok?N(quote.amount):0,pending=delivery&&!quote?.ok;
  const discounts=visibleDiscounts(),discount=round2(discounts.reduce((sum,x)=>sum+N(x.amount),0)),productsAfter=Math.max(0,round2(sub-discount));
  E('dm954ConfirmSub').textContent=money(sub);
  E('dm954ConfirmDiscounts').innerHTML=discounts.map(x=>`<div class="dm954-row discount"><span>${esc(x.label)}</span><b>${esc(x.valueText)}</b></div>`).join('');
  E('dm954ConfirmFee').textContent=delivery?(pending?'A confirmar':money(fee)):'R$ 0,00';
  E('dm954ConfirmTotal').textContent=pending?money(productsAfter)+' + entrega':money(round2(productsAfter+fee));
  E('dm954ConfirmDelivery').textContent=delivery?(quote?.ok?`🛵 ${deliveryConfig?.label||'Entrega por Moto · Uber/99'} · ${N(quote.distanceKm).toLocaleString('pt-BR',{maximumFractionDigits:2})} km`:'A distância não foi calculada agora. A loja confirmará a taxa da entrega antes do envio.'):'Retirada selecionada: sem taxa de entrega.';
  ov.classList.add('open')
}
function interceptSubmit(e){const form=E('checkout');if(!form||e.target!==form)return;if(form.dataset.deliveryMotoConfirmed==='1')return;if(mode()==='ENTREGA'&&quote?.canDeliver===false){e.preventDefault();e.stopImmediatePropagation();renderBox();E('deliveryMotoQuote954')?.scrollIntoView({behavior:'smooth',block:'center'});return}e.preventDefault();e.stopImmediatePropagation();showConfirm()}
function afterCartAction(){setTimeout(()=>{renderBox();syncTotals()},0)}
function boot(){
  css();ensureBox();ensureConfirm();loadConfig().then(()=>scheduleQuote());
  ['cep','number','street','district','city','uf','comp'].forEach(id=>{const el=E(id);if(el){el.addEventListener('input',scheduleQuote);el.addEventListener('change',scheduleQuote)}});
  E('mode')?.addEventListener('change',()=>{requestSeq++;quote=null;quoting=false;lastAddress='';setCheckoutBlocked(false);renderBox();if(mode()==='ENTREGA')scheduleQuote()});
  E('checkout')?.addEventListener('submit',interceptSubmit,true);
  E('cartItems')?.addEventListener('click',afterCartAction);
  window.addEventListener('storage',e=>{if(e.key===CART_KEY)afterCartAction()});
  setInterval(()=>{renderBox();syncTotals()},1800);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,220),{once:true});else setTimeout(boot,220);
window.CaseirinhoDeliveryMoto954={version:'9.5.4',quoteNow,scheduleQuote,loadConfig,get quote(){return quote}};
})();
