export function formatarMedicao(valor) {
    return valor == null ? "-" : Number(valor).toFixed(2);
}

export function formatarData(valor) {
    if (!valor) return "-";
    const data = new Date(String(valor).replace(" ", "T"));
    return isNaN(data) ? valor : data.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}
