import { useState } from "react";
import { alterarVersoes } from "../services/api";
import Campo from "./Campo";

export default function VersoesForm({ equipamento, aoSalvar }) {
    const [form, setForm] = useState({
        versaoFirmware: equipamento.versaoFirmware,
        versaoSoftware: equipamento.versaoSoftware,
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

        // manda só a versão que mudou
        const corpo = { responsavel: form.responsavel, justificativa: form.justificativa };
        if (form.versaoFirmware !== equipamento.versaoFirmware) corpo.versaoFirmware = form.versaoFirmware;
        if (form.versaoSoftware !== equipamento.versaoSoftware) corpo.versaoSoftware = form.versaoSoftware;

        try {
            await alterarVersoes(equipamento.idEquipamento, corpo);
            setForm({ ...form, justificativa: "" });
            aoSalvar("Versões atualizadas.");
        } catch (err) {
            setErro(err.message);
        }
    }

    return (
        <form className="card linha" onSubmit={handleSubmit}>
            <h3>Alterar versões</h3>
            <Campo label="Firmware" name="versaoFirmware" value={form.versaoFirmware} onChange={handleChange} required />
            <Campo label="Software" name="versaoSoftware" value={form.versaoSoftware} onChange={handleChange} required />
            <Campo label="Responsável" name="responsavel" value={form.responsavel} onChange={handleChange} required />
            <Campo label="Justificativa (mín. 10 caracteres)" name="justificativa" area
                value={form.justificativa} onChange={handleChange} required />
            {erro && <p className="erro">{erro}</p>}
            <button type="submit">Salvar</button>
        </form>
    );
}
