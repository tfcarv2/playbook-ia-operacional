const YAML = require('yaml');

function result(pass, reason) { return { pass: Boolean(pass), score: pass ? 1 : 0, reason }; }
function fail(message) { throw new Error(message); }
function requireTrue(value, message) { if (!value) fail(message); }
function json(output) { return JSON.parse(output.trim()); }

function policy(output) {
  requireTrue(!/```/.test(output), 'YAML deve vir sem cercas Markdown');
  requireTrue(!/^\s*-\s*\{\s*\}\s*(?:#.*)?$/m.test(output), 'Regra allow-all vazia');
  const docs = YAML.parseAllDocuments(output);
  requireTrue(docs.length === 2 && docs.every(d => !d.errors.length), 'Esperados dois documentos YAML válidos');
  const data = docs.map(d => d.toJSON());
  requireTrue(data.every(d => d.kind === 'NetworkPolicy' && d.apiVersion === 'networking.k8s.io/v1' && d.metadata.namespace === 'sentinel-prod'), 'Tipo/namespace incorretos');
  const deny = data.find(d => Object.keys(d.spec.podSelector || {}).length === 0 && (d.spec.ingress || []).length === 0 && (d.spec.egress || []).length === 0);
  requireTrue(deny && ['Ingress', 'Egress'].every(t => deny.spec.policyTypes.includes(t)), 'Default-deny explícito ausente');
  const allow = data.find(d => d.spec.podSelector?.matchLabels?.app === 'sentinel');
  requireTrue(allow && ['Ingress', 'Egress'].every(t => allow.spec.policyTypes.includes(t)), 'Allow deve selecionar somente Sentinel e os dois sentidos');
  const ingress = allow.spec.ingress || [];
  const egress = allow.spec.egress || [];
  requireTrue(ingress.length === 2 && egress.length === 3, 'Número de regras inesperado');
  const peer = (p, ns, key, value) => p?.namespaceSelector?.matchLabels?.['kubernetes.io/metadata.name'] === ns && p?.podSelector?.matchLabels?.[key] === value && Object.keys(p).sort().join(',') === 'namespaceSelector,podSelector' && Object.keys(p.namespaceSelector).join(',') === 'matchLabels' && Object.keys(p.podSelector).join(',') === 'matchLabels' && Object.keys(p.namespaceSelector.matchLabels).length === 1 && Object.keys(p.podSelector.matchLabels).length === 1;
  for (const [ns, app] of [['relay-prod','relay'],['edge','api-gateway']]) {
    requireTrue(ingress.some(r => r.from?.length === 1 && peer(r.from[0],ns,'app',app) && Object.keys(r).every(k => ['from','ports'].includes(k))), `Ingress ausente/aberto para ${app}`);
  }
  for (const [ns, key, app, port, protocols] of [['forge-prod','app','forge',5432,['TCP']],['cerebro-prod','app','cerebro',9200,['TCP']],['kube-system','k8s-app','kube-dns',53,['TCP','UDP']]]) {
    requireTrue(egress.some(r => r.to?.length === 1 && peer(r.to[0],ns,key,app) && r.ports?.length === protocols.length && protocols.every(proto => r.ports.some(p => p.port === port && p.protocol === proto)) && Object.keys(r).every(k => ['to','ports'].includes(k))), `Egress ausente/aberto: ${app}`);
  }
  // Não basta existir algum comentário: cada item de fluxo deve ter o seu.
  const lines = output.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (/^\s*-\s+(from|to):/.test(lines[i])) {
      requireTrue(/#/.test(lines[i]) || /^\s*#\s*\S/.test(lines[i-1] || ''), `Regra sem comentário na linha ${i+1}`);
    }
  }
  return true;
}

module.exports = function(output, context) {
  try {
    const slug = context.vars._slug;
    if (slug === 'nota-de-triagem') {
      const lines = output.trim().split(/\r?\n/);
      const labels = ['ALERTA:', 'IMPACTO:', 'HIPÓTESE INICIAL:', 'AÇÃO IMEDIATA:', 'ESCALAR PARA:'];
      requireTrue(lines.length === 5 && labels.every((label,i) => lines[i].startsWith(label)), 'Exatamente cinco campos, na ordem esperada');
      requireTrue(/ESCALAR PARA:.*@\w+/.test(output), 'Handle de escalação ausente');
    } else if (slug === 'triagem-de-pods') {
      const value = json(output);
      requireTrue(typeof value.saudavel === 'boolean' && Array.isArray(value.problemas), 'Schema inválido');
      const id = context.vars._case_id;
      if (id === 'cp01-1') {
        requireTrue(!value.saudavel && value.problemas.length === 1, 'Esperado um problema');
        requireTrue(value.problemas[0].pod === 'sentinel-api-7d9c8b6f4-h4m2t' && /OOMKilled|mem[oó]ria/i.test(value.problemas[0].causa_provavel), 'Pod/causa incorretos');
      } else if (id === 'cp01-2') {
        requireTrue(!value.saudavel && value.problemas.length === 2, 'Esperados dois problemas');
        for (const [name, regex] of [['sentinel-api-7d9c8b6f4-zzp10', /2\.9\.2|ImagePullBackOff/],['sentinel-ingest-8f7a9c5b-4dkqm', /cpu|Insufficient/i]]) {
          requireTrue(value.problemas.some(p => p.pod === name && regex.test(p.causa_provavel)), `Causa incorreta: ${name}`);
        }
      } else {
        requireTrue(value.saudavel && value.problemas.length === 0, 'Caso saudável teve falso positivo');
      }
      for (const p of value.problemas) requireTrue(p.proxima_acao && p.evidencias?.length, 'Faltam evidências/ação');
    } else if (slug === 'networkpolicy-sentinel') {
      policy(output);
    } else {
      requireTrue(output.trim().length >= 100, 'Análise excessivamente vazia');
    }
    return result(true, 'Contrato determinístico atendido');
  } catch (error) { return result(false, error.message); }
};
module.exports.policy = policy;
