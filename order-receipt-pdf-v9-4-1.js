(()=>{'use strict';
if(window.__CASEIRINHO_ORDER_RECEIPT_PDF_941__)return;
window.__CASEIRINHO_ORDER_RECEIPT_PDF_941__=true;

const CFG=window.CASEIRINHO_CONFIG||{};
const STORE=String(new URLSearchParams(location.search).get('empresa')||new URLSearchParams(location.search).get('loja')||CFG.storeSlug||'caseirinho').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9-]/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'')||'caseirinho';
const PREFIX='john_store_'+STORE+'_';
const ORDERS_KEY=PREFIX+'orders_v1';
const CATALOG_KEY=PREFIX+'catalog_v1';
const PIX_KEY='69195483000123';
const S=v=>String(v??'');
const N=v=>Number(v)||0;
const A=v=>Array.isArray(v)?v:[];
const money=v=>N(v).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});

function read(k,f){try{const x=JSON.parse(localStorage.getItem(k)||'null');return x??f}catch(_){return f}}
function orders(){
  const current=read(ORDERS_KEY,[]);
  if(A(current).length)return A(current);
  if(STORE==='caseirinho')return A(read('caseirinho_my_orders_v83',[]));
  return[];
}
function catalog(){return read(CATALOG_KEY,{loja:{},produtos:[]})}
function orderCode(o){return S(o?.codigo||o?.code||o?.id).trim()}
function orderStatus(o){return S(o?.status||o?.payload?.status||'').trim()||'Pedido recebido'}
function prettyPix(){return PIX_KEY.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,'$1.$2.$3/$4-$5')}
function safeDate(v){try{return new Date(v||Date.now()).toLocaleString('pt-BR')}catch(_){return S(v)}}
function customerName(o){return S(o?.cliente?.nome||o?.payload?.cliente?.nome||'Cliente').trim()||'Cliente'}
function payment(o){return S(o?.formaPagamento||o?.payload?.formaPagamento||'Não informado').trim()||'Não informado'}
function deliveryMode(o){return S(o?.modalidade||o?.payload?.modalidade||'').toUpperCase()==='ENTREGA'?'Entrega':'Retirada'}
function toast(msg){const e=document.getElementById('toast');if(e){e.textContent=msg;e.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>e.classList.remove('show'),2600);return}try{alert(msg)}catch(_){}}

function resolveItems(o){
  const cat=catalog();
  const products=A(cat?.produtos);
  const source=A(o?.itens).length?A(o.itens):A(o?.payload?.itens);
  return source.map(i=>{
    const id=S(i?.produtoId||i?.id);
    const p=products.find(x=>S(x?.id)===id)||{};
    const qty=N(i?.quantidade)||1;
    const unit=N(i?.precoUnitario||i?.preco||p?.preco);
    const total=Number.isFinite(Number(i?.total))&&Number(i?.total)!==0?Number(i.total):unit*qty;
    return {
      id,
      nome:S(i?.nome||i?.produtoNome||p?.nome||p?.nomeComercial||('Produto '+id)).trim(),
      quantidade:qty,
      unitario:unit,
      total
    };
  });
}
function orderTotals(o,items){
  const subtotalRaw=Number(o?.subtotal??o?.payload?.subtotal);
  const subtotal=Number.isFinite(subtotalRaw)?subtotalRaw:items.reduce((s,x)=>s+N(x.total),0);
  const freightRaw=Number(o?.valorFrete??o?.frete??o?.payload?.valorFrete??0);
  const freight=Number.isFinite(freightRaw)?freightRaw:0;
  const totalRaw=Number(o?.total??o?.payload?.total);
  const total=Number.isFinite(totalRaw)?totalRaw:subtotal+freight;
  return {subtotal,freight,total};
}
function wrap(text,max=78){
  const words=S(text).replace(/\s+/g,' ').trim().split(' ').filter(Boolean),out=[];let line='';
  for(const w of words){
    if(!line){line=w;continue}
    if((line+' '+w).length<=max)line+=' '+w;
    else{out.push(line);line=w}
  }
  if(line)out.push(line);
  return out.length?out:[''];
}
function receiptLines(o){
  const items=resolveItems(o),tot=orderTotals(o,items),lines=[];
  const add=(text,opt={})=>lines.push({text:S(text),size:opt.size||10,bold:!!opt.bold,gap:opt.gap??14});
  const sep=()=>add('--------------------------------------------------------------------------',{size:9,gap:12});
  add('CASEIRINHO MASSAS ARTESANAIS',{size:17,bold:true,gap:23});
  add('COMPROVANTE DO PEDIDO',{size:13,bold:true,gap:20});
  add('Pedido: '+orderCode(o),{bold:true});
  add('Data: '+safeDate(o?.criadoEm||o?.createdAt||o?.savedAt));
  add('Status: '+orderStatus(o));
  add('Cliente: '+customerName(o));
  add('Recebimento: '+deliveryMode(o));
  add('Forma de pagamento: '+payment(o));
  sep();
  add('PRODUTOS COMPRADOS',{size:12,bold:true,gap:18});
  if(!items.length){
    add('Itens detalhados indisponíveis neste aparelho. Consulte o pedido no aplicativo.');
  }else{
    items.forEach((it,idx)=>{
      wrap(`${idx+1}. ${it.quantidade} x ${it.nome}`,72).forEach((x,j)=>add(x,{bold:j===0}));
      if(it.unitario>0||it.total>0)add(`   Unitário: ${money(it.unitario)}   Total: ${money(it.total)}`,{size:9,gap:12});
    });
  }
  sep();
  add('Subtotal: '+money(tot.subtotal),{bold:true});
  if(deliveryMode(o)==='Entrega')add('Frete: '+money(tot.freight),{bold:true});
  add('TOTAL DO PEDIDO: '+money(tot.total),{size:14,bold:true,gap:22});
  sep();
  add('PIX OFICIAL DO CASEIRINHO',{size:12,bold:true,gap:18});
  add('Chave PIX (CNPJ): '+prettyPix(),{bold:true});
  add('CNPJ sem pontuação: '+PIX_KEY);
  add('Valor do pedido: '+money(tot.total),{bold:true});
  add('Confira o recebedor e o valor no aplicativo do seu banco antes de concluir o pagamento.',{size:9,gap:12});
  const obs=S(o?.observacao||o?.payload?.observacao).trim();
  if(obs){sep();add('OBSERVAÇÃO',{bold:true});wrap(obs,76).forEach(x=>add(x,{size:9,gap:12}))}
  sep();
  add('Documento gerado pelo App Caseirinho.',{size:8,gap:11});
  return lines;
}

function win1252Bytes(str){
  const special={8364:128,8218:130,402:131,8222:132,8230:133,8224:134,8225:135,710:136,8240:137,352:138,8249:139,338:140,381:142,8216:145,8217:146,8220:147,8221:148,8226:149,8211:150,8212:151,732:152,8482:153,353:154,8250:155,339:156,382:158,376:159};
  const out=[];
  for(const ch of S(str)){
    const cp=ch.codePointAt(0);
    if(cp<=255)out.push(cp);else if(special[cp]!=null)out.push(special[cp]);else out.push(63);
  }
  return new Uint8Array(out);
}
function ascii(str){return new Uint8Array([...S(str)].map(c=>c.charCodeAt(0)&255))}
function concat(parts){const len=parts.reduce((s,p)=>s+p.length,0),out=new Uint8Array(len);let pos=0;for(const p of parts){out.set(p,pos);pos+=p.length}return out}
function pdfEscape(s){return S(s).replace(/\\/g,'\\\\').replace(/\(/g,'\\(').replace(/\)/g,'\\)').replace(/[\r\n]+/g,' ')}
function paginate(lines){
  const pages=[];let page=[],y=790;
  for(const line of lines){
    const gap=Math.max(10,N(line.gap)||14);
    if(y-gap<54&&page.length){pages.push(page);page=[];y=790}
    page.push({...line,y});y-=gap;
  }
  if(page.length||!pages.length)pages.push(page);
  return pages;
}
function pageStream(lines,pageNo,totalPages){
  const chunks=[];
  for(const l of lines){
    const font=l.bold?'F2':'F1',size=Math.max(7,N(l.size)||10),x=46;
    chunks.push(`BT /${font} ${size} Tf ${x} ${l.y} Td (`+pdfEscape(l.text)+') Tj ET\n');
  }
  chunks.push(`BT /F1 8 Tf 46 28 Td (Página ${pageNo} de ${totalPages}) Tj ET\n`);
  return win1252Bytes(chunks.join(''));
}
function buildPdf(o){
  const pages=paginate(receiptLines(o));
  const objects=[];
  const pageIds=[],contentIds=[];
  for(let i=0;i<pages.length;i++){contentIds.push(5+i*2);pageIds.push(6+i*2)}
  objects[1]=ascii('<< /Type /Catalog /Pages 2 0 R >>');
  objects[2]=ascii('<< /Type /Pages /Kids ['+pageIds.map(id=>id+' 0 R').join(' ')+'] /Count '+pages.length+' >>');
  objects[3]=ascii('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');
  objects[4]=ascii('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');
  for(let i=0;i<pages.length;i++){
    const stream=pageStream(pages[i],i+1,pages.length);
    objects[contentIds[i]]=concat([ascii('<< /Length '+stream.length+' >>\nstream\n'),stream,ascii('\nendstream')]);
    objects[pageIds[i]]=ascii('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents '+contentIds[i]+' 0 R >>');
  }
  const maxId=objects.length-1;
  const header=concat([ascii('%PDF-1.4\n%'),new Uint8Array([226,227,207,211]),ascii('\n')]);
  const parts=[header],offsets=new Array(maxId+1).fill(0);let offset=header.length;
  for(let id=1;id<=maxId;id++){
    const obj=objects[id];offsets[id]=offset;
    const wrapped=concat([ascii(id+' 0 obj\n'),obj,ascii('\nendobj\n')]);parts.push(wrapped);offset+=wrapped.length;
  }
  const xrefOffset=offset;
  let xref='xref\n0 '+(maxId+1)+'\n0000000000 65535 f \n';
  for(let id=1;id<=maxId;id++)xref+=String(offsets[id]).padStart(10,'0')+' 00000 n \n';
  const tail=ascii(xref+'trailer\n<< /Size '+(maxId+1)+' /Root 1 0 R >>\nstartxref\n'+xrefOffset+'\n%%EOF');
  parts.push(tail);
  return concat(parts);
}
function download(o){
  try{
    const bytes=buildPdf(o),blob=new Blob([bytes],{type:'application/pdf'}),url=URL.createObjectURL(blob);
    const a=document.createElement('a');a.href=url;a.download='Caseirinho-Pedido-'+orderCode(o).replace(/[^A-Za-z0-9_-]+/g,'-')+'.pdf';a.style.display='none';document.body.appendChild(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),30000);
    toast('PDF do pedido gerado.');
  }catch(e){console.error('[Caseirinho PDF 9.4.1]',e);toast('Não foi possível gerar o PDF deste pedido.')}
}
function findOrder(card){
  const shown=S(card?.querySelector('.order-top b')?.textContent).trim();
  return orders().find(o=>orderCode(o)===shown||S(o?.id)===shown)||null;
}
function ensureStyle(){
  if(document.getElementById('receiptPdf941Style'))return;
  const st=document.createElement('style');st.id='receiptPdf941Style';st.textContent='.receipt-pdf-actions{margin-top:10px;display:flex;justify-content:flex-end}.receipt-pdf-btn{display:inline-flex;align-items:center;gap:7px;font-weight:900}.receipt-pdf-btn:before{content:"📄"}';document.head.appendChild(st);
}
let scheduled=false;
function patch(){
  scheduled=false;ensureStyle();
  document.querySelectorAll('.order-card').forEach(card=>{
    if(card.querySelector('[data-receipt-pdf-941]'))return;
    const o=findOrder(card);if(!o)return;
    const row=document.createElement('div');row.className='receipt-pdf-actions';
    const b=document.createElement('button');b.type='button';b.className='soft receipt-pdf-btn';b.dataset.receiptPdf941='1';b.textContent='Baixar PDF do pedido';
    b.onclick=()=>download(findOrder(card)||o);row.appendChild(b);card.appendChild(row);
  });
}
function schedule(){if(scheduled)return;scheduled=true;setTimeout(patch,80)}
function boot(){patch();const root=document.body||document.documentElement;if(root){const mo=new MutationObserver(schedule);try{mo.observe(root,{childList:true,subtree:true})}catch(_){}}[500,1500,3500,7000].forEach(ms=>setTimeout(patch,ms))}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
window.CaseirinhoOrderReceiptPdf941={version:'9.4.1',downloadById:id=>{const o=orders().find(x=>S(x.id)===S(id)||orderCode(x)===S(id));if(!o)throw new Error('Pedido não encontrado.');download(o)}};
})();