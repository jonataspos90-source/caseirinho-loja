'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const js=fs.readFileSync('app.js','utf8');
const from=js.indexOf('function productDescription(p){'),to=js.indexOf('function cartProductNameKey',from);
if(from<0||to<0)throw Error('productDescription não encontrada');
const fn=new Function('S','norm',js.slice(from,to)+';return productDescription;')(
 x=>String(x??''),x=>String(x??'').toUpperCase());
test('Descrição editada no ERP vence texto gerado automaticamente para empadas',()=>{
 assert.equal(fn({categoria:'Empadas',nome:'Empada com Palmito',descricao:'Palmito com requeijão cremoso e azeitonas.'}),
 'Palmito com requeijão cremoso e azeitonas.');
});
test('Descrição editada prevalece sobre texto da grade',()=>{
 assert.equal(fn({nome:'Lasanha M',descricao:'Receita caseira de massa fresca.',gradeDescricao:'Texto antigo'}),
 'Receita caseira de massa fresca.');
});
test('Produtos antigos sem descrição comercial continuam usando a grade',()=>{
 assert.equal(fn({nome:'Kibe forno',gradeDescricao:'Recheio artesanal.'}),'Recheio artesanal.');
});
test('Novo PWA carrega app.js da versão que respeita a descrição comercial',()=>{
 const sw=fs.readFileSync('service-worker.js','utf8'),html=fs.readFileSync('index.html','utf8');
 assert.match(sw,/caseirinho-loja-v9\.10\.73-product-descriptions-20261110/);
 assert.match(html,/app\.js\?v=20261110-product-description-1/);
 assert.match(sw,/20261110-product-description-1/);
 assert.doesNotThrow(()=>new vm.Script(sw));
});
