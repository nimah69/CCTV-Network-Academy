import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFileSync, existsSync } from "node:fs";
import { resolve, extname } from "node:path";
import { spawnSync } from "node:child_process";
const root=resolve(".");
const chromeCandidates=["google-chrome","google-chrome-stable","chromium","chromium-browser"];
function findChrome(){for(const name of chromeCandidates){const r=spawnSync("which",[name],{encoding:"utf8"});if(r.status===0&&r.stdout.trim())return r.stdout.trim()}return null}
test("headless browser exercises interactive workshops and engineering calculators",async()=>{
 const chrome=findChrome();
 assert.ok(chrome,"A headless Chromium/Chrome binary is required for browser smoke tests.");
 const server=createServer((req,res)=>{
  const pathname=decodeURIComponent(new URL(req.url,"http://localhost").pathname);
  const file=resolve(root,"."+pathname);
  if(!file.startsWith(root)){res.writeHead(403);res.end("forbidden");return}
  if(!existsSync(file)){res.writeHead(404);res.end("not found: "+pathname);return}
  const ext=extname(file),mime=ext===".html"?"text/html; charset=utf-8":ext===".js"?"text/javascript; charset=utf-8":ext===".css"?"text/css; charset=utf-8":ext===".json"?"application/json; charset=utf-8":"application/octet-stream";
  res.writeHead(200,{"Content-Type":mime,"Cache-Control":"no-store"});res.end(readFileSync(file));
 });
 await new Promise(resolveListen=>server.listen(0,"127.0.0.1",resolveListen));
 try{
  const address=server.address();
  for(const width of [360,768,1280]){
   const result=spawnSync(chrome,["--headless=new","--no-sandbox","--disable-gpu","--disable-dev-shm-usage","--disable-extensions","--disable-background-networking",`--window-size=${width},900`,"--virtual-time-budget=10000","--dump-dom",`http://127.0.0.1:${address.port}/tests/browser-smoke.html`],{encoding:"utf8",timeout:45000,maxBuffer:8*1024*1024});
   assert.equal(result.status,0,"Chrome exited unsuccessfully at "+width+"px:\\n"+result.stderr.slice(-4000));
   assert.match(result.stdout,/data-smoke-result="pass"/,"Browser smoke failed at "+width+"px:\\n"+result.stdout.slice(-5000)+"\\n"+result.stderr.slice(-4000));
   assert.match(result.stdout,new RegExp('data-smoke-width="'+width+'"'),"Browser viewport was not "+width+"px");
  assert.doesNotMatch(result.stderr,/Uncaught (?:TypeError|ReferenceError|SyntaxError)|Failed to load module script|net::ERR_FAILED/,"Browser console/network errors:\n"+result.stderr.slice(-5000));
 }finally{await new Promise(resolveClose=>server.close(resolveClose))}
});
