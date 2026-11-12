import os

from dotenv import load_dotenv
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional

import gemini_service
import vector_store
from gemini_service import SapiensError

load_dotenv()

app = FastAPI(
    title="Projeto Sapiens API",
    description="API do Sapiens: chat com IA (Gemini), autenticação e base de conhecimento vetorial (ChromaDB).",
    version="1.2.0",
)

# Origens permitidas separadas por vírgula no .env (CORS_ORIGINS). Padrão: Live Server do VS Code.
origins = [
    o.strip()
    for o in os.getenv("CORS_ORIGINS", "http://127.0.0.1:5500,http://localhost:5500").split(",")
    if o.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class LoginCredentials(BaseModel):
    email: str
    password: str
    accessLevel: str


# TODO: substituir por usuários no banco + senha com hash + JWT (próxima etapa).
VALID_CREDENTIALS = {
    "premium": {"email": "admin@sapiens.dev", "password": "123456"},
    "standard": {"email": "usuario@sapiens.dev", "password": "123456"},
}


@app.get("/")
def read_root():
    return {"status": "API do Projeto Sapiens está online!", "documentos_na_base": vector_store.collection.count()}


@app.post("/login")
def login_handler(credentials: LoginCredentials):
    valid_user = VALID_CREDENTIALS.get(credentials.accessLevel)
    if valid_user and valid_user["email"] == credentials.email and valid_user["password"] == credentials.password:
        return {"message": "Login bem-sucedido!", "accessLevel": credentials.accessLevel}
    raise HTTPException(status_code=401, detail="Credenciais inválidas. Verifique seu e-mail e senha.")


@app.post("/analisar")
async def analisar_documento(
    pergunta: str = Form(...),
    arquivo: Optional[UploadFile] = File(None),
):
    """
    Com arquivo: analisa só aquele arquivo (não salva na base).
    Sem arquivo: responde usando a base de conhecimento (RAG) e devolve as fontes usadas.
    """
    conteudo = await arquivo.read() if arquivo and arquivo.filename else None
    nome = arquivo.filename if conteudo else None

    try:
        return gemini_service.analisar_com_gemini(pergunta=pergunta, arquivo_bytes=conteudo, filename=nome)
    except SapiensError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"Erro em /analisar: {e!r}")
        raise HTTPException(status_code=500, detail=f"Erro ao processar a solicitação com a IA: {e}")


@app.post("/alimentar-ia")
async def alimentar_ia_com_documento(arquivo: UploadFile = File(...)):
    """Recebe um PDF e o adiciona (ou atualiza) na base de conhecimento."""
    if not arquivo.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Apenas PDFs são aceitos para alimentar a base.")

    conteudo = await arquivo.read()
    try:
        resultado = vector_store.adicionar_documento_ao_banco(conteudo, arquivo.filename)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        print(f"Erro em /alimentar-ia: {e!r}")
        raise HTTPException(status_code=500, detail=f"Erro durante a ingestão do documento: {e}")

    return {
        "status": "sucesso",
        "mensagem": f"'{resultado['arquivo']}' aprendido: {resultado['chunks']} trechos de {resultado['paginas']} páginas.",
        **resultado,
    }


@app.get("/documentos")
def listar_documentos():
    """Lista os documentos que estão na base de conhecimento."""
    return {"documentos": vector_store.listar_documentos()}


@app.delete("/documentos/{filename}")
def remover_documento(filename: str):
    vector_store.remover_documento(filename)
    return {"status": "removido", "arquivo": filename}
