(()=>{'use strict';
if(window.__CASEIRINHO_JOHN_COUPON_959__)return;window.__CASEIRINHO_JOHN_COUPON_959__=true;

const CFG=window.CASEIRINHO_CONFIG||{};
const API=String(CFG.apiUrl||'').replace(/\/+$/,'');
const STORE=String(new URLSearchParams(location.search).get('empresa')||new URLSearchParams(location.search).get('loja')||CFG.storeSlug||'caseirinho').trim().toLowerCase();
const KEY='john_store_'+STORE+'_coupon_unified_v2';
const FIRST_CODE='CASEIRINHO10';
const previousFetch=window.fetch.bind(window);
let johnWaitingPhone=false;
let catalogCache=null;
let catalogLoadedAt=0;
let renderQueued=false;

const S=v=>String(v??'');
const N=v=>Number(v)||0;
const A=v=>Array.isArray(v)?v:[];
const round2=v=>Math.round((N(v)+Number.EPSILON)*100)/100;
const normalizeCode=v=>S(v).trim().toUpperCase().replace(/\s+/g,'');
const textNorm=v=>S(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9%]+/g,' ').trim();
const money=v=>N(v).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
function parseMoney(v){const s=S(v).replace(/\s/g,'').replace(/R\$/gi,'').replace(/\./g,'').replace(',','.').replace(/[^0-9.-]/g,'');const n=Number(s);return Number.isFinite(n)?n:0}
function readState(){try{return JSON.parse(localStorage.getItem(KEY)||'null')}catch(_){return null}}
function saveState(v){try{localStorage.setItem(KEY,JSON.stringify(v))}catch(_){}}
function setCouponStatus(text,type=''){const el=document.getElementById('coupon958Status');if(!el)return;el.className='coupon958-status '+type;el.textContent=text}
function isPercent(c){return ['PERCENT','PERCENTUAL','PERCENTAGE','%'].includes(normalizeCode(c?.type||c?.tipo))}
function couponDiscount(c,subtotal){if(!c)return 0;const min=N(c.minSubtotal||c.pedidoMinimo);if(min>subtotal+1e-9)return 0;let d=isPercent(c)?subtotal*Math.max(0,Math.min(100,N(c.value||c.valor)))/100:Math.max(0,N(c.value||c.valor));const max=N(c.maxDiscount||c.descontoMaximo);if(max>0)d=Math.min(d,max);return round2(Math.min(subtotal,d))}
function couponBenefit(c){return isPercent(c)?`${N(c.value||c.valor)}% de desconto`:`${money(N(c.value||c.valor))} de desconto`}
function activeCouponState(){const st=readState();return st?.code&&['GENERIC_OK','PRIMEIRA_COMPRA_OK'].includes(st.status)?st:null}

async function validateTypedCoupon(code,subtotal){
  const r=await previousFetch(API+'/api/v1/public/store/'+encodeURIComponent(STORE)+'/coupon/validate?_t='+Date.now(),{method:'POST',cache:'no-store',headers:{'Content-Type':'application/json','Cache-Control':'no-cache'},body:JSON.stringify({code,subtotal})});
  let data={};try{data=await r.json()}catch(_){}
  if(!r.ok){const e=new Error(data.error||'Não foi possível validar o cupom.');e.status=data.status||'';e.data=data;throw e}
  return data;
}

function desiredCheckoutTotal(subtotal,shipping,shippingPending,discount){
  const discounted=round2(Math.max(0,subtotal-discount));
  return shippingPending?money(discounted)+' + frete':money(round2(discounted+shipping));
}
function renderDiscount(){
  const totals=document.querySelector('.totals'),subEl=document.getElementById('subtotal'),shipEl=document.getElementById('shipping'),grand=document.getElementById('grandTotal');
  if(!totals||!subEl||!shipEl||!grand)return;
  let row=document.getElementById('coupon958DiscountRow');
  if(!row){row=document.createElement('div');row.id='coupon958DiscountRow';row.className='coupon958-discount';row.innerHTML='<span id="coupon958DiscountLabel">🏷️ Cupom</span><b id="coupon958DiscountValue">- R$ 0,00</b>';totals.insertBefore(row,totals.querySelector('.grand')||null)}
  const subtotal=parseMoney(subEl.textContent),shippingPending=/cot|pend|frete/i.test(S(shipEl.textContent))&&!/R\$/i.test(S(shipEl.textContent)),shipping=parseMoney(shipEl.textContent),st=activeCouponState();
  if(!st){row.hidden=true;return}
  const coupon=st.coupon||{};
  const discount=st.code===FIRST_CODE?round2(subtotal*.10):couponDiscount(coupon,subtotal);
  row.hidden=false;
  const pct=st.code===FIRST_CODE?10:(isPercent(coupon)?N(coupon.value||coupon.valor):0);
  const label=document.getElementById('coupon958DiscountLabel'),value=document.getElementById('coupon958DiscountValue');
  if(label)label.textContent=`🏷️ ${st.code}${pct?` (${pct}%)`:''}`;
  if(value)value.textContent='- '+money(discount);
  const expected=desiredCheckoutTotal(subtotal,shipping,shippingPending,discount);
  if(grand.textContent!==expected)grand.textContent=expected;
}
function scheduleRender(){if(renderQueued)return;renderQueued=true;requestAnimationFrame(()=>{renderQueued=false;renderDiscount()})}
function clearLocalState(){try{localStorage.removeItem(KEY)}catch(_){}scheduleRender()}

async function applyGenericCoupon(code){
  const normalized=normalizeCode(code);if(!normalized)return setCouponStatus('Digite o código do cupom.','warn');
  const subtotal=parseMoney(document.getElementById('subtotal')?.textContent||'');
  setCouponStatus('Validando cupom...','loading');
  try{
    const data=await validateTypedCoupon(normalized,subtotal),coupon=data.coupon||{};
    const min=N(coupon.minSubtotal),discount=N(data.discount)||couponDiscount(coupon,subtotal);
    saveState({code:normalized,status:'GENERIC_OK',coupon:{code:normalized,type:coupon.type||'PERCENT',value:N(coupon.value),minSubtotal:min,maxDiscount:N(coupon.maxDiscount)||null,startAt:coupon.startAt||null,endAt:coupon.endAt||null,active:true},validatedAt:new Date().toISOString()});
    setCouponStatus(`Cupom aplicado: ${couponBenefit(coupon)}${discount>0?` (${money(discount)} neste carrinho)`:''}.`,'ok');
    scheduleRender();setTimeout(renderDiscount,30);setTimeout(renderDiscount,180);return true;
  }catch(e){
    clearLocalState();console.error('[CUPOM 9.5.9]',e);
    if(e.status==='PEDIDO_MINIMO'){setCouponStatus(e.message,'warn');return false}
    if(e.status==='CUPOM_INVALIDO'){setCouponStatus('Cupom inválido, indisponível ou fora da vigência.','warn');return false}
    setCouponStatus('Não foi possível validar o cupom agora. Tente novamente.','err');return false;
  }
}

function keepCouponListPrivate(){
  const note=document.getElementById('coupon958Note');if(!note)return;
  const privateText='Digite o código do seu cupom. A validade e as regras serão conferidas automaticamente.';
  const apply=()=>{if(note.textContent!==privateText)note.textContent=privateText};apply();
  new MutationObserver(apply).observe(note,{childList:true,characterData:true,subtree:true});
}
function installCouponCapture(){
  document.addEventListener('click',e=>{const b=e.target?.closest?.('#coupon958Apply');if(!b)return;const code=normalizeCode(document.getElementById('coupon958Code')?.value);if(code===FIRST_CODE)return;e.preventDefault();e.stopImmediatePropagation();applyGenericCoupon(code)},true);
  document.addEventListener('keydown',e=>{if(e.key!=='Enter'||e.target?.id!=='coupon958Code')return;const code=normalizeCode(e.target.value);if(code===FIRST_CODE)return;e.preventDefault();e.stopImmediatePropagation();applyGenericCoupon(code)},true);
}

function getStateBeforeOrder(){const st=readState();return st?.status==='GENERIC_OK'&&st.code&&st.code!==FIRST_CODE?st:null}
window.fetch=async function(input,opt={}){
  const method=S(opt?.method||(input instanceof Request?input.method:'GET')).toUpperCase(),rawUrl=typeof input==='string'?input:input?.url;
  let url;try{url=new URL(rawUrl,location.href)}catch(_){return previousFetch(input,opt)}
  const orderPath=new RegExp('/api/v1/public/store/'+STORE.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'/orders/?$','i');
  const generic=method==='POST'&&orderPath.test(url.pathname)?getStateBeforeOrder():null;
  const response=await previousFetch(input,opt);
  if(!generic||!response.ok)return response;
  try{
    const created=await response.clone().json();if(!created?.id||!created?.publicToken)return response;
    const apply=await previousFetch(API+'/api/v1/public/store/'+encodeURIComponent(STORE)+'/orders/'+encodeURIComponent(created.id)+'/commercial-apply?_t='+Date.now(),{method:'POST',cache:'no-store',headers:{'Content-Type':'application/json','Cache-Control':'no-cache'},body:JSON.stringify({token:created.publicToken,adjustments:[],couponCode:generic.code})});
    let adjusted={};try{adjusted=await apply.json()}catch(_){}
    if(!apply.ok){setCouponStatus(adjusted.error||'O cupom não pôde ser aplicado ao pedido.','err');return response}
    clearLocalState();
    const body={...created,...adjusted,cupom:{codigo:generic.code,desconto:N(adjusted.couponDiscount)}};
    const headers=new Headers(response.headers);headers.set('Content-Type','application/json');headers.delete('content-length');
    return new Response(JSON.stringify(body),{status:response.status,statusText:response.statusText,headers});
  }catch(e){console.warn('[CUPOM 9.5.9] falha na aplicação autoritativa',e);return response}
};

async function getCatalog(force=false){
  if(!force&&catalogCache&&Date.now()-catalogLoadedAt<60000)return catalogCache;
  try{const r=await previousFetch(API+'/api/v1/public/store/'+encodeURIComponent(STORE)+'/catalog?_t='+Date.now(),{cache:'no-store'});if(!r.ok)throw new Error();catalogCache=await r.json();catalogLoadedAt=Date.now();return catalogCache}catch(_){return catalogCache||{loja:{},produtos:[]}}
}
function productPrice(p){return N(p?.preco||p?.precoVenda||p?.valor)}
function productText(p){return textNorm([p?.nome,p?.descricao,p?.categoria,p?.grupo,p?.subgrupo].filter(Boolean).join(' '))}
const STOP=new Set('a o as os um uma uns umas de da do das dos para por com sem e ou que qual quais quanto custa custam preco preço valor tem vende voces vocês voce você me fala falar sobre quero queria gostaria produto produtos cardapio cardápio caseirinho'.split(' '));
function queryTokens(q){return textNorm(q).split(' ').filter(x=>x.length>1&&!STOP.has(x))}
function findProducts(cat,q){const tokens=queryTokens(q);if(!tokens.length)return[];return A(cat?.produtos).map(p=>{const name=textNorm(p.nome),all=productText(p);let score=0;for(const t of tokens){if(name.includes(t))score+=4;else if(all.includes(t))score+=1}return{p,score}}).filter(x=>x.score>0).sort((a,b)=>b.score-a.score||S(a.p.nome).localeCompare(S(b.p.nome))).slice(0,6).map(x=>x.p)}
function formatProduct(p,withDescription=false){let s=`${S(p.nome)||'Produto'} — ${money(productPrice(p))}`;if(withDescription&&p.descricao)s+=`. ${S(p.descricao).slice(0,240)}`;return s}
function currentPaymentOptions(){return [...document.querySelectorAll('#payment option')].map(o=>S(o.textContent).trim()).filter(x=>x&&!/^a definir$/i.test(x))}
function currentOrder(){let found=[];try{for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i)||'';if(!/order|pedido/i.test(k))continue;let v;try{v=JSON.parse(localStorage.getItem(k)||'null')}catch(_){continue}if(Array.isArray(v))found.push(...v);else if(v&&typeof v==='object')found.push(v)}}catch(_){}return found.filter(x=>x&&typeof x==='object'&&(x.codigo||x.id)).sort((a,b)=>new Date(b.savedAt||b.criadoEm||b.createdAt||0)-new Date(a.savedAt||a.criadoEm||a.createdAt||0))[0]||null}
function storeAddress(loja){const e=loja?.endereco||{};if(typeof e==='string'&&e.trim())return e.trim();return[e.logradouro||loja?.logradouro,e.numero||loja?.numero,e.bairro||loja?.bairro,e.cidade||loja?.cidade,e.uf||loja?.uf].filter(Boolean).join(', ')}
function addChat(role,text){const box=document.getElementById('assistant958Messages');if(!box)return;const el=document.createElement('div');el.className='assistant958-msg '+role;el.textContent=text;box.appendChild(el);box.scrollTop=box.scrollHeight}
function exactFirstMessage(data){if(data?.status==='PRIMEIRA_COMPRA_OK')return 'Cupom validado para a primeira compra. O desconto será aplicado ao pedido.';if(data?.status==='CLIENTE_JA_USOU')return 'Esse WhatsApp já possui pedido anterior e não é elegível ao desconto de primeira compra.';if(data?.status==='CUPOM_EXPIRADO')return 'Esse cupom de primeira compra não está vigente.';return 'Não foi possível validar esse cupom com o WhatsApp informado.'}
async function johnReply(message){
  const q=textNorm(message),cat=await getCatalog(),loja=cat.loja||{};
  if(johnWaitingPhone){const digits=S(message).replace(/\D/g,'');if(digits.length>=10){johnWaitingPhone=false;const field=document.getElementById('cPhone');if(field)field.value=message;const data=await window.CaseirinhoCoupon958?.validateFirstPurchase?.(message,{fromChat:false});return exactFirstMessage(data)}return 'Informe um WhatsApp com DDD, por exemplo: (11) 99999-9999.'}
  if(normalizeCode(message).includes(FIRST_CODE)){johnWaitingPhone=true;return 'Esse é o cupom de primeira compra. Para validar, me informe o WhatsApp com DDD que será usado no pedido.'}
  if(/\b(oi|ola|olá|bom dia|boa tarde|boa noite)\b/.test(q))return 'Olá! Sou o John. Posso consultar o cardápio, preços, produtos, carrinho, entrega, retirada, pagamento, pedidos e cupons.';
  if(/cupom|desconto/.test(q))return 'Se você recebeu um código de cupom, digite no campo “Tem cupom de desconto?” e toque em Aplicar. Por segurança, os cupons ativos não são exibidos na loja.';
  if(/pagamento|pagar|pix|cartao|cartão|dinheiro/.test(q)){const opts=currentPaymentOptions();return opts.length?'As formas de pagamento disponíveis agora são: '+opts.join(', ')+'.':'As formas disponíveis aparecem no campo Pagamento durante a finalização do pedido.'}
  if(/entrega|frete|cep|retirada|retirar/.test(q)){const ship=S(document.getElementById('shipping')?.textContent).trim();if(/frete|quanto.*entrega/.test(q)&&ship)return `No carrinho, a entrega está em ${ship}. Se ainda estiver pendente, informe o CEP para calcular ou solicitar a cotação.`;const parts=[];if(loja.permitirEntrega!==false)parts.push('entrega');if(loja.permitirRetirada)parts.push('retirada');return `A loja trabalha com ${parts.length?parts.join(' e '):'as opções mostradas no checkout'}. Para entrega, informe o CEP e o número.`}
  if(/endereco|endereço|onde fica|localizacao|localização/.test(q)){const a=storeAddress(loja);return a?`O endereço informado pela loja é ${a}.`:'O endereço da loja não está publicado neste cardápio agora.'}
  if(/pedido|acompanhar|status/.test(q)){const o=currentOrder();return o?`Seu pedido mais recente é ${S(o.codigo||o.id)} e o status registrado é ${S(o.status||'em acompanhamento')}.`:'Para acompanhar, toque em “Pedidos” no menu inferior.'}
  if(/carrinho|subtotal|total|quanto deu|quanto ficou/.test(q)){const count=S(document.getElementById('cartCount')?.textContent||'0'),sub=S(document.getElementById('subtotal')?.textContent||'R$ 0,00'),total=S(document.getElementById('grandTotal')?.textContent||sub);return `Seu carrinho tem ${count} item(ns). Produtos: ${sub}. Total atual: ${total}.`}
  const products=findProducts(cat,message);if(products.length){if(/preco|preço|quanto|custa|valor/.test(q))return products.map(p=>formatProduct(p,false)).join('\n');return products.map(p=>formatProduct(p,true)).join('\n')}
  if(/cardapio|cardápio|produto|produtos|vende|tem/.test(q)){const ps=A(cat.produtos).filter(p=>p&&p.ativo!==false).slice(0,10);return ps.length?'Alguns itens disponíveis:\n'+ps.map(p=>formatProduct(p,false)).join('\n'):'Não consegui carregar o cardápio agora.'}
  return 'Posso consultar produtos e preços do cardápio, seu carrinho, entrega, retirada, pagamento, pedidos e cupons. Pergunte do jeito que preferir.';
}
function installJohn(){
  const toggle=document.getElementById('assistant958Toggle'),panel=document.getElementById('assistant958Panel'),messages=document.getElementById('assistant958Messages');
  if(toggle)toggle.textContent='💬 Fale com John';const head=panel?.querySelector('.assistant958-head > div');if(head)head.innerHTML='<b>John</b><br><small>Assistente do Caseirinho</small>';
  if(messages){messages.innerHTML='';addChat('bot','Olá! Sou o John. Pergunte sobre produtos, preços, entrega, retirada, pagamento, seu pedido ou cupons.')}
  document.addEventListener('submit',async e=>{if(e.target?.id!=='assistant958Form')return;e.preventDefault();e.stopImmediatePropagation();const input=document.getElementById('assistant958Input'),msg=S(input?.value).trim();if(!msg)return;input.value='';addChat('user',msg);addChat('bot','Consultando...');const box=document.getElementById('assistant958Messages'),waiting=box?.lastElementChild;try{const reply=await johnReply(msg);if(waiting)waiting.textContent=reply}catch(_){if(waiting)waiting.textContent='Não consegui consultar isso agora. Tente novamente em instantes.'}},true);
}
function watchTotals(){
  const totals=document.querySelector('.totals'),cart=document.getElementById('cartItems');if(!totals)return;
  const observer=new MutationObserver(scheduleRender);observer.observe(totals,{childList:true,characterData:true,subtree:true});if(cart)observer.observe(cart,{childList:true,characterData:true,subtree:true});
  document.addEventListener('change',e=>{if(['mode','cep','number'].includes(e.target?.id))setTimeout(renderDiscount,40)},true);
  scheduleRender();
}
function init(){keepCouponListPrivate();installJohn();watchTotals();setTimeout(renderDiscount,80)}
installCouponCapture();
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else setTimeout(init,0);
window.CaseirinhoJohn959={applyGenericCoupon,johnReply,renderDiscount,desiredCheckoutTotal};
})();