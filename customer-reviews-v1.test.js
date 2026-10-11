const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const script=fs.readFileSync('customer-reviews-v1.js','utf8');
const html=fs.readFileSync('index.html','utf8');
const app=fs.readFileSync('app.js','utf8');
const sw=fs.readFileSync('service-worker.js','utf8');
const engagement=fs.readFileSync('commerce-engagement-v9-6-1.js','utf8');
test('Cardápio permanece dedicado às categorias sem bloco de avaliações',()=>{
  const catalog=html.slice(html.indexOf('id="catalogSection"'),html.indexOf('<footer class="footer">'));
  assert.match(catalog,/id="categories"/);
  assert.match(catalog,/id="products"/);
  assert.doesNotMatch(catalog,/id="avaliacoes"|reviews-showcase|lista-avaliacoes/);
  assert.doesNotMatch(html,/id="experienceForm"|id="experienceSubmit"|id="rating-stars"/);
});
test('barra inferior oferece estrela ao lado do Cardápio e abre janela como Loja',()=>{
  const nav=html.slice(html.indexOf('<nav class="bottom-nav'),html.indexOf('</nav>'));
  assert.match(nav,/id="navMenu"/);
  assert.match(nav,/id="navReviews"/);
  assert.ok(nav.indexOf('id="navMenu"')<nav.indexOf('id="navReviews"'));
  assert.ok(nav.indexOf('id="navReviews"')<nav.indexOf('id="navCart"'));
  assert.match(html,/<template id="reviewsViewTemplate">/);
  assert.match(app,/function showReviews\(\)/);
  assert.match(app,/openSimple\('⭐ Avaliações e Experiências',template\.innerHTML\)/);
  assert.match(app,/E\('navReviews'\)\.onclick=showReviews/);
  assert.match(script,/openShowcase:/);
});
test('área Avaliações mantém médias separadas e comentários reais',()=>{
  const template=html.slice(html.indexOf('<template id="reviewsViewTemplate">'),html.indexOf('</template>'));
  for(const id of ['avaliacoes','reviewsAppAvg','reviewsProductAvg','reviewsAppCount','reviewsProductCount','lista-avaliacoes'])
    assert.match(template,new RegExp('id="'+id+'"'));
});
test('notas e comentários reais são consultados do ERP e mostrados sem HTML inseguro',()=>{
  assert.match(script,/url\+'\/reviews/);
  assert.match(script,/data\.app/);
  assert.match(script,/data\.product/);
  assert.match(script,/p\.textContent=S\(r\.comment\)/);
  assert.doesNotMatch(html,/Maria Silva|Carlos Eduardo/);
});
test('avaliar produtos exige aceite confirmado no servidor e token de pedido',()=>{
  assert.match(script,/\/reviews\/status\?token=/);
  assert.match(script,/check\.allowedProduct/);
  assert.match(script,/kind:'PRODUCT'/);
  assert.match(script,/orderId:S\(order\.id\),token:S\(order\.publicToken\)/);
  assert.match(script,/onOrdersViewed/);
  assert.match(app,/data-review-order/);
  assert.match(app,/CaseirinhoReviewsV2\?\.onOrdersViewed/);
});
test('checkout mantém avaliação independente do APP após confirmar pedido',()=>{
  assert.match(engagement,/Avalie sua experiência no App/);
  assert.match(engagement,/kind:'APP'/);
  assert.match(engagement,/showRatingModal\(o\)/);
  assert.doesNotMatch(engagement,/postEvent\('RATING'/);
});
test('PWA recebe cache atualizado',()=>{
  assert.match(sw,/REVIEWSJS,REVIEWSCSS/);
  assert.match(sw,/caseirinho-loja-v9\.10\.16-avaliacoes-janela/);
});
