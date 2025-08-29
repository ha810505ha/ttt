// js/ui.js
import * as DOM from './dom.js';
import { state, tempState } from './state.js';
import { DEFAULT_AVATAR, MODELS, DEFAULT_PROMPT_SET } from './constants.js';
import { getActivePromptSet } from './promptManager.js';

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

export function renderCharacterList() {
    renderUserProfile();
    DOM.characterList.innerHTML = '';

    const sortedCharacters = [...state.characters].sort((a, b) => {
        if (a.loved !== b.loved) {
            return a.loved ? -1 : 1;
        }
        return (a.order || 0) - (b.order || 0);
    });

    sortedCharacters.forEach(char => {
        const item = document.createElement('li');
        item.className = `character-item ${char.loved ? 'loved' : ''}`;
        item.dataset.id = char.id;
        item.setAttribute('draggable', 'true');

        item.innerHTML = `
            <div class="char-item-content">
                <i class="fa-solid fa-grip-vertical drag-handle"></i>
                <img src="${char.avatarUrl || DEFAULT_AVATAR}" alt="${char.name}" class="char-item-avatar">
                <span class="char-item-name">${char.name}</span>
            </div>
            <div class="char-item-actions">
                <button class="icon-btn-sm love-char-btn ${char.loved ? 'loved' : ''}" title="喜愛/取消喜愛">
                    <i class="fa-${char.loved ? 'solid' : 'regular'} fa-heart"></i>
                </button>
            </div>
        `;
        DOM.characterList.appendChild(item);
    });
}

export function showCharacterListView() {
    DOM.leftPanel.classList.remove('show-chats');
    DOM.leftPanel.classList.remove('mobile-visible');
    DOM.mobileOverlay.classList.add('hidden');
    state.activeCharacterId = null;
}

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
            return (a.order || 0) - (b.order || 0);
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
        item.setAttribute('draggable', 'true');
        item.innerHTML = `
            <div class="session-item-content">
                 <i class="fa-solid fa-grip-vertical drag-handle"></i>
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
 * @description [MODIFIED] 渲染當前活躍的聊天介面，使用自訂模型名稱
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
    
    // [FIX] 查找並顯示自訂的模型名稱
    const provider = state.globalSettings.apiProvider || 'official_gemini';
    const modelId = state.globalSettings.apiModel;
    let modelDisplayName = modelId || '未設定'; // 預設顯示 ID

    if (modelId && MODELS[provider]) {
        const modelObject = MODELS[provider].find(m => m.value === modelId);
        if (modelObject) {
            modelDisplayName = modelObject.name; // 如果找到，就使用自訂名稱
        }
    }
    
    DOM.chatHeaderModelName.textContent = modelDisplayName;
    DOM.chatHeaderModelName.title = modelDisplayName;
    
    renderChatUserPersonaSelector();
    renderChatMessages();
}

export function renderChatMessages() {
    DOM.chatWindow.innerHTML = '';
    const history = state.chatHistories[state.activeCharacterId]?.[state.activeChatId] || [];
    history.forEach((msg, index) => {
        const contentToDisplay = (msg.role === 'assistant') ? msg.content[msg.activeContentIndex] : msg.content;
        displayMessage(contentToDisplay, msg.role, msg.timestamp, index, false, msg.error);
    });
}

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

    if (tempState.isScreenshotMode && tempState.selectedMessageIndices.includes(index)) {
        row.classList.add('selected');
    }
    
    const formattedTimestamp = new Date(timestamp).toLocaleString('zh-TW', { hour12: false, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });

    let messageActionsHTML = '';
    const msgData = state.chatHistories[state.activeCharacterId]?.[state.activeChatId]?.[index];

    if (sender === 'assistant') {
        if (msgData && msgData.content.length > 1) {
            messageActionsHTML += `
                <div class="version-nav">
                    <button class="version-prev-btn" ${msgData.activeContentIndex === 0 ? 'disabled' : ''}><i class="fa-solid fa-chevron-left"></i></button>
                    <span class="version-counter">${msgData.activeContentIndex + 1}/${msgData.content.length}</span>
                    <button class="version-next-btn" ${msgData.activeContentIndex === msgData.content.length - 1 ? 'disabled' : ''}><i class="fa-solid fa-chevron-right"></i></button>
                </div>`;
        }

        const history = state.chatHistories[state.activeCharacterId]?.[state.activeChatId] || [];
        if (index === history.length - 1) {
             messageActionsHTML += `<button class="regenerate-btn-sm" title="再生成一則新的回應？"><i class="fa-solid fa-arrows-rotate"></i> 再生成</button>`;
        }
    }

    row.innerHTML = `
        <img src="${avatarUrl}" alt="${sender} avatar" class="chat-avatar">
        <div class="bubble-container">
            <div class="chat-bubble"></div>
            ${error ? `<div class="message-error"><span>${error}</span><button class="retry-btn-sm"><i class="fa-solid fa-rotate-right"></i> 重試</button></div>` : ''}
            <div class="message-timestamp">${formattedTimestamp}</div>
            <div class="message-actions" style="${messageActionsHTML ? 'display: flex;' : 'display: none;'}">${messageActionsHTML}</div>
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

export function loadGlobalSettingsToUI() {
    const settings = state.globalSettings;
    DOM.apiProviderSelect.value = settings.apiProvider || 'official_gemini';
    updateModelDropdown(); 
    DOM.apiModelSelect.value = settings.apiModel || (MODELS[DOM.apiProviderSelect.value] ? MODELS[DOM.apiProviderSelect.value][0].value : '');
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
    renderApiPresetsDropdown();
    
    renderPromptSetSelector();
    renderPromptList();

    DOM.settingsTabsContainer.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    DOM.globalSettingsModal.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    DOM.settingsTabsContainer.querySelector('[data-tab="api-settings-tab"]').classList.add('active');
    DOM.apiSettingsTab.classList.add('active');
}

export function updateModelDropdown() {
    const provider = DOM.apiProviderSelect.value;
    const models = MODELS[provider] || [];
    DOM.apiModelSelect.innerHTML = ''; 
    models.forEach(model => {
        const option = document.createElement('option');
        option.value = model.value;
        option.textContent = model.name;
        DOM.apiModelSelect.appendChild(option);
    });
    const savedModel = state.globalSettings.apiModel;
    if (savedModel && models.some(m => m.value === savedModel)) {
        DOM.apiModelSelect.value = savedModel;
    } else if (models.length > 0) {
        DOM.apiModelSelect.value = models[0].value;
    }

    DOM.apiKeyFormGroup.classList.toggle('hidden', provider === 'official_gemini');
}

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

export function renderApiPresetsDropdown() {
    DOM.apiPresetSelect.innerHTML = '<option value="">選擇要載入的設定檔...</option>';
    state.apiPresets.forEach(preset => {
        const option = document.createElement('option');
        option.value = preset.id;
        option.textContent = preset.name;
        DOM.apiPresetSelect.appendChild(option);
    });
}

export async function loadApiPresetToUI(presetId) {
    const preset = state.apiPresets.find(p => p.id === presetId);
    if (!preset) return;

    DOM.apiProviderSelect.value = preset.provider;
    
    updateModelDropdown();
    await Promise.resolve(); 
    
    DOM.apiModelSelect.value = preset.model;
    DOM.apiKeyInput.value = preset.apiKey;
    DOM.apiStatusIndicator.style.display = 'none';
}

export function toggleModal(modalId, show) {
    document.getElementById(modalId).classList.toggle('hidden', !show);
}

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

export function renderFirstMessageInputs(messages = ['']) {
    DOM.firstMessageList.innerHTML = '';
    const messagesToRender = messages.length > 0 ? messages : [''];
    
    messagesToRender.forEach((msg, index) => {
        const item = document.createElement('div');
        item.className = 'first-message-item';
        item.innerHTML = `
            <textarea class="char-first-message" placeholder="開場白 #${index + 1}" rows="1">${msg}</textarea>
            <button type="button" class="icon-btn-sm danger remove-first-message-btn" title="移除此開場白">
                <i class="fa-solid fa-trash"></i>
            </button>
        `;
        DOM.firstMessageList.appendChild(item);
        const textarea = item.querySelector('textarea');
        textarea.addEventListener('input', () => {
            textarea.style.height = 'auto';
            textarea.style.height = `${textarea.scrollHeight}px`;
        });
        setTimeout(() => {
             textarea.style.height = 'auto';
             textarea.style.height = `${textarea.scrollHeight}px`;
        }, 0);
    });
}

export function renderPromptSetSelector() {
    DOM.promptSetSelect.innerHTML = '';
    state.promptSets.forEach(set => {
        const option = document.createElement('option');
        option.value = set.id;
        option.textContent = set.name;
        DOM.promptSetSelect.appendChild(option);
    });
    if (state.activePromptSetId) {
        DOM.promptSetSelect.value = state.activePromptSetId;
    }
}

export function renderPromptList() {
    const activeSet = getActivePromptSet();
    DOM.promptList.innerHTML = '';

    if (!activeSet || !activeSet.prompts) {
        DOM.promptList.innerHTML = '<li class="list-placeholder">此設定檔沒有可用的提示詞。</li>';
        return;
    }

    activeSet.prompts.forEach(prompt => {
        const item = document.createElement('li');
        item.className = 'prompt-item';
        item.dataset.identifier = prompt.identifier;
        item.setAttribute('draggable', 'true');
        item.innerHTML = `
            <i class="fa-solid fa-grip-vertical prompt-drag-handle" title="按住拖曳以排序"></i>
            <span class="prompt-item-name" title="${prompt.name}">${prompt.name}</span>
            <div class="prompt-item-actions">
                <button class="icon-btn-sm edit-prompt-btn" title="編輯提示詞"><i class="fa-solid fa-pencil"></i></button>
                <div class="prompt-item-toggle ${prompt.enabled ? 'enabled' : ''}"></div>
            </div>
        `;
        DOM.promptList.appendChild(item);
    });
}
