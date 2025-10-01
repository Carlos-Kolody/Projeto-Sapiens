import os
import google.generativeai as genai
from dotenv import load_dotenv
from PIL import Image
import io
import PyPDF2
from typing import Optional

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")

if api_key:
    genai.configure(api_key=api_key)
else:
    print("AVISO: Chave da API do Gemini não encontrada no arquivo .env")

def analisar_com_gemini(pergunta: str, arquivo_bytes: Optional[bytes], mime_type: Optional[str], filename: Optional[str]):
    """
    Função especialista que opera em dois modos:
    1. Modo Documento: Se um arquivo é fornecido.
    2. Modo Conversa: Se apenas uma pergunta é fornecida.
    """
    if not api_key:
        return "ERRO: Chave da API do Gemini não foi configurada."

    try:
        model = genai.GenerativeModel('gemini-pro-latest')
       
        if not filename or not arquivo_bytes:
            print("Operando em MODO CONVERSA.")
            prompt_conversa = f"Você é Sapiens, um assistente prestativo. Responda à seguinte pergunta: {pergunta}"
            response = model.generate_content(prompt_conversa)
            return response.text

        else:
            print("Operando em MODO DOCUMENTO.")
            nome_arquivo_lower = filename.lower()
            conteudo_para_analise = []

            if nome_arquivo_lower.endswith(('.png', '.jpg', '.jpeg', '.webp')):
                print(f"Arquivo '{filename}' identificado como IMAGEM.")
                imagem = Image.open(io.BytesIO(arquivo_bytes))
                conteudo_para_analise = [pergunta, imagem]
                
            elif nome_arquivo_lower.endswith('.pdf'):
                print(f"Arquivo '{filename}' identificado como PDF.")
                texto_do_pdf = ""
                leitor_pdf = PyPDF2.PdfReader(io.BytesIO(arquivo_bytes))
                for pagina in leitor_pdf.pages:
                    texto_do_pdf += pagina.extract_text() or ""
                
                prompt_completo = f"""
                Analise o documento de texto a seguir e responda à pergunta do usuário com base nele.
                DOCUMENTO: --- {texto_do_pdf} ---
                PERGUNTA DO USUÁRIO: {pergunta}
                """
                conteudo_para_analise = [prompt_completo]
            else:
                return f"ERRO: Formato de arquivo '{filename}' não é suportado. Por favor, envie um arquivo de imagem (PNG, JPG) ou PDF."

            response = model.generate_content(conteudo_para_analise)
            return response.text

    except Exception as e:
        print(f"Ocorreu um erro ao chamar a API do Gemini: {e}")
        return f"ERRO: Não foi possível processar sua solicitação com a IA. Detalhes: {e}"
