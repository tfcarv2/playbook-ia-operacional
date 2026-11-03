const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const YAML = require('yaml');
const root=path.resolve(__dirname,'..');
const catalog=JSON.parse(fs.readFileSync(path.join(root,'evidencias/catalogo.json'),'utf8'));
const mode=process.argv[2] || 'replay';
if (!['replay','live','prepare','compare'].includes(mode)) throw new Error('Modo inválido');
if (mode==='live' || mode==='compare') {
  for (const key of ['OPENAI_API_KEY']) {
    if (!process.env[key]) { console.error(`PENDENTE: configure ${key} localmente ou em GitHub Secrets. Nenhuma chamada realizada.`); process.exit(2); }
  }
}
const outDir=path.join(root,'results',mode==='prepare'?'live':mode);
fs.mkdirSync(outDir,{recursive:true});
let failed=false;
const summaries=[];
for (const [slug] of catalog) {
  if (mode==='compare' && !['triagem-de-pods','nota-de-triagem','networkpolicy-sentinel'].includes(slug)) continue;
  const original=YAML.parse(fs.readFileSync(path.join(root,'devops',slug,'promptfooconfig.yaml'),'utf8'));
  const cfg=structuredClone(original);
  cfg.prompts=['file://'+path.join(root,'scripts/render.cjs')];
  const fix = assertion => {
    if (typeof assertion.value==='string' && assertion.value.startsWith('file://../../')) assertion.value='file://'+path.join(root,assertion.value.slice('file://../../'.length));
    return assertion;
  };
  cfg.defaultTest.assert=cfg.defaultTest.assert.map(fix);
  if (mode==='replay') {
    cfg.providers=['file://'+path.join(root,'scripts/replay.cjs')];
    // Replay não é inferência: não medir custo, latência ou juiz sobre fixture.
    cfg.defaultTest.assert=cfg.defaultTest.assert.filter(a=>!['latency','cost','llm-rubric','model-graded-closedqa'].includes(a.type));
    for (const test of cfg.tests) test.assert=(test.assert||[]).filter(a=>!['latency','cost','llm-rubric','model-graded-closedqa'].includes(a.type)).map(fix);
  }
  const configPath=path.join(outDir,slug+'.yaml');
  fs.writeFileSync(configPath,YAML.stringify(cfg));
  if (mode==='prepare') continue;
  const outputPath=path.join(outDir,slug+'.json');
  const result=spawnSync(process.execPath,[path.join(root,'node_modules/promptfoo/dist/src/main.js'),'eval','-c',configPath,'-o',outputPath,'--no-cache','--no-share','--no-progress-bar','--no-table','--max-concurrency','1'],{cwd:root,encoding:'utf8',env:{...process.env,PROMPTFOO_DISABLE_TELEMETRY:'1',PROMPTFOO_DISABLE_UPDATE:'1'},timeout:240000,maxBuffer:8*1024*1024});
  const log=(result.stdout||'')+(result.stderr||'');
  fs.writeFileSync(path.join(outDir,slug+'.txt'),log);
  process.stdout.write(`\n=== ${slug} / ${mode} ===\n${log}\n`);
  if (result.error) {console.error(result.error.message);failed=true;}
  if (result.status!==0) failed=true;
  summaries.push({slug,exitCode:result.status,error:result.error?.message || null});
}
fs.writeFileSync(path.join(outDir,'execucoes.json'),JSON.stringify({mode,recordedAt:new Date().toISOString(),summaries},null,2));
process.exitCode=failed?1:0;
