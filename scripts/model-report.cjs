const fs=require('node:fs');
const path=require('node:path');
const folder=path.resolve(process.argv[2]||'results/compare');
const groups=new Map();
const failures=[];
for(const slug of ['triagem-de-pods','nota-de-triagem','networkpolicy-sentinel']){
  const report=JSON.parse(fs.readFileSync(path.join(folder,slug+'.json'),'utf8'));
  for(const row of report.results?.results||[]){
    const id=row.provider?.id || 'unknown';
    if(!groups.has(id))groups.set(id,{model:id,cases:0,passed:0,failed:0,errors:0,latencies:[],costs:[],inputTokens:0,outputTokens:0});
    const g=groups.get(id);g.cases++;row.success?g.passed++:g.failed++;
    // promptfoo 0.125.1: 1 = assert reprovado; 2 = erro de execução/API.
    if(row.failureReason===2 || row.response?.error)g.errors++;
    if(!row.success)failures.push({model:id,caseId:row.testCase?.vars?._case_id || row.vars?._case_id || slug,kind:row.failureReason===2 || row.response?.error?'error':'assertion',reason:row.error || row.response?.error || row.gradingResult?.reason || 'Sem justificativa reportada'});
    if(Number.isFinite(row.latencyMs))g.latencies.push(row.latencyMs);
    if(Number.isFinite(row.cost))g.costs.push(row.cost);
    g.inputTokens+=row.tokenUsage?.prompt || 0;g.outputTokens+=row.tokenUsage?.completion || 0;
  }
}
const summary=[...groups.values()].map(g=>({model:g.model,cases:g.cases,passed:g.passed,failed:g.failed,errors:g.errors,
  avgLatencyMs:g.latencies.length?g.latencies.reduce((a,b)=>a+b,0)/g.latencies.length:null,
  maxLatencyMs:g.latencies.length?Math.max(...g.latencies):null,
  reportedCostUSD:g.costs.length?g.costs.reduce((a,b)=>a+b,0):null,
  inputTokens:g.inputTokens,outputTokens:g.outputTokens}));
fs.writeFileSync(path.join(folder,'model-comparison.json'),JSON.stringify({recordedAt:new Date().toISOString(),summary,failures},null,2));
const fmt=(x,d=2)=>x===null?'não informado':x.toFixed(d);
const lines=['# Comparação de modelos OpenAI','',
 '| Modelo | Casos | Passou | Falhou | Erros | Latência média ms | Máxima ms | Custo informado USD |',
 '|---|---:|---:|---:|---:|---:|---:|---:|',
 ...summary.map(g=>`| ${g.model} | ${g.cases} | ${g.passed} | ${g.failed} | ${g.errors} | ${fmt(g.avgLatencyMs)} | ${fmt(g.maxLatencyMs)} | ${fmt(g.reportedCostUSD,6)} |`),
 '', ...failures.map(f=>`- ${f.model} / ${f.caseId} (${f.kind}): ${String(f.reason).replace(/\s+/g,' ')}`), '', 'Resultados de chamadas live, sem cache, dos três prompts estruturados. Erros de API não medem qualidade do modelo. Custo é o valor reportado/calculado pelo promptfoo, não fatura reconciliada. Latência e custo permanecem critérios de reprovação.'];
fs.writeFileSync(path.join(folder,'model-comparison.md'),lines.join('\n')+'\n');
console.log(lines.join('\n'));
