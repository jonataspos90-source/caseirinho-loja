/* Vitrine de encomendas: categorias, grades e kits com escolha dos sabores. */
'use strict';
const B=window.CaseirinhoSeasonalBridge;
const {S,N,A,esc,money,roundMoney,cartCatalogProducts,promoApi,selectedSeasonalCampaign,seasonalCampaign,E,quickAdd,modeChanged,renderSeasonalCheckout,toast}=B;
let seasonStoreCategory='',seasonStoreCampaign='',seasonStoreVariants=new Map();
const seasonCurrent=()=>seasonalCampaign(B.getSelectedCampaignId());
function seasonalMerchFilterCategory(p,grades){
 return S(p.categoryId||grades.find(g=>g.id===p.gradeId)?.categoryId||'');
}
function seasonalGradeMarkup(grade,variants,open){
 const current=variants.find(p=>p.id===seasonStoreVariants.get(grade.id))||variants[0];
 seasonStoreVariants.set(grade.id,current.id);
 const photo=current.image||grade.image||variants.find(x=>x.image)?.image||'';
 return '<article class="seasonal-item seasonal-grade" data-season-grade="'+esc(grade.id)+'">'+
 (photo?'<img class="seasonal-grade-photo" src="'+esc(photo)+'" alt="'+esc(grade.name)+'" loading="lazy">':'')+
 '<div class="seasonal-item-content"><h3>'+esc(grade.name)+'</h3>'+
 '<p class="seasonal-muted">'+esc(grade.description||'Escolha o sabor ou o tamanho desejado')+'</p>'+
 '<div class="seasonal-variant-options">'+variants.map(p=>
 '<button type="button" class="'+(current.id===p.id?'active':'')+'" data-season-variant="'+esc(p.id)+'" data-grade="'+esc(grade.id)+'">'+
 esc(p.variantLabel||p.name)+'<small>'+money(p.price)+'</small></button>').join('')+'</div>'+
 '<p class="seasonal-variant-description">'+esc(current.description||'Preparado sob encomenda')+'</p>'+
 '<span class="seasonal-price">'+money(current.price)+'</span><br>'+
 '<small>Mínimo: '+N(current.minQuantity)+(N(current.maxQuantity)>0?' · Máximo: '+N(current.maxQuantity):'')+'</small>'+
 '<button type="button" data-season-add="'+esc(current.id)+'" '+(!open?'disabled':'')+'>🎁 Adicionar '+esc(current.variantLabel||current.name)+'</button></div></article>';
}
function seasonalPackMarkup(pack,campaign,open){
 const products=A(campaign.products).filter(p=>A(pack.productIds).includes(p.id));
 if(!products.length)return '';
 const photo=pack.image||products.find(x=>x.image)?.image||'';
 return '<article class="seasonal-pack-card" data-season-pack="'+esc(pack.id)+'">'+
 (photo?'<img class="seasonal-pack-photo" src="'+esc(photo)+'" alt="'+esc(pack.name)+'" loading="lazy">':'')+
 '<div class="seasonal-pack-body"><span class="seasonal-pack-flag">🎁 PACK ESPECIAL</span><h3>'+esc(pack.name)+'</h3>'+
 '<p class="seasonal-pack-desc">'+esc(pack.description||'Monte o kit combinando seus sabores favoritos')+'</p>'+
 '<div class="seasonal-pack-price">'+money(pack.price)+'</div>'+
 '<small>Escolha '+N(pack.quantity)+' unidades. O desconto do kit é aplicado quando a composição estiver completa.</small>'+
 '<div class="seasonal-pack-builder">'+products.map(p=>
  '<div><label>'+esc(p.variantLabel||p.name)+'<small>Avulso: '+money(p.price)+'</small></label>'+
  '<input type="number" min="0" max="'+N(pack.quantity)+'" step="1" value="0" data-season-pack-qty="'+esc(p.id)+'" '+
  (!open?'disabled':'')+' aria-label="Quantidade '+esc(p.name)+'"></div>').join('')+'</div>'+
 '<p class="seasonal-pack-progress" data-season-pack-progress>0 de '+pack.quantity+' unidades selecionadas</p>'+
 '<button type="button" class="seasonal-pack-action" data-season-pack-add="'+esc(pack.id)+'" disabled>🎁 Adicionar kit à encomenda</button></div></article>';
}
function seasonStoreMerchRender(){
 const c=seasonCurrent(),root=E('seasonalProducts');
 if(!c||!root)return;
 if(seasonStoreCampaign!==c.id){seasonStoreCampaign=c.id;seasonStoreCategory='';seasonStoreVariants=new Map();}
 const categories=A(c.categories).filter(x=>x.active).slice().sort((a,b)=>N(a.sortOrder)-N(b.sortOrder));
 const grades=A(c.grades).filter(x=>x.active).slice().sort((a,b)=>N(a.sortOrder)-N(b.sortOrder));
 const products=A(c.products),opened=c.status==='ABERTA',activeGradeIds=new Set(grades.map(g=>g.id));
 E('seasonalCategoryFilter').innerHTML='<button type="button" data-season-category="" class="'+(!seasonStoreCategory?'active':'')+'">🍽️ Todos</button>'+
  categories.map(cat=>'<button type="button" data-season-category="'+esc(cat.id)+'" class="'+(seasonStoreCategory===cat.id?'active':'')+'">'+
   esc(cat.emoji||'🍽️')+' '+esc(cat.name)+'</button>').join('');
 const visible=p=>!seasonStoreCategory||seasonalMerchFilterCategory(p,grades)===seasonStoreCategory;
 const cards=[];
 for(const grade of grades){
  const variants=products.filter(p=>p.gradeId===grade.id&&visible(p));
  if(variants.length)cards.push(seasonalGradeMarkup(grade,variants,opened));
 }
 for(const p of products){
  if(p.gradeId&&activeGradeIds.has(p.gradeId)||!visible(p))continue;
  cards.push('<article class="seasonal-item">'+
   (p.image?'<img alt="'+esc(p.name)+'" src="'+esc(p.image)+'" loading="lazy">':'')+
   '<div class="seasonal-item-content"><h3>'+esc(p.name)+'</h3><span class="seasonal-price">'+money(p.price)+'</span>'+
   '<p class="seasonal-muted">'+esc(p.description||'Produto artesanal para sua ocasião especial')+'</p>'+
   '<small>Pedido mínimo: '+N(p.minQuantity)+(N(p.maxQuantity)>0?' · máximo: '+N(p.maxQuantity):'')+'</small>'+
   '<button type="button" data-season-add="'+esc(p.id)+'" '+(!opened?'disabled':'')+'>🎁 Adicionar à encomenda</button></div></article>');
 }
 root.innerHTML=cards.join('')||'<p>Nenhum produto nesta categoria.</p>';
 const packs=A(c.packs).filter(p=>p.active).slice().sort((a,b)=>N(a.sortOrder)-N(b.sortOrder));
 E('seasonalPacks').innerHTML=packs.length?'<h3 class="seasonal-pack-title">🎁 Kits e packs especiais</h3>'+
  '<div class="seasonal-pack-grid">'+packs.map(p=>seasonalPackMarkup(p,c,opened)).join('')+'</div>':'';
}
window.CaseirinhoSeasonalMerch={render:seasonStoreMerchRender};
B.renderCampaigns();
function seasonStorePackStatus(card){
 const pack=A(seasonCurrent()?.packs).find(p=>p.id===card.dataset.seasonPack);
 if(!pack)return;
 const qty=[...card.querySelectorAll('[data-season-pack-qty]')].reduce((sum,x)=>sum+Math.max(0,Math.floor(N(x.value))),0);
 const progress=card.querySelector('[data-season-pack-progress]');
 progress.textContent=qty+' de '+N(pack.quantity)+' unidades selecionadas'+(qty>N(pack.quantity)?' · acima do limite':'');
 progress.classList.toggle('ready',qty===N(pack.quantity));
 card.querySelector('[data-season-pack-add]').disabled=qty!==N(pack.quantity);
}
async function seasonStorePackAdd(card){
 const c=seasonCurrent(),pack=A(c?.packs).find(p=>p.id===card.dataset.seasonPack);
 if(!pack||c.status!=='ABERTA')return toast('Pack indisponível nesta campanha.');
 if(B.getActiveCampaignId()&&B.getActiveCampaignId()!==c.id)return toast('Finalize primeiro a encomenda de outra campanha.');
 const amounts=[...card.querySelectorAll('[data-season-pack-qty]')].map(x=>({id:x.dataset.seasonPackQty,qty:N(x.value)})).filter(x=>x.qty>0);
 if(amounts.some(x=>!Number.isInteger(x.qty))||amounts.reduce((sum,x)=>sum+x.qty,0)!==N(pack.quantity))
  return toast('Selecione exatamente '+pack.quantity+' unidades inteiras.');
 if(amounts.some(x=>{
  const p=c.products.find(p=>p.id===x.id),existing=B.getCart().find(r=>S(r.produtoId)===x.id);
  return !p||x.qty<N(p.minQuantity)||N(p.maxQuantity)>0&&N(existing?.quantidade)+x.qty>N(p.maxQuantity);
 }))return toast('Confira os limites de quantidade dos sabores selecionados.');
 B.setActiveCampaignId(c.id);
 for(const item of amounts)await quickAdd(item.id,item.qty);
 modeChanged();renderSeasonalCheckout();
 toast('🎁 Kit '+pack.name+' incluído. Confira o valor com desconto no carrinho.');
}
document.addEventListener('click',e=>{
 const category=e.target.closest?.('[data-season-category]');
 if(category){seasonStoreCategory=category.dataset.seasonCategory;seasonStoreMerchRender();return;}
 const variant=e.target.closest?.('[data-season-variant]');
 if(variant){seasonStoreVariants.set(variant.dataset.grade,variant.dataset.seasonVariant);seasonStoreMerchRender();return;}
 const pack=e.target.closest?.('[data-season-pack-add]');
 if(pack)seasonStorePackAdd(pack.closest('[data-season-pack]'));
});
document.addEventListener('input',e=>{
 if(e.target.closest?.('[data-season-pack-qty]'))seasonStorePackStatus(e.target.closest('[data-season-pack]'));
});
