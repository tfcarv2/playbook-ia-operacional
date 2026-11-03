const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const YAML = require('yaml');
const render = require('./render.cjs');
const evaluate = require('./assertions.cjs');
const root = path.resolve(__dirname, '..');
const catalog = JSON.parse(fs.readFileSync(path.join(root,'evidencias/catalogo.json'),'utf8'));
const outputs = JSON.parse(fs.readFileSync(path.join(root,'evidencias/outputs.json'),'utf8'));
let checked = 0;
for (const [slug] of catalog) {
  const folder = path.join(root,'devops',slug);
  const p = render.split(fs.readFileSync(path.join(folder,'prompt.md'),'utf8'));
  const r = render.split(fs.readFileSync(path.join(folder,'README.md'),'utf8'));
  assert.deepEqual(p.metadata,r.metadata,`Frontmatter divergente: ${slug}`);
  assert.match(p.metadata.versao,/^\d+\.\d+\.\d+$/);
  for (const field of ['nome','descricao','versao','tags','inputs']) assert.ok(p.metadata[field],field);
  const placeholders = [...new Set([...p.body.matchAll(/{{\s*([a-z_]+)\s*}}/g)].map(m=>m[1]))].sort();
  assert.deepEqual(placeholders,p.metadata.inputs.map(i=>i.nome).sort(),`Inputs divergentes: ${slug}`);
  const cfg = YAML.parse(fs.readFileSync(path.join(folder,'promptfooconfig.yaml'),'utf8'));
  assert.equal(cfg.providers.length,2);
  assert.deepEqual(cfg.providers.map(p=>p.id),['openai:gpt-4o-mini','openai:gpt-6-luna']);
  assert.equal(cfg.providers[1].config.reasoning_effort,'none');
  assert.ok(cfg.defaultTest.assert.some(a=>a.type==='latency' && a.threshold===5000));
  assert.ok(cfg.defaultTest.assert.some(a=>a.type==='cost' && a.threshold===0.01));
  for (const test of cfg.tests) {
    const text = render({vars:test.vars});
    assert.ok(text.length>100);
    assert.ok(!/^---\n/.test(text),'Frontmatter foi enviado ao modelo');
    assert.equal(evaluate(outputs[test.vars._case_id],{vars:test.vars}).pass,true,test.description);
    checked++;
  }
}
// Testes negativos: os asserts devem rejeitar regressões, não apenas aceitar goldens.
assert.equal(evaluate('ALERTA: sem outros campos',{vars:{_slug:'nota-de-triagem'}}).pass,false);
assert.equal(evaluate(JSON.stringify({saudavel:false,problemas:[{pod:'sentinel-worker'}]}),{vars:{_slug:'triagem-de-pods',_case_id:'cp01-3'}}).pass,false);
assert.equal(evaluate(outputs['cp06-v1'],{vars:{_slug:'networkpolicy-sentinel'}}).pass,false);
const v2=outputs['cp06-v2'];
assert.equal(evaluate(v2.replace('namespaceSelector:','podSelector:'),{vars:{_slug:'networkpolicy-sentinel'}}).pass,false);
assert.equal(evaluate(v2.replace('port: 9200','port: 9300'),{vars:{_slug:'networkpolicy-sentinel'}}).pass,false);
assert.equal(evaluate(v2.replace('protocol: UDP','protocol: TCP'),{vars:{_slug:'networkpolicy-sentinel'}}).pass,false);
assert.equal(evaluate(v2.replace(/    #.*\n/g,''),{vars:{_slug:'networkpolicy-sentinel'}}).pass,false);
assert.equal(evaluate(v2.replace('app: forge','app: intruso'),{vars:{_slug:'networkpolicy-sentinel'}}).pass,false);
// Integridade da cadeia: entradas devem conter outputs literais dos elos anteriores.
const cp52=YAML.parse(fs.readFileSync(path.join(root,'devops/plano-da-migracao/promptfooconfig.yaml'),'utf8'));
const cp53=YAML.parse(fs.readFileSync(path.join(root,'devops/execucao-reversivel-da-migracao/promptfooconfig.yaml'),'utf8'));
assert.equal(cp52.tests[0].vars.diagnostico,outputs['cp05-1']);
assert.equal(cp53.tests[0].vars.plano,outputs['cp05-2']);
assert.equal(cp53.tests[0].vars.diagnostico,outputs['cp05-1']);
assert.throws(()=>render({vars:{_slug:'triagem-de-pods'}}),/Input ausente/);
const gate=require('./gate.cjs');
assert.equal(gate.numbers('C1=2;C2=2;C3=1;C4=1;total=6;ok').pass,true);
assert.equal(gate.numbers('C1=2;C2=2;C3=2;C4=0;total=6;reprovado').pass,false);
assert.throws(()=>gate.numbers('C1=2;C2=2;C3=2;C4=2;total=6;soma incorreta'));
// Regressão da migração: nem o baseline pode reintroduzir outro fornecedor.
const baseline=require('./baseline.cjs')(root);
assert.deepEqual(baseline.providers.map(p=>p.id),['openai:gpt-4o-mini','openai:gpt-6-luna']);
assert.ok(baseline.prompts[0].startsWith('file://'));
const workflow=fs.readFileSync(path.join(root,'.github/workflows/playbook.yml'),'utf8');
assert.ok(!workflow.includes('ANTHROPIC_API_KEY'));
assert.ok(!fs.readFileSync(path.join(root,'scripts/run.cjs'),'utf8').includes('ANTHROPIC_API_KEY'));
console.log(`PASS: ${catalog.length} prompts; ${checked} casos; 8 regressões rejeitadas; cadeia CP05 íntegra.`);
