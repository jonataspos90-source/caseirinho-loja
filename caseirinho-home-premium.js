/* Vitrine única: campanha de encomendas tem prioridade; sem campanha, vitrine dinâmica. */
(()=>{'use strict';
const ready=()=>{
 const hero=document.querySelector('.hero-party');
 const original=hero?.querySelector('.party-banner');
 const seasonal=document.getElementById('seasonalBanner');
 if(!hero||!original||!seasonal||document.getElementById('caseirinhoSlideNavigation'))return;
 const slides=[original];
 const data=[
  {k:'sabores',className:'',eyebrow:'🍝 Caseirinho · feito com carinho',heading:'O sabor caseiro <span>que conquista</span>',text:'Massas artesanais e pratos especiais preparados com carinho. Escolha seus favoritos no cardápio.',cta:'Explorar o cardápio',emoji:'🍝'},
  {k:'ocasioes',className:'alt',eyebrow:'🎉 Para compartilhar',heading:'Mais sabor <span>em cada ocasião</span>',text:'Empadas, panquecas e delícias para reunir família e amigos. Monte seu pedido com facilidade.',cta:'Escolher minhas delícias',emoji:'🥟'}
 ];
 const clean=(node)=>{while(node.firstChild)node.removeChild(node.firstChild)};
 data.forEach((d,i)=>{
  const card=document.createElement('div');card.className='wrap party-banner caseirinho-new-slide '+d.className;card.dataset.slide=d.k;
  card.innerHTML='<div class="party-visual" aria-hidden="true"><span class="caseirinho-visual-fallback">'+d.emoji+'</span></div><div class="party-copy"><span class="party-pill">'+d.eyebrow+'</span><h2>'+d.heading+'</h2><p>'+d.text+'</p><a class="caseirinho-slide-cta" href="#catalogSection">'+d.cta+' ↓</a></div>';
  original.after(card);slides.push(card);
 });
 const nav=document.createElement('div');nav.id='caseirinhoSlideNavigation';nav.className='caseirinho-slide-nav wrap';nav.setAttribute('aria-label','Selecionar promoção');
 slides.forEach((_,i)=>{const b=document.createElement('button');b.type='button';b.setAttribute('aria-label','Mostrar destaque '+(i+1));b.addEventListener('click',()=>{select(i);restart()});nav.appendChild(b)});
 original.parentNode.insertBefore(nav,hero.querySelector('#catalogStatusLine'));
 let current=0,timer=null;
 const campaignActive=()=>!seasonal.hidden && getComputedStyle(seasonal).display!=='none';
 const syncCampaign=()=>{
  const active=campaignActive();
  document.body.classList.toggle('caseirinho-seasonal-active',active);
  nav.hidden=active;
  if(active){slides.forEach(s=>s.classList.add('caseirinho-inactive-slide'))}
  else select(current);
 };
 const select=(index)=>{
  current=index;
  slides.forEach((s,i)=>{s.classList.toggle('caseirinho-inactive-slide',i!==current);s.classList.toggle('caseirinho-active-slide',i===current);s.setAttribute('aria-hidden',i!==current?'true':'false')});
  Array.from(nav.children).forEach((b,i)=>b.setAttribute('aria-current',String(i===current)));
 };
 const restart=()=>{if(timer)clearInterval(timer);timer=setInterval(()=>{if(!document.hidden&&!campaignActive()&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches)select((current+1)%slides.length)},6500)};
 function useCatalogImages(){
  const images=Array.from(document.querySelectorAll('#featured img, #products img')).filter(img=>img.getAttribute('src')&&!img.getAttribute('src').startsWith('data:'));
  [1,2].forEach((idx)=>{
   const img=images[(idx-1)*3]||images[idx-1];
   const visual=slides[idx].querySelector('.party-visual');
   if(!img||visual.querySelector('img'))return;
   const copy=document.createElement('img');copy.src=img.currentSrc||img.src;copy.alt='';copy.loading='lazy';copy.decoding='async';copy.onerror=()=>copy.remove();visual.appendChild(copy);
   const fallback=visual.querySelector('.caseirinho-visual-fallback');if(fallback)fallback.style.display='none';
  });
 }
 const observer=new MutationObserver(syncCampaign);
 observer.observe(seasonal,{attributes:true,attributeFilter:['hidden','style','class']});
 const featured=document.getElementById('featured');if(featured){const productObserver=new MutationObserver(useCatalogImages);productObserver.observe(featured,{childList:true,subtree:true})}
 select(0);syncCampaign();restart();useCatalogImages();
};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready,{once:true});else ready();
})();
