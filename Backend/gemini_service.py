# cole isso dentro de backend/gemini_service.py

import os
import google.generativeai as genai
from dotenv import load_dotenv
from PIL import Image
import io
import PyPDF2

# --- Configuração Inicial ---
load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")

if api_key:
    genai.configure(api_key=api_key)
else:
    print("AVISO: Chave da API do Gemini não encontrada no arquivo .env")
# ---------------------------

# MODIFICADO: A função agora aceita 'filename' como um novo parâmetro
def analisar_com_gemini(pergunta: str, arquivo_bytes: bytes, mime_type: str, filename: str):
    """
    Função especialista em analisar uma pergunta e um arquivo usando o Gemini.
    Agora usa a extensão do nome do arquivo para mais confiabilidade.
    """
    if not api_key:
        return "ERRO: Chave da API do Gemini não foi configurada. Verifique seu arquivo .env no backend."

    try:
        model = genai.GenerativeModel('gemini-pro-latest')
        
        # Transforma o nome do arquivo em minúsculas para a verificação
        nome_arquivo_lower = filename.lower()
        conteudo_para_analise = []

        # MODIFICADO: A lógica agora se baseia na extensão do arquivo
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

            DOCUMENTO:
            ---
            {texto_do_pdf}
            ---

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