import chromadb
import google.generativeai as genai
import PyPDF2
import io

client = chromadb.PersistentClient(path="./chroma_db_store")

collection = client.get_or_create_collection(name="documentos_sapiens")

embedding_model = "models/text-embedding-004" 

def gerar_embedding(texto: str):
    """Gera o vetor (embedding) para um pedaço de texto."""
    result = genai.embed_content(model=embedding_model, content=texto)
    return result['embedding']

def adicionar_documento_ao_banco(arquivo_bytes: bytes, filename: str):
    """
    Processo de "Ingestão": Extrai, divide, gera embeddings e salva no ChromaDB.
    """
    print(f"Iniciando ingestão do arquivo: {filename}")
    
    texto_completo = ""
    try:
        leitor_pdf = PyPDF2.PdfReader(io.BytesIO(arquivo_bytes))
        for i, pagina in enumerate(leitor_pdf.pages):
            texto_completo += pagina.extract_text() or f"\n[Página {i+1}]\n"
    except Exception as e:
        return f"Erro ao ler o PDF: {e}"

    
    chunks = texto_completo.split("\n\n")
    chunks = [chunk for chunk in chunks if chunk.strip()] 
    if not chunks:
        return "Erro: Não foi possível extrair texto do documento."

        ids = []
    documentos = []
    embeddings = []
    metadatas = []

    for i, chunk in enumerate(chunks):
        ids.append(f"{filename}_chunk_{i}")
        documentos.append(chunk)
        
        embeddings.append(gerar_embedding(chunk)) 
        
        metadatas.append({"source_file": filename, "chunk_index": i})

    try:
        collection.add(
            embeddings=embeddings,
            documents=documentos,
            metadatas=metadatas,
            ids=ids
        )
        print(f"Sucesso! {len(chunks)} pedaços de '{filename}' adicionados ao banco.")
        return f"Documento '{filename}' aprendido com sucesso e dividido em {len(chunks)} partes."
    except Exception as e:
        return f"Erro ao salvar no ChromaDB: {e}"

def consultar_banco_de_dados(texto_pergunta: str, n_results=3):
    """
    Consulta o ChromaDB para encontrar os pedaços de texto mais relevantes
    para uma pergunta.
    """
    try:
       
        embedding_pergunta = gerar_embedding(texto_pergunta)
       
        results = collection.query(
            query_embeddings=[embedding_pergunta],
            n_results=n_results
        )
        
        return results['documents'][0] 
    except Exception as e:
        print(f"Erro ao consultar ChromaDB: {e}")
        return []