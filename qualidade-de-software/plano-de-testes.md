# Etapa 2 — Plano de Testes — EquipCheck Mini

## 1. Escopo e objetivos

Este plano cobre os testes do EquipCheck Mini referentes aos seis requisitos funcionais do cenário MegaCore Labs. O objetivo é demonstrar que o banco de dados e a aplicação aplicam corretamente as regras de classificação, desbloqueio, rastreabilidade e imutabilidade do histórico.

## 2. Riscos priorizados

| ID | Risco | Requisito | Probabilidade | Impacto |
|---|---|---|---|---|
| R01 | Classificação incorreta libera equipamento fora da faixa | RF03 | Alta | Crítico |
| R02 | Equipamento bloqueado liberado sem nova inspeção aprovada | RF04 | Alta | Crítico |
| R03 | Alteração sem responsável ou justificativa é aceita | RF05 | Média | Alto |
| R04 | Histórico pode ser adulterado ou excluído | RF06 | Baixa | Crítico |
| R05 | ID inválido ou duplicado é cadastrado | RF01 | Média | Alto |

## 3. Casos de teste — Caixa-preta (valores-limite e partições)

| ID | Requisito | Entrada | Resultado esperado |
|---|---|---|---|
| CT01 | RF03 | Medição 9.99 | Classificação: Bloqueado |
| CT02 | RF03 | Medição 10.00 | Classificação: Apto |
| CT03 | RF03 | Medição 20.00 | Classificação: Apto |
| CT04 | RF03 | Medição 20.01 | Classificação: Bloqueado |
| CT05 | RF04 | Inspeção dentro da faixa sem aprovação | Status do equipamento permanece Bloqueado |
| CT06 | RF04 | Inspeção dentro da faixa com aprovação | Status muda para Apto |
| CT07 | RF04 | Revogar aprovação da última inspeção | Status volta para Bloqueado |
| CT08 | RF05 | Alterar versão sem responsável | Rejeitado com mensagem de erro |
| CT09 | RF05 | Alterar versão com justificativa de 9 caracteres | Rejeitado (mínimo 10 caracteres) |
| CT10 | RF05 | Repetir a mesma justificativa anterior | Rejeitado |
| CT11 | RF06 | Tentar excluir equipamento | Rejeitado pelo trigger |
| CT12 | RF06 | Tentar alterar registro em historico_equipamento | Rejeitado pelo trigger |
| CT13 | RF01 | Cadastrar com ID repetido (EQP-001 já existe) | Rejeitado com erro de duplicidade |
| CT14 | RF01 | Cadastrar com ID fora do formato (EQ-1042) | Rejeitado pelo CHECK |
| CT15 | RF02 | Medição com valor não numérico | Rejeitado |

## 4. Casos de teste — Caixa-branca (decisão da classificação)

A decisão central do sistema é a coluna gerada `classificacao` na tabela `inspecao`:

```sql
IF(medicao BETWEEN 10.00 AND 20.00, 'Apto', 'Bloqueado')
```

| Ramo | Teste | Resultado esperado |
|---|---|---|
| `medicao BETWEEN 10.00 AND 20.00` = TRUE | CT02 (10.00) e CT03 (20.00) | Apto |
| `medicao BETWEEN 10.00 AND 20.00` = FALSE | CT01 (9.99) e CT04 (20.01) | Bloqueado |

## 5. Níveis de teste

| Nível | Caso(s) | Objetivo |
|---|---|---|
| Unidade | CT01 a CT04 | Verificar a regra de classificação isoladamente |
| Integração | CT05, CT06, CT07 | Verificar que a inspeção atualiza corretamente o status do equipamento |
| Sistema | CT13 + CT05 + CT06 + CT11 | Fluxo completo: cadastrar equipamento → inspecionar → aprovar → tentar excluir |
| Aceitação | CT06 | Critério do usuário: equipamento bloqueado volta a Apto após inspeção aprovada dentro da faixa |

## 6. Defeitos controlados (inseridos em versão separada)

| ID | Tipo | Alteração | Requisito afetado |
|---|---|---|---|
| D01 | Defeito de limite | Substituir `BETWEEN 10.00 AND 20.00` por `BETWEEN 10.01 AND 19.99` — exclui os extremos da faixa | RF03 |
| D02 | Defeito de lógica | Remover a condição `AND NEW.aprovada = 1` no trigger `trg_insp_au` — equipamento passa a Apto sem aprovação | RF04 |

Os defeitos devem ser inseridos em um branch separado (`defeitos-controlados`). A versão correta é preservada na branch principal. A suíte de testes `sql/06-testes-regras.sql` deve detectar ambos.

## 7. Estratégia de execução

1. Executar os scripts na ordem definida em `docs/modelo-relacional.md`.
2. Executar `sql/06-testes-regras.sql` — todos os casos devem retornar `OK`.
3. Aplicar D01, executar novamente — CT02 e CT03 devem retornar `FALHOU`.
4. Aplicar D02, executar novamente — CT05 deve retornar `FALHOU`.
5. Reverter para a versão correta e executar regressão completa.

## 8. Rastreabilidade resumida

| Requisito | Risco | Casos de teste | Defeito controlado |
|---|---|---|---|
| RF01 | R05 | CT13, CT14 | — |
| RF02 | — | CT15 | — |
| RF03 | R01 | CT01, CT02, CT03, CT04 | D01 |
| RF04 | R02 | CT05, CT06, CT07 | D02 |
| RF05 | R03 | CT08, CT09, CT10 | — |
| RF06 | R04 | CT11, CT12 | — |
