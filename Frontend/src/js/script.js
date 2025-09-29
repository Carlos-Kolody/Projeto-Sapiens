// ===== CONSTANTES E VARIÁVEIS GLOBAIS =====
const APP_STATE = {
    isFirstMessage: true,
    isWaitingForResponse: false,
    currentConversationId: null,
    conversations: {},
    isLightTheme: false,
    pendingDeleteId: null,
    attachedFile: null, // Para guardar a referência do arquivo anexado
};

// ===== ELEMENTOS DO DOM =====
const DOM_ELEMENTS = {
    chatMessages: document.getElementById("chatMessages"),
    welcomeScreen: document.getElementById("welcomeScreen"),
    chatInput: document.getElementById("chatInput"),
    sendButton: document.getElementById("sendButton"),
    newChatBtn: document.getElementById("newChatBtn"),
    themeToggle: document.getElementById("themeToggle"),
    chatHistoryList: document.getElementById("chatHistoryList"),
    appContainer: document.getElementById("appContainer"),
    clearAllBtn: document.getElementById("clearAllBtn"),
    confirmationModal: document.getElementById("confirmationModal"),
    modalTitle: document.getElementById("modalTitle"),
    modalMessage: document.getElementById("modalMessage"),
    modalCancel: document.getElementById("modalCancel"),
    modalConfirm: document.getElementById("modalConfirm"),
    uploadForm: document.getElementById("upload-form"), // Referência para o formulário
    fileInput: document.getElementById("fileInput"), // Referência para o input de arquivo
};

// ===== INICIALIZAÇÃO DO APLICATIVO =====
document.addEventListener("DOMContentLoaded", initApp);

function initApp() {
    console.log("TecnoTooling Sapiens iniciado com sucesso!");
    setupEventListeners();
    loadConversations();
    loadThemePreference();
    createNewConversation();
}

// ===== CONFIGURAÇÃO DOS EVENT LISTENERS =====
function setupEventListeners() {
    DOM_ELEMENTS.uploadForm.addEventListener("submit", sendMessage);

    DOM_ELEMENTS.chatInput.addEventListener("keydown", function (event) {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            sendMessage(event);
        }
    });

    DOM_ELEMENTS.fileInput.addEventListener("change", () => {
        if (DOM_ELEMENTS.fileInput.files.length > 0) {
            APP_STATE.attachedFile = DOM_ELEMENTS.fileInput.files[0];
            console.log("Arquivo anexado:", APP_STATE.attachedFile.name);
        } else {
            APP_STATE.attachedFile = null;
        }
    });

    DOM_ELEMENTS.chatInput.addEventListener("input", autoResizeTextarea);
    DOM_ELEMENTS.newChatBtn.addEventListener("click", newChat);
    DOM_ELEMENTS.themeToggle.addEventListener("click", toggleTheme);
    DOM_ELEMENTS.clearAllBtn.addEventListener("click", confirmClearAll);
    DOM_ELEMENTS.modalCancel.addEventListener("click", closeModal);
    DOM_ELEMENTS.modalConfirm.addEventListener("click", executeDelete);
}

// ===== FUNÇÕES PRINCIPAIS DE CHAT =====

// MODIFICADO: Corrigido o bug de lógica/ordem.
async function sendMessage(event) {
    event.preventDefault();
    if (APP_STATE.isWaitingForResponse) return;

    const message = DOM_ELEMENTS.chatInput.value.trim();
    const file = APP_STATE.attachedFile;

    if (!message || !file) {
        alert("Por favor, digite uma pergunta e anexe um arquivo.");
        return;
    }

    // 1. PREPARAMOS O PACOTE DE DADOS PRIMEIRO
    const formData = new FormData(DOM_ELEMENTS.uploadForm);

    hideWelcomeScreen();

    const userMessageContent = `${message}<br><small><em>Arquivo anexado: ${file.name}</em></small>`;
    addMessage(userMessageContent, "user");
    saveMessageToConversation(userMessageContent, "user");

    // 2. AGORA, LIMPAMOS O FORMULÁRIO (depois de já ter lido os dados para o formData)
    DOM_ELEMENTS.chatInput.value = "";
    DOM_ELEMENTS.uploadForm.reset();
    APP_STATE.attachedFile = null;
    resetTextareaHeight();

    // 3. ENVIAMOS O PACOTE QUE JÁ ESTAVA PRONTO
    await getAIResponse(formData);
}

// MODIFICADO: Função agora recebe 'formData' como parâmetro.
async function getAIResponse(formData) {
    APP_STATE.isWaitingForResponse = true;
    addTypingIndicator();

    try {
        const response = await fetch("http://127.0.0.1:8000/analisar", {
            method: "POST",
            body: formData,
        });

        removeTypingIndicator();

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || `Erro HTTP: ${response.status}`);
        }

        const result = await response.json();
        const aiResponse = result.resposta;

        addMessage(aiResponse, "ai");
        saveMessageToConversation(aiResponse, "ai");
    } catch (error) {
        removeTypingIndicator();
        console.error("Erro ao conectar com o backend:", error);
        const errorMessage = `Desculpe, ocorreu um erro ao tentar me comunicar com o cérebro do sistema. Verifique se o backend está rodando. (Detalhes: ${error.message})`;
        addMessage(errorMessage, "ai");
        saveMessageToConversation(errorMessage, "ai");
    } finally {
        APP_STATE.isWaitingForResponse = false;
    }
}

function hideWelcomeScreen() {
    if (APP_STATE.isFirstMessage) {
        DOM_ELEMENTS.welcomeScreen.style.display = "none";
        APP_STATE.isFirstMessage = false;
    }
}

function addMessage(content, sender) {
    const messageDiv = document.createElement("div");
    messageDiv.className = `message ${sender}`;

    const avatar = sender === "user" ? "U" : "AI";
    const messageContentDiv = document.createElement("div");
    messageContentDiv.className = "message-content";

    if (sender === "ai") {
        messageContentDiv.innerHTML = marked.parse(content);
    } else {
        messageContentDiv.innerHTML = content;
    }

    messageDiv.innerHTML = `<div class="message-avatar">${avatar}</div>`;
    messageDiv.appendChild(messageContentDiv);

    DOM_ELEMENTS.chatMessages.appendChild(messageDiv);
    scrollToBottom();
}

function addTypingIndicator() {
    const typingDiv = document.createElement("div");
    typingDiv.className = "message ai";
    typingDiv.id = "typingIndicator";

    typingDiv.innerHTML = `
        <div class="message-avatar">AI</div>
        <div class="message-content">
            <div class="typing-indicator">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            </div>
        </div>
    `;

    DOM_ELEMENTS.chatMessages.appendChild(typingDiv);
    scrollToBottom();
}

function removeTypingIndicator() {
    const typingIndicator = document.getElementById("typingIndicator");
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

// ===== FUNÇÃO 1: TOGGLE DE TEMA CLARO/ESCURO =====
function toggleTheme() {
    APP_STATE.isLightTheme = !APP_STATE.isLightTheme;
    if (APP_STATE.isLightTheme) {
        document.body.classList.add("light-theme");
        DOM_ELEMENTS.themeToggle.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM6.34 5.16l-1.42 1.42c-.39.39-.39 1.02 0 1.41.39.39 1.02.39 1.41 0l1.42-1.42c.39-.39.39-1.02 0-1.41a.9959.9959 0 0 0-1.41 0zm12.73 12.73l-1.42 1.42c-.39.39-.39 1.02 0 1.41.39.39 1.02.39 1.41 0l1.42-1.42c.39-.39.39-1.02 0-1.41a.9959.9959 0 0 0-1.41 0zm-14.14 0c-.39-.39-1.02-.39-1.41 0-.39.39-.39 1.02 0 1.41l1.42 1.42c.39.39 1.02.39 1.41 0 .39-.39.39-1.02 0-1.41l-1.42-1.42zM18.37 5.16c-.39-.39-1.02-.39-1.41 0-.39.39-.39 1.02 0 1.41l1.42 1.42c.39.39 1.02.39 1.41 0 .39-.39.39-1.02 0-1.41l-1.42-1.42z"/></svg>`;
    } else {
        document.body.classList.remove("light-theme");
        DOM_ELEMENTS.themeToggle.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36-.98 1.37-2.58 2.26-4.4 2.26-2.98 0-5.4-2.42-5.4-5.4 0-1.81.89-3.42 2.26-4.4-.44-.06-.9-.1-1.36-.1z"/></svg>`;
    }
    localStorage.setItem(
        "TecnoTooling-theme",
        APP_STATE.isLightTheme ? "light" : "dark"
    );
}

function loadThemePreference() {
    const savedTheme = localStorage.getItem("TecnoTooling-theme");
    if (savedTheme === "light") {
        APP_STATE.isLightTheme = false;
        toggleTheme();
    }
}

// ===== FUNÇÃO 2: GERENCIAMENTO DE CONVERSAS =====
function createNewConversation() {
    const conversationId = "conversation-" + Date.now();
    APP_STATE.currentConversationId = conversationId;
    APP_STATE.conversations[conversationId] = {
        id: conversationId,
        messages: [],
        title: "Nova Conversa",
        createdAt: new Date().toISOString(),
    };
    DOM_ELEMENTS.chatMessages.innerHTML = "";
    DOM_ELEMENTS.chatMessages.appendChild(DOM_ELEMENTS.welcomeScreen);
    DOM_ELEMENTS.welcomeScreen.style.display = "flex";
    APP_STATE.isFirstMessage = true;
    APP_STATE.isWaitingForResponse = false;
    updateConversationsList();
    return conversationId;
}

function saveMessageToConversation(content, sender) {
    if (!APP_STATE.currentConversationId) return;
    const message = {
        content: content,
        sender: sender,
        timestamp: new Date().toISOString(),
    };
    APP_STATE.conversations[APP_STATE.currentConversationId].messages.push(
        message
    );
    if (
        APP_STATE.conversations[APP_STATE.currentConversationId].messages.length === 1
    ) {
        const title =
            content.split("<br>")[0].length > 30
                ? content.split("<br>")[0].substring(0, 30) + "..."
                : content.split("<br>")[0];
        APP_STATE.conversations[APP_STATE.currentConversationId].title = title;
        updateConversationsList();
    }
    saveConversations();
}

function newChat() {
    createNewConversation();
}

function updateConversationsList() {
    DOM_ELEMENTS.chatHistoryList.innerHTML = "";
    const sortedConversations = Object.values(APP_STATE.conversations).sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
    sortedConversations.forEach((conversation) => {
        const isActive = conversation.id === APP_STATE.currentConversationId;
        const conversationItem = document.createElement("div");
        conversationItem.className = `chat-history-item ${isActive ? "active" : ""
            }`;
        conversationItem.innerHTML = `<div class="chat-item-content">${escapeHtml(
            conversation.title
        )}</div><button class="delete-chat-btn" data-id="${conversation.id
            }"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg></button>`;
        conversationItem.addEventListener("click", (e) => {
            if (!e.target.closest(".delete-chat-btn")) {
                loadConversation(conversation.id);
            }
        });
        const deleteBtn = conversationItem.querySelector(".delete-chat-btn");
        deleteBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            confirmDeleteConversation(conversation.id, conversation.title);
        });
        DOM_ELEMENTS.chatHistoryList.appendChild(conversationItem);
    });
}

function loadConversation(conversationId) {
    if (!APP_STATE.conversations[conversationId]) return;
    APP_STATE.currentConversationId = conversationId;
    DOM_ELEMENTS.chatMessages.innerHTML = "";
    APP_STATE.conversations[conversationId].messages.forEach((message) => {
        addMessage(message.content, message.sender);
    });
    if (APP_STATE.conversations[conversationId].messages.length > 0) {
        hideWelcomeScreen();
    } else {
        DOM_ELEMENTS.chatMessages.appendChild(DOM_ELEMENTS.welcomeScreen);
        DOM_ELEMENTS.welcomeScreen.style.display = "flex";
        APP_STATE.isFirstMessage = true;
    }
    updateConversationsList();
    scrollToBottom();
}

function saveConversations() {
    localStorage.setItem(
        "TecnoTooling-conversations",
        JSON.stringify(APP_STATE.conversations)
    );
}

function loadConversations() {
    const savedConversations = localStorage.getItem("TecnoTooling-conversations");
    if (savedConversations) {
        APP_STATE.conversations = JSON.parse(savedConversations);
    }
}

// ===== FUNÇÃO 3: SISTEMA DE EXCLUSÃO DE CONVERSAS =====
function confirmDeleteConversation(conversationId, conversationTitle) {
    APP_STATE.pendingDeleteId = conversationId;
    DOM_ELEMENTS.modalTitle.textContent = "Excluir Conversa";
    DOM_ELEMENTS.modalMessage.textContent = `Tem certeza que deseja excluir a conversa "${conversationTitle}"? Esta ação não pode ser desfeita.`;
    DOM_ELEMENTS.modalConfirm.textContent = "Excluir";
    DOM_ELEMENTS.confirmationModal.style.display = "flex";
}

function confirmClearAll() {
    if (Object.keys(APP_STATE.conversations).length === 0) return;
    APP_STATE.pendingDeleteId = "all";
    DOM_ELEMENTS.modalTitle.textContent = "Limpar Todas as Conversas";
    DOM_ELEMENTS.modalMessage.textContent = `Tem certeza que deseja excluir todas as ${Object.keys(APP_STATE.conversations).length
        } conversas? Esta ação não pode ser desfeita.`;
    DOM_ELEMENTS.modalConfirm.textContent = "Limpar Tudo";
    DOM_ELEMENTS.confirmationModal.style.display = "flex";
}

function executeDelete() {
    if (APP_STATE.pendingDeleteId === "all") {
        APP_STATE.conversations = {};
        createNewConversation();
    } else {
        delete APP_STATE.conversations[APP_STATE.pendingDeleteId];
        if (APP_STATE.currentConversationId === APP_STATE.pendingDeleteId) {
            createNewConversation();
        }
    }
    saveConversations();
    updateConversationsList();
    closeModal();
}

function closeModal() {
    DOM_ELEMENTS.confirmationModal.style.display = "none";
    APP_STATE.pendingDeleteId = null;
}

// ===== FUNÇÕES AUXILIARES =====
function autoResizeTextarea() {
    this.style.height = "auto";
    this.style.height = Math.min(this.scrollHeight, 120) + "px";
}

function resetTextareaHeight() {
    DOM_ELEMENTS.chatInput.style.height = "auto";
}

function scrollToBottom() {
    DOM_ELEMENTS.chatMessages.scrollTop = DOM_ELEMENTS.chatMessages.scrollHeight;
}

function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}