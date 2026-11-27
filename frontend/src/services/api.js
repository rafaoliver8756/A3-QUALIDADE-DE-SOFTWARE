// Todas as chamadas ao backend ficam aqui
async function requisicao(url, opcoes = {}) {
    let res;

    try {
        res = await fetch(url, {
            headers: { "Content-Type": "application/json" },
            ...opcoes,
        });
    } catch {
        throw new Error("Não foi possível conectar ao servidor.");
    }

    const dados = await res.json().catch(() => ({}));
    if (!res.ok) {
        throw new Error(dados.erro || `Erro ${res.status}`);
    }
    return dados;
}

function enviar(metodo, url, corpo) {
    return requisicao(url, { method: metodo, body: JSON.stringify(corpo) });
}

export function listarEquipamentos() {
    return requisicao("/api/equipamentos");
}

export function cadastrarEquipamento(equipamento) {
    return enviar("POST", "/api/equipamentos", equipamento);
}

export function buscarEquipamento(id) {
    return requisicao(`/api/equipamentos/${id}`);
}

export function alterarVersoes(id, dados) {
    return enviar("PATCH", `/api/equipamentos/${id}/versoes`, dados);
}

export function listarInspecoes(id) {
    return requisicao(`/api/equipamentos/${id}/inspecoes`);
}

export function registrarInspecao(id, dados) {
    return enviar("POST", `/api/equipamentos/${id}/inspecoes`, dados);
}

export function listarVersoes(id) {
    return requisicao(`/api/equipamentos/${id}/versoes`);
}

export function listarCorrecoes(id) {
    return requisicao(`/api/equipamentos/${id}/correcoes`);
}

export function linhaDoTempo(id) {
    return requisicao(`/api/equipamentos/${id}/linha-do-tempo`);
}

export function corrigirInspecao(idInspecao, dados) {
    return enviar("PATCH", `/api/inspecoes/${idInspecao}`, dados);
}

export function aprovarInspecao(idInspecao, dados) {
    return enviar("POST", `/api/inspecoes/${idInspecao}/aprovacao`, dados);
}
