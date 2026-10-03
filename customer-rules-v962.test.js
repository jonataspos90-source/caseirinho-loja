const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

const ux=fs.readFileSync('commerce-engagement-v9-6-1.js','utf8');
const html=fs.readFileSync('index.html','utf8');

test('avaliação abre em modal único e não usa card inline',()=>{
  assert.match(ux,/ce962Overlay/);
  assert.match(ux,/showRatingModal/);
  assert.match(ux,/cleanupLegacyRatings/);
  assert.match(ux,/\.ce961-rating\{display:none!important\}/);
  assert.doesNotMatch(ux,/function ratingHtml/);
});

test('estrela apenas seleciona nota e envio ocorre em um único botão',()=>{
  assert.match(ux,/data-ce962-star/);
  assert.match(ux,/selectedRating=N\(b\.dataset\.ce962Star\)/);
  assert.match(ux,/Enviar avaliação/);
  assert.match(ux,/ce962Comment/);
  assert.match(ux,/postEvent\('RATING'/);
});

test('observação da avaliação é opcional',()=>{
  assert.match(ux,/observação\? <span[^>]*>\(opcional\)/i);
  assert.match(ux,/const btn=E\('ce962Send'\),status=E\('ce962Status'\),who=identity\(\),comment=S\(E\('ce962Comment'\)\?\.value\)\.trim\(\)/);
});

test('cashback não acumula com cupom e reserva é liberada',()=>{
  assert.match(ux,/function couponActive/);
  assert.match(ux,/Cashback não é cumulativo com cupom/);
  assert.match(ux,/releaseReservation\(\)/);
  assert.match(ux,/Para usar cashback, remova o cupom primeiro/);
});

test('index carrega a regra nova diretamente',()=>{
  assert.match(html,/commerce-engagement-v9-6-1\.js\?v=9620/);
  assert.match(html,/engagementVersion:'9\.6\.2'/);
});
