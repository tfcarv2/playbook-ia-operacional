---
nome: Nota de triagem
descricao: Converter alerta cru em nota de cinco campos com evidências e incertezas
versao: 1.0.0
tags:
- sre
- observabilidade
- playbook
inputs:
- nome: alerta_cru
  descricao: Alerta original a transformar, sem acrescentar informações não fornecidas.
---
# Nota de triagem

## Objetivo e casos de uso

Converter alerta cru em nota de cinco campos com evidências e incertezas. Usar com o pacote de dados do incidente colado na entrada. O modelo apenas analisa os dados recebidos.

## Entradas e exemplo de uso

Os parâmetros estão no frontmatter. Exemplos completos constam em `promptfooconfig.yaml`, no campo `tests[].vars`. Remover o frontmatter ao copiar o prompt para o chat; o executor faz isso automaticamente.

```bash
npx promptfoo eval -c devops/nota-de-triagem/promptfooconfig.yaml --no-cache
```

Exemplo de saída registrado: [execuções assistidas](../../evidencias/EXECUCOES.md). Identificador principal: `cp02-1`.

## Curadoria

Few-shot fixa o padrão com os três exemplos de saída; os três alertas crus são entradas separadas. Refino: proibir copiar fatos dos exemplos e distinguir proposta de ação executada. Para Sentinel, o owner ausente vira placeholder explícito, sem importar contatos de outro cenário.

## Modelo, custo, latência e privacidade

As respostas iniciais foram geradas pelo GPT-6, Codex nesta conversa, com contexto compartilhado, em 02/11/2026; não são chamadas de API isoladas. Escolha motivada por análise técnica e consistência de instruções. Não houve medição de custo/token ou latência de inferência nesta sessão.

O config prepara avaliação live com OpenAI e Anthropic em modelos compactos; nomes configurados são candidatos, não provedores já executados. Os limites de 5s e US$ 0,01 precisam ser medidos. Casos fictícios podem ser publicados; dados reais exigem sanitização e política de retenção do provedor aprovada.

## Limitações

Não é diagnóstico obtido de ambiente real nem autorização de mudança. Revisar conclusões e compatibilidade operacional. A saída varia por modelo. Replay testa os asserts sobre registros, sem avaliar a qualidade de uma nova geração.
