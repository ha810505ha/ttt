// js/handlers.js
// 這個檔案存放所有的事件處理函式 (event handlers)。

import { auth } from './main.js';
import { 
    GoogleAuthProvider,
    signInWithPopup,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    updateProfile
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";


import * as DOM from './dom.js';
import { 
    state, tempState, saveSettings, saveCharacter, deleteCharacter, saveUserPersona, deleteUserPersona,
    saveAllChatHistoriesForChar, saveAllLongTermMemoriesForChar, saveAllChatMetadatasForChar,
    deleteAllChatDataForChar, loadChatDataForCharacter, savePromptSet, deletePromptSet
} from './state.js';
import * as db from './db.js';
import { callApi, buildApiMessages, buildApiMessagesFromHistory, testApiConnection } from './api.js';
import { 
    renderCharacterList, renderChatSessionList, renderActiveChat, renderChatMessages, 
    displayMessage, toggleModal, setGeneratingState, showCharacterListView, loadGlobalSettingsToUI,
    renderApiPresetsDropdown, loadApiPresetToUI, updateModelDropdown,
    renderFirstMessageInputs, renderPromptSetSelector, renderPromptList
} from './ui.js';
import { DEFAULT_AVATAR } from './constants.js';
import { handleImageUpload, exportChatAsJsonl, applyTheme, importCharacter, exportCharacter } from './utils.js';
import * as PromptManager from './promptManager.js';

// ... (其他 handlers 保持不變) ...
export function handleLogin() {
    toggleModal('auth-modal', true);
}

export function handleGoogleLogin() {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider)
      .then(() => toggleModal('auth-modal', false))
      .catch(error => {
        console.error("Google 登入失敗:", error);
        alert(`登入失敗: ${error.message}`);
    });
}

export function handleEmailRegister(event) {
    event.preventDefault();
    const name = DOM.registerNameInput.value.trim();
    const email = event.target.email.value;
    const password = event.target.password.value;

    createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            return updateProfile(userCredential.user, {
                displayName: name
            }).then(() => {
                alert('註冊成功！');
                toggleModal('auth-modal', false);
            });
        })
        .catch(error => {
            console.error("註冊失敗:", error);
            alert(`註冊失敗: ${error.message}`);
        });
}

export function handleEmailLogin(event) {
    event.preventDefault();
    const email = event.target.email.value;
    const password = event.target.password.value;

    signInWithEmailAndPassword(auth, email, password)
        .then(() => {
            alert('登入成功！');
            toggleModal('auth-modal', false);
        })
        .catch(error => {
            console.error("登入失敗:", error);
            alert(`登入失敗: ${error.message}`);
        });
}

export function handleLogout() {
    if (confirm('確定要登出嗎？')) {
        signOut(auth).catch(error => {
            console.error("登出失敗:", error);
            alert(`登出失敗: ${error.message}`);
        });
    }
}

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
    DOM.apiPresetSelect.value = newPreset.id;
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
        DOM.apiProviderSelect.value = 'official_gemini';
        DOM.apiKeyInput.value = '';
        updateModelDropdown();
        alert(`設定檔 "${presetToDelete.name}" 已刪除。`);
    }
}

export async function sendMessage(userMessage = null, messageIndex = null) {
    if (state.globalSettings.apiProvider !== 'official_gemini' && !state.globalSettings.apiKey) {
        alert('請先在全域設定中設定您的 API 金鑰。');
        return;
    }
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
    if (state.globalSettings.apiProvider !== 'official_gemini' && !state.globalSettings.apiKey) {
        alert('請先在全域設定中設定您的 API 金鑰。');
        return;
    }
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

    if (char.firstMessage && Array.isArray(char.firstMessage) && char.firstMessage.length > 0) {
        const nonEmptyMessages = char.firstMessage.filter(m => m.trim() !== '');
        if (nonEmptyMessages.length > 0) {
            const user = state.userPersonas.find(p => p.id === state.activeUserPersonaId) || {};
            const userName = user.name || 'User';
            
            const formattedGreetings = nonEmptyMessages.map(greeting => 
                greeting.replace(/{{char}}/g, char.name).replace(/{{user}}/g, userName)
            );
            
            state.chatHistories[state.activeCharacterId][newChatId].push({
                role: 'assistant',
                content: formattedGreetings,
                activeContentIndex: 0,
                timestamp: new Date().toISOString()
            });
        }
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

export function openCharacterEditor(charId = null) {
    tempState.editingCharacterId = charId;
    if (charId) {
        const char = state.characters.find(c => c.id === charId);
        DOM.charEditorTitle.textContent = '編輯角色';
        DOM.charAvatarPreview.src = char.avatarUrl || DEFAULT_AVATAR;
        DOM.charNameInput.value = char.name;
        DOM.charDescriptionInput.value = char.description || '';
        renderFirstMessageInputs(char.firstMessage || ['']);
        DOM.charExampleDialogueInput.value = char.exampleDialogue || '';
    } else {
        DOM.charEditorTitle.textContent = '新增角色';
        DOM.charAvatarPreview.src = DEFAULT_AVATAR;
        DOM.charNameInput.value = '';
        DOM.charDescriptionInput.value = '';
        renderFirstMessageInputs(['']);
        DOM.charExampleDialogueInput.value = '';
    }
    toggleModal('character-editor-modal', true);
}

export async function handleSaveCharacter() {
    if (tempState.editingCharacterId && !confirm('儲存後會覆蓋原先內容，是否繼續儲存?')) {
        return;
    }

    const firstMessageInputs = DOM.firstMessageList.querySelectorAll('.char-first-message');
    const firstMessages = Array.from(firstMessageInputs)
                               .map(input => input.value.trim())
                               .filter(msg => msg !== ''); 

    const charData = {
        name: DOM.charNameInput.value.trim(),
        avatarUrl: DOM.charAvatarPreview.src,
        description: DOM.charDescriptionInput.value.trim(),
        firstMessage: firstMessages.length > 0 ? firstMessages : [''],
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

export async function handleSaveGlobalSettings() {
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
    
    applyTheme(state.globalSettings.theme);
    await saveSettings();
    
    toggleModal('global-settings-modal', false);
    renderActiveChat();
    alert('所有設定已儲存！');
}

// ===================================================================================
// 新的提示詞庫處理函式
// ===================================================================================

export function handleImportPromptSet() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const newPromptSet = PromptManager.parsePromptSetFile(e.target.result, file.name);
                state.promptSets.push(newPromptSet);
                await savePromptSet(newPromptSet);
                
                state.activePromptSetId = newPromptSet.id;
                await saveSettings();

                renderPromptSetSelector();
                renderPromptList();
                alert(`提示詞庫 "${newPromptSet.name}" 匯入成功！`);
            } catch (error) {
                alert(`匯入失敗: ${error.message}`);
            }
        };
        reader.readAsText(file, 'UTF-8');
    };
    input.click();
}

export async function handleDeletePromptSet() {
    const setId = DOM.promptSetSelect.value;
    if (!setId) {
        alert('請選擇一個要刪除的設定檔。');
        return;
    }
    if (state.promptSets.length <= 1) {
        alert('無法刪除最後一個提示詞設定檔。');
        return;
    }

    const setToDelete = state.promptSets.find(ps => ps.id === setId);
    if (confirm(`確定要刪除提示詞庫 "${setToDelete.name}" 嗎？`)) {
        state.promptSets = state.promptSets.filter(ps => ps.id !== setId);
        await deletePromptSet(setId);

        if (state.activePromptSetId === setId) {
            state.activePromptSetId = state.promptSets[0].id;
            await saveSettings();
        }

        renderPromptSetSelector();
        renderPromptList();
    }
}

export async function handleSwitchPromptSet(event) {
    const newSetId = event.target.value;
    state.activePromptSetId = newSetId;
    await saveSettings();
    renderPromptList();
}

export async function handleTogglePromptEnabled(identifier) {
    const activeSet = PromptManager.getActivePromptSet();
    if (!activeSet) return;

    const prompt = activeSet.prompts.find(p => p.identifier === identifier);
    if (prompt) {
        prompt.enabled = !prompt.enabled;
        await savePromptSet(activeSet);
        renderPromptList();
    }
}

export function openPromptEditor(identifier) {
    const activeSet = PromptManager.getActivePromptSet();
    const prompt = activeSet.prompts.find(p => p.identifier === identifier);
    if (!prompt) {
        alert('找不到要編輯的提示詞。');
        return;
    }

    tempState.editingPromptIdentifier = identifier;
    DOM.promptEditorNameInput.value = prompt.name;
    DOM.promptEditorContentInput.value = prompt.content;
    toggleModal('prompt-editor-modal', true);
}

export async function handleSavePrompt() {
    const identifier = tempState.editingPromptIdentifier;
    if (!identifier) return;

    const activeSet = PromptManager.getActivePromptSet();
    const prompt = activeSet.prompts.find(p => p.identifier === identifier);
    if (prompt) {
        prompt.name = DOM.promptEditorNameInput.value.trim();
        prompt.content = DOM.promptEditorContentInput.value;
        await savePromptSet(activeSet);
        renderPromptList();
    }

    toggleModal('prompt-editor-modal', false);
    tempState.editingPromptIdentifier = null;
}

/**
 * @description [ADDED] 刪除單個提示詞條目
 */
export async function handleDeletePromptItem() {
    const identifier = tempState.editingPromptIdentifier;
    if (!identifier) return;

    const activeSet = PromptManager.getActivePromptSet();
    const promptToDelete = activeSet.prompts.find(p => p.identifier === identifier);

    if (confirm(`確定要刪除提示詞「${promptToDelete.name}」嗎？此操作無法復原。`)) {
        activeSet.prompts = activeSet.prompts.filter(p => p.identifier !== identifier);
        await savePromptSet(activeSet);
        renderPromptList();
        toggleModal('prompt-editor-modal', false);
        tempState.editingPromptIdentifier = null;
    }
}

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
    if (state.globalSettings.apiProvider !== 'official_gemini' && !state.globalSettings.apiKey) {
        alert('請先在全域設定中設定您的 API 金鑰。');
        return;
    }
    if (!state.activeCharacterId || !state.activeChatId) { alert('請先選擇一個對話。'); return; }
    
    const history = state.chatHistories[state.activeCharacterId][state.activeChatId];
    if (history.length < 4) { alert('對話太短，無法生成有意義的記憶。'); return; }
    
    DOM.updateMemoryBtn.textContent = '記憶生成中...';
    DOM.updateMemoryBtn.disabled = true;
    setGeneratingState(true, false);
    
    try {
        const conversationText = history.map(m => `${m.role}: ${m.role === 'assistant' ? m.content[m.activeContentIndex] : m.content}`).join('\n');
        
        let userPrompt = PromptManager.getPromptContentByIdentifier('summarization_prompt');
        if (!userPrompt) {
            throw new Error("在當前提示詞庫中找不到 'summarization_prompt'。");
        }
        
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

export function openExportModal() {
    if (!state.activeCharacterId || !state.activeChatId) {
        alert('請先選擇角色並開啟一個對話。');
        return;
    }
    toggleModal('export-chat-modal', true);
}

export function handleConfirmExport() {
    if (!state.activeCharacterId || !state.activeChatId) return;

    if (DOM.exportFormatPng.checked) {
        toggleModal('export-chat-modal', false);
        handleToggleScreenshotMode();
    } else {
        exportChatAsJsonl();
        toggleModal('export-chat-modal', false);
    }
}

export function handleToggleScreenshotMode() {
    tempState.isScreenshotMode = !tempState.isScreenshotMode;
    
    DOM.chatWindow.classList.toggle('screenshot-mode', tempState.isScreenshotMode);
    DOM.messageInputContainer.classList.toggle('hidden', tempState.isScreenshotMode);
    DOM.screenshotToolbar.classList.toggle('hidden', !tempState.isScreenshotMode);

    if (!tempState.isScreenshotMode) {
        tempState.selectedMessageIndices = [];
        renderChatMessages();
    } else {
        DOM.screenshotInfoText.textContent = `已選擇 0 則訊息`;
    }
}

export function handleSelectMessage(index) {
    if (!tempState.isScreenshotMode) return;

    const selectedIndex = tempState.selectedMessageIndices.indexOf(index);
    if (selectedIndex > -1) {
        tempState.selectedMessageIndices.splice(selectedIndex, 1);
    } else {
        tempState.selectedMessageIndices.push(index);
    }
    
    DOM.screenshotInfoText.textContent = `已選擇 ${tempState.selectedMessageIndices.length} 則訊息`;
    const messageRow = DOM.chatWindow.querySelector(`.message-row[data-index="${index}"]`);
    if (messageRow) {
        messageRow.classList.toggle('selected');
    }
}

export async function handleGenerateScreenshot() {
    if (tempState.selectedMessageIndices.length === 0) {
        alert('請先選擇至少一則訊息！');
        return;
    }

    DOM.loadingOverlay.classList.remove('hidden');
    
    const screenshotContainer = document.createElement('div');
    screenshotContainer.style.backgroundColor = getComputedStyle(DOM.chatWindow).backgroundColor;
    screenshotContainer.style.padding = '20px';
    screenshotContainer.style.width = `${DOM.chatWindow.clientWidth}px`;
    screenshotContainer.style.position = 'absolute';
    screenshotContainer.style.left = '-9999px';
    screenshotContainer.style.top = '0';

    const sortedIndices = [...tempState.selectedMessageIndices].sort((a, b) => a - b);
    
    sortedIndices.forEach(index => {
        const originalMessageNode = DOM.chatWindow.querySelector(`.message-row[data-index="${index}"]`);
        if (originalMessageNode) {
            const clonedMessageNode = originalMessageNode.cloneNode(true);
            clonedMessageNode.classList.remove('selected');
            screenshotContainer.appendChild(clonedMessageNode);
        }
    });

    document.body.appendChild(screenshotContainer);

    try {
        const canvas = await html2canvas(screenshotContainer, {
            scale: 2,
            useCORS: true,
            backgroundColor: null,
        });

        const image = canvas.toDataURL('image/png', 1.0);
        const link = document.createElement('a');
        const timestamp = new Date().toISOString().replace(/[:.-]/g, '');
        link.download = `chat-screenshot-${timestamp}.png`;
        link.href = image;
        link.click();

    } catch (error) {
        console.error('截圖生成失敗:', error);
        alert('抱歉，生成截圖時發生錯誤。');
    } finally {
        document.body.removeChild(screenshotContainer);
        DOM.loadingOverlay.classList.add('hidden');
        handleToggleScreenshotMode();
    }
}

export async function handleGlobalExport() {
    try {
        console.log("開始全域匯出...");
        const allData = {
            version: "2.0",
            exportDate: new Date().toISOString(),
            characters: await db.getAll('characters'),
            chatHistories: await db.getAll('chatHistories'),
            longTermMemories: await db.getAll('longTermMemories'),
            chatMetadatas: await db.getAll('chatMetadatas'),
            userPersonas: await db.getAll('userPersonas'),
            promptSets: await db.getAll('promptSets'),
            keyValueStore: await db.getAll('keyValueStore'),
        };

        const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        a.href = url;
        a.download = `AiChat_Backup_V2_${timestamp}.json`;
        a.click();
        URL.revokeObjectURL(url);
        alert('所有資料已成功匯出！');
    } catch (error) {
        console.error("全域匯出失敗:", error);
        alert('匯出失敗，請查看主控台獲取更多資訊。');
    }
}

export function handleGlobalImport(mode) {
    const confirmationMessage = mode === 'overwrite' 
        ? '警告：覆蓋匯入將會完全清除您目前所有的資料。此操作無法復原。您確定要繼續嗎？'
        : '合併匯入將會加入新的資料，但不會覆蓋任何現有項目。您確定要繼續嗎？';

    if (!confirm(confirmationMessage)) {
        return;
    }

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';

    input.onchange = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const importedData = JSON.parse(e.target.result);

                if (!importedData.version || !importedData.characters || !importedData.keyValueStore) {
                    throw new Error('檔案格式不符或已損壞。');
                }

                DOM.loadingOverlay.classList.remove('hidden');
                
                const storesToProcess = ['characters', 'chatHistories', 'longTermMemories', 'chatMetadatas', 'userPersonas', 'promptSets', 'keyValueStore'];

                if (mode === 'overwrite') {
                    for (const storeName of storesToProcess) {
                        await db.clearStore(storeName);
                        if (importedData[storeName]) {
                            for (const item of importedData[storeName]) {
                                await db.put(storeName, item);
                            }
                        }
                    }
                } else { 
                    for (const storeName of storesToProcess) {
                         if (importedData[storeName]) {
                            const existingItems = await db.getAll(storeName);
                            const keyPath = storeName === 'keyValueStore' ? 'key' : 'id';
                            const existingIds = new Set(existingItems.map(item => item[keyPath]));
                            const itemsToImport = importedData[storeName].filter(item => !existingIds.has(item[keyPath]));
                            for (const item of itemsToImport) {
                                await db.put(storeName, item);
                            }
                        }
                    }
                }

                DOM.loadingOverlay.classList.add('hidden');
                alert('資料匯入成功！應用程式將會重新載入以套用變更。');
                location.reload();

            } catch (error) {
                DOM.loadingOverlay.classList.add('hidden');
                console.error("全域匯入失敗:", error);
                alert(`匯入失敗：${error.message}`);
            }
        };
        reader.readAsText(file, 'UTF-8');
    };
    input.click();
}
