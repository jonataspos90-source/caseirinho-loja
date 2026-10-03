(()=>{
'use strict';

const VERSION='9.6.6';
let deferredPrompt=null;

const isIos=()=>/iphone|ipad|ipod/i.test(navigator.userAgent||'') || (navigator.platform==='MacIntel' && navigator.maxTouchPoints>1);
const isSafari=()=>{
  const ua=navigator.userAgent||'';
  return /safari/i.test(ua) && !/crios|fxios|edgios|opios|mercury/i.test(ua);
};
const isStandalone=()=>window.matchMedia?.('(display-mode: standalone)').matches || navigator.standalone===true;

function style(){
  if(document.getElementById('caseirinhoPwaInstallStyle'))return;
  const el=document.createElement('style');
  el.id='caseirinhoPwaInstallStyle';
  el.textContent=`
    #installAppBtn{display:none;align-items:center;justify-content:center;gap:7px;min-height:44px}
    #installAppBtn.is-visible{display:inline-flex}
    .pwa-install-overlay{position:fixed;inset:0;z-index:10050;background:rgba(20,9,12,.58);display:flex;align-items:flex-end;justify-content:center;padding:18px;padding-bottom:max(18px,env(safe-area-inset-bottom));backdrop-filter:blur(3px)}
    .pwa-install-card{width:min(100%,480px);background:#fffaf6;border-radius:24px;padding:22px;box-shadow:0 24px 70px rgba(0,0,0,.28);color:#2f2024}
    .pwa-install-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}
    .pwa-install-head h2{margin:0;font-size:1.35rem;line-height:1.2;color:#65122e}
    .pwa-install-head p{margin:7px 0 0;color:#6d5a60;line-height:1.45}
    .pwa-install-close{border:0;background:#f2e7e3;color:#5b2636;border-radius:999px;width:42px;height:42px;font-size:22px;cursor:pointer;flex:0 0 auto}
    .pwa-install-icon{width:72px;height:72px;border-radius:18px;display:block;margin:18px 0 14px;box-shadow:0 8px 24px rgba(90,20,50,.16)}
    .pwa-install-steps{display:grid;gap:11px;margin:12px 0 0;padding:0;list-style:none;counter-reset:pwaStep}
    .pwa-install-steps li{counter-increment:pwaStep;display:grid;grid-template-columns:34px 1fr;gap:10px;align-items:start;background:#fff;border:1px solid #eadbd5;border-radius:14px;padding:12px;line-height:1.42}
    .pwa-install-steps li:before{content:counter(pwaStep);width:30px;height:30px;border-radius:50%;display:grid;place-items:center;background:#7b1438;color:#fff;font-weight:800}
    .pwa-install-note{margin-top:14px;padding:11px 12px;border-radius:12px;background:#f7ece8;color:#654953;font-size:.92rem;line-height:1.4}
    .pwa-install-ok{width:100%;margin-top:16px;min-height:46px;border:0;border-radius:14px;background:#7b1438;color:white;font-weight:800;font-size:1rem;cursor:pointer}
    @media(min-width:700px){.pwa-install-overlay{align-items:center}.pwa-install-card{padding:26px}}
    @media(display-mode:standalone){#installAppBtn{display:none!important}}
  `;
  document.head.appendChild(el);
}

function closeGuide(){
  document.getElementById('pwaInstallOverlay')?.remove();
}

function iosGuide(){
  closeGuide();
  const safari=isSafari();
  const overlay=document.createElement('div');
  overlay.className='pwa-install-overlay';
  overlay.id='pwaInstallOverlay';
  overlay.setAttribute('role','dialog');
  overlay.setAttribute('aria-modal','true');
  overlay.setAttribute('aria-labelledby','pwaInstallTitle');
  overlay.innerHTML=`
    <div class="pwa-install-card">
      <div class="pwa-install-head">
        <div>
          <h2 id="pwaInstallTitle">📲 Instalar o Caseirinho</h2>
          <p>Coloque a loja na Tela de Início do iPhone e abra como um aplicativo.</p>
        </div>
        <button class="pwa-install-close" type="button" aria-label="Fechar">×</button>
      </div>
      <img class="pwa-install-icon" src="./icons/apple-touch-icon.png" alt="Ícone do Caseirinho">
      ${safari?`
        <ol class="pwa-install-steps">
          <li><span>Toque em <b>Compartilhar</b> <span aria-hidden="true">□↑</span> na barra do Safari.</span></li>
          <li><span>Role as opções e toque em <b>Adicionar à Tela de Início</b>.</span></li>
          <li><span>Confirme em <b>Adicionar</b>. O Caseirinho aparecerá junto aos seus apps.</span></li>
        </ol>
        <div class="pwa-install-note">Depois de instalado, ele abre em tela cheia, sem a barra normal do navegador.</div>
      `:`
        <ol class="pwa-install-steps">
          <li><span>Abra esta loja no <b>Safari</b> do iPhone.</span></li>
          <li><span>No Safari, toque em <b>Compartilhar</b> <span aria-hidden="true">□↑</span>.</span></li>
          <li><span>Escolha <b>Adicionar à Tela de Início</b> e confirme em <b>Adicionar</b>.</span></li>
        </ol>
        <div class="pwa-install-note">No iPhone, a instalação é concluída pelo menu de compartilhamento do Safari.</div>
      `}
      <button class="pwa-install-ok" type="button">Entendi</button>
    </div>`;
  document.body.appendChild(overlay);
  overlay.querySelector('.pwa-install-close')?.addEventListener('click',closeGuide,{once:true});
  overlay.querySelector('.pwa-install-ok')?.addEventListener('click',closeGuide,{once:true});
  overlay.addEventListener('click',e=>{if(e.target===overlay)closeGuide()});
  setTimeout(()=>overlay.querySelector('.pwa-install-close')?.focus(),0);
}

async function install(){
  if(isStandalone())return;
  if(isIos()){
    iosGuide();
    return;
  }
  if(deferredPrompt){
    const prompt=deferredPrompt;
    deferredPrompt=null;
    await prompt.prompt();
    try{await prompt.userChoice}catch(_){}
    refreshButton();
    return;
  }
  const title='Instalar o Caseirinho';
  const body='<p>Use o menu do navegador e escolha <b>Instalar app</b> ou <b>Adicionar à tela inicial</b>.</p>';
  if(typeof window.openSimple==='function')window.openSimple(title,body);
  else alert('Use o menu do navegador e escolha “Instalar app” ou “Adicionar à tela inicial”.');
}

function ensureButton(){
  if(document.getElementById('installAppBtn'))return document.getElementById('installAppBtn');
  const actions=document.querySelector('.hero-actions');
  if(!actions)return null;
  const btn=document.createElement('button');
  btn.className='glass';
  btn.id='installAppBtn';
  btn.type='button';
  btn.innerHTML='<span aria-hidden="true">📲</span> Instalar App';
  btn.addEventListener('click',install);
  actions.appendChild(btn);
  return btn;
}

function refreshButton(){
  const btn=ensureButton();
  if(!btn)return;
  const eligible=!isStandalone() && (isIos() || !!deferredPrompt);
  btn.classList.toggle('is-visible',eligible);
  btn.setAttribute('aria-hidden',eligible?'false':'true');
}

function start(){
  style();
  refreshButton();
  window.addEventListener('beforeinstallprompt',event=>{
    event.preventDefault();
    deferredPrompt=event;
    refreshButton();
  });
  window.addEventListener('appinstalled',()=>{
    deferredPrompt=null;
    refreshButton();
    closeGuide();
  });
  window.matchMedia?.('(display-mode: standalone)').addEventListener?.('change',refreshButton);
}

window.CASEIRINHO_PWA_INSTALL={version:VERSION,isIos,isStandalone,showGuide:iosGuide};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
