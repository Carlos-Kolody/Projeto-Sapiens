# main.py
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import gemini_service # <-- Garanta que esta linha de importação existe

# --- Configuração do Servidor Web ---
app = FastAPI(
    title="Projeto Sapiens API",
    description="API para conectar o frontend com a IA do Gemini.",
    version="1.0.0"
)

# Configuração do CORS para permitir a comunicação com o frontend
origins = [
    "http://127.0.0.1:5500", 
    "http://localhost:5500",
    # Adicione outras origens se necessário
] 
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins, 
    allow_credentials=True, 
    allow_methods=["*"], 
    allow_headers=["*"],
)
# ------------------------------------

# Endpoint de teste para verificar se a API está no ar
@app.get("/")
def read_root():
    return {"status": "API do Projeto Sapiens está online!"}


# --- ESTE É O ENDPOINT QUE ESTAVA FALTANDO OU COM ERRO ---
# Verifique se o seu código tem EXATAMENTE esta parte
# Dentro do arquivo: main.py

# ... (todo o resto do código continua igual) ...

# Dentro de main.py
@app.post("/analisar")
async def analisar_documento(
    pergunta: str = Form(...),
    arquivo: UploadFile = File(...)
):
    try:
        conteudo_arquivo_bytes = await arquivo.read()
        
        # A linha mais importante: passando o 'arquivo.filename'
        resultado = gemini_service.analisar_com_gemini(
            pergunta=pergunta,
            arquivo_bytes=conteudo_arquivo_bytes,
            mime_type=arquivo.content_type,
            filename=arquivo.filename # <--- Esta parte precisa estar aqui
        )

        return JSONResponse(content={"resposta": resultado})

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ocorreu um erro interno no servidor: {e}")