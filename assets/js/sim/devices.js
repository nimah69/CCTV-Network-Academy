import { createGraph } from "./graph.js";
export const camera=(id,ip,port="eth0",extra={})=>({id,type:"camera",ip,prefix:24,poeRequired:true,minPoeW:10,rtspEnabled:true,firmware:"stable",clockSynced:true,irHealthy:true,ports:[{id:port,vlan:10}],...extra});
export const poeSwitch=(id,ports=8,budgetW=120,extra={})=>({id,type:"poe-switch",poeBudgetW:budgetW,ports:Array.from({length:ports},(_,i)=>({id:"p"+(i+1),vlan:10,adminUp:true,speedMbps:1000,poeEnabled:true,poeBudgetW:30,poeDrawW:0})),...extra});
export const nvr=(id,ip,extra={})=>({id,type:"nvr",ip,prefix:24,vlan:10,recordingEnabled:true,diskHealthy:true,freeStorageTB:4,firmware:"stable",clockSynced:true,hdmiConnected:true,ports:[{id:"eth0",vlan:10}],...extra});
export const router=(id,ip,extra={})=>({id,type:"router",ip,prefix:24,ports:[{id:"lan1",vlan:10},{id:"uplink",vlan:10}],...extra});
export const ups=(id,capacityWh,extra={})=>({id,type:"ups",capacityWh,chargePercent:100,healthFactor:0.8,ports:[{id:"out1"}],...extra});
export const monitor=(id,extra={})=>({id,type:"monitor",input:"HDMI1",resolution:"1920x1080",ports:[{id:"hdmi"}],...extra});
export function assembleNetwork({nodes,links,vlans=[{id:10,name:"CCTV"}]}){return createGraph({nodes,links,vlans})}
