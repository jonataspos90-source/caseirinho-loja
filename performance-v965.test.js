const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

const yieldScript=fs.readFileSync('cashback-order-yield-v9-6-4.js','utf8');
const app=fs.readFileSync('app.js','utf8');

test('cashback em Meus Pedidos não usa polling contínuo',()=>{
  assert.doesNotMatch(yieldScript,/setInterval\s*\(/);
  assert.match(yieldScript,/ordersViewOpen\(\)/);
  assert.match(yieldScript,/requestIdleCallback/);
});

test('renderização de cashback é idempotente e ignora mutações próprias',()=>{
  assert.match(yieldScript,/dataset\.renderSig/);
  assert.match(yieldScript,/closest\?\.\('\.cashback-order-yield'\)/);
  assert.match(yieldScript,/if\(existing\?\.dataset\?\.renderSig===sig\)continue/);
  assert.match(yieldScript,/relevantMutation/);
});

test('checkout continua com um único handler principal de envio',()=>{
  const matches=app.match(/E\('checkout'\)\.onsubmit=submitOrder/g)||[];
  assert.equal(matches.length,1);
});
