(function(){'use strict';
if(window.__CASEIRINHO_CHECKOUT_PARMESAO_936__)return;
window.__CASEIRINHO_CHECKOUT_PARMESAO_936__=true;

const CFG=window.CASEIRINHO_CONFIG||{};
const S=v=>String(v??'');
const slug=S(new URLSearchParams(location.search).get('empresa')||new URLSearchParams(location.search).get('loja')||CFG.storeSlug||'caseirinho')
  .trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9-]/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'')||'caseirinho';
if(slug!=='caseirinho')return;

const PRICE=4;
const PENDING_KEY='john_store_'+slug+'_pending_order_v1';
const money=v=>(Number(v)||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const E=id=>document.getElementById(id);
let selected=false;
let installed=false;
let updating=false;

function parseMoney(v){
  const s=S(v).replace(/[^0-9,.-]/g,'').replace(/\./g,'').replace(',','.');
  const n=Number(s);return Number.isFinite(n)?n:0;
}
function cartHasItems(){return Number(S(E('cartCount')?.textContent).replace(/\D/g,''))>0||parseMoney(E('subtotal')?.textContent)>0}
function clearPending(){try{localStorage.removeItem(PENDING_KEY)}catch(_){}}
function style(){
  if(E('parmesao936Style'))return;
  const el=document.createElement('style');el.id='parmesao936Style';el.textContent=`
  .parmesao-upsell{margin:14px 0 12px;border:1px solid #e3c9a9;border-radius:16px;background:linear-gradient(135deg,#fffaf0,#fff7e6);padding:14px;box-shadow:0 5px 18px #0000000d}
  .parmesao-upsell-head{display:flex;gap:11px;align-items:flex-start}.parmesao-upsell-icon{font-size:30px;line-height:1}.parmesao-upsell-copy{flex:1;min-width:0}.parmesao-upsell-copy b{display:block;color:#5f421d;font-size:15px}.parmesao-upsell-copy span{display:block;color:#6b5a45;font-size:13px;margin-top:3px}.parmesao-upsell-price{font-size:17px;font-weight:900;color:#7b1438;white-space:nowrap}
  .parmesao-upsell-choice{display:flex;align-items:center;gap:9px;margin-top:12px;padding:10px 11px;border-radius:11px;background:#fff;border:1px solid #ead7dc;cursor:pointer;font-weight:800;color:#4b2530}.parmesao-upsell-choice input{width:20px;height:20px;accent-color:#7b1438}.parmesao-upsell-note{margin-top:7px;font-size:11px;color:#7b6b5e}
  #parmesaoTotalRow{color:#7b1438}#parmesaoTotalRow b{color:#7b1438}
  `;document.head.appendChild(el);
}
function updateTotal(){
  if(updating)return;updating=true;
  try{
    const box=E('parmesaoUpsell936'),row=E('parmesaoTotalRow'),check=E('parmesaoCheck936');
    const has=cartHasItems();
    if(box)box.style.display=has?'block':'none';
    if(!has&&check?.checked){check.checked=false;selected=false}
    if(row)row.style.display=selected&&has?'flex':'none';
    const subtotal=parseMoney(E('subtotal')?.textContent),shipping=parseMoney(E('shipping')?.textContent);
    if(E('grandTotal')&&(subtotal>0||has))E('grandTotal').textContent=money(subtotal+shipping+(selected&&has?PRICE:0));
  }finally{updating=false}
}
function install(){
  if(installed&&E('parmesaoUpsell936')){updateTotal();return true}
  const form=E('checkout'),submit=form?.querySelector('.submit');if(!form||!submit)return false;
  style();
  const box=document.createElement('div');box.id='parmesaoUpsell936';box.className='parmesao-upsell';box.innerHTML=`
    <div class="parmesao-upsell-head">
      <div class="parmesao-upsell-icon">🧀</div>
      <div class="parmesao-upsell-copy"><b>Quer deixar sua massa ainda mais saborosa?</b><span>Adicione Queijo Parmesão Vale ao seu pedido.</span></div>
      <div class="parmesao-upsell-price">+ ${money(PRICE)}</div>
    </div>
    <label class="parmesao-upsell-choice"><input id="parmesaoCheck936" type="checkbox"><span>Sim, adicionar queijo ao meu pedido</span></label>
    <div class="parmesao-upsell-note">Opcional · 1 unidade por pedido.</div>`;
  submit.insertAdjacentElement('beforebegin',box);

  const totals=document.querySelector('.totals'),grand=totals?.querySelector('.grand');
  if(totals&&grand&&!E('parmesaoTotalRow')){
    const row=document.createElement('div');row.id='parmesaoTotalRow';row.style.display='none';row.innerHTML=`<span>Queijo Parmesão Vale</span><b>+ ${money(PRICE)}</b>`;grand.insertAdjacentElement('beforebegin',row);
  }

  E('parmesaoCheck936').addEventListener('change',e=>{
    selected=!!e.target.checked;clearPending();updateTotal();
  });
  installed=true;updateTotal();return true;
}

const nativeFetch=window.fetch.bind(window);
window.fetch=async function(input,init){
  let nextInit=init;
  try{
    const url=typeof input==='string'?input:S(input?.url);
    const method=S(init?.method||input?.method||'GET').toUpperCase();
    const isCreate=method==='POST'&&/\/api\/v1\/public\/store\/caseirinho\/orders(?:\?|$)/.test(url);
    if(isCreate&&selected&&typeof init?.body==='string'){
      const body=JSON.parse(init.body);
      body.checkoutUpsell={...(body.checkoutUpsell||{}),parmesaoVale:true};
      nextInit={...init,body:JSON.stringify(body)};
    }
  }catch(e){console.warn('[Caseirinho 9.3.6] upsell:',e)}
  return nativeFetch(input,nextInit);
};

function observe(){
  const targets=[E('subtotal'),E('shipping'),E('cartCount'),E('navCartCount')].filter(Boolean);
  if(!targets.length)return;
  const o=new MutationObserver(()=>updateTotal());targets.forEach(x=>o.observe(x,{childList:true,subtree:true,characterData:true}));
}

function boot(){install();observe();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
[100,300,700,1500,3000].forEach(ms=>setTimeout(()=>{install();updateTotal()},ms));
window.CaseirinhoParmesaoUpsell936={version:'9.3.6',price:PRICE,install,updateTotal,isSelected:()=>selected};
})();
