# Etapa 2 — Rastreabilidade Completa

Tabela que liga cada requisito ao risco relacionado, aos casos de teste que o verificam, aos defeitos controlados que testam a detecção e às melhorias propostas.

| Requisito | Descrição resumida | Risco | Casos de teste | Defeito controlado | Melhoria relacionada |
|---|---|---|---|---|---|
| RF01 | Cadastrar equipamento com ID único e versões obrigatórias | R05 — ID inválido ou duplicado cadastrado | CT13, CT14 | — | Validação de formato no frontend |
| RF02 | Registrar medição numérica | — | CT15 | — | — |
| RF03 | Classificar Apto (10–20) ou Bloqueado | R01 — Classificação errada libera equipamento fora da faixa | CT01, CT02, CT03, CT04 | D01 (extremos da faixa) | Testes automáticos de borda em CI |
| RF04 | Bloqueado só volta a Apto após inspeção aprovada | R02 — Equipamento liberado sem aprovação | CT05, CT06, CT07 | D02 (aprovação ignorada) | Separação clara entre registrar e aprovar na interface |
| RF05 | Exigir responsável e justificativa nas alterações | R03 — Alteração sem rastreabilidade | CT08, CT09, CT10 | — | Mínimo de 10 caracteres já implementado |
| RF06 | Preservar histórico imutável | R04 — Histórico adulterado ou excluído | CT11, CT12 | — | Triggers de imutabilidade no banco |

## Ligação com os problemas do diagnóstico

| Problema (diagnóstico) | Requisito que responde | Como o app evidencia |
|---|---|---|
| P1 — Versões desalinhadas descobertas só na integração | RF01, RF06 | Cada inspeção guarda as versões vigentes; consulta 10 mostra falhas por combinação de versões |
| P2 — Filas e esperas nas aprovações | RF05 | Toda aprovação exige responsável e justificativa registrados, tornando o processo auditável |
| P3 — Equipamento liberado com condição de bloqueio | RF03, RF04 | Defeito D01 e D02 demonstram exatamente esse risco; a suíte detecta ambos |

## Evidências disponíveis

| Evidência | Onde encontrar |
|---|---|
| Casos de teste automatizados | `sql/06-testes-regras.sql` |
| Resultado esperado de cada teste | `qualidade-de-software/plano-de-testes.md` |
| Defeitos controlados e TDD | `qualidade-de-software/defeitos-controlados.md` |
| Regras no banco (triggers) | `sql/03-triggers-views.sql` |
| App demonstrando os requisitos | `backend/server.js` + `frontend/` |
