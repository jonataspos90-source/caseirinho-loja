const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

const app=fs.readFileSync('app.js','utf8');

test('selecionar categoria preserva o alvo e não recria a lista sem busca',()=>{
  const start=app.indexOf('function renderCategories(){');
  const end=app.indexOf('let categorySpyRaf=',start);
  const source=app.slice(start,end);
  assert.match(source,/const id=S\(b\.dataset\.cat\)/);
  assert.match(source,/if\(wasSearching\)renderProducts\(\)/);
  assert.match(source,/markActiveCategory\(id,true\)/);
  assert.match(source,/requestAnimationFrame\(\(\)=>requestAnimationFrame\(\(\)=>scrollToCategory\(id\)\)\)/);
  assert.doesNotMatch(source,/hideSearchResults\(\);\s*renderProducts\(\);/);
});

test('rolagem respeita a margem do cabeçalho fixo da loja',()=>{
  const start=app.indexOf('function scrollToCategory(id){');
  const end=app.indexOf('\nfunction renderCategories(){',start);
  const source=app.slice(start,end);
  assert.match(source,/getComputedStyle\(target\)\.scrollMarginTop/);
  assert.match(source,/window\.scrollTo\(\{top,behavior:'smooth'\}\)/);
});
