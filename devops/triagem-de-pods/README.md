---
nome: Triagem de pods
descricao: Cruzar status, eventos e logs para apontar causas prováveis e próxima ação
versao: 1.0.0
tags:
- sre
- observabilidade
- playbook
inputs:
- nome: snapshot
  descricao: Snapshot com get pods, describe/eventos e logs, incluindo namespace e
    horários.
---
# Triagem de pods

## Objetivo e casos de uso

Cruzar status, eventos e logs para apontar causas prováveis e próxima ação. Usar com o pacote de dados do incidente colado na entrada. O modelo apenas analisa os dados recebidos.

## Entradas e exemplo de uso

Os parâmetros estão no frontmatter. Exemplos completos constam em `promptfooconfig.yaml`, no campo `tests[].vars`. Remover o frontmatter ao copiar o prompt para o chat; o executor faz isso automaticamente.

```bash
npx promptfoo eval -c devops/triagem-de-pods/promptfooconfig.yaml --no-cache
```

Exemplo de saída registrado: [execuções assistidas](../../evidencias/EXECUCOES.md). Identificador principal: `cp01-1`.

## Curadoria

R-I-S-E transforma o pedido de script em análise de snapshot. Refino: exigir cruzamento de evidências e considerar recência dos reinícios. JSON torna o caso saudável verificável e evita falso positivo por reinício antigo.

## Modelo, custo, latência e privacidade

As respostas iniciais foram geradas pelo GPT-6, Codex nesta conversa, com contexto compartilhado, em 02/11/2026; não são chamadas de API isoladas. Escolha motivada por análise técnica e consistência de instruções. Não houve medição de custo/token ou latência de inferência nesta sessão.

O config prepara avaliação live com OpenAI e Anthropic em modelos compactos; nomes configurados são candidatos, não provedores já executados. Os limites de 5s e US$ 0,01 precisam ser medidos. Casos fictícios podem ser publicados; dados reais exigem sanitização e política de retenção do provedor aprovada.

## Limitações

Não é diagnóstico obtido de ambiente real nem autorização de mudança. Revisar conclusões e compatibilidade operacional. A saída varia por modelo. Replay testa os asserts sobre registros, sem avaliar a qualidade de uma nova geração.
