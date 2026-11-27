import { useState } from "react";
import { formatarData, formatarMedicao } from "../services/formatar";

const sim = (valor) => (valor ? "sim" : "não");

export function TabelaInspecoes({ inspecoes, aoAprovar, aoCorrigir }) {
    const [verTodas, setVerTodas] = useState(false);

    if (inspecoes.length === 0) return <p className="nota">Nenhuma inspeção registrada.</p>;

    // mostra sempre a última; as anteriores ficam recolhidas
    const ultima = inspecoes[inspecoes.length - 1];
    const anteriores = inspecoes.slice(0, -1);
    const visiveis = verTodas ? inspecoes : [ultima];

    function linhaInspecao(i) {
        return (
            <tr key={i.id}>
                <td>{i.id}</td>
                <td>{formatarMedicao(i.medicao)}</td>
                <td><span className={`status ${i.classificacao}`}>{i.classificacao}</span></td>
                <td>{sim(i.aprovada)}</td>
                <td>{i.responsavel}</td>
                <td>{i.versaoFirmware} / {i.versaoSoftware}</td>
                <td>{formatarData(i.dataHora)}</td>
                <td>
                    <div className="botoes-acao">
                        {!i.aprovada && (
                            <button className="btn-aprovar" onClick={() => aoAprovar(i)}>Aprovar</button>
                        )}
                        <button className="btn-corrigir secundario" onClick={() => aoCorrigir(i)}>Corrigir</button>
                    </div>
                </td>
            </tr>
        );
    }

    return (
        <div>
            <div className="tabela">
                <table>
                    <thead>
                        <tr>
                            <th>#</th><th>Medição</th><th>Resultado</th><th>Aprovada</th>
                            <th>Responsável</th><th>Firmware / Software</th><th>Data</th><th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {visiveis.map(linhaInspecao)}
                    </tbody>
                </table>
            </div>
            {anteriores.length > 0 && (
                <button
                    className="secundario btn-historico"
                    onClick={() => setVerTodas(!verTodas)}
                >
                    {verTodas
                        ? "▲ Ocultar histórico"
                        : `▼ Ver histórico (${anteriores.length} inspeção${anteriores.length > 1 ? "ões" : ""} anterior${anteriores.length > 1 ? "es" : ""})`}
                </button>
            )}
        </div>
    );
}

export function TabelaVersoes({ versoes }) {
    if (versoes.length === 0) return <p className="nota">Sem histórico de versões.</p>;

    return (
        <div className="tabela">
            <table>
                <thead>
                    <tr><th>Data</th><th>Firmware</th><th>Software</th><th>Responsável</th><th>Justificativa</th></tr>
                </thead>
                <tbody>
                    {versoes.map((v) => (
                        <tr key={v.id}>
                            <td>{formatarData(v.dataHora)}</td>
                            <td>{v.firmwareAnterior ?? "-"} → {v.firmwareNovo}</td>
                            <td>{v.softwareAnterior ?? "-"} → {v.softwareNovo}</td>
                            <td>{v.responsavel}</td>
                            <td>{v.justificativa}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export function TabelaCorrecoes({ correcoes }) {
    if (correcoes.length === 0) return <p className="nota">Nenhuma correção ou aprovação registrada.</p>;

    return (
        <div className="tabela">
            <table>
                <thead>
                    <tr><th>Data</th><th>Inspeção</th><th>Medição</th><th>Aprovada</th><th>Responsável</th><th>Justificativa</th></tr>
                </thead>
                <tbody>
                    {correcoes.map((c) => (
                        <tr key={c.id}>
                            <td>{formatarData(c.dataHora)}</td>
                            <td>#{c.idInspecao}</td>
                            <td>{formatarMedicao(c.medicaoAnterior)} → {formatarMedicao(c.medicaoNova)}</td>
                            <td>{sim(c.aprovadaAnterior)} → {sim(c.aprovadaNova)}</td>
                            <td>{c.responsavel}</td>
                            <td>{c.justificativa}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
