(function(root,factory){
  const api=factory();
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  if(root)root.CaseirinhoPromotions=api;
})(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';
  const n=v=>Number(v)||0,round=v=>Math.round((n(v)+Number.EPSILON)*100)/100;
  const promo=p=>p?.promocao||p?.ecommerce?.promocao||{};
  const pack=p=>p?.packVirtual||p?.ecommerce?.packVirtual||{};
  const packProductIds=(p,d=pack(p))=>{
    const raw=d.produtoIds||d.produtosIds||d.itensProdutoIds||d.produtos;
    const ids=Array.isArray(raw)?raw.map(x=>String(typeof x==='object'?(x.id??x.produtoId):x)).filter(Boolean):[];
    if(!ids.includes(String(p?.id)))ids.push(String(p?.id));
    return [...new Set(ids)];
  };
  const productName=p=>String(p?.nomeComercial||p?.nome||p?.descricao||'produto');
  const base=p=>Math.max(0,n(p?.precoEcommerce||p?.preco));
  const packKey=(deal,ids,x,y)=>String(deal.packId||JSON.stringify([ids.slice().sort(),x,y]));
  function isPalmitoPanqueca(p){
    const grade=String(p?.gradeNome||p?.grade?.nome||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase();
    const flavor=String([p?.variacaoLabel,p?.nomeComercial,p?.nome].filter(Boolean).join(' ')).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase();
    return (grade.includes('PANQUECA')&&flavor.includes('PALMITO'))
      ||(flavor.includes('PANQUECA')&&flavor.includes('PALMITO'));
  }
  function fixedPromo(p){
    const v=n(promo(p).precoPromocional),b=base(p);
    if(promo(p).ativo===true&&v>0&&b>v)return v;
    return isPalmitoPanqueca(p)&&b>11.99?11.99:null;
  }
  function priceInfo(p,products=[]){
    const b=base(p),fixed=fixedPromo(p);if(fixed!==null)return{regular:b,current:fixed,conditional:false};
    for(const trigger of products){const d=pack(trigger);if(d.ativo===true&&d.tipo==='COMPRA_X_LEVE_Y_POR_VALOR'&&String(d.produtoBeneficioId)===String(p?.id)){const v=n(d.precoBeneficio);if(v>0&&v<b)return{regular:b,current:v,conditional:true,triggerProduct:trigger,deal:d}}}
    return{regular:b,current:b,conditional:false};
  }
  function isFeatured(p,products=[]){
    if(fixedPromo(p)!==null)return true;
    if(pack(p).ativo===true&&packProductIds(p).includes(String(p?.id)))return true;
    return products.some(trigger=>{const d=pack(trigger);return d.ativo===true&&d.tipo==='COMPRA_X_LEVE_Y_POR_VALOR'&&String(d.produtoBeneficioId)===String(p?.id)});
  }
  function offerText(p,products=[]){
    const d=pack(p);
    if(d.ativo===true&&d.tipo==='LEVE_X_PAGUE_Y'){
      const x=Math.floor(n(d.quantidadeLeve)),y=Math.floor(n(d.quantidadePague)),ids=packProductIds(p,d);
      if(ids.length>1){
        const names=ids.map(id=>products.find(x=>String(x.id)===id)).filter(Boolean).map(productName);
        return `Leve ${x}, pague ${y}: misture ${names.join(', ')}. O pack é calculado pelos itens de maior preço.`;
      }
      return `Leve ${x}, pague ${y}`;
    }
    if(d.ativo===true&&d.tipo==='COMPRA_X_LEVE_Y_POR_VALOR')return`Compre ${Math.floor(n(d.quantidadeGatilho))} ${p?.nome||'unidades'} e leve ${products.find(x=>String(x.id)===String(d.produtoBeneficioId))?.nome||'outro produto'} por R$ ${n(d.precoBeneficio).toFixed(2).replace('.',',')}`;
    const info=priceInfo(p,products);
    if(info.conditional)return`Na compra de ${Math.floor(n(info.deal.quantidadeGatilho))} ${info.triggerProduct.nome||'unidades'}, este produto sai por R$ ${info.current.toFixed(2).replace('.',',')}`;
    return fixedPromo(p)!==null?'Preço especial por tempo de promoção':'';
  }
  function linePrice(productId,quantity,products=[],quantities=new Map()){
    const map=products instanceof Map?products:new Map(products.map(p=>[String(p.id),p]));
    const id=String(productId),p=map.get(id)||{},q=Math.max(0,n(quantity)),b=base(p),regular=round(b*q),options=[{total:regular,label:'',groupId:''}],f=fixedPromo(p),d=pack(p);
    if(f!==null)options.push({total:round(f*q),label:'Promoção',groupId:`promo:${promo(p).id||id}`});
    if(d.ativo===true&&d.tipo==='LEVE_X_PAGUE_Y'&&packProductIds(p,d).length===1){
      const x=Math.floor(n(d.quantidadeLeve)),y=Math.floor(n(d.quantidadePague));
      if(x>1&&y>0&&y<x){const sets=Math.floor(q/x),rest=q-sets*x;options.push({total:round((sets*y+rest)*b),label:`Leve ${x}, pague ${y}`,groupId:`pack:${packKey(d,[id],x,y)}`})}
    }
    for(const trigger of map.values()){
      const x=pack(trigger);if(x.ativo!==true||x.tipo!=='COMPRA_X_LEVE_Y_POR_VALOR'||String(x.produtoBeneficioId)!==id)continue;
      const threshold=Math.floor(n(x.quantidadeGatilho)),triggerQty=n(quantities.get(String(trigger.id))),sameProduct=String(trigger.id)===id,sets=threshold>0?Math.floor(triggerQty/(threshold+(sameProduct?1:0))):0,v=n(x.precoBeneficio);
      if(sets>0&&v>=0&&v<b){const count=sameProduct?sets:Math.min(q,sets);options.push({total:round(count*v+(q-count)*b),label:`Pack ${trigger.nome||'virtual'}`,groupId:`pack:${x.packId||x.id||trigger.id}`})}
    }
    options.sort((a,b)=>a.total-b.total);const best=options[0],total=round(best.total);
    return{total,unitPrice:q?round(total/q):0,savings:round(Math.max(0,regular-total)),promotionLabel:best.label,promotionGroupId:best.groupId};
  }
  function cartTotals(cart,products=[]){
    const quantities=new Map();
    for(const item of cart)quantities.set(String(item.produtoId),n(quantities.get(String(item.produtoId)))+n(item.quantidade));
    const map=products instanceof Map?products:new Map(products.map(p=>[String(p.id),p]));
    const lines=new Map([...quantities].map(([id,q])=>[id,linePrice(id,q,map,quantities)]));
    const rules=new Map();
    for(const product of map.values()){
      const d=pack(product);if(d.ativo!==true||d.tipo!=='LEVE_X_PAGUE_Y')continue;
      const ids=packProductIds(product,d).filter(id=>map.has(id));
      const x=Math.floor(n(d.quantidadeLeve)),y=Math.floor(n(d.quantidadePague));
      if(ids.length<2||x<2||y<1||y>=x)continue;
      const key=packKey(d,ids,x,y);
      if(!rules.has(key))rules.set(key,{ids,x,y,key});
    }
    for(const rule of rules.values()){
      const units=[];
      for(const id of rule.ids){
        const q=Math.floor(n(quantities.get(id))),product=map.get(id);
        for(let i=0;i<q;i++)units.push({id,price:base(product)});
      }
      units.sort((a,b)=>b.price-a.price);
      const completeSets=Math.floor(units.length/rule.x);
      if(!completeSets){
        const eligible=units.length,remaining=rule.x-eligible;
        for(const id of rule.ids){
          const old=lines.get(id);if(!old)continue;
          lines.set(id,{...old,promotionGroupId:`pack:${rule.key}`,promotionGroupLabel:`Leve ${rule.x}, pague ${rule.y}`,promotionGroupHint:`Faltam ${remaining} item(ns) participante(s) para liberar o desconto.`,promotionGroupProgress:{eligible,required:rule.x,remaining,pending:true}});
        }
        continue;
      }
      let packTotal=0;
      units.forEach((unit,index)=>{const pos=index%rule.x;if(pos<rule.y)packTotal+=unit.price});
      const currentTotal=rule.ids.reduce((sum,id)=>sum+(lines.get(id)?.total||0),0);
      if(packTotal>=currentTotal-.001)continue;
      const totals=new Map(rule.ids.map(id=>[id,0]));
      units.forEach((unit,index)=>{if(index<completeSets*rule.x&&index%rule.x>=rule.y)return;totals.set(unit.id,(totals.get(unit.id)||0)+unit.price)});
      for(const id of rule.ids){
        const old=lines.get(id);if(!old)continue;
        const total=round(totals.get(id)||0),q=n(quantities.get(id)),regular=round(base(map.get(id))*q);
        lines.set(id,{total,unitPrice:q?round(total/q):0,savings:round(Math.max(0,regular-total)),promotionLabel:total<regular?`Leve ${rule.x}, pague ${rule.y} · Pack misto: maiores preços cobrados`:old.promotionLabel||`Leve ${rule.x}, pague ${rule.y} · Pack misto`,promotionGroupId:`pack:${rule.key}`,promotionGroupLabel:`Leve ${rule.x}, pague ${rule.y}`,promotionGroupHint:'Oferta aplicada: o sistema cobra os itens de maior preço e desconta os de menor preço.',promotionGroupProgress:{eligible:units.length%rule.x||rule.x,required:rule.x,remaining:0,pending:false}});
      }
    }
    return{lines,subtotal:round([...lines.values()].reduce((s,x)=>s+x.total,0)),savings:round([...lines.values()].reduce((s,x)=>s+x.savings,0))};
  }
  return{base,fixedPromo,priceInfo,isFeatured,offerText,linePrice,cartTotals};
});
