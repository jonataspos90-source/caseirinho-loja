'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const code=fs.readFileSync(path.join(__dirname,'store-hours-banner-v9-10-87.js'),'utf8');
const app=fs.readFileSync(path.join(__dirname,'app.js'),'utf8');
const html=fs.readFileSync(path.join(__dirname,'index.html'),'utf8');
const sw=fs.readFileSync(path.join(__dirname,'service-worker.js'),'utf8');
function ui(){
 const window={};
 const document={readyState:'loading',addEventListener(){}};
 vm.runInNewContext(code,{window,document,setInterval(){},console});
 return window.CaseirinhoHoursBanner;
}
function schedule(){
 return{timezone:'America/Sao_Paulo',dias:[0,1,2,3,4,5,6].map(dia=>({
   dia,ativo:dia>=1&&dia<=5,periodos:dia===1?[{inicio:'09:00',fim:'12:00'},{inicio:'13:00',fim:'18:00'}]:dia>=2&&dia<=5?[{inicio:'09:00',fim:'18:00'}]:[]
  })),excecoes:[],mensagemFechado:'Retornaremos em breve.'};
}
test('segundas com turno dividido exibem fechamento na hora do almoço',()=>{
 const hours=ui();const loja={horariosSemana:schedule()};
 const lunch=hours.getStatus(loja,new Date('2026-11-16T15:30:00Z'));
 assert.equal(lunch.closed,true);
 assert.equal(lunch.nextOpening,'hoje às 13:00');
 assert.equal(lunch.message,'Retornaremos em breve.');
 assert.equal(hours.getStatus(loja,new Date('2026-11-16T16:30:00Z')).closed,false);
});
test('fim de semana informa próximo dia de atendimento no fuso da loja',()=>{
 const hours=ui(),loja={horariosSemana:schedule()};
 assert.equal(hours.getStatus(loja,new Date('2026-11-15T16:00:00Z')).nextOpening,'amanhã às 09:00');
 const holiday={...schedule(),excecoes:[{data:'2026-11-16',ativo:false,periodos:[]}]};
 assert.equal(hours.getStatus({horariosSemana:holiday},new Date('2026-11-16T15:00:00Z')).nextOpening,'amanhã às 09:00');
});
test('compatibilidade com texto antigo e segurança quando não configurado',()=>{
 const hours=ui();
 assert.equal(hours.getStatus({horarioFuncionamento:'Seg a Sáb 09:00 às 18:00'},new Date('2026-11-15T16:00:00Z')).closed,true);
 assert.equal(hours.getStatus({horarioFuncionamento:'sem horário cadastrado'},new Date()),null);
});
test('loja carrega faixa antes do app, mantém pedidos durante fechamento e atualiza PWA',()=>{
 assert.ok(html.indexOf('store-hours-banner-v9-10-87.js')<html.indexOf('app.js?v='));
 assert.match(html,/store-hours-banner-v9-10-87\.css/);
 assert.match(sw,/store-hours-banner-v9-10-87\.js/);
 assert.match(sw,/caseirinho-loja-v9\.10\.88-store-hours/);
 assert.match(app,/CaseirinhoHoursBanner\?\.getStatus/);
 assert.match(app,/CaseirinhoHoursBanner\?\.refresh/);
 assert.match(code,/pedidos continuam abertos/i);
 assert.match(code,/Continuar comprando/);
});
