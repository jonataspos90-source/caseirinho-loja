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
function categoryName(cat,p){const rows=A(cat?.loja?.categorias);const c=rows.find(x=>S(x.id)===S(p?.categoriaId))||rows.find(x=>textNorm(x.nome)===textNorm(p?.categoria));return S(c?.nome||p?.categoria||p?.grupo||'')}
function productText(cat,p){return textNorm([p?.nome,p?.gradeNome,p?.gradeDescricao,p?.variacaoLabel,p?.descricao,p?.categoria,p?.grupo,p?.subgrupo,categoryName(cat,p)].filter(Boolean).join(' '))}
const STOP=new Set('a o as os um uma uns umas de da do das dos para por com sem e ou que qual quais quanto custa custam preco preço valor tem vende voces vocês voce você me fala falar sobre quero queria gostaria produto produtos cardapio cardápio caseirinho opcao opcoes opção opções ate até abaixo menos maximo máximo faixa gastar tenho reais reais recomendacao recomendação sugestao sugestão ajude ajuda escolher'.split(' ').map(textNorm));
function queryTokens(q){const raw=S(q).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/(?:ate|abaixo de|menos de|no maximo|maximo|gastar|orcamento(?: de)?)(?:\s+r?\$?)?\s*(?:r?\$?\s*)?\d{1,5}(?:[.,]\d{1,2})?/g,' ');return textNorm(raw).split(' ').filter(x=>x.length>1&&!STOP.has(x)&&!/^\d$/.test(x))}
function budgetLimit(q){const raw=S(q).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();const m=raw.match(/(?:ate|abaixo de|menos de|no maximo|maximo|gastar|orcamento(?: de)?)(?:\s+r?\$?)?\s*(?:r?\$?\s*)?(\d{1,5}(?:[.,]\d{1,2})?)/);if(!m)return 0;const n=Number(m[1].replace(',','.'));return Number.isFinite(n)&&n>0?n:0}
function productAvailable(p){if(!p||p.ativo===false||p.disponivel===false||p.publicadoOnline===false)return false;if(typeof p.podeComprar==='boolean')return p.podeComprar;const d=textNorm(p.disponibilidadeEfetiva||p.disponibilidade||'ambos');return d==='ambos'||d==='sob encomenda'||Number(p.saldoDisponivel)>0}
function optionText(p){return textNorm([p?.variacaoLabel,p?.nome].filter(Boolean).join(' '))}
function gradeVariants(cat,p){const all=A(cat?.produtos);if(!p?.gradeId)return[p];return all.filter(x=>S(x.gradeId)===S(p.gradeId)&&productAvailable(x)).sort((a,b)=>N(a.variacaoOrdem)-N(b.variacaoOrdem)||S(a.variacaoLabel||a.nome).localeCompare(S(b.variacaoLabel||b.nome),'pt-BR'))}
function findProducts(cat,q){
  const tokens=queryTokens(q),budget=budgetLimit(q),all=A(cat?.produtos).filter(productAvailable);
  if(!tokens.length&&!budget)return[];
  const seen=new Set(),matches=[];
  for(const p of all){
    const key=p.gradeId?'grade:'+S(p.gradeId):'product:'+S(p.id||p.nome);if(seen.has(key))continue;seen.add(key);
    const variants=gradeVariants(cat,p);let options=variants.filter(v=>!budget||productPrice(v)<=budget+0.005);if(!options.length)continue;
    const commonText=textNorm([p?.gradeNome,p?.gradeDescricao,p?.descricao,p?.categoria,p?.grupo,p?.subgrupo,categoryName(cat,p)].filter(Boolean).join(' '));
    const variantTokens=tokens.filter(t=>variants.some(v=>optionText(v).includes(t))&&!commonText.includes(t));
    if(variantTokens.length)options=options.filter(v=>variantTokens.some(t=>optionText(v).includes(t)));
    if(!options.length)continue;
    const scores=options.map(v=>{const name=textNorm([v?.gradeNome,v?.gradeDescricao,v?.nome,v?.variacaoLabel].filter(Boolean).join(' ')),whole=productText(cat,v);let score=0,matched=0;for(const t of tokens){if(name.includes(t)){score+=5;matched++}else if(whole.includes(t)){score+=2;matched++}}return score+(tokens.length?matched/tokens.length:0)});
    const score=Math.max(0,...scores);if(tokens.length&&!score)continue;
    matches.push({p,variants:options,grouped:!!p.gradeId&&variants.length>1,category:categoryName(cat,p),score,minPrice:Math.min(...options.map(productPrice)),maxPrice:Math.max(...options.map(productPrice))});
  }
  matches.sort((a,b)=>b.score-a.score||(budget?a.minPrice-b.minPrice:a.p.nome.localeCompare(b.p.nome,'pt-BR')));
  return matches.slice(0,5);
}
function formatProduct(entry,withDescription=false){
  const p=entry.p,name=entry.grouped?(p.gradeNome||p.nome):p.nome;
  let line='• '+S(name||'Produto');
  if(entry.grouped){line+=' — opções: '+entry.variants.map(v=>S(v.variacaoLabel||v.nome)+' ('+money(productPrice(v))+')').join(', ')}
  else line+=' — '+money(productPrice(p));
  if(entry.category)line+=' · '+entry.category;
  if(withDescription){const d=S(p.gradeDescricao||p.descricao).trim();if(d)line+='\n  '+d.slice(0,180)}
  return line;
}
function currentPaymentOptions(){return [...document.querySelectorAll('#payment option')].map(o=>S(o.textContent).trim()).filter(x=>x&&!/^a definir$/i.test(x))}
function currentOrder(){let found=[];try{for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i)||'';if(!/order|pedido/i.test(k))continue;let v;try{v=JSON.parse(localStorage.getItem(k)||'null')}catch(_){continue}if(Array.isArray(v))found.push(...v);else if(v&&typeof v==='object')found.push(v)}}catch(_){}return found.filter(x=>x&&typeof x==='object'&&(x.codigo||x.id)).sort((a,b)=>new Date(b.savedAt||b.criadoEm||b.createdAt||0)-new Date(a.savedAt||a.criadoEm||a.createdAt||0))[0]||null}
function storeAddress(loja){const e=loja?.endereco||{};if(typeof e==='string'&&e.trim())return e.trim();return[e.logradouro||loja?.logradouro,e.numero||loja?.numero,e.bairro||loja?.bairro,e.cidade||loja?.cidade,e.uf||loja?.uf].filter(Boolean).join(', ')}
function addChat(role,text){const box=document.getElementById('assistant958Messages');if(!box)return;const el=document.createElement('div');el.className='assistant958-msg '+role;el.textContent=text;box.appendChild(el);box.scrollTop=box.scrollHeight}
function exactFirstMessage(data){if(data?.status==='PRIMEIRA_COMPRA_OK')return 'Cupom validado para a primeira compra. O desconto será aplicado ao pedido.';if(data?.status==='CLIENTE_JA_USOU')return 'Esse WhatsApp já possui pedido anterior e não é elegível ao desconto de primeira compra.';if(data?.status==='CUPOM_EXPIRADO')return 'Esse cupom de primeira compra não está vigente.';return 'Não foi possível validar esse cupom com o WhatsApp informado.'}
async function johnReply(message){
  const q=textNorm(message);
  if(johnWaitingPhone){const digits=S(message).replace(/\D/g,'');if(digits.length>=10){johnWaitingPhone=false;const field=document.getElementById('cPhone');if(field)field.value=message;const data=await window.CaseirinhoCoupon958?.validateFirstPurchase?.(message,{fromChat:false});return exactFirstMessage(data)}return 'Informe um WhatsApp com DDD, por exemplo: (11) 99999-9999.'}
  if(normalizeCode(message).includes(FIRST_CODE)){johnWaitingPhone=true;return 'Esse é o cupom de primeira compra. Para validar, me informe o WhatsApp com DDD que será usado no pedido.'}
  if(/\b(oi|ola|bom dia|boa tarde|boa noite)\b/.test(q))return 'Olá! Sou o John. Posso encontrar produtos por sabor, tamanho ou faixa de preço e consultar carrinho, entrega, retirada, pagamento, pedidos e cupons.';
  if(/cupom|desconto/.test(q))return 'Se você recebeu um código de cupom, digite no campo “Tem cupom de desconto?” e toque em Aplicar. Por segurança, os cupons ativos não são exibidos na loja.';
  const cat=await getCatalog(),loja=cat.loja||{};
  if(/pagamento|pagar|pix|cartao|dinheiro/.test(q)){const opts=currentPaymentOptions();return opts.length?'As formas de pagamento disponíveis agora são: '+opts.join(', ')+'.':'As formas disponíveis aparecem no campo Pagamento durante a finalização do pedido.'}
  if(/entrega|frete|cep|retirada|retirar/.test(q)){const ship=S(document.getElementById('shipping')?.textContent).trim();if(/frete|quanto.*entrega/.test(q)&&ship)return 'No carrinho, a entrega está em '+ship+'. Se ainda estiver pendente, informe o CEP para calcular ou solicitar a cotação.';const parts=[];if(loja.permitirEntrega!==false)parts.push('entrega');if(loja.permitirRetirada)parts.push('retirada');return 'A loja trabalha com '+(parts.length?parts.join(' e '):'as opções mostradas no checkout')+'. Para entrega, informe o CEP e o número.'}
  if(/endereco|onde fica|localizacao/.test(q)){const a=storeAddress(loja);return a?'O endereço informado pela loja é '+a+'.':'O endereço da loja não está publicado neste cardápio agora.'}
  if(/prepar|aquecer|fritar|forno|microondas/.test(q)){if(/nhoque/.test(q))return 'O nhoque já vem cozido. Descongele por cerca de 2 horas e aqueça com o molho quente, ou leve ao forno por aproximadamente 15 minutos. Evite deixar tempo demais no forno para não amolecer.';if(/salgado|coxinha|risole|bolinha/.test(q))return 'Os salgados podem ser fritos congelados por cerca de 4 a 5 minutos, em temperatura média, para dourar por fora e aquecer por dentro. Também podem ser fritos descongelados.';if(/molho/.test(q))return 'O molho já vem temperado e pode ir do congelador direto para a panela. Se não for usar, mantenha-o congelado.';return 'Qual produto você quer preparar? As orientações variam entre nhoque, molho e salgados.'}
  if(/alerg|gluten|lactose|ingrediente|contem/.test(q))return 'Não encontrei uma informação confirmada sobre isso no cadastro público do produto. Para confirmar ingredientes ou alergênicos, fale com a loja pelo WhatsApp antes de comprar.'
  if(/pedido|acompanhar|status/.test(q)){const o=currentOrder();return o?'Seu pedido mais recente é '+S(o.codigo||o.id)+' e o status registrado é '+S(o.status||'em acompanhamento')+'.':'Para acompanhar, toque em “Pedidos” no menu inferior.'}
  if(/carrinho|subtotal|total|quanto deu|quanto ficou/.test(q)){const count=S(document.getElementById('cartCount')?.textContent||'0'),sub=S(document.getElementById('subtotal')?.textContent||'R$ 0,00'),total=S(document.getElementById('grandTotal')?.textContent||sub);return 'Seu carrinho tem '+count+' item(ns). Produtos: '+sub+'. Total atual: '+total+'.'}
  const budget=budgetLimit(message),products=findProducts(cat,message);
  if(products.length){const intro=budget?'Encontrei estas opções do cardápio até '+money(budget)+':':'Encontrei estas opções no cardápio. Os preços e variações abaixo vêm do catálogo publicado:';return intro+'\n'+products.map(p=>formatProduct(p,true)).join('\n')}
  if(budget)return 'Não encontrei produtos publicados até '+money(budget)+'. Se quiser, me diga outro valor ou um sabor para eu procurar novamente.';
  if(/prepar|aquecer|fritar|forno|microondas/.test(q))return 'As orientações de preparo estão na embalagem do produto. Se você me disser qual item escolheu, procuro as instruções publicadas para ele.';
  if(/cardapio|produto|produtos|vende|tem|recomenda|sugestao|escolher|ajude/.test(q)){const ps=A(cat.produtos).filter(productAvailable).slice(0,5).map(p=>({p,variants:gradeVariants(cat,p),grouped:!!p.gradeId&&gradeVariants(cat,p).length>1,category:categoryName(cat,p)}));return ps.length?'Posso começar por estas opções publicadas no cardápio. Diga o sabor, tamanho ou seu limite de preço para eu filtrar melhor:\n'+ps.map(p=>formatProduct(p,false)).join('\n'):'Não consegui carregar o cardápio agora.'}
  return 'Posso encontrar produtos por nome, sabor, tamanho ou faixa de preço. Também consulto carrinho, entrega, pagamento, pedidos e cupons.';
}
function installJohn(){
  const toggle=document.getElementById('assistant958Toggle'),panel=document.getElementById('assistant958Panel'),messages=document.getElementById('assistant958Messages');
  if(toggle){toggle.setAttribute('aria-label','Fale com John');toggle.title='Fale com John'}const head=panel?.querySelector('.assistant958-head > div');if(head)head.innerHTML='<b id="assistant958Title">John</b><br><small>Assistente do Caseirinho</small>';
  if(messages){messages.innerHTML='';addChat('bot','Olá! Sou o John. Posso encontrar produtos por sabor, tamanho ou preço e ajudar com entrega, pagamento, pedidos ou cupons.')}
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
