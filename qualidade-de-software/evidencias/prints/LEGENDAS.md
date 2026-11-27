# Legendas das capturas de tela

| Arquivo | Legenda | Requisito/Risco |
|---|---|---|
| `01-app-lista.png` | App EquipCheck Mini rodando: EQP-001/002 Apto (medições 15.50 e 18.00, dentro de 10–20); EQP-004 Bloqueado (25.00, fora da faixa); EQP-003 Bloqueado (inspeção ainda não aprovada); EQP-005 Bloqueado (sem inspeção). | RF02, RF03, RF04 · R01 |
| `02-ci-falha-d01.png` | GitHub Actions **falhou** no commit `3248f45` (D01 — limite): `classificar` passou a excluir 10.00 e 20.00. 7 testes de limite falharam. | RF03 · R01 |
| `03-ci-falha-d02.png` | GitHub Actions **falhou** no commit `04fb634` (D02 — lógica): equipamento liberado como Apto sem aprovação. Falharam CT05, CT07, integração e sistema. | RF04 · R01 |
| `04-ci-aprovado-correcao.png` | GitHub Actions **aprovado** no commit `389e67f`: D01 e D02 corrigidos; reteste e regressão completos. | RF03, RF04 |
| `05-tdd-vermelho.png` | TDD fase 1 (vermelho), commit `0aebfde`: teste de `validarVersoes` escrito antes da função; CI falha como esperado. | RF01 |
| `06-ci-lista-execucoes.png` | Histórico de execuções do CI: falhas (D01, D02, TDD vermelho) e aprovações (correção, TDD verde, TDD refatoração). | RF01, RF03, RF04 |
