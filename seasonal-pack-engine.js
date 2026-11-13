(function(root,factory){
 const api=factory();
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 if(root)root.CaseirinhoSeasonalPacks=api;
})(typeof window==='undefined'?null:window,function(){
 'use strict';
 const n=x=>Number(x)||0;
 const cents=x=>Math.round((n(x)+Number.EPSILON)*100);
 const amount=x=>Math.round(x)/100;
 // Usa as mesmas linhas/centavos na loja e no servidor. Nunca confia em preços do carrinho.
 function apply(pricing,cart,packs){
  const lines=new Map([...pricing.lines].map(([k,v])=>[String(k),{...v}]));
  const qty=new Map();
  for(const row of cart||[])qty.set(String(row.produtoId),n(qty.get(String(row.produtoId)))+n(row.quantidade));
  const used=new Map(),deduct=new Map(),packForLine=new Map(),appliedPacks=[];
  const ordered=(packs||[]).filter(p=>p.active===true||p.active===undefined)
   .slice().sort((a,b)=>n(a.sortOrder)-n(b.sortOrder)||String(a.id).localeCompare(String(b.id)));
  for(const pack of ordered){
   const ids=[...new Set((pack.productIds||[]).map(String))];
   const size=n(pack.quantity),packCents=cents(pack.price);
   if(!Number.isInteger(size)||size<2||packCents<=0||!ids.length)continue;
   const units=[];
   for(const id of ids){
    const line=lines.get(id),q=qty.get(id);
    // Sem acumular com promoções pré-existentes em produtos do catálogo.
    if(!line||!Number.isInteger(q)||q<1||n(line.savings)>0)continue;
    const oldTotal=cents(line.total),base=Math.floor(oldTotal/q),extra=oldTotal%q,occupied=n(used.get(id));
    for(let i=occupied;i<q;i++)units.push({id,price:base+(i<extra?1:0)});
   }
   units.sort((a,b)=>b.price-a.price||a.id.localeCompare(b.id));
   let sets=0,saved=0;
   for(let i=0;i+size<=units.length;i+=size){
    const batch=units.slice(i,i+size),full=batch.reduce((sum,u)=>sum+u.price,0);
    if(full<=packCents)continue;
    let left=full-packCents;
    for(const unit of [...batch].reverse()){
     const portion=Math.min(left,unit.price);
     deduct.set(unit.id,n(deduct.get(unit.id))+portion);
     packForLine.set(unit.id,String(pack.id));
     left-=portion;
    }
    for(const unit of batch)used.set(unit.id,n(used.get(unit.id))+1);
    sets++;saved+=full-packCents;
   }
   if(sets>0)appliedPacks.push({id:String(pack.id),name:String(pack.name||'Pack de encomenda'),
    quantity:size,sets,unitPrice:amount(packCents),discount:amount(saved)});
  }
  for(const [id,discount]of deduct){
   const old=lines.get(id),q=qty.get(id);
   const total=amount(Math.max(0,cents(old.total)-discount));
   const label=appliedPacks.filter(p=>(packs||[]).some(x=>String(x.id)===p.id&&(x.productIds||[]).map(String).includes(id))).map(p=>p.name).join(', ');
   lines.set(id,{...old,total,unitPrice:q?amount(Math.round(cents(total)/q)):0,
    savings:amount(cents(old.savings)+discount),promotionLabel:'Pack sazonal: '+label,
    promotionGroupId:'season-pack:'+String(packForLine.get(id)||id),
    promotionGroupLabel:'🎁 '+label,
    promotionGroupHint:'Kit sazonal aplicado: o desconto foi calculado sobre a composição selecionada.'});
  }
  return{...pricing,lines,
   subtotal:amount([...lines.values()].reduce((sum,line)=>sum+cents(line.total),0)),
   savings:amount([...lines.values()].reduce((sum,line)=>sum+cents(line.savings),0)),appliedPacks};
 }
 return {apply};
});
