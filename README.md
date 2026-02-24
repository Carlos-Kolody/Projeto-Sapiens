# Projeto Sapiens: Assistente de Conhecimento com IA Multimodal

![Status](https://img.shields.io/badge/status-em--desenvolvimento-yellow)
![Python](https://img.shields.io/badge/Python-3.9%2B-blue?logo=python)
![Framework](https://img.shields.io/badge/Framework-FastAPI-green?logo=fastapi)
![Frontend](https://img.shields.io/badge/Frontend-HTML%2FCSS%2FJS-orange)

Sapiens é um protótipo de um assistente virtual inteligente, projetado para resolver o problema de perda de conhecimento em ambientes corporativos. A aplicação centraliza documentos internos (texto e desenhos técnicos) e permite que os usuários façam perguntas em linguagem natural, recebendo respostas precisas e contextuais geradas por uma IA multimodal de ponta.

![Demonstração do Sapiens em Ação](caminho/para/seu/gif.gif)

## ✨ Funcionalidades Principais

* **Interface de Chat Interativa:** Uma interface limpa e responsiva para dialogar com a IA.
* **Análise de Documentos de Texto:** Capacidade de fazer upload de arquivos `.pdf`, extrair seu conteúdo e responder perguntas específicas sobre eles.
* **Interpretação de Desenhos Técnicos:** Funcionalidade multimodal que permite analisar imagens de blueprints ou plantas baixas (`.jpg`, `.png`).
* **Comunicação em Linguagem Natural:** Interação intuitiva, sem a necessidade de comandos complexos.

## 🛠️ Tecnologias Utilizadas

| Categoria | Tecnologia |
| :--- | :--- |
| **Inteligência Artificial** | Google Gemini API (`gemini-pro-latest`) |
| **Backend** | Python 3.9+, FastAPI, Uvicorn |
| **Frontend** | HTML5, CSS3, JavaScript |
| **Bibliotecas Principais**| `google-generativeai`, `python-dotenv`, `PyPDF2`, `Pillow`, `marked.js` |

## 🚀 Como Executar o Projeto

Siga os passos abaixo para rodar o Sapiens na sua máquina local.

#### **Pré-requisitos**
* [Python 3.9+](https://www.python.org/downloads/)
* [Git](https://git-scm.com/)

#### **1. Clone o Repositório**
```bash
git clone [https://github.com/Carlos-Kolody/Projeto-Sapiens]
cd projeto-sapiens
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
* Ainda na pasta `Backend`, crie um arquivo chamado `.env`.
* Dentro dele, adicione sua chave da API do Gemini no seguinte formato:
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
* Abra uma **nova janela do terminal** ou use o seu editor de código (como o VS Code com a extensão "Live Server").
* Abra o arquivo `index.html` que está na pasta `Frontend/src` com o Live Server.
* Seu navegador abrirá no endereço `http://127.0.0.1:5500` (ou similar).

## Uso

1.  Com o frontend aberto no navegador e o backend rodando, clique no ícone de clipe para anexar um arquivo (`.pdf`, `.png` ou `.jpg`).
2.  Digite sua pergunta sobre o arquivo na caixa de texto.
3.  Clique no botão de enviar e aguarde a resposta da IA.

## 📂 Estrutura do Projeto

```
/projeto-sapiens/
|
|-- .gitignore
|-- README.md
|
|-- /Backend/
|   |-- venv/
|   |-- .env
|   |-- main.py           # Servidor FastAPI (o "Gerente")
|   |-- gemini_service.py   # Lógica da IA (o "Especialista")
|   `-- requirements.txt  # Lista de dependências do backend
|
`-- /Frontend/
    `-- /src/
        |-- /assets/
        |-- /css/
        |   `-- style.css
        |-- /js/
        |   `-- script.js
        `-- index.html
```

## 🔮 Melhorias Futuras

- [x] Implementar sistema de login e autenticação de usuários.
- [x] Salvar o histórico de conversas em um banco de dados.
- [x] Suporte a mais formatos de arquivo (ex: `.docx`, `.txt`).
- [x] "Aterramento" em múltiplos documentos simultaneamente com um banco de dados vetorial (ex: ChromaDB, FAISS).
- [ ] Deploy da aplicação em um serviço de nuvem (ex: Google Cloud Run, Vercel).

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.
