import React, { useState, useMemo } from "react";

const PILARES_INICIAIS = [
  {
    id: "adm",
    nome: "Administrativo",
    kpis: [
      { id: "adm1", nome: "Documentação em dia", pontosBase: 5, peso: 1 },
      { id: "adm2", nome: "Atraso em entrega de relatório", pontosBase: -4, peso: 1 },
      { id: "adm3", nome: "Pendência financeira", pontosBase: -6, peso: 1 },
    ],
  },
  {
    id: "qua",
    nome: "Qualidade",
    kpis: [
      { id: "qua1", nome: "Serviço em conformidade", pontosBase: 3, peso: 1 },
      { id: "qua2", nome: "Reclamação procedente", pontosBase: -3, peso: 1 },
      { id: "qua3", nome: "Retrabalho", pontosBase: -5, peso: 1.5 },
    ],
  },
  {
    id: "ope",
    nome: "Operação",
    kpis: [
      { id: "ope1", nome: "Prazo cumprido", pontosBase: 4, peso: 1 },
      { id: "ope2", nome: "Acidente de trabalho", pontosBase: -10, peso: 2 },
      { id: "ope3", nome: "Ociosidade", pontosBase: -2, peso: 1 },
    ],
  },
];

const PRESTADORES_INICIAIS = [
  { id: "p1", nome: "Prestador Alpha", regiao: "Sudeste", ativo: true },
  { id: "p2", nome: "Prestador Beta", regiao: "Sul", ativo: true },
  { id: "p3", nome: "Prestador Gama", regiao: "Sudeste", ativo: true },
  { id: "p4", nome: "Prestador Delta", regiao: "Nordeste", ativo: true },
];

const MESES = ["2026-01","2026-02","2026-03","2026-04","2026-05","2026-06","2026-07","2026-08"];

function gerarLancamentosIniciais(prestadores, pilares) {
  const dados = {};
  prestadores.forEach((p) => {
    dados[p.id] = {};
    MESES.forEach((m) => {
      dados[p.id][m] = {};
      pilares.forEach((pl) => {
        pl.kpis.forEach((k) => {
          dados[p.id][m][k.id] = Math.floor(Math.random() * 3);
        });
      });
    });
  });
  return dados;
}

export default function App() {
  const [pilares, setPilares] = useState(PILARES_INICIAIS);
  const [prestadores, setPrestadores] = useState(PRESTADORES_INICIAIS);
  const [lancamentos, setLancamentos] = useState(() =>
    gerarLancamentosIniciais(PRESTADORES_INICIAIS, PILARES_INICIAIS)
  );

  const [aba, setAba] = useState("ranking");
  const [filtroRegiao, setFiltroRegiao] = useState("Todas");
  const [filtroMes, setFiltroMes] = useState(MESES[MESES.length - 1]);
  const [lancPrestador, setLancPrestador] = useState(prestadores[0].id);
  const [lancMes, setLancMes] = useState(MESES[MESES.length - 1]);
  const [prestadorLogado, setPrestadorLogado] = useState(prestadores[0].id);
  const [novoPrestador, setNovoPrestador] = useState({ nome: "", regiao: "" });

  const [novoKpi, setNovoKpi] = useState<{ [key: string]: any }>({});
  const [csvMes, setCsvMes] = useState(MESES[MESES.length - 1]);
  const [csvTexto, setCsvTexto] = useState("");
  const [csvResultado, setCsvResultado] = useState(null);
  const [sheetUrl, setSheetUrl] = useState("");

  function calcPilarScore(prestadorId, pilarId, mes) {
    const pilar = pilares.find((p) => p.id === pilarId);
    const lanc = lancamentos[prestadorId]?.[mes] || {};
    let score = 100;
    pilar.kpis.forEach((k) => {
      const ocorrencias = lanc[k.id] || 0;
      score += ocorrencias * k.pontosBase * k.peso;
    });
    return Math.round(score * 10) / 10;
  }

  function calcGeralScore(prestadorId, mes) {
    const scores = pilares.map((p) => calcPilarScore(prestadorId, p.id, mes));
    return Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10;
  }

  function calcRankingAnual(prestadorId) {
    const scores = MESES.map((m) => calcGeralScore(prestadorId, m));
    return Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10;
  }

  const rankingMensal = useMemo(() => {
    return prestadores
      .filter((p) => filtroRegiao === "Todas" || p.regiao === filtroRegiao)
      .map((p) => ({
        ...p,
        geral: calcGeralScore(p.id, filtroMes),
        porPilar: pilares.map((pl) => ({
          nome: pl.nome,
          score: calcPilarScore(p.id, pl.id, filtroMes),
        })),
      }))
      .sort((a, b) => b.geral - a.geral);
  }, [prestadores, pilares, lancamentos, filtroRegiao, filtroMes]);

  const rankingAnual = useMemo(() => {
    return prestadores
      .map((p) => ({ ...p, anual: calcRankingAnual(p.id) }))
      .sort((a, b) => b.anual - a.anual);
  }, [prestadores, pilares, lancamentos]);

  function atualizarPeso(pilarId, kpiId, novoPeso) {
    setPilares((prev) =>
      prev.map((p) =>
        p.id !== pilarId
          ? p
          : {
              ...p,
              kpis: p.kpis.map((k) =>
                k.id === kpiId ? { ...k, peso: parseFloat(novoPeso) || 0 } : k
              ),
            }
      )
    );
  }

  function atualizarLancamento(kpiId, valor) {
    setLancamentos((prev) => ({
      ...prev,
      [lancPrestador]: {
        ...prev[lancPrestador],
        [lancMes]: {
          ...prev[lancPrestador]?.[lancMes],
          [kpiId]: parseInt(valor) || 0,
        },
      },
    }));
  }

  function adicionarPrestador() {
    if (!novoPrestador.nome) return;
    const id = "p" + (prestadores.length + 1) + Date.now();
    const novo = { id, nome: novoPrestador.nome, regiao: novoPrestador.regiao || "N/D", ativo: true };
    setPrestadores((prev) => [...prev, novo]);
    setLancamentos((prev) => ({
      ...prev,
      [id]: MESES.reduce((acc, m) => {
        acc[m] = {};
        pilares.forEach((pl) => pl.kpis.forEach((k) => (acc[m][k.id] = 0)));
        return acc;
      }, {}),
    }));
    setNovoPrestador({ nome: "", regiao: "" });
  }

  function adicionarKpi(pilarId) {
    const dados = novoKpi[pilarId];
    if (!dados || !dados.nome) return;
    const novoId = pilarId + "_" + Date.now();
    setPilares((prev) =>
      prev.map((p) =>
        p.id !== pilarId
          ? p
          : {
              ...p,
              kpis: [
                ...p.kpis,
                {
                  id: novoId,
                  nome: dados.nome,
                  pontosBase: parseFloat(dados.pontosBase) || 0,
                  peso: parseFloat(dados.peso) || 1,
                },
              ],
            }
      )
    );
    setLancamentos((prev) => {
      const copia = { ...prev };
      Object.keys(copia).forEach((prestId) => {
        MESES.forEach((m) => {
          copia[prestId] = {
            ...copia[prestId],
            [m]: { ...copia[prestId][m], [novoId]: 0 },
          };
        });
      });
      return copia;
    });
    setNovoKpi((prev) => ({ ...prev, [pilarId]: { nome: "", pontosBase: "", peso: "1" } }));
  }

  function todosKpis() {
    return pilares.flatMap((p) => p.kpis.map((k) => ({ ...k, pilarNome: p.nome })));
  }

  function baixarModeloCsv() {
    const kpis = todosKpis();
    const header = ["prestador_id", "prestador_nome", ...kpis.map((k) => k.id)].join(",");
    const linhaExemplo = prestadores
      .map((p) => [p.id, p.nome, ...kpis.map(() => 0)].join(","))
      .join("\n");
    const conteudo = header + "\n" + linhaExemplo;
    const blob = new Blob([conteudo], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `modelo_lancamento_${csvMes}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function processarTextoCsv(texto, mesReferencia) {
    if (!texto.trim()) {
      setCsvResultado({ erro: "Nenhum conteúdo encontrado para importar." });
      return;
    }
    const linhas = texto.trim().split("\n");
    const header = linhas[0].split(",").map((h) => h.trim());
    const idxPrestador = header.indexOf("prestador_id");
    if (idxPrestador === -1) {
      setCsvResultado({ erro: "Coluna 'prestador_id' não encontrada no cabeçalho." });
      return;
    }
    const kpiColunas = header
      .map((h, i) => ({ h, i }))
      .filter((c) => c.i !== idxPrestador && c.h !== "prestador_nome");

    let atualizados = 0;
    let naoEncontrados = [];
    const novosLancamentos = { ...lancamentos };

    for (let i = 1; i < linhas.length; i++) {
      if (!linhas[i].trim()) continue;
      const colunas = linhas[i].split(",").map((c) => c.trim());
      const prestadorId = colunas[idxPrestador];
      const existe = prestadores.find((p) => p.id === prestadorId);
      if (!existe) {
        naoEncontrados.push(prestadorId);
        continue;
      }
      const registroKpis = {};
      kpiColunas.forEach((c) => {
        registroKpis[c.h] = parseInt(colunas[c.i]) || 0;
      });
      novosLancamentos[prestadorId] = {
        ...novosLancamentos[prestadorId],
        [mesReferencia]: {
          ...novosLancamentos[prestadorId]?.[mesReferencia],
          ...registroKpis,
        },
      };
      atualizados++;
    }

    setLancamentos(novosLancamentos);
    setCsvResultado({ sucesso: true, atualizados, naoEncontrados, mes: mesReferencia });
  }

  async function importarDeGoogleSheets() {
    if (!sheetUrl.trim()) {
      setCsvResultado({ erro: "Cole o link da planilha publicada antes de importar." });
      return;
    }
    setCsvResultado({ carregando: true });
    try {
      const resposta = await fetch(sheetUrl);
      if (!resposta.ok) throw new Error("Não foi possível acessar a planilha. Verifique se o link está publicado corretamente.");
      const texto = await resposta.text();
      processarTextoCsv(texto, csvMes);
    } catch (e) {
      setCsvResultado({ erro: e.message || "Erro ao buscar dados da planilha." });
    }
  }

  function processarCsv() {
    processarTextoCsv(csvTexto, csvMes);
  }

  const regioes = ["Todas", ...new Set(prestadores.map((p) => p.regiao))];

  const barraCor = (score) =>
    score >= 90 ? "#22c55e" : score >= 70 ? "#eab308" : "#ef4444";

  return (
    <div style={{ display: "flex", fontFamily: "Arial, sans-serif", minHeight: "100vh", background: "#f3f4f6" }}>
      <div style={{ width: 220, background: "#111827", color: "#fff", padding: 16 }}>
        <h3 style={{ marginBottom: 20 }}>Gamificação</h3>
        {[
          ["ranking", "Ranking / Dashboard"],
          ["prestadores", "Prestadores"],
          ["pilares", "Pilares & KPIs"],
          ["lancamento", "Lançamento Mensal"],
          ["importar", "Importar Planilha"],
          ["minhaPontuacao", "Minha Pontuação"],
        ].map(([key, label]) => (
          <div
            key={key}
            onClick={() => setAba(key)}
            style={{
              padding: "10px 8px",
              marginBottom: 6,
              borderRadius: 6,
              cursor: "pointer",
              background: aba === key ? "#2563eb" : "transparent",
            }}
          >
            {label}
          </div>
        ))}
      </div>

      <div style={{ flex: 1, padding: 24 }}>
        {aba === "ranking" && (
          <div>
            <h2>Ranking de Prestadores</h2>
            <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
              <select value={filtroRegiao} onChange={(e) => setFiltroRegiao(e.target.value)}>
                {regioes.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
              <select value={filtroMes} onChange={(e) => setFiltroMes(e.target.value)}>
                {MESES.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <table width="100%" cellPadding={8} style={{ background: "#fff", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#e5e7eb", textAlign: "left" }}>
                  <th>#</th>
                  <th>Prestador</th>
                  <th>Região</th>
                  <th>Administrativo</th>
                  <th>Qualidade</th>
                  <th>Operação</th>
                  <th>Pontuação Geral</th>
                </tr>
              </thead>
              <tbody>
                {rankingMensal.map((p, i) => (
                  <tr key={p.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                    <td>{i + 1}º</td>
                    <td>{p.nome}</td>
                    <td>{p.regiao}</td>
                    {p.porPilar.map((pl) => (
                      <td key={pl.nome}>{pl.score}</td>
                    ))}
                    <td>
                      <strong style={{ color: barraCor(p.geral) }}>{p.geral}</strong>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <h3 style={{ marginTop: 32 }}>Ranking Anual (média das apurações mensais)</h3>
            <table width="100%" cellPadding={8} style={{ background: "#fff", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#e5e7eb", textAlign: "left" }}>
                  <th>Posição</th>
                  <th>Prestador</th>
                  <th>Pontuação Anual</th>
                  <th>Premiação</th>
                </tr>
              </thead>
              <tbody>
                {rankingAnual.map((p, i) => (
                  <tr key={p.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                    <td>{i + 1}º</td>
                    <td>{p.nome}</td>
                    <td>{p.anual}</td>
                    <td>{i === 0 ? "🥇 1º lugar" : i === 1 ? "🥈 2º lugar" : i === 2 ? "🥉 3º lugar" : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {aba === "prestadores" && (
          <div>
            <h2>Cadastro de Prestadores</h2>
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              <input
                placeholder="Nome do prestador"
                value={novoPrestador.nome}
                onChange={(e) => setNovoPrestador({ ...novoPrestador, nome: e.target.value })}
              />
              <input
                placeholder="Região"
                value={novoPrestador.regiao}
                onChange={(e) => setNovoPrestador({ ...novoPrestador, regiao: e.target.value })}
              />
              <button onClick={adicionarPrestador}>Adicionar</button>
            </div>
            <table width="100%" cellPadding={8} style={{ background: "#fff", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#e5e7eb", textAlign: "left" }}>
                  <th>ID</th>
                  <th>Nome</th>
                  <th>Região</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {prestadores.map((p) => (
                  <tr key={p.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                    <td style={{ color: "#9ca3af", fontSize: 12 }}>{p.id}</td>
                    <td>{p.nome}</td>
                    <td>{p.regiao}</td>
                    <td>{p.ativo ? "Ativo" : "Inativo"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {aba === "pilares" && (
          <div>
            <h2>Pilares e KPIs</h2>
            {pilares.map((pl) => (
              <div key={pl.id} style={{ background: "#fff", padding: 16, marginBottom: 16, borderRadius: 8 }}>
                <h3>{pl.nome}</h3>
                <table width="100%" cellPadding={6}>
                  <thead>
                    <tr style={{ textAlign: "left", color: "#6b7280" }}>
                      <th>KPI</th>
                      <th>Pontos base</th>
                      <th>Peso</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pl.kpis.map((k) => (
                      <tr key={k.id}>
                        <td>{k.nome}</td>
                        <td style={{ color: k.pontosBase < 0 ? "#ef4444" : "#22c55e" }}>
                          {k.pontosBase > 0 ? "+" : ""}{k.pontosBase}
                        </td>
                        <td>
                          <input
                            type="number"
                            step="0.1"
                            value={k.peso}
                            style={{ width: 60 }}
                            onChange={(e) => atualizarPeso(pl.id, k.id, e.target.value)}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #f0f0f0", display: "flex", gap: 8, alignItems: "center" }}>
                  <input
                    placeholder="Nome do novo KPI"
                    value={novoKpi[pl.id]?.nome || ""}
                    style={{ flex: 2 }}
                    onChange={(e) =>
                      setNovoKpi((prev) => ({ ...prev, [pl.id]: { ...prev[pl.id], nome: e.target.value } }))
                    }
                  />
                  <input
                    type="number"
                    placeholder="Pontos (+/-)"
                    value={novoKpi[pl.id]?.pontosBase || ""}
                    style={{ width: 110 }}
                    onChange={(e) =>
                      setNovoKpi((prev) => ({ ...prev, [pl.id]: { ...prev[pl.id], pontosBase: e.target.value } }))
                    }
                  />
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Peso"
                    value={novoKpi[pl.id]?.peso || "1"}
                    style={{ width: 80 }}
                    onChange={(e) =>
                      setNovoKpi((prev) => ({ ...prev, [pl.id]: { ...prev[pl.id], peso: e.target.value } }))
                    }
                  />
                  <button onClick={() => adicionarKpi(pl.id)}>+ Adicionar KPI</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {aba === "lancamento" && (
          <div>
            <h2>Lançamento Mensal de Pontuação</h2>
            <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
              <select value={lancPrestador} onChange={(e) => setLancPrestador(e.target.value)}>
                {prestadores.map((p) => (
                  <option key={p.id} value={p.id}>{p.nome}</option>
                ))}
              </select>
              <select value={lancMes} onChange={(e) => setLancMes(e.target.value)}>
                {MESES.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            {pilares.map((pl) => (
              <div key={pl.id} style={{ background: "#fff", padding: 16, marginBottom: 16, borderRadius: 8 }}>
                <h4>{pl.nome} — Score do mês: {calcPilarScore(lancPrestador, pl.id, lancMes)}</h4>
                {pl.kpis.map((k) => {
                  const valor = lancamentos[lancPrestador]?.[lancMes]?.[k.id] || 0;
                  return (
                    <div key={k.id} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #f0f0f0" }}>
                      <span>{k.nome} ({k.pontosBase > 0 ? "+" : ""}{k.pontosBase} pts x peso {k.peso})</span>
                      <input
                        type="number"
                        min="0"
                        value={valor}
                        style={{ width: 60 }}
                        onChange={(e) => atualizarLancamento(k.id, e.target.value)}
                      />
                    </div>
                  );
                })}
              </div>
            ))}
            <h3>Pontuação Geral do mês: {calcGeralScore(lancPrestador, lancMes)}</h3>
          </div>
        )}

        {aba === "importar" && (
          <div>
            <h2>Importação em Massa</h2>

            <div style={{ background: "#fff", padding: 16, borderRadius: 8, marginBottom: 16 }}>
              <h3>Opção 1 — Importar de link do Google Sheets (recomendado)</h3>
              <p style={{ color: "#6b7280" }}>
                Publique sua planilha como CSV (veja o passo a passo abaixo) e cole o link gerado aqui.
              </p>
              <div style={{ display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                <select value={csvMes} onChange={(e) => setCsvMes(e.target.value)}>
                  {MESES.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
                <input
                  placeholder="Cole aqui o link publicado da planilha (formato CSV)"
                  value={sheetUrl}
                  onChange={(e) => setSheetUrl(e.target.value)}
                  style={{ flex: 1, minWidth: 250 }}
                />
                <button onClick={importarDeGoogleSheets}>Importar da planilha</button>
              </div>
              <details style={{ marginTop: 8, color: "#6b7280", fontSize: 14 }}>
                <summary style={{ cursor: "pointer" }}>Como gerar esse link?</summary>
                <p>
                  1. Monte sua planilha com as mesmas colunas do modelo (prestador_id, prestador_nome e uma coluna por KPI).<br />
                  2. No Google Sheets, vá em Arquivo, depois Compartilhar, depois Publicar na Web.<br />
                  3. Selecione a aba correta e escolha o formato CSV.<br />
                  4. Clique em Publicar e copie o link gerado para colar aqui.
                </p>
              </details>
            </div>

            <div style={{ background: "#fff", padding: 16, borderRadius: 8, marginBottom: 16 }}>
              <h3>Opção 2 — Colar CSV manualmente</h3>
              <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 8 }}>
                <button onClick={baixarModeloCsv}>Baixar modelo CSV</button>
              </div>
              <textarea
                value={csvTexto}
                onChange={(e) => setCsvTexto(e.target.value)}
                placeholder="Cole aqui o conteúdo do CSV..."
                rows={8}
                style={{ width: "100%", fontFamily: "monospace", padding: 8 }}
              />
              <div style={{ marginTop: 8 }}>
                <button onClick={processarCsv}>Processar importação colada</button>
              </div>
            </div>

            {csvResultado && (
              <div style={{ background: "#fff", padding: 16, borderRadius: 8 }}>
                {csvResultado.carregando && <p>Importando...</p>}
                {csvResultado.erro && <p style={{ color: "#ef4444" }}>{csvResultado.erro}</p>}
                {csvResultado.sucesso && (
                  <>
                    <p style={{ color: "#22c55e" }}>
                      {csvResultado.atualizados} prestador(es) atualizado(s) para o mês {csvResultado.mes}.
                    </p>
                    {csvResultado.naoEncontrados.length > 0 && (
                      <p style={{ color: "#ef4444" }}>
                        IDs não encontrados no cadastro: {csvResultado.naoEncontrados.join(", ")}
                      </p>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {aba === "minhaPontuacao" && (
          <div>
            <h2>Visão do Prestador</h2>
            <select value={prestadorLogado} onChange={(e) => setPrestadorLogado(e.target.value)} style={{ marginBottom: 16 }}>
              {prestadores.map((p) => (
                <option key={p.id} value={p.id}>{p.nome}</option>
              ))}
            </select>
            <div style={{ background: "#fff", padding: 20, borderRadius: 8, marginBottom: 16 }}>
              <h3>Pontuação Geral — {filtroMes}</h3>
              <div style={{ fontSize: 40, fontWeight: "bold", color: barraCor(calcGeralScore(prestadorLogado, filtroMes)) }}>
                {calcGeralScore(prestadorLogado, filtroMes)}
              </div>
              {pilares.map((pl) => {
                const score = calcPilarScore(prestadorLogado, pl.id, filtroMes);
                return (
                  <div key={pl.id} style={{ marginTop: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>{pl.nome}</span>
                      <span>{score}</span>
                    </div>
                    <div style={{ background: "#e5e7eb", borderRadius: 4, height: 10 }}>
                      <div
                        style={{
                          width: `${Math.min(100, Math.max(0, score))}%`,
                          background: barraCor(score),
                          height: 10,
                          borderRadius: 4,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ background: "#fff", padding: 20, borderRadius: 8 }}>
              <h3>Posição no Ranking Anual</h3>
              <p>
                {rankingAnual.findIndex((p) => p.id === prestadorLogado) + 1}º lugar de {prestadores.length} prestadores —
                Pontuação anual: {calcRankingAnual(prestadorLogado)}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}