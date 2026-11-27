import { useEffect, useState } from "react";
import * as api from "../services/api";
import InspecaoAcao from "./InspecaoAcao";
import InspecaoForm from "./InspecaoForm";
import { TabelaCorrecoes, TabelaInspecoes, TabelaVersoes } from "./Tabelas";
import VersoesForm from "./VersoesForm";

export default function EquipamentoDetalhe({ id, aoMudar }) {
    const [dados, setDados] = useState(null);
    const [aba, setAba] = useState("inspecoes");
    const [acao, setAcao] = useState(null);
    const [erro, setErro] = useState(null);
    const [sucesso, setSucesso] = useState(null);

    // busca tudo de uma vez
    async function carregar() {
        try {
            const [equipamento, inspecoes, versoes, correcoes, tempo] = await Promise.all([
                api.buscarEquipamento(id),
                api.listarInspecoes(id),
                api.listarVersoes(id),
                api.listarCorrecoes(id),
                api.linhaDoTempo(id),
            ]);
            setDados({ equipamento, inspecoes, versoes, correcoes, tempo });
        } catch (err) {
            setErro(err.message);
        }
    }

    useEffect(() => {
        carregar();
    }, [id]);

    // depois de qualquer alteração: recarrega aqui e a lista da esquerda
    async function aoSalvar(mensagem) {
        setAcao(null);
        await carregar();
        setSucesso(mensagem);
        aoMudar();
    }

    if (erro && !dados) return <p className="erro">{erro}</p>;
    if (!dados) return <p className="nota">Carregando...</p>;

    const { equipamento } = dados;

    return (
        <section>
            <div className="card cabecalho">
                <div>
                    <h2>{equipamento.idEquipamento}</h2>
                    <p>Firmware <strong>{equipamento.versaoFirmware}</strong> · Software <strong>{equipamento.versaoSoftware}</strong></p>
                    <p className="nota">Cadastrado por {equipamento.cadastradoPor}</p>
                </div>
                <span className={`status ${equipamento.status}`}>{equipamento.status}</span>
            </div>

            {sucesso && <p className="sucesso">{sucesso}</p>}
            {erro && <p className="erro">{erro}</p>}

            <nav className="abas">
                {[["inspecoes", "Inspeções"], ["versoes", "Versões"], ["tempo", "Linha do tempo"]].map(([chave, nome]) => (
                    <button
                        key={chave}
                        className={aba === chave ? "ativa" : ""}
                        onClick={() => { setAba(chave); setSucesso(null); }}
                    >
                        {nome}
                    </button>
                ))}
            </nav>

            {aba === "inspecoes" && (
                <>
                    <InspecaoForm idEquipamento={equipamento.idEquipamento} aoSalvar={aoSalvar} />
                    {acao && (
                        <InspecaoAcao
                            key={`${acao.tipo}-${acao.inspecao.id}`}
                            tipo={acao.tipo}
                            inspecao={acao.inspecao}
                            aoSalvar={aoSalvar}
                            aoFechar={() => setAcao(null)}
                        />
                    )}
                    <h3>Inspeções</h3>
                    <TabelaInspecoes
                        inspecoes={dados.inspecoes}
                        aoAprovar={(inspecao) => setAcao({ tipo: "aprovar", inspecao })}
                        aoCorrigir={(inspecao) => setAcao({ tipo: "corrigir", inspecao })}
                    />
                    <h3>Correções e aprovações</h3>
                    <TabelaCorrecoes correcoes={dados.correcoes} />
                </>
            )}

            {aba === "versoes" && (
                <>
                    <VersoesForm equipamento={equipamento} aoSalvar={aoSalvar} />
                    <h3>Histórico de versões</h3>
                    <TabelaVersoes versoes={dados.versoes} />
                </>
            )}

            {aba === "tempo" && (
                <>
                    <h3>Linha do tempo</h3>
                    <ol className="tempo">
                        {dados.tempo.map((e, i) => (
                            <li key={i}><strong>{e.evento}</strong> {e.detalhe}</li>
                        ))}
                    </ol>
                </>
            )}
        </section>
    );
}
