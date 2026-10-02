(()=>{'use strict';
if(window.__CASEIRINHO_VARIANT_GROUPING_951__)return;
window.__CASEIRINHO_VARIANT_GROUPING_951__=true;

const S=v=>String(v??'');
const clean=v=>S(v).replace(/\s+/g,' ').trim();
let scheduled=false;

function splitChoice(label){
  const parts=clean(label).split(/\s+·\s+/).map(clean).filter(Boolean);
  if(parts.length<2)return null;
  const flavor=parts.shift();
  const option=parts.join(' · ');
  if(!flavor||!option)return null;
  return{flavor,option};
}
function distinct(values){return new Set(values.map(v=>clean(v).toLocaleLowerCase('pt-BR'))).size}
function cardPanels(){return [...document.querySelectorAll('.card-grade-panel')]}

function groupCard(panel){
  if(!panel||panel.dataset.groupUi951==='done')return;
  const holder=[...panel.children].find(el=>el.classList?.contains('card-grade-options'));
  if(!holder)return;
  const buttons=[...holder.querySelectorAll(':scope > .card-grade-option')];
  if(buttons.length<2)return;
  const rows=buttons.map(button=>{
    const span=button.querySelector('span');
    const parsed=splitChoice(span?.textContent||'');
    return{button,span,parsed};
  });
  if(rows.some(row=>!row.parsed)||distinct(rows.map(row=>row.parsed.flavor))<2)return;

  const groups=new Map();
  rows.forEach(row=>{
    const key=row.parsed.flavor;
    if(!groups.has(key))groups.set(key,[]);
    groups.get(key).push(row);
  });

  const frag=document.createDocumentFragment();
  for(const [flavor,items] of groups){
    const group=document.createElement('div');
    group.className='card-grade-flavor';
    group.dataset.flavor951=flavor;
    const name=document.createElement('div');
    name.className='card-grade-flavor-name';
    name.textContent=flavor;
    const options=document.createElement('div');
    options.className='card-grade-options';
    items.forEach(({button,span,parsed})=>{
      button.dataset.fullLabel951=`${parsed.flavor} · ${parsed.option}`;
      button.dataset.shortLabel951=parsed.option;
      if(span&&clean(span.textContent)!==parsed.option)span.textContent=parsed.option;
      options.appendChild(button);
    });
    group.append(name,options);
    frag.appendChild(group);
  }
  holder.replaceWith(frag);
  panel.dataset.groupUi951='done';
}

function groupModal(){
  const box=document.getElementById('variantBox');
  if(!box)return;
  const holder=box.querySelector('.variant-buttons');
  if(!holder)return;

  if(holder.dataset.groupUi951==='done'){
    holder.querySelectorAll('[data-variant][data-short-label951]').forEach(button=>{
      const span=button.querySelector('span');
      const short=button.dataset.shortLabel951||'';
      if(span&&short&&clean(span.textContent)!==short)span.textContent=short;
    });
    return;
  }

  const buttons=[...holder.querySelectorAll(':scope > [data-variant]')];
  if(buttons.length<2)return;
  const rows=buttons.map(button=>{
    const span=button.querySelector('span');
    const parsed=splitChoice(span?.textContent||'');
    return{button,span,parsed};
  });
  if(rows.some(row=>!row.parsed)||distinct(rows.map(row=>row.parsed.flavor))<2)return;

  const groups=new Map();
  rows.forEach(row=>{
    const key=row.parsed.flavor;
    if(!groups.has(key))groups.set(key,[]);
    groups.get(key).push(row);
  });

  const frag=document.createDocumentFragment();
  for(const [flavor,items] of groups){
    const group=document.createElement('div');
    group.className='modal-flavor-group';
    group.dataset.flavor951=flavor;
    const name=document.createElement('div');
    name.className='modal-flavor-name';
    name.textContent=flavor;
    const options=document.createElement('div');
    options.className='modal-size-options';
    items.forEach(({button,span,parsed})=>{
      button.dataset.fullLabel951=`${parsed.flavor} · ${parsed.option}`;
      button.dataset.shortLabel951=parsed.option;
      if(span&&clean(span.textContent)!==parsed.option)span.textContent=parsed.option;
      options.appendChild(button);
    });
    group.append(name,options);
    frag.appendChild(group);
  }
  holder.classList.add('variant-buttons-smart');
  holder.replaceChildren(frag);
  holder.dataset.groupUi951='done';
}

function run(){
  scheduled=false;
  cardPanels().forEach(groupCard);
  groupModal();
}
function schedule(){
  if(scheduled)return;
  scheduled=true;
  requestAnimationFrame(run);
}
function boot(){
  schedule();
  const roots=[document.getElementById('products'),document.getElementById('featured'),document.getElementById('variantBox')].filter(Boolean);
  roots.forEach(root=>new MutationObserver(schedule).observe(root,{childList:true,subtree:true,characterData:true}));
  document.addEventListener('click',event=>{
    if(event.target.closest?.('[data-view],#variantBox [data-variant],.card-grade-option')){
      setTimeout(schedule,20);
      setTimeout(schedule,100);
    }
  },true);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
