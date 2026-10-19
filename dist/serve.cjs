/* Optional local-only launcher. No dependencies beyond Node.js. */
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const {execFile} = require('node:child_process');
const root = __dirname;
const port = Number(process.env.DIGIDICE_PORT || 8765);
if (!Number.isInteger(port) || port < 1024 || port > 65535) {
  console.error('Choose a local port between 1024 and 65535.');process.exit(1);
}
const url = `http://127.0.0.1:${port}/`;
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.png':'image/png','.mp3':'audio/mpeg','.txt':'text/plain; charset=utf-8','.md':'text/plain; charset=utf-8'};
const server = http.createServer((req,res)=>{
  if (!['GET','HEAD'].includes(req.method)) {res.writeHead(405);res.end('Read-only app.');return;}
  let file;
  try {
    const pathname=decodeURIComponent(new URL(req.url,url).pathname);
    file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
    if (!file.startsWith(root+path.sep)) {res.writeHead(403);res.end('Outside app folder.');return;}
  } catch {res.writeHead(400);res.end('Invalid path.');return;}
  fs.stat(file,(error,stat)=>{
    if(error || !stat.isFile()){res.writeHead(404);res.end('App file not found.');return;}
    res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Content-Length':stat.size,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
    if(req.method==='HEAD'){res.end();return;}
    const stream=fs.createReadStream(file);stream.on('error',()=>res.destroy());stream.pipe(res);
  });
});
server.on('error',error=>{
  if(error.code==='EADDRINUSE') console.error('The preview port is already in use. If DIGIDICE is running, open '+url);
  else console.error(error.message);
  process.exitCode=1;
});
server.listen(port,'127.0.0.1',()=>{
  console.log('DIGIDICE is ready: '+url);
  console.log('Close this window to stop the local preview.');
  if(process.env.DIGIDICE_OPEN==='1'){
    if(process.platform==='win32') execFile('cmd.exe',['/d','/c','start','',url],{windowsHide:true},()=>{});
    else console.log('Open the address above in your browser.');
  }
});
