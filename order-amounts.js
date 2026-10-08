(function(root){'use strict';
// Exibição consistente dos valores do pedido sem alterar os dados financeiros gravados.

function amount(v){if(v===null||v===undefined||v==='')return null;const n=Number(v);return Number.isFinite(n)?n:null}
function pick(...vs){for(const v of vs){const n=amount(v);if(n!==null)return n}return null}
function round(v){return Math.round((Number(v)+Number.EPSILON)*100)/100}
function money(n){return Number(n).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}
function order(input={}){return {...(input.payload||{}),...input}}
function itemsFor(o){return [...(Array.isArray(o.itens)?o.itens:[]),...(Array.isArray(o.adicionaisEcommerce)?o.adicionaisEcommerce:[])]}
function itemPaid(i){
  const q=pick(i.quantidade,i.qtd,1);
  return round(Math.max(0,pick(i.total,amount(i.precoUnitario)!==null?q*Number(i.precoUnitario):null,amount(i.preco_unitario)!==null?q*Number(i.preco_unitario):null,amount(i.preco)!==null?q*Number(i.preco):null,0)));
}
function itemSavings(i){
  const q=pick(i.quantidade,i.qtd,1),paid=itemPaid(i);
  const original=pick(i.totalOriginal,amount(i.precoUnitarioOriginal)!==null?q*Number(i.precoUnitarioOriginal):null);
  return round(Math.max(0,pick(i.economia,original!==null?original-paid:null,0)));
}
function promoLabel(i){
  const label=String(i.promocaoAplicada||i.promotionLabel||'').trim();
  const name=label.split(' · ')[0].trim();
  return name||'Promoção de produtos';
}
function promotions(o){
  const fromSaved=Array.isArray(o.promocoesAplicadas)?o.promocoesAplicadas:[];
  const saved=fromSaved.filter(x=>pick(x.economia,x.desconto)!==null&&pick(x.economia,x.desconto)>0)
    .map(x=>({label:String(x.nome||x.label||'Promoção de produtos').trim(),amount:round(pick(x.economia,x.desconto,0))}));
  if(saved.length)return saved;
  const grouped=new Map();
  for(const i of itemsFor(o)){
    const savings=itemSavings(i);
    if(savings<=0)continue;
    const label=promoLabel(i),key=String(i.promocaoGrupoId||i.promotionGroupId||label);
    const prev=grouped.get(key)||{label,amount:0};
    prev.amount=round(prev.amount+savings);
    grouped.set(key,prev);
  }
  if(grouped.size)return [...grouped.values()];
  const explicit=pick(o.descontoPromocional,o.valores?.descontoPromocional,0);
  return explicit>0?[{label:'Promoções dos produtos',amount:round(explicit)}]:[];
}
function breakdown(input={}){
  const o=order(input),v=o.valores||{},items=itemsFor(o),promo=promotions(o);
  const freight=round(Math.max(0,pick(o.valorFrete,typeof o.frete==='number'?o.frete:null,v.taxa_entrega,0)));
  const knownTotal=pick(o.total,o.valorTotal,v.total);
  const paidItems=items.length?round(items.reduce((sum,i)=>sum+itemPaid(i),0)):null;
  const savedPromo=round(promo.reduce((sum,p)=>sum+p.amount,0));
  const coupon=pick(o.descontoCupom,o.cupom?.desconto,o.comercial?.coupon?.discount,v.descontoCupom,0);
  const cashback=pick(o.cashbackDiscount,o.cashback?.used,v.cashbackDiscount,0);
  const gross=round(Math.max(0,pick(
    o.subtotalOriginal,v.subtotalOriginal,
    paidItems!==null?paidItems+savedPromo:null,
    amount(o.subtotal)!==null?Number(o.subtotal)+savedPromo+coupon+cashback:null,
    amount(v.subtotal)!==null?Number(v.subtotal)+savedPromo+coupon+cashback:null,
    knownTotal!==null?knownTotal-freight+savedPromo+coupon+cashback:0
  )));
  const total=round(Math.max(0,knownTotal??gross-savedPromo-coupon-cashback+freight));
  const discounts=round(Math.max(0,gross+freight-total));
  let remaining=discounts;
  const promoLines=[];
  for(const p of promo){
    const discount=round(Math.min(remaining,Math.max(0,p.amount)));
    if(discount>0){promoLines.push({label:p.label,amount:discount});remaining=round(Math.max(0,remaining-discount))}
  }
  const savings=round(promoLines.reduce((sum,p)=>sum+p.amount,0));
  const adjustment=round(Math.max(0,total-gross-freight));
  const pending=String(o.freteStatus||'').toUpperCase()==='COTACAO_PENDENTE';
  return {products:gross,freight,discounts,promoDiscount:savings,promoLines,otherDiscounts:remaining,
    adjustment,total,pending,pickup:String(o.modalidade||'').toUpperCase()==='RETIRADA'};
}
function lines(o){
  const b=breakdown(o),out=[['Produtos',money(b.products)]];
  for(const p of b.promoLines)out.push(['Desconto - '+p.label,'- '+money(p.amount)]);
  if(b.otherDiscounts>0)out.push([b.promoDiscount>0?'Outros descontos / cashback':'Descontos / cashback','- '+money(b.otherDiscounts)]);
  out.push(['Frete',b.pending?'A calcular':money(b.freight)+(b.pickup?' (retirada)':'')]);
  if(b.adjustment>0)out.push(['Ajustes do pedido',money(b.adjustment)]);
  out.push([b.pending?'Total atual (frete a calcular)':'Total do pedido',money(b.total)]);
  return out;
}
function celebration(o){
  const b=breakdown(o);
  return b.promoDiscount>0?'🎉 Parabéns! Você economizou '+money(b.promoDiscount)+' com as promoções do Caseirinho!':'';
}
function text(o,separator='\n'){return lines(o).map(([label,value])=>label+': '+value).join(separator)}

root.JohnOrderAmounts={breakdown,lines,text,celebration,promotions};
})(typeof window!=='undefined'?window:globalThis);
