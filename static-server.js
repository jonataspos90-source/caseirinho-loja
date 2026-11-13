'use strict';
/* Servidor dos arquivos PUBLICADOS da loja. Credenciais e regras de negócios ficam na API privada.
 * Não oferece listagem de diretórios, fontes do projeto, arquivos de testes ou mapas de código.
 * O HTML/JS/CSS enviados ao navegador continuam inspecionáveis pelo visitante (limite inerente à web).
 */
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const {pipeline}=require('node:stream');
const ROOT=__dirname;
const PORT=Number(process.env.PORT)||8080;
const MIME={
 '.html':'text/html; charset=utf-8',
 '.css':'text/css; charset=utf-8',
 '.js':'text/javascript; charset=utf-8',
 '.json':'application/json; charset=utf-8',
 '.webmanifest':'application/manifest+json; charset=utf-8',
 '.svg':'image/svg+xml',
 '.png':'image/png',
 '.jpg':'image/jpeg',
 '.jpeg':'image/jpeg',
 '.webp':'image/webp',
 '.gif':'image/gif',
 '.ico':'image/x-icon',
 '.woff':'font/woff',
 '.woff2':'font/woff2',
 '.pdf':'application/pdf'
};
const PUBLIC_HTML=new Set(['index.html','privacidade.html','exclusao-de-dados.html']);
const NEVER_PUBLIC=new Set(['static-server.js','package.json','package-lock.json','railway.json','Dockerfile','.env']);
function respond(res,code,message){
 res.writeHead(code,{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store'});
 res.end(message);
}
const server=http.createServer((req,res)=>{
 res.setHeader('X-Content-Type-Options','nosniff');
 res.setHeader('X-Frame-Options','DENY');
 res.setHeader('Referrer-Policy','strict-origin-when-cross-origin');
 res.setHeader('Permissions-Policy','camera=(), microphone=(), geolocation=()');
 res.setHeader('Strict-Transport-Security','max-age=31536000');
 if(req.method!=='GET'&&req.method!=='HEAD')return respond(res,405,'Método não permitido.');
 let pathname;
 try{
  pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
 }catch(_){return respond(res,400,'Requisição inválida.');}
 if(pathname==='/health')return respond(res,200,'OK');
 if(pathname==='/')pathname='/index.html';
 if(pathname.includes('\\')||pathname.includes('\0')||pathname.split('/').some(part=>part==='..'||part.startsWith('.')))return respond(res,404,'Não encontrado.');
 const relative=pathname.replace(/^\/+/,''),base=path.posix.basename(relative),extension=path.posix.extname(relative).toLowerCase();
 if(NEVER_PUBLIC.has(base)||base.endsWith('.test.js')||!MIME[extension]||
   (extension==='.html'&&!PUBLIC_HTML.has(relative)))return respond(res,404,'Não encontrado.');
 const file=path.resolve(ROOT,relative);
 if(!file.startsWith(ROOT+path.sep))return respond(res,404,'Não encontrado.');
 fs.stat(file,(err,stat)=>{
  if(err||!stat.isFile())return respond(res,404,'Não encontrado.');
  res.setHeader('Content-Type',MIME[extension]);
  res.setHeader('Content-Length',stat.size);
  res.setHeader('Cache-Control',extension==='.html'||base==='service-worker.js'||extension==='.webmanifest'?
    'no-cache, no-store, must-revalidate':'public, max-age=300');
  res.statusCode=200;
  if(req.method==='HEAD')return res.end();
  pipeline(fs.createReadStream(file),res,()=>{});
 });
});
server.listen(PORT,'0.0.0.0',()=>console.log('Loja Caseirinho ativa na porta '+PORT));
