import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { validarVersoes } from "../regras.js";

// TDD da regra "versões de firmware e software obrigatórias" (RF01).
// Fase 1 (vermelho): teste escrito antes de validarVersoes existir em regras.js.
// Fase 2 (verde): implementação mínima.
// Fase 3 (refatoração): cadastrar() em dominio.js passa a usar validarVersoes.

describe("TDD — validarVersoes (RF01)", () => {
    it("aceita firmware e software preenchidos e devolve sem espaços extras", () => {
        assert.deepEqual(validarVersoes(" FW 1.0.0 ", "SW 2.0.0"), { firmware: "FW 1.0.0", software: "SW 2.0.0" });
    });

    it("rejeita firmware vazio (só espaços)", () => {
        assert.throws(() => validarVersoes("   ", "SW 1"), /versões são obrigatórias/);
    });

    it("rejeita software ausente (undefined)", () => {
        assert.throws(() => validarVersoes("FW 1", undefined), /versões são obrigatórias/);
    });
});
