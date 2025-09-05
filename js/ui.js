// js/ui.js
// 這個檔案負責渲染所有使用者介面元件。

import * as DOM from './dom.js';
import { state, tempState } from './state.js';
import { DEFAULT_AVATAR, MODELS } from './constants.js';
import { getActivePromptSet } from './promptManager.js';
import { getActiveLorebook } from './lorebookManager.js';

/**
 * @description 套用所有已啟用的正規表達式規則
 * @param {string} text - AI 回應的原始文字
 * @returns {string} - 經過規則處理後的文字
 */
function applyRegexRules(text) {
    const regexRules = state.globalSettings.regexRules || [];
    const enabledRules = regexRules.filter(rule => rule.enabled);
    let processedText = text;

    for (const rule of enabledRules) {
        try {
            const regex = new RegExp(rule.find, 'gsi');
            processedText = processedText.replace(regex, rule.replace);
        } catch (e) {
            console.warn(`無效的正規表達式規則 [${rule.name}]，已跳過:`, e);
        }
    }
    return processedText;
}

/**
 * @description 渲染「帳號」分頁的內容
 */
export function renderAccountTab() {
    if (state.currentUser) {
        DOM.loginPrompt.classList.add('hidden');
        DOM.userInfoDetails.classList.remove('hidden');
        DOM.userAvatarInSettings.src = state.currentUser.photoURL || DEFAULT_AVATAR;
        DOM.userNameInSettings.textContent = state.currentUser.displayName || '使用者';
    } else {
        DOM.loginPrompt.classList.remove('hidden');
        DOM.userInfoDetails.classList.add('hidden');
    }
}


/**
 * @description 渲染角色列表
 */
export function renderCharacterList() {
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
        item.innerHTML = `
            <div class="char-item-content">
                <i class="fa-solid fa-grip-vertical drag-handle"></i>
                <img src="${char.avatarUrl || DEFAULT_AVATAR}" alt="${char.name}" class="char-item-avatar">
                <div class="character-item-details">
                    <span class="char-item-name">${char.name}</span>
                    ${char.creator ? `<span class="character-item-author">By: ${char.creator}</span>` : ''}
                </div>
            </div>
        `;
        DOM.characterList.appendChild(item);
    });
}

/**
 * @description 顯示角色列表視圖(並隱藏側邊欄)
 */
export function showCharacterListView() {
    DOM.leftPanel.classList.remove('show-chats');
    DOM.leftPanel.classList.remove('mobile-visible');
    DOM.mobileOverlay.classList.add('hidden');
    state.activeCharacterId = null;
}

/**
 * @description 將側邊欄內容切換回角色列表，但不隱藏側邊欄
 */
export function switchPanelToCharacterView() {
    DOM.leftPanel.classList.remove('show-chats');
    state.activeCharacterId = null;
}

/**
 * @description 顯示指定角色的聊天室列表視圖，並更新標頭的愛心狀態
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

        const headerNameContainer = DOM.chatListHeaderName.parentElement;
        headerNameContainer.querySelector('h2').textContent = character.name;

        const heartIcon = DOM.headerLoveChatBtn.querySelector('i');
        DOM.headerLoveChatBtn.classList.toggle('loved', character.loved);
        heartIcon.className = `fa-${character.loved ? 'solid' : 'regular'} fa-heart`;

        renderChatSessionList();
    } catch (error) {
        console.error("顯示聊天室列表時發生錯誤:", error);
        alert("載入聊天室列表時發生錯誤，請檢查主控台。");
        DOM.leftPanel.classList.remove('show-chats');
    }
}

/**
 * @description 渲染指定角色的聊天室列表
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
    
    const provider = state.globalSettings.apiProvider || 'official_gemini';
    const modelId = state.globalSettings.apiModel;
    let modelDisplayName = modelId || '未設定';

    if (modelId && MODELS[provider]) {
        const modelObject = MODELS[provider].find(m => m.value === modelId);
        if (modelObject) {
            modelDisplayName = modelObject.name;
        }
    }
    
    DOM.chatHeaderModelName.textContent = modelDisplayName;
    DOM.chatHeaderModelName.title = modelDisplayName;
    
    renderChatUserPersonaSelector();
    renderChatMessages();
}

/**
 * @description 渲染當前對話的所有訊息
 */
export function renderChatMessages() {
    DOM.chatWindow.innerHTML = '';
    const history = state.chatHistories[state.activeCharacterId]?.[state.activeChatId] || [];
    history.forEach((msg, index) => {
        const contentToDisplay = (msg.role === 'assistant' && Array.isArray(msg.content)) 
            ? msg.content[msg.activeContentIndex] 
            : msg.content;
        displayMessage(contentToDisplay, msg.role, msg.timestamp, index, false, msg.error);
    });
    DOM.chatWindow.scrollTop = DOM.chatWindow.scrollHeight;
}

/**
 * @description 在聊天視窗中顯示單則訊息，並在顯示前套用正規表達式
 * @param {string} text - 訊息內容
 * @param {string} sender - 'user' 或 'assistant'
 * @param {string} timestamp - ISO 格式的時間戳
 * @param {number} index - 訊息在歷史紀錄中的索引
 * @param {boolean} isNew - 是否為剛收到的新訊息
 * @param {string|null} error - 錯誤訊息
 * @returns {HTMLElement} - 建立的訊息 DOM 元素
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

    if (tempState.isScreenshotMode && tempState.selectedMessageIndices.includes(index)) {
        row.classList.add('selected');
    }
    
    const formattedTimestamp = new Date(timestamp).toLocaleString('zh-TW', { hour12: false, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });

    let messageActionsHTML = '';
    const msgData = state.chatHistories[state.activeCharacterId]?.[state.activeChatId]?.[index];

    if (sender === 'assistant' && msgData) {
        if (msgData.content.length > 1) {
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
    
    let contentToRender = text;
    if (sender === 'assistant') {
        contentToRender = applyRegexRules(text);
    }

    contentToRender = (contentToRender || '').replace(/(「[^」]*」|『[^』]*』)/g, '<span class="quoted-text">$1</span>');
    const bubble = row.querySelector('.chat-bubble');
    bubble.innerHTML = marked.parse(contentToRender || '');

    DOM.chatWindow.appendChild(row);
    if (isNew) {
        DOM.chatWindow.scrollTop = DOM.chatWindow.scrollHeight;
    }
    return row;
}

/**
 * @description 將 state 中的全域設定載入到 UI 中
 */
export function loadGlobalSettingsToUI() {
    // 保存當前活躍狀態
    const savedActiveCharacterId = state.activeCharacterId;
    const savedActiveChatId = state.activeChatId;

    renderAccountTab();

    const settings = state.globalSettings;

    const officialGeminiOption = DOM.apiProviderSelect.querySelector('option[value="official_gemini"]');
    if (officialGeminiOption) {
        officialGeminiOption.hidden = !state.isPremiumUser;
    }

    DOM.apiProviderSelect.value = settings.apiProvider || 'openai';
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
    DOM.summarizationPromptInput.value = settings.summarizationPrompt || '';

    renderUserPersonaList();
    renderActiveUserPersonaSelector();
    renderApiPresetsDropdown();
    renderPromptSetSelector();
    renderPromptList();
    renderLorebookSelector();
    renderLorebookEntryList();
    renderRegexRulesList();

    // 恢復活躍狀態
    state.activeCharacterId = savedActiveCharacterId;
    state.activeChatId = savedActiveChatId;

    DOM.settingsTabsContainer.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    DOM.globalSettingsModal.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    DOM.settingsTabsContainer.querySelector('[data-tab="account-tab"]').classList.add('active');
    DOM.accountTab.classList.add('active');
}
/**
 * @description 根據 API 供應商更新模型下拉選單
 */
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

    if (DOM.apiProviderSelect.options[DOM.apiProviderSelect.selectedIndex].hidden) {
        DOM.apiProviderSelect.value = 'openai';
    }

    DOM.apiKeyFormGroup.classList.toggle('hidden', provider === 'official_gemini');
}

/**
 * @description 渲染使用者角色列表 (在設定中)
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
 * @description 渲染預設使用者角色的下拉選單
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
 * @description 渲染 API 設定檔下拉選單
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
 * @description 將選擇的 API 設定檔載入到 UI
 * @param {string} presetId - 設定檔 ID
 */
export async function loadApiPresetToUI(presetId) {
    const preset = state.apiPresets.find(p => p.id === presetId);
    if (!preset) return;

    DOM.apiProviderSelect.value = preset.provider;
    
    updateModelDropdown();
    await new Promise(resolve => setTimeout(resolve, 0));
    
    DOM.apiModelSelect.value = preset.model;
    DOM.apiKeyInput.value = preset.apiKey;
    DOM.apiStatusIndicator.style.display = 'none';
}

/**
 * @description 開關 Modal
 * @param {string} modalId - Modal 的 ID
 * @param {boolean} show - true 為顯示, false 為隱藏
 */
export function toggleModal(modalId, show) {
    document.getElementById(modalId).classList.toggle('hidden', !show);
}

/**
 * @description 設定 AI 是否正在生成中的狀態
 * @param {boolean} isGenerating - 是否正在生成
 * @param {boolean} [changeMainButton=true] - 是否改變主送出按鈕的狀態
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

/**
 * @description 渲染角色編輯器中的「第一句話」輸入框
 * @param {Array<string>} [messages=['']] - 開場白訊息陣列
 */
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

/**
 * @description 渲染提示詞庫下拉選單
 */
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

/**
 * @description 渲染提示詞列表
 */
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
        item.innerHTML = `
            <i class="fa-solid fa-grip-vertical drag-handle"></i>
            <span class="prompt-item-name" title="${prompt.name}">${prompt.name}</span>
            <div class="prompt-item-actions">
                <button class="icon-btn-sm edit-prompt-btn" title="編輯提示詞"><i class="fa-solid fa-pencil"></i></button>
                <div class="prompt-item-toggle ${prompt.enabled ? 'enabled' : ''}"></div>
            </div>
        `;
        DOM.promptList.appendChild(item);
    });
}

/**
 * @description 渲染世界書下拉選單
 */
export function renderLorebookSelector() {
    DOM.lorebookSelect.innerHTML = '';
    state.lorebooks.forEach(book => {
        const option = document.createElement('option');
        option.value = book.id;
        option.textContent = book.name;
        DOM.lorebookSelect.appendChild(option);
    });
    if (state.activeLorebookId) {
        DOM.lorebookSelect.value = state.activeLorebookId;
    } else if (state.lorebooks.length > 0) {
        DOM.lorebookSelect.value = state.lorebooks[0].id;
    }
}

/**
 * @description 渲染世界書條目列表
 */
export function renderLorebookEntryList() {
    const activeBook = getActiveLorebook();
    DOM.lorebookEntryList.innerHTML = '';

    if (!activeBook || !activeBook.entries || activeBook.entries.length === 0) {
        DOM.lorebookEntryList.innerHTML = '<li class="list-placeholder">此世界書沒有條目。</li>';
        return;
    }

    activeBook.entries.forEach(entry => {
        const item = document.createElement('li');
        item.className = 'prompt-item'; // 重用 prompt-item 樣式
        item.dataset.id = entry.id;
        item.innerHTML = `
            <span class="prompt-item-name" title="${entry.name}">${entry.name}</span>
            <div class="prompt-item-actions">
                <button class="icon-btn-sm edit-lorebook-entry-btn" title="編輯條目"><i class="fa-solid fa-pencil"></i></button>
                <div class="prompt-item-toggle ${entry.enabled ? 'enabled' : ''}"></div>
            </div>
        `;
        DOM.lorebookEntryList.appendChild(item);
    });
}


/**
 * @description 渲染正規表達式規則列表 (摺疊式)
 */
export function renderRegexRulesList() {
    DOM.regexRulesList.innerHTML = '';
    const rules = state.globalSettings.regexRules || [];
    if (rules.length === 0) {
        DOM.regexRulesList.innerHTML = '<li class="list-placeholder">尚無規則</li>';
        return;
    }

    rules.forEach(rule => {
        const item = document.createElement('li');
        item.className = 'regex-rule-item';
        item.dataset.id = rule.id;
        item.innerHTML = `
            <div class="regex-rule-header">
                <button class="icon-btn-sm regex-expand-btn"><i class="fa-solid fa-chevron-down"></i></button>
                <input type="text" class="regex-name-input" placeholder="規則名稱" value="${rule.name}">
                <div class="prompt-item-toggle ${rule.enabled ? 'enabled' : ''}" title="啟用/停用此規則"></div>
                <button class="icon-btn-sm danger delete-regex-rule-btn" title="刪除此規則"><i class="fa-solid fa-trash"></i></button>
            </div>
            <div class="regex-rule-details">
                <div class="form-group">
                    <label>尋找 (正規表達式)</label>
                    <textarea class="regex-find-input" rows="2">${rule.find}</textarea>
                </div>
                <div class="form-group">
                    <label>取代為</label>
                    <textarea class="regex-replace-input" rows="2">${rule.replace}</textarea>
                </div>
            </div>
        `;
        DOM.regexRulesList.appendChild(item);
    });
}

