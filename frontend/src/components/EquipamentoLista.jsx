import { formatarMedicao } from "../services/formatar";

export default function EquipamentoLista({ equipamentos, selecionado, aoSelecionar }) {
    if (equipamentos.length === 0) return <p className="nota">Nenhum equipamento cadastrado.</p>;

    return (
        <ul className="lista">
            {equipamentos.map((eq) => (
                <li key={eq.idEquipamento}>
                    <button
                        className={eq.idEquipamento === selecionado ? "item ativo" : "item"}
                        onClick={() => aoSelecionar(eq.idEquipamento)}
                    >
                        <span className="topo">
                            <strong>{eq.idEquipamento}</strong>
                            <span className={`status ${eq.status}`}>{eq.status}</span>
                        </span>
                        <small>{eq.versaoFirmware} · {eq.versaoSoftware}</small>
                        <small>Última medição: {formatarMedicao(eq.ultimaMedicao)}</small>
                    </button>
                </li>
            ))}
        </ul>
    );
}
