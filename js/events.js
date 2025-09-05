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
    // 帳號認證
    DOM.loginBtnInSettings.addEventListener('click', Handlers.handleLogin);
    DOM.logoutBtn.addEventListener('click', Handlers.handleLogout);

    // 側邊欄與行動裝置
    DOM.menuToggleBtn.addEventListener('click', () => {
        DOM.leftPanel.classList.toggle('mobile-visible');
        DOM.mobileOverlay.classList.toggle('hidden');
    });
    DOM.mobileOverlay.addEventListener('click', () => {
        DOM.leftPanel.classList.remove('mobile-visible');
        DOM.mobileOverlay.classList.add('hidden');
    });

    // 角色與聊天室列表
    DOM.backToCharsBtn.addEventListener('click', async () => {
        UI.switchPanelToCharacterView(); 
        state.activeChatId = null; 
        await saveSettings();
    });
    DOM.addChatBtn.addEventListener('click', Handlers.handleAddNewChat);
    DOM.editActiveCharacterBtn.addEventListener('click', () => Handlers.openCharacterEditor(state.activeCharacterId));
    DOM.deleteActiveCharacterBtn.addEventListener('click', Handlers.handleDeleteActiveCharacter);
    DOM.headerLoveChatBtn.addEventListener('click', () => Handlers.handleToggleCharacterLove(state.activeCharacterId));

    // 聊天介面
    DOM.chatNotesInput.addEventListener('blur', Handlers.handleSaveNote);
    DOM.sendBtn.addEventListener('click', () => {
        if (DOM.sendBtn.classList.contains('is-generating')) {
            Handlers.handleStopGeneration();
        } else {
            Handlers.handleSendMessageOrContinue();
        }
    });

    const isMobile = /Mobi|Android/i.test(navigator.userAgent);
    DOM.messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !isMobile && !e.shiftKey) {
            e.preventDefault();
            Handlers.handleSendMessageOrContinue();
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

    // Modals (彈出視窗)
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

    // 角色編輯器內的特定事件
    DOM.charEditorModal.addEventListener('click', (e) => {
        const header = e.target.closest('.advanced-section-header');
        if (header) {
            header.parentElement.classList.toggle('expanded');
        }
    });


    // 全域设定 Modal
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

    // API 设定档
    DOM.saveApiPresetBtn.addEventListener('click', Handlers.handleSaveApiPreset);
    DOM.apiPresetSelect.addEventListener('change', Handlers.handleLoadApiPreset);
    DOM.deleteApiPresetBtn.addEventListener('click', Handlers.handleDeleteApiPreset);

    // 设定分页
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
    
    // 提示词库
    DOM.importPromptSetBtn.addEventListener('click', Handlers.handleImportPromptSet);
    DOM.deletePromptSetBtn.addEventListener('click', Handlers.handleDeletePromptSet);
    DOM.promptSetSelect.addEventListener('change', Handlers.handleSwitchPromptSet);
    DOM.promptList.addEventListener('click', (e) => {
        const toggle = e.target.closest('.prompt-item-toggle');
        const editBtn = e.target.closest('.edit-prompt-btn');
        if (toggle) {
            Handlers.handleTogglePromptEnabled(toggle.closest('.prompt-item').dataset.identifier);
        } else if (editBtn) {
            Handlers.openPromptEditor(editBtn.closest('.prompt-item').dataset.identifier);
        }
    });
    DOM.savePromptEditorBtn.addEventListener('click', Handlers.handleSavePrompt);
    DOM.cancelPromptEditorBtn.addEventListener('click', () => {
        UI.toggleModal('prompt-editor-modal', false);
        tempState.editingPromptIdentifier = null;
    });
    DOM.deletePromptEditorBtn.addEventListener('click', Handlers.handleDeletePromptItem);
    DOM.promptEditorPositionSelect.addEventListener('change', Handlers.handlePromptPositionChange);

    // 世界书 (Lorebook)
    DOM.addLorebookBtn.addEventListener('click', Handlers.handleAddNewLorebook);
    DOM.renameLorebookBtn.addEventListener('click', Handlers.handleRenameLorebook);
    DOM.importLorebookBtn.addEventListener('click', Handlers.handleImportLorebook);
    DOM.deleteLorebookBtn.addEventListener('click', Handlers.handleDeleteLorebook);
    DOM.lorebookSelect.addEventListener('change', Handlers.handleSwitchLorebook);
    DOM.addLorebookEntryBtn.addEventListener('click', () => Handlers.openLorebookEditor());
    DOM.lorebookEntryList.addEventListener('click', (e) => {
        const item = e.target.closest('.prompt-item');
        if (!item) return;
        const entryId = item.dataset.id;
        if (e.target.closest('.prompt-item-toggle')) {
            Handlers.handleToggleLorebookEntryEnabled(entryId);
        } else if (e.target.closest('.edit-lorebook-entry-btn')) {
            Handlers.openLorebookEditor(entryId);
        }
    });
    DOM.saveLorebookEntryBtn.addEventListener('click', Handlers.handleSaveLorebookEntry);
    DOM.cancelLorebookEditorBtn.addEventListener('click', () => {
        UI.toggleModal('lorebook-editor-modal', false);
        tempState.editingLorebookEntryId = null;
    });
    DOM.deleteLorebookEntryBtn.addEventListener('click', Handlers.handleDeleteLorebookEntry);


    // 正規表達式
    DOM.addRegexRuleBtn.addEventListener('click', Handlers.handleAddRegexRule);
    DOM.regexRulesList.addEventListener('change', Handlers.handleRegexRuleChange);
    DOM.regexRulesList.addEventListener('click', (e) => {
        const ruleItem = e.target.closest('.regex-rule-item');
        if (!ruleItem) return;
        const ruleId = ruleItem.dataset.id;
        
        if (e.target.closest('.prompt-item-toggle')) {
            Handlers.handleRegexRuleToggle(ruleId);
        } else if (e.target.closest('.delete-regex-rule-btn')) {
            Handlers.handleDeleteRegexRule(ruleId);
        } else if (e.target.closest('.regex-expand-btn')) {
            ruleItem.classList.toggle('expanded');
        }
    });

    // 使用者角色
    DOM.addUserPersonaBtn.addEventListener('click', () => Handlers.openUserPersonaEditor());
    DOM.saveUserPersonaBtn.addEventListener('click', Handlers.handleSaveUserPersona);
    DOM.cancelUserPersonaEditorBtn.addEventListener('click', () => UI.toggleModal('user-persona-editor-modal', false));
    DOM.activeUserPersonaSelect.addEventListener('change', async (e) => {
    // 確保只更新使用者角色，不影響其他狀態
    const oldCharacterId = state.activeCharacterId;
    const oldChatId = state.activeChatId;
    
    state.activeUserPersonaId = e.target.value;
    await saveSettings();
    
    // 確保活躍狀態不變
    state.activeCharacterId = oldCharacterId;
    state.activeChatId = oldChatId;
});
    DOM.chatUserPersonaSelect.addEventListener('change', Handlers.handleChatPersonaChange);
    DOM.userPersonaAvatarUpload.addEventListener('change', (e) => Utils.handleImageUpload(e, DOM.userPersonaAvatarPreview));

    // 匯出與截圖
    DOM.exportChatOptionBtn.addEventListener('click', Handlers.openExportModal);
    DOM.confirmExportChatBtn.addEventListener('click', Handlers.handleConfirmExport);
    DOM.cancelExportChatBtn.addEventListener('click', () => UI.toggleModal('export-chat-modal', false));
    DOM.cancelScreenshotBtn.addEventListener('click', Handlers.handleToggleScreenshotMode);
    DOM.generateScreenshotBtn.addEventListener('click', Handlers.handleGenerateScreenshot);

    // 全域匯入/匯出
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

    // 登入 Modal
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
        if (!charItem || e.target.closest('.drag-handle')) return;

        const charId = charItem.dataset.id;
        await loadChatDataForCharacter(charId);
        UI.showChatSessionListView(charId);
        state.activeCharacterId = charId;
        state.activeChatId = null; 
        await saveSettings();
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

    // [REVISED] 拖曳排序邏輯 (支援長按與觸控)
    let draggedId = null;
    let draggedElement = null;
    let longPressTimer = null;

    function getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('[data-id]:not(.dragging)')];
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

    const setupDragSort = (container, handler) => {
        const onPointerDown = (e) => {
            // [MODIFIED] Trigger drag on the entire item, not just the handle
            const targetItem = e.target.closest('[data-id]');
            if (!targetItem) return;
    
            // Prevent drag from starting on interactive elements inside the item
            if (e.target.closest('button, a, input, select, textarea')) return;

            if (e.pointerType === 'touch') {
                e.preventDefault();
            }
            if (e.pointerType === 'mouse' && e.button !== 0) return;
    
            draggedElement = targetItem;
            if (!draggedElement) return;
    
            longPressTimer = setTimeout(() => {
                if (draggedElement) {
                    draggedElement.setAttribute('draggable', 'true');
                    // Manually trigger dragstart for touch, as it's not native
                    if (e.pointerType === 'touch') {
                       const dragStartEvent = new DragEvent('dragstart', {
                           bubbles: true,
                           cancelable: true,
                       });
                       draggedElement.dispatchEvent(dragStartEvent);
                    }
                }
            }, 500); // 500ms for long press
        };
    
        const onPointerUpOrCancel = () => {
            clearTimeout(longPressTimer);
            if (draggedElement && !draggedElement.classList.contains('dragging')) {
                 draggedElement.removeAttribute('draggable');
            }
        };

        const onPointerMove = (e) => {
             // If we move too much, cancel the long press timer
            if (longPressTimer) {
                 clearTimeout(longPressTimer);
            }
        };
        
        container.addEventListener('pointerdown', onPointerDown, { passive: false });
        document.addEventListener('pointerup', onPointerUpOrCancel);
        document.addEventListener('pointercancel', onPointerUpOrCancel);
        document.addEventListener('pointermove', onPointerMove);

        container.addEventListener('dragstart', (e) => {
            const target = e.target.closest('[data-id]');
            if (target) {
                draggedElement = target; // Ensure draggedElement is set
                draggedId = target.dataset.id || target.dataset.identifier;
                // Use a minimal data transfer object for compatibility
                if (e.dataTransfer) {
                   e.dataTransfer.effectAllowed = 'move';
                   e.dataTransfer.setData('text/plain', draggedId);
                }
                setTimeout(() => {
                    if (draggedElement) {
                        draggedElement.classList.add('dragging');
                        document.body.classList.add('is-dragging'); // Change cursor globally
                    }
                }, 0);
            } else {
                e.preventDefault();
            }
        });
    
        container.addEventListener('dragend', () => {
            if (draggedElement) {
                draggedElement.classList.remove('dragging');
                draggedElement.removeAttribute('draggable');
            }
            document.body.classList.remove('is-dragging'); // Revert global cursor
            clearTimeout(longPressTimer);
            draggedElement = null;
            draggedId = null;
        });
    
        container.addEventListener('dragover', (e) => {
            e.preventDefault();
        });
    
        container.addEventListener('drop', (e) => {
            e.preventDefault();
            if (!draggedId) return;
    
            const afterElement = getDragAfterElement(container, e.clientY);
            const targetId = afterElement ? (afterElement.dataset.id || afterElement.dataset.identifier) : null;
            
            handler(draggedId, targetId);
        });
    };

    setupDragSort(DOM.characterList, Handlers.handleCharacterDropSort);
    setupDragSort(DOM.chatSessionList, Handlers.handleChatSessionDropSort);
    setupDragSort(DOM.promptList, Handlers.handlePromptDropSort);
}
