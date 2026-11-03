const fs = require('node:fs');
const path = require('node:path');
const YAML = require('yaml');
const root = path.resolve(__dirname, '..');

function split(text) {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) throw new Error('Frontmatter obrigatório ausente');
  return { metadata: YAML.parse(match[1]), body: match[2] };
}

function render({ vars }) {
  const slug = vars._slug;
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug || '')) throw new Error('Slug inválido');
  const { body } = split(fs.readFileSync(path.join(root, 'devops', slug, 'prompt.md'), 'utf8'));
  return body.replace(/{{\s*([a-z_]+)\s*}}/g, (_, key) => {
    if (vars[key] === undefined || vars[key] === null) throw new Error(`Input ausente: ${key}`);
    return typeof vars[key] === 'string' ? vars[key] : JSON.stringify(vars[key]);
  });
}

module.exports = render;
module.exports.split = split;
