(()=>{'use strict';
if(window.__CASEIRINHO_PRODUCT_CARDS_949__)return;
window.__CASEIRINHO_PRODUCT_CARDS_949__=true;

const CFG=window.CASEIRINHO_CONFIG||{};
const API=String(CFG.apiUrl||'').replace(/\/+$/,'');
const STORE=String(new URLSearchParams(location.search).get('empresa')||new URLSearchParams(location.search).get('loja')||CFG.storeSlug||'caseirinho').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9-]/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'')||'caseirinho';
const S=v=>String(v??'');
const N=v=>Number(v)||0;
const A=v=>Array.isArray(v)?v:[];
const norm=v=>S(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toUpperCase().replace(/[\s-]+/g,'_');
const money=v=>N(v).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const clean=v=>S(v).replace(/\s+/g,' ').replace(/^[\s·|/\-–—,:]+|[\s·|/\-–—,:]+$/g,'').trim();
let remoteCatalog={loja:{},produtos:[]};
let catalogLoad=null;
let raf=0;
let observer=null;
let refreshTimer=0;

function catalog(){return remoteCatalog}
async function loadRemoteCatalog(force=false){
  if(!API)return remoteCatalog;
  if(catalogLoad&&!force)return catalogLoad;
  catalogLoad=(async()=>{
    try{
      const url=API+'/api/v1/public/store/'+encodeURIComponent(STORE)+'/catalog?_cards='+Date.now();
      const r=await fetch(url,{cache:'no-store',headers:{'Cache-Control':'no-cache'}});
      if(!r.ok)throw new Error('HTTP '+r.status);
      const data=await r.json();
      if(data&&Array.isArray(data.produtos))remoteCatalog=data;
    }catch(err){
      console.warn('[Caseirinho cards 9.4.9] catálogo auxiliar indisponível',err);
    }finally{
      catalogLoad=null;
    }
    schedule();
    return remoteCatalog;
  })();
  return catalogLoad;
}
function canBuy(p){
  if(typeof p?.podeComprar==='boolean')return p.podeComprar;
  const d=norm(p?.disponibilidadeEfetiva||p?.disponibilidade||'AMBOS');
  return d==='SOB_ENCOMENDA'||d==='AMBOS'||N(p?.saldoDisponivel)>0;
}
function priceOf(p){return N(p?.preco??p?.precoVenda)}
function images(p){const xs=A(p?.imagens).filter(Boolean);return xs.length?xs:(p?.imagem?[p.imagem]:[])}
function productById(id){return A(catalog().produtos).find(p=>S(p?.id)===S(id))||null}
function variantsFor(p){
  if(!p?.gradeId)return[p].filter(Boolean);
  return A(catalog().produtos).filter(x=>S(x?.gradeId)===S(p.gradeId)).sort((a,b)=>N(a?.variacaoOrdem)-N(b?.variacaoOrdem)||S(a?.variacaoLabel||a?.nome).localeCompare(S(b?.variacaoLabel||b?.nome),'pt-BR'));
}
function representativeId(card){return card.querySelector('.product-pic[data-view]')?.dataset.view||card.querySelector('.view-btn[data-view]')?.dataset.view||''}
function gradeTitle(p){
  const g=A(catalog().loja?.grades).find(x=>S(x?.id)===S(p?.gradeId))||{};
  const t=norm(p?.gradeTipoOpcao||g?.tipoOpcao||'TAMANHO');
  return ({TAMANHO:'Tamanho',PESO:'Peso',SABOR:'Sabor',RECHEIO:'Recheio',APRESENTACAO:'Apresentação'})[t]||S(p?.gradeTituloOpcao||g?.tituloOpcao||'Opção');
}
function normalizeMeasure(value){
  const x=clean(value);
  const m=x.match(/^(\d+(?:[.,]\d+)?)\s*(kg|g|ml|l)$/i);
  if(m)return `${m[1].replace('.',',')} ${m[2].toLowerCase()}`;
  const size=x.match(/^(PP|P|M|G|GG)$/i);
  return size?size[1].toUpperCase():'';
}
function measureOf(v){
  const direct=normalizeMeasure(v?.variacaoLabel);
  if(direct)return direct;
  const src=[v?.nomeComercial,v?.nome,v?.descricao].map(S).join(' ');
  const m=src.match(/\b(\d+(?:[.,]\d+)?)\s*(kg|g|ml|l)\b/i);
  return m?normalizeMeasure(m[0]):'';
}
function stripMeasure(value){
  return clean(S(value)
    .replace(/\b\d+(?:[.,]\d+)?\s*(?:kg|g|ml|l)\b/gi,' ')
    .replace(/(?:^|[\s·|/\-–—,(])(?:PP|P|M|G|GG)(?=$|[\s·|/\-–—,)])/gi,' '));
}
function stripBase(value,base){
  let out=clean(value),b=clean(base);
  if(!out||!b)return out;
  const lo=out.toLocaleLowerCase('pt-BR'),lb=b.toLocaleLowerCase('pt-BR');
  if(lo.startsWith(lb))out=clean(out.slice(b.length));
  return out;
}
function flavorFromDescription(value){
  const text=clean(value);
  if(!text)return'';
  let m=text.match(/(?:com\s+)?recheio\s+(?:de|do|da)?\s*([^,.;]+)/i);
  if(m&&clean(m[1]).length>2)return stripMeasure(m[1]);
  m=text.match(/\b(?:sabor|recheado\s+com)\s*[:\-]?\s*([^,.;]+)/i);
  if(m&&clean(m[1]).length>2)return stripMeasure(m[1]);
  return'';
}
function flavorOf(v,p){
  const base=S(v?.gradeNome||p?.gradeNome||'');
  const candidates=[v?.nomeComercial,v?.nome];
  for(const source of candidates){
    let x=stripMeasure(stripBase(source,base));
    x=x.replace(/^(?:de|do|da|com)\s+/i,'').trim();
    if(x&&norm(x)!==norm(base)&&!normalizeMeasure(x)&&x.length<=70)return x;
  }
  return flavorFromDescription(v?.descricao);
}
function optionInfo(v,p){
  const size=measureOf(v);
  const flavor=flavorOf(v,p);
  const raw=clean(v?.variacaoLabel||v?.nome||'Opção');
  return {v,size,flavor,display:clean(flavor&&size?`${flavor} · ${size}`:(flavor||size||raw||'Opção'))};
}
function choiceModel(p,vars){
  const infos=vars.map(v=>optionInfo(v,p));
  const flavors=[...new Set(infos.map(x=>norm(x.flavor)).filter(Boolean))];
  const sizes=[...new Set(infos.map(x=>norm(x.size)).filter(Boolean))];
  const labels=infos.map(x=>norm(x.v?.variacaoLabel)).filter(Boolean);
  const duplicateLabels=labels.length>new Set(labels).size;
  const hasFlavor=flavors.length>1||duplicateLabels&&infos.some(x=>x.flavor);
  const compound=hasFlavor&&sizes.length>1;
  return {
    infos,hasFlavor,compound,
    title:compound?'Sabor e tamanho':hasFlavor?'Sabor':gradeTitle(p),
    icon:compound?'🍽️':hasFlavor?'😋':'📏'
  };
}
function repairImage(card,vars){
  if(card.querySelector('.product-pic img'))return;
  let src='';
  for(const v of vars){src=images(v)[0]||'';if(src)break}
  if(!src)return;
  const pic=card.querySelector('.product-pic');if(!pic)return;
  const img=document.createElement('img');img.src=src;img.alt=card.querySelector('h3')?.textContent||'Produto';img.loading='lazy';
  const old=pic.querySelector('.no-image');if(old)old.replaceWith(img);else pic.prepend(img);
  if(!pic.querySelector('.image-note')){const note=document.createElement('span');note.className='image-note';note.textContent='Imagem meramente ilustrativa';pic.appendChild(note)}
}
function optionButton(info,card,label){
  const v=info.v;
  const b=document.createElement('button');b.type='button';b.className='card-grade-option';b.dataset.productId=S(v.id);b.disabled=!canBuy(v);
  const name=document.createElement('span');name.textContent=label||info.display;
  const price=document.createElement('strong');price.textContent=money(priceOf(v));
  b.append(name,price);
  b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();setSelected(card,v.id)});
  return b;
}
function buildOptions(panel,model,card){
  if(model.compound){
    const groups=new Map();
    model.infos.forEach(info=>{
      const key=info.flavor||'Outras opções';
      if(!groups.has(key))groups.set(key,[]);
      groups.get(key).push(info);
    });
    for(const [flavor,items] of groups){
      const group=document.createElement('div');group.className='card-grade-flavor';
      const name=document.createElement('div');name.className='card-grade-flavor-name';name.textContent=flavor;
      const opts=document.createElement('div');opts.className='card-grade-options';
      items.forEach(info=>opts.appendChild(optionButton(info,card,info.size||info.display)));
      group.append(name,opts);panel.appendChild(group);
    }
    return;
  }
  const options=document.createElement('div');options.className='card-grade-options';
  model.infos.forEach(info=>options.appendChild(optionButton(info,card,info.display)));
  panel.appendChild(options);
}
function setSelected(card,id){
  const p=productById(id);if(!p)return;
  card.dataset.selectedProductId=S(id);
  card.querySelectorAll('.card-grade-option').forEach(b=>b.classList.toggle('active',S(b.dataset.productId)===S(id)));
  const price=card.querySelector('.price');if(price)price.textContent=money(priceOf(p));
  const add=card.querySelector('.card-add-selected');
  if(add){
    add.dataset.productId=S(id);
    add.disabled=!canBuy(p)||catalog().loja?.ativo===false;
    add.textContent=add.disabled?'Indisponível':'+ Adicionar ao carrinho';
  }
}
function enhanceModal(id){
  const p=productById(id);if(!p)return;
  const vars=variantsFor(p);if(vars.length<2)return;
  const model=choiceModel(p,vars),box=document.getElementById('variantBox');
  if(!box)return;
  const title=box.querySelector('.variant-title');
  if(title)title.textContent=`${model.icon} Escolha ${model.title.toLowerCase()}`;
  const holder=box.querySelector('.variant-buttons');
  if(!holder)return;
  const buttons=new Map([...holder.querySelectorAll('[data-variant]')].map(b=>[S(b.dataset.variant),b]));
  if(model.compound){
    const groups=new Map();
    model.infos.forEach(info=>{
      const key=info.flavor||'Outras opções';
      if(!groups.has(key))groups.set(key,[]);
      groups.get(key).push(info);
    });
    const frag=document.createDocumentFragment();
    for(const [flavor,items] of groups){
      const group=document.createElement('div');group.className='modal-flavor-group';
      const name=document.createElement('div');name.className='modal-flavor-name';name.textContent=flavor;
      const opts=document.createElement('div');opts.className='modal-size-options';
      items.forEach(info=>{
        const b=buttons.get(S(info.v.id));if(!b)return;
        const span=b.querySelector('span');if(span)span.textContent=info.size||info.display;
        opts.appendChild(b);
      });
      group.append(name,opts);frag.appendChild(group);
    }
    holder.classList.add('variant-buttons-smart');
    holder.replaceChildren(frag);
  }else{
    model.infos.forEach(info=>{const b=buttons.get(S(info.v.id));const span=b?.querySelector('span');if(span)span.textContent=info.display});
  }
}
function addSelectedThroughExistingFlow(card,id){
  const trigger=card.querySelector('.view-btn[data-view]')||card.querySelector('.product-pic[data-view]');
  if(!trigger)return;
  trigger.click();
  setTimeout(()=>{
    enhanceModal(id);
    const variant=[...document.querySelectorAll('#variantBox [data-variant]')].find(b=>S(b.dataset.variant)===S(id));
    if(variant&&!variant.disabled)variant.click();
    setTimeout(()=>{
      const add=document.getElementById('modalAdd');
      if(add&&!add.disabled){add.click();document.getElementById('productClose')?.click()}
    },50);
  },50);
}
function enhanceCard(card){
  if(!card||card.dataset.cardUi949==='done'||card.dataset.cardUi949==='working')return false;
  const id=representativeId(card);if(!id)return false;
  const p=productById(id);if(!p)return false;
  const vars=variantsFor(p);if(!vars.length)return false;

  card.dataset.cardUi949='working';
  try{
    repairImage(card,vars);
    const body=card.querySelector('.product-body'),actions=card.querySelector('.actions');
    if(!body||!actions){card.dataset.cardUi949='done';return true}

    const title=body.querySelector('h3');
    if(title&&vars.length>1)title.textContent=S(p.gradeNome||p.nome)||title.textContent;

    if(vars.length===1){
      const existingAdd=actions.querySelector('.add-btn');
      if(existingAdd&&existingAdd.textContent.trim()==='+ Carrinho')existingAdd.textContent='+ Adicionar ao carrinho';
      card.dataset.cardUi949='done';
      return true;
    }

    body.querySelector('.variant-summary')?.remove();
    const model=choiceModel(p,vars);
    const panel=document.createElement('div');panel.className='card-grade-panel';
    const heading=document.createElement('div');heading.className='card-grade-title';heading.textContent=`${model.icon} Escolha ${model.title.toLowerCase()} e veja o valor`;
    panel.appendChild(heading);
    buildOptions(panel,model,card);
    const availability=body.querySelector('.availability');if(availability)availability.before(panel);else actions.before(panel);

    let add=actions.querySelector('.card-add-selected');
    if(!add){
      add=document.createElement('button');add.type='button';add.className='add-btn card-add-selected';add.textContent='+ Adicionar ao carrinho';
      add.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();const selected=card.dataset.selectedProductId||add.dataset.productId;if(selected)addSelectedThroughExistingFlow(card,selected)});
      actions.appendChild(add);
    }

    const preferred=vars.find(v=>S(v.id)===S(p.id)&&canBuy(v))||vars.find(canBuy)||vars[0];
    setSelected(card,preferred.id);
    card.dataset.cardUi949='done';
    return true;
  }catch(err){
    console.warn('[Caseirinho cards 9.4.9]',err);
    delete card.dataset.cardUi949;
    return false;
  }
}
function enhanceAll(){
  raf=0;
  if(!A(catalog().produtos).length)return;
  document.querySelectorAll('#products>.product-card,#featured>.product-card').forEach(enhanceCard);
}
function schedule(){if(raf)return;raf=requestAnimationFrame(enhanceAll)}
function refreshCatalogSoon(){
  clearTimeout(refreshTimer);
  refreshTimer=setTimeout(()=>loadRemoteCatalog(true),120);
}
function wireModalLabels(){
  document.addEventListener('click',e=>{
    const t=e.target.closest?.('[data-view],[data-variant]');
    if(!t)return;
    const id=t.dataset.view||t.dataset.variant;
    if(id)setTimeout(()=>enhanceModal(id),0);
  });
}
function boot(){
  const roots=[document.getElementById('products'),document.getElementById('featured')].filter(Boolean);
  observer=new MutationObserver(mutations=>{
    if(mutations.some(m=>m.addedNodes.length||m.removedNodes.length)){
      schedule();
      if(!A(catalog().produtos).length)refreshCatalogSoon();
    }
  });
  roots.forEach(r=>observer.observe(r,{childList:true}));
  wireModalLabels();
  loadRemoteCatalog();
  schedule();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
window.CaseirinhoProductCards949={version:'9.4.9-smart-variants',enhanceAll,enhanceModal,loadRemoteCatalog,choiceModel};
})();