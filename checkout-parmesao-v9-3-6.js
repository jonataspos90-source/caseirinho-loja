(function(){'use strict';
if(window.__CASEIRINHO_CHECKOUT_PARMESAO_936__)return;
window.__CASEIRINHO_CHECKOUT_PARMESAO_936__=true;

const CFG=window.CASEIRINHO_CONFIG||{};
const S=v=>String(v??'');
const slug=S(new URLSearchParams(location.search).get('empresa')||new URLSearchParams(location.search).get('loja')||CFG.storeSlug||'caseirinho')
  .trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9-]/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'')||'caseirinho';
if(slug!=='caseirinho')return;

const PRICE=4;
const PRODUCT_ID='ADDON_PARMESAO_VALE';
const PRODUCT_NAME='Queijo Parmesão Vale';
const PENDING_KEY='john_store_'+slug+'_pending_order_v1';
const money=v=>(Number(v)||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const E=id=>document.getElementById(id);
const round2=v=>Math.round(((Number(v)||0)+Number.EPSILON)*100)/100;
let selected=false;
let installed=false;
let updating=false;
let observer=null;

function parseMoney(v){
  const s=S(v).replace(/\s/g,'').replace(/R\$/gi,'').replace(/\./g,'').replace(',','.').replace(/[^0-9.-]/g,'');
  const n=Number(s);return Number.isFinite(n)?n:0;
}
function cartHasItems(){return Number(S(E('cartCount')?.textContent).replace(/\D/g,''))>0||parseMoney(E('subtotal')?.textContent)>0}
function clearPending(){try{localStorage.removeItem(PENDING_KEY)}catch(_){}}
function mode(){return S(E('mode')?.value).toUpperCase()}
function addonAmount(){return selected&&cartHasItems()?PRICE:0}
function visibleDiscountTotal(){
  const totals=document.querySelector('.totals');if(!totals)return 0;
  return round2([...totals.children].reduce((sum,row)=>{
    if(!row||row.hidden||row.id==='parmesaoTotalRow'||row.classList?.contains('grand'))return sum;
    const value=row.querySelector?.('b');if(!value)return sum;
    const raw=S(value.textContent).trim();
    const known=['coupon958DiscountRow','cashback960DiscountRow'].includes(S(row.id));
    if(!known&&!/^\s*-/.test(raw))return sum;
    return sum+Math.abs(parseMoney(raw));
  },0));
}
function totalState(){
  const products=parseMoney(E('subtotal')?.textContent);
  const addon=addonAmount();
  const discounts=visibleDiscountTotal();
  const shippingText=S(E('shipping')?.textContent).trim();
  const delivery=mode()==='ENTREGA';
  const pending=delivery&&(/cotar|confirmar|calcular|pendente/i.test(shippingText)||!/[0-9]/.test(shippingText));
  const freight=delivery&&!pending?parseMoney(shippingText):0;
  const productsAfter=Math.max(0,round2(products+addon-discounts));
  return {products,addon,discounts,delivery,pending,freight,total:round2(productsAfter+freight),productsAfter,shippingText};
}
function style(){
  if(E('parmesao936Style'))return;
  const el=document.createElement('style');el.id='parmesao936Style';el.textContent=`
  .parmesao-upsell{margin:14px 0 12px;border:1px solid #e3c9a9;border-radius:16px;background:linear-gradient(135deg,#fffaf0,#fff7e6);padding:14px;box-shadow:0 5px 18px #0000000d}
  .parmesao-upsell-head{display:flex;gap:11px;align-items:flex-start}.parmesao-upsell-icon{font-size:30px;line-height:1}.parmesao-upsell-copy{flex:1;min-width:0}.parmesao-upsell-copy b{display:block;color:#5f421d;font-size:15px}.parmesao-upsell-copy span{display:block;color:#6b5a45;font-size:13px;margin-top:3px}.parmesao-upsell-price{font-size:17px;font-weight:900;color:#7b1438;white-space:nowrap}
  .parmesao-upsell-choice{display:flex;align-items:center;gap:9px;margin-top:12px;padding:10px 11px;border-radius:11px;background:#fff;border:1px solid #ead7dc;cursor:pointer;font-weight:800;color:#4b2530}.parmesao-upsell-choice input{width:20px;height:20px;accent-color:#7b1438}.parmesao-upsell-note{margin-top:7px;font-size:11px;color:#7b6b5e}
  #parmesaoTotalRow{color:#7b1438}#parmesaoTotalRow b{color:#7b1438}
  .parmesao-confirm-row{color:#7b1438;font-weight:850}.parmesao-unified-summary{margin-top:12px;border:1px solid #e2e8f0;border-radius:14px;overflow:hidden;background:#fff}.parmesao-unified-summary>div{display:flex;justify-content:space-between;gap:12px;padding:10px 12px;border-bottom:1px solid #e2e8f0}.parmesao-unified-summary>div:last-child{border-bottom:0}.parmesao-unified-summary .addon{color:#7b1438;font-weight:850}.parmesao-unified-summary .total{font-weight:950;font-size:16px;background:#f8fafc}
  `;document.head.appendChild(el);
}
function syncMainTotal(){
  const has=cartHasItems(),box=E('parmesaoUpsell936'),row=E('parmesaoTotalRow'),check=E('parmesaoCheck936');
  if(box)box.style.display=has?'block':'none';
  if(!has&&check?.checked){check.checked=false;selected=false}
  if(row)row.style.display=selected&&has?'flex':'none';
  const st=totalState(),grand=E('grandTotal');
  if(grand&&(st.products>0||has)){
    const value=st.pending?money(st.productsAfter)+' + frete':money(st.total);
    if(grand.textContent!==value)grand.textContent=value;
  }
}
function patchDeliveryConfirm(){
  const ov=E('deliveryMotoConfirm954');if(!ov?.classList?.contains('open'))return;
  const sub=E('dm954ConfirmSub'),discounts=E('dm954ConfirmDiscounts'),fee=E('dm954ConfirmFee'),total=E('dm954ConfirmTotal');
  if(!sub||!total)return;
  const st=totalState();
  sub.textContent=money(st.products);
  let row=E('parmesaoConfirmRow936');
  if(!row&&discounts){
    row=document.createElement('div');row.id='parmesaoConfirmRow936';row.className='dm954-row parmesao-confirm-row';
    row.innerHTML=`<span>${PRODUCT_NAME}</span><b>+ ${money(PRICE)}</b>`;
    discounts.parentNode?.insertBefore(row,discounts);
  }
  if(row)row.style.display=st.addon>0?'flex':'none';
  if(fee)fee.textContent=st.delivery?(st.pending?'A confirmar':money(st.freight)):money(0);
  total.textContent=st.pending?money(st.productsAfter)+' + entrega':money(st.total);
}
function patchCustomerDeliveryDialog(){
  const ov=E('customerExperienceOverlay'),title=E('customerExperienceTitle'),body=E('customerExperienceBody');
  if(!ov?.classList?.contains('open')||!body||S(title?.textContent).trim()!=='Confirme sua entrega')return;
  const st=totalState();
  const sig=[st.products,st.addon,st.discounts,st.freight,st.pending,st.total].join('|');
  let box=E('parmesaoUnifiedDelivery936');
  if(!box){box=document.createElement('div');box.id='parmesaoUnifiedDelivery936';box.className='parmesao-unified-summary';body.appendChild(box)}
  if(box.dataset.sig===sig)return;
  box.dataset.sig=sig;
  box.innerHTML=`
    <div><span>Produtos</span><b>${money(st.products)}</b></div>
    ${st.addon>0?`<div class="addon"><span>${PRODUCT_NAME}</span><b>+ ${money(st.addon)}</b></div>`:''}
    ${st.discounts>0?`<div><span>Descontos / cashback</span><b>- ${money(st.discounts)}</b></div>`:''}
    <div><span>Entrega</span><b>${st.pending?'A confirmar':money(st.freight)}</b></div>
    <div class="total"><span>Total</span><b>${st.pending?money(st.productsAfter)+' + entrega':money(st.total)}</b></div>`;
}
function syncAll(){
  if(updating)return;updating=true;
  try{syncMainTotal();patchDeliveryConfirm();patchCustomerDeliveryDialog()}
  finally{updating=false}
}
function install(){
  if(installed&&E('parmesaoUpsell936')){syncAll();return true}
  const form=E('checkout'),submit=form?.querySelector('.submit');if(!form||!submit)return false;
  style();
  const box=document.createElement('div');box.id='parmesaoUpsell936';box.className='parmesao-upsell';box.innerHTML=`
    <div class="parmesao-upsell-head">
      <div class="parmesao-upsell-icon">🧀</div>
      <div class="parmesao-upsell-copy"><b>Quer deixar sua massa ainda mais saborosa?</b><span>Adicione ${PRODUCT_NAME} ao seu pedido.</span></div>
      <div class="parmesao-upsell-price">+ ${money(PRICE)}</div>
    </div>
    <label class="parmesao-upsell-choice"><input id="parmesaoCheck936" type="checkbox"><span>Sim, adicionar queijo ao meu pedido</span></label>
    <div class="parmesao-upsell-note">Opcional · 1 unidade por pedido.</div>`;
  submit.insertAdjacentElement('beforebegin',box);

  const totals=document.querySelector('.totals'),grand=totals?.querySelector('.grand');
  if(totals&&grand&&!E('parmesaoTotalRow')){
    const row=document.createElement('div');row.id='parmesaoTotalRow';row.style.display='none';row.innerHTML=`<span>${PRODUCT_NAME}</span><b>+ ${money(PRICE)}</b>`;grand.insertAdjacentElement('beforebegin',row);
  }

  E('parmesaoCheck936').addEventListener('change',e=>{
    selected=!!e.target.checked;clearPending();syncAll();
  });
  installed=true;syncAll();return true;
}

const nativeFetch=window.fetch.bind(window);
window.fetch=async function(input,init){
  let nextInit=init,isCreate=false,withParmesao=false;
  try{
    const url=typeof input==='string'?input:S(input?.url);
    const method=S(init?.method||input?.method||'GET').toUpperCase();
    isCreate=method==='POST'&&/\/api\/v1\/public\/store\/caseirinho\/orders(?:\?|$)/.test(url);
    withParmesao=isCreate&&selected&&cartHasItems();
    if(withParmesao&&typeof init?.body==='string'){
      const body=JSON.parse(init.body);
      body.checkoutUpsell={...(body.checkoutUpsell||{}),parmesaoVale:true};
      nextInit={...init,body:JSON.stringify(body)};
    }
  }catch(e){console.warn('[Caseirinho 9.6.8] upsell request:',e)}

  const response=await nativeFetch(input,nextInit);
  if(!withParmesao||!response?.ok)return response;
  try{
    const data=await response.clone().json();
    if(!data||typeof data!=='object')return response;
    const extras=Array.isArray(data.adicionaisEcommerce)?data.adicionaisEcommerce.filter(x=>S(x?.produtoId)!==PRODUCT_ID):[];
    data.adicionaisEcommerce=[...extras,{produtoId:PRODUCT_ID,codigo:'PARMVALE',nome:PRODUCT_NAME,quantidade:1,precoUnitario:PRICE,total:PRICE,origem:'CHECKOUT_UPSELL'}];
    const headers=new Headers(response.headers);headers.delete('content-length');headers.set('content-type','application/json; charset=utf-8');
    return new Response(JSON.stringify(data),{status:response.status,statusText:response.statusText,headers});
  }catch(e){console.warn('[Caseirinho 9.6.8] upsell response:',e);return response}
};

function observe(){
  if(observer||!document.body)return;
  observer=new MutationObserver(()=>queueMicrotask(syncAll));
  observer.observe(document.body,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['class','style','hidden']});
}
function boot(){install();observe();syncAll()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
[100,300,700,1500,3000].forEach(ms=>setTimeout(()=>{install();syncAll()},ms));
window.CaseirinhoParmesaoUpsell936={version:'9.6.8',price:PRICE,productId:PRODUCT_ID,install,updateTotal:syncAll,isSelected:()=>selected,amount:addonAmount,totalState};
})();