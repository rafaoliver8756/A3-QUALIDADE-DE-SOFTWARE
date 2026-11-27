// Backend simples só para testar o front. Sem banco e sem dependências:
// tudo fica na memória e volta ao início quando o servidor é reiniciado.
import http from "node:http";

const PORTA = 3000;

const equipamentos = [];
const inspecoes = [];
const historicoVersoes = [];
const correcoes = [];
let ordem = 0; // para ordenar a linha do tempo

class ErroHttp extends Error {
    constructor(status, mensagem) {
        super(mensagem);
        this.status = status;
    }
}

const agora = () => new Date().toISOString();
const classificar = (medicao) => (medicao >= 10 && medicao <= 20 ? "Apto" : "Bloqueado");

// ---------- regras ----------

function buscarEquipamento(id) {
    const eq = equipamentos.find((e) => e.idEquipamento === id);
    if (!eq) throw new ErroHttp(404, `Equipamento ${id} não encontrado.`);
    return eq;
}

function buscarInspecao(id) {
    const insp = inspecoes.find((i) => i.id === Number(id));
    if (!insp) throw new ErroHttp(404, `Inspeção ${id} não encontrada.`);
    return insp;
}

function lerMedicao(valor) {
    const numero = Number(String(valor ?? "").replace(",", "."));
    if (String(valor ?? "").trim() === "" || Number.isNaN(numero)) throw new ErroHttp(400, "Medição inválida.");
    return Math.round(numero * 100) / 100;
}

// toda alteração precisa de responsável e justificativa (mín. 10 caracteres e diferente da anterior)
function conferirAutor({ responsavel, justificativa }, anterior) {
    if (!responsavel?.trim()) throw new ErroHttp(400, "O responsável é obrigatório.");
    const texto = (justificativa ?? "").trim();
    if (texto.length < 10) throw new ErroHttp(400, "A justificativa precisa ter pelo menos 10 caracteres.");
    if (texto === anterior) throw new ErroHttp(400, "A justificativa não pode ser igual à anterior.");
    return { responsavel: responsavel.trim(), justificativa: texto };
}

// fora da faixa bloqueia; dentro da faixa só libera se a inspeção estiver aprovada
function atualizarStatus(eq) {
    const ultima = inspecoes.filter((i) => i.idEquipamento === eq.idEquipamento).at(-1);
    if (!ultima || ultima.classificacao === "Bloqueado") eq.status = "Bloqueado";
    else if (ultima.aprovada) eq.status = "Apto";
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

// ---------- casos de uso ----------

function cadastrar(corpo) {
    const { idEquipamento, versaoFirmware, versaoSoftware, cadastradoPor } = corpo;

    if (!/^EQP-\d{3}$/.test(idEquipamento ?? "")) throw new ErroHttp(400, "O ID deve seguir o formato EQP-001.");
    if (!versaoFirmware?.trim() || !versaoSoftware?.trim()) throw new ErroHttp(400, "As versões são obrigatórias.");
    if (!cadastradoPor?.trim()) throw new ErroHttp(400, "Informe quem está cadastrando.");
    if (equipamentos.some((e) => e.idEquipamento === idEquipamento)) {
        throw new ErroHttp(409, `Já existe um equipamento com o ID ${idEquipamento}.`);
    }

    // equipamento novo sempre nasce Bloqueado
    const eq = {
        idEquipamento,
        versaoFirmware: versaoFirmware.trim(),
        versaoSoftware: versaoSoftware.trim(),
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
    if (!corpo.responsavel?.trim()) throw new ErroHttp(400, "O responsável é obrigatório.");
    const medicao = lerMedicao(corpo.medicao);

    const inspecao = {
        id: inspecoes.length + 1,
        idEquipamento,
        medicao,
        classificacao: classificar(medicao),
        aprovada: corpo.aprovada === true,
        responsavel: corpo.responsavel.trim(),
        observacao: corpo.observacao || null,
        versaoFirmware: eq.versaoFirmware, // guarda as versões da época
        versaoSoftware: eq.versaoSoftware,
        dataHora: agora(),
        ordem: ++ordem,
    };
    inspecoes.push(inspecao);
    atualizarStatus(eq);
    return { inspecao, equipamento: resumo(eq) };
}

function corrigirInspecao(id, corpo) {
    const insp = buscarInspecao(id);
    const eq = buscarEquipamento(insp.idEquipamento);

    const medicao = corpo.medicao === undefined ? insp.medicao : lerMedicao(corpo.medicao);
    const aprovada = corpo.aprovada === undefined ? insp.aprovada : corpo.aprovada === true;
    const observacao = corpo.observacao === undefined ? insp.observacao : corpo.observacao;
    if (medicao === insp.medicao && aprovada === insp.aprovada && observacao === insp.observacao) {
        throw new ErroHttp(400, "Nenhuma alteração informada.");
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
    atualizarStatus(eq);
    return { inspecao: insp, equipamento: resumo(eq) };
}

function alterarVersoes(id, corpo) {
    const eq = buscarEquipamento(id);
    const firmware = corpo.versaoFirmware?.trim() || eq.versaoFirmware;
    const software = corpo.versaoSoftware?.trim() || eq.versaoSoftware;
    if (firmware === eq.versaoFirmware && software === eq.versaoSoftware) {
        throw new ErroHttp(400, "Nenhuma alteração de versão informada.");
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

// ---------- rotas ----------

const rotas = [
    ["GET", /^\/api\/equipamentos$/, () => equipamentos.map(resumo)],
    ["POST", /^\/api\/equipamentos$/, (_, corpo) => cadastrar(corpo), 201],
    ["GET", /^\/api\/equipamentos\/([^/]+)$/, ([id]) => resumo(buscarEquipamento(id))],
    ["PATCH", /^\/api\/equipamentos\/([^/]+)\/versoes$/, ([id], corpo) => alterarVersoes(id, corpo)],
    ["GET", /^\/api\/equipamentos\/([^/]+)\/versoes$/, ([id]) => (buscarEquipamento(id), historicoVersoes.filter((h) => h.idEquipamento === id))],
    ["GET", /^\/api\/equipamentos\/([^/]+)\/inspecoes$/, ([id]) => (buscarEquipamento(id), inspecoes.filter((i) => i.idEquipamento === id))],
    ["POST", /^\/api\/equipamentos\/([^/]+)\/inspecoes$/, ([id], corpo) => registrarInspecao(id, corpo), 201],
    ["GET", /^\/api\/equipamentos\/([^/]+)\/correcoes$/, ([id]) => (buscarEquipamento(id), correcoes.filter((c) => c.idEquipamento === id))],
    ["GET", /^\/api\/equipamentos\/([^/]+)\/linha-do-tempo$/, ([id]) => linhaDoTempo(id)],
    ["PATCH", /^\/api\/inspecoes\/([^/]+)$/, ([id], corpo) => corrigirInspecao(id, corpo)],
    ["POST", /^\/api\/inspecoes\/([^/]+)\/aprovacao$/, ([id], corpo) => corrigirInspecao(id, { ...corpo, aprovada: true })],
];

function lerCorpo(req) {
    return new Promise((resolve, reject) => {
        let texto = "";
        req.on("data", (parte) => (texto += parte));
        req.on("end", () => {
            try {
                resolve(texto ? JSON.parse(texto) : {});
            } catch {
                reject(new ErroHttp(400, "JSON inválido."));
            }
        });
    });
}

const servidor = http.createServer(async (req, res) => {
    function responder(status, dados) {
        res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Access-Control-Allow-Origin": "*" });
        res.end(JSON.stringify(dados));
    }

    try {
        const { pathname } = new URL(req.url, "http://localhost");
        const rota = rotas.find(([metodo, padrao]) => metodo === req.method && padrao.test(pathname));
        if (!rota) throw new ErroHttp(404, "Rota não encontrada.");

        const [, padrao, tratar, status = 200] = rota;
        const parametros = pathname.match(padrao).slice(1).map(decodeURIComponent);
        const corpo = req.method === "GET" ? {} : await lerCorpo(req);
        responder(status, tratar(parametros, corpo));
    } catch (err) {
        if (err instanceof ErroHttp) return responder(err.status, { erro: err.message });
        console.error(err);
        responder(500, { erro: "Erro interno do servidor." });
    }
});

// ---------- dados de exemplo ----------

function popularExemplo() {
    const novo = (id, fw, sw, quem) => cadastrar({ idEquipamento: id, versaoFirmware: fw, versaoSoftware: sw, cadastradoPor: quem });
    const inspecionar = (id, medicao, aprovada, quem) => registrarInspecao(id, { medicao, aprovada, responsavel: quem });

    novo("EQP-001", "FW 2.1.0", "SW 5.3.2", "Maria Silva");
    inspecionar("EQP-001", 15.5, true, "Carlos Lima");
    novo("EQP-002", "FW 2.1.0", "SW 5.3.2", "Maria Silva");
    inspecionar("EQP-002", 18, true, "Carlos Lima");
    novo("EQP-003", "FW 1.9.5", "SW 5.4.0", "João Souza");
    inspecionar("EQP-003", 22.3, false, "Fernanda Rocha");
    inspecionar("EQP-003", 14, false, "Fernanda Rocha"); // dentro da faixa, mas sem aprovação: continua Bloqueado
    novo("EQP-004", "FW 3.0.1", "SW 6.1.0", "João Souza");
    inspecionar("EQP-004", 25, false, "Fernanda Rocha");
    novo("EQP-005", "FW 3.0.1", "SW 6.0.0", "Ana Lima");
    alterarVersoes("EQP-001", { versaoFirmware: "FW 2.2.0", responsavel: "Ana Lima", justificativa: "Atualização para corrigir falha de comunicação" });
}

popularExemplo();

servidor.listen(PORTA, () => {
    console.log(`Backend de teste rodando em http://localhost:${PORTA}`);
});
