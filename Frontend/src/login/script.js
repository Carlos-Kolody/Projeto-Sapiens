let selectedAccessLevel = 'standard';

/**
 * Atualiza a interface para mostrar qual nível de acesso está selecionado.
 * @param {'standard' | 'premium'} level - O nível de acesso clicado.
 */
function selectAccessLevel(level) {
    selectedAccessLevel = level;
    
    const standardOption = document.getElementById('standardLevel');
    const premiumOption = document.getElementById('premiumLevel');
    
        if (level === 'standard') {
        standardOption.classList.add('selected');
        premiumOption.classList.remove('selected');
    } else {
        premiumOption.classList.add('selected');
        standardOption.classList.remove('selected');
    }
    
        hideErrorMessage();
}

/**
 * Exibe uma mensagem de erro na tela.
 * @param {string} message - A mensagem a ser exibida.
 */
function showErrorMessage(message) {
    const errorElement = document.getElementById('errorMessage');
    errorElement.textContent = message;
    errorElement.style.display = 'block';
}


function hideErrorMessage() {
    const errorElement = document.getElementById('errorMessage');
    errorElement.style.display = 'none';
}

/**
 * Lida com o envio do formulário de login.
 * Esta função agora envia as credenciais para o backend para validação.
 * @param {Event} event - O evento de submit do formulário.
 */
async function handleLogin(event) {
        event.preventDefault();
    hideErrorMessage();

        const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

        const loginData = {
        email: email,
        password: password,
        accessLevel: selectedAccessLevel
    };

    try {
       
        const response = await fetch('http://127.0.0.1:8000/login', { 
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(loginData)
        });

        
        if (response.ok) {
            
            window.location.href = '../chat/index.html';
        } else {
            
            const errorData = await response.json();
            showErrorMessage(errorData.detail || 'Credenciais inválidas. Verifique os dados e tente novamente.');
        }
    } catch (error) {
        
        console.error('Falha na requisição:', error);
        showErrorMessage('Não foi possível conectar ao servidor. Tente novamente mais tarde.');
    }
}

document.addEventListener('DOMContentLoaded', function() {
    selectAccessLevel('standard');
});
