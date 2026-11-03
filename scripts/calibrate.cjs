const fs=require('node:fs');
const path=require('node:path');
const {numbers}=require('./gate.cjs');
const refs=JSON.parse(fs.readFileSync(path.join(__dirname,'../evidencias/calibracao.json'),'utf8'));
if(refs.some(r=>!r.humanScores || !r.reviewedByHuman)){
  console.error('PENDENTE: preencher humanScores e reviewedByHuman após revisão real do autor. Não usar notas sugeridas por IA como calibração humana.');
  process.exit(2);
}
const file=process.argv[2];
if(!file){console.error('Informe o JSON real de promptfoo eval -c calibracao.yaml');process.exit(2);}
const report=JSON.parse(fs.readFileSync(file,'utf8'));
const rows=report.results?.results || [];
let checked=0;
for(const ref of refs){
  const matches=rows.filter(r=>(r.testCase?.vars?._calibration_id || r.vars?._calibration_id)===ref.id);
  if(!matches.length)throw new Error(`Calibração ausente: ${ref.id}`);
  for(const row of matches){
    const c=row.gradingResult?.componentResults?.find(c=>c.assertion?.metric==='rca-judge');
    const n=numbers(c?.reason);
    if(ref.humanScores.length!==4 || ref.humanScores.some(s=>![0,1,2].includes(s)))throw new Error('Notas humanas inválidas');
    if(n.scores.some((s,i)=>Math.abs(s-ref.humanScores[i])>1))throw new Error(`Desvio maior que 1 ponto: ${ref.id}`);
    const humanPass=ref.humanScores.reduce((a,b)=>a+b,0)>=6 && ref.humanScores.every(s=>s>0);
    if(n.pass!==humanPass)throw new Error(`Juiz diverge da decisão humana de gate: ${ref.id}`);
    checked++;
  }
}
console.log(`PASS: juiz calibrado em ${checked} avaliações com notas humanas registradas`);
