---
nome: Execução reversível da migração
descricao: Detalhar responsáveis, evidências, gates e rollback do plano aprovado
versao: 1.0.0
tags:
- sre
- observabilidade
- playbook
inputs:
- nome: cenario
  descricao: Cenário original com garantias e dependências.
- nome: diagnostico
  descricao: Saída integral do diagnóstico anterior.
- nome: plano
  descricao: Saída integral do planejador anterior.
---
# Execução reversível da migração

## Objetivo e casos de uso

Detalhar responsáveis, evidências, gates e rollback do plano aprovado. Usar com o pacote de dados do incidente colado na entrada. O modelo apenas analisa os dados recebidos.

## Entradas e exemplo de uso

Os parâmetros estão no frontmatter. Exemplos completos constam em `promptfooconfig.yaml`, no campo `tests[].vars`. Remover o frontmatter ao copiar o prompt para o chat; o executor faz isso automaticamente.

```bash
npx promptfoo eval -c devops/execucao-reversivel-da-migracao/promptfooconfig.yaml --no-cache
```

Exemplo de saída registrado: [execuções assistidas](../../evidencias/EXECUCOES.md). Identificador principal: `cp05-3`.

## Curadoria

Terceiro elo transforma os dois outputs anteriores em entrega controlável. Refino: rollback só é viável com retenção, capacidade e autoridade por faixa claramente preservadas. Cada elo tem fixture que documenta a entrada literal recebida.

## Modelo, custo, latência e privacidade

As respostas iniciais foram geradas pelo GPT-6, Codex nesta conversa, com contexto compartilhado, em 02/11/2026; não são chamadas de API isoladas. Escolha motivada por análise técnica e consistência de instruções. Não houve medição de custo/token ou latência de inferência nesta sessão.

O config compara `openai:gpt-4o-mini` e `openai:gpt-6-luna` com a mesma `OPENAI_API_KEY`. Luna usa `reasoning_effort: none` para a comparação de baixa latência; nomes configurados não comprovam execução. É uma comparação entre dois modelos de um único fornecedor, por solicitação do autor, e não atende à regra acadêmica de dois provedores. GPT-4o mini é um baseline legado; seu ciclo de vida está documentado no README da raiz. Os limites de 5s e US$ 0,01 precisam ser medidos. Casos fictícios podem ser publicados; dados reais exigem sanitização e política de retenção do provedor aprovada.

## Limitações

Não é diagnóstico obtido de ambiente real nem autorização de mudança. Revisar conclusões e compatibilidade operacional. A saída varia por modelo. Replay testa os asserts sobre registros, sem avaliar a qualidade de uma nova geração.
