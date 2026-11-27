// Regras de negócio do EquipCheck Mini (RF01 a RF06).
// Funções puras, testadas em isolamento (unidade) e reutilizadas pelo domínio.

export class ErroNegocio extends Error {
    constructor(status, mensagem) {
        super(mensagem);
        this.status = status;
    }
}

// RF03 — faixa didática 10.00 a 20.00, inclusive
export function classificar(medicao) {
    return medicao >= 10 && medicao <= 20 ? "Apto" : "Bloqueado";
}

// RF02 — medição numérica (aceita vírgula)
export function lerMedicao(valor) {
    const bruto = String(valor ?? "").trim();
    const numero = Number(bruto.replace(",", "."));
    if (bruto === "" || Number.isNaN(numero)) throw new ErroNegocio(400, "Medição inválida.");
    return Math.round(numero * 100) / 100;
}

// RF01 — identificador no formato EQP-001
export function validarIdEquipamento(id) {
    if (!/^EQP-\d{3}$/.test(id ?? "")) throw new ErroNegocio(400, "O ID deve seguir o formato EQP-001.");
}

// RF05 — responsável e justificativa (mín. 10 caracteres e diferente da anterior)
export function conferirAutor({ responsavel, justificativa }, anterior) {
    if (!responsavel?.trim()) throw new ErroNegocio(400, "O responsável é obrigatório.");
    const texto = (justificativa ?? "").trim();
    if (texto.length < 10) throw new ErroNegocio(400, "A justificativa precisa ter pelo menos 10 caracteres.");
    if (texto === anterior) throw new ErroNegocio(400, "A justificativa não pode ser igual à anterior.");
    return { responsavel: responsavel.trim(), justificativa: texto };
}

// RF04 — fora da faixa ou sem aprovação: Bloqueado; dentro da faixa e aprovada: Apto
export function atualizarStatus(eq, ultima) {
    if (!ultima || ultima.classificacao === "Bloqueado" || !ultima.aprovada) eq.status = "Bloqueado";
    else eq.status = "Apto";
}

export function recusarExclusao(entidade) {
    throw new ErroNegocio(403, `Exclusão de ${entidade} é bloqueada.`);
}

export function recusarAlteracaoHistorico() {
    throw new ErroNegocio(403, "Registros de histórico não podem ser alterados nem excluídos.");
}
