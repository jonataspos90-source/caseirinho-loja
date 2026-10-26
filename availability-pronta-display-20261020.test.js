'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const app=fs.readFileSync('app.js','utf8');
const sw=fs.readFileSync('service-worker.js','utf8');
const html=fs.readFileSync('index.html','utf8');
const start=app.indexOf('function canonicalAvailability(p){');
const end=app.indexOf('function isOrderItem(p,quantity=1){',start);
const source=app.slice(start,end);
assert.ok(start>=0&&end>start);
const availabilityText=Function(
  "const norm=v=>String(v??'').trim().toUpperCase();"+
  "const N=v=>Number(v)||0;const catalogConnected=true;"+
  source+";return availabilityText"
)();
test('PRONTA_ENTREGA publicada com saldo zerado continua identificada como pronta entrega cadastrada, sem promessa de estoque',()=>{
  const p={disponibilidade:'SOB_ENCOMENDA',disponibilidadeOriginal:'PRONTA_ENTREGA',disponibilidadeEfetiva:'SOB_ENCOMENDA',saldoDisponivel:0,encomendaAutomatica:true,podeComprar:true};
  assert.match(availabilityText(p),/Pronta entrega/);
  assert.match(availabilityText(p),/quantidade a confirmar/);
  assert.doesNotMatch(availabilityText(p),/Sob encomenda/);
});
test('SOB_ENCOMENDA explícito continua sob encomenda',()=>{
 assert.match(availabilityText({disponibilidade:'SOB_ENCOMENDA',disponibilidadeOriginal:'SOB_ENCOMENDA',saldoDisponivel:0,podeComprar:true}),/Sob encomenda/);
});
test('PRONTA_ENTREGA com saldo positivo é venda imediata',()=>{
 assert.match(availabilityText({disponibilidade:'PRONTA_ENTREGA',saldoDisponivel:4,podeComprar:true}),/Pronta entrega disponível/);
});
test('saldo zero com bloqueio estrito mostra indisponibilidade, sem habilitar venda indevida',()=>{
 assert.match(availabilityText({disponibilidade:'PRONTA_ENTREGA',saldoDisponivel:0,podeComprar:false}),/Indisponível/);
});
test('checkout reconhece confirmação de quantidade e publica versão que elimina cache antigo',()=>{
 assert.match(app,/pendingEncomendas\.some\(x=>readyNeedsConfirmation\(x\.product\)\)/);
 assert.match(app,/\[DISPONIBILIDADE A CONFIRMAR/);
 assert.match(sw,/caseirinho-loja-v9\.10\.33-pix-cnpj-data-entrega/);
 assert.match(html,/app\.js\?v=910330/);
});
