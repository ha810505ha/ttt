// js/events.js
// 這個檔案專門用來綁定所有的事件監聽器，並使用事件委派處理動態內容。

import * as DOM from './dom.js';
import * as Handlers from './handlers.js';
import * as UI from './ui.js';
import * as Utils from './utils.js';
import { state, tempState, saveSettings, loadChatDataForCharacter } from './state.js';

/**
 * @description 集中設定所有 DOM 元素的事件監聽器
 */
export function setupEventListeners() {
    // ... (其他靜態元素事件綁定保持不變) ...
    DOM.loginBtn.addEventListener('click', Handlers.handleLogin);
    DOM.logoutBtn.addEventListener('click', Handlers.handleLogout);
    
    DOM.menuToggleBtn.addEventListener('click', () => {
        DOM.leftPanel.classList.toggle('mobile-visible');
        DOM.mobileOverlay.classList.toggle('hidden');
    });
    DOM.mobileOverlay.addEventListener('click', () => {
        DOM.leftPanel.classList.remove('mobile-visible');
        DOM.mobileOverlay.classList.add('hidden');
    });

    DOM.backToCharsBtn.addEventListener('click', async () => {
        UI.showCharacterListView();
        state.activeCharacterId = null;
        state.activeChatId = null; 
        await saveSettings();
    });
    DOM.addChatBtn.addEventListener('click', Handlers.handleAddNewChat);
    DOM.editActiveCharacterBtn.addEventListener('click', () => Handlers.openCharacterEditor(state.activeCharacterId));
    DOM.deleteActiveCharacterBtn.addEventListener('click', Handlers.handleDeleteActiveCharacter);

    DOM.chatNotesInput.addEventListener('blur', Handlers.handleSaveNote);
    DOM.sendBtn.addEventListener('click', () => {
        if (DOM.sendBtn.classList.contains('is-generating')) {
            Handlers.handleStopGeneration();
        } else {
            Handlers.sendMessage();
        }
    });

    const isMobile = /Mobi|Android/i.test(navigator.userAgent);

    DOM.messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !isMobile && !e.shiftKey) {
            e.preventDefault();
            Handlers.sendMessage();
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
    DOM.deleteChatOptionBtn.addEventListener('click', Handlers.handleDeleteCurrentChat);

    window.addEventListener('click', () => {
        if (!DOM.chatOptionsMenu.classList.contains('hidden')) {
            DOM.chatOptionsMenu.classList.add('hidden');
        }
    });

    DOM.saveRenameChatBtn.addEventListener('click', Handlers.handleSaveChatName);
    DOM.cancelRenameChatBtn.addEventListener('click', () => UI.toggleModal('rename-chat-modal', false));

    DOM.updateMemoryBtn.addEventListener('click', Handlers.handleUpdateMemory);
    DOM.viewMemoryBtn.addEventListener('click', Handlers.openMemoryEditor);
    DOM.saveMemoryEditorBtn.addEventListener('click', Handlers.handleSaveMemory);
    DOM.cancelMemoryEditorBtn.addEventListener('click', () => UI.toggleModal('memory-editor-modal', false));

    DOM.addCharacterBtn.addEventListener('click', () => Handlers.openCharacterEditor());
    DOM.saveCharBtn.addEventListener('click', Handlers.handleSaveCharacter);
    DOM.cancelCharEditorBtn.addEventListener('click', () => UI.toggleModal('character-editor-modal', false));
    DOM.importCharBtn.addEventListener('click', Utils.importCharacter);
    DOM.exportCharBtn.addEventListener('click', Utils.exportCharacter);
    DOM.charAvatarUpload.addEventListener('change', (e) => Utils.handleImageUpload(e, DOM.charAvatarPreview));

    DOM.addFirstMessageBtn.addEventListener('click', () => {
        const item = document.createElement('div');
        item.className = 'first-message-item';
        const nextIndex = DOM.firstMessageList.children.length + 1;
        item.innerHTML = `
            <textarea class="char-first-message" placeholder="開場白 #${nextIndex}" rows="1"></textarea>
            <button type="button" class="icon-btn-sm danger remove-first-message-btn" title="移除此開場白">
                <i class="fa-solid fa-trash"></i>
            </button>
        `;
        DOM.firstMessageList.appendChild(item);
        const textarea = item.querySelector('textarea');
        textarea.focus();
        textarea.addEventListener('input', () => {
            textarea.style.height = 'auto';
            textarea.style.height = `${textarea.scrollHeight}px`;
        });
    });

    DOM.firstMessageList.addEventListener('click', (e) => {
        const removeBtn = e.target.closest('.remove-first-message-btn');
        if (removeBtn) {
            if (DOM.firstMessageList.children.length > 1) {
                removeBtn.closest('.first-message-item').remove();
            } else {
                alert('至少需要保留一個開場白。');
            }
        }
    });


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

    DOM.saveApiPresetBtn.addEventListener('click', Handlers.handleSaveApiPreset);
    DOM.apiPresetSelect.addEventListener('change', Handlers.handleLoadApiPreset);
    DOM.deleteApiPresetBtn.addEventListener('click', Handlers.handleDeleteApiPreset);

    DOM.settingsTabsContainer.addEventListener('click', (e) => {
        const tabButton = e.target.closest('.tab-btn');
        if (!tabButton) return;
        const tabId = tabButton.dataset.tab;
        DOM.settingsTabsContainer.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        tabButton.classList.add('active');
        DOM.globalSettingsModal.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.id === tabId);
        });
    });

    DOM.themeSelect.addEventListener('change', (e) => {
        Utils.applyTheme(e.target.value);
    });
    
    DOM.importPromptSetBtn.addEventListener('click', Handlers.handleImportPromptSet);
    DOM.deletePromptSetBtn.addEventListener('click', Handlers.handleDeletePromptSet);
    DOM.promptSetSelect.addEventListener('change', Handlers.handleSwitchPromptSet);
    
    DOM.promptList.addEventListener('click', (e) => {
        const toggle = e.target.closest('.prompt-item-toggle');
        const editBtn = e.target.closest('.edit-prompt-btn');
        
        if (toggle) {
            const item = toggle.closest('.prompt-item');
            const identifier = item.dataset.identifier;
            Handlers.handleTogglePromptEnabled(identifier);
        } else if (editBtn) {
            const item = editBtn.closest('.prompt-item');
            const identifier = item.dataset.identifier;
            Handlers.openPromptEditor(identifier);
        }
    });

    DOM.savePromptEditorBtn.addEventListener('click', Handlers.handleSavePrompt);
    DOM.cancelPromptEditorBtn.addEventListener('click', () => {
        UI.toggleModal('prompt-editor-modal', false);
        tempState.editingPromptIdentifier = null;
    });
    DOM.deletePromptEditorBtn.addEventListener('click', Handlers.handleDeletePromptItem);

    // [新增] 監聽位置下拉選單的變更
    DOM.promptEditorPositionSelect.addEventListener('change', Handlers.handlePromptPositionChange);

    let draggedIdentifier = null;

    function getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('[draggable="true"]:not(.dragging)')];
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    DOM.promptList.addEventListener('dragstart', (e) => {
        const target = e.target.closest('.prompt-item');
        if (target) {
            if (e.target.closest('.edit-prompt-btn') || e.target.closest('.prompt-item-toggle')) {
                e.preventDefault(); return;
            }
            draggedIdentifier = target.dataset.identifier;
            e.dataTransfer.effectAllowed = 'move';
            setTimeout(() => target.classList.add('dragging'), 0);
        }
    });

    DOM.promptList.addEventListener('dragend', () => {
        const draggedElement = DOM.promptList.querySelector('.dragging');
        if (draggedElement) draggedElement.classList.remove('dragging');
        draggedIdentifier = null;
    });

    DOM.promptList.addEventListener('dragover', (e) => e.preventDefault());

    DOM.promptList.addEventListener('drop', (e) => {
        e.preventDefault();
        if (!draggedIdentifier) return;
        const afterElement = getDragAfterElement(DOM.promptList, e.clientY);
        const targetIdentifier = afterElement ? afterElement.dataset.identifier : null;
        Handlers.handlePromptDropSort(draggedIdentifier, targetIdentifier);
    });

    DOM.characterList.addEventListener('dragstart', (e) => {
        const target = e.target.closest('.character-item');
        if (target) {
            if (e.target.closest('.love-char-btn')) {
                e.preventDefault(); return;
            }
            draggedIdentifier = target.dataset.id;
            e.dataTransfer.effectAllowed = 'move';
            setTimeout(() => target.classList.add('dragging'), 0);
        }
    });

    DOM.characterList.addEventListener('dragend', () => {
        const draggedElement = DOM.characterList.querySelector('.dragging');
        if (draggedElement) draggedElement.classList.remove('dragging');
        draggedIdentifier = null;
    });

    DOM.characterList.addEventListener('dragover', (e) => e.preventDefault());

    DOM.characterList.addEventListener('drop', (e) => {
        e.preventDefault();
        if (!draggedIdentifier) return;
        const afterElement = getDragAfterElement(DOM.characterList, e.clientY);
        const targetIdentifier = afterElement ? afterElement.dataset.id : null;
        Handlers.handleCharacterDropSort(draggedIdentifier, targetIdentifier);
    });

    DOM.chatSessionList.addEventListener('dragstart', (e) => {
        const target = e.target.closest('.chat-session-item');
        if (target) {
            if (e.target.closest('.session-item-actions')) {
                e.preventDefault(); return;
            }
            draggedIdentifier = target.dataset.id;
            e.dataTransfer.effectAllowed = 'move';
            setTimeout(() => target.classList.add('dragging'), 0);
        }
    });

    DOM.chatSessionList.addEventListener('dragend', () => {
        const draggedElement = DOM.chatSessionList.querySelector('.dragging');
        if (draggedElement) draggedElement.classList.remove('dragging');
        draggedIdentifier = null;
    });

    DOM.chatSessionList.addEventListener('dragover', (e) => e.preventDefault());

    DOM.chatSessionList.addEventListener('drop', (e) => {
        e.preventDefault();
        if (!draggedIdentifier) return;
        const afterElement = getDragAfterElement(DOM.chatSessionList, e.clientY);
        const targetIdentifier = afterElement ? afterElement.dataset.id : null;
        Handlers.handleChatSessionDropSort(draggedIdentifier, targetIdentifier);
    });


    DOM.addUserPersonaBtn.addEventListener('click', () => Handlers.openUserPersonaEditor());
    DOM.saveUserPersonaBtn.addEventListener('click', Handlers.handleSaveUserPersona);
    DOM.cancelUserPersonaEditorBtn.addEventListener('click', () => UI.toggleModal('user-persona-editor-modal', false));
    DOM.activeUserPersonaSelect.addEventListener('change', async (e) => {
        state.activeUserPersonaId = e.target.value;
        await saveSettings();
    });
    DOM.chatUserPersonaSelect.addEventListener('change', Handlers.handleChatPersonaChange);
    DOM.userPersonaAvatarUpload.addEventListener('change', (e) => Utils.handleImageUpload(e, DOM.userPersonaAvatarPreview));

    DOM.exportChatOptionBtn.addEventListener('click', Handlers.openExportModal);
    DOM.confirmExportChatBtn.addEventListener('click', Handlers.handleConfirmExport);
    DOM.cancelExportChatBtn.addEventListener('click', () => UI.toggleModal('export-chat-modal', false));
    DOM.cancelScreenshotBtn.addEventListener('click', Handlers.handleToggleScreenshotMode);
    DOM.generateScreenshotBtn.addEventListener('click', Handlers.handleGenerateScreenshot);

    DOM.globalExportBtn.addEventListener('click', Handlers.handleGlobalExport);
    DOM.openImportOptionsBtn.addEventListener('click', () => UI.toggleModal('import-options-modal', true));
    DOM.cancelImportOptionsBtn.addEventListener('click', () => UI.toggleModal('import-options-modal', false));
    DOM.importMergeBtn.addEventListener('click', () => {
        UI.toggleModal('import-options-modal', false);
        Handlers.handleGlobalImport('merge');
    });
    DOM.importOverwriteBtn.addEventListener('click', () => {
        UI.toggleModal('import-options-modal', false);
        Handlers.handleGlobalImport('overwrite');
    });

    DOM.googleLoginBtn.addEventListener('click', Handlers.handleGoogleLogin);
    DOM.loginForm.addEventListener('submit', Handlers.handleEmailLogin);
    DOM.registerForm.addEventListener('submit', Handlers.handleEmailRegister);
    DOM.cancelAuthModalBtn.addEventListener('click', () => UI.toggleModal('auth-modal', false));
    DOM.showRegisterViewBtn.addEventListener('click', (e) => {
        e.preventDefault();
        DOM.loginView.classList.add('hidden');
        DOM.registerView.classList.remove('hidden');
    });
    DOM.showLoginViewBtn.addEventListener('click', (e) => {
        e.preventDefault();
        DOM.registerView.classList.add('hidden');
        DOM.loginView.classList.remove('hidden');
    });


    window.addEventListener('resize', Utils.setAppHeight);

    // ================== 事件委派 (處理動態產生的元素) ==================

    DOM.characterList.addEventListener('click', async (e) => {
        const charItem = e.target.closest('.character-item');
        if (!charItem) return;

        const charId = charItem.dataset.id;
        
        if (e.target.closest('.love-char-btn')) {
            await Handlers.handleToggleCharacterLove(charId);
        } else {
            await loadChatDataForCharacter(charId);
            UI.showChatSessionListView(charId);
            state.activeCharacterId = charId;
            state.activeChatId = null; 
            await saveSettings();
        }
    });

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

    DOM.chatWindow.addEventListener('click', async (e) => {
        const messageRow = e.target.closest('.message-row');
        if (!messageRow) {
            if (!tempState.isScreenshotMode) {
                document.querySelectorAll('.message-row.show-actions').forEach(row => row.classList.remove('show-actions'));
            }
            return;
        }
        
        const messageIndex = parseInt(messageRow.dataset.index, 10);

        if (tempState.isScreenshotMode) {
            Handlers.handleSelectMessage(messageIndex);
            return;
        }

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
