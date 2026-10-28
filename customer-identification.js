(function(){'use strict';
  if(window.__CASEIRINHO_CUSTOMER_IDENTIFICATION__)return;
  window.__CASEIRINHO_CUSTOMER_IDENTIFICATION__=true;
  const CFG=window.CASEIRINHO_CONFIG||{};
  const params=new URLSearchParams(location.search);
  const store=String(params.get('empresa')||params.get('loja')||CFG.storeSlug||'caseirinho').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9-]/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'')||'caseirinho';
  const api=String(CFG.apiUrl||'https://john-cloud-api-production.up.railway.app').replace(/\/+$/,'');
  const profileKey='john_store_'+store+'_customer_profile_v1';
  const E=id=>document.getElementById(id);
  function readProfile(){try{return JSON.parse(localStorage.getItem(profileKey)||'{}')||{}}catch(_){return{}}}
  function phoneDigits(value){let p=String(value||'').replace(/\D/g,'');if(p.startsWith('55')&&p.length>=12)p=p.slice(2);return p}
  function validPhone(value){const p=phoneDigits(value);return /^[1-9]\d9\d{8}$/.test(p)&&! /^(\d)\1+$/.test(p)}
  function formatPhone(value){const p=phoneDigits(value);if(p.length===11)return '('+p.slice(0,2)+') '+p.slice(2,7)+'-'+p.slice(7);if(p.length===10)return '('+p.slice(0,2)+') '+p.slice(2,6)+'-'+p.slice(6);return p}
  let busy=false;
  async function submit(event){
    event.preventDefault();if(busy)return;
    const name=E('identityName').value.trim().replace(/\s+/g,' ');
    const phone=phoneDigits(E('identityPhone').value);
    const status=E('identityStatus'),button=E('identityContinue');
    status.textContent='';
    if(name.length<2||name.length>160||! /\p{L}/u.test(name)){status.textContent='Informe seu nome com pelo menos 2 letras.';E('identityName').focus();return}
    if(!validPhone(phone)){status.textContent='Informe um WhatsApp válido com DDD. Exemplo: (11) 99999-9999.';E('identityPhone').focus();return}
    if(!E('identityConsent').checked){status.textContent='Aceite a Política de Privacidade para salvar seus dados e continuar.';E('identityConsent').focus();return}
    const saved=readProfile();
    const old=phoneDigits(saved.telefone)===phone?saved:{};
    // Reuse the existing pre-registration flow without dropping saved checkout data.
    const cliente={nome:name,telefone:phone,email:String(old.email||''),cpf:String(old.cpf||'')};
    const lgpd={consent:true,consentAt:new Date().toISOString(),policyVersion:'1.0',purpose:'Identificação, cadastro, atendimento e processamento de pedidos no Caseirinho.'};
    const controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(),15000);
    busy=true;button.disabled=true;button.textContent='Salvando seus dados…';
    let serverMessage='';
    try{
      const response=await fetch(api+'/api/v1/public/store/'+encodeURIComponent(store)+'/customers/pre-register',{
        method:'POST',cache:'no-store',headers:{'Content-Type':'application/json'},signal:controller.signal,
        body:JSON.stringify({cliente,endereco:old.entrega||{},lgpd})
      });
      const result=await response.json();
      if(!response.ok||result?.ok!==true||!result.id){serverMessage=response.status>=400&&response.status<500?String(result.error||'Confira os dados informados e tente novamente.'):'';throw new Error('Não foi possível salvar seus dados.')}
      const profile={...old,...cliente,updatedAt:new Date().toISOString()};
      try{localStorage.setItem(profileKey,JSON.stringify(profile))}catch(_){}
      if(phoneDigits(saved.telefone)!==phone){
        for(const id of ['cEmail','cCpf','cep','number','street','district','city','uf','comp'])if(E(id))E(id).value='';
      }
      if(E('cName'))E('cName').value=name;
      if(E('cPhone'))E('cPhone').value=formatPhone(phone);
      // Keep cart identification in sync, including carts restored from earlier visits.
      window.CaseirinhoEngagement961?.sendSnapshot?.(true);
      document.body.classList.remove('customer-identification-required');
      E('customerIdentityGate').hidden=true;
      window.dispatchEvent(new Event('resize'));
      E('homeBtn')?.focus();
    }catch(_){
      status.textContent=serverMessage||'Não conseguimos salvar agora. Verifique sua conexão e toque em Entrar no cardápio para tentar novamente.';
    }finally{clearTimeout(timer);busy=false;button.disabled=false;button.textContent='Entrar no cardápio'}
  }
  function install(){
    const form=E('customerIdentityForm');if(!form)return;
    const p=readProfile();E('identityName').value=String(p.nome||'');E('identityPhone').value=formatPhone(p.telefone||'');
    E('identityPhone').addEventListener('blur',()=>{E('identityPhone').value=formatPhone(E('identityPhone').value)});
    form.addEventListener('submit',submit);
    E('identityName').focus();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
