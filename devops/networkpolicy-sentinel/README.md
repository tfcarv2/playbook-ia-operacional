---
nome: NetworkPolicy do Sentinel
descricao: Gerar default-deny e fluxos mínimos com seletores de namespace e pod combinados
versao: 1.0.0
tags:
- sre
- observabilidade
- playbook
inputs:
- nome: manifesto
  descricao: Manifesto permissivo a substituir, sem executar mudanças.
- nome: regras
  descricao: Padrão de fluxos autorizados e comentários obrigatórios.
- nome: mapa_servicos
  descricao: Namespaces, labels e portas fornecidos pelo time.
---
# NetworkPolicy do Sentinel

## Objetivo e casos de uso

Gerar default-deny e fluxos mínimos com seletores de namespace e pod combinados. Usar com o pacote de dados do incidente colado na entrada. O modelo apenas analisa os dados recebidos.

## Entradas e exemplo de uso

Os parâmetros estão no frontmatter. Exemplos completos constam em `promptfooconfig.yaml`, no campo `tests[].vars`. Remover o frontmatter ao copiar o prompt para o chat; o executor faz isso automaticamente.

```bash
npx promptfoo eval -c devops/networkpolicy-sentinel/promptfooconfig.yaml --no-cache
```

Exemplo de saída registrado: [execuções assistidas](../../evidencias/EXECUCOES.md). Identificador principal: `cp06-v2`.

## Curadoria

B-A-B com verificação/refino: v1 tinha seletores só de pod, ausência de default-deny e dependências incompletas. A revisão pediu AND namespace/pod, Forge+Cerebro+DNS UDP/TCP e substituição do nome original. A v2 corrige esses pontos; portas ingress continuam ausentes no cenário e exigem confirmação para restrição adicional.

## Modelo, custo, latência e privacidade

As respostas iniciais foram geradas pelo GPT-6, Codex nesta conversa, com contexto compartilhado, em 02/11/2026; não são chamadas de API isoladas. Escolha motivada por análise técnica e consistência de instruções. Não houve medição de custo/token ou latência de inferência nesta sessão.

O config prepara avaliação live com OpenAI e Anthropic em modelos compactos; nomes configurados são candidatos, não provedores já executados. Os limites de 5s e US$ 0,01 precisam ser medidos. Casos fictícios podem ser publicados; dados reais exigem sanitização e política de retenção do provedor aprovada.

## Limitações

Não é diagnóstico obtido de ambiente real nem autorização de mudança. Revisar conclusões e compatibilidade operacional. A saída varia por modelo. Replay testa os asserts sobre registros, sem avaliar a qualidade de uma nova geração.
