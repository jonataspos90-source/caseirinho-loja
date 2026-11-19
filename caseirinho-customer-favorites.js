/* Favoritos por cliente identificado. Não altera pedidos, checkout ou preços. */
(()=>{
'use strict';
const get=id=>document.getElementById(id);
const scope='john_store_'+(window.CASEIRINHO_CONFIG?.storeSlug||'caseirinho')+'_';
const profile=()=>{try{return JSON.parse(localStorage.getItem(scope+'customer_profile_v1')||'{}')}catch{return{}}};
const storageKey=()=>{const phone=String(profile().telefone||'').replace(/\D/g,'').slice(-11);return phone?scope+'favorites_'+phone:''};
const saved=()=>{const k=storageKey();if(!k)return[];try{const a=JSON.parse(localStorage.getItem(k)||'[]');return Array.isArray(a)?a.map(String):[]}catch{return[]}};
const catalog=()=>window.CaseirinhoCurrentPublicCatalog?.()?.produtos||[];
function mount(){
 const root=get('catalogSection')?.querySelector('.wrap');if(!root||get('caseirinhoFavorites'))return;
 const section=document.createElement('section');section.id='caseirinhoFavorites';section.className='caseirinho-favorites';
 section.innerHTML='<div class="caseirinho-favorites-head"><div><h3>♡ Meus favoritos</h3><p>Guarde seus preferidos para encontrar rapidamente.</p></div><button type="button" id="favToggle" aria-expanded="false">Mostrar favoritos</button></div><div id="favList" hidden></div>';
 root.insertBefore(section,get('categories'));
 get('favToggle').addEventListener('click',()=>{
  const list=get('favList');list.hidden=!list.hidden;get('favToggle').textContent=list.hidden?'Mostrar favoritos':'Ocultar favoritos';
  get('favToggle').setAttribute('aria-expanded',String(!list.hidden));if(!list.hidden)render();
 });
}
function decorate(){
 const ids=new Set(saved());
 for(const container of ['products','featured']){
  const root=get(container);if(!root)continue;
  root.querySelectorAll('.product-card').forEach(card=>{
   const id=card.querySelector('[data-view]')?.dataset.view;
   if(!id||!catalog().some(p=>String(p.id)===String(id)))return;
   let b=card.querySelector('.caseirinho-fav-heart');
   if(!b){b=document.createElement('button');b.type='button';b.className='caseirinho-fav-heart';b.dataset.favId=id;card.append(b)}
   const liked=ids.has(String(id));b.textContent=liked?'♥':'♡';
   b.setAttribute('aria-pressed',String(liked));b.setAttribute('aria-label',liked?'Remover dos favoritos':'Adicionar aos favoritos');
  });
 }
}
function render(){
 const list=get('favList');if(!list||list.hidden)return;
 list.replaceChildren();
 const products=saved().map(id=>catalog().find(p=>String(p.id)===id)).filter(Boolean);
 if(!products.length){list.textContent='Toque no coração dos produtos para guardar seus favoritos.';return}
 for(const p of products){
  const b=document.createElement('button');b.type='button';b.className='caseirinho-fav-item';b.dataset.favOpen=String(p.id);
  b.textContent=String(p.nomeComercial||p.nome||'Produto');list.append(b);
 }
}
function start(){
 mount();
 document.addEventListener('click',e=>{
  const heart=e.target.closest?.('[data-fav-id]');
  if(heart){
   e.preventDefault();e.stopPropagation();
   const k=storageKey();if(!k)return alert('Identifique-se com seu WhatsApp para usar favoritos.');
   const id=String(heart.dataset.favId),old=saved(),next=old.includes(id)?old.filter(x=>x!==id):[...old,id];
   try{localStorage.setItem(k,JSON.stringify(next.slice(0,80)))}catch{}
   decorate();render();return;
  }
  const b=e.target.closest?.('[data-fav-open]');
  if(b){
   const id=b.dataset.favOpen;
   const found=[...document.querySelectorAll('#products [data-view],#featured [data-view]')].find(x=>x.dataset.view===id);
   if(found)found.click();
   else{get('search').value=catalog().find(p=>String(p.id)===id)?.nome||'';get('search').dispatchEvent(new Event('input',{bubbles:true}))}
  }
 });
 for(const name of ['products','featured']){
  const el=get(name);if(el)new MutationObserver(()=>{decorate();render()}).observe(el,{childList:true});
 }
 window.addEventListener('caseirinho:customer-identified',()=>{decorate();render()});
 decorate();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();