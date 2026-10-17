// Time is virtual minutes; cost is an abstract training unit, not a real currency.
const COSTS=Object.freeze({
 "factory-reset":{minutes:30,cost:25},
 ping:{minutes:1,cost:1},arp:{minutes:1,cost:1},traceroute:{minutes:2,cost:2},
 showPoe:{minutes:2,cost:1},"switch-console":{minutes:3,cost:1},
 cableTest:{minutes:4,cost:2},"cable-tester":{minutes:4,cost:2},
 multimeter:{minutes:2,cost:1},"poe-tester":{minutes:3,cost:2},
 systemLog:{minutes:3,cost:1},"system-log":{minutes:3,cost:1},
 webCamera:{minutes:2,cost:1},"web-camera":{minutes:2,cost:1},
 nvrCheck:{minutes:2,cost:1},nvr:{minutes:2,cost:1},
 reboot:{minutes:8,cost:4},replaceCable:{minutes:15,cost:12},replaceDevice:{minutes:25,cost:30},
 "enable-port":{minutes:3,cost:1},"increase-budget":{minutes:20,cost:5},
 "fix-ip":{minutes:5,cost:1},"select-hdmi":{minutes:2,cost:1},"free-storage":{minutes:10,cost:2},
 "match-duplex":{minutes:5,cost:1},"fix-vlan":{minutes:8,cost:2},"fix-subnet":{minutes:5,cost:1},
 "fix-clock":{minutes:5,cost:1},"break-loop":{minutes:10,cost:3},"fix-acl":{minutes:8,cost:2},
 "upgrade-uplink":{minutes:40,cost:50},"adjust-ir":{minutes:10,cost:5},"rollback-firmware":{minutes:15,cost:5},
 "replace-battery":{minutes:20,cost:35},"reroute-cable":{minutes:20,cost:8}
});
export function scoreAttempt({selectedCause,rootCause,actions=[],optimalPath=[],downtimeMinutes=0,hintsUsed=0,unsafeActions=[]}={}){
 const correct=selectedCause===rootCause,necessary=new Set(optimalPath),unneeded=actions.filter(a=>!necessary.has(a)),order=actions.filter(a=>necessary.has(a));
 let score=correct?100:0;score-=Math.min(35,unneeded.length*5);score-=Math.min(20,Math.max(0,downtimeMinutes)*0.5);score-=Math.min(30,hintsUsed*10);score-=Math.min(50,unsafeActions.length*20);
 let last=-1,misordered=0;for(const action of order){const i=optimalPath.indexOf(action);if(i<last)misordered++;last=Math.max(last,i)}score-=misordered*5;
 return {correct,score:Math.max(0,Math.round(score)),unnecessaryActions:unneeded,misordered,unsafeActions,downtimeMinutes,actions,optimalPath};
}
export function getHint(scenario,level=1){const index=Math.max(1,Math.min(3,Number(level)))-1;return scenario.hints?.[index]||["ابتدا وضعیت برق و لینک فیزیکی را بررسی کن.","نتیجه تست پورت یا IP را با علائم مشتری مقایسه کن.","وابستگی‌ای را پیدا کن که پس از آن همه سرویس‌ها مختل شده‌اند."][index]}
export function actionCost(action){return COSTS[action]||{minutes:2,cost:1}}
