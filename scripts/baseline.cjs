const fs=require('node:fs');
const path=require('node:path');
const YAML=require('yaml');
const root=path.resolve(__dirname,'..');
function build(baseDir) {
  const base=path.resolve(baseDir);
  if(!fs.existsSync(path.join(base,'scripts/render.cjs')))throw new Error('Baseline sem renderizador de prompts');
  // Congela casos, modelos e rubricas atuais. Somente o texto dos prompts vem da base.
  const cfg=YAML.parse(fs.readFileSync(path.join(root,'promptfooconfig.yaml'),'utf8'));
  for(const test of cfg.tests){
    if(!fs.existsSync(path.join(base,'devops',test.vars._slug,'prompt.md')))throw new Error(`Prompt ausente na base: ${test.vars._slug}`);
  }
  cfg.prompts=['file://'+path.join(base,'scripts/render.cjs')];
  const absolute=a=>{
    if(typeof a.value==='string' && a.value.startsWith('file://'))a.value='file://'+path.resolve(root,a.value.slice(7));
    return a;
  };
  cfg.defaultTest.assert=cfg.defaultTest.assert.map(absolute);
  for(const test of cfg.tests)test.assert=(test.assert||[]).map(absolute);
  return cfg;
}
module.exports=build;
if(require.main===module){
  const [base,out]=process.argv.slice(2);
  if(!base||!out)throw new Error('Uso: node scripts/baseline.cjs DIRETORIO_BASE ARQUIVO_SAIDA');
  fs.writeFileSync(out,YAML.stringify(build(base)));
}
