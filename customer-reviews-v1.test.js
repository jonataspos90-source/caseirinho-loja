const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const script=fs.readFileSync('customer-reviews-v1.js','utf8');
const html=fs.readFileSync('index.html','utf8');
const sw=fs.readFileSync('service-worker.js','utf8');
const engagement=fs.readFileSync('commerce-engagement-v9-6-1.js','utf8');

test('loja oferece avaliações acessíveis com nota, pedido e comentário',()=>{
  for(const id of ['avaliacoes','lista-avaliacoes','rating-stars','experienceOrder','input-comentario','experienceSubmit'])
    assert.match(html,new RegExp('id="'+id+'"'));
  assert.match(html,/customer-reviews-v1\.js/);
  assert.match(html,/customer-reviews-v1\.css/);
});
test('lista pública consulta API real, sem avaliações fictícias',()=>{
  assert.match(script,/url\+'\/reviews/);
  assert.match(script,/loadReviews\(\)/);
  assert.doesNotMatch(html,/Maria Silva|Carlos Eduardo|Marmita executiva/);
});
test('comentários renderizados como texto, sem HTML arbitrário',()=>{
  assert.match(script,/comment\.textContent=/);
  assert.match(script,/review\.appendChild\(comment\)/);
  assert.doesNotMatch(script,/insertAdjacentHTML|innerHTML/);
});
test('nota depende de token, pedido entregue e registro na API',()=>{
  assert.match(script,/experience\?token=/);
  assert.match(script,/statusDone\(d\.status\)/);
  assert.match(script,/publicToken/);
  assert.match(script,/method:'POST'/);
  assert.match(script,/orderId:order\.id,token:order\.token,rating:selected/);
  assert.match(engagement,/Avaliações e Experiências após a entrega/);
  assert.doesNotMatch(engagement,/postEvent\('RATING'/);
});
test('PWA armazena as versões novas dos arquivos',()=>{
  assert.match(sw,/REVIEWSJS,REVIEWSCSS/);
  assert.match(sw,/caseirinho-loja-v9\.10\.14-avaliacoes-erp/);
});
