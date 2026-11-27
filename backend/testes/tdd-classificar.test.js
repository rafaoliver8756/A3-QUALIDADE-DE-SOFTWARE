import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { classificar } from "../regras.js";

// TDD da regra de classificação (RF03).
// Fase 1 (vermelho): este arquivo existiu antes de regras.js — os asserts falhavam com ReferenceError.
// Fase 2 (verde): implementação mínima em classificar().
// Fase 3 (refatoração): a função já é uma linha; os testes continuam aprovados.

describe("TDD — classificar (RF03)", () => {
    it("9.99 deve ser Bloqueado", () => {
        assert.equal(classificar(9.99), "Bloqueado");
    });

    it("10.00 deve ser Apto", () => {
        assert.equal(classificar(10.0), "Apto");
    });

    it("15.00 deve ser Apto", () => {
        assert.equal(classificar(15.0), "Apto");
    });

    it("20.00 deve ser Apto", () => {
        assert.equal(classificar(20.0), "Apto");
    });

    it("20.01 deve ser Bloqueado", () => {
        assert.equal(classificar(20.01), "Bloqueado");
    });
});
