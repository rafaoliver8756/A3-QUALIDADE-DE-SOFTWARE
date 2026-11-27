import { useState } from "react";
import { cadastrarEquipamento } from "../services/api";
import Campo from "./Campo";

const VAZIO = { idEquipamento: "", versaoFirmware: "", versaoSoftware: "", cadastradoPor: "" };

function EquipamentoForm({ aoCadastrar, aoCancelar }) {
    const [form, setForm] = useState(VAZIO);
    const [erro, setErro] = useState(null);

    function handleChange(e) {
        const { name, value } = e.target;
        setForm({ ...form, [name]: name === "idEquipamento" ? value.toUpperCase() : value });
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setErro(null);

        try {
            await cadastrarEquipamento(form);
            aoCadastrar(form.idEquipamento);
        } catch (err) {
            setErro(err.message);
        }
    }

    return (
        <form className="card" onSubmit={handleSubmit}>
            <h2>Novo equipamento</h2>
            <Campo label="ID do equipamento" name="idEquipamento" placeholder="EQP-001" pattern="EQP-\d{3}"
                title="Use o formato EQP-001" value={form.idEquipamento} onChange={handleChange} required />
            <Campo label="Versão do firmware" name="versaoFirmware" placeholder="FW 2.1.0"
                value={form.versaoFirmware} onChange={handleChange} required />
            <Campo label="Versão do software" name="versaoSoftware" placeholder="SW 5.3.2"
                value={form.versaoSoftware} onChange={handleChange} required />
            <Campo label="Cadastrado por" name="cadastradoPor"
                value={form.cadastradoPor} onChange={handleChange} required />
            {erro && <p className="erro">{erro}</p>}
            <div className="botoes">
                <button type="submit">Cadastrar</button>
                <button type="button" className="secundario" onClick={aoCancelar}>Cancelar</button>
            </div>
            <p className="nota">O equipamento nasce Bloqueado até uma inspeção aprovada.</p>
        </form>
    );
}

export default EquipamentoForm;
