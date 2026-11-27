import { useEffect, useState } from "react";
import EquipamentoDetalhe from "./components/EquipamentoDetalhe";
import EquipamentoForm from "./components/EquipamentoForm";
import EquipamentoLista from "./components/EquipamentoLista";
import { listarEquipamentos } from "./services/api";
import "./App.css";

export default function App() {
    const [equipamentos, setEquipamentos] = useState([]);
    const [selecionado, setSelecionado] = useState(null);
    const [cadastrando, setCadastrando] = useState(false);
    const [erro, setErro] = useState(null);

    function carregar() {
        listarEquipamentos()
            .then((lista) => setEquipamentos(lista))
            .catch((err) => setErro(err.message));
    }

    useEffect(() => {
        carregar();
    }, []);

    function aoCadastrar(id) {
        setCadastrando(false);
        setSelecionado(id);
        carregar();
    }

    const aptos = equipamentos.filter((eq) => eq.status === "Apto").length;

    return (
        <div className="app">
            <header>
                <div>
                    <h1>EquipCheck Mini</h1>
                    <p>MegaCore Labs · inspeção e liberação de equipamentos</p>
                </div>
                <div className="resumo">
                    <div><strong>{equipamentos.length}</strong><span>equipamentos</span></div>
                    <div><strong>{aptos}</strong><span>aptos</span></div>
                    <div><strong>{equipamentos.length - aptos}</strong><span>bloqueados</span></div>
                </div>
            </header>

            {erro && <p className="erro">{erro}</p>}

            <main>
                <aside>
                    <button onClick={() => setCadastrando(true)}>+ Novo equipamento</button>
                    <EquipamentoLista equipamentos={equipamentos} selecionado={selecionado} aoSelecionar={(id) => { setSelecionado(id); setCadastrando(false); }} />
                </aside>

                <div>
                    {cadastrando && <EquipamentoForm aoCadastrar={aoCadastrar} aoCancelar={() => setCadastrando(false)} />}
                    {!cadastrando && selecionado && <EquipamentoDetalhe key={selecionado} id={selecionado} aoMudar={carregar} />}
                    {!cadastrando && !selecionado && <p className="vazio">Selecione um equipamento ou cadastre um novo.</p>}
                </div>
            </main>
        </div>
    );
}
