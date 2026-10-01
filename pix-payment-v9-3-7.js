(()=>{'use strict';

if(window.__CASEIRINHO_PIX_PAYMENT_937__)return;
window.__CASEIRINHO_PIX_PAYMENT_937__=true;

const CFG=window.CASEIRINHO_CONFIG||{};
const API=String(CFG.apiUrl||'https://john-cloud-api-production.up.railway.app').replace(/\/+$/,'');
const STORE=String(new URLSearchParams(location.search).get('empresa')||new URLSearchParams(location.search).get('loja')||CFG.storeSlug||'caseirinho').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9-]/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'')||'caseirinho';
const PREFIX='john_store_'+STORE+'_';
const ORDERS_KEY=PREFIX+'orders_v1';
const HISTORY_KEY=PREFIX+'customer_history_v1';
const OFFICIAL_KEY='69195483000123';
const S=v=>String(v??'');
const N=v=>Number(v)||0;
const A=v=>Array.isArray(v)?v:[];
const norm=v=>S(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toUpperCase().replace(/[\s-]+/g,'_');
const esc=v=>S(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c]));
const money=v=>N(v).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const CHECKOUT_NOTE_HTML='<b>💠 Pagamento via PIX</b><br>Depois que a loja aceitar seu pedido, o QR Code PIX será liberado em <b>Meus pedidos</b>, já com o valor correto. Chave oficial: <b>69.195.483/0001-23</b>.';

function read(k,f){try{const x=JSON.parse(localStorage.getItem(k)||'null');return x??f}catch(_){return f}}
function orders(){
  const current=read(ORDERS_KEY,[]);
  if(A(current).length)return A(current);
  if(STORE==='caseirinho')return A(read('caseirinho_my_orders_v83',[]));
  return[];
}
function history(){
  const h=read(HISTORY_KEY,{});
  if(S(h?.session).trim())return h;
  if(STORE==='caseirinho')return read('caseirinho_customer_history_v1',{});
  return{};
}
function toast(msg){
  const e=document.getElementById('toast');
  if(e){e.textContent=msg;e.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>e.classList.remove('show'),2600);return}
  alert(msg);
}
function acceptedPix(o){
  const st=norm(o?.status||o?.payload?.status||'');
  return st==='ACEITO'&&/PIX/i.test(S(o?.formaPagamento||o?.payload?.formaPagamento));
}
function codeOf(o){return S(o?.codigo||o?.code||o?.id)}
function findOrderFromCard(card){
  const shown=S(card?.querySelector('.order-top b')?.textContent).trim();
  if(shown){
    const x=orders().find(o=>codeOf(o)===shown||S(o?.id)===shown);
    if(x)return x;
  }
  const key=S(card?.querySelector('[data-copy-pix]')?.getAttribute('data-copy-pix')).replace(/\D/g,'');
  const candidates=orders().filter(acceptedPix);
  if(key){const same=[...candidates].reverse().find(o=>S(o?.pix?.chave).replace(/\D/g,'')===key);if(same)return same}
  return [...candidates].reverse()[0]||null;
}
function latestAcceptedPix(){return [...orders()].reverse().find(acceptedPix)||null}
function credentials(o){
  const h=history();
  return {token:S(o?.publicToken||o?.token).trim()||undefined,historySession:S(h?.session).trim()||undefined};
}
async function requestPix(o){
  if(!o?.id)throw new Error('Pedido não localizado. Atualize Meus pedidos.');
  const auth=credentials(o);
  if(!auth.token&&!auth.historySession)throw new Error('Atualize Meus pedidos para liberar o pagamento seguro deste pedido.');
  const r=await fetch(API+'/api/v1/public/store/'+encodeURIComponent(STORE)+'/orders/'+encodeURIComponent(o.id)+'/pix?_pix='+Date.now(),{
    method:'POST',cache:'no-store',headers:{'Content-Type':'application/json','Cache-Control':'no-cache'},body:JSON.stringify(auth)
  });
  let j={};try{j=await r.json()}catch(_){}
  if(!r.ok)throw new Error(j?.error||('Erro HTTP '+r.status));
  return j.pix;
}
function ensureCss(){
  if(document.getElementById('caseirinhoPix937Style'))return;
  const st=document.createElement('style');st.id='caseirinhoPix937Style';st.textContent=`
  .pix-card[data-pix-937="1"]{border:1px solid #d8c5a0;background:linear-gradient(145deg,#fffdf8,#f8f3e9);border-radius:16px;padding:14px;margin-top:12px}.pix-card[data-pix-937="1"] .pix-pay-actions{display:grid;gap:8px;margin-top:12px}.pix-card[data-pix-937="1"] .pix-pay-primary{border:0;border-radius:12px;padding:12px 14px;background:#0b6b4f;color:#fff;font-weight:900;cursor:pointer}.pix-card[data-pix-937="1"] .pix-pay-note{font-size:12px;color:#5f6368;line-height:1.45;margin-top:8px}.pix-checkout-note{grid-column:1/-1;border:1px solid #b7decf;background:#f2fbf7;color:#174c3c;border-radius:12px;padding:10px 12px;font-size:12px;line-height:1.45}.pix937-overlay{position:fixed;inset:0;z-index:2147483000;background:rgba(12,20,35,.68);display:flex;align-items:center;justify-content:center;padding:16px}.pix937-card{width:min(460px,96vw);max-height:94vh;overflow:auto;background:#fff;border-radius:22px;box-shadow:0 28px 90px rgba(0,0,0,.32);padding:20px}.pix937-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}.pix937-head h2{margin:0;color:#0b6b4f;font-size:24px}.pix937-close{border:0;background:#f1f5f9;border-radius:10px;width:40px;height:40px;font-size:18px;cursor:pointer}.pix937-value{text-align:center;font-size:30px;font-weight:950;color:#172033;margin:10px 0}.pix937-qr{display:block;width:min(320px,80vw);height:auto;margin:8px auto 14px;border:10px solid #fff;border-radius:14px;box-shadow:0 5px 24px rgba(0,0,0,.10)}.pix937-info{border:1px solid #e2e8f0;border-radius:13px;padding:11px 12px;margin:10px 0;font-size:13px;line-height:1.5}.pix937-code{width:100%;min-height:92px;resize:none;border:1px solid #cbd5e1;border-radius:11px;padding:10px;font:11px ui-monospace,SFMono-Regular,Menlo,monospace;word-break:break-all}.pix937-actions{display:grid;gap:9px;margin-top:12px}.pix937-actions button{border:0;border-radius:12px;padding:13px 14px;font-weight:900;cursor:pointer}.pix937-copy{background:#0b6b4f;color:#fff}.pix937-secondary{background:#eef2f7;color:#263238}.pix937-security{font-size:11px;color:#64748b;text-align:center;line-height:1.4;margin-top:10px}`;document.head.appendChild(st);
}
async function copyText(value,msg){
  try{await navigator.clipboard.writeText(value);toast(msg);return}catch(_){}
  const t=document.createElement('textarea');t.value=value;t.style.position='fixed';t.style.opacity='0';document.body.appendChild(t);t.select();try{document.execCommand('copy');toast(msg)}catch(_){toast('Selecione e copie o código manualmente.')}t.remove();
}
function closeModal(){document.getElementById('pix937Overlay')?.remove()}
function showPix(o,pix){
  ensureCss();closeModal();
  const ov=document.createElement('div');ov.id='pix937Overlay';ov.className='pix937-overlay';
  const key=S(pix?.chave||OFFICIAL_KEY);const pretty=key.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,'$1.$2.$3/$4-$5');
  ov.innerHTML=`<div class="pix937-card" role="dialog" aria-modal="true"><div class="pix937-head"><div><small>Pedido ${esc(codeOf(o))}</small><h2>💠 Pagar com PIX</h2></div><button type="button" class="pix937-close" data-pix-close>✕</button></div><div class="pix937-value">${money(pix?.valor)}</div><img class="pix937-qr" src="${esc(pix?.qrCodeDataUrl)}" alt="QR Code PIX do pedido"><div class="pix937-info"><b>Chave PIX oficial:</b> ${esc(pretty)}<br><b>Recebedor:</b> ${esc(pix?.nome||'Caseirinho')}<br><b>TXID:</b> ${esc(pix?.txid||'-')}</div><label><b>PIX copia e cola</b><textarea class="pix937-code" readonly>${esc(pix?.copiaECola||'')}</textarea></label><div class="pix937-actions"><button type="button" class="pix937-copy" data-copy-code>Copiar PIX copia e cola</button><button type="button" class="pix937-secondary" data-copy-key>Copiar somente a chave</button><button type="button" class="pix937-secondary" data-pix-close>Fechar</button></div><div class="pix937-security">O QR Code contém o valor exato deste pedido aceito. Confira o recebedor e o valor no seu banco antes de concluir.</div></div>`;
  document.body.appendChild(ov);
  ov.onclick=e=>{if(e.target===ov||e.target.closest('[data-pix-close]'))closeModal()};
  ov.querySelector('[data-copy-code]').onclick=()=>copyText(S(pix?.copiaECola),'PIX copia e cola copiado.');
  ov.querySelector('[data-copy-key]').onclick=()=>copyText(key,'Chave PIX copiada.');
}
async function generate(button,o){
  if(button.disabled)return;button.disabled=true;const old=button.textContent;button.textContent='Gerando QR Code...';
  try{const pix=await requestPix(o);showPix(o,pix)}catch(e){toast(e.message||'Não foi possível gerar o PIX.')}finally{button.disabled=false;button.textContent=old}
}
function patchPixCards(){
  ensureCss();
  document.querySelectorAll('.pix-card').forEach(card=>{
    if(card.dataset.pix937==='1')return;
    card.dataset.pix937='1';
    const oldTitle=card.querySelector('.pix-title');if(oldTitle&&oldTitle.textContent!=='💠 PIX disponível para pagamento')oldTitle.textContent='💠 PIX disponível para pagamento';
    const actions=document.createElement('div');actions.className='pix-pay-actions';actions.innerHTML=`<button class="pix-pay-primary" type="button" data-generate-pix-937>Gerar QR Code PIX</button><div class="pix-pay-note">Você também poderá copiar o PIX copia e cola. O valor será preenchido automaticamente com o total do pedido.</div>`;card.appendChild(actions);
    actions.querySelector('[data-generate-pix-937]').onclick=()=>generate(actions.querySelector('[data-generate-pix-937]'),findOrderFromCard(card.closest('.order-card'))||latestAcceptedPix());
  });
}
function patchCheckout(){
  const payment=document.getElementById('payment');if(!payment)return;
  let note=document.getElementById('pixCheckoutNote937');
  if(!note){
    note=document.createElement('div');note.id='pixCheckoutNote937';note.className='pix-checkout-note';note.style.display='none';
    payment.closest('label')?.insertAdjacentElement('afterend',note);
  }
  const show=/PIX/i.test(S(payment.value));
  const nextDisplay=show?'block':'none';
  if(note.style.display!==nextDisplay)note.style.display=nextDisplay;
  if(show&&note.dataset.pixContent!=='1'){
    note.innerHTML=CHECKOUT_NOTE_HTML;
    note.dataset.pixContent='1';
  }
  if(!payment.dataset.pix937){payment.dataset.pix937='1';payment.addEventListener('change',patchCheckout,{passive:true})}
}

function init(){patchCheckout();patchPixCards()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,250),{once:true});else setTimeout(init,100);
let scheduled=false;
function schedulePatch(){
  if(scheduled)return;scheduled=true;
  requestAnimationFrame(()=>{scheduled=false;patchCheckout();patchPixCards()});
}
function relevantMutation(records){
  return records.some(r=>[...r.addedNodes].some(n=>n.nodeType===1&&(n.matches?.('#payment,.order-card,.pix-card')||n.querySelector?.('#payment,.order-card,.pix-card'))));
}
const mo=new MutationObserver(records=>{if(relevantMutation(records))schedulePatch()});
try{if(document.body)mo.observe(document.body,{childList:true,subtree:true});else document.addEventListener('DOMContentLoaded',()=>mo.observe(document.body,{childList:true,subtree:true}),{once:true})}catch(_){}
[600,1600,3500,7000].forEach(ms=>setTimeout(init,ms));

window.CaseirinhoPixPayment937={version:'9.3.7',stability:'9.4.1',generateForOrder:async id=>{const o=orders().find(x=>S(x.id)===S(id));const pix=await requestPix(o);showPix(o,pix);return pix}};
})();