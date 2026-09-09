(function(){
'use strict';
if(window.__CASE_STOREFRONT_STABILITY_8102__)return;
window.__CASE_STOREFRONT_STABILITY_8102__=true;
const S=v=>String(v??''),A=v=>Array.isArray(v)?v:[];
const ORDER_KEY='caseirinho_my_orders_v83';
const PENDING_KEY='caseirinho_pending_order_v861';
const nativeFetch=window.fetch.bind(window);
const inFlight=new Map();
function cloud(){const c=window.JOHN_CLOUD||{};return{api:S(c.apiUrl||'https://john-cloud-api-production.up.railway.app').replace(/\/+$/,''),store:S(c.storeSlug||'caseirinho')||'caseirinho'}}
function read(){try{return A(JSON.parse(localStorage.getItem(ORDER_KEY)||'[]'))}catch(_){return[]}}
function save(list){try{localStorage.setItem(ORDER_KEY,JSON.stringify(A(list).slice(-100)))}catch(_){}}
function phone(v){let d=S(v).replace(/\D/g,'');if(d.startsWith('55')&&d.length>=12)d=d.slice(2);return d}
function mergeOrder(resp,req){
  if(!resp||typeof resp!=='object')return;
  const id=S(resp.id||req?.id);const code=S(resp.codigo||resp.code||req?.codigo);
  if(!id&&!code)return;
  const list=read();
  const o={...(req||{}),...resp,cliente:resp.cliente||req?.cliente,itens:resp.itens||req?.itens||[],publicToken:resp.publicToken||resp.public_token||req?.publicToken,savedAt:new Date().toISOString()};
  const i=list.findIndex(x=>(id&&S(x.id)===id)||(code&&S(x.codigo||x.code)===code));
  if(i>=0)list[i]={...list[i],...o};else list.push(o);
  save(list);window.__caseLastOrder=o;
}
function orderPost(req){try{const u=new URL(req.url,location.href);return req.method==='POST'&&/\/api\/v1\/public\/store\/[^/]+\/orders$/.test(u.pathname)}catch(_){return false}}
function safeGet(req){if(req.method!=='GET')return false;try{const u=new URL(req.url,location.href);return /\/api\/v1\/public\/store\/[^/]+(?:\/catalog|\/orders\/[^/]+)$/.test(u.pathname)}catch(_){return false}}
window.fetch=async function(input,init){
  let req;try{req=new Request(input,init)}catch(_){return nativeFetch(input,init)}
  let requestJson=null;
  if(orderPost(req)){try{requestJson=await req.clone().json()}catch(_){}}
  if(safeGet(req)){
    const u=new URL(req.url,location.href);u.searchParams.delete('_ts');const key=req.method+' '+u.toString();let p=inFlight.get(key);
    if(!p){p=nativeFetch(req).finally(()=>inFlight.delete(key));inFlight.set(key,p)}
    const r=await p;return r.clone();
  }
  const r=await nativeFetch(req);
  if(orderPost(req)&&r.ok){try{mergeOrder(await r.clone().json(),requestJson||{})}catch(_){}}
  return r;
};
async function recover(body){
  const c=cloud();const r=await nativeFetch(c.api+'/api/v1/public/store/'+encodeURIComponent(c.store)+'/orders/recover?_ts='+Date.now(),{method:'POST',cache:'no-store',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  let d={};try{d=await r.json()}catch(_){}
  if(!r.ok)throw new Error(d.error||'Não foi possível recuperar o pedido.');
  mergeOrder(d,{cliente:{telefone:body.telefone},clientRequestId:body.clientRequestId});
  return d;
}
async function recoverPending(){
  let p=null;try{p=JSON.parse(localStorage.getItem(PENDING_KEY)||'null')}catch(_){}
  const req=p?.req,telefone=S(req?.cliente?.telefone),clientRequestId=S(req?.clientRequestId);
  if(phone(telefone).length<10||!clientRequestId)return;
  try{await recover({telefone,clientRequestId});localStorage.removeItem(PENDING_KEY)}catch(_){ }
}
function injectRecovery(){
  const body=document.getElementById('caseV83Body');const overlay=document.getElementById('caseV83Overlay');
  if(!body||!overlay?.classList.contains('open')||document.getElementById('caseRecovery8102'))return;
  const title=S(document.getElementById('caseV83Title')?.textContent);if(!/Meus pedidos/i.test(title))return;
  const box=document.createElement('div');box.id='caseRecovery8102';box.style.cssText='margin:14px 0;padding:14px;border:1px solid #eadde2;border-radius:16px;background:#fffaf7';
  box.innerHTML='<b>Não encontrou um pedido?</b><div style="font-size:12px;color:#76636b;margin:5px 0 10px">Recupere com o mesmo WhatsApp usado no pedido e o código WEB recebido na confirmação.</div><div style="display:grid;grid-template-columns:1fr 1fr auto;gap:8px"><input id="caseRecPhone8102" inputmode="tel" placeholder="WhatsApp" style="min-width:0;border:1px solid #eadde2;border-radius:11px;padding:10px"><input id="caseRecCode8102" placeholder="WEB-..." style="min-width:0;border:1px solid #eadde2;border-radius:11px;padding:10px"><button id="caseRecBtn8102" type="button" style="border:0;border-radius:11px;padding:10px 12px;background:#711735;color:white;font-weight:800">Recuperar</button></div><div id="caseRecMsg8102" style="font-size:12px;margin-top:8px"></div>';
  body.prepend(box);
  const b=document.getElementById('caseRecBtn8102');b.onclick=async()=>{const msg=document.getElementById('caseRecMsg8102');const telefone=S(document.getElementById('caseRecPhone8102')?.value),codigo=S(document.getElementById('caseRecCode8102')?.value).trim();if(phone(telefone).length<10||!codigo){msg.textContent='Informe o WhatsApp e o código WEB do pedido.';return}b.disabled=true;msg.textContent='Consultando...';try{await recover({telefone,codigo});msg.textContent='Pedido recuperado. Atualizando a lista...';setTimeout(()=>document.getElementById('caseV83Orders')?.click(),150)}catch(e){msg.textContent=S(e.message)}finally{b.disabled=false}};
}
document.addEventListener('click',ev=>{if(ev.target?.closest?.('#caseV83Orders,[id="caseLastOrders"]'))setTimeout(injectRecovery,80)},true);
const mo=new MutationObserver(()=>{if(document.getElementById('caseV83Overlay')?.classList.contains('open'))injectRecovery()});
if(document.documentElement)mo.observe(document.documentElement,{childList:true,subtree:true});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{setTimeout(recoverPending,500);setTimeout(injectRecovery,900)},{once:true});else{setTimeout(recoverPending,300);setTimeout(injectRecovery,700)}
window.addEventListener('online',()=>setTimeout(recoverPending,300));
console.info('[Caseirinho Loja] estabilidade V8.10.2 ativa');
})();
