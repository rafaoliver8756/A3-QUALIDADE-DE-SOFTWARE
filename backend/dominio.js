import {
    ErroNegocio,
    classificar,
    lerMedicao,
    validarIdEquipamento,
    validarVersoes,
    conferirAutor,
    atualizarStatus,
    recusarExclusao,
    recusarAlteracaoHistorico,
} from "./regras.js";

export { ErroNegocio, classificar, lerMedicao, conferirAutor };

const agora = () => new Date().toISOString();

export function criarSistema({ popularExemplo: popular = false } = {}) {
    const equipamentos = [];
    const inspecoes = [];
    const historicoVersoes = [];
    const correcoes = [];
    let ordem = 0;

    function buscarEquipamento(id) {
        const eq = equipamentos.find((e) => e.idEquipamento === id);
        if (!eq) throw new ErroNegocio(404, `Equipamento ${id} não encontrado.`);
        return eq;
    }

    function buscarInspecao(id) {
        const insp = inspecoes.find((i) => i.id === Number(id));
        if (!insp) throw new ErroNegocio(404, `Inspeção ${id} não encontrada.`);
        return insp;
    }

    function resumo(eq) {
        const ultima = inspecoes.filter((i) => i.idEquipamento === eq.idEquipamento).at(-1);
        return {
            ...eq,
            ultimaMedicao: ultima?.medicao ?? null,
            ultimaClassificacao: ultima?.classificacao ?? null,
            ultimaInspecao: ultima?.dataHora ?? null,
        };
    }

    function cadastrar(corpo) {
        const { idEquipamento, versaoFirmware, versaoSoftware, cadastradoPor } = corpo;

        validarIdEquipamento(idEquipamento);
        const { firmware, software } = validarVersoes(versaoFirmware, versaoSoftware);
        if (!cadastradoPor?.trim()) throw new ErroNegocio(400, "Informe quem está cadastrando.");
        if (equipamentos.some((e) => e.idEquipamento === idEquipamento)) {
            throw new ErroNegocio(409, `Já existe um equipamento com o ID ${idEquipamento}.`);
        }

        const eq = {
            idEquipamento,
            versaoFirmware: firmware,
            versaoSoftware: software,
            status: "Bloqueado",
            cadastradoPor: cadastradoPor.trim(),
            cadastradoEm: agora(),
        };
        equipamentos.push(eq);
        historicoVersoes.push({
            id: historicoVersoes.length + 1,
            idEquipamento,
            firmwareAnterior: null,
            softwareAnterior: null,
            firmwareNovo: eq.versaoFirmware,
            softwareNovo: eq.versaoSoftware,
            responsavel: eq.cadastradoPor,
            justificativa: "Cadastro inicial do equipamento",
            dataHora: eq.cadastradoEm,
            ordem: ++ordem,
        });
        return resumo(eq);
    }

    function registrarInspecao(idEquipamento, corpo) {
        const eq = buscarEquipamento(idEquipamento);
        if (!corpo.responsavel?.trim()) throw new ErroNegocio(400, "O responsável é obrigatório.");
        const medicao = lerMedicao(corpo.medicao);

        const inspecao = {
            id: inspecoes.length + 1,
            idEquipamento,
            medicao,
            classificacao: classificar(medicao),
            aprovada: corpo.aprovada === true,
            responsavel: corpo.responsavel.trim(),
            observacao: corpo.observacao || null,
            versaoFirmware: eq.versaoFirmware,
            versaoSoftware: eq.versaoSoftware,
            dataHora: agora(),
            ordem: ++ordem,
        };
        inspecoes.push(inspecao);
        atualizarStatus(eq, inspecao);
        return { inspecao, equipamento: resumo(eq) };
    }

    function corrigirInspecao(id, corpo) {
        const insp = buscarInspecao(id);
        const eq = buscarEquipamento(insp.idEquipamento);

        const medicao = corpo.medicao === undefined ? insp.medicao : lerMedicao(corpo.medicao);
        const aprovada = corpo.aprovada === undefined ? insp.aprovada : corpo.aprovada === true;
        const observacao = corpo.observacao === undefined ? insp.observacao : corpo.observacao;
        if (medicao === insp.medicao && aprovada === insp.aprovada && observacao === insp.observacao) {
            throw new ErroNegocio(400, "Nenhuma alteração informada.");
        }

        const anterior = correcoes.filter((c) => c.idInspecao === insp.id).at(-1)?.justificativa;
        const autor = conferirAutor(corpo, anterior);

        correcoes.push({
            id: correcoes.length + 1,
            idInspecao: insp.id,
            idEquipamento: insp.idEquipamento,
            medicaoAnterior: insp.medicao,
            medicaoNova: medicao,
            aprovadaAnterior: insp.aprovada,
            aprovadaNova: aprovada,
            ...autor,
            dataHora: agora(),
            ordem: ++ordem,
        });
        Object.assign(insp, { medicao, aprovada, observacao, classificacao: classificar(medicao) });
        const ultima = inspecoes.filter((i) => i.idEquipamento === eq.idEquipamento).at(-1);
        if (ultima === insp) atualizarStatus(eq, insp);
        return { inspecao: insp, equipamento: resumo(eq) };
    }

    function alterarVersoes(id, corpo) {
        const eq = buscarEquipamento(id);
        const firmware = corpo.versaoFirmware?.trim() || eq.versaoFirmware;
        const software = corpo.versaoSoftware?.trim() || eq.versaoSoftware;
        if (firmware === eq.versaoFirmware && software === eq.versaoSoftware) {
            throw new ErroNegocio(400, "Nenhuma alteração de versão informada.");
        }

        const anterior = historicoVersoes.filter((h) => h.idEquipamento === id).at(-1)?.justificativa;
        const autor = conferirAutor(corpo, anterior);

        historicoVersoes.push({
            id: historicoVersoes.length + 1,
            idEquipamento: id,
            firmwareAnterior: eq.versaoFirmware,
            softwareAnterior: eq.versaoSoftware,
            firmwareNovo: firmware,
            softwareNovo: software,
            ...autor,
            dataHora: agora(),
            ordem: ++ordem,
        });
        eq.versaoFirmware = firmware;
        eq.versaoSoftware = software;
        return resumo(eq);
    }

    function linhaDoTempo(id) {
        buscarEquipamento(id);
        const eventos = [];

        for (const h of historicoVersoes.filter((h) => h.idEquipamento === id)) {
            eventos.push({
                ordem: h.ordem,
                dataHora: h.dataHora,
                evento: h.firmwareAnterior === null ? "Cadastro" : "Mudança de versão",
                detalhe: `firmware ${h.firmwareAnterior ?? "-"} -> ${h.firmwareNovo}, software ${h.softwareAnterior ?? "-"} -> ${h.softwareNovo}, por ${h.responsavel}: ${h.justificativa}`,
            });
        }
        for (const i of inspecoes.filter((i) => i.idEquipamento === id)) {
            eventos.push({
                ordem: i.ordem,
                dataHora: i.dataHora,
                evento: "Inspeção",
                detalhe: `#${i.id}: medição ${i.medicao.toFixed(2)} (${i.classificacao}), aprovada=${i.aprovada ? "sim" : "não"}, por ${i.responsavel}`,
            });
        }
        for (const c of correcoes.filter((c) => c.idEquipamento === id)) {
            eventos.push({
                ordem: c.ordem,
                dataHora: c.dataHora,
                evento: "Correção de inspeção",
                detalhe: `#${c.idInspecao}: medição ${c.medicaoAnterior.toFixed(2)} -> ${c.medicaoNova.toFixed(2)}, aprovada ${c.aprovadaAnterior ? "sim" : "não"} -> ${c.aprovadaNova ? "sim" : "não"}, por ${c.responsavel}: ${c.justificativa}`,
            });
        }
        return eventos.sort((a, b) => a.ordem - b.ordem);
    }

    function excluirEquipamento() {
        recusarExclusao("equipamentos");
    }

    function alterarHistorico(id, campos) {
        const registro = historicoVersoes.find((h) => h.id === Number(id));
        if (!registro) throw new ErroNegocio(404, "Registro de histórico não encontrado.");
        if (campos && Object.keys(campos).length) recusarAlteracaoHistorico();
        return registro;
    }

    if (popular) {
        cadastrar({ idEquipamento: "EQP-001", versaoFirmware: "FW 2.1.0", versaoSoftware: "SW 5.3.2", cadastradoPor: "Maria Silva" });
        registrarInspecao("EQP-001", { medicao: 15.5, aprovada: true, responsavel: "Carlos Lima" });
        cadastrar({ idEquipamento: "EQP-002", versaoFirmware: "FW 2.1.0", versaoSoftware: "SW 5.3.2", cadastradoPor: "Maria Silva" });
        registrarInspecao("EQP-002", { medicao: 18, aprovada: true, responsavel: "Carlos Lima" });
        cadastrar({ idEquipamento: "EQP-003", versaoFirmware: "FW 1.9.5", versaoSoftware: "SW 5.4.0", cadastradoPor: "João Souza" });
        registrarInspecao("EQP-003", { medicao: 22.3, aprovada: false, responsavel: "Fernanda Rocha" });
        registrarInspecao("EQP-003", { medicao: 14, aprovada: false, responsavel: "Fernanda Rocha" });
        cadastrar({ idEquipamento: "EQP-004", versaoFirmware: "FW 3.0.1", versaoSoftware: "SW 6.1.0", cadastradoPor: "João Souza" });
        registrarInspecao("EQP-004", { medicao: 25, aprovada: false, responsavel: "Fernanda Rocha" });
        cadastrar({ idEquipamento: "EQP-005", versaoFirmware: "FW 3.0.1", versaoSoftware: "SW 6.0.0", cadastradoPor: "Ana Lima" });
        alterarVersoes("EQP-001", {
            versaoFirmware: "FW 2.2.0",
            responsavel: "Ana Lima",
            justificativa: "Atualização para corrigir falha de comunicação",
        });
    }

    return {
        equipamentos,
        inspecoes,
        historicoVersoes,
        correcoes,
        cadastrar,
        registrarInspecao,
        corrigirInspecao,
        alterarVersoes,
        buscarEquipamento,
        resumo,
        linhaDoTempo,
        excluirEquipamento,
        alterarHistorico,
    };
}
