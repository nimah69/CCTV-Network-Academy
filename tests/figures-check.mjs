import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import path from "node:path";
const root=process.cwd();
const css=fs.readFileSync(path.join(root,"js/figures.js"),"utf8");
const data=fs.readFileSync(path.join(root,"js/figures-data.js"),"utf8");
assert.ok(!/https?:\/\//.test(css+data),"Figure files must not contain external URLs");
const document={readyState:"complete",head:{insertAdjacentHTML(){}},body:{insertAdjacentHTML(){}},getElementById(){return null},querySelectorAll(){return []},addEventListener(){}};
const context={document,console,MutationObserver:function(){this.observe=()=>{}},setTimeout,clearTimeout};
context.window=context;
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(root,"js/calculations.js"),"utf8"),context);
vm.runInContext(data,context);
vm.runInContext(css,context);
const api=context.CCTVFigures,bank=context.CCTVFigureBank;
assert.ok(api&&typeof api.render==="function"&&typeof api.figuresHTML==="function");
const specs=Object.values(bank.byChapter).flat();
const types=["flow","ladder","bar","stacked","matrix","timeline","compare","coverage","bits","tree","capacity"];
const sample={id:"escape-test",title:'<tag> & "quote"',desc:"safe & clear",note:"limited",caption:"look",source:"general",chapter:1,items:[{label:"one",detail:"two"}],nodes:[{label:"node"}],bars:[{label:"bar",value:50,kind:"data"}]};
function balanced(svg){const stack=[];for(const m of svg.matchAll(/<\/?([a-zA-Z][\w:-]*)(?:\s[^<>]*?)?\s*\/?>/g)){const tag=m[1],raw=m[0];if(raw.startsWith("</")){assert.equal(stack.pop(),tag,"unbalanced SVG tag "+tag)}else if(!raw.endsWith("/>"))stack.push(tag)}assert.deepEqual(stack,[],"unclosed SVG tags")}
for(const type of types){const svg=api.render({...sample,type});assert.equal(typeof svg,"string");assert.match(svg,/<svg\b[^>]*role="img"/);assert.match(svg,/<title\b/);assert.match(svg,/<desc\b/);assert.doesNotMatch(svg,/<script\b|\son[a-z]+\s*=|style="[^"]*#/i);assert.doesNotMatch(svg,/href\s*=\s*["']https?:/i);assert.doesNotMatch(svg,/#(?:[0-9a-f]{3,8})\b/i,"SVG colors must use semantic CSS classes/variables");balanced(svg)}
const escaped=api.render({...sample,type:"flow"});assert.ok(escaped.includes("&lt;tag&gt; &amp; &quot;quote&quot;"),"SVG text must be escaped");
for(const s of specs){assert.ok(s.source&&s.chapter&&s.note&&s.title&&s.caption, "metadata required: "+s.id);const html=api.figureHTML(s);assert.match(html,/<figure\b/);assert.match(html,/<figcaption>/);assert.doesNotMatch(html,/راهنمای نشانه‌ها/,'Each figure must not repeat the full legend');assert.ok(html.includes(s.note));const svg=api.render(s);const vb=svg.match(/viewBox="0 0 (\d+) (\d+)"/);assert.ok(vb&&Number(vb[1])<=360,"viewBox too wide: "+s.id);const fontSizes=[...svg.matchAll(/font-size="(\d+(?:\.\d+)?)"/g)].map(m=>Number(m[1]));assert.ok(fontSizes.every(n=>n>=12),"font under 12: "+s.id)}
assert.match(css,/\.fig-svg text\{[^}]*font-size:(?:1[2-9]|[2-9][0-9])px/,"SVG text must default to at least 12 CSS pixels");
const semantic=api.semantic;const markers=Object.values(semantic).map(v=>v.marker);assert.equal(new Set(markers).size,markers.length,"semantic markers must be unique");
const textCss=css.match(/const css=\`([\s\S]*?)\`;/)?.[1]||"";
function luminance(hex){const rgb=hex.match(/[a-f\d]{2}/ig).map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return .2126*rgb[0]+.7152*rgb[1]+.0722*rgb[2]}
function contrast(a,b){const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)}
const bg="#101b2d",tokens=[["--fig-data","#5b9cff"],["--fig-image","#40d9e7"],["--fig-power","#f2b84b"],["--fig-storage","#b7a0ff"],["--fig-risk","#ff8292"],["--fig-good","#39d6a0"],["--fig-neutral","#a9bad2"]];
for(const [name,color] of tokens){assert.ok(contrast(color,bg)>=3,name+" graphic contrast <3: "+contrast(color,bg));assert.ok(contrast(color,bg)>=4.5,name+" text contrast <4.5: "+contrast(color,bg))}
assert.ok(Buffer.byteLength(css+data,"utf8")<=150*1024,"Figure bundle exceeds 150 KB");
for(const s of specs.filter(x=>x.source==="calculation")){const html=api.figureHTML(s);const c=context.CCTVCalculations;if(s.id==="ch3-poe"){assert.equal(c.poe(8,12,25).total,120);assert.ok(html.includes("120"));}if(s.id==="ch3-bandwidth"){assert.equal(c.bandwidth(16,4,30).total,83.2);assert.ok(html.includes("83.2"));}if(s.id==="ch3-storage"){assert.ok(Math.abs(c.storage(8,4,14,0).tb-4.8384)<1e-9,"Storage baseline should be approximately 4.8384 TB");assert.ok(Math.abs(c.storage(8,4,14,10).withHeadroom-5.32224)<1e-9,"Storage with headroom should be approximately 5.32224 TB");assert.ok(html.includes("4.8384")&&html.includes("5.32224"))}if(s.id==="ch1-bits"){const r=c.subnet("192.168.10.130",26);assert.deepEqual([r.networkText,r.firstText,r.lastText,r.broadcastText,r.hostCount],["192.168.10.128","192.168.10.129","192.168.10.190","192.168.10.191",62]);assert.ok(html.includes("192.168.10.128")&&html.includes("62"))}}
const chapterFigures=api.figuresHTML(0);assert.match(chapterFigures,/<details class="fig-legend-global">/,"Chapter figures need one collapsible shared legend");assert.equal((chapterFigures.match(/راهنمای نشانه‌های شماتیک‌ها/g)||[]).length,1,"The full schematic legend must appear exactly once per chapter");
assert.ok(css.includes("data-fig-tool-legend") && css.includes("fig-tool-legend"),"Interactive tools must provide one shared legend");
assert.equal((css.match(/\+legend\(\)\+\x27<\/figure>\x27/g)||[]).length,0,"Generated calculator diagrams must not repeat the legend under each figure");
assert.ok(css.includes(".fig-legend-global>summary:focus-visible"),"Shared legend summary must have a visible keyboard-focus state");
const risk=api.render(bank.byChapter["7"][0]);
assert.match(risk,/پیامد: کم ← زیاد/,"Risk matrix must label its horizontal axis in Persian");
assert.match(risk,/احتمال: کم در بالا، زیاد در پایین/,"Risk matrix must explain the vertical axis in Persian");
const capacity=api.render({...sample,type:"capacity",percent:82,limit:70,label:"اشغال لینک",detail:"بار فعلی",status:"از حد طراحی بالاتر است"});
assert.match(capacity,/حد طراحی/,"Capacity chart must label its threshold");
assert.match(capacity,/fig-fill-risk/,"Capacity chart must flag usage above the design threshold");
assert.match(capacity,/۸۲|82/,"Capacity chart must expose the actual measured percentage");
assert.ok(css.includes("root.CCTVCalculations") && css.includes("c.bandwidth") && css.includes("c.storage"),"Tool diagrams must use actual calculation functions");
assert.ok(!css.includes("text.matchAll(/\\d+(?:\\.\\d+)?/g)"),"Tool diagrams must not infer values by parsing formatted result text");
const semanticFlow=api.render({...sample,type:"flow",nodes:[{label:"دوربین IP",kind:"data"},{label:"سوئیچ PoE",kind:"power"}]});
assert.match(semanticFlow,/fig-node-data/,"Flow nodes must visually identify data roles");
assert.match(semanticFlow,/fig-node-power/,"Flow nodes must visually identify power roles");
const timeline=api.render({...sample,type:"timeline",items:[{label:"مرحله اول",detail:"توضیح فارسی"}]});
assert.match(timeline,/x="298" y="22" text-anchor="end"/,"Timeline labels must be aligned for Persian RTL");
assert.ok(css.includes('.fig-legend .power::before{content:"▲"') && css.includes('.fig-legend .good::before{content:"✓"'),"Legend must use distinct semantic symbols, not only colored lines");
const bits=api.render(bank.byChapter["1"].find(x=>x.id==="ch1-bits"));
assert.match(bits,/شبکه \(N\)/,"Subnet diagram must identify network bits");
assert.match(bits,/میزبان \(H\)/,"Subnet diagram must identify host bits");
assert.match(bits,/fig-bit-network/,"Network bits need a distinct visual treatment");
assert.match(bits,/fig-bit-host/,"Host bits need a distinct visual treatment");
const coverage=api.render(bank.byChapter["2"].find(x=>x.id==="ch2-coverage"));
assert.match(coverage,/شناسایی/,"Camera coverage concepts should be localized into Persian");
const raid=api.render(bank.byChapter["6"].find(x=>x.id==="ch6-raid-backup"));
assert.match(raid,/نسخه مستقل کمک[\\s\\S]*می‌کند/,"RAID and independent backup must be distinguished clearly even when wrapped across SVG lines");
assert.ok(!raid.includes('<text x="330" y='),"RAID matrix must not place a row label on top of its cells");
const decision=api.render(bank.byChapter["9"].find(x=>x.id==="ch9-offline-tree"));
assert.match(decision,/بله:/,"Troubleshooting tree must show the positive decision branch");
assert.match(decision,/خیر:/,"Troubleshooting tree must show the negative decision branch");
assert.match(decision,/fig-branch-good/,"Positive branch must have a visible semantic color");
assert.match(decision,/fig-branch-risk/,"Negative branch must have a visible semantic color");
console.log(JSON.stringify({status:"passed",types:types.length,figures:specs.length,bytes:Buffer.byteLength(css+data,"utf8")},null,2));
