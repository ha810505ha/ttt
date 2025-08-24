// js/handlers.js
// 這個檔案存放所有的事件處理函式 (event handlers)。

import * as DOM from './dom.js';
import { state, tempState, saveState } from './state.js';
import { callApi, buildApiMessages, buildApiMessagesFromHistory, testApiConnection } from './api.js';
import { 
    renderCharacterList, renderChatSessionList, renderActiveChat, renderChatMessages, 
    displayMessage, toggleModal, setGeneratingState, showCharacterListView, loadGlobalSettingsToUI
} from './ui.js';
import { DEFAULT_AVATAR, DEFAULT_SUMMARY_PROMPT } from './constants.js';
import { handleImageUpload, exportChatAsJsonl, exportChatAsImage } from './utils.js';

// ===================================================================================
// [新增] API 連線測試
// ===================================================================================

/**
 * @description 處理測試 API 連線的按鈕點擊事件
 */
export async function handleTestApiConnection() {
    const provider = DOM.apiProviderSelect.value;
    const model = DOM.apiModelSelect.value;
    const apiKey = DOM.apiKeyInput.value.trim();

    if (!apiKey) {
        DOM.apiStatusIndicator.className = 'error';
        DOM.apiStatusIndicator.textContent = '請先輸入 API 金鑰！';
        return;
    }

    DOM.apiStatusIndicator.className = 'testing';
    DOM.apiStatusIndicator.textContent = '測試中...';
    DOM.testApiBtn.disabled = true;

    try {
        await testApiConnection(provider, apiKey, model);
        DOM.apiStatusIndicator.className = 'success';
        DOM.apiStatusIndicator.textContent = `連線成功！已連接至模型：${model}`;
    } catch (error) {
        console.error("API 連線測試失敗:", error);
        DOM.apiStatusIndicator.className = 'error';
        DOM.apiStatusIndicator.textContent = `連線失敗: ${error.message}`;
    } finally {
        DOM.testApiBtn.disabled = false;
    }
}


// ===================================================================================
// 聊天核心邏輯 (Core Chat Logic)
// ===================================================================================

/**
 * @description 發送訊息或重試發送失敗的訊息
 * @param {Object|null} userMessage - 如果是重試，則為要重試的訊息物件
 * @param {number|null} messageIndex - 如果是重試，則為訊息的索引
 */
export async function sendMessage(userMessage = null, messageIndex = null) {
    if (!checkApiKey('請先設定 API 金鑰才能開始對話')) return;
    if (!state.activeCharacterId || !state.activeChatId) return;
    
    const isRetry = messageIndex !== null;
    const messageText = isRetry ? userMessage.content : DOM.messageInput.value.trim();
    if (messageText === '') return;

    setGeneratingState(true);

    const history = state.chatHistories[state.activeCharacterId][state.activeChatId];
    let currentUserMessageIndex;

    if (isRetry) {
        currentUserMessageIndex = messageIndex;
        delete history[currentUserMessageIndex].error;
    } else {
        const timestamp = new Date().toISOString();
        history.push({ role: 'user', content: messageText, timestamp: timestamp });
        currentUserMessageIndex = history.length - 1;
    }
    
    renderChatMessages();
    DOM.chatWindow.scrollTop = DOM.chatWindow.scrollHeight;

    if (!isRetry) {
        DOM.messageInput.value = '';
        DOM.messageInput.style.height = 'auto';
        DOM.messageInput.focus();
    }

    const thinkingBubble = displayMessage('...', 'assistant', new Date().toISOString(), history.length, true);
    
    try {
        const messagesForApi = buildApiMessages();
        const aiResponse = await callApi(messagesForApi);
        const aiTimestamp = new Date().toISOString();
        
        history.push({ role: 'assistant', content: [aiResponse], activeContentIndex: 0, timestamp: aiTimestamp });
        
        thinkingBubble.remove();
        saveState();
        renderChatMessages();
    } catch (error) {
        thinkingBubble.remove();
        if (error.name !== 'AbortError') {
            console.error("API 錯誤:", error);
            const errorMessage = `發生錯誤: ${error.message}`;
            history[currentUserMessageIndex].error = errorMessage;
            saveState();
            renderChatMessages();
        } else {
             renderChatMessages();
        }
    } finally {
        setGeneratingState(false);
    }
}

/**
 * @description 重試發送失敗的使用者訊息
 * @param {number} messageIndex - 訊息索引
 */
export function retryMessage(messageIndex) {
    const history = state.chatHistories[state.activeCharacterId][state.activeChatId];
    const messageToRetry = history[messageIndex];

    if (messageToRetry && messageToRetry.role === 'user' && messageToRetry.error) {
        sendMessage(messageToRetry, messageIndex);
    }
}

/**
 * @description 重新生成 AI 的回應
 * @param {number} messageIndex - AI 訊息在歷史紀錄中的索引
 */
export async function regenerateResponse(messageIndex) {
    if (!checkApiKey('請先設定 API 金鑰才能重新生成')) return;
    if (!state.activeCharacterId || !state.activeChatId) return;

    const history = state.chatHistories[state.activeCharacterId][state.activeChatId];
    const targetMessage = history[messageIndex];

    if (!targetMessage || targetMessage.role !== 'assistant') return;

    const contextHistory = history.slice(0, messageIndex);

    const targetRow = DOM.chatWindow.querySelectorAll('.message-row')[messageIndex];
    if (!targetRow) return;

    const regenerateBtn = targetRow.querySelector('.regenerate-btn-sm');
    if (regenerateBtn) {
        regenerateBtn.disabled = true;
        regenerateBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>生成中...';
    }
    setGeneratingState(true, false);

    try {
        const messagesForApi = buildApiMessagesFromHistory(contextHistory);
        const aiResponse = await callApi(messagesForApi);

        targetMessage.content.push(aiResponse);
        targetMessage.activeContentIndex = targetMessage.content.length - 1;

        saveState();
        renderChatMessages();
    } catch (error) {
         if (error.name !== 'AbortError') {
            alert(`重新生成失敗: ${error.message}`);
            console.error("重新生成 API 錯誤:", error);
        }
    } finally {
        setGeneratingState(false, false);
        if (regenerateBtn) {
            renderChatMessages();
        }
    }
}

/**
 * @description 切換 AI 回應的不同版本
 * @param {number} messageIndex - 訊息索引
 * @param {number} direction - 方向 (-1 為上一個, 1 為下一個)
 */
export function switchVersion(messageIndex, direction) {
    const history = state.chatHistories[state.activeCharacterId][state.activeChatId];
    const msg = history[messageIndex];
    const newIndex = msg.activeContentIndex + direction;

    if (newIndex >= 0 && newIndex < msg.content.length) {
        msg.activeContentIndex = newIndex;
        saveState();
        renderChatMessages();
    }
}

/**
 * @description 中斷正在進行的 API 請求
 */
export function handleStopGeneration() {
    if (tempState.apiCallController) {
        tempState.apiCallController.abort();
        tempState.apiCallController = null;
    }
    setGeneratingState(false);
}

// ===================================================================================
// 聊天與角色管理 (Chat & Character Management)
// ===================================================================================

/**
 * @description 切換到指定的聊天室
 * @param {string} chatId - 聊天室 ID
 */
export function switchChat(chatId) {
    if (state.activeChatId === chatId) return;

    state.activeChatId = chatId;
    saveState();
    renderChatSessionList();
    renderActiveChat();
}

/**
 * @description 為目前角色開啟一個新的聊天
 */
export function handleAddNewChat() {
    if (!state.activeCharacterId) return;
    const char = state.characters.find(c => c.id === state.activeCharacterId);
    if (!char) return;

    const newChatId = `chat_${Date.now()}`;
    if (!state.chatHistories[state.activeCharacterId]) {
        state.chatHistories[state.activeCharacterId] = {};
        state.chatMetadatas[state.activeCharacterId] = {};
    }
    state.chatHistories[state.activeCharacterId][newChatId] = [];
    state.chatMetadatas[state.activeCharacterId][newChatId] = { name: '', pinned: false, notes: '', userPersonaId: state.activeUserPersonaId };

    if (char.firstMessage) {
        const user = state.userPersonas.find(p => p.id === state.activeUserPersonaId) || {};
        const userName = user.name || 'User';
        const formattedFirstMessage = char.firstMessage.replace(/{{char}}/g, char.name).replace(/{{user}}/g, userName);

        state.chatHistories[state.activeCharacterId][newChatId].push({
            role: 'assistant', 
            content: [formattedFirstMessage], 
            activeContentIndex: 0,
            timestamp: new Date().toISOString()
        });
    }
    
    state.activeChatId = newChatId;
    saveState();
    renderChatSessionList();
    renderActiveChat();
}

/**
 * @description 刪除當前對話
 */
export function handleDeleteCurrentChat() {
    if (!state.activeCharacterId || !state.activeChatId) return;
    if (confirm('確定要永久刪除這個對話嗎？此操作無法復原。')) {
        delete state.chatHistories[state.activeCharacterId][state.activeChatId];
        delete state.chatMetadatas[state.activeCharacterId][state.activeChatId];
        if (state.longTermMemories[state.activeCharacterId]) {
            delete state.longTermMemories[state.activeCharacterId][state.activeChatId];
        }
        state.activeChatId = null;
        saveState();
        renderChatSessionList();
        renderActiveChat();
    }
}

/**
 * @description 處理儲存聊天備註
 */
export function handleSaveNote() {
    if (!state.activeCharacterId || !state.activeChatId) return;
    const metadata = state.chatMetadatas[state.activeCharacterId]?.[state.activeChatId];
    if (metadata) {
        metadata.notes = DOM.chatNotesInput.value.trim();
        saveState();
    }
}

/**
 * @description 開啟重新命名對話的彈窗
 * @param {string} chatId - 聊天室 ID
 */
export function openRenameModal(chatId) {
    tempState.renamingChatId = chatId;
    const metadata = state.chatMetadatas[state.activeCharacterId]?.[chatId] || {};
    DOM.renameChatInput.value = metadata.name || '';
    toggleModal('rename-chat-modal', true);
    DOM.renameChatInput.focus();
}

/**
 * @description 儲存新的對話名稱
 */
export function handleSaveChatName() {
    if (!tempState.renamingChatId || !state.activeCharacterId) return;
    
    const metadata = state.chatMetadatas[state.activeCharacterId][tempState.renamingChatId];
    if(metadata) {
        metadata.name = DOM.renameChatInput.value.trim();
        saveState();
        renderChatSessionList();
    }
    toggleModal('rename-chat-modal', false);
    tempState.renamingChatId = null;
}

/**
 * @description 切換對話的釘選狀態
 * @param {string} chatId - 聊天室 ID
 */
export function handleTogglePinChat(chatId) {
    if (!state.activeCharacterId) return;
    
    const metadata = state.chatMetadatas[state.activeCharacterId][chatId];
    if(metadata) {
        metadata.pinned = !metadata.pinned;
        saveState();
        renderChatSessionList();
    }
}

// ===================================================================================
// 角色編輯器 (Character Editor)
// ===================================================================================

/**
 * @description 開啟角色編輯器 (新增或編輯)
 * @param {string|null} charId - 要編輯的角色 ID，如果為 null 則是新增
 */
export function openCharacterEditor(charId = null) {
    tempState.editingCharacterId = charId;
    if (charId) {
        const char = state.characters.find(c => c.id === charId);
        DOM.charEditorTitle.textContent = '編輯角色';
        DOM.charAvatarPreview.src = char.avatarUrl || DEFAULT_AVATAR;
        DOM.charNameInput.value = char.name;
        DOM.charDescriptionInput.value = char.description || '';
        DOM.charFirstMessageInput.value = char.firstMessage || '';
        DOM.charExampleDialogueInput.value = char.exampleDialogue || '';
    } else {
        DOM.charEditorTitle.textContent = '新增角色';
        DOM.charAvatarPreview.src = DEFAULT_AVATAR;
        DOM.charNameInput.value = '';
        DOM.charDescriptionInput.value = '';
        DOM.charFirstMessageInput.value = '';
        DOM.charExampleDialogueInput.value = '';
    }
    toggleModal('character-editor-modal', true);
}

/**
 * @description 儲存角色編輯器的變更
 */
export function handleSaveCharacter() {
    if (tempState.editingCharacterId && !confirm('儲存後會覆蓋原先內容，是否繼續儲存?')) {
        return;
    }

    const charData = {
        name: DOM.charNameInput.value.trim(),
        avatarUrl: DOM.charAvatarPreview.src,
        description: DOM.charDescriptionInput.value.trim(),
        firstMessage: DOM.charFirstMessageInput.value.trim(),
        exampleDialogue: DOM.charExampleDialogueInput.value.trim(),
    };
    if (!charData.name) { alert('角色名稱不能為空！'); return; }

    if (tempState.editingCharacterId) {
        const charIndex = state.characters.findIndex(c => c.id === tempState.editingCharacterId);
        state.characters[charIndex] = { ...state.characters[charIndex], ...charData };
    } else {
        const newChar = { id: `char_${Date.now()}`, ...charData };
        state.characters.push(newChar);
        state.chatHistories[newChar.id] = {};
        state.chatMetadatas[newChar.id] = {};
        state.activeCharacterId = newChar.id;
        handleAddNewChat();
    }
    saveState();
    renderCharacterList();
    if (DOM.leftPanel.classList.contains('show-chats')) {
        const character = state.characters.find(c => c.id === state.activeCharacterId);
        DOM.chatListHeaderName.textContent = character.name;
    }
    toggleModal('character-editor-modal', false);
}

/**
 * @description 刪除當前選定的角色
 */
export function handleDeleteActiveCharacter() {
    const charIdToDelete = state.activeCharacterId;
    if (!charIdToDelete) return;

    const charToDelete = state.characters.find(c => c.id === charIdToDelete);
    if (!charToDelete) return;

    if (confirm(`確定要刪除角色「${charToDelete.name}」嗎？該角色的所有對話紀錄將一併刪除。`)) {
        state.characters = state.characters.filter(c => c.id !== charIdToDelete);
        delete state.chatHistories[charIdToDelete];
        delete state.longTermMemories[charIdToDelete];
        delete state.chatMetadatas[charIdToDelete];
        
        state.activeCharacterId = null;
        state.activeChatId = null;
        
        saveState();
        
        showCharacterListView(); 
        renderActiveChat();
        renderCharacterList();
    }
}

// ===================================================================================
// 訊息編輯與操作 (Message Editing & Actions)
// ===================================================================================

/**
 * @description 讓指定的訊息變成可編輯狀態
 * @param {HTMLElement} row - 訊息的 DOM 元素
 * @param {number} index - 訊息索引
 */
export function makeMessageEditable(row, index) {
    const currentlyEditing = document.querySelector('.is-editing');
    if (currentlyEditing) { 
        renderChatMessages();
    }

    const bubble = row.querySelector('.chat-bubble');
    const bubbleContainer = row.querySelector('.bubble-container');
    const msg = state.chatHistories[state.activeCharacterId][state.activeChatId][index];
    const originalText = (msg.role === 'assistant') ? msg.content[msg.activeContentIndex] : msg.content;
    
    row.classList.add('is-editing');
    bubble.style.display = 'none';
    row.querySelector('.message-timestamp').style.display = 'none';
    if (row.querySelector('.message-actions')) {
        row.querySelector('.message-actions').style.display = 'none';
    }

    const editContainer = document.createElement('div');
    editContainer.className = 'edit-container';
    editContainer.style.width = window.getComputedStyle(bubble).width;
    editContainer.style.maxWidth = '100%';
    editContainer.innerHTML = `
        <textarea class="edit-textarea">${originalText}</textarea>
        <div class="edit-actions">
            <button class="icon-btn delete-btn" title="刪除訊息"><i class="fa-solid fa-trash"></i></button>
            <button class="action-btn secondary edit-cancel-btn">取消</button>
            <button class="action-btn primary edit-save-btn">儲存</button>
        </div>
    `;
    bubbleContainer.appendChild(editContainer);
    
    const textarea = bubbleContainer.querySelector('.edit-textarea');
    const autoResize = () => { textarea.style.height = 'auto'; textarea.style.height = `${textarea.scrollHeight}px`; };
    textarea.addEventListener('input', autoResize);
    autoResize();
    textarea.focus();
    textarea.selectionStart = textarea.selectionEnd = textarea.value.length;

    bubbleContainer.querySelector('.edit-save-btn').addEventListener('click', (e) => { e.stopPropagation(); saveMessageEdit(index, textarea.value); });
    bubbleContainer.querySelector('.edit-cancel-btn').addEventListener('click', (e) => { e.stopPropagation(); renderChatMessages(); });
    bubbleContainer.querySelector('.delete-btn').addEventListener('click', (e) => { e.stopPropagation(); handleDeleteMessage(index); });
}

/**
 * @description 儲存被編輯過的訊息
 * @param {number} index - 訊息索引
 * @param {string} newText - 新的訊息內容
 */
function saveMessageEdit(index, newText) {
    const msg = state.chatHistories[state.activeCharacterId][state.activeChatId][index];
    if (msg.role === 'assistant') {
        msg.content[msg.activeContentIndex] = newText.trim();
    } else {
        msg.content = newText.trim();
    }
    saveState();
    renderChatMessages();
}

/**
 * @description 刪除指定的訊息
 * @param {number} index - 訊息索引
 */
function handleDeleteMessage(index) {
    if (confirm('您確定要永久刪除這則訊息嗎？')) {
        state.chatHistories[state.activeCharacterId][state.activeChatId].splice(index, 1);
        saveState();
        renderChatMessages();
    }
}

// ===================================================================================
// 全域與提示詞設定 (Global & Prompt Settings)
// ===================================================================================

/**
 * @description 儲存全域設定
 */
export function handleSaveGlobalSettings() {
    state.globalSettings = {
        apiProvider: DOM.apiProviderSelect.value,
        apiModel: DOM.apiModelSelect.value,
        apiKey: DOM.apiKeyInput.value.trim(),
        temperature: DOM.temperatureValue.value,
        topP: DOM.topPValue.value,
        repetitionPenalty: DOM.repetitionPenaltyValue.value,
        contextSize: DOM.contextSizeInput.value,
        maxTokens: DOM.maxTokensValue.value,
    };
    saveState();
    toggleModal('global-settings-modal', false);
    renderActiveChat();
}

/**
 * @description 儲存提示詞設定
 */
export function handleSavePromptSettings() {
    state.promptSettings = {
        scenario: DOM.promptScenarioInput.value.trim(),
        jailbreak: DOM.promptJailbreakInput.value.trim(),
        summarizationPrompt: DOM.promptSummarizationInput.value.trim()
    };
    saveState();
    alert('提示詞設定已儲存！');
    showCharacterListView();
}

// ===================================================================================
// 使用者角色 (User Persona)
// ===================================================================================

/**
 * @description 開啟使用者角色編輯器
 * @param {string|null} personaId - 要編輯的角色 ID，null 為新增
 */
export function openUserPersonaEditor(personaId = null) {
    tempState.editingUserPersonaId = personaId;
    if (personaId) {
        const persona = state.userPersonas.find(p => p.id === personaId);
        DOM.userPersonaEditorTitle.textContent = '編輯使用者角色';
        DOM.userPersonaAvatarPreview.src = persona.avatarUrl || DEFAULT_AVATAR;
        DOM.userPersonaNameInput.value = persona.name;
        DOM.userPersonaDescriptionInput.value = persona.description || '';
    } else {
        DOM.userPersonaEditorTitle.textContent = '新增使用者角色';
        DOM.userPersonaAvatarPreview.src = DEFAULT_AVATAR;
        DOM.userPersonaNameInput.value = '';
        DOM.userPersonaDescriptionInput.value = '';
    }
    toggleModal('user-persona-editor-modal', true);
}

/**
 * @description 儲存使用者角色
 */
export function handleSaveUserPersona() {
    const personaData = {
        name: DOM.userPersonaNameInput.value.trim(),
        avatarUrl: DOM.userPersonaAvatarPreview.src,
        description: DOM.userPersonaDescriptionInput.value.trim(),
    };
    if (!personaData.name) { alert('角色名稱不能為空！'); return; }

    if (tempState.editingUserPersonaId) {
        const personaIndex = state.userPersonas.findIndex(p => p.id === tempState.editingUserPersonaId);
        state.userPersonas[personaIndex] = { ...state.userPersonas[personaIndex], ...personaData };
    } else {
        const newPersona = { id: `user_${Date.now()}`, ...personaData };
        state.userPersonas.push(newPersona);
    }
    saveState();
    loadGlobalSettingsToUI();
    toggleModal('user-persona-editor-modal', false);
}

/**
 * @description 刪除使用者角色
 * @param {string} personaId - 角色 ID
 */
export function handleDeleteUserPersona(personaId) {
    if (state.userPersonas.length <= 1) {
        alert('至少需要保留一個使用者角色。');
        return;
    }
    if (confirm('確定要刪除這個使用者角色嗎？')) {
        state.userPersonas = state.userPersonas.filter(p => p.id !== personaId);
        if (state.activeUserPersonaId === personaId) {
            state.activeUserPersonaId = state.userPersonas[0].id;
        }
        saveState();
        loadGlobalSettingsToUI();
    }
}

/**
 * @description 處理聊天中切換使用者角色的事件
 * @param {Event} e - change 事件物件
 */
export function handleChatPersonaChange(e) {
    const newPersonaId = e.target.value;
    if (state.activeCharacterId && state.activeChatId) {
        state.chatMetadatas[state.activeCharacterId][state.activeChatId].userPersonaId = newPersonaId;
        saveState();
        renderChatMessages();
    }
}

// ===================================================================================
// 長期記憶 (Long-term Memory)
// ===================================================================================

/**
 * @description 開啟長期記憶編輯器
 */
export function openMemoryEditor() {
    if (!state.activeCharacterId || !state.activeChatId) {
        alert('請先選擇一個對話才能查看記憶。');
        return;
    }
    const memory = state.longTermMemories[state.activeCharacterId]?.[state.activeChatId] || '尚無長期記憶。';
    DOM.memoryEditorTextarea.value = memory;
    toggleModal('memory-editor-modal', true);
}

/**
 * @description 儲存手動編輯的長期記憶
 */
export function handleSaveMemory() {
    if (!state.activeCharacterId || !state.activeChatId) return;

    if (!state.longTermMemories[state.activeCharacterId]) {
        state.longTermMemories[state.activeCharacterId] = {};
    }
    state.longTermMemories[state.activeCharacterId][state.activeChatId] = DOM.memoryEditorTextarea.value.trim();
    saveState();
    toggleModal('memory-editor-modal', false);
    alert('長期記憶已儲存！');
}

/**
 * @description 透過 API 自動更新長期記憶
 */
export async function handleUpdateMemory() {
    if (!checkApiKey('請先設定 API 金鑰才能更新記憶')) return;
    if (!state.activeCharacterId || !state.activeChatId) { alert('請先選擇一個對話。'); return; }
    
    const history = state.chatHistories[state.activeCharacterId][state.activeChatId];
    if (history.length < 4) { alert('對話太短，無法生成有意義的記憶。'); return; }
    
    DOM.updateMemoryBtn.textContent = '記憶生成中...';
    DOM.updateMemoryBtn.disabled = true;
    setGeneratingState(true, false);
    
    try {
        const conversationText = history.map(m => `${m.role}: ${m.role === 'assistant' ? m.content[m.activeContentIndex] : m.content}`).join('\n');
        const userPrompt = state.promptSettings.summarizationPrompt || DEFAULT_SUMMARY_PROMPT;
        const summaryPrompt = userPrompt.replace('{{conversation}}', conversationText);
        
        const provider = state.globalSettings.apiProvider || 'openai';
        let summaryMessages;
        if (provider === 'google') {
            summaryMessages = [{ role: 'user', parts: [{ text: summaryPrompt }] }];
        } else if (provider === 'anthropic') {
            summaryMessages = { system: 'You are a summarization expert.', messages: [{ role: 'user', content: summaryPrompt }] };
        } else {
            summaryMessages = [{ role: 'system', content: 'You are a summarization expert.' }, { role: 'user', content: summaryPrompt }];
        }

        const summary = await callApi(summaryMessages, true);
        
        if (!state.longTermMemories[state.activeCharacterId]) {
            state.longTermMemories[state.activeCharacterId] = {};
        }
        state.longTermMemories[state.activeCharacterId][state.activeChatId] = summary;
        saveState();
        alert('長期記憶已更新！');
    } catch (error) {
        if (error.name !== 'AbortError') {
            alert(`記憶更新失敗: ${error.message}`);
        }
    } finally {
        DOM.updateMemoryBtn.textContent = '更新記憶';
        DOM.updateMemoryBtn.disabled = false;
        setGeneratingState(false, false);
    }
}

// ===================================================================================
// 匯入/匯出 (Import/Export)
// ===================================================================================

/**
 * @description 開啟匯出對話的彈窗
 */
export function openExportModal() {
  if (!state.activeCharacterId || !state.activeChatId) {
    alert('請先選擇角色並開啟一個對話。');
    return;
  }

  DOM.exportFormatJsonl.checked = true;
  DOM.exportFormatPng.checked = false;
  DOM.exportRangeSelector.classList.add('hidden');

  const total = DOM.chatWindow.querySelectorAll('.message-row').length;
  const defaultCount = Math.min(20, Math.max(1, total || 1));

  DOM.exportMessageCountSlider.min = '1';
  DOM.exportMessageCountSlider.max = String(Math.max(1, total || 50));
  DOM.exportMessageCountSlider.value = String(defaultCount);
  DOM.exportRangeLabel.textContent = `匯出最近的 ${defaultCount} 則訊息`;

  toggleModal('export-chat-modal', true);
}

/**
 * @description 確認並執行匯出
 */
export function handleConfirmExport() {
  if (!state.activeCharacterId || !state.activeChatId) return;

  if (DOM.exportFormatPng.checked) {
    const total = DOM.chatWindow.querySelectorAll('.message-row').length;
    if (total === 0) { alert('沒有對話可以匯出。'); return; }

    const count = parseInt(DOM.exportMessageCountSlider.value, 10);
    const endIndex = total - 1;
    const startIndex = Math.max(0, endIndex - (count - 1));
    exportChatAsImage(startIndex, endIndex);
  } else {
    exportChatAsJsonl();
  }
  toggleModal('export-chat-modal', false);
}

// ===================================================================================
// 輔助函式 (Helpers)
// ===================================================================================

/**
 * @description 檢查 API 金鑰是否存在，若否則提示使用者設定
 * @param {string} promptText - 提示文字
 * @returns {boolean} - 是否已設定金鑰
 */
function checkApiKey(promptText = '請在此填入您的 API 金鑰') {
    if (!state.globalSettings.apiKey) {
        loadGlobalSettingsToUI();
        toggleModal('global-settings-modal', true);
        DOM.apiKeyInput.focus();
        DOM.apiKeyInput.style.borderColor = 'var(--danger-color)';
        DOM.apiKeyInput.placeholder = promptText;
        DOM.apiKeyInput.addEventListener('input', () => {
            DOM.apiKeyInput.style.borderColor = '';
            DOM.apiKeyInput.placeholder = 'API 金鑰';
        }, { once: true });
        return false;
    }
    return true;
}
