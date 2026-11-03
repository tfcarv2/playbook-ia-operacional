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
| Workflow GitHub Actions | Arquivo implementado; execução remota será registrada após publicação | Não confundir arquivo com execução comprovada |
| Kubernetes/CNI, Elasticsearch, Relay, Spark e warehouse | Não acessados | Nenhuma mudança operacional aplicada |
| Dois provedores reais | **Pendente** | Configurar dois modelos não equivale a executá-los |
| Latência ≤5s e custo ≤US$0,01 por geração | **Pendente** | Os tempos do replay medem leitura de fixture, não inferência |

Saída real do promptfoo: [REPLAY.txt](evidencias/REPLAY.txt). Resumo com eval IDs: [replay-resumo.json](evidencias/replay-resumo.json). Os outputs da sessão estão em [outputs.json](evidencias/outputs.json), separados dos resultados do executor.

O provider local não declara tokens, preço ou latência de modelo. O promptfoo pode preencher contadores/custo zero e duração curta em seus relatórios: são metadados do replay e não evidência de modelo gratuito ou rápido. Os asserts de custo/latência e LLM-as-judge são removidos exclusivamente do modo replay; permanecem nos oito configs de produção e na suíte live.

## O que foi refinado

- Os testes de NetworkPolicy parseiam YAML e verificam associação de namespace, label e porta; presença de strings isoladas não basta.
- O assert saudável exige `saudavel=true` e lista vazia, impedindo citar pods falsamente em falha.
- Cada regra de fluxo exige comentário próprio, incluindo DNS TCP/UDP.
- O renderizador remove frontmatter e falha se faltar parâmetro; entradas da cadeia CP05 correspondem literalmente aos outputs anteriores.
- A pontuação do CP03 valida o corte ≥6 **e** nenhum zero; média isolada não é suficiente.
- Compartilhamento e telemetria estão desativados nos runners de replay. Uma tentativa de coleta de resultado sem telemetria explicitamente desativada foi bloqueada pela revisão automática; o teste negativo foi refeito com `PROMPTFOO_DISABLE_TELEMETRY=1` e `--no-share`, preservando o bloqueio em vez de contorná-lo.

## Antes da submissão definitiva

Revisar notas sugeridas pelo GPT e registrar notas humanas verdadeiras, configurar os dois Secrets, executar/calibrar o juiz e rodar a suíte live. Preservar as falhas, medir custo e latência e ajustar modelos/prompts quando necessário. Registrar link de run live e tornar checks obrigatórios na proteção de branch. Somente então atualizar esta situação para concluída.
