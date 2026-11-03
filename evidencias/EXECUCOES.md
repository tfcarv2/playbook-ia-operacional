# Execuções assistidas — CP01 a CP06

Respostas produzidas pelo GPT-6, Codex desta conversa, em 02/11/2026. Contexto compartilhado; sem chamadas independentes de API. Os parâmetros exatos de cada caso estão nos configs correspondentes. Não houve acesso a infraestrutura nem envio de mensagens.

## cp01-1

```text
{
  "saudavel": false,
  "resumo": "Um pod com reinícios recorrentes por falta de memória; demais sem falha observada.",
  "problemas": [
    {
      "pod": "sentinel-api-7d9c8b6f4-h4m2t",
      "causa_provavel": "OOMKilled: pressão de memória ao carregar cache; limite de 512Mi atingido. Leak não comprovado.",
      "evidencias": [
        "CrashLoopBackOff, 14 reinícios e lastState OOMKilled/137",
        "Logs mostram cache 410Mi, heap 498Mi/512Mi e fatal out of memory"
      ],
      "proxima_acao": "Preservar logs anteriores e comparar mudança do cache/versão. Avaliar reduzir cache ou reverter mudança por procedimento aprovado; dimensionar memória com capacidade dos nós, sem aumento cego."
    }
  ]
}
```

## cp01-2

```text
{
  "saudavel": false,
  "resumo": "Dois pods indisponíveis por causas distintas.",
  "problemas": [
    {
      "pod": "sentinel-api-7d9c8b6f4-zzp10",
      "causa_provavel": "ImagePullBackOff: registry retorna manifest unknown para tag 2.9.2; referência de imagem ausente ou incorreta.",
      "evidencias": [
        "Image registry.aegis.io/sentinel-api:2.9.2",
        "Failed to pull image: manifest unknown, seguido de ErrImagePull"
      ],
      "proxima_acao": "Verificar publicação e referência da tag no pipeline; corrigir para imagem existente/aprovada, sem presumir problema de senha."
    },
    {
      "pod": "sentinel-ingest-8f7a9c5b-4dkqm",
      "causa_provavel": "Insufficient cpu: nenhum dos seis nós comporta o request de 2 CPUs no escalonamento.",
      "evidencias": [
        "Pending com request cpu: 2",
        "FailedScheduling: 0/6 nodes available, 6 Insufficient cpu"
      ],
      "proxima_acao": "Verificar capacidade alocável e requests; adicionar capacidade ou ajustar request após medir demanda. Não reduzir request às cegas."
    }
  ]
}
```

## cp01-3

```text
{
  "saudavel": true,
  "resumo": "Nenhum pod problemático no snapshot. Todos Ready 1/1 e Running; um reinício há três dias é histórico isolado, sem evidência de falha atual. Saúde restrita à janela observada.",
  "problemas": []
}
```

## cp02-1

```text
ALERTA: Sentinel - autoscaler no máximo (60/60), CPU média 88% e fila do Relay crescendo 2k/min
IMPACTO: risco de atraso de alertas; tenant stark-industries envia 4x o baseline; alcance total não informado
HIPÓTESE INICIAL: aumento de volume após onboarding de nova região excede a capacidade disponível
AÇÃO IMEDIATA: proposta: validar capacidade e contenção por tenant aprovada; não ampliar réplicas sem avaliar dependências
ESCALAR PARA: @responsavel-a-confirmar imediatamente; resolver o contato real na escala do Sentinel
```

## cp02-2

```text
ALERTA: Relay - rejeição de ingestão em 6% por 8min, tenant wakanda-systems
IMPACTO: ingestão degradada para o tenant; volume de dados não aceitos e alcance total não informados
HIPÓTESE INICIAL: buffer saturado após deploy às 02:55; correlação temporal ainda requer validação
AÇÃO IMEDIATA: proposta: comparar configuração antes/depois e avaliar rollback aprovado se compatível; não afirmar que já foi iniciado
ESCALAR PARA: @relay-core imediatamente, conforme contato de referência do padrão; confirmar escala vigente
```

## cp02-3

```text
ALERTA: Forge - consumer lag de 9min e crescendo, batch forge-batch-ingest atrasado
IMPACTO: Sentinel começando a atrasar; tenants afetados e magnitude ainda não informados
HIPÓTESE INICIAL: falha do job anterior acumulou trabalho e atrasou o batch atual
AÇÃO IMEDIATA: proposta: verificar falha anterior, backlog e idempotência antes de retomar o job; evitar reprocessamento duplicado
ESCALAR PARA: @data-platform para avaliar recuperação antes de agravar o atraso; confirmar escala vigente
```

## cp03

```text
# Análise preliminar — Cerebro, 13/05/2026

## Conclusão e confiança
A causa operacional mais sustentada é a reindexação que atravessou sua janela noturna e continuou concorrendo com a carga de produção, pressionando heap, buffers e escrita. Isso levou a GC com pouca recuperação de memória, circuit breaker, timeouts e buscas parciais. A queda de cache hit é consequência compatível com essa pressão/evictions e amplifica o custo de busca; não é a causa inicial demonstrada. Confiança alta na contenção observada, moderada na atribuição causal completa; ainda não sabemos por que a reindexação ficou tão lenta.

## Evidências correlacionadas
- A configuração agenda 02:00 e duração média 90min: término usual 03:30. Às 09:58 a tarefa 88123 ainda estava em 41%, mais de seis horas além do término esperado. Avançou de 38% às 08:02 a 41% às 09:58: progresso muito lento, não paralisação absoluta.
- De 08:00 a 10:00, p99 sobe de 850 para 6700ms (7,88x), indexação de 4200 para 12400 docs/s (2,95x), heap de 61% para 94% (+33 p.p.) e cache hit de 74% para 29% (-45 p.p.). Vazão de indexação pode incluir tráfego regular e reindex; não atribuir toda a diferença ao job sem separar origens.
- Logs mostram throttle no shard 7, fila de escrita 150/200 → 188/200 → 200/200, rejeições de bulk e GC old de 7.6gb para 7.4gb em heap de 8gb: pouca memória recuperada.
- Às 09:58, busca de 5031ms excede timeout de 5000ms, 11/12 shards respondem e breaker dispara a 96%. Depois há CircuitBreakingException e falha de todos os shards em 3 de 20 queries. Isso não prova perda física dos dados.

## Causa, consequências e lacunas
Hipótese causal: reindexação prolongada e escrita concorrente → pressão nos buffers/heap e GC → backpressure/rejeições + circuit breaker → timeouts e resultados incompletos. Cache evictions e queda de hit reforçam a sobrecarga. Disco lento, hotspot, queries caras ou configuração de shard podem contribuir, mas faltam I/O, CPU, waits, tamanho de shards, tarefas por nó e histórico para confirmar. Não há evidência de corrupção, leak específico ou erro de uma versão.

## Ação proporcional
Propor ao responsável conter/throttlar ou pausar a reindexação pelo mecanismo suportado, preservando tarefa e progresso e avaliando se pode ser retomada. Priorizar busca de produção e medir p99, heap pós-GC, rejeições, cache e completude. Reprogramar a janela e dimensionar o trabalho para terminar antes do pico. Rever refresh_interval, concorrência e buffers com testes de frescor e custo; o valor 1s aumenta frequência de refresh, mas seu efeito precisa ser medido. Não aumentar heap sem medir RAM disponível e memória fora do heap; não adicionar shards nem reiniciar toda a frota às cegas.

## Validação e privacidade
Confirmar que conter o job reduz pressão com carga comparável; validar todos os shards e frescor de resultados antes de encerrar. Usar SLO real, não inventar recuperação. Antes de enviar dados reais a um modelo externo, pseudonimizar host/pod/tenant/índice, remover tokens e payloads, preservar relação entre entidades, sequência, intervalos e métricas. Segredos devem ser removidos; deslocar timestamps consistentemente se necessário. Aprovar destino, região, retenção e acesso ao provedor. Nenhuma ação foi executada.
```

## cp04

```text
# Decisão — Backpressure do Relay

## Capacidade e SLA
Se 180k msgs/s é capacidade efetiva agregada na mesma unidade do pico, o excesso é 320k-180k=140k msgs/s. Por 25min (1500s), acumula até 210 milhões de mensagens. Isso equivale a 1166,7s (19min27s) de trabalho a 180k/s sem novas chegadas; não é uma medição de lag, mas revela que buffering por si só não demonstra SLA de 15min. Sem capacidade separada por consumidor e tráfego pós-pico, não há ETA de drenagem confiável. Drenagem = backlog/(capacidade - novas chegadas), apenas se o denominador for positivo. Retenção de 4h não garante latência nem durabilidade em pane.

## Alternativas
| Opção | Vantagem | Limite e custo |
|---|---|---|
| Prioridade e reserva para Sentinel | Protege o alerting de 60s | Forge pode passar de 15min; precisa de orçamento por fluxo e evitar starvation. |
| DLQ para todo excesso | Parece isolar backlog | DLQ é para falhas/poison messages, não fila primária de sobrecarga; replays podem perder ordem e mascarar lag. Usar buffer durável de overflow com propósito explícito. |
| Isolar por tenant, quotas e fairness | Reduz noisy neighbor | Aumenta complexidade e cardinalidade; cliente limitado precisa retry seguro e armazenamento durável na origem. |
| Autoscaling de consumidores | Aumenta processamento se houver paralelismo | Não remove gargalo de broker/partições/Forge, pode agravar dependências e custo já 8% acima. |

## Recomendação condicionada
Combinar filas/lanes lógicas de prioridade com capacidade reservada ao Sentinel, quotas justas por tenant, buffer durável para ingestão do Forge e scaling limitado por capacidade efetiva. Não prometer viabilidade numérica dos SLAs: faltam proporção de eventos por destino, bytes por mensagem, capacidade por consumidor, durabilidade/retenção e limites de partições. Se cada evento precisa de dois destinos, contabilizar fan-out e unidades antes de usar 180k como capacidade total.

Nenhuma mensagem deve ser descartada silenciosamente. Um ACK só deve ocorrer após persistência durável; retries com backoff/jitter e idempotência evitam duplicação de efeito. Onde a origem não puder armazenar/repetir com segurança, rejeitar tráfego viola a exigência de não perda: é preciso capacidade durável adicional ou renegociar volume. Não confundir zero perda absoluta com uma garantia possível sem especificar falhas e durabilidade.

## Implantação e rollback
1. Medir lag por consumidor/tenant, idade mais antiga, taxa de chegada/saída, armazenamento e custo. Definir alertas antes de 60s e 15min com margens aprovadas.
2. Pilotar fairness e reserva com um tenant, sem mudar contratos de eventos. Validar prioridade e limites de capacidade no pico de 320k por 25min.
3. Adicionar buffer de overflow persistente e testar falhas/replay, duplicidades e retenção. Dimensionar em bytes com tamanho real e fator de replicação.
4. Permitir scaling com teto de custo, ramp-up e saúde dos downstreams. Definir dono e comparar custo incremental com impacto de violação; estar 8% acima não autoriza sacrificar SLA.
5. Expandir por canários; reverter roteamento se houver regressão, preservando offsets e mensagens já aceitas. Não apagar filas para reverter.

Critério de pronto: teste representativo mantém idade de alerting <60s e Forge <=15min, sem perda na reconciliação, sem duplicação de efeito e com custo aceito. Se capacidade não fechar, explicitar incompatibilidade entre demanda, orçamento e SLA para decisão executiva, sem afirmar que uma combinação garante os três.
```

## cp05-1

```text
## Diagnóstico do Forge
Job cron a cada 60min, 14 etapas Spark com duração aproximada de 40min e escrita em tabelas particionadas por hora. Falha de um lote acumula o próximo. Sentinel lê agregados, Cerebro indexa transformados e billing depende de relatórios noturnos. Latência ponta a ponta pode ser próxima de espera pelo cron + processamento; 100min é ordem de grandeza de pior espera normal, não SLA medido.

Contratos a inventariar: esquema e chave de evento, ordering, mutabilidade de agregados, particionamento, watermark, eventos tardios, offset/checkpoint do Relay, idempotência de cada uma das 14 etapas e dos sinks, regras financeiras e cortes de billing. Não há dados para afirmar exactly-once ponta a ponta. Eventos duplicados/reprocessados devem produzir efeito idempotente.

Riscos: operações stateful e joins sem fronteira de lote, dados tardios, escrita simultânea batch/stream, dupla indexação e dupla cobrança. Estratégia de base: leitura shadow de Relay em consumer group independente, destino/tabelas versionadas separados, comparação com batch por janelas fechadas e transição gradual por consumidor. Não desligar o batch até demonstrar paridade e rollback. Métricas e critérios de paridade devem ser aprovados antes do piloto.
```

## cp05-2

```text
## Plano incremental baseado no diagnóstico anterior
1. Inventariar as 14 etapas e contratos listados no diagnóstico; classificar stateless/stateful e identificar chave idempotente. Gate: revisão por dados, SRE, consumidores e billing.
2. Instrumentar baseline batch, offsets e qualidade por janela. Criar consumer group shadow e sinks separados; manter o batch autoritativo. Gate: nenhum efeito de cobrança/indexação duplicado.
3. Portar primeiro etapas compatíveis para microbatches em ambiente de teste, com estado/checkpoints duráveis, event time, watermark e late events definidos por contrato. Tamanho inicial é hipótese a medir, não escolher um intervalo como SLA garantido.
4. Rodar shadow com eventos representativos, falhas e replay. Comparar contagens, somas financeiras, IDs, agregados, atraso e resultados Cerebro por janelas equivalentes; observar também eventos tardios e correções.
5. Cortar por tenant/consumidor com flags e views versionadas: primeiro consumidor de menor risco escolhido com owners; billing permanece batch até conciliação financeira aprovada. Sentinel e Cerebro só mudam após testes de compatibilidade.
6. Expandir canário, preservar batch/offsets e documentar rollback. Aposentar cron somente após janela de confiança aprovada incluindo fechamento de billing e recuperação de falhas.

Cada fase tem dono funcional e gate verificável; falha bloqueia a próxima. Não compartilhar sink autoritativo entre batch e streaming sem protocolo de propriedade por janela/tenant. Não há big-bang nem alteração de contrato silenciosa.
```

## cp05-3

```text
## Plano executável e reversível
Pré-condições herdadas: contratos inventariados, batch autoritativo, consumer group shadow, sinks separados, critérios de paridade e keys aprovados. Nenhuma dessas etapas foi executada nesta sessão.

| Etapa | Dono | Entrega verificável | Gate / reversão |
|---|---|---|---|
| Contratos e baseline | Dados + owners dos consumidores | Mapa das 14 etapas, keys, offsets, schemas e baseline por janela | Sem aceite de billing/Sentinel/Cerebro, parar. |
| Piloto shadow | Dados + SRE | Consumer independente, checkpoints e sinks versionados | Em falha, parar shadow; batch continua sem alteração. |
| Validação e caos | QA + dados | Replay e falha não duplicam efeito; contagens e totais financeiros reconciliados | Divergência bloqueia avanço; guardar casos para regressão. |
| Canário | Owners de produto + SRE | Roteamento por tenant/consumidor e painel comparativo | Reverter flag/view para batch se violar tolerância aprovada. |
| Billing | Financeiro + dados | Fechamento paralelo conciliado com trilha de auditoria | Uma única fonte autoritativa por janela; sem conciliação, manter batch. |
| Aposentadoria | Dados + operações | Janela de confiança e exercício de restore/rollback concluídos | Só então desabilitar cron; preservar retenção e plano de recuperação. |

Rollback detalhado: congelar expansão; registrar última janela/offset confirmado e quem é autoridade de cada faixa; encaminhar novas leituras ao batch; interromper efeitos do stream sem apagar estado; reconciliar registros já materializados; reprocessar somente intervalos seguros com keys idempotentes. Garantir que o batch ainda tenha dados retidos e capacidade de recuperar o atraso; se retenção não cobrir, rollback não é seguro e deve ser bloqueado.

Critérios de pronto propostos, a pactuar antes do rollout: zero diferença financeira não explicada, sem IDs faltantes/duplicados nas janelas fechadas, latência dentro do SLO acordado e consumo/custo dentro do orçamento aprovado, inclusive com atraso e replay. Valores de tolerância e duração da janela não foram fornecidos, logo não são inventados. Monitorar watermark, event lag, checkpoints, rejeições e paridade continuamente. Não prometer exactly-once por usar microbatch; comprovar efeito idempotente nos sinks.
```

## cp06-v2

```yaml
# Bloqueia ingress e egress de todo o namespace por padrão.
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: sentinel-default-deny
  namespace: sentinel-prod
spec:
  podSelector: {}
  policyTypes: [Ingress, Egress]
  ingress: []
  egress: []
---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: sentinel-allow
  namespace: sentinel-prod
spec:
  podSelector:
    matchLabels:
      app: sentinel
  policyTypes: [Ingress, Egress]
  ingress:
    # Relay legítimo: namespace E pod no mesmo peer (AND); portas de entrada não fornecidas.
    - from:
        - namespaceSelector:
            matchLabels:
              kubernetes.io/metadata.name: relay-prod
          podSelector:
            matchLabels:
              app: relay
    # Gateway legítimo: somente pods api-gateway do namespace edge.
    - from:
        - namespaceSelector:
            matchLabels:
              kubernetes.io/metadata.name: edge
          podSelector:
            matchLabels:
              app: api-gateway
  egress:
    # Consulta ao warehouse PostgreSQL do Forge.
    - to:
        - namespaceSelector:
            matchLabels:
              kubernetes.io/metadata.name: forge-prod
          podSelector:
            matchLabels:
              app: forge
      ports:
        - protocol: TCP
          port: 5432
    # Busca no Elasticsearch do Cerebro.
    - to:
        - namespaceSelector:
            matchLabels:
              kubernetes.io/metadata.name: cerebro-prod
          podSelector:
            matchLabels:
              app: cerebro
      ports:
        - protocol: TCP
          port: 9200
    # Resolução DNS interna, incluindo fallback TCP.
    - to:
        - namespaceSelector:
            matchLabels:
              kubernetes.io/metadata.name: kube-system
          podSelector:
            matchLabels:
              k8s-app: kube-dns
      ports:
        - protocol: UDP
          port: 53
        - protocol: TCP
          port: 53
```

## cp06-v1

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: sentinel-allow
  namespace: sentinel-prod
spec:
  podSelector:
    matchLabels:
      app: sentinel
  policyTypes: [Ingress, Egress]
  ingress:
    # Relay: eventos para Sentinel, mas esta versão não restringe namespace.
    - from:
        - podSelector:
            matchLabels:
              app: relay
    # Gateway: requisições para Sentinel, namespace ausente nesta tentativa.
    - from:
        - podSelector:
            matchLabels:
              app: api-gateway
  egress:
    # Warehouse, sem namespace ainda.
    - to:
        - podSelector:
            matchLabels:
              app: forge
      ports:
        - protocol: TCP
          port: 5432
```

## Revisão da NetworkPolicy

A v1 não atende: seletores só de pod buscam no namespace local, não nos namespaces reais; faltam default-deny explícito, Cerebro e DNS. A revisão perguntou: namespace/pod estão no mesmo peer (AND)? Há DNS TCP além de UDP? O allow-all antigo será substituído? Existem políticas aditivas que continuam liberando tráfego? Cada regra tem comentário?

A v2 substitui o nome sentinel-allow, acrescenta default-deny e peers namespace+pod, Forge 5432, Cerebro 9200 e DNS 53 UDP/TCP. Ainda exige CNI com suporte, labels reais e testes positivos/negativos no cluster. Portas de ingress não foram dadas: a política restringe origem, mas permite as portas dessas origens; confirmar contratos antes de limitar mais. Outros pods do namespace também ficam bloqueados pelo default-deny e precisam de inventário de fluxos antes de aplicar. NetworkPolicies são aditivas: auditar as outras políticas, pois um deny não revoga outro allow-all. Não foi aplicada no cluster.

## Curadoria e resultados insuficientes

CP01: impedir falso positivo por reinício de três dias. CP02: não importar fatos dos exemplos e marcar contato ausente como a confirmar. CP03: não confundir cache hit com gatilho nem dizer que a tarefa não avançou. CP04: DLQ não é overflow genérico e 4h de retenção não provam SLA. CP05: entradas dos elos 2 e 3 são outputs literais anteriores, validados automaticamente. CP06: preservar a v1 ruim permite demonstrar que o teste realmente rejeita a regressão.
