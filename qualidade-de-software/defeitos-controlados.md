# Etapa 2 — Defeitos Controlados e TDD

## 1. Objetivo

<!-- coderabbit-ai-generated:v1 -->

<!-- coderabbit-ai-generated-section:v1:daa80d9b84ee5806ea2841a2494a9d0be20e88d4fe373ec8a5028aa528706071 -->

A suíte de testes Node, executada com `npm test` em `backend/`, detecta os defeitos D01 e D02 introduzidos em `backend/regras.js` na branch `defeitos-controlados`. A versão correta é preservada na branch principal. A suíte `sql/06-testes-regras.sql` fornece evidência separada das regras no MySQL.

<!-- /coderabbit-ai-generated:v1 -->

---

## 2. Defeitos inseridos

### D01 — Defeito de limite (RF03)

**Onde:** `backend/regras.js`, função `classificar()`

**Versão com defeito:**
```js
// DEFEITO D01: exclui os extremos da faixa
const classificar = (medicao) => (medicao > 10 && medicao < 20 ? "Apto" : "Bloqueado");
```

**Versão correta:**
```js
const classificar = (medicao) => (medicao >= 10 && medicao <= 20 ? "Apto" : "Bloqueado");
```

**Requisito afetado:** RF03

**Efeito:** medições de 10.00 e 20.00 (extremos da faixa) seriam classificadas como Bloqueado, quando o correto é Apto.

**Detectado por:** CT02 (medição 10.00 → esperado Apto) e CT03 (medição 20.00 → esperado Apto) do plano de testes.

---

### D02 — Defeito de lógica (RF04)

**Onde:** `backend/regras.js`, função `atualizarStatus()`

**Versão com defeito:**
```js
// DEFEITO D02: remove a verificação de aprovação
export function atualizarStatus(eq, ultima) {
    if (!ultima || ultima.classificacao === "Bloqueado") eq.status = "Bloqueado";
    else eq.status = "Apto"; // libera sem checar se foi aprovada
}
```

**Versão correta:**
```js
export function atualizarStatus(eq, ultima) {
    if (!ultima || ultima.classificacao === "Bloqueado" || !ultima.aprovada) eq.status = "Bloqueado";
    else eq.status = "Apto";
}
```

**Requisito afetado:** RF04

**Efeito:** um equipamento passaria a Apto após inspeção dentro da faixa mesmo sem aprovação — exatamente o problema que motivou o projeto (o incidente da MegaCore Labs).

**Detectado por:** CT05 (inspeção dentro da faixa sem aprovação não deve liberar o equipamento).

---

## 3. TDD aplicado — regra de classificação (RF03)

> As três fases de TDD registradas em commits separados (com CI) usam a regra `validarVersoes` (RF01). Ver `relatorio-2.md`, seção 6.

TDD (Test-Driven Development): escrever o teste antes do código, observar a falha, implementar, observar o sucesso.

### Fase 1 — Teste escrito, código ainda não implementado (vermelho)

Teste esperado para a função `classificar`:

```js
// teste escrito antes da implementação
console.assert(classificar(9.99)  === "Bloqueado", "9.99 deve ser Bloqueado");
console.assert(classificar(10.00) === "Apto",      "10.00 deve ser Apto");
console.assert(classificar(15.00) === "Apto",      "15.00 deve ser Apto");
console.assert(classificar(20.00) === "Apto",      "20.00 deve ser Apto");
console.assert(classificar(20.01) === "Bloqueado", "20.01 deve ser Bloqueado");
```

Sem a função implementada → todos os testes falham (ReferenceError).

### Fase 2 — Implementação mínima para passar (verde)

```js
const classificar = (medicao) => (medicao >= 10 && medicao <= 20 ? "Apto" : "Bloqueado");
```

Todos os 5 testes passam.

### Fase 3 — Refatoração (mantendo os testes verdes)

A função já está simples o suficiente. Nenhuma refatoração necessária. Os testes continuam passando.

**Evidência:** `backend/testes/tdd-classificar.test.js` e a execução `npm test`. Com D01 ativo, os testes de 10.00 e 20.00 falham (`qualidade-de-software/evidencias/testes-falha-d01.txt`). Na versão correta, todos os testes passam.

A suíte SQL `sql/06-testes-regras.sql` contém os mesmos casos de borda no MySQL.

---

## 4. Resumo da detecção

| Defeito | Tipo | Detectado por | Resultado com defeito | Resultado correto |
|---|---|---|---|---|
| D01 | Limite | CT02, CT03 | 10.00 e 20.00 → Bloqueado | 10.00 e 20.00 → Apto |
| D02 | Lógica | CT05 | Sem aprovação → Apto | Sem aprovação → Bloqueado |
| D03 | Lógica (encontrado) | CT07 | Revogar aprovação → Apto | Revogar aprovação → Bloqueado |
