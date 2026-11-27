# Lista de Funcionalidades — EquipCheck Mini

## Módulo 1 — Equipamentos

| ID | Funcionalidade | Descrição | Prioridade |
|---|---|---|---|
| F01 | Cadastrar equipamento | Registra um novo equipamento com identificador único no formato `EQP-NNN`, versões de firmware e software obrigatórias e nome de quem cadastrou. O equipamento nasce sempre com status Bloqueado. | Essencial |
| F02 | Consultar lista de equipamentos | Lista todos os equipamentos cadastrados com seu status atual (Apto ou Bloqueado), última medição e última inspeção. | Essencial |
| F03 | Consultar detalhe de equipamento | Exibe os dados completos de um equipamento: versões atuais, status, histórico de inspeções e histórico de mudanças de versão. | Essencial |
| F04 | Alterar versões de firmware e software | Atualiza as versões de firmware e/ou software de um equipamento. Exige responsável e justificativa (mínimo 10 caracteres, diferente da anterior). Grava automaticamente o registro de mudança no histórico. | Essencial |

## Módulo 2 — Inspeções

| ID | Funcionalidade | Descrição | Prioridade |
|---|---|---|---|
| F05 | Registrar inspeção | Registra uma inspeção com medição numérica e nome do responsável. O banco classifica automaticamente como Apto (10.00 a 20.00, inclusive) ou Bloqueado (fora da faixa) e copia as versões vigentes do equipamento para o registro. A inspeção nasce sempre sem aprovação. | Essencial |
| F06 | Aprovar inspeção | Marca uma inspeção como aprovada, informando responsável e justificativa. Se a inspeção estiver dentro da faixa e for a mais recente do equipamento, o equipamento passa a Apto. | Essencial |
| F07 | Corrigir dados de inspeção | Permite corrigir medição, aprovação ou observação de uma inspeção já registrada. Exige responsável e justificativa. Grava automaticamente o registro de correção no histórico. Responsável original, data/hora e versões não podem ser alterados. | Essencial |
| F08 | Consultar inspeções de um equipamento | Lista todas as inspeções de um equipamento, com medição, classificação, aprovação, responsável e versões vigentes na época. | Essencial |

## Módulo 3 — Histórico e rastreabilidade

| ID | Funcionalidade | Descrição | Prioridade |
|---|---|---|---|
| F09 | Consultar histórico de versões | Lista todas as mudanças de versão de um equipamento, com valores anteriores, novos, responsável, justificativa e data/hora. Inclui o cadastro inicial. | Essencial |
| F10 | Consultar correções de inspeção | Lista todas as correções aplicadas às inspeções de um equipamento, com valores antes e depois, responsável e justificativa. | Essencial |
| F11 | Consultar linha do tempo | Exibe em ordem cronológica todos os eventos de um equipamento: cadastro, mudanças de versão, inspeções e correções. | Desejável |

## Módulo 4 — Consultas analíticas (banco de dados)

| ID | Funcionalidade | Descrição | Prioridade |
|---|---|---|---|
| F12 | Status atual de todos os equipamentos | View `v_status_atual_equipamento` com situação atual e dados da última inspeção de cada equipamento. | Essencial |
| F13 | Equipamentos bloqueados | Filtra equipamentos com status Bloqueado e exibe a última inspeção. | Essencial |
| F14 | Equipamentos que nunca foram inspecionados | Identifica equipamentos sem nenhuma inspeção registrada. | Desejável |
| F15 | Resumo de inspeções por equipamento | Totais, menor, maior e média de medições por equipamento. | Desejável |
| F16 | Inspeções por classificação | Contagem de inspeções Apto e Bloqueado. | Desejável |
| F17 | Falhas por combinação de versões | Agrupa inspeções por combinação de firmware e software e conta quantas resultaram em Bloqueado. Permite identificar combinações problemáticas (cenário do relato). | Essencial |
| F18 | Reconstrução da linha do tempo (SQL) | Query `UNION ALL` que reconstrói toda a sequência de eventos de um equipamento diretamente no banco. | Desejável |

## Restrições transversais

- Equipamentos e inspeções **não podem ser excluídos** (bloqueio por trigger).
- Registros de histórico são **somente inserção**: não admitem `UPDATE` nem `DELETE`.
- O status do equipamento **nunca é informado manualmente**: é sempre calculado pelas inspeções.
- A classificação da medição **nunca é informada pelo usuário**: é uma coluna gerada virtual no banco.
