import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { classificar } from "../regras.js";
import { criarSistema } from "../dominio.js";

describe("Níveis de teste — os mesmos fluxos, objetivos diferentes", () => {
    it("Unidade (RF03): a regra de classificação isolada, sem cadastro nem inspeção", () => {
        assert.equal(classificar(9.99), "Bloqueado");
        assert.equal(classificar(10.0), "Apto");
        assert.equal(classificar(20.0), "Apto");
        assert.equal(classificar(20.01), "Bloqueado");
    });

    it("Integração (RF04): inspeção atualiza o status do equipamento", () => {
        const s = criarSistema();
        s.cadastrar({
            idEquipamento: "EQP-200",
            versaoFirmware: "FW 1",
            versaoSoftware: "SW 1",
            cadastradoPor: "QA",
        });
        const semAprovacao = s.registrarInspecao("EQP-200", { medicao: 12, aprovada: false, responsavel: "QA" });
        assert.equal(semAprovacao.equipamento.status, "Bloqueado");

        const { inspecao } = s.registrarInspecao("EQP-200", { medicao: 12, aprovada: false, responsavel: "QA" });
        const comAprovacao = s.corrigirInspecao(inspecao.id, {
            aprovada: true,
            responsavel: "Aprovador",
            justificativa: "Inspeção conferida e aprovada",
        });
        assert.equal(comAprovacao.equipamento.status, "Apto");

        const revogada = s.corrigirInspecao(inspecao.id, {
            aprovada: false,
            responsavel: "Aprovador",
            justificativa: "Aprovação revogada após nova checagem",
        });
        assert.equal(revogada.equipamento.status, "Bloqueado");
    });

    it("Sistema: cadastrar → inspecionar → aprovar → tentar excluir (RF01, RF04, RF06)", () => {
        const s = criarSistema();
        const eq = s.cadastrar({
            idEquipamento: "EQP-300",
            versaoFirmware: "FW 2.0.0",
            versaoSoftware: "SW 2.0.0",
            cadastradoPor: "Maria Silva",
        });
        assert.equal(eq.status, "Bloqueado");

        const inspecao = s.registrarInspecao("EQP-300", { medicao: 11.5, aprovada: false, responsavel: "Carlos Lima" });
        assert.equal(inspecao.equipamento.status, "Bloqueado");
        assert.equal(inspecao.inspecao.versaoFirmware, "FW 2.0.0");

        const aprovada = s.corrigirInspecao(inspecao.inspecao.id, {
            aprovada: true,
            responsavel: "Ana Lima",
            justificativa: "Medição conferida na bancada",
        });
        assert.equal(aprovada.equipamento.status, "Apto");

        assert.throws(() => s.excluirEquipamento("EQP-300"));
        assert.equal(s.equipamentos.length, 1);
        assert.ok(s.historicoVersoes.length >= 1);
        assert.ok(s.linhaDoTempo("EQP-300").length >= 2);
    });

    it("Aceitação (RF04): equipamento bloqueado volta a Apto após inspeção aprovada dentro da faixa", () => {
        const s = criarSistema();
        s.cadastrar({
            idEquipamento: "EQP-400",
            versaoFirmware: "FW 1",
            versaoSoftware: "SW 1",
            cadastradoPor: "Técnico",
        });
        s.registrarInspecao("EQP-400", { medicao: 21, aprovada: false, responsavel: "Técnico" });
        assert.equal(s.buscarEquipamento("EQP-400").status, "Bloqueado");

        const { equipamento } = s.registrarInspecao("EQP-400", { medicao: 10, aprovada: true, responsavel: "Qualidade" });
        assert.equal(equipamento.status, "Apto");
        assert.equal(equipamento.ultimaClassificacao, "Apto");
    });
});
