# Projeto Sapiens: Assistente de Conhecimento com IA Multimodal

![Status](https://img.shields.io/badge/status-em--desenvolvimento-yellow)
![Python](https://img.shields.io/badge/Python-3.9%2B-blue?logo=python)
![Framework](https://img.shields.io/badge/Framework-FastAPI-green?logo=fastapi)
![Frontend](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61dafb?logo=react)

Sapiens é um protótipo de um assistente virtual inteligente, projetado para resolver o problema de perda de conhecimento em ambientes corporativos. A aplicação centraliza documentos internos (texto e desenhos técnicos) e permite que os usuários façam perguntas em linguagem natural, recebendo respostas precisas e contextuais geradas por uma IA multimodal de ponta.

![Demonstração do Sapiens em Ação](caminho/para/seu/gif.gif)

## ✨ Funcionalidades Principais

* **Interface de ferramenta técnica:** conversas à esquerda, chat no centro e painel da base de conhecimento à direita, com tema claro/escuro e layout responsivo.
* **Base de Conhecimento (RAG):** PDFs adicionados pelo painel da base (arraste e solte; perfil Administrativo) são divididos em trechos, vetorizados e guardados no ChromaDB. Perguntas sem anexo são respondidas com base neles, **citando arquivo e página** — clicar numa fonte mostra o trecho usado.
* **Análise Pontual de Documentos:** anexe um `.pdf` só para uma pergunta, sem salvá-lo na base.
* **Interpretação de Desenhos Técnicos:** análise multimodal de imagens de blueprints e plantas (`.jpg`, `.png`, `.webp`).

## 🛠️ Tecnologias Utilizadas

| Categoria | Tecnologia |
| :--- | :--- |
| **Inteligência Artificial** | Google Gemini API (`gemini-pro-latest`) |
| **Backend** | Python 3.9+, FastAPI, Uvicorn |
| **Frontend** | React 19, TypeScript, Vite, react-markdown, lucide-react |
| **Banco Vetorial** | ChromaDB (persistido em `Backend/chroma_db_store/`) |
| **Bibliotecas Principais**| `google-generativeai`, `python-dotenv`, `PyPDF2`, `Pillow` |

## 🚀 Como Executar o Projeto

Siga os passos abaixo para rodar o Sapiens na sua máquina local.

#### **Pré-requisitos**
* [Python 3.9+](https://www.python.org/downloads/)
* [Node.js 20+](https://nodejs.org/)
* [Git](https://git-scm.com/)

#### **1. Clone o Repositório**
```bash
git clone https://github.com/Carlos-Kolody/Projeto-Sapiens
cd Projeto-Sapiens
```

#### **2. Configure e Inicie o Backend**
```bash
# Navegue até a pasta do backend
cd Backend

# Crie e ative o ambiente virtual
python -m venv venv

# No Windows:
.\venv\Scripts\activate
# No Mac/Linux:
source venv/bin/activate

# Instale todas as dependências necessárias
pip install -r requirements.txt
```

#### **3. Configure a Chave de API**
* Ainda na pasta `Backend`, copie o arquivo `.env.example` para `.env`.
* Preencha a sua chave da API do Gemini (as outras variáveis são opcionais):
    ```
    GEMINI_API_KEY="SUA_CHAVE_API"
    ```

#### **4. Inicie o Servidor Backend**
* No mesmo terminal (com o `venv` ativo), execute:
    ```bash
    uvicorn main:app --reload
    ```
* O servidor estará rodando em `http://127.0.0.1:8000`. Deixe este terminal aberto.

#### **5. Inicie o Frontend**
Em **outro terminal**:
```bash
cd Frontend
npm install
npm run dev
```
* Abra `http://localhost:5173` no navegador.
* Se o backend estiver em outro endereço, copie `Frontend/.env.example` para `Frontend/.env` e ajuste `VITE_API_URL`.

## Uso

1.  Faça login com um dos usuários de teste, escolhendo o perfil correspondente: **Operacional** → `usuario@sapiens.dev`, **Administrativo** → `admin@sapiens.dev` (senha `123456` para os dois).
2.  **Para alimentar a base (Administrativo):** arraste PDFs para o painel da direita. Depois, é só perguntar, sem anexar nada.
3.  **Para uma pergunta pontual:** clique no clipe, anexe um `.pdf` ou imagem e faça a pergunta.

### Endpoints da API

| Método | Rota | Descrição |
| :--- | :--- | :--- |
| `POST` | `/login` | Login (usuários de teste, ainda sem token) |
| `POST` | `/analisar` | Pergunta, com arquivo opcional. Retorna `resposta` e `fontes` |
| `POST` | `/alimentar-ia` | Adiciona/atualiza um PDF na base de conhecimento |
| `GET` | `/documentos` | Lista os documentos da base |
| `DELETE` | `/documentos/{arquivo}` | Remove um documento da base |

A documentação interativa fica em `http://127.0.0.1:8000/docs`.

## 📂 Estrutura do Projeto

```
/Projeto-Sapiens/
|-- Backend/
|   |-- main.py             # API FastAPI (rotas)
|   |-- gemini_service.py   # Lógica da IA (modo documento e modo RAG)
|   |-- vector_store.py     # Ingestão e busca no ChromaDB
|   |-- teste_direto.py     # Lista os modelos disponíveis na sua chave
|   |-- requirements.txt
|   `-- .env.example
`-- Frontend/               # React + TypeScript + Vite
    |-- public/             # logo, ícones, manifest
    |-- src/
    |   |-- api.ts          # chamadas ao backend
    |   |-- storage.ts      # sessão, tema e conversas (localStorage)
    |   |-- App.tsx
    |   `-- components/     # LoginScreen, Workspace, Sidebar, ChatView, KnowledgePanel
    |-- package.json
    `-- .env.example
```

## 🔮 Melhorias Futuras

- [x] Base de conhecimento com banco vetorial (ChromaDB) e citação de fontes.
- [x] Novo frontend em React + TypeScript com painel da base e fontes clicáveis.
- [ ] Autenticação real (usuários no banco, senha com hash, JWT); hoje a restrição do perfil Operacional é só na interface.
- [ ] Histórico de conversas no servidor (hoje fica no `localStorage`).
- [ ] Suporte a `.docx` e `.txt` na base de conhecimento.
- [ ] OCR para PDFs escaneados.
- [ ] Migrar do SDK `google-generativeai` (descontinuado) para `google-genai`.
- [ ] Testes automatizados e avaliação da qualidade das respostas do RAG.
- [ ] Docker e deploy em nuvem (ex.: Google Cloud Run).

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.
