// Backend de demonstração: dados em memória (sem MySQL).
// As regras de negócio ficam em regras.js / dominio.js e são as mesmas cobertas pelos testes.
import http from "node:http";
import { criarSistema, ErroNegocio } from "./dominio.js";

const PORTA = 3000;
const sistema = criarSistema({ popularExemplo: true });

const rotas = [
    ["GET", /^\/api\/equipamentos$/, () => sistema.equipamentos.map(sistema.resumo)],
    ["POST", /^\/api\/equipamentos$/, (_, corpo) => sistema.cadastrar(corpo), 201],
    ["GET", /^\/api\/equipamentos\/([^/]+)$/, ([id]) => sistema.resumo(sistema.buscarEquipamento(id))],
    ["PATCH", /^\/api\/equipamentos\/([^/]+)\/versoes$/, ([id], corpo) => sistema.alterarVersoes(id, corpo)],
    ["GET", /^\/api\/equipamentos\/([^/]+)\/versoes$/, ([id]) => (sistema.buscarEquipamento(id), sistema.historicoVersoes.filter((h) => h.idEquipamento === id))],
    ["GET", /^\/api\/equipamentos\/([^/]+)\/inspecoes$/, ([id]) => (sistema.buscarEquipamento(id), sistema.inspecoes.filter((i) => i.idEquipamento === id))],
    ["POST", /^\/api\/equipamentos\/([^/]+)\/inspecoes$/, ([id], corpo) => sistema.registrarInspecao(id, corpo), 201],
    ["GET", /^\/api\/equipamentos\/([^/]+)\/correcoes$/, ([id]) => (sistema.buscarEquipamento(id), sistema.correcoes.filter((c) => c.idEquipamento === id))],
    ["GET", /^\/api\/equipamentos\/([^/]+)\/linha-do-tempo$/, ([id]) => sistema.linhaDoTempo(id)],
    ["PATCH", /^\/api\/inspecoes\/([^/]+)$/, ([id], corpo) => sistema.corrigirInspecao(id, corpo)],
    ["POST", /^\/api\/inspecoes\/([^/]+)\/aprovacao$/, ([id], corpo) => sistema.corrigirInspecao(id, { ...corpo, aprovada: true })],
];

function lerCorpo(req) {
    return new Promise((resolve, reject) => {
        let texto = "";
        req.on("data", (parte) => (texto += parte));
        req.on("end", () => {
            try {
                resolve(texto ? JSON.parse(texto) : {});
            } catch {
                reject(new ErroNegocio(400, "JSON inválido."));
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
        if (!rota) throw new ErroNegocio(404, "Rota não encontrada.");

        const [, padrao, tratar, status = 200] = rota;
        const parametros = pathname.match(padrao).slice(1).map(decodeURIComponent);
        const corpo = req.method === "GET" ? {} : await lerCorpo(req);
        responder(status, tratar(parametros, corpo));
    } catch (err) {
        if (err instanceof ErroNegocio) return responder(err.status, { erro: err.message });
        console.error(err);
        responder(500, { erro: "Erro interno do servidor." });
    }
});

servidor.listen(PORTA, () => {
    console.log(`Backend de teste rodando em http://localhost:${PORTA}`);
});
