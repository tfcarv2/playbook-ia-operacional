# Playbook de IA Operacional — Aegis

**Autor:** Thiago Fernandes de Carvalho. Projeto da Pós AIOps e IA na Engenharia de Cloud.

Fork real de [fabricioveronez/prompt-registry](https://github.com/fabricioveronez/prompt-registry), base `e32d6791b1d1edfe55ed8cea23cdbbd35f184a4e`. O histórico e as categorias do template foram preservados. Convenções em [CLAUDE.md](CLAUDE.md).

## Situação honesta da entrega

- Biblioteca, prompts, documentação, fixtures, oito configs e workflow implementados.
- Respostas dos CP01–06 geradas pelo **GPT-6, Codex nesta conversa**, com contexto compartilhado e sem chamadas independentes. São registros de elaboração assistida, não sessões isoladas.
- `promptfoo eval` executado em modo **replay** sobre respostas registradas para validar asserts. Replay não mede inferência, custo, latência de modelo ou julgamento LLM.
- **Comparação real executada:** no [run #31](https://github.com/tfcarv2/playbook-ia-operacional/actions/runs/41562920321), GPT-6 Luna passou nos 7 casos estruturados e GPT-4o mini em 3 de 7; zero erros de API nos logs. **Pendentes:** resolver as quatro reprovações do baseline e calibrar o juiz contra notas humanas antes da suíte completa. A pedido do autor, esta versão usa um único fornecedor; portanto não cumpre a exigência original de dois provedores do desafio. A suíte live falha de forma explícita sem configuração, sem fingir aprovação.
- O [workflow foi executado no GitHub](https://github.com/tfcarv2/playbook-ia-operacional/actions/runs/41554477116): **offline aprovado**; live bloqueado no preflight por `OPENAI_API_KEY` ausente. Evidências e limites em [VALIDACAO.md](VALIDACAO.md).

Não declarar o capstone integralmente concluído antes de fechar essas pendências. Nenhum sistema de produção foi acessado ou alterado.

## Biblioteca

| Item | Prompt parametrizável | Avaliação |
|---|---|---|
| [Triagem de pods](devops/triagem-de-pods/README.md) | [Prompt](devops/triagem-de-pods/prompt.md) | [Testes](devops/triagem-de-pods/promptfooconfig.yaml) |
| [Nota de triagem](devops/nota-de-triagem/README.md) | [Prompt](devops/nota-de-triagem/prompt.md) | [Testes](devops/nota-de-triagem/promptfooconfig.yaml) |
| [Causa-raiz de degradação](devops/causa-raiz/README.md) | [Prompt](devops/causa-raiz/prompt.md) | [Testes](devops/causa-raiz/promptfooconfig.yaml) |
| [Decisão de backpressure](devops/decisao-de-backpressure/README.md) | [Prompt](devops/decisao-de-backpressure/prompt.md) | [Testes](devops/decisao-de-backpressure/promptfooconfig.yaml) |
| [Diagnóstico da migração](devops/diagnostico-da-migracao/README.md) | [Prompt](devops/diagnostico-da-migracao/prompt.md) | [Testes](devops/diagnostico-da-migracao/promptfooconfig.yaml) |
| [Plano da migração](devops/plano-da-migracao/README.md) | [Prompt](devops/plano-da-migracao/prompt.md) | [Testes](devops/plano-da-migracao/promptfooconfig.yaml) |
| [Execução reversível da migração](devops/execucao-reversivel-da-migracao/README.md) | [Prompt](devops/execucao-reversivel-da-migracao/prompt.md) | [Testes](devops/execucao-reversivel-da-migracao/promptfooconfig.yaml) |
| [NetworkPolicy do Sentinel](devops/networkpolicy-sentinel/README.md) | [Prompt](devops/networkpolicy-sentinel/prompt.md) | [Testes](devops/networkpolicy-sentinel/promptfooconfig.yaml) |

Os oito itens cobrem seis checkpoints: o CP05 usa três elos independentes e encadeados. O [índice DevOps](devops/README.md) documenta a categoria. As demais categorias originais continuam disponíveis como parte do template.

## Checkpoints e evidências

| CP | Entrega |
|---|---|
| 01 | Triagem dos três snapshots, inclusive caso saudável |
| 02 | Few-shot de formato e notas dos três alertas crus |
| 03 | Causa operacional do Cerebro, alternativas e sanitização |
| 04 | Backpressure com cálculo de capacidade, trade-offs e rollback |
| 05 | Cadeia diagnóstico → plano → execução reversível, com outputs anteriores usados literalmente |
| 06 | NetworkPolicy v1 → revisão → v2, AND namespace/pod e default-deny |
| 07 | Fork do template, frontmatter idêntico e inputs documentados |
| 08 | Asserts determinísticos e execução replay; avaliação de APIs pendente |
| 09 | Rubrica/gate composto e roteiro de calibração; revisão humana/juiz live pendentes |
| 10 | Workflow, gates absolutos/relativos e [justificativa comparada](DESIGN.md) |

[Execuções e curadoria](evidencias/EXECUCOES.md) · [Outputs originais da sessão](evidencias/outputs.json) · [Rubrica e calibração](RUBRICA.md) · [Validação real](VALIDACAO.md).

## Rodar localmente

Requer Node.js 24 e npm. Não colocar chaves no Git.

```bash
npm ci
npm test
npm run eval:replay
```

Para inferência real, configure somente `OPENAI_API_KEY` no ambiente ou em GitHub Actions Secrets. Não é necessária chave de outro fornecedor. Todas as oito configs e a suíte agregada comparam **`openai:gpt-4o-mini`** e **`openai:gpt-6-luna`** com temperatura 0. No Luna, `reasoning_effort: none` evita raciocínio adicional nesta avaliação de custo/latência; os limites continuam sujeitos a medição.

O GPT-4o mini permanece como baseline legado. A [documentação oficial de descontinuações](https://developers.openai.com/api/docs/deprecations) prevê seu encerramento em **14/01/2027** e recomenda o [GPT-6 Luna](https://developers.openai.com/api/docs/models/gpt-6-luna). Atualizar o baseline antes dessa data. Disponibilidade e quota dependem da conta.

```bash
# 7 casos estruturados × 2 modelos; sem juiz LLM ou calibração humana:
node scripts/run.cjs compare
node scripts/model-report.cjs results/compare
# Suíte completa, incluindo juiz:
npm run eval:live
# Preencher notas humanas verdadeiras antes de validar calibração:
npx promptfoo eval -c calibracao.yaml -o results/calibracao.json --no-cache --no-share
node scripts/calibrate.cjs results/calibracao.json
```

No Actions, `offline` valida contratos e replay; `compare-models` executa a comparação estruturada e publica tabela/artifact com passes, falhas, erros, custo informado e latência. Depois, `live` exige as notas humanas antes de calibrar o juiz e avaliar a suíte completa. A comparação estruturada não substitui essa calibração nem a validação das respostas abertas. Não repetir chamadas apenas para obter aprovação.

## Método e reutilização

A direção de meta-prompting foi: “gere uma biblioteca parametrizável para os cenários, proponha contratos de saída verificáveis, critique lacunas e refine sem inventar fatos ou ações”. A curadoria especificou evidências, parâmetros, formatos e critérios de revisão. O meta-prompt não é necessário como entrega; cada item final está em `prompt.md`, separado da documentação humana.

Ao copiar para um chat, remover o frontmatter e preencher os placeholders. O renderizador faz isso para o promptfoo e rejeita inputs ausentes. Os prompts recebem apenas texto de entrada: não contêm chamadas ao cluster, AWS ou agentes. Scripts de teste pertencem à infraestrutura de avaliação, não ao modelo analisando o incidente.

Versionamento: semver por prompt e commits semânticos, como `feat(devops): adiciona triagem de pods`. Iterações v1/v2 da NetworkPolicy são rascunhos pré-publicação; o item curado inicia em 1.0.0. Mudanças posteriores devem atualizar prompt.md e README.md, índices e testes juntos, preservando evidências anteriores.
