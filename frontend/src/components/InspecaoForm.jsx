import { useState } from "react";
import { registrarInspecao } from "../services/api";
import Campo from "./Campo";

export default function InspecaoForm({ idEquipamento, aoSalvar }) {
    const [form, setForm] = useState({ medicao: "", responsavel: "", observacao: "" });
    const [erro, setErro] = useState(null);

    function handleChange(e) {
        setForm({ ...form, [e.target.name]: e.target.value });
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setErro(null);

        try {
            const { inspecao, equipamento } = await registrarInspecao(idEquipamento, {
                ...form,
                observacao: form.observacao.trim() || null,
            });
            setForm({ ...form, medicao: "", observacao: "" });
            aoSalvar(`Inspeção #${inspecao.id} registrada (${inspecao.classificacao}). Status: ${equipamento.status}.`);
        } catch (err) {
            setErro(err.message);
        }
    }

    return (
        <form className="card linha" onSubmit={handleSubmit}>
            <h3>Registrar inspeção</h3>
            <Campo label="Medição (10 a 20 é apto)" name="medicao" placeholder="15.50"
                value={form.medicao} onChange={handleChange} required />
            <Campo label="Responsável" name="responsavel"
                value={form.responsavel} onChange={handleChange} required />
            <Campo label="Observação" name="observacao" value={form.observacao} onChange={handleChange} />
            {erro && <p className="erro">{erro}</p>}
            <button type="submit">Registrar</button>
        </form>
    );
}
