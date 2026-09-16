(()=>{'use strict';
if(window.__CASEIRINHO_STORE_HOTFIX_931__)return;window.__CASEIRINHO_STORE_HOTFIX_931__=true;
const VERSION='9.3.1';
const CFG=window.CASEIRINHO_CONFIG||{};
const API=String(CFG.apiUrl||'https://john-cloud-api-production.up.railway.app').replace(/\/+$/,'');
const qs=new URLSearchParams(location.search);
const STORE=String(qs.get('empresa')||qs.get('loja')||CFG.storeSlug||'caseirinho').trim().toLowerCase()||'caseirinho';
function clientId(){const k='caseirinho_store_usage_client_v931';let id='';try{id=localStorage.getItem(k)||''}catch(_){}if(!id){id='store-'+(crypto.randomUUID?.()||Date.now().toString(36)+'-'+Math.random().toString(36).slice(2));try{localStorage.setItem(k,id)}catch(_){}}return id}
function standalone(){return !!(window.matchMedia?.('(display-mode: standalone)').matches||window.navigator.standalone===true)}
async function heartbeat(){try{await fetch(API+'/api/v1/public/store/'+encodeURIComponent(STORE)+'/usage/ping',{method:'POST',cache:'no-store',headers:{'Content-Type':'application/json','Cache-Control':'no-cache'},body:JSON.stringify({clientId:clientId(),standalone:standalone(),appVersion:'LOJA:'+VERSION})});return true}catch(_){return false}}
function isIllustrative(src=''){const s=String(src||'');if(/^data:image\/svg\+xml/i.test(s))return true;try{const d=decodeURIComponent(s);return /imagem\s+padr[aã]o\s+do\s+cat[aá]logo|imagem\s+meramente\s+ilustrativa/i.test(d)}catch(_){return false}}
function patchImageNotes(root=document){root.querySelectorAll?.('.image-note').forEach(note=>{const host=note.parentElement||note.closest('article,div');const img=host?.querySelector?.('img');if(!img)return;const src=img.getAttribute('src')||img.currentSrc||img.src||'';const fallback=isIllustrative(src);note.style.display=fallback?'':'none';note.setAttribute('aria-hidden',fallback?'false':'true')})}
function observe(){patchImageNotes();const target=document.querySelector('main')||document.body;if(!target)return;const mo=new MutationObserver(ms=>{for(const m of ms)for(const n of m.addedNodes)if(n.nodeType===1)patchImageNotes(n)});mo.observe(target,{subtree:true,childList:true});setInterval(()=>patchImageNotes(),5000)}
function init(){heartbeat();observe();setInterval(heartbeat,120000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)heartbeat()});window.addEventListener('online',heartbeat)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else setTimeout(init,100);
window.CaseirinhoStoreHotfix931={heartbeat,patchImageNotes,version:VERSION};
})();