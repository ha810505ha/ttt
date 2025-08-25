// js/events.js
// 這個檔案專門用來綁定所有的事件監聽器，並使用事件委派處理動態內容。

import * as DOM from './dom.js';
import * as Handlers from './handlers.js';
import * as UI from './ui.js';
import * as Utils from './utils.js';
import { state, saveSettings, loadChatDataForCharacter } from './state.js';

/**
 * @description 集中設定所有 DOM 元素的事件監聽器
 */
export function setupEventListeners() {
    // ================== 靜態元素事件綁定 ==================

    // 主題切換
    DOM.themeToggleBtn.addEventListener('click', Utils.toggleTheme);
    
    // 手機版選單
    DOM.menuToggleBtn.addEventListener('click', () => {
        DOM.leftPanel.classList.toggle('mobile-visible');
        DOM.mobileOverlay.classList.toggle('hidden');
    });
    DOM.mobileOverlay.addEventListener('click', () => {
        DOM.leftPanel.classList.remove('mobile-visible');
        DOM.mobileOverlay.classList.add('hidden');
    });

    // 左側面板導覽
    DOM.backToCharsBtn.addEventListener('click', async () => {
        UI.showCharacterListView();
        state.activeCharacterId = null;
        state.activeChatId = null;
        await saveSettings();
    });
    DOM.addChatBtn.addEventListener('click', Handlers.handleAddNewChat);
    DOM.editActiveCharacterBtn.addEventListener('click', () => Handlers.openCharacterEditor(state.activeCharacterId));
    DOM.deleteActiveCharacterBtn.addEventListener('click', Handlers.handleDeleteActiveCharacter);

    // 聊天介面
    DOM.chatNotesInput.addEventListener('blur', Handlers.handleSaveNote);
    DOM.sendBtn.addEventListener('click', () => {
        if (DOM.sendBtn.classList.contains('is-generating')) {
            Handlers.handleStopGeneration();
        } else {
            Handlers.sendMessage();
        }
    });

    // [重要修改] 偵測是否為行動裝置
    const isMobile = /Mobi|Android/i.test(navigator.userAgent);

    // [重要修改] 為輸入框添加鍵盤事件監聽，以處理 Enter 鍵
    DOM.messageInput.addEventListener('keydown', (e) => {
        // 條件：按下 Enter 鍵，且不是在行動裝置上，且沒有同時按住 Shift 鍵
        if (e.key === 'Enter' && !isMobile && !e.shiftKey) {
            e.preventDefault(); // 防止預設的換行行為
            Handlers.sendMessage(); // 呼叫送出訊息的函式
        }
    });

    DOM.messageInput.addEventListener('input', () => {
        DOM.messageInput.style.height = 'auto';
        DOM.messageInput.style.height = `${DOM.messageInput.scrollHeight}px`;
    });

    DOM.chatOptionsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        DOM.chatOptionsMenu.classList.toggle('hidden');
    });
    DOM.exportChatOptionBtn.addEventListener('click', Handlers.openExportModal);
    DOM.deleteChatOptionBtn.addEventListener('click', Handlers.handleDeleteCurrentChat);

    window.addEventListener('click', () => {
        if (!DOM.chatOptionsMenu.classList.contains('hidden')) {
            DOM.chatOptionsMenu.classList.add('hidden');
        }
    });


    // 重新命名彈窗
    DOM.saveRenameChatBtn.addEventListener('click', Handlers.handleSaveChatName);
    DOM.cancelRenameChatBtn.addEventListener('click', () => UI.toggleModal('rename-chat-modal', false));

    // 記憶體相關
    DOM.updateMemoryBtn.addEventListener('click', Handlers.handleUpdateMemory);
    DOM.viewMemoryBtn.addEventListener('click', Handlers.openMemoryEditor);
    DOM.saveMemoryEditorBtn.addEventListener('click', Handlers.handleSaveMemory);
    DOM.cancelMemoryEditorBtn.addEventListener('click', () => UI.toggleModal('memory-editor-modal', false));

    // 角色編輯器
    DOM.addCharacterBtn.addEventListener('click', () => Handlers.openCharacterEditor());
    DOM.saveCharBtn.addEventListener('click', Handlers.handleSaveCharacter);
    DOM.cancelCharEditorBtn.addEventListener('click', () => UI.toggleModal('character-editor-modal', false));
    DOM.importCharBtn.addEventListener('click', Utils.importCharacter);
    DOM.exportCharBtn.addEventListener('click', Utils.exportCharacter);
    DOM.charAvatarUpload.addEventListener('change', (e) => Utils.handleImageUpload(e, DOM.charAvatarPreview));

    // 全域設定
    DOM.globalSettingsBtn.addEventListener('click', () => {
        UI.loadGlobalSettingsToUI();
        UI.toggleModal('global-settings-modal', true);
    });
    DOM.testApiBtn.addEventListener('click', Handlers.handleTestApiConnection);
    DOM.saveGlobalSettingsBtn.addEventListener('click', Handlers.handleSaveGlobalSettings);
    DOM.cancelGlobalSettingsBtn.addEventListener('click', () => UI.toggleModal('global-settings-modal', false));
    Utils.setupSliderSync(DOM.temperatureSlider, DOM.temperatureValue);
    Utils.setupSliderSync(DOM.topPSlider, DOM.topPValue);
    Utils.setupSliderSync(DOM.repetitionPenaltySlider, DOM.repetitionPenaltyValue);
    Utils.setupSliderSync(DOM.maxTokensSlider, DOM.maxTokensValue);
    DOM.apiProviderSelect.addEventListener('change', UI.updateModelDropdown);

    // 提示詞庫
    DOM.promptLibraryBtn.addEventListener('click', UI.showPromptView);
    DOM.backToMainFromPromptBtn.addEventListener('click', async () => {
        UI.showCharacterListView();
        state.activeCharacterId = null;
        state.activeChatId = null;
        await saveSettings();
    });
    DOM.savePromptSettingsBtn.addEventListener('click', Handlers.handleSavePromptSettings);

    // 使用者角色 (Persona)
    DOM.addUserPersonaBtn.addEventListener('click', () => Handlers.openUserPersonaEditor());
    DOM.saveUserPersonaBtn.addEventListener('click', Handlers.handleSaveUserPersona);
    DOM.cancelUserPersonaEditorBtn.addEventListener('click', () => UI.toggleModal('user-persona-editor-modal', false));
    DOM.activeUserPersonaSelect.addEventListener('change', async (e) => {
        state.activeUserPersonaId = e.target.value;
        await saveSettings();
    });
    DOM.chatUserPersonaSelect.addEventListener('change', Handlers.handleChatPersonaChange);
    DOM.userPersonaAvatarUpload.addEventListener('change', (e) => Utils.handleImageUpload(e, DOM.userPersonaAvatarPreview));

    // 匯出
    DOM.exportFormatPng.addEventListener('change', () => DOM.exportRangeSelector.classList.remove('hidden'));
    DOM.exportFormatJsonl.addEventListener('change', () => DOM.exportRangeSelector.classList.add('hidden'));
    DOM.exportMessageCountSlider.addEventListener('input', (e) => {
        DOM.exportRangeLabel.textContent = `匯出最近的 ${e.target.value} 則訊息`;
    });
    DOM.confirmExportChatBtn.addEventListener('click', Handlers.handleConfirmExport);
    DOM.cancelExportChatBtn.addEventListener('click', () => UI.toggleModal('export-chat-modal', false));

    // 視窗大小變更
    window.addEventListener('resize', Utils.setAppHeight);

    // ================== 事件委派 (處理動態產生的元素) ==================

    // 角色列表點擊
    DOM.characterList.addEventListener('click', async (e) => {
        const charItem = e.target.closest('.character-item');
        if (charItem) {
            const charId = charItem.dataset.id;
            await loadChatDataForCharacter(charId);
            UI.showChatSessionListView(charId);
            state.activeCharacterId = charId;
            state.activeChatId = null; 
            await saveSettings();
        }
    });

    // 聊天室列表點擊
    DOM.chatSessionList.addEventListener('click', async (e) => {
        const sessionItem = e.target.closest('.chat-session-item');
        if (!sessionItem) return;
        const chatId = sessionItem.dataset.id;

        if (e.target.closest('.session-item-content')) {
            await Handlers.switchChat(chatId);
            DOM.leftPanel.classList.remove('mobile-visible');
            DOM.mobileOverlay.classList.add('hidden');
        } else if (e.target.closest('.pin-chat-btn')) {
            await Handlers.handleTogglePinChat(chatId);
        } else if (e.target.closest('.rename-chat-btn')) {
            Handlers.openRenameModal(chatId);
        }
    });

    // 聊天視窗內的點擊
    DOM.chatWindow.addEventListener('click', async (e) => {
        const messageRow = e.target.closest('.message-row');
        if (!messageRow) {
            document.querySelectorAll('.message-row.show-actions').forEach(row => row.classList.remove('show-actions'));
            return;
        }
        
        const messageIndex = parseInt(messageRow.dataset.index, 10);

        if (e.target.closest('.chat-bubble')) {
            document.querySelectorAll('.message-row.show-actions').forEach(otherRow => {
                if (otherRow !== messageRow) otherRow.classList.remove('show-actions');
            });
            messageRow.classList.toggle('show-actions');
        }
        else if (e.target.closest('.edit-msg-btn')) {
            Handlers.makeMessageEditable(messageRow, messageIndex);
        }
        else if (e.target.closest('.regenerate-btn-sm')) {
            await Handlers.regenerateResponse(messageIndex);
        }
        else if (e.target.closest('.retry-btn-sm')) {
            await Handlers.retryMessage(messageIndex);
        }
        else if (e.target.closest('.version-prev-btn')) {
            await Handlers.switchVersion(messageIndex, -1);
        }
        else if (e.target.closest('.version-next-btn')) {
            await Handlers.switchVersion(messageIndex, 1);
        }
    });

    // 設定彈窗內的使用者角色列表點擊
    DOM.userPersonaList.addEventListener('click', async (e) => {
        const personaItem = e.target.closest('.persona-item');
        if (!personaItem) return;
        const personaId = personaItem.dataset.id;

        if (e.target.closest('.edit-persona-btn')) {
            Handlers.openUserPersonaEditor(personaId);
        } else if (e.target.closest('.delete-persona-btn')) {
            await Handlers.handleDeleteUserPersona(personaId);
        }
    });
}
