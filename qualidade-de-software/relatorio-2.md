# Relatório 2 — Desenvolvimento e testes (Etapa 2)

EquipCheck Mini · Cenário 5 MegaCore Labs · UNA Betim · 2026/2

Pergunta central: o aplicativo atende aos requisitos e como os testes demonstram isso?

## 1. Aplicativo

Os seis requisitos do cenário (RF01 a RF06) estão implementados no backend em memória (`backend/dominio.js` + `backend/regras.js`) e na interface React. Dados são fictícios. Não há serviços externos.

Como executar:

```text
cd backend
node server.js

cd frontend
npm install
npm run dev
```

Abrir `http://localhost:5173`.

Testes automatizados (sem MySQL e sem interface):

```text
cd backend
npm test
```

A suíte SQL `sql/06-testes-regras.sql` continua válida para quem tiver MySQL; a Etapa 2 de qualidade usa a suíte Node, que é a executada no CI.

## 2. Riscos priorizados

Ver `qualidade-de-software/plano-de-testes.md`. Os testes desta etapa atacam principalmente R01 (classificação) e R02 (liberação sem aprovação), que são o incidente descrito no cenário.

## 3. Resultados dos casos de teste

| ID | Requisito | Entrada | Esperado | Obtido | Evidência |
|---|---|---|---|---|---|
| CT01 | RF03 | 9.99 | Bloqueado | Bloqueado | `npm test` — OK |
| CT02 | RF03 | 10.00 | Apto | Apto | limite inferior — OK |
| CT03 | RF03 | 20.00 | Apto | Apto | limite superior — OK |
| CT04 | RF03 | 20.01 | Bloqueado | Bloqueado | OK |
| CT05 | RF04 | faixa ok, sem aprovação | continua Bloqueado | Bloqueado | OK |
| CT06 | RF04 | faixa ok, aprovada | Apto | Apto | OK |
| CT07 | RF04 | revogar aprovação | Bloqueado | Bloqueado (após correção D03) | ver §5 |
| CT08 | RF05 | versão sem responsável | rejeitado | rejeitado | OK |
| CT09 | RF05 | justificativa com 9 caracteres | rejeitado | rejeitado | OK |
| CT10 | RF05 | justificativa repetida | rejeitado | rejeitado | OK |
| CT11 | RF06 | excluir equipamento | rejeitado | rejeitado | OK |
| CT12 | RF06 | alterar histórico | rejeitado | rejeitado | OK |
| CT13 | RF01 | ID repetido | rejeitado | rejeitado | OK |
| CT14 | RF01 | ID `EQ-1042` | rejeitado | rejeitado | caso inválido — OK |
| CT15 | RF02 | medição `abc` | rejeitado | rejeitado | caso inválido — OK |

Saída completa da execução aprovada: `qualidade-de-software/evidencias/testes-aprovados.txt`.

## 4. Técnicas e níveis

- **Caixa-preta:** CT01 a CT15 (válidos, inválidos e limites). Arquivo `backend/testes/caixa-preta.test.js`.
- **Caixa-branca:** os dois ramos da decisão `medicao >= 10 && medicao <= 20`. Arquivo `backend/testes/caixa-branca.test.js`.
- **Unidade:** só `classificar` (RF03).
- **Integração:** inspeção + status do equipamento (RF04).
- **Sistema:** cadastrar → inspecionar → aprovar → tentar excluir.
- **Aceitação:** critério do usuário — bloqueado volta a Apto após inspeção aprovada na faixa.

Os quatro níveis reutilizam o fluxo de inspeção; o objetivo de cada um está no nome do teste em `backend/testes/niveis.test.js`.

## 5. Defeitos, correções, reteste e regressão

| ID | Tipo | Origem | Requisito | Detectado? | Situação |
|---|---|---|---|---|---|
| D01 | Limite | Inserido de propósito (`>` e `<` em vez de `>=` e `<=`) | RF03 | Sim, CT02 e CT03 | Removido; versão correta preservada |
| D02 | Lógica | Inserido de propósito (liberar sem `aprovada`) | RF04 | Sim, CT05 | Removido; versão correta preservada |
| D03 | Lógica | Encontrado pela suíte na 1ª execução | RF04 | Sim, CT07 | Corrigido em `atualizarStatus`; reteste e regressão OK |

D01 e D02 ficam em uma **versão separada**, a branch [`defeitos-controlados`](https://github.com/rafaoliver8756/A3-QUALIDADE-DE-SOFTWARE/commits/defeitos-controlados); a versão correta é preservada em `main`/`edicao-escopo`. Histórico da branch:

| Commit | Conteúdo | CI |
|---|---|---|
| `3248f45` | D01 inserido (`>`/`<` em vez de `>=`/`<=`) | [falhou](https://github.com/rafaoliver8756/A3-QUALIDADE-DE-SOFTWARE/actions/runs/45949141970) — 7 falhas, todas nos extremos 10.00/20.00 |
| `04fb634` | D01 removido, D02 inserido (libera sem `aprovada`) | [falhou](https://github.com/rafaoliver8756/A3-QUALIDADE-DE-SOFTWARE/actions/runs/45949162565) — 4 falhas: CT05, CT07, integração e sistema |
| `389e67f` | D01 e D02 corrigidos (reteste + regressão) | [aprovado](https://github.com/rafaoliver8756/A3-QUALIDADE-DE-SOFTWARE/actions/runs/45949235415) |

Descrição detalhada em `qualidade-de-software/defeitos-controlados.md`. Execução com D01: `evidencias/testes-falha-d01.txt` (19 passaram, 7 falharam — só extremos).

D03: a primeira execução da suíte falhou em CT07 (status permanecia Apto ao revogar aprovação). Correção e regressão: `evidencias/defeito-d03-reteste.txt`. Depois da correção, todos os testes passaram.

Nenhum dos casos CT01–CT15 ficou sem detecção após a correção. Limitação: os testes Node não exercitam os triggers MySQL; a imutabilidade no banco continua documentada em `sql/06-testes-regras.sql`.

## 6. TDD

Regra pequena: `validarVersoes` (RF01 — versões de firmware e software obrigatórias). As três fases estão registradas em commits separados no histórico, cada um com sua execução de CI:

| Fase | Commit | O que foi feito | CI |
|---|---|---|---|
| 1. Vermelho | `0aebfde` | Escrito `testes/tdd-validar-versoes.test.js` antes da função existir | [falhou](https://github.com/rafaoliver8756/A3-QUALIDADE-DE-SOFTWARE/actions/runs/45949244749) (`validarVersoes` não exportada) |
| 2. Verde | `fca3126` | Implementação mínima de `validarVersoes` em `regras.js` | [aprovado](https://github.com/rafaoliver8756/A3-QUALIDADE-DE-SOFTWARE/actions/runs/45949252744) |
| 3. Refatoração | `11534cc` | Código simplificado e reutilizado em `cadastrar()` (`dominio.js`) | [aprovado](https://github.com/rafaoliver8756/A3-QUALIDADE-DE-SOFTWARE/actions/runs/45949271365) |

O arquivo `testes/tdd-classificar.test.js` mantém os testes da regra de classificação (RF03), que também servem de exemplo de teste escrito a partir do critério de aceite.

## 7. Automação e CI

Três testes relevantes exigidos, cobertos na suíte:

- limite: CT02 / CT03
- inválido: CT14 / CT15
- mais os demais CT

CI: `.github/workflows/ci.yml` — a cada envio, instala Node 22, `npm install` em `backend` e `npm test`. Publicação automática não é feita.

- Execuções com falha: [D01](https://github.com/rafaoliver8756/A3-QUALIDADE-DE-SOFTWARE/actions/runs/45949141970), [D02](https://github.com/rafaoliver8756/A3-QUALIDADE-DE-SOFTWARE/actions/runs/45949162565) e [TDD vermelho](https://github.com/rafaoliver8756/A3-QUALIDADE-DE-SOFTWARE/actions/runs/45949244749).
- Execuções aprovadas: [correção dos defeitos](https://github.com/rafaoliver8756/A3-QUALIDADE-DE-SOFTWARE/actions/runs/45949235415) e [TDD refatoração](https://github.com/rafaoliver8756/A3-QUALIDADE-DE-SOFTWARE/actions/runs/45949271365).
- Lista completa: https://github.com/rafaoliver8756/A3-QUALIDADE-DE-SOFTWARE/actions

## 8. Cobertura

`npm run test:coverage` → 92,86% linhas, 77,78% ramos, 100% funções. Detalhe em `evidencias/cobertura.txt`.

O que não foi exercitado: cadastro de exemplo do servidor e algumas mensagens de “nenhuma alteração”. Cobertura alta não substitui CT02/CT03: sem os extremos, D01 poderia passar despercebido.

## 9. Ligação evidência → requisito

| ID | Requisito | Risco | Teste | Defeito |
|---|---|---|---|---|
| RF01 | ID único e formato | R05 | CT13, CT14 | — |
| RF02 | Medição numérica | — | CT15 | — |
| RF03 | Faixa 10–20 | R01 | CT01–CT04 | D01 |
| RF04 | Desbloqueio com aprovação | R02 | CT05–CT07 | D02, D03 |
| RF05 | Responsável e justificativa | R03 | CT08–CT10 | — |
| RF06 | Histórico imutável | R04 | CT11, CT12 | — |

## 10. Suíte SQL (Banco de Dados)

Os scripts `sql/01` a `sql/06` foram executados em MySQL 8.0. A suíte `sql/06-testes-regras.sql` retornou **30 de 30 testes OK** (saída em `evidencias/mysql-06-testes-regras.txt`). Ela verifica as mesmas regras diretamente nos triggers e restrições do banco, o que os testes Node não cobrem.

## 11. Contribuições dos integrantes

| Integrante | Contribuição na Etapa 2 |
|---|---|
| Kauan Gabriel | _preencher_ |
| Rafaela Oliveira | _preencher_ |
| Eric Braga | _preencher_ |
| Thays Durães | _preencher_ |
| Lucas | _preencher_ |
