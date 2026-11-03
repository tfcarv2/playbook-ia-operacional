const fs=require('node:fs');
function rows(report) { return report.results?.results || []; }
function numbers(reason) {
  const match=String(reason).match(/C1=(\d);C2=(\d);C3=(\d);C4=(\d);total=(\d)/);
  if (!match) throw new Error('Juiz não retornou notas por critério no formato contratado');
  const scores=match.slice(1,5).map(Number), total=Number(match[5]);
  if (scores.some(n=>!Number.isInteger(n)||n<0||n>2)||scores.reduce((a,b)=>a+b,0)!==total) throw new Error('Notas inconsistentes');
  return {scores,total,pass:total>=6 && scores.every(n=>n>0)};
}
function enforce(report) {
  const results=rows(report);
  if (!results.length) throw new Error('Relatório vazio não aprova gate');
  for (const row of results) {
    if (row.success!==true || row.error || !row.gradingResult?.pass) throw new Error('Há teste falho/erro de provider');
    for (const component of row.gradingResult.componentResults || []) {
      if (component.assertion?.metric==='rca-judge') {
        const n=numbers(component.reason);
        if (!n.pass || !component.pass) throw new Error(`Causa-raiz reprovada: ${component.reason}`);
      }
    }
  }
  return results;
}
function compare(before,after) {
  const a=enforce(after), b=rows(before);
  const key=r=>`${r.testCase?.vars?._case_id || r.vars?._case_id || r.description}|${r.provider?.id || r.provider?.label || ''}`;
  const groups=items=>{const map=new Map(); for(const r of items){const k=key(r);if(!map.has(k))map.set(k,[]);map.get(k).push(r);}return map;};
  const old=groups(b), now=groups(a);
  if (!old.size || now.size!==old.size) throw new Error('Conjunto de testes/providers mudou: revisar baseline antes de aprovar comparação');
  for(const [k,previous] of old){
    const current=now.get(k);if(!current||current.length!==previous.length)throw new Error(`Caso/repetição ausente: ${k}`);
    const rate=rs=>rs.filter(r=>r.success).length/rs.length;
    if(rate(current)<rate(previous))throw new Error(`Regressão de pass rate: ${k}`);
    // Tolerância de até 1 ponto de juiz no total (escala 0..8), mantendo gate absoluto.
    const totals=rs=>rs.flatMap(r=>(r.gradingResult?.componentResults||[]).filter(c=>c.assertion?.metric==='rca-judge').map(c=>numbers(c.reason).total));
    const median=ns=>ns.sort((x,y)=>x-y)[Math.floor(ns.length/2)];
    const ot=totals(previous),nt=totals(current);
    if(ot.length && (!nt.length || median(nt)<median(ot)-1))throw new Error(`Regressão de qualidade >1 ponto: ${k}`);
  }
  return true;
}
module.exports={numbers,enforce,compare};
if(require.main===module){
  try {
    const [after,before]=process.argv.slice(2);
    const a=JSON.parse(fs.readFileSync(after,'utf8'));
    before?compare(JSON.parse(fs.readFileSync(before,'utf8')),a):enforce(a);
    console.log('PASS: gate absoluto'+(before?' e comparação de regressão':''));
  }catch(error){console.error('FAIL:',error.message);process.exitCode=1;}
}
