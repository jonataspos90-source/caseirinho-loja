const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const app=fs.readFileSync('app.js','utf8');
const sw=fs.readFileSync('service-worker.js','utf8');

test('entrega fica sempre a combinar',()=>{assert.match(app,/E\('time'\)\.value='A combinar'/);assert.match(app,/horario:mode==='ENTREGA'\?'A combinar'/)});
test('todo pedido de entrega exige confirmação do frete',()=>{assert.match(app,/confirmDeliveryExperience/);assert.match(app,/Este pedido terá valor de entrega/)});
test('cotação do ERP aceita sim ou não no app',()=>{assert.match(app,/shipping-decision/);assert.match(app,/data-shipping-yes/);assert.match(app,/data-shipping-no/)});
test('aceite mostra popup e pix',()=>{assert.match(app,/Seu pedido foi aceito!/);assert.match(app,/PIX disponível/);assert.match(app,/data-copy-pix/)});
test('horário posterior gera aviso',()=>{assert.match(app,/Horário de entrega confirmado/);assert.match(app,/orderTimeText/)});
test('polling de pedidos é leve e separado do catálogo',()=>{assert.match(app,/pollCustomerOrders/);assert.match(app,/6000/)});
test('cache PWA foi versionado',()=>{assert.match(sw,/caseirinho-loja-v9\.1\.3-freight-actions/)});


test('recusa do frete apresenta cancelamento e convite para novo pedido',()=>{
  assert.match(app,/title:'Pedido cancelado'/);
  assert.match(app,/Fazer novo pedido/);
  assert.match(app,/st==='CANCELADO'/);
  assert.match(app,/data-new-order/);
});

test('V9.1.3 memoriza cliente e endereço no navegador',()=>{
  assert.match(app,/CUSTOMER_PROFILE_KEY/);
  assert.match(app,/saveCustomerProfileFromBody/);
  assert.match(app,/applyCustomerProfile/);
  assert.match(app,/Você pode alterar o CEP ou o número/);
});

test('V9.1.3 cotação usa revisão e polling mais rápido',()=>{
  assert.match(app,/freteCotacaoVersao/);
  assert.match(app,/quoteRevision/);
  assert.match(app,/6000/);
  assert.match(app,/Novo valor de entrega/);
});


test('histórico do cliente pode ser sincronizado do servidor',()=>{
  assert.match(app,/CUSTOMER_HISTORY_KEY/);
  assert.match(app,/orders\/history-session/);
  assert.match(app,/orders\/history\?session=/);
  assert.match(app,/mergeHistoryOrders/);
});

test('recuperação de pedidos exige WhatsApp e código de pedido',()=>{
  assert.match(app,/recoverOrdersForm/);
  assert.match(app,/codigoPedido/);
  assert.match(app,/orders\/history-recover/);
  assert.match(app,/Recuperar pedidos/);
});


test('decisão de frete usa sessão de histórico quando token individual não existe',()=>{
  assert.match(app,/historySession:historySession\|\|undefined/);
  assert.match(app,/if\(!token&&!historySession\)/);
  assert.match(app,/Abra Meus Pedidos e recupere seu histórico/);
});

test('Meus Pedidos mantém CTA explícito para aprovar ou cancelar frete',()=>{
  assert.match(app,/Sim, aprovar frete/);
  assert.match(app,/Não, cancelar pedido/);
  assert.match(app,/Novo valor de entrega aguardando sua resposta/);
});

test('app sincroniza histórico novamente ao voltar para a tela',()=>{
  assert.match(app,/await ensureHistorySession\(\)/);
  assert.match(app,/await syncCustomerHistory\(\)/);
});
