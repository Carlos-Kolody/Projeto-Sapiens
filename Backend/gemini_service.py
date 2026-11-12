"""
Lógica de IA do Sapiens.

Dois modos:
1. Modo Documento: arquivo anexado junto com a pergunta (análise pontual, não salva na base).
2. Modo Conversa (RAG): só a pergunta -> busca contexto no ChromaDB e responde citando as fontes.
"""
import io
import os
from typing import Optional

import google.generativeai as genai
import PyPDF2
from dotenv import load_dotenv
from PIL import Image

import vector_store

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")
if api_key:
    genai.configure(api_key=api_key)
else:
    print("AVISO: GEMINI_API_KEY não encontrada no arquivo .env")

TEXT_MODEL = os.getenv("GEMINI_TEXT_MODEL", "gemini-pro-latest")
VISION_MODEL = os.getenv("GEMINI_VISION_MODEL", "gemini-flash-latest")

EXTENSOES_IMAGEM = (".png", ".jpg", ".jpeg", ".webp")


class SapiensError(Exception):
    """Erro esperado (entrada inválida, configuração faltando) com mensagem amigável."""


def _extrair_texto_pdf(arquivo_bytes: bytes) -> str:
    leitor = PyPDF2.PdfReader(io.BytesIO(arquivo_bytes))
    return "\n".join(
        f"[Página {i}]\n{pagina.extract_text() or ''}" for i, pagina in enumerate(leitor.pages, start=1)
    )


def _analisar_arquivo(pergunta: str, arquivo_bytes: bytes, filename: str) -> dict:
    nome = filename.lower()

    if nome.endswith(EXTENSOES_IMAGEM):
        imagem = Image.open(io.BytesIO(arquivo_bytes))
        prompt = (
            "Você é Sapiens, um assistente técnico. Analise a imagem "
            "(pode ser um desenho técnico, planta ou foto de peça) e responda à pergunta. "
            "Se citar cotas, tolerâncias ou materiais, diga exatamente onde aparecem no desenho. "
            "Se algo não estiver legível, diga isso em vez de supor.\n\n"
            f"PERGUNTA: {pergunta}"
        )
        response = genai.GenerativeModel(VISION_MODEL).generate_content([prompt, imagem])
        return {"resposta": response.text, "fontes": [{"arquivo": filename}]}

    if nome.endswith(".pdf"):
        texto = _extrair_texto_pdf(arquivo_bytes)
        prompt = f"""
Analise o documento a seguir e responda à pergunta do usuário com base nele.
Não adicione informações que não estejam no documento. Quando possível, indique a página.

DOCUMENTO ({filename}):
---
{texto}
---

PERGUNTA DO USUÁRIO: {pergunta}
"""
        response = genai.GenerativeModel(TEXT_MODEL).generate_content(prompt)
        return {"resposta": response.text, "fontes": [{"arquivo": filename}]}

    raise SapiensError(
        f"Formato de '{filename}' não suportado para análise direta. Envie PDF ou imagem (PNG/JPG/WEBP)."
    )


def _responder_com_base(pergunta: str) -> dict:
    trechos = vector_store.consultar_banco_de_dados(pergunta)

    if not trechos:
        contexto = "Nenhum trecho relevante foi encontrado na base de conhecimento."
    else:
        contexto = "\n\n".join(
            f"[Fonte {i}: {t['arquivo']}, p. {t['pagina']}]\n{t['texto']}" for i, t in enumerate(trechos, start=1)
        )

    prompt = f"""
Você é Sapiens, um assistente de conhecimento prestativo.
Responda à pergunta do usuário usando EXCLUSIVAMENTE o contexto abaixo, extraído da base de conhecimento.
Ao usar uma informação, cite a fonte no formato [Fonte N].
Se o contexto não for suficiente, diga educadamente que não encontrou essa informação nos documentos disponíveis.
Não invente respostas.

CONTEXTO:
---
{contexto}
---

PERGUNTA DO USUÁRIO: {pergunta}

RESPOSTA:
"""
    response = genai.GenerativeModel(TEXT_MODEL).generate_content(prompt)
    fontes = [{"arquivo": t["arquivo"], "pagina": t["pagina"], "trecho": t["texto"][:600]} for t in trechos]
    return {"resposta": response.text, "fontes": fontes}


def analisar_com_gemini(
    pergunta: str,
    arquivo_bytes: Optional[bytes] = None,
    filename: Optional[str] = None,
) -> dict:
    """Ponto de entrada usado pela API. Retorna {"resposta": str, "fontes": list}."""
    if not api_key:
        raise SapiensError("A chave da API do Gemini não foi configurada no .env do Backend.")

    if filename and arquivo_bytes:
        return _analisar_arquivo(pergunta, arquivo_bytes, filename)
    return _responder_com_base(pergunta)
