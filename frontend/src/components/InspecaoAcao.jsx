import { useState } from "react";
import { aprovarInspecao, corrigirInspecao } from "../services/api";
import Campo from "./Campo";

// Serve para corrigir ou para aprovar uma inspeção
export default function InspecaoAcao({ tipo, inspecao, aoSalvar, aoFechar }) {
    const corrigir = tipo === "corrigir";
    const [form, setForm] = useState({
        medicao: String(inspecao.medicao),
        observacao: inspecao.observacao ?? "",
        responsavel: "",
        justificativa: "",
    });
    const [erro, setErro] = useState(null);

    function handleChange(e) {
        setForm({ ...form, [e.target.name]: e.target.value });
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setErro(null);

        const autor = { responsavel: form.responsavel, justificativa: form.justificativa };

        try {
            const resultado = corrigir
                ? await corrigirInspecao(inspecao.id, { ...autor, medicao: form.medicao, observacao: form.observacao.trim() || null })
                : await aprovarInspecao(inspecao.id, autor);
            const status = resultado.equipamento.status;
            const msg = corrigir
                ? `Inspeção #${inspecao.id} corrigida. Equipamento ${status}.`
                : status === "Apto"
                    ? `Inspeção #${inspecao.id} aprovada. Equipamento liberado como Apto.`
                    : `Inspeção #${inspecao.id} aprovada, mas medição fora da faixa. Equipamento continua Bloqueado.`;
            aoSalvar(msg, status);
        } catch (err) {
            setErro(err.message);
        }
    }

    return (
        <form className="card linha" onSubmit={handleSubmit}>
            <h3>{corrigir ? "Corrigir" : "Aprovar"} inspeção #{inspecao.id}</h3>
            {corrigir && (
                <>
                    <Campo label="Medição" name="medicao" value={form.medicao} onChange={handleChange} required />
                    <Campo label="Observação" name="observacao" value={form.observacao} onChange={handleChange} />
                </>
            )}
            <Campo label="Responsável" name="responsavel" value={form.responsavel} onChange={handleChange} required />
            <Campo label="Justificativa (mín. 10 caracteres)" name="justificativa" area
                value={form.justificativa} onChange={handleChange} required />
            {erro && <p className="erro">{erro}</p>}
            <div className="botoes">
                <button type="submit">Salvar</button>
                <button type="button" className="secundario" onClick={aoFechar}>Cancelar</button>
            </div>
        </form>
    );
}
