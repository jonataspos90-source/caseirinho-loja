(function(){'use strict';if(window.__CASEIRINHO_ANALYTICS127__)return;window.__CASEIRINHO_ANALYTICS127__=true;
const cfg=window.CASEIRINHO_CONFIG||{},api=String(cfg.apiUrl||'https://john-cloud-api-production.up.railway.app').replace(/\/+$/,'');
const store='caseirinho',prefix='john_store_'+store+'_';
const devKey=prefix+'analytics_device_id_v1',visitKey=prefix+'analytics_visit_id_v2',lastKey=prefix+'analytics_last_active_at_v2',sessionKey=prefix+'analytics_session_id_v1';
const uuid=()=>crypto.randomUUID?.()||('v'+Date.now().toString(36)+Math.random().toString(36).slice(2));
function read(storage,k){try{return storage.getItem(k)||''}catch(_){return''}}
function write(storage,k,v){try{storage.setItem(k,String(v))}catch(_){}}
function device(){
 let id=read(localStorage,devKey);
 if(!/^store-[a-zA-Z0-9-]{8,100}$/.test(id)){
 const keys=[prefix+'usage_client_v1',prefix+'usage_client_v87','john_store_usage_client_v87','john_store_usage_client_v1'];
 id=keys.map(k=>read(localStorage,k)).find(x=>/^store-[a-zA-Z0-9-]{8,100}$/.test(x))||'store-'+uuid();write(localStorage,devKey,id);}
 return id;
}
function visit(){return read(localStorage,visitKey)}
function session(){let s=read(sessionStorage,sessionKey);if(!s){s=uuid();write(sessionStorage,sessionKey,s)}return s;}
function standalone(){return !!(window.matchMedia?.('(display-mode: standalone)').matches||navigator.standalone===true);}
async function send(event,extra){
 try{
 const r=await fetch(api+'/api/v1/public/store/'+store+'/analytics/event',{method:'POST',cache:'no-store',keepalive:true,headers:{'Content-Type':'application/json'},body:JSON.stringify(Object.assign({event,clientId:device(),sessionId:session(),visitId:visit(),standalone:standalone(),appVersion:'store-v9.10'},extra||{}))});
 return r.ok;
 }catch(_){return false}
}
async function ping(){
 if(document.hidden)return;
 write(localStorage,lastKey,Date.now());
 try{await fetch(api+'/api/v1/public/store/'+store+'/usage/ping',{method:'POST',cache:'no-store',keepalive:true,headers:{'Content-Type':'application/json'},body:JSON.stringify({clientId:device(),standalone:standalone(),appVersion:'STORE:analytics-v127'})});}catch(_){}
}
function open(){
 if(document.hidden)return;
 const now=Date.now(),last=Number(read(localStorage,lastKey)||0);
 if(!visit()||now-last>30*60*1000||now<last){write(localStorage,visitKey,uuid());send('STORE_OPEN');}
 ping();
 if(standalone()&&read(sessionStorage,prefix+'standalone_sent')!=='1'){write(sessionStorage,prefix+'standalone_sent','1');send('PWA_STANDALONE_LAUNCH');}
}
async function identified(e){
 const d=e.detail||{},name=String(d.name||'').trim(),phone=String(d.phone||'').replace(/[^0-9]/g,'');
 if(!d.consent||name.length<2||phone.length<10)return;
 open();
 const k=prefix+'identified_'+visit();
 if(read(sessionStorage,k)===phone)return;
 if(await send('IDENTIFIED',{name,phone,consent:true}))write(sessionStorage,k,phone);
}
function init(){
 open();
 window.addEventListener('caseirinho:customer-identified',identified);
 window.addEventListener('appinstalled',()=>{send('PWA_INSTALLED');ping();});
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)open()});
 setInterval(ping,120000);
}
window.CaseirinhoStoreAnalytics127={send,device,visit};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();