# teste_direto.py
import os
import google.generativeai as genai
from dotenv import load_dotenv

print("--- INICIANDO TESTE DIRETO NA API DO GEMINI ---")

try:
    # Imprime a versão da biblioteca para termos certeza do que está instalado
    print(f"Versão da biblioteca google-generativeai: {genai.__version__}")

    # Carrega a chave de API do arquivo .env
    load_dotenv()
    api_key = os.getenv("GEMINI_API_KEY")

    if not api_key:
        raise ValueError("Chave de API não encontrada no arquivo .env")

    genai.configure(api_key=api_key)
    print("Configuração da API Key bem-sucedida.")

    # Tenta listar os modelos disponíveis para esta chave
    print("\nTentando listar os modelos disponíveis...")
    modelos_encontrados = []
    for m in genai.list_models():
        # Verifica se o modelo suporta o método que queremos (gerar conteúdo)
        if 'generateContent' in m.supported_generation_methods:
            modelos_encontrados.append(m.name)

    if modelos_encontrados:
        print("\n[SUCESSO] Modelos compatíveis encontrados:")
        for nome_modelo in modelos_encontrados:
            print(f"- {nome_modelo}")
    else:
        print("\n[AVISO] Nenhum modelo compatível encontrado para esta chave.")

except Exception as e:
    print(f"\n[ERRO] Ocorreu uma falha durante o teste: {e}")

print("\n--- TESTE CONCLUÍDO ---")