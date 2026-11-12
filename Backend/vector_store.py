"""
Base de conhecimento vetorial do Sapiens (ChromaDB).

Fluxo de ingestão: PDF -> texto por página -> chunks com sobreposição -> embeddings -> ChromaDB.
"""
import io
import os
import re
from pathlib import Path

import chromadb
import google.generativeai as genai
import PyPDF2
from dotenv import load_dotenv

load_dotenv()
if os.getenv("GEMINI_API_KEY"):
    genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# O banco fica ao lado deste arquivo, independente de onde o uvicorn foi iniciado.
CHROMA_PATH = os.getenv("CHROMA_PATH", str(Path(__file__).parent / "chroma_db_store"))
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "models/text-embedding-004")

CHUNK_SIZE = 1000      # caracteres por chunk
CHUNK_OVERLAP = 200    # sobreposição entre chunks vizinhos

client = chromadb.PersistentClient(path=CHROMA_PATH)
collection = client.get_or_create_collection(
    name="documentos_sapiens",
    metadata={"hnsw:space": "cosine"},
)


def gerar_embedding(texto: str, task_type: str = "retrieval_document") -> list[float]:
    """Gera o vetor (embedding) para um pedaço de texto."""
    result = genai.embed_content(model=EMBEDDING_MODEL, content=texto, task_type=task_type)
    return result["embedding"]


def dividir_em_chunks(texto: str, tamanho: int = CHUNK_SIZE, sobreposicao: int = CHUNK_OVERLAP) -> list[str]:
    """
    Divide o texto em janelas de ~`tamanho` caracteres com sobreposição,
    tentando cortar em fim de frase/linha para não partir ideias no meio.
    """
    texto = re.sub(r"[ \t]+", " ", texto).strip()
    if not texto:
        return []

    chunks = []
    inicio = 0
    while inicio < len(texto):
        fim = min(inicio + tamanho, len(texto))
        if fim < len(texto):
            # procura o melhor ponto de corte na segunda metade da janela
            corte = max(texto.rfind(sep, inicio + tamanho // 2, fim) for sep in ("\n", ". ", "; "))
            if corte != -1:
                fim = corte + 1
        chunk = texto[inicio:fim].strip()
        if chunk:
            chunks.append(chunk)
        if fim >= len(texto):
            break
        inicio = max(fim - sobreposicao, inicio + 1)
    return chunks


def adicionar_documento_ao_banco(arquivo_bytes: bytes, filename: str) -> dict:
    """
    Ingestão de um PDF. Se o arquivo já existir no banco, as partes antigas
    são substituídas (reenviar o mesmo PDF atualiza em vez de dar erro).
    Retorna {"arquivo", "paginas", "chunks"}. Lança ValueError se não houver texto.
    """
    leitor_pdf = PyPDF2.PdfReader(io.BytesIO(arquivo_bytes))

    ids, documentos, metadatas = [], [], []
    for num_pagina, pagina in enumerate(leitor_pdf.pages, start=1):
        texto_pagina = pagina.extract_text() or ""
        for i, chunk in enumerate(dividir_em_chunks(texto_pagina)):
            ids.append(f"{filename}::p{num_pagina}::c{i}")
            documentos.append(chunk)
            metadatas.append({"source_file": filename, "page": num_pagina, "chunk_index": i})

    if not documentos:
        raise ValueError(
            "Não foi possível extrair texto do PDF. Ele pode ser escaneado (só imagem) — "
            "nesse caso é preciso OCR antes de alimentar a base."
        )

    # Remove versões anteriores do mesmo arquivo antes de inserir.
    collection.delete(where={"source_file": filename})

    embeddings = [gerar_embedding(doc) for doc in documentos]
    collection.upsert(ids=ids, documents=documentos, embeddings=embeddings, metadatas=metadatas)

    print(f"Ingestão concluída: '{filename}' -> {len(documentos)} chunks em {len(leitor_pdf.pages)} páginas.")
    return {"arquivo": filename, "paginas": len(leitor_pdf.pages), "chunks": len(documentos)}


def consultar_banco_de_dados(texto_pergunta: str, n_results: int = 4) -> list[dict]:
    """
    Busca os chunks mais relevantes para a pergunta.
    Retorna lista de {"texto", "arquivo", "pagina", "distancia"}.
    """
    if collection.count() == 0:
        return []
    try:
        embedding_pergunta = gerar_embedding(texto_pergunta, task_type="retrieval_query")
        results = collection.query(
            query_embeddings=[embedding_pergunta],
            n_results=min(n_results, collection.count()),
        )
    except Exception as e:
        print(f"Erro ao consultar ChromaDB: {e}")
        return []

    return [
        {
            "texto": doc,
            "arquivo": meta.get("source_file"),
            "pagina": meta.get("page"),
            "distancia": dist,
        }
        for doc, meta, dist in zip(
            results["documents"][0], results["metadatas"][0], results["distances"][0]
        )
    ]


def listar_documentos() -> list[dict]:
    """Lista os arquivos presentes na base com a quantidade de chunks de cada um."""
    dados = collection.get(include=["metadatas"])
    contagem: dict[str, int] = {}
    for meta in dados["metadatas"]:
        nome = meta.get("source_file", "?")
        contagem[nome] = contagem.get(nome, 0) + 1
    return [{"arquivo": nome, "chunks": n} for nome, n in sorted(contagem.items())]


def remover_documento(filename: str) -> None:
    collection.delete(where={"source_file": filename})
