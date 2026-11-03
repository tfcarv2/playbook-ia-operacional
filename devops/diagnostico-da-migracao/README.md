---
nome: Diagnóstico da migração
descricao: Inventariar contratos, dependências e riscos do pipeline batch antes da
  migração
versao: 1.0.0
tags:
- sre
- observabilidade
- playbook
inputs:
- nome: cenario
  descricao: Estado atual, dependências e garantias exigidas para migração.
---
# Diagnóstico da migração

## Objetivo e casos de uso

Inventariar contratos, dependências e riscos do pipeline batch antes da migração. Usar com o pacote de dados do incidente colado na entrada. O modelo apenas analisa os dados recebidos.

## Entradas e exemplo de uso

Os parâmetros estão no frontmatter. Exemplos completos constam em `promptfooconfig.yaml`, no campo `tests[].vars`. Remover o frontmatter ao copiar o prompt para o chat; o executor faz isso automaticamente.

```bash
npx promptfoo eval -c devops/diagnostico-da-migracao/promptfooconfig.yaml --no-cache
```

Exemplo de saída registrado: [execuções assistidas](../../evidencias/EXECUCOES.md). Identificador principal: `cp05-1`.

## Curadoria

Primeiro elo de uma cadeia, focado em diagnóstico e contratos. Refino: explicitar dependência de billing e limites de exactly-once; separar inventário de execução.

## Modelo, custo, latência e privacidade

As respostas iniciais foram geradas pelo GPT-6, Codex nesta conversa, com contexto compartilhado, em 02/11/2026; não são chamadas de API isoladas. Escolha motivada por análise técnica e consistência de instruções. Não houve medição de custo/token ou latência de inferência nesta sessão.

O config compara `openai:gpt-4o-mini` e `openai:gpt-6-luna` com a mesma `OPENAI_API_KEY`. Luna usa `reasoning_effort: none` para a comparação de baixa latência; nomes configurados não comprovam execução. É uma comparação entre dois modelos de um único fornecedor, por solicitação do autor, e não atende à regra acadêmica de dois provedores. GPT-4o mini é um baseline legado; seu ciclo de vida está documentado no README da raiz. Os limites de 5s e US$ 0,01 precisam ser medidos. Casos fictícios podem ser publicados; dados reais exigem sanitização e política de retenção do provedor aprovada.

## Limitações

Não é diagnóstico obtido de ambiente real nem autorização de mudança. Revisar conclusões e compatibilidade operacional. A saída varia por modelo. Replay testa os asserts sobre registros, sem avaliar a qualidade de uma nova geração.
