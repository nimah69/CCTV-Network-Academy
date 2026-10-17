const COSTS=Object.freeze({ping:{minutes:1,cost:1},showPoe:{minutes:2,cost:1},cableTest:{minutes:4,cost:2},reboot:{minutes:8,cost:4},factoryReset:{minutes:30,cost:25},replaceCable:{minutes:15,cost:12},replaceDevice:{minutes:25,cost:30}});
export function scoreAttempt({selectedCause,rootCause,actions=[],optimalPath=[],downtimeMinutes=0,hintsUsed=0,unsafeActions=[]}={}){
 const correct=selectedCause===rootCause,necessary=new Set(optimalPath),unneeded=actions.filter(a=>!necessary.has(a)),order=actions.filter(a=>necessary.has(a));
 let score=correct?100:0;score-=Math.min(35,unneeded.length*5);score-=Math.min(20,Math.max(0,downtimeMinutes)*0.5);score-=Math.min(30,hintsUsed*10);score-=Math.min(50,unsafeActions.length*20);
 let last=-1,misordered=0;for(const action of order){const i=optimalPath.indexOf(action);if(i<last)misordered++;last=Math.max(last,i)}score-=misordered*5;
 return {correct,score:Math.max(0,Math.round(score)),unnecessaryActions:unneeded,misordered,unsafeActions,downtimeMinutes,actions,optimalPath};
}
export function getHint(scenario,level=1){const index=Math.max(1,Math.min(3,Number(level)))-1;return scenario.hints?.[index]||["ابتدا وضعیت برق و لینک فیزیکی را بررسی کن.","نتیجه تست پورت یا IP را با علائم مشتری مقایسه کن.","وابستگی‌ای را پیدا کن که پس از آن همه سرویس‌ها مختل شده‌اند."][index]}
export function actionCost(action){return COSTS[action]||{minutes:2,cost:1}}
