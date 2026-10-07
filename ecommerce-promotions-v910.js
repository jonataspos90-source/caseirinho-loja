(function(root,factory){
  const api=factory();
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  if(root)root.CaseirinhoPromotions=api;
})(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';
  const n=v=>Number(v)||0,round=v=>Math.round((n(v)+Number.EPSILON)*100)/100;
  const promo=p=>p?.promocao||p?.ecommerce?.promocao||{};
  const pack=p=>p?.packVirtual||p?.ecommerce?.packVirtual||{};
  const base=p=>Math.max(0,n(p?.precoEcommerce||p?.preco));
  function fixedPromo(p){const v=n(promo(p).precoPromocional),b=base(p);return promo(p).ativo===true&&v>0&&b>v?v:null}
  function priceInfo(p,products=[]){
    const b=base(p),fixed=fixedPromo(p);if(fixed!==null)return{regular:b,current:fixed,conditional:false};
    for(const trigger of products){const d=pack(trigger);if(d.ativo===true&&d.tipo==='COMPRA_X_LEVE_Y_POR_VALOR'&&String(d.produtoBeneficioId)===String(p?.id)){const v=n(d.precoBeneficio);if(v>0&&v<b)return{regular:b,current:v,conditional:true,triggerProduct:trigger,deal:d}}}
    return{regular:b,current:b,conditional:false};
  }
  function isFeatured(p,products=[]){
    if(fixedPromo(p)!==null)return true;
    if(pack(p).ativo===true)return true;
    return products.some(trigger=>{const d=pack(trigger);return d.ativo===true&&d.tipo==='COMPRA_X_LEVE_Y_POR_VALOR'&&String(d.produtoBeneficioId)===String(p?.id)});
  }
  function offerText(p,products=[]){
    const d=pack(p);
    if(d.ativo===true&&d.tipo==='LEVE_X_PAGUE_Y')return`Leve ${Math.floor(n(d.quantidadeLeve))}, pague ${Math.floor(n(d.quantidadePague))}`;
    if(d.ativo===true&&d.tipo==='COMPRA_X_LEVE_Y_POR_VALOR')return`Compre ${Math.floor(n(d.quantidadeGatilho))} ${p?.nome||'unidades'} e leve ${products.find(x=>String(x.id)===String(d.produtoBeneficioId))?.nome||'outro produto'} por R$ ${n(d.precoBeneficio).toFixed(2).replace('.',',')}`;
    const info=priceInfo(p,products);
    if(info.conditional)return`Na compra de ${Math.floor(n(info.deal.quantidadeGatilho))} ${info.triggerProduct.nome||'unidades'}, este produto sai por R$ ${info.current.toFixed(2).replace('.',',')}`;
    return fixedPromo(p)!==null?'Preço especial por tempo de promoção':'';
  }
  function linePrice(productId,quantity,products=[],quantities=new Map()){
    const map=products instanceof Map?products:new Map(products.map(p=>[String(p.id),p]));
    const id=String(productId),p=map.get(id)||{},q=Math.max(0,n(quantity)),b=base(p),regular=round(b*q),options=[{total:regular,label:''}],f=fixedPromo(p),d=pack(p);
    if(f!==null)options.push({total:round(f*q),label:'Promoção'});
    if(d.ativo===true&&d.tipo==='LEVE_X_PAGUE_Y'){
      const x=Math.floor(n(d.quantidadeLeve)),y=Math.floor(n(d.quantidadePague));
      if(x>1&&y>0&&y<x){const sets=Math.floor(q/x),rest=q-sets*x;options.push({total:round((sets*y+rest)*b),label:`Leve ${x}, pague ${y}`})}
    }
    for(const trigger of map.values()){
      const x=pack(trigger);if(x.ativo!==true||x.tipo!=='COMPRA_X_LEVE_Y_POR_VALOR'||String(x.produtoBeneficioId)!==id)continue;
      const threshold=Math.floor(n(x.quantidadeGatilho)),sets=threshold>0?Math.floor(n(quantities.get(String(trigger.id)))/threshold):0,v=n(x.precoBeneficio);
      if(sets>0&&v>=0&&v<b){const count=Math.min(q,sets);options.push({total:round(count*v+(q-count)*b),label:`Pack ${trigger.nome||'virtual'}`})}
    }
    options.sort((a,b)=>a.total-b.total);const best=options[0],total=round(best.total);
    return{total,unitPrice:q?round(total/q):0,savings:round(Math.max(0,regular-total)),promotionLabel:best.label};
  }
  function cartTotals(cart,products=[]){
    const quantities=new Map(cart.map(x=>[String(x.produtoId),n(x.quantidade)]));
    const lines=new Map(cart.map(x=>[String(x.produtoId),linePrice(x.produtoId,x.quantidade,products,quantities)]));
    return{lines,subtotal:round([...lines.values()].reduce((s,x)=>s+x.total,0)),savings:round([...lines.values()].reduce((s,x)=>s+x.savings,0))};
  }
  return{base,fixedPromo,priceInfo,isFeatured,offerText,linePrice,cartTotals};
});
