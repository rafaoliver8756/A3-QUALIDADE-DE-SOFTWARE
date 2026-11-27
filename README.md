<div align="center">

# EquipCheck Mini

**Registro de equipamentos e inspeções da MegaCore Labs, com rastreabilidade de versões e histórico.**

![MySQL](https://img.shields.io/badge/MySQL-8.0.16%2B-4479A1?logo=mysql&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-JavaScript-339933?logo=node.js&logoColor=white)
![React](https://img.shields.io/badge/React-interface-61DAFB?logo=react&logoColor=black)

*Projeto A3 integrado: Bancos de Dados e Garantia da Qualidade de Software · UNA Betim · Cenário 5 MegaCore Labs*

</div>

---

## 👥 Equipe

- Kauan Gabriel
- Rafaela Oliveira
- Eric Braga
- Thays Durães
- Lucas

## 🎬 Vídeo pitch

Consulte `video/link-do-pitch.md`.

## 🏭 Contexto

A MegaCore Labs, de Campinas, desenvolve software embarcado e aplicações de configuração para equipamentos médicos e industriais. Em um teste interno, uma combinação de versões mostrou um equipamento como apto apesar de existir uma condição de bloqueio. O EquipCheck Mini registra equipamentos e inspeções com rastreabilidade completa, garantindo que as regras de classificação e histórico sejam aplicadas no próprio banco.

## ✅ Requisitos funcionais

| ID | Requisito |
|---|---|
| RF01 | Cadastrar equipamento com identificador único e versões de firmware e software obrigatórias. |
| RF02 | Registrar uma medição numérica em inspeção, usando a faixa didática de 10 a 20, incluindo os extremos. |
| RF03 | Classificar como Bloqueado se a medição estiver fora da faixa; dentro dela, classificar como Apto. |
| RF04 | Permitir que um equipamento Bloqueado volte a Apto somente após nova inspeção aprovada. |
| RF05 | Exigir responsável e justificativa para alteração de versão ou de dados da inspeção. |
| RF06 | Preservar o histórico de inspeções e mudanças, incluindo as versões de firmware e software associadas a cada registro. |

## 📁 Estrutura do repositório

```
.
├── README.md
├── docs/                          # Documentação — Banco de Dados
│   ├── escopo.md
│   ├── funcionalidades.md
│   ├── requisitos.md
│   ├── caso-de-uso.md
│   ├── caso-de-uso.png
│   ├── der.md
│   ├── der.png
│   ├── modelo-relacional.md
│   ├── modelo-relacional.png
│   ├── normalizacao.md
│   └── dicionario-de-dados.md     # Bônus de inovação
├── sql/                           # Scripts MySQL (executar em ordem)
│   ├── 01-create-database.sql
│   ├── 02-create-tables.sql
│   ├── 03-triggers-views.sql
│   ├── 04-inserts.sql
│   ├── 05-queries.sql
│   └── 06-testes-regras.sql
├── qualidade-de-software/         # Documentação — Garantia da Qualidade
│   ├── diagnostico.md
│   ├── as-is.md
│   ├── as-is-bpmn.png
│   ├── maturidade.md
│   └── plano-de-testes.md
├── backend/                       # API Node.js (complemento opcional)
│   ├── server.js
│   └── package.json
├── frontend/                      # Interface React + Vite (complemento opcional)
│   ├── src/
│   │   ├── App.jsx
│   │   ├── components/
│   │   └── services/
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
└── video/
    └── link-do-pitch.md
```

## 🗄️ Como executar o banco

Requer **MySQL 8.0.16 ou superior**. Execute os scripts em ordem:

```bash
mysql -u root -p < sql/01-create-database.sql
mysql -u root -p < sql/02-create-tables.sql
mysql -u root -p < sql/03-triggers-views.sql
mysql -u root -p < sql/04-inserts.sql
mysql -u root -p < sql/05-queries.sql
mysql -u root -p < sql/06-testes-regras.sql
```

No MySQL Workbench, abra cada arquivo e execute o script inteiro, na mesma ordem.

| Script | Conteúdo |
|---|---|
| `01-create-database.sql` | Criação do banco `equipcheck` |
| `02-create-tables.sql` | Tabelas, chaves primárias e estrangeiras, CHECK |
| `03-triggers-views.sql` | Triggers (RF04, RF05, RF06) e view de status atual |
| `04-inserts.sql` | Dados de exemplo (5 equipamentos, inspeções, correções e mudanças de versão) |
| `05-queries.sql` | 12 consultas de demonstração |
| `06-testes-regras.sql` | Testes automatizados das regras RF01 a RF06 (desfaz tudo com ROLLBACK) |

## 🖥️ Como executar a aplicação (complemento opcional)

A aplicação demonstra o uso do banco por uma API REST. O banco de dados é o núcleo avaliado; a aplicação é complementar.

**Terminal 1 — Backend (porta 3000):**
```bash
cd backend
node server.js
```

**Terminal 2 — Frontend (porta 5173):**
```bash
cd frontend
npm install
npm run dev
```

Abra `http://localhost:5173` no navegador.

> **Nota:** o backend de teste guarda os dados em memória (sem MySQL). Para usar o banco real, seria necessário conectar o `server.js` ao MySQL — isso não foi implementado nesta versão.

## 🧱 Modelo de dados

| Tabela | Função |
|---|---|
| `equipamento` | Equipamento (EQP-001), versões atuais e status (Apto/Bloqueado) |
| `inspecao` | Medição, classificação automática, aprovação, responsável e versões vigentes na data |
| `historico_equipamento` | Toda mudança de versão, com responsável e justificativa |
| `historico_inspecao` | Toda correção de dados de inspeção, com responsável e justificativa |
| `v_status_atual_equipamento` (view) | Situação atual de cada equipamento com a última inspeção |

Diagramas: `docs/caso-de-uso.png`, `docs/der.png` e `docs/modelo-relacional.png`.

## 📚 Documentação completa

| Entregável | Arquivo |
|---|---|
| Escopo do projeto | `docs/escopo.md` |
| Lista de funcionalidades | `docs/funcionalidades.md` |
| Levantamento de requisitos | `docs/requisitos.md` |
| Diagrama de caso de uso | `docs/caso-de-uso.md` + `docs/caso-de-uso.png` |
| DER conceitual | `docs/der.md` + `docs/der.png` |
| Modelo relacional em 3FN | `docs/modelo-relacional.md` + `docs/modelo-relacional.png` |
| Normalização e justificativas | `docs/normalizacao.md` |
| Dicionário de dados (bônus) | `docs/dicionario-de-dados.md` |

## 🧪 Garantia da Qualidade de Software

| Etapa | Entregável | Arquivo |
|:---:|---|---|
| 1 | Diagnóstico e problemas prioritários | `qualidade-de-software/diagnostico.md` |
| 1 | AS-IS em BPMN | `qualidade-de-software/as-is.md` + `qualidade-de-software/as-is-bpmn.png` |
| 1 | Maturidade inicial com relação a MPS.BR e CMMI | `qualidade-de-software/maturidade.md` |
| 2 | Plano de testes, riscos e casos de teste | `qualidade-de-software/plano-de-testes.md` |

## 🛠️ Tecnologias

- **Banco de dados:** MySQL 8.0.16+
- **Back-end:** JavaScript (Node.js), sem dependências externas
- **Interface:** React + Vite
