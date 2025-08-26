// js/handlers.js
// 這個檔案存放所有的事件處理函式 (event handlers)。

import * as DOM from './dom.js';
import { 
    state, tempState, saveSettings, saveCharacter, deleteCharacter, saveUserPersona, deleteUserPersona,
    saveAllChatHistoriesForChar, saveAllLongTermMemoriesForChar, saveAllChatMetadatasForChar,
    deleteAllChatDataForChar, loadChatDataForCharacter
} from './state.js';
import { callApi, buildApiMessages, buildApiMessagesFromHistory, testApiConnection } from './api.js';
import { 
    renderCharacterList, renderChatSessionList, renderActiveChat, renderChatMessages, 
    displayMessage, toggleModal, setGeneratingState, showCharacterListView, loadGlobalSettingsToUI,
    renderApiPresetsDropdown, loadApiPresetToUI
} from './ui.js';
import { DEFAULT_AVATAR, DEFAULT_SUMMARY_PROMPT, DEFAULT_SCENARIO_PROMPT, DEFAULT_JAILBREAK_PROMPT } from './constants.js';
import { handleImageUpload, exportChatAsJsonl, exportChatAsImage, applyTheme } from './utils.js';

// ===================================================================================
// 使用者認證 (Authentication)
// ===================================================================================

/**
 * @description 處理使用者登入
 */
export function handleLogin() {
    const provider = new firebase.auth.GoogleAuthProvider();
    firebase.auth().signInWithPopup(provider).catch(error => {
        console.error("Google 登入失敗:", error);
        alert(`登入失敗: ${error.message}`);
    });
}

/**
 * @description 處理使用者登出
 */
export function handleLogout() {
    firebase.auth().signOut().catch(error => {
        console.error("登出失敗:", error);
        alert(`登出失敗: ${error.message}`);
    });
}

// ===================================================================================
// API 連線與設定檔
// ===================================================================================

export async function handleTestApiConnection() {
    const provider = DOM.apiProviderSelect.value;
    const model = DOM.apiModelSelect.value;
    const apiKey = DOM.apiKeyInput.value.trim();

    if (provider !== 'official_gemini' && !apiKey) {
        DOM.apiStatusIndicator.className = 'error';
        DOM.apiStatusIndicator.textContent = '請先輸入 API 金鑰！';
        DOM.apiStatusIndicator.style.display = 'block';
        return;
    }

    DOM.apiStatusIndicator.className = 'testing';
    DOM.apiStatusIndicator.textContent = '測試中...';
    DOM.apiStatusIndicator.style.display = 'block';
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

export async function handleSaveApiPreset() {
    const presetName = prompt('請為這個 API 設定檔命名：');
    if (!presetName || presetName.trim() === '') {
        alert('名稱不能為空！');
        return;
    }

    const newPreset = {
        id: `preset_${Date.now()}`,
        name: presetName.trim(),
        provider: DOM.apiProviderSelect.value,
        model: DOM.apiModelSelect.value,
        apiKey: DOM.apiKeyInput.value.trim(),
    };

    state.apiPresets.push(newPreset);
    await saveSettings();
    renderApiPresetsDropdown();
    DOM.apiPresetSelect.value = newPreset.id; // 自動選中剛儲存的
    alert(`設定檔 "${presetName}" 已儲存！`);
}

export function handleLoadApiPreset() {
    const presetId = DOM.apiPresetSelect.value;
    if (!presetId) return;
    loadApiPresetToUI(presetId);
}

export async function handleDeleteApiPreset() {
    const presetId = DOM.apiPresetSelect.value;
    if (!presetId) {
        alert('請先從下拉選單中選擇一個要刪除的設定檔。');
        return;
    }

    const presetToDelete = state.apiPresets.find(p => p.id === presetId);
    if (confirm(`確定要刪除設定檔 "${presetToDelete.name}" 嗎？`)) {
        state.apiPresets = state.apiPresets.filter(p => p.id !== presetId);
        await saveSettings();
        renderApiPresetsDropdown();
        // 清空表單
        DOM.apiProviderSelect.value = 'official_gemini';
        DOM.apiKeyInput.value = '';
        UI.updateModelDropdown();
        alert(`設定檔 "${presetToDelete.name}" 已刪除。`);
    }
}


// ===================================================================================
// 聊天核心邏輯 (Core Chat Logic)
// ===================================================================================

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
    
    await saveAllChatHistoriesForChar(state.activeCharacterId);
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
        
        await saveAllChatHistoriesForChar(state.activeCharacterId);
        renderChatMessages();
    } catch (error) {
        thinkingBubble.remove();
        if (error.name !== 'AbortError') {
            console.error("API 錯誤:", error);
            const errorMessage = `發生錯誤: ${error.message}`;
            history[currentUserMessageIndex].error = errorMessage;
            await saveAllChatHistoriesForChar(state.activeCharacterId);
            renderChatMessages();
        } else {
             renderChatMessages();
        }
    } finally {
        setGeneratingState(false);
    }
}

export function retryMessage(messageIndex) {
    const history = state.chatHistories[state.activeCharacterId][state.activeChatId];
    const messageToRetry = history[messageIndex];

    if (messageToRetry && messageToRetry.role === 'user' && messageToRetry.error) {
        sendMessage(messageToRetry, messageIndex);
    }
}

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

        await saveAllChatHistoriesForChar(state.activeCharacterId);
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

export async function switchVersion(messageIndex, direction) {
    const history = state.chatHistories[state.activeCharacterId][state.activeChatId];
    const msg = history[messageIndex];
    const newIndex = msg.activeContentIndex + direction;

    if (newIndex >= 0 && newIndex < msg.content.length) {
        msg.activeContentIndex = newIndex;
        await saveAllChatHistoriesForChar(state.activeCharacterId);
        renderChatMessages();
    }
}

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

export async function switchChat(chatId) {
    if (state.activeChatId === chatId) return;

    state.activeChatId = chatId;
    await saveSettings();
    renderChatSessionList();
    renderActiveChat();
}

export async function handleAddNewChat() {
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
    await saveAllChatHistoriesForChar(state.activeCharacterId);
    await saveAllChatMetadatasForChar(state.activeCharacterId);
    await saveSettings();
    
    renderChatSessionList();
    renderActiveChat();
}

export async function handleDeleteCurrentChat() {
    if (!state.activeCharacterId || !state.activeChatId) return;
    if (confirm('確定要永久刪除這個對話嗎？此操作無法復原。')) {
        delete state.chatHistories[state.activeCharacterId][state.activeChatId];
        delete state.chatMetadatas[state.activeCharacterId][state.activeChatId];
        if (state.longTermMemories[state.activeCharacterId]) {
            delete state.longTermMemories[state.activeCharacterId][state.activeChatId];
        }
        state.activeChatId = null;
        
        await saveAllChatHistoriesForChar(state.activeCharacterId);
        await saveAllChatMetadatasForChar(state.activeCharacterId);
        await saveAllLongTermMemoriesForChar(state.activeCharacterId);
        await saveSettings();

        renderChatSessionList();
        renderActiveChat();
    }
}

export async function handleSaveNote() {
    if (!state.activeCharacterId || !state.activeChatId) return;
    const metadata = state.chatMetadatas[state.activeCharacterId]?.[state.activeChatId];
    if (metadata) {
        metadata.notes = DOM.chatNotesInput.value.trim();
        await saveAllChatMetadatasForChar(state.activeCharacterId);
    }
}

export function openRenameModal(chatId) {
    tempState.renamingChatId = chatId;
    const metadata = state.chatMetadatas[state.activeCharacterId]?.[chatId] || {};
    DOM.renameChatInput.value = metadata.name || '';
    toggleModal('rename-chat-modal', true);
    DOM.renameChatInput.focus();
}

export async function handleSaveChatName() {
    if (!tempState.renamingChatId || !state.activeCharacterId) return;
    
    const metadata = state.chatMetadatas[state.activeCharacterId][tempState.renamingChatId];
    if(metadata) {
        metadata.name = DOM.renameChatInput.value.trim();
        await saveAllChatMetadatasForChar(state.activeCharacterId);
        renderChatSessionList();
    }
    toggleModal('rename-chat-modal', false);
    tempState.renamingChatId = null;
}

export async function handleTogglePinChat(chatId) {
    if (!state.activeCharacterId) return;
    
    const metadata = state.chatMetadatas[state.activeCharacterId][chatId];
    if(metadata) {
        metadata.pinned = !metadata.pinned;
        await saveAllChatMetadatasForChar(state.activeCharacterId);
        renderChatSessionList();
    }
}

// ===================================================================================
// 角色編輯器 (Character Editor)
// ===================================================================================

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

export async function handleSaveCharacter() {
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
        const updatedChar = { ...state.characters[charIndex], ...charData };
        state.characters[charIndex] = updatedChar;
        await saveCharacter(updatedChar);
    } else {
        const newChar = { id: `char_${Date.now()}`, ...charData };
        state.characters.push(newChar);
        await saveCharacter(newChar);
        state.activeCharacterId = newChar.id;
        handleAddNewChat();
    }
    
    renderCharacterList();
    if (DOM.leftPanel.classList.contains('show-chats')) {
        const character = state.characters.find(c => c.id === state.activeCharacterId);
        DOM.chatListHeaderName.textContent = character.name;
    }
    toggleModal('character-editor-modal', false);
}

export async function handleDeleteActiveCharacter() {
    const charIdToDelete = state.activeCharacterId;
    if (!charIdToDelete) return;

    const charToDelete = state.characters.find(c => c.id === charIdToDelete);
    if (!charToDelete) return;

    if (confirm(`確定要刪除角色「${charToDelete.name}」嗎？該角色的所有對話紀錄將一併刪除。`)) {
        state.characters = state.characters.filter(c => c.id !== charIdToDelete);
        delete state.chatHistories[charIdToDelete];
        delete state.longTermMemories[charIdToDelete];
        delete state.chatMetadatas[charIdToDelete];
        
        await deleteCharacter(charIdToDelete);
        await deleteAllChatDataForChar(charIdToDelete);
        
        state.activeCharacterId = null;
        state.activeChatId = null;
        await saveSettings();
        
        showCharacterListView(); 
        renderActiveChat();
        renderCharacterList();
    }
}

// ===================================================================================
// 訊息編輯與操作 (Message Editing & Actions)
// ===================================================================================

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

async function saveMessageEdit(index, newText) {
    const msg = state.chatHistories[state.activeCharacterId][state.activeChatId][index];
    if (msg.role === 'assistant') {
        msg.content[msg.activeContentIndex] = newText.trim();
    } else {
        msg.content = newText.trim();
    }
    await saveAllChatHistoriesForChar(state.activeCharacterId);
    renderChatMessages();
}

async function handleDeleteMessage(index) {
    if (confirm('您確定要永久刪除這則訊息嗎？')) {
        state.chatHistories[state.activeCharacterId][state.activeChatId].splice(index, 1);
        await saveAllChatHistoriesForChar(state.activeCharacterId);
        renderChatMessages();
    }
}

// ===================================================================================
// 全域與提示詞設定 (Global & Prompt Settings)
// ===================================================================================

export async function handleSaveGlobalSettings() {
    // 儲存 API 和參數設定
    state.globalSettings = {
        apiProvider: DOM.apiProviderSelect.value,
        apiModel: DOM.apiModelSelect.value,
        apiKey: DOM.apiKeyInput.value.trim(),
        temperature: DOM.temperatureValue.value,
        topP: DOM.topPValue.value,
        repetitionPenalty: DOM.repetitionPenaltyValue.value,
        contextSize: DOM.contextSizeInput.value,
        maxTokens: DOM.maxTokensValue.value,
        theme: DOM.themeSelect.value,
    };
    
    const promptMode = DOM.promptModeSelect.value;
    state.promptSettings = {
        mode: promptMode,
        scenario: promptMode === 'custom' ? DOM.promptScenarioInput.value.trim() : DEFAULT_SCENARIO_PROMPT,
        jailbreak: promptMode === 'custom' ? DOM.promptJailbreakInput.value.trim() : DEFAULT_JAILBREAK_PROMPT,
        summarizationPrompt: DOM.promptSummarizationInput.value.trim()
    };

    applyTheme(state.globalSettings.theme);
    await saveSettings();
    
    toggleModal('global-settings-modal', false);
    renderActiveChat();
    alert('所有設定已儲存！');
}

// ===================================================================================
// 使用者角色 (User Persona)
// ===================================================================================

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

export async function handleSaveUserPersona() {
    const personaData = {
        name: DOM.userPersonaNameInput.value.trim(),
        avatarUrl: DOM.userPersonaAvatarPreview.src,
        description: DOM.userPersonaDescriptionInput.value.trim(),
    };
    if (!personaData.name) { alert('角色名稱不能為空！'); return; }

    if (tempState.editingUserPersonaId) {
        const personaIndex = state.userPersonas.findIndex(p => p.id === tempState.editingUserPersonaId);
        const updatedPersona = { ...state.userPersonas[personaIndex], ...personaData };
        state.userPersonas[personaIndex] = updatedPersona;
        await saveUserPersona(updatedPersona);
    } else {
        const newPersona = { id: `user_${Date.now()}`, ...personaData };
        state.userPersonas.push(newPersona);
        await saveUserPersona(newPersona);
    }
    
    loadGlobalSettingsToUI();
    toggleModal('user-persona-editor-modal', false);
}

export async function handleDeleteUserPersona(personaId) {
    if (state.userPersonas.length <= 1) {
        alert('至少需要保留一個使用者角色。');
        return;
    }
    if (confirm('確定要刪除這個使用者角色嗎？')) {
        state.userPersonas = state.userPersonas.filter(p => p.id !== personaId);
        await deleteUserPersona(personaId);
        if (state.activeUserPersonaId === personaId) {
            state.activeUserPersonaId = state.userPersonas[0].id;
            await saveSettings();
        }
        loadGlobalSettingsToUI();
    }
}

export async function handleChatPersonaChange(e) {
    const newPersonaId = e.target.value;
    if (state.activeCharacterId && state.activeChatId) {
        state.chatMetadatas[state.activeCharacterId][state.activeChatId].userPersonaId = newPersonaId;
        await saveAllChatMetadatasForChar(state.activeCharacterId);
        renderChatMessages();
    }
}

// ===================================================================================
// 長期記憶 (Long-term Memory)
// ===================================================================================

export function openMemoryEditor() {
    if (!state.activeCharacterId || !state.activeChatId) {
        alert('請先選擇一個對話才能查看記憶。');
        return;
    }
    const memory = state.longTermMemories[state.activeCharacterId]?.[state.activeChatId] || '尚無長期記憶。';
    DOM.memoryEditorTextarea.value = memory;
    toggleModal('memory-editor-modal', true);
}

export async function handleSaveMemory() {
    if (!state.activeCharacterId || !state.activeChatId) return;

    if (!state.longTermMemories[state.activeCharacterId]) {
        state.longTermMemories[state.activeCharacterId] = {};
    }
    state.longTermMemories[state.activeCharacterId][state.activeChatId] = DOM.memoryEditorTextarea.value.trim();
    await saveAllLongTermMemoriesForChar(state.activeCharacterId);
    toggleModal('memory-editor-modal', false);
    alert('長期記憶已儲存！');
}

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
        if (provider === 'google' || provider === 'official_gemini') {
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
        await saveAllLongTermMemoriesForChar(state.activeCharacterId);
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

function checkApiKey(promptText = '請在此填入您的 API 金鑰') {
    if (state.globalSettings.apiProvider === 'official_gemini') {
        return true;
    }
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
