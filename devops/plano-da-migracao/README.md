---
nome: Plano da migração
descricao: Planejar fases incrementais a partir do diagnóstico do Forge
versao: 1.0.0
tags:
- sre
- observabilidade
- playbook
inputs:
- nome: cenario
  descricao: Cenário original da migração.
- nome: diagnostico
  descricao: Saída integral do elo de diagnóstico, revisada como evidência.
---
# Plano da migração

## Objetivo e casos de uso

Planejar fases incrementais a partir do diagnóstico do Forge. Usar com o pacote de dados do incidente colado na entrada. O modelo apenas analisa os dados recebidos.

## Entradas e exemplo de uso

Os parâmetros estão no frontmatter. Exemplos completos constam em `promptfooconfig.yaml`, no campo `tests[].vars`. Remover o frontmatter ao copiar o prompt para o chat; o executor faz isso automaticamente.

```bash
npx promptfoo eval -c devops/plano-da-migracao/promptfooconfig.yaml --no-cache
```

Exemplo de saída registrado: [execuções assistidas](../../evidencias/EXECUCOES.md). Identificador principal: `cp05-2`.

## Curadoria

Segundo elo consome literalmente a saída do primeiro, além do cenário. Refino: sinks paralelos e fronteira autoritativa para evitar dupla escrita e dupla cobrança.

## Modelo, custo, latência e privacidade

As respostas iniciais foram geradas pelo GPT-6, Codex nesta conversa, com contexto compartilhado, em 02/11/2026; não são chamadas de API isoladas. Escolha motivada por análise técnica e consistência de instruções. Não houve medição de custo/token ou latência de inferência nesta sessão.

O config prepara avaliação live com OpenAI e Anthropic em modelos compactos; nomes configurados são candidatos, não provedores já executados. Os limites de 5s e US$ 0,01 precisam ser medidos. Casos fictícios podem ser publicados; dados reais exigem sanitização e política de retenção do provedor aprovada.

## Limitações

Não é diagnóstico obtido de ambiente real nem autorização de mudança. Revisar conclusões e compatibilidade operacional. A saída varia por modelo. Replay testa os asserts sobre registros, sem avaliar a qualidade de uma nova geração.
