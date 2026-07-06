/* 网络诊断 + 离线本地建议（不依赖外部网络） */
function showNetDiag(){
  var tabs=document.querySelectorAll('.tab');
  for(var i=0;i<tabs.length;i++){
    if(tabs[i].getAttribute('data-t')==='net'){
      tabs[i].click();
      break;
    }
  }
  if(typeof runNetworkDiagnosis==='function'){
    runNetworkDiagnosis();
  }
}

async function runNetworkDiagnosis(){
  var el=document.getElementById('netBody');
  if(!el) return;
  el.innerHTML='<div style="color:var(--dim)">正在检测网络连通性...</div>';
  var checks=[
    {name:'腾讯实时行情', url:'https://qt.gtimg.cn/q=sh000001', kind:'text'},
    {name:'腾讯分时接口', url:'https://web.ifzq.gtimg.cn/appstock/app/minute/query?code=sh000001', kind:'json'},
    {name:'新浪财经7x24', url:'https://zhibo.sina.com.cn/api/zhibo/feed?page=1&page_size=1&zhibo_id=152&tag_id=0&type=0', kind:'json'},
    {name:'东方财富快讯', url:'https://np-listapi.eastmoney.com/comm/web/getNewsByColumns?client=web&biz=web_home_channel&column=350&order=1&needInteractData=0&page_index=1&page_size=1', kind:'json'},
    {name:'MiMo接口可达性(示例)', url:'https://api.xiaomimimo.com/', kind:'text'}
  ];
  var results=[];
  for(var i=0;i<checks.length;i++){
    var c=checks[i];
    var t0=Date.now();
    var ok=false;
    var detail='';
    try{
      var r=await fetch(c.url,{signal:AbortSignal.timeout(8000)});
      if(c.kind==='json'){
        try{ await r.json(); ok=true; }catch(e){ ok=false; detail='JSON解析失败'; }
      } else {
        ok=r.ok;
        if(!ok) detail='HTTP '+r.status;
      }
    }catch(e){
      ok=false;
      if(String(e.name)==='TimeoutError' || String(e.message || '').indexOf('signal is aborted')>=0){
        detail='请求超时';
      } else if(String(e.message || '').indexOf('Failed to fetch')>=0 || String(e.message || '').indexOf('NetworkError')>=0){
        detail='网络不可达/CORS拦截';
      } else {
        detail='请求异常';
      }
    }
    results.push({name:c.name, ok:ok, ms:Date.now()-t0, detail:detail});
  }
  var okCnt=0;
  for(var j=0;j<results.length;j++){ if(results[j].ok) okCnt++; }
  var summaryColor=okCnt===results.length ? 'var(--green)' : (okCnt===0 ? 'var(--red)' : 'var(--amber)');
  var summary='检测完成：'+okCnt+'/'+results.length+' 项可用';
  var html='';
  html+='<div style="font-weight:600;margin-bottom:8px;color:'+summaryColor+'">'+summary+'</div>';
  html+='<div style="border:1px solid var(--border);border-radius:10px;overflow:hidden">';
  for(var k=0;k<results.length;k++){
    var it=results[k];
    var left= it.ok ? '🟢 '+it.name : '🔴 '+it.name;
    var right= it.ok ? (it.ms+'ms') : (it.detail || '失败');
    html+='<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 12px;border-bottom:1px solid var(--border);font-size:13px">';
    html+='<div>'+left+'</div><div style="color:var(--dim)">'+right+'</div>';
    html+='</div>';
  }
  html+='</div>';
  html+='<div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap">';
  html+='<button class="btn btn-sm" onclick="runNetworkDiagnosis()">重新检测</button>';
  html+='<button class="btn btn-sm" onclick="document.querySelector(\'.tab[data-t=news]\').click()">去热点页</button>';
  html+='<button class="btn btn-sm" onclick="document.querySelector(\'.tab[data-t=chart]\').click()">去分时页</button>';
  html+='</div>';
  el.innerHTML=html;
}

function localAdviceHTML(){
  if(!Array.isArray(H) || H.length===0){
    return '<div class="ai-box"><h3>🤖 本地建议</h3><div class="ai-content">暂无持仓，请先添加ETF再做本地分析。</div></div>';
  }
  var totalMV=0, totalPL=0;
  for(var i=0;i<H.length;i++){
    var h=H[i];
    if(h.p>0){
      totalMV += h.p*h.s;
      totalPL += (h.p-h.co)*h.s;
    }
  }
  var items='';
  for(var j=0;j<H.length;j++){
    var hi=H[j];
    if(!(hi.p>0)) continue;
    var pc=(hi.p/hi.co-1)*100;
    var mv=hi.p*hi.s;
    var pl=(hi.p-hi.co)*hi.s;
    var tag='🔵';
    if(pc<=-15) tag='🔴';
    else if(pc<=-3) tag='🟡';
    else if(pc>=10) tag='🟢';
    items+='<div class="advice-item">'+tag+' <strong>'+hi.n+'</strong>：盈亏'+(pc>=0?'+':'')+pc.toFixed(1)+'%，市值'+mv.toFixed(0)+'元，浮盈亏'+(pl>=0?'+':'')+pl.toFixed(0)+'元</div>';
  }
  var cls=totalPL>=0?'up':'dn';
  var meta='基于本地持仓数据的离线建议，不依赖外部联网';
  return '<div class="ai-box"><h3>🤖 本地建议</h3>'
    +'<div style="margin:6px 0 10px;font-size:12px;color:var(--dim)">总市值：'+totalMV.toFixed(0)+'元，总盈亏：<span class="'+cls+'">'+(totalPL>=0?'+':'')+totalPL.toFixed(0)+'元</span></div>'
    +items
    +'<div style="border-top:1px solid #adc6ff;margin:10px 0;padding-top:10px"><div class="ai-content">若要更智能的建议，请填入MiMo Key并联网；当前为本地基础分析。</div></div>'
    +'<div class="ai-meta"><span>'+meta+'</span><button class="btn btn-sm" onclick="showNetDiag()">网络诊断</button></div>'
    +'</div>';
}
