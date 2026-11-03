const fs = require('node:fs');
const path = require('node:path');

// Replay testa asserts contra respostas já registradas. Não chama modelo.
module.exports = class ReplayProvider {
  id() { return 'replay:gpt-session-output'; }
  async callApi(_prompt, context) {
    const records = JSON.parse(fs.readFileSync(path.join(__dirname, '../evidencias/outputs.json'), 'utf8'));
    const key = context.vars._case_id;
    if (!Object.hasOwn(records, key)) return { error: `Output registrado ausente: ${key}` };
    // Não fabricar custo, tokens ou latência de inferência.
    return { output: records[key] };
  }
};
