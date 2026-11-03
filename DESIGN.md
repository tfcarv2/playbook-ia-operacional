# Decisões do gate — CP10

## Regra de aprovação

Todo teste estruturado deve passar nos asserts, custo ≤ US$ 0,01 e latência ≤ 5.000ms em chamadas sem cache. CP03 passa com total ≥6/8 e nenhum zero; os outros prompts abertos usam `llm-rubric` ≥0,8. Erro de provider, relatório vazio, resposta truncada ou escore malformado não aprova. Os modelos configurados são candidatos: o benchmark pode mostrar que não cabem nesses limites.

Além do gate absoluto, comparar os mesmos casos/providers entre base e candidato. Não permitir queda de pass rate. Para o juiz do CP03, tolerar no máximo 1 ponto de queda na mediana do total, sempre mantendo cada chamada acima do corte. Esse limite é uma decisão explícita de risco, não prova estatística de equivalência.

| Decisão | Escolha | Alternativa 1: ganho / perda | Alternativa 2: ganho / perda |
|---|---|---|---|
| O que bloqueia | Determinístico + operacional + juiz calibrado + comparação | Apenas formato: barato e previsível, mas aprova diagnóstico errado | Só juiz: flexível, mas pode ignorar contrato, custo e latência |
| Corte do CP03 | ≥6 e nenhum zero, como enunciado | ≥7 ou 8: maior rigor, mais falso negativo/flutuação | Só média ≥6: simples, mas permite zero em honestidade/segurança e viola o requisito |
| Flutuação de juiz | Temperatura 0, corte absoluto e tolerância relativa de 1 ponto no total | Nenhuma tolerância: detecta qualquer queda, mas aumenta ruído | Votação 2/3: reduz efeito de uma avaliação, triplica custo e pode esconder falha isolada; não escolhida nesta versão |
| Cobertura por evento | Suíte inteira por push/PR confiável | Só prompts alterados: mais barato, pode perder regressão em helper, rubrica ou interação | Suite no merge/noturna: reduz custo por PR, detecta tarde e não cumpre gate antes da integração |
| Base de comparação | Rodar base e head com casos/modelos iguais | Baseline histórico fixo: barato, envelhece e confunde evolução de provider | Só corte absoluto: não detecta queda de 8 para 6 se ambos passam |
| Política de custo | Configs compactos, concorrência 1, tempo máximo de job, budgets do provedor e sem cache para medir | Cache persistente: barato, mascara latência de chamadas frias e drift | Modelo grande em tudo: potencial de qualidade, custo/latência possivelmente acima do requisito |
| Credenciais | GitHub Secrets e nenhum live em fork externo | Segredos no YAML/.env commitado: prático, expõe credenciais, rejeitado | OIDC para serviço corporativo: credenciais efêmeras melhores, requer infraestrutura e API compatível não existentes neste cenário |
| Publicação do resultado | Action oficial comenta PR, `no-share=true`; artifacts do workflow | Compartilhar em viewer público: facilita leitura, expõe dados reais se não sanitizados | Logs somente: simples, pior auditoria/comparação e compreensão no PR |
| Mutação de dados na análise | Prompts só recebem texto e recomendam | Agente com ferramentas: executa ações, fora do escopo e mais risco | Script com credenciais no prompt: permite coleta mas expõe segredos e viola separação de responsabilidades |

## Implementação e primeiros commits

A action oficial é o ponto de partida para avaliação e comentário no PR. O código da versão fixada foi consultado: ela avalia o checkout atual. Por isso o workflow adiciona explicitamente uma execução da base e do candidato para comparação; não confunde comentário da action com avaliação before/after garantida.

O primeiro commit de biblioteca não tem suíte equivalente na base do template: é bootstrap com gate absoluto. Depois disso, base e candidato devem ter o mesmo conjunto de casos/modelos para comparação. Se casos ou providers mudarem, o comparador falha e exige revisão do baseline; nunca “aprova” porque a base está vazia. Alterações no avaliador em si também precisam revisão, pois um PR pode enfraquecer testes enquanto altera o prompt.

GitHub Actions executa o job de validação local sem secrets em qualquer PR. A avaliação live roda em push e PR do próprio repositório; forks externos recebem somente checks locais, pois não têm secrets. Não usar `pull_request_target` executando código de terceiros com privilégios. O token de comentário só tem `contents:read` e `pull-requests:write`, e checkout não persiste credenciais.

O workflow estar versionado não ativa proteção de branch. Para bloquear integração, o dono precisa tornar os checks `offline` e `live` obrigatórios na regra de proteção da branch. Essa configuração não foi aplicada automaticamente. Forks podem exigir habilitar Actions na interface. A execução live também depende das duas chaves e da calibração humana: sua ausência aparece como falha explícita, nunca como validação concluída.

## Carga e orçamento

A suíte tem 12 casos × 2 geradores = 24 chamadas por revisão, mais 10 julgamentos de saídas abertas (5 casos × 2). Rodar base e head usa aproximadamente 68 chamadas, antes da calibração (3 chamadas de juiz) e eventual segunda avaliação da action para comentário. É um teto de quantidade de chamadas previsto, não custo medido. Tokens de entrada/saída, retries e preços reais variam.

O limite de US$ 0,01 refere-se a cada geração avaliada; custo do juiz deve ser contabilizado separadamente. Definir limites de gasto no provedor e revisar usage dos artifacts. Timeout e concorrência 1 limitam duração e pressão, mas não são teto monetário garantido. Dados reais devem ser sanitizados antes de entrarem em fixtures ou artifacts.
