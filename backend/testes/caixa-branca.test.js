import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { classificar } from "../regras.js";

// Decisão central (RF03), equivalente à coluna gerada no MySQL:
// IF(medicao BETWEEN 10.00 AND 20.00, 'Apto', 'Bloqueado')
//
//          medicao >= 10
//               |
//        TRUE   |   FALSE → Bloqueado (9.99)
//               v
//          medicao <= 20
//               |
//        TRUE   |   FALSE → Bloqueado (20.01)
//               v
//             Apto (10.00, 15.00, 20.00)

describe("Caixa-branca — decisão da classificação (RF03)", () => {
    it("ramo TRUE (BETWEEN): 10.00, 15.00 e 20.00 resultam em Apto", () => {
        assert.equal(classificar(10.0), "Apto");
        assert.equal(classificar(15.0), "Apto");
        assert.equal(classificar(20.0), "Apto");
    });

    it("ramo FALSE (fora do BETWEEN): 9.99 e 20.01 resultam em Bloqueado", () => {
        assert.equal(classificar(9.99), "Bloqueado");
        assert.equal(classificar(20.01), "Bloqueado");
    });
});
