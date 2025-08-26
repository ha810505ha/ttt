// js/ui.js
import * as DOM from './dom.js';
import { state } from './state.js';
import { DEFAULT_AVATAR, MODELS, DEFAULT_SUMMARY_PROMPT, DEFAULT_SCENARIO_PROMPT, DEFAULT_JAILBREAK_PROMPT } from './constants.js';

/**
 * @description 根據登入狀態更新使用者個人資料區域的 UI
 */
export function renderUserProfile() {
    if (state.currentUser) {
        DOM.loginBtn.classList.add('hidden');
        DOM.userInfo.classList.remove('hidden');
        DOM.userAvatar.src = state.currentUser.photoURL || DEFAULT_AVATAR;
        DOM.userName.textContent = state.currentUser.displayName || '使用者';
    } else {
        DOM.loginBtn.classList.remove('hidden');
        DOM.userInfo.classList.add('hidden');
    }
}

/**
 * @description 渲染左側的角色列表
 */
export function renderCharacterList() {
    renderUserProfile();
    DOM.characterList.innerHTML = '';
    state.characters.forEach(char => {
        const item = document.createElement('li');
        item.className = 'character-item';
        item.dataset.id = char.id;
        item.innerHTML = `
            <img src="${char.avatarUrl || DEFAULT_AVATAR}" alt="${char.name}" class="char-item-avatar">
            <span class="char-item-name">${char.name}</span>
        `;
        DOM.characterList.appendChild(item);
    });
}

/**
 * @description 顯示角色列表視圖
 */
export function showCharacterListView() {
    DOM.leftPanel.classList.remove('show-chats');
    DOM.leftPanel.classList.remove('mobile-visible');
    DOM.mobileOverlay.classList.add('hidden');
    state.activeCharacterId = null;
}

/**
 * @description 顯示指定角色的聊天室列表視圖
 * @param {string} charId - 角色 ID
 */
export function showChatSessionListView(charId) {
    try {
        state.activeCharacterId = charId;
        const character = state.characters.find(c => c.id === charId);
        if (!character) {
            console.error("找不到角色:", charId);
            return;
        }
        
        DOM.leftPanel.classList.add('show-chats');
        DOM.chatListHeaderName.textContent = character.name;
        renderChatSessionList();
    } catch (error) {
        console.error("顯示聊天室列表時發生錯誤:", error);
        alert("載入聊天室列表時發生錯誤，請檢查主控台。");
        DOM.leftPanel.classList.remove('show-chats');
    }
}

/**
 * @description 渲染當前選定角色的聊天室列表
 */
export function renderChatSessionList() {
    DOM.chatSessionList.innerHTML = '';
    const sessions = state.chatHistories[state.activeCharacterId] || {};
    const metadatas = state.chatMetadatas[state.activeCharacterId] || {};
    
    const sortedSessions = Object.keys(sessions)
        .map(chatId => ({
            id: chatId,
            ...metadatas[chatId],
            lastMessage: sessions[chatId]?.slice(-1)[0]
        }))
        .sort((a, b) => {
            if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
            const timeA = a.lastMessage ? new Date(a.lastMessage.timestamp).getTime() : 0;
            const timeB = b.lastMessage ? new Date(b.lastMessage.timestamp).getTime() : 0;
            return timeB - timeA;
        });

    if (sortedSessions.length === 0) {
        DOM.chatSessionList.innerHTML = `<li class="list-placeholder">尚無對話</li>`;
        return;
    }

    sortedSessions.forEach(session => {
        const lastMsgContent = session.lastMessage 
            ? (Array.isArray(session.lastMessage.content) ? session.lastMessage.content[session.lastMessage.activeContentIndex] : session.lastMessage.content).substring(0, 25) + '...'
            : '新對話';
        const displayName = (session.pinned ? '📌 ' : '') + (session.name || lastMsgContent);
        
        const item = document.createElement('li');
        item.className = `chat-session-item ${session.id === state.activeChatId ? 'active' : ''}`;
        item.dataset.id = session.id;
        item.innerHTML = `
            <div class="session-item-content">
                <span class="session-item-name">${displayName}</span>
            </div>
            <div class="session-item-actions">
                <button class="icon-btn-sm pin-chat-btn ${session.pinned ? 'active' : ''}" title="置頂"><i class="fa-solid fa-thumbtack"></i></button>
                <button class="icon-btn-sm rename-chat-btn" title="重新命名"><i class="fa-solid fa-i-cursor"></i></button>
            </div>
        `;
        DOM.chatSessionList.appendChild(item);
    });
}

/**
 * @description 渲染當前活躍的聊天介面
 */
export function renderActiveChat() {
    if (!state.activeCharacterId || !state.activeChatId) {
        DOM.welcomeScreen.classList.remove('hidden');
        DOM.chatInterface.classList.add('hidden');
        return;
    }
    DOM.welcomeScreen.classList.add('hidden');
    DOM.chatInterface.classList.remove('hidden');
    
    const activeChar = state.characters.find(c => c.id === state.activeCharacterId);
    if (!activeChar) return;
    
    const metadata = state.chatMetadatas[state.activeCharacterId]?.[state.activeChatId] || {};

    DOM.chatHeaderAvatar.src = activeChar.avatarUrl || DEFAULT_AVATAR;
    DOM.chatHeaderName.textContent = activeChar.name;
    DOM.chatNotesInput.value = metadata.notes || '';
    
    const currentModel = state.globalSettings.apiModel || '未設定';
    DOM.chatHeaderModelName.textContent = currentModel;
    DOM.chatHeaderModelName.title = currentModel;
    
    renderChatUserPersonaSelector();
    renderChatMessages();
}

/**
 * @description 渲染聊天視窗中的所有訊息
 */
export function renderChatMessages() {
    DOM.chatWindow.innerHTML = '';
    const history = state.chatHistories[state.activeCharacterId]?.[state.activeChatId] || [];
    history.forEach((msg, index) => {
        const contentToDisplay = (msg.role === 'assistant') ? msg.content[msg.activeContentIndex] : msg.content;
        displayMessage(contentToDisplay, msg.role, msg.timestamp, index, false, msg.error);
    });

    const lastMessageRow = DOM.chatWindow.querySelector('.message-row:last-child');
    if (lastMessageRow) {
        lastMessageRow.classList.add('is-last-message');
    }
}

/**
 * @description 在聊天視窗中顯示單一訊息
 * @param {string} text - 訊息內容
 * @param {string} sender - 'user' 或 'assistant'
 * @param {string} timestamp - ISO 格式的時間戳
 * @param {number} index - 訊息在歷史紀錄中的索引
 * @param {boolean} isNew - 是否為新訊息 (用於捲動)
 * @param {string|null} error - 錯誤訊息
 * @returns {HTMLElement} 建立的訊息元素
 */
export function displayMessage(text, sender, timestamp, index, isNew, error = null) {
    const metadata = state.chatMetadatas[state.activeCharacterId]?.[state.activeChatId] || {};
    const currentPersonaId = metadata.userPersonaId || state.activeUserPersonaId;
    const userPersona = state.userPersonas.find(p => p.id === currentPersonaId) || state.userPersonas[0];
    const userAvatar = userPersona?.avatarUrl || DEFAULT_AVATAR;

    const activeChar = state.characters.find(c => c.id === state.activeCharacterId);
    const charAvatar = activeChar?.avatarUrl || DEFAULT_AVATAR;
    const avatarUrl = sender === 'user' ? userAvatar : charAvatar;
    
    const row = document.createElement('div');
    row.className = `message-row ${sender === 'user' ? 'user-row' : 'assistant-row'} ${error ? 'has-error' : ''}`;
    row.dataset.index = index;
    
    const formattedTimestamp = new Date(timestamp).toLocaleString('zh-TW', { hour12: false, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });

    let messageActionsHTML = '';
    if (sender === 'assistant') {
        const msgData = state.chatHistories[state.activeCharacterId]?.[state.activeChatId]?.[index];
        if (msgData && msgData.content.length > 1) {
            messageActionsHTML += `
                <div class="version-nav">
                    <button class="version-prev-btn" ${msgData.activeContentIndex === 0 ? 'disabled' : ''}><i class="fa-solid fa-chevron-left"></i></button>
                    <span class="version-counter">${msgData.activeContentIndex + 1}/${msgData.content.length}</span>
                    <button class="version-next-btn" ${msgData.activeContentIndex === msgData.content.length - 1 ? 'disabled' : ''}><i class="fa-solid fa-chevron-right"></i></button>
                </div>`;
        }
        messageActionsHTML += `<button class="regenerate-btn-sm" title="再生成一則新的回應？"><i class="fa-solid fa-arrows-rotate"></i>再生成一則新的回應？</button>`;
    }

    row.innerHTML = `
        <img src="${avatarUrl}" alt="${sender} avatar" class="chat-avatar">
        <div class="bubble-container">
            <div class="chat-bubble"></div>
            ${error ? `<div class="message-error"><span>${error}</span><button class="retry-btn-sm"><i class="fa-solid fa-rotate-right"></i> 重試</button></div>` : ''}
            <div class="message-timestamp">${formattedTimestamp}</div>
            <div class="message-actions">${messageActionsHTML}</div>
        </div>
        <button class="icon-btn edit-msg-btn" title="編輯訊息"><i class="fa-solid fa-pencil"></i></button>
    `;
    
    const bubble = row.querySelector('.chat-bubble');
    bubble.innerHTML = marked.parse(text || '');

    DOM.chatWindow.appendChild(row);
    if (isNew) {
        DOM.chatWindow.scrollTop = DOM.chatWindow.scrollHeight;
    }
    return row;
}

/**
 * @description 將全域設定載入到設定彈窗的 UI 中
 */
export function loadGlobalSettingsToUI() {
    const settings = state.globalSettings;
    DOM.apiProviderSelect.value = settings.apiProvider || 'official_gemini';
    updateModelDropdown(); 
    DOM.apiModelSelect.value = settings.apiModel || (MODELS[DOM.apiProviderSelect.value] ? MODELS[DOM.apiProviderSelect.value][0] : '');
    DOM.apiKeyInput.value = settings.apiKey || '';
    DOM.temperatureSlider.value = settings.temperature || 1;
    DOM.temperatureValue.value = settings.temperature || 1;
    DOM.topPSlider.value = settings.topP || 1;
    DOM.topPValue.value = settings.topP || 1;
    DOM.repetitionPenaltySlider.value = settings.repetitionPenalty || 0;
    DOM.repetitionPenaltyValue.value = settings.repetitionPenalty || 0;
    DOM.contextSizeInput.value = settings.contextSize || 30000;
    DOM.maxTokensSlider.value = settings.maxTokens || 1024;
    DOM.maxTokensValue.value = settings.maxTokens || 1024;
    
    DOM.themeSelect.value = settings.theme || 'light';

    renderUserPersonaList();
    renderActiveUserPersonaSelector();
    loadPromptSettingsToUI();
    // [新增] 渲染 API 設定檔下拉選單
    renderApiPresetsDropdown();

    // 重置到第一個分頁
    DOM.settingsTabsContainer.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    DOM.globalSettingsModal.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    DOM.settingsTabsContainer.querySelector('[data-tab="api-settings-tab"]').classList.add('active');
    DOM.apiSettingsTab.classList.add('active');
}

/**
 * @description 根據選擇的 API 供應商更新模型下拉選單，並控制 API 金鑰輸入框的顯示
 */
export function updateModelDropdown() {
    const provider = DOM.apiProviderSelect.value;
    const models = MODELS[provider] || [];
    DOM.apiModelSelect.innerHTML = ''; 
    models.forEach(model => {
        const option = document.createElement('option');
        option.value = model;
        option.textContent = model;
        DOM.apiModelSelect.appendChild(option);
    });
    const savedModel = state.globalSettings.apiModel;
    if (savedModel && models.includes(savedModel)) {
        DOM.apiModelSelect.value = savedModel;
    } else if (models.length > 0) {
        DOM.apiModelSelect.value = models[0];
    }

    if (provider === 'official_gemini') {
        DOM.apiKeyFormGroup.classList.add('hidden');
        DOM.apiStatusIndicator.style.display = 'none';
    } else {
        DOM.apiKeyFormGroup.classList.remove('hidden');
    }
}

/**
 * @description 將提示詞設定載入到提示詞庫 UI
 */
export function loadPromptSettingsToUI() {
    const prompts = state.promptSettings;
    const promptMode = prompts.mode || 'default';
    DOM.promptModeSelect.value = promptMode;

    DOM.customPromptsContainer.classList.toggle('hidden', promptMode === 'default');

    if (promptMode === 'custom') {
        DOM.promptScenarioInput.value = prompts.scenario || '';
        DOM.promptJailbreakInput.value = prompts.jailbreak || '';
    } else {
        DOM.promptScenarioInput.value = DEFAULT_SCENARIO_PROMPT;
        DOM.promptJailbreakInput.value = DEFAULT_JAILBREAK_PROMPT;
    }
    
    DOM.promptSummarizationInput.value = prompts.summarizationPrompt || DEFAULT_SUMMARY_PROMPT;
}

/**
 * @description 渲染使用者角色列表 (在設定彈窗中)
 */
export function renderUserPersonaList() {
    DOM.userPersonaList.innerHTML = '';
    state.userPersonas.forEach(persona => {
        const item = document.createElement('li');
        item.className = 'persona-item';
        item.dataset.id = persona.id;
        item.innerHTML = `
            <img src="${persona.avatarUrl || DEFAULT_AVATAR}" alt="${persona.name}" class="persona-item-avatar">
            <span class="persona-item-name">${persona.name}</span>
            <div class="persona-item-actions">
                <button class="icon-btn-sm edit-persona-btn" title="編輯"><i class="fa-solid fa-pencil"></i></button>
                <button class="icon-btn-sm delete-persona-btn" title="刪除"><i class="fa-solid fa-trash"></i></button>
            </div>
        `;
        DOM.userPersonaList.appendChild(item);
    });
}

/**
 * @description 渲染預設使用者角色的下拉選單 (在設定彈窗中)
 */
export function renderActiveUserPersonaSelector() {
    DOM.activeUserPersonaSelect.innerHTML = '';
    state.userPersonas.forEach(persona => {
        const option = document.createElement('option');
        option.value = persona.id;
        option.textContent = persona.name;
        DOM.activeUserPersonaSelect.appendChild(option);
    });
    DOM.activeUserPersonaSelect.value = state.activeUserPersonaId;
}

/**
 * @description 渲染聊天介面中的使用者角色下拉選單
 */
export function renderChatUserPersonaSelector() {
    DOM.chatUserPersonaSelect.innerHTML = '';
    state.userPersonas.forEach(persona => {
        const option = document.createElement('option');
        option.value = persona.id;
        option.textContent = persona.name;
        DOM.chatUserPersonaSelect.appendChild(option);
    });
    const metadata = state.chatMetadatas[state.activeCharacterId]?.[state.activeChatId] || {};
    DOM.chatUserPersonaSelect.value = metadata.userPersonaId || state.activeUserPersonaId;
}

/**
 * @description [新增] 渲染 API 設定檔下拉選單
 */
export function renderApiPresetsDropdown() {
    DOM.apiPresetSelect.innerHTML = '<option value="">選擇要載入的設定檔...</option>';
    state.apiPresets.forEach(preset => {
        const option = document.createElement('option');
        option.value = preset.id;
        option.textContent = preset.name;
        DOM.apiPresetSelect.appendChild(option);
    });
}

/**
 * @description [新增] 將指定的 API 設定檔載入到 UI
 * @param {string} presetId - 設定檔 ID
 */
export function loadApiPresetToUI(presetId) {
    const preset = state.apiPresets.find(p => p.id === presetId);
    if (!preset) return;

    DOM.apiProviderSelect.value = preset.provider;
    updateModelDropdown(); // 更新模型列表
    
    // 等待模型列表渲染完成後再設定值
    setTimeout(() => {
        DOM.apiModelSelect.value = preset.model;
    }, 0);

    DOM.apiKeyInput.value = preset.apiKey;
    DOM.apiStatusIndicator.style.display = 'none'; // 載入後隱藏狀態
}

/**
 * @description 切換彈出視窗的顯示或隱藏
 * @param {string} modalId - 彈出視窗的 ID
 * @param {boolean} show - true 為顯示，false 為隱藏
 */
export function toggleModal(modalId, show) {
    document.getElementById(modalId).classList.toggle('hidden', !show);
}

/**
 * @description 設定應用程式是否處於「生成中」的狀態
 * @param {boolean} isGenerating - 是否正在生成
 * @param {boolean} changeMainButton - 是否要改變主發送按鈕的狀態
 */
export function setGeneratingState(isGenerating, changeMainButton = true) {
    if (changeMainButton) {
        DOM.sendBtn.classList.toggle('is-generating', isGenerating);
        DOM.sendIcon.classList.toggle('hidden', isGenerating);
        DOM.stopIcon.classList.toggle('hidden', !isGenerating);
        DOM.messageInput.disabled = isGenerating;
    }
    
    document.querySelectorAll('.regenerate-btn-sm, .retry-btn-sm').forEach(btn => {
        btn.disabled = isGenerating;
    });
}
