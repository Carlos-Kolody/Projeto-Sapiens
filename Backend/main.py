from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import gemini_service
from typing import Optional

app = FastAPI(
    title="Projeto Sapiens API",
    description="API para conectar o frontend com a IA do Gemini.",
    version="1.0.0"
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

@app.get("/")
def read_root():
    return {"status": "API do Projeto Sapiens está online!"}

@app.post("/analisar")
async def analisar_documento(
    pergunta: str = Form(...),
    
    arquivo: Optional[UploadFile] = File(None) 
):
    """
    Recebe uma pergunta e, opcionalmente, um arquivo. Delega para o serviço do Gemini.
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
