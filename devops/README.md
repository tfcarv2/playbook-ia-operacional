# DevOps — Playbook Aegis

Prompts para observabilidade, SRE, segurança e migração de dados.

| Prompt | Pasta | Objetivo |
|---|---|---|
| [Triagem de pods](triagem-de-pods/README.md) | `triagem-de-pods` | Cruzar status, eventos e logs para apontar causas prováveis e próxima ação |
| [Nota de triagem](nota-de-triagem/README.md) | `nota-de-triagem` | Converter alerta cru em nota de cinco campos com evidências e incertezas |
| [Causa-raiz de degradação](causa-raiz/README.md) | `causa-raiz` | Analisar configuração, métricas e logs para explicar cadeia causal e limites de confiança |
| [Decisão de backpressure](decisao-de-backpressure/README.md) | `decisao-de-backpressure` | Comparar alternativas de contenção de carga sem perda de telemetry e com SLAs distintos |
| [Diagnóstico da migração](diagnostico-da-migracao/README.md) | `diagnostico-da-migracao` | Inventariar contratos, dependências e riscos do pipeline batch antes da migração |
| [Plano da migração](plano-da-migracao/README.md) | `plano-da-migracao` | Planejar fases incrementais a partir do diagnóstico do Forge |
| [Execução reversível da migração](execucao-reversivel-da-migracao/README.md) | `execucao-reversivel-da-migracao` | Detalhar responsáveis, evidências, gates e rollback do plano aprovado |
| [NetworkPolicy do Sentinel](networkpolicy-sentinel/README.md) | `networkpolicy-sentinel` | Gerar default-deny e fluxos mínimos com seletores de namespace e pod combinados |

Cada pasta contém prompt.md, README.md e promptfooconfig.yaml. Todos iniciam em 1.0.0. Os três elos da migração ficam no mesmo nível da categoria, sem aninhar categorias.
