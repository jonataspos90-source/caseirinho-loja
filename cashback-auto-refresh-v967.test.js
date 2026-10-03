'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const src=fs.readFileSync(path.join(__dirname,'cashback-auto-refresh-v9-6-7.js'),'utf8');

test('carteira atualiza cashback automaticamente',()=>{
  assert.match(src,/setTimeout\(\(\)=>refresh\(\{force:false\}\),700\)/);
  assert.match(src,/window\.addEventListener\('focus'/);
  assert.match(src,/visibilitychange/);
  assert.match(src,/setInterval/);
});

test('abrir Cashback força atualização sem precisar consultar manualmente',()=>{
  assert.match(src,/#navCashback/);
  assert.match(src,/refresh\(\{force:true,render:true\}\)/);
  assert.match(src,/Saldo atualizado automaticamente pelo ERP/);
});

test('a tela deixa claro que consulta nao libera credito',()=>{
  assert.match(src,/pedido é marcado como entregue ou retirado/);
  assert.match(src,/você não precisa consultar para liberar o crédito/);
});
