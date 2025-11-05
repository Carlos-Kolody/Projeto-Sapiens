from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import gemini_service
import vector_store

app = FastAPI(
    title="Projeto Sapiens API",
    description="API para conectar o frontend com a IA do Gemini, realizar autenticação e gerenciar a base de conhecimento vetorial.",
    version="1.1.0"
)

origins = [
    "http://127.0.0.1:5500",
    "http://localhost:5500",
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

VALID_CREDENTIALS = {
    "premium": {
        "email": "administrativo@tecnotooling.com.br",
        "password": "123456"
    },
    "standard": {
        "email": "operacional@tecnotooling.com.br",
        "password": "123456"
    }
}

@app.get("/")
def read_root():
    return {"status": "API do Projeto Sapiens está online!"}

@app.post("/login")
def login_handler(credentials: LoginCredentials):
    valid_user = VALID_CREDENTIALS.get(credentials.accessLevel)
    if valid_user and valid_user["email"] == credentials.email and valid_user["password"] == credentials.password:
        return JSONResponse(
            content={"message": "Login bem-sucedido!"},
            status_code=200
        )
    else:
        raise HTTPException(
            status_code=401,
            detail="Credenciais inválidas. Verifique seu e-mail e senha."
        )

@app.post("/analisar")
async def analisar_documento(
    pergunta: str = Form(...),
    arquivo: Optional[UploadFile] = File(None)
):
    """
    Recebe uma pergunta e, opcionalmente, um arquivo. Delega para o serviço do Gemini.
    Se nenhum arquivo for enviado, consultará a base de conhecimento (ChromaDB).
    """
    try:
        conteudo_arquivo_bytes = await arquivo.read() if arquivo else None
        nome_do_arquivo = arquivo.filename if arquivo else None
        tipo_do_arquivo = arquivo.content_type if arquivo else None

        resultado = gemini_service.analisar_com_gemini(
            pergunta=pergunta,
            arquivo_bytes=conteudo_arquivo_bytes,
            filename=nome_do_arquivo,
            mime_type=tipo_do_arquivo
        )

        return JSONResponse(content={"resposta": resultado})

    except Exception as e:
            raise HTTPException(status_code=500, detail=f"Ocorreu um erro interno no servidor: {e}")

@app.post("/alimentar-ia")
async def alimentar_ia_com_documento(
    arquivo: UploadFile = File(...)
):
    """
    Recebe um documento PDF e o envia para o ChromaDB para ser aprendido (vetorizado).
    """

    if not arquivo.filename.lower().endswith('.pdf'):
         raise HTTPException(status_code=400, detail="Formato de arquivo inválido. Apenas PDFs são aceitos para alimentar a IA.")

    try:
        conteudo_arquivo_bytes = await arquivo.read()

        resultado = vector_store.adicionar_documento_ao_banco(
            arquivo_bytes=conteudo_arquivo_bytes,
            filename=arquivo.filename
        )

        if "Erro" in resultado:
             raise HTTPException(status_code=500, detail=resultado)
        else:
            return JSONResponse(content={"status": "sucesso", "mensagem": resultado})

    except HTTPException as http_exc:
        
        raise http_exc
    except Exception as e:
        
        raise HTTPException(status_code=500, detail=f"Ocorreu um erro interno durante a alimentação: {e}")