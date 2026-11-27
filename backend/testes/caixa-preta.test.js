import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { classificar, lerMedicao, conferirAutor, ErroNegocio } from "../regras.js";
import { criarSistema } from "../dominio.js";

function sistemaVazio() {
    return criarSistema();
}

function cadastrarPadrao(s, id = "EQP-100") {
    return s.cadastrar({
        idEquipamento: id,
        versaoFirmware: "FW 1.0.0",
        versaoSoftware: "SW 1.0.0",
        cadastradoPor: "Técnico Teste",
    });
}

describe("Caixa-preta — valores-limite e partições (CT01 a CT15)", () => {
    it("CT01 RF03: medição 9.99 → Bloqueado", () => {
        assert.equal(classificar(9.99), "Bloqueado");
    });

    it("CT02 RF03: medição 10.00 → Apto (limite inferior incluso)", () => {
        assert.equal(classificar(10.0), "Apto");
    });

    it("CT03 RF03: medição 20.00 → Apto (limite superior incluso)", () => {
        assert.equal(classificar(20.0), "Apto");
    });

    it("CT04 RF03: medição 20.01 → Bloqueado", () => {
        assert.equal(classificar(20.01), "Bloqueado");
    });

    it("CT05 RF04: inspeção dentro da faixa sem aprovação não libera", () => {
        const s = sistemaVazio();
        cadastrarPadrao(s, "EQP-101");
        const { equipamento } = s.registrarInspecao("EQP-101", { medicao: 15, aprovada: false, responsavel: "QA" });
        assert.equal(equipamento.status, "Bloqueado");
    });

    it("CT06 RF04: inspeção dentro da faixa com aprovação libera (Apto)", () => {
        const s = sistemaVazio();
        cadastrarPadrao(s, "EQP-102");
        s.registrarInspecao("EQP-102", { medicao: 9.99, aprovada: false, responsavel: "QA" });
        const { equipamento } = s.registrarInspecao("EQP-102", { medicao: 15, aprovada: true, responsavel: "QA" });
        assert.equal(equipamento.status, "Apto");
    });

    it("CT07 RF04: revogar aprovação da última inspeção volta a Bloqueado", () => {
        const s = sistemaVazio();
        cadastrarPadrao(s, "EQP-103");
        const { inspecao } = s.registrarInspecao("EQP-103", { medicao: 15, aprovada: true, responsavel: "QA" });
        const { equipamento } = s.corrigirInspecao(inspecao.id, {
            aprovada: false,
            responsavel: "QA",
            justificativa: "Revogação da aprovação no teste",
        });
        assert.equal(equipamento.status, "Bloqueado");
    });

    it("CT08 RF05: alterar versão sem responsável é rejeitado", () => {
        const s = sistemaVazio();
        cadastrarPadrao(s, "EQP-104");
        assert.throws(
            () => s.alterarVersoes("EQP-104", { versaoFirmware: "FW 2.0.0", justificativa: "Justificativa válida de teste" }),
            (err) => err instanceof ErroNegocio && err.status === 400 && /responsável/i.test(err.message),
        );
    });

    it("CT09 RF05: justificativa com 9 caracteres é rejeitada", () => {
        assert.throws(
            () => conferirAutor({ responsavel: "QA", justificativa: "123456789" }),
            (err) => err instanceof ErroNegocio && /10 caracteres/i.test(err.message),
        );
    });

    it("CT10 RF05: repetir a mesma justificativa anterior é rejeitado", () => {
        const s = sistemaVazio();
        cadastrarPadrao(s, "EQP-105");
        s.alterarVersoes("EQP-105", {
            versaoFirmware: "FW 2.0.0",
            responsavel: "QA",
            justificativa: "Atualização inicial de firmware",
        });
        assert.throws(
            () =>
                s.alterarVersoes("EQP-105", {
                    versaoSoftware: "SW 2.0.0",
                    responsavel: "QA",
                    justificativa: "Atualização inicial de firmware",
                }),
            (err) => err instanceof ErroNegocio && /igual à anterior/i.test(err.message),
        );
    });

    it("CT11 RF06: tentar excluir equipamento é rejeitado", () => {
        const s = sistemaVazio();
        cadastrarPadrao(s, "EQP-106");
        assert.throws(
            () => s.excluirEquipamento("EQP-106"),
            (err) => err instanceof ErroNegocio && err.status === 403,
        );
        assert.equal(s.equipamentos.length, 1);
    });

    it("CT12 RF06: tentar alterar registro de histórico é rejeitado", () => {
        const s = sistemaVazio();
        cadastrarPadrao(s, "EQP-107");
        const id = s.historicoVersoes[0].id;
        assert.throws(
            () => s.alterarHistorico(id, { justificativa: "adulterado" }),
            (err) => err instanceof ErroNegocio && err.status === 403,
        );
        assert.equal(s.historicoVersoes[0].justificativa, "Cadastro inicial do equipamento");
    });

    it("CT13 RF01: cadastrar com ID repetido é rejeitado", () => {
        const s = sistemaVazio();
        cadastrarPadrao(s, "EQP-001");
        assert.throws(
            () => cadastrarPadrao(s, "EQP-001"),
            (err) => err instanceof ErroNegocio && err.status === 409,
        );
    });

    it("CT14 RF01: cadastrar com ID fora do formato (EQ-1042) é rejeitado", () => {
        const s = sistemaVazio();
        assert.throws(
            () =>
                s.cadastrar({
                    idEquipamento: "EQ-1042",
                    versaoFirmware: "FW 1",
                    versaoSoftware: "SW 1",
                    cadastradoPor: "QA",
                }),
            (err) => err instanceof ErroNegocio && /EQP-001/.test(err.message),
        );
    });

    it("CT15 RF02: medição não numérica é rejeitada", () => {
        assert.throws(
            () => lerMedicao("abc"),
            (err) => err instanceof ErroNegocio && /Medição inválida/.test(err.message),
        );
    });
});
