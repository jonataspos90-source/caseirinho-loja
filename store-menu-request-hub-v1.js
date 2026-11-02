(function(){'use strict';
if(window.__CASEIRINHO_MENU_REQUEST_HUB__)return;window.__CASEIRINHO_MENU_REQUEST_HUB__=true;
const store='caseirinho',api=String(window.CASEIRINHO_CONFIG?.apiUrl||'https://john-cloud-api-production.up.railway.app').replace(/\/+$/,'');
const KEY='john_store_'+store+'_customer_profile_v1';
function profile(){try{return JSON.parse(localStorage.getItem(KEY)||'{}')||{}}catch(_){return{}}}
function phone(v){const x=String(v||'').replace(/[^0-9]/g,'');return x.length===13&&x.startsWith('55')?x.slice(2):x;}
function alertText(text,ok){
 let box=document.getElementById('caseirinhoMenuRequestResult');
 if(!box){box=document.createElement('div');box.id='caseirinhoMenuRequestResult';box.setAttribute('role','status');box.style.cssText='position:fixed;bottom:95px;right:15px;z-index:10001;max-width:320px;padding:15px 18px;border-radius:15px;color:#fff;background:#6a273a;box-shadow:0 10px 30px #0003;font-size:13px;';document.body.appendChild(box);}
 box.style.background=ok?'#1c7541':'#6a273a';box.textContent=text;box.hidden=false;setTimeout(()=>box.hidden=true,6000);
}
let busy=false;
async function requestMenu(){
 if(busy)return;
 const p=profile(),name=String(p.nome||'').trim(),number=phone(p.telefone);
 if(name.length<2||!/^[1-9][0-9]{9,10}$/.test(number)){alertText('Informe ou confirme seu nome e WhatsApp na entrada da loja para solicitar o cardápio.',false);document.getElementById('identityName')?.focus();return;}
 busy=true;const b=document.getElementById('caseirinhoMenuRequestHub');
 if(b){b.disabled=true;b.textContent='Enviando solicitação…';}
 try{
  const r=await fetch(api+'/api/v1/public/store/'+store+'/menu/request',{method:'POST',cache:'no-store',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,phone:number})});
  let data={};try{data=await r.json()}catch(_){}
  if(!r.ok)throw Error(String(data.error||'Não foi possível avisar o Caseirinho.').slice(0,180));
  alertText(data.alreadyRequested?'Seu pedido de cardápio já está na fila. 💚':'💚 Prontinho! O Caseirinho recebeu seu pedido de cardápio e poderá responder pelo WhatsApp.',true);
 }catch(e){alertText(e.message||'Não foi possível enviar a solicitação.',false);}
 finally{busy=false;if(b){b.disabled=false;b.textContent='📋 Pedir cardápio pelo WhatsApp';}}
}
function init(){
 const mount=document.querySelector('.party-actions')||document.querySelector('.hero-actions')||document.querySelector('#catalogSection .section-head');
 if(!mount)return;
 if(document.getElementById('caseirinhoMenuRequestHub'))return;
 const b=document.createElement('button');b.type='button';b.id='caseirinhoMenuRequestHub';b.textContent='📋 Pedir cardápio pelo WhatsApp';
 b.style.cssText='display:inline-flex;align-items:center;justify-content:center;padding:12px 15px;background:#f6ecd1;color:#6c2638;border:2px solid #d8ba81;border-radius:14px;font-weight:850;max-width:100%;line-height:1.3;min-height:48px;';
 b.addEventListener('click',requestMenu);
 mount.appendChild(b);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();