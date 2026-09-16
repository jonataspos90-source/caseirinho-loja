const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const src=fs.readFileSync(path.join(__dirname,'store-hotfix-v9-3-2.js'),'utf8');
const sw=fs.readFileSync(path.join(__dirname,'service-worker.js'),'utf8');
test('não exibe avisos históricos de rejeição/cancelamento como evento novo',()=>{
 assert.match(src,/terminalOld/);
 assert.match(src,/:rejected:/);
 assert.match(src,/:cancelled:/);
 assert.match(src,/STARTED_AT-120000/);
});
test('pergunta nota da experiência após checkout bem sucedido',()=>{
 assert.match(src,/Como foi sua experiência para fazer este pedido/);
 assert.match(src,/CHECKOUT_RATING/);
});
test('pergunta nota do pedido quando o status é concluído',()=>{
 assert.match(src,/ENTREGUE.*RETIRADO.*CONCLUIDO.*FINALIZADO/);
 assert.match(src,/Avalie seu pedido/);
 assert.match(src,/commerceEvent\('RATING'/);
});
test('PWA mantém hotfix 9.3.2 dentro do cache V9.3.3',()=>{
 assert.match(sw,/caseirinho-loja-v9\.3\.3-rejection-once/);
 assert.match(sw,/store-hotfix-v9-3-2\.js/);
 assert.match(sw,/store-hotfix-v9-3-3\.js/);
});
