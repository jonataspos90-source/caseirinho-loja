const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

const pix=fs.readFileSync('pix-payment-v9-3-7.js','utf8');
const html=fs.readFileSync('index.html','utf8');
const sw=fs.readFileSync('service-worker.js','utf8');

test('PIX 9.3.7 possui JavaScript sintaticamente válido',()=>{
  assert.doesNotThrow(()=>new Function(pix));
});

test('App usa o CNPJ PIX oficial do Caseirinho',()=>{
  assert.match(pix,/69195483000123/);
  assert.match(pix,/69\.195\.483\/0001-23/);
});

test('cliente pode gerar QR e copiar PIX copia e cola',()=>{
  assert.match(pix,/Gerar QR Code PIX/);
  assert.match(pix,/Copiar PIX copia e cola/);
  assert.match(pix,/copiaECola/);
  assert.match(pix,/qrCodeDataUrl/);
});

test('QR é solicitado pela rota segura do pedido',()=>{
  assert.match(pix,/\/orders\/.*\/pix/);
  assert.match(pix,/historySession/);
  assert.match(pix,/publicToken/);
});

test('Loja e PWA carregam PIX 9.3.7',()=>{
  assert.match(html,/pix-payment-v9-3-7\.js\?v=9370/);
  assert.match(sw,/PIX937='\.\/pix-payment-v9-3-7\.js'/);
  assert.match(sw,/pix-payment-v9-3-7\.js/);
});
