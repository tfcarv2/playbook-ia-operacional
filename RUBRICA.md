# Gate de causa-raiz e calibração

Os critérios abaixo são os quatro do CP09, sem troca por avaliação genérica:

| Critério | 0 | 1 | 2 |
|---|---|---|---|
| Causa-raiz correta — reindexação travada saturando heap, levando a circuit breaker, timeouts de busca e queda do cache | Apenas sintoma ou causa inventada | Identifica parte da cadeia | Cadeia causal completa, com evidências e limites |
| Correlação × causa — separa causa e consequência; cache hit caindo é efeito | Inverte causa/efeito | Separa parcialmente | Separa causa operacional, consequência e amplificadores |
| Ação proporcional — conter/reagendar reindexação e rever heap/limites com evidência | Ação inadequada ou destrutiva | Mitigação plausível incompleta | Mitigação proporcional com validação e pré-requisitos |
| Honestidade epistêmica — reconhece limites dos dados | Fabrica certeza ou execução | Algumas ressalvas | Distingue fatos, hipóteses e lacunas de forma consistente |

Cada critério vai de 0 a 2. **Aprovação = soma ≥ 6 E todos os critérios > 0.** A tarefa teve progresso de 38% para 41%; “travada” no enunciado não exige afirmar ausência absoluta de progresso.

O `llm-rubric` exige a saída padronizada `C1=n;C2=n;C3=n;C4=n;total=n;...` na justificativa. O script `gate.cjs` valida faixas, soma e o corte composto; não aceita uma declaração `pass=true` incompatível com as notas. Score agregado isolado não é suficiente para provar que nenhum critério zerou.

## Calibração a concluir pelo autor

[calibracao.json](evidencias/calibracao.json) contém três respostas de qualidade distinta e notas **sugeridas por IA**, identificadas como tal. Os campos `humanScores` estão nulos e `reviewedByHuman` está falso. **Não houve pontuação humana nem calibração concluída nesta sessão.**

1. O autor pontua cada resposta sem copiar automaticamente as sugestões, preenche os quatro escores e confirma `reviewedByHuman` após a revisão real.
2. Com chave OpenAI configurada, executa `promptfoo eval -c calibracao.yaml -o results/calibracao.json --no-cache`.
3. Executa `node scripts/calibrate.cjs results/calibracao.json`. O script exige amostras, quatro notas válidas, diferença máxima de 1 por critério e mesma decisão de aprovação da avaliação humana.
4. Se divergir, ajusta a instrução do juiz, preserva a tentativa anterior e executa novamente sobre as três amostras. Depois valida uma amostra adicional que não participou do ajuste para reduzir overfitting.

O conjunto inclui respostas deliberadamente ruins: os testes `llm-rubric` dessas amostras devem reprovar. Na calibração, o importante é concordar com a avaliação humana, inclusive ao reprovar. O pipeline trata esses fails esperados por meio do script de calibração e continua a falhar se houver erro/malformação/ausência de amostras. Isso não é exceção ao gate da suíte de produção.

## Não determinismo e custo

Temperatura zero reduz variabilidade, sem eliminá-la. A suíte de produção mantém gates absolutos em cada teste e compara medianas do total do CP03 entre revisões, tolerando até 1 ponto no total somente quando o corte absoluto continua atendido. Não repetir automaticamente até obter aprovação. Toda repetição deve ser registrada; novas tentativas por falha técnica não contam como aprovação da anterior.

Juiz escolhido: GPT-4o mini como candidato barato para avaliação inicial; o autor deve calibrá-lo antes de confiar nele. Usar o mesmo fornecedor do gerador pode produzir viés compartilhado. Os dois geradores agora são OpenAI (GPT-4o mini e GPT-6 Luna); essa comparação não oferece independência de fornecedor em relação ao juiz. Uma revisão posterior pode comparar com juiz de outro provedor, com custo adicional.
