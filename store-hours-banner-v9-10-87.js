/* Caseirinho | Faixa de atendimento que respeita o expediente salvo na Central. */
(function(){
'use strict';
if(window.CaseirinhoHoursBanner)return;
const TZ='America/Sao_Paulo';
const s=x=>String(x??''),esc=x=>s(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
const DAY=['Domingo','Segunda-feira','Terça-feira','Quarta-feira','Quinta-feira','Sexta-feira','Sábado'];
const toMin=s=>Number(s.slice(0,2))*60+Number(s.slice(3,5));
function local(now){
 const p=Object.fromEntries(new Intl.DateTimeFormat('en-GB',{timeZone:TZ,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(now).map(x=>[x.type,x.value]));
 return{date:p.year+'-'+p.month+'-'+p.day,minute:Number(p.hour)*60+Number(p.minute)};
}
function shift(date,days){
 const day=new Date(date+'T12:00:00Z');day.setUTCDate(day.getUTCDate()+days);
 return day.toISOString().slice(0,10);
}
function dayOf(date){return new Date(date+'T12:00:00Z').getUTCDay()}
function dayPlan(schedule,date){
 return(schedule.excecoes||[]).find(x=>x.data===date)||
 (schedule.dias||[]).find(x=>Number(x.dia)===dayOf(date))||{ativo:false,periodos:[]};
}
function fmtDate(date,today){
 if(date===today)return'hoje';
 if(date===shift(today,1))return'amanhã';
 return new Intl.DateTimeFormat('pt-BR',{timeZone:'UTC',weekday:'long',day:'2-digit',month:'2-digit'}).format(new Date(date+'T12:00:00Z'));
}
function structuredStatus(schedule,now){
 if(!Array.isArray(schedule?.dias)||schedule.dias.length!==7)return null;
 const clock=local(now),today=dayPlan(schedule,clock.date),slots=today.ativo?today.periodos||[]:[];
 const active=slots.find(p=>clock.minute>=toMin(p.inicio)&&clock.minute<toMin(p.fim));
 if(active)return{closed:false,until:active.fim,structured:true};
 for(let days=0;days<=45;days++){
  const date=shift(clock.date,days),day=dayPlan(schedule,date);
  if(!day.ativo)continue;
  const next=(day.periodos||[]).find(p=>days>0||clock.minute<toMin(p.inicio));
  if(next)return{closed:true,nextOpening:fmtDate(date,clock.date)+' às '+next.inicio,
   nextOpeningDate:date,nextOpeningTime:next.inicio,message:s(schedule.mensagemFechado),structured:true};
 }
 return{closed:true,nextOpening:'em breve',message:s(schedule.mensagemFechado),structured:true};
}
// Mantém a compatibilidade enquanto o administrador não salvar uma agenda semanal.
function legacyStatus(raw,now){
 const times=[...s(raw).matchAll(/([01]?\d|2[0-3]):([0-5]\d)/g)].map(m=>m[1].padStart(2,'0')+':'+m[2]);
 if(times.length<2||times[0]>=times[1])return null;
 const v=s(raw).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 let days;
 if(/seg\s*(?:a|ate|-)\s*sex/.test(v))days=[1,2,3,4,5];
 else if(/seg\s*(?:a|ate|-)\s*sab/.test(v))days=[1,2,3,4,5,6];
 else if(/todos os dias|diariamente|seg\s*(?:a|ate|-)\s*dom/.test(v))days=[0,1,2,3,4,5,6];
 else return null;
 return structuredStatus({dias:DAY.map((_,dia)=>({dia,ativo:days.includes(dia),
 periodos:days.includes(dia)?[{inicio:times[0],fim:times[1]}]:[]})),excecoes:[]},now);
}
function getStatus(store,now=new Date()){
 const structured=structuredStatus(store?.horariosSemana,now);
 return structured||legacyStatus(store?.horarioFuncionamento,now);
}
function weeklyText(store){
 const schedule=store?.horariosSemana;
 if(!Array.isArray(schedule?.dias)||schedule.dias.length!==7)return s(store?.horarioFuncionamento||'Horários disponíveis em nosso atendimento.');
 return [...schedule.dias].sort((a,b)=>a.dia-b.dia).map(d=>
  '<div class="caseirinho-hours-day"><span>'+esc(DAY[d.dia])+'</span><strong>'+
  (d.ativo?(d.periodos||[]).map(p=>esc(p.inicio)+'–'+esc(p.fim)).join(' / '):'Fechado')+
  '</strong></div>'
 ).join('')+
 (schedule.excecoes?.length?'<small>Datas especiais podem alterar o expediente acima. Consulte a confirmação do pedido.</small>':'');
}
let currentStore=null,root=null;
function ensure(){
 if(root||!document.querySelector('header.top'))return root;
 root=document.createElement('section');
 root.id='storeHoursBanner';root.className='caseirinho-hours-banner';root.hidden=true;
 root.setAttribute('aria-live','polite');
 root.innerHTML='<div class="wrap caseirinho-hours-shell">'+
  '<div class="caseirinho-hours-text"><strong id="storeHoursHeadline"></strong><p id="storeHoursSubtext"></p><small id="storeHoursExtra" hidden></small></div>'+
  '<div class="caseirinho-hours-actions"><a class="caseirinho-hours-shop" href="#catalogSection">🍝 Continuar comprando</a>'+
  '<details class="caseirinho-hours-detail"><summary>📆 Ver horários</summary><div id="storeHoursWeek" class="caseirinho-hours-week"></div></details></div>'+
  '</div>';
 document.querySelector('header.top').insertAdjacentElement('afterend',root);
 return root;
}
function refresh(store=currentStore){
 if(store)currentStore=store;
 if(!currentStore)return;
 const el=ensure();if(!el)return;
 const state=getStatus(currentStore),paused=currentStore.ativo===false;
 el.hidden=!state?.closed&&!paused;
 if(el.hidden)return;
 document.getElementById('storeHoursHeadline').textContent=paused?
  '⏸️ Loja temporariamente pausada para novos pedidos':
  '🌙 Atendimento fechado no momento — pedidos continuam abertos!';
 document.getElementById('storeHoursSubtext').textContent=paused?
  'Os pedidos estão temporariamente indisponíveis. Consulte nossos horários e acompanhe a reabertura.':
  'Pode escolher seus produtos e finalizar normalmente. Próximo atendimento: '+state.nextOpening+'. A equipe confirmará o pedido e o horário de retirada/entrega quando reabrir.';
 const shop=el.querySelector('.caseirinho-hours-shop');
 if(shop)shop.hidden=paused;
 const extra=document.getElementById('storeHoursExtra');
 extra.hidden=paused||!state?.message;extra.textContent=paused?'':state.message||'';
 document.getElementById('storeHoursWeek').innerHTML=weeklyText(currentStore);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>refresh(),{once:true});
setInterval(()=>{if(!document.hidden)refresh()},60000);
window.CaseirinhoHoursBanner={version:'9.10.87',getStatus,refresh,structuredStatus,legacyStatus,weeklyText};
})();
