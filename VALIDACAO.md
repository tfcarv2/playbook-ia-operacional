# Evidências de validação

Registro: 02/11/2026 (America/Sao_Paulo; os IDs do promptfoo usam 03/11 UTC).

| Verificação | Resultado observado | Limite |
|---|---|---|
| `npm test` | 8 prompts, 12 casos, frontmatter/inputs coerentes, cadeia CP05 íntegra e 8 regressões rejeitadas | Teste local de estrutura e validadores |
| `promptfoo eval` em replay, oito configs | **12 passes, 0 fails, 0 errors** | Respostas registradas, sem geração nova |
| Replay com output v1 incompleto de NetworkPolicy | **0 passes, 1 fail, 0 errors, exit 100** | Demonstra rejeição da saída ruim; não é prompt regredido executado em API |
| Gate composto | 6 pontos sem zero passa; 6 com zero reprova; soma inconsistente reprova | Teste de lógica, sem julgamento live |
| Suite live sem credencial | **Exit 2**, informa variável ausente antes de chamar API | Bloqueio esperado de configuração, não benchmark |
| Calibração sem notas humanas | **Exit 2**, pede pontuação humana real | Não há calibração humana concluída |
| Workflow GitHub Actions, run #1 | **offline aprovado em 29s**; live falhou em 16s no preflight por `OPENAI_API_KEY` ausente | Não houve inferência live; etapas de geração/juiz foram impedidas |
| Kubernetes/CNI, Elasticsearch, Relay, Spark e warehouse | Não acessados | Nenhuma mudança operacional aplicada |
| Dois provedores reais | **Fora da configuração solicitada** | A versão atual compara dois modelos OpenAI; não cumpre a regra original de dois fornecedores |
| Latência ≤5s e custo ≤US$0,01 por geração | **Pendente** | Os tempos do replay medem leitura de fixture, não inferência |

Saída real do promptfoo: [REPLAY.txt](evidencias/REPLAY.txt). Resumo com eval IDs: [replay-resumo.json](evidencias/replay-resumo.json). Os outputs da sessão estão em [outputs.json](evidencias/outputs.json), separados dos resultados do executor.

## Execução remota comprovada

[Run #1 no GitHub Actions](https://github.com/tfcarv2/playbook-ia-operacional/actions/runs/41554477116), commit `1de0587cb2be16e35016b43d1fd8207833973c37`, iniciado por push em 02/11/2026 às 21:40 (America/Sao_Paulo). O [job offline](https://github.com/tfcarv2/playbook-ia-operacional/actions/runs/41554477116/job/125649891080) concluiu com sucesso, incluindo os oito evals e o artifact `replay-results`. O [job live](https://github.com/tfcarv2/playbook-ia-operacional/actions/runs/41554477116/job/125650104721) terminou com `Error: PENDENTE: configurar GitHub Secret OPENAI_API_KEY` no passo de pré-requisitos, antes de calibração e geração.

Esse fail demonstra que a ausência de configuração não aprova a suíte. Não é evidência de regressão de prompt em um modelo real. A regressão negativa de saída v1 foi demonstrada somente no replay local. Os 58 arquivos publicados foram comparados aos arquivos locais validados, sem divergências. Atualizações documentais posteriores geram novos runs pelo trigger de push.

O provider local não declara tokens, preço ou latência de modelo. O promptfoo pode preencher contadores/custo zero e duração curta em seus relatórios: são metadados do replay e não evidência de modelo gratuito ou rápido. Os asserts de custo/latência e LLM-as-judge são removidos exclusivamente do modo replay; permanecem nos oito configs de produção e na suíte live.

## O que foi refinado

- Os testes de NetworkPolicy parseiam YAML e verificam associação de namespace, label e porta; presença de strings isoladas não basta.
- O assert saudável exige `saudavel=true` e lista vazia, impedindo citar pods falsamente em falha.
- Cada regra de fluxo exige comentário próprio, incluindo DNS TCP/UDP.
- O renderizador remove frontmatter e falha se faltar parâmetro; entradas da cadeia CP05 correspondem literalmente aos outputs anteriores.
- A pontuação do CP03 valida o corte ≥6 **e** nenhum zero; média isolada não é suficiente.
- Compartilhamento e telemetria estão desativados nos runners de replay. Uma tentativa de coleta de resultado sem telemetria explicitamente desativada foi bloqueada pela revisão automática; o teste negativo foi refeito com `PROMPTFOO_DISABLE_TELEMETRY=1` e `--no-share`, preservando o bloqueio em vez de contorná-lo.

## Antes da submissão definitiva

Revisar notas sugeridas pelo GPT e registrar notas humanas verdadeiras, configurar somente o Secret `OPENAI_API_KEY`, executar/calibrar o juiz e rodar a suíte live. Preservar as falhas, medir custo e latência e ajustar modelos/prompts quando necessário. Registrar link de run live e tornar checks obrigatórios na proteção de branch. Somente então atualizar esta situação para concluída.

## Migração para dois modelos OpenAI

Esta revisão remove a exigência de chave Anthropic em todos os runners e no workflow. A matriz atual contém GPT-4o mini e GPT-6 Luna. O baseline usa essa mesma matriz, os testes e a rubrica atuais sobre os prompts da revisão anterior. A comparação estruturada tem job próprio (`compare-models`), sem inventar notas humanas para liberar a avaliação completa.

Verificação local desta revisão: `npm test` aprovado; replay das oito configs com **12 passes, 0 falhas e 0 erros**. Isso valida a migração da configuração e os contratos, sem provar inferência real. Resultados reais da comparação, incluindo erros de API e reprovações, ficam no resumo e artifact `openai-model-comparison` do run mais recente do Actions. O registro histórico de falta de chave acima permanece como evidência daquela execução.

## Comparação real OpenAI — run #31

[Execução de 02/11/2026 às 22:56 (America/Sao_Paulo)](https://github.com/tfcarv2/playbook-ia-operacional/actions/runs/41562920321), commit `1376529191607e8da42063e8e7057fb073330edb`. Offline aprovado em 35s; 14 gerações reais sem cache em `compare-models`.

| Modelo | Passou / casos | Reprovações | Erros de API nos logs | Latência média / máxima | Custo total informado |
|---|---:|---:|---:|---|---:|
| GPT-4o mini | 3 / 7 | 4 | 0 | 2.471 / 4.546 ms | US$ 0,001413 |
| GPT-6 Luna | 7 / 7 | 0 | 0 | 3.255,71 / 4.667 ms | US$ 0,001198 |

Nota de triagem: 6/6 aprovados. Triagem de pods: 3/6 aprovados. NetworkPolicy: 1/2 aprovado. O custo é informado/calculado pelo promptfoo, sem conciliação de fatura. Ambos ficaram abaixo de 5s de latência máxima nesta amostra; isso não garante futuras chamadas nem valida os prompts abertos. O job corretamente reprovou por quatro testes do GPT-4o mini; `live` ficou skipped por dependência, e a revisão humana continua pendente. Não foram relaxados asserts para produzir status verde.

O resumo inicial do run contabilizou `row.error` como erro de API, mas esse campo do promptfoo também contém motivos de assert reprovado. Assim, a coluna Erros daquele resumo mostra incorretamente 4 para GPT-4o mini. Os três logs de eval registram **0 errors**. O agregador foi corrigido para usar `failureReason === 2` (erro) e separar `1` (assert), com teste local dos dois casos; o artifact original permanece preservado. Nas próximas execuções, o resumo também lista os motivos das reprovações. Correções de relato/documentação usam `[skip ci]` para não repetir as 14 chamadas pagas sem mudança nos prompts ou modelos.

Artifact: [openai-model-comparison](https://github.com/tfcarv2/playbook-ia-operacional/actions/runs/41562920321/artifacts/13197092439). Para investigar os quatro asserts, consultar `gradingResult`/`error` nos JSONs desse artifact antes de alterar prompts; esta migração não atribui causas sem inspecionar esses registros.
