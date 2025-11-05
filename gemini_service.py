import os
import google.generativeai as genai
from dotenv import load_dotenv
from PIL import Image
import io
import PyPDF2
from typing import Optional
import vector_store

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")

if api_key:
    genai.configure(api_key=api_key)
else:
    print("AVISO: Chave da API do Gemini não encontrada no arquivo .env")


def analisar_com_gemini(pergunta: str, arquivo_bytes: Optional[bytes], mime_type: Optional[str], filename: Optional[str]):
    """
    Função especialista que opera em dois modos:
    1. Modo Documento (RAG Temporário): Se um arquivo é fornecido junto com a pergunta.
    2. Modo Conversa (RAG Persistente): Se apenas uma pergunta é fornecida, consulta o ChromaDB.
    """
    if not api_key:
        return "ERRO: Chave da API do Gemini não foi configurada."

    try:
        model = genai.GenerativeModel('gemini-pro-latest')

        if filename and arquivo_bytes:
            print("Operando em MODO DOCUMENTO (análise temporária).")
            nome_arquivo_lower = filename.lower()
            conteudo_para_analise = []

            if nome_arquivo_lower.endswith(('.png', '.jpg', '.jpeg', '.webp')):
                print(f"Arquivo '{filename}' identificado como IMAGEM.")
                
                model_vision = genai.GenerativeModel('gemini-pro-vision')
                imagem = Image.open(io.BytesIO(arquivo_bytes))
                conteudo_para_analise = [pergunta, imagem]
                response = model_vision.generate_content(conteudo_para_analise)

           
            elif nome_arquivo_lower.endswith('.pdf'):
                print(f"Arquivo '{filename}' identificado como PDF.")
                texto_do_pdf = ""
                leitor_pdf = PyPDF2.PdfReader(io.BytesIO(arquivo_bytes))
                for pagina in leitor_pdf.pages:
                    texto_do_pdf += pagina.extract_text() or ""

                prompt_completo = f"""
                Analise o documento de texto a seguir e responda à pergunta do usuário com base nele.
                Não adicione informações que não estejam no documento.

                DOCUMENTO:
                ---
                {texto_do_pdf}
                ---

                PERGUNTA DO USUÁRIO: {pergunta}
                """
                conteudo_para_analise = [prompt_completo]
                response = model.generate_content(conteudo_para_analise)

            else:
                return f"ERRO: Formato de arquivo '{filename}' não é suportado para análise direta. Use /alimentar-ia para PDFs ou anexe uma imagem."

            return response.text

    
        else:
            print("Operando em MODO CONVERSA (com memória ChromaDB).")

            contexto_encontrado = vector_store.consultar_banco_de_dados(pergunta, n_results=3)

            if not contexto_encontrado:
                 print("Nenhum contexto relevante encontrado no ChromaDB.")
                 contexto_formatado = "Nenhum contexto relevante foi encontrado na base de conhecimento."
                
            else:
                contexto_formatado = "\n\n".join(contexto_encontrado)
                print(f"Contexto encontrado: {contexto_formatado[:200]}...")

            prompt_com_contexto = f"""
            Você é Sapiens, um assistente prestativo da TecnoTooling.
            Com base EXCLUSIVAMENTE no seguinte contexto extraído da base de conhecimento da empresa,
            responda à pergunta do usuário de forma clara e objetiva.
            Se o contexto não contiver informações suficientes para responder à pergunta,
            informe educadamente que você não encontrou essa informação nos documentos disponíveis.
            Não invente respostas.

            CONTEXTO RELEVANTE:
            ---
            {contexto_formatado}
            ---

            PERGUNTA DO USUÁRIO: {pergunta}

            RESPOSTA:
            """

            response = model.generate_content(prompt_com_contexto)
            return response.text

    except Exception as e:
        print(f"Ocorreu um erro geral na função analisar_com_gemini: {e}")
        return f"ERRO: Não foi possível processar sua solicitação com a IA. Detalhes técnicos: {e}"