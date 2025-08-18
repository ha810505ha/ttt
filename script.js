document.addEventListener('DOMContentLoaded', () => {
    // ===================================================================================
    // 1. 元素選取 (DOM Elements)
    // ===================================================================================
    const mobileOverlay = document.getElementById('mobile-overlay');
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    const menuToggleBtn = document.getElementById('menu-toggle-btn');
    const leftPanel = document.getElementById('left-panel');
    const characterView = document.getElementById('character-view');
    const chatSessionView = document.getElementById('chat-session-view');
    const backToCharsBtn = document.getElementById('back-to-chars-btn');
    const chatListHeaderName = document.getElementById('chat-list-header-name');
    const editActiveCharacterBtn = document.getElementById('edit-active-character-btn');
    const chatSessionList = document.getElementById('chat-session-list');
    const addChatBtn = document.getElementById('add-chat-btn');
    const deleteCurrentChatBtn = document.getElementById('delete-current-chat-btn');
    const chatNotesInput = document.getElementById('chat-notes-input');
    const renameChatModal = document.getElementById('rename-chat-modal');
    const renameChatInput = document.getElementById('rename-chat-input');
    const cancelRenameChatBtn = document.getElementById('cancel-rename-chat-btn');
    const saveRenameChatBtn = document.getElementById('save-rename-chat-btn');
    
    const updateMemoryBtn = document.getElementById('update-memory-btn');
    const characterList = document.getElementById('character-list');
    const addCharacterBtn = document.getElementById('add-character-btn');
    const globalSettingsBtn = document.getElementById('global-settings-btn');
    const welcomeScreen = document.getElementById('welcome-screen');
    const chatInterface = document.getElementById('chat-interface');
    const chatHeaderAvatar = document.getElementById('chat-header-avatar');
    const chatHeaderName = document.getElementById('chat-header-name');
    const exportCurrentChatBtn = document.getElementById('export-current-chat-btn');
    const chatWindow = document.getElementById('chat-window');
    const promptSettingsBtn = document.getElementById('prompt-settings-btn');
    const messageInput = document.getElementById('message-input');
    const sendBtn = document.getElementById('send-btn');
    const charEditorModal = document.getElementById('character-editor-modal');
    const charEditorTitle = document.getElementById('character-editor-title');
    const charAvatarUpload = document.getElementById('char-avatar-upload'); // 【修改】
    const charAvatarPreview = document.getElementById('char-avatar-preview');
    const charNameInput = document.getElementById('char-name');
    const charDescriptionInput = document.getElementById('char-description');
    const charFirstMessageInput = document.getElementById('char-first-message');
    const charExampleDialogueInput = document.getElementById('char-example-dialogue');
    const importCharBtn = document.getElementById('import-char-btn');
    const exportCharBtn = document.getElementById('export-char-btn');
    const deleteCharBtn = document.getElementById('delete-char-btn');
    const cancelCharEditorBtn = document.getElementById('cancel-char-editor-btn');
    const saveCharBtn = document.getElementById('save-char-btn');
    const globalSettingsModal = document.getElementById('global-settings-modal');
    const apiProviderSelect = document.getElementById('api-provider');
    const apiModelSelect = document.getElementById('api-model-select');
    const apiKeyInput = document.getElementById('api-key');
    const userAvatarUpload = document.getElementById('user-avatar-upload'); // 【修改】
    const userAvatarPreview = document.getElementById('user-avatar-preview');
    const userNameInput = document.getElementById('user-name');
    const userDescriptionInput = document.getElementById('user-description');
    const cancelGlobalSettingsBtn = document.getElementById('cancel-global-settings-btn');
    const saveGlobalSettingsBtn = document.getElementById('save-global-settings-btn');
    const temperatureSlider = document.getElementById('temperature-slider');
    const temperatureValue = document.getElementById('temperature-value');
    const topPSlider = document.getElementById('top-p-slider');
    const topPValue = document.getElementById('top-p-value');
    const repetitionPenaltySlider = document.getElementById('repetition-penalty-slider');
    const repetitionPenaltyValue = document.getElementById('repetition-penalty-value');
    const contextSizeInput = document.getElementById('context-size-input');
    const maxTokensSlider = document.getElementById('max-tokens-slider');
    const maxTokensValue = document.getElementById('max-tokens-value');
    const promptSettingsModal = document.getElementById('prompt-settings-modal');
    const promptSettingsBody = document.getElementById('prompt-settings-body');
    const cancelPromptSettingsBtn = document.getElementById('cancel-prompt-settings-btn');

    // ===================================================================================
    // 2. 應用程式狀態 (Application State)
    // ===================================================================================
    let state = {
        characters: [],
        chatHistories: {}, 
        longTermMemories: {},
        chatMetadatas: {}, 
        activeCharacterId: null,
        activeChatId: null,
        globalSettings: {},
        promptSettings: {}
    };
    let editingCharacterId = null;
    let renamingChatId = null;
    const DEFAULT_AVATAR = 'https://placehold.co/100x100/EFEFEF/AAAAAA?text=頭像';
    const DEFAULT_SUMMARY_PROMPT = `請將以下對話的關鍵事實、事件、使用者偏好和角色行為總結成幾個要點，以便在未來的對話中能回憶起重點。\n\n對話內容：\n{{conversation}}`;
    
    const MODELS = {
        openai: [
            'gpt-5', 'gpt-5-2025-08-07', 'gpt-5-chat-latest', 'gpt-5-mini', 'gpt-5-mini-2025-08-07', 'gpt-5-nano', 'gpt-5-nano-2025-08-07',
            'gpt-4o', 'gpt-4o-2024-11-20', 'gpt-4o-2024-08-06', 'gpt-4o-2024-05-13', 'chatgpt-4o-latest',
            'gpt-4.1', 'gpt-4.1-2025-04-14', 'gpt-4.1-mini', 'gpt-4.1-mini-2025-04-14', 'gpt-4.1-nano', 'gpt-4.1-nano-2025-04-14',
            'gpt-4-turbo', 'gpt-3.5-turbo'
        ],
        anthropic: [
            'claude-opus-4-1', 'claude-opus-4-1-20250805', 'claude-opus-4-0', 'claude-opus-4-20250514',
            'claude-sonnet-4-0', 'claude-sonnet-4-20250514',
            'claude-3-7-sonnet-latest', 'claude-3-7-sonnet-20250219',
            'claude-3-5-sonnet-latest', 'claude-3-5-sonnet-20241022', 'claude-3-5-sonnet-20240620',
            'claude-3-5-haiku-latest', 'claude-3-5-haiku-20241022',
            'claude-3-opus-20240229', 'claude-3-haiku-20240307'
        ],
        google: [
            'gemini-2.5-pro', 'gemini-2.5-pro-preview-06-05', 'gemini-2.5-pro-preview-05-06', 'gemini-2.5-pro-preview-03-25', 'gemini-2.5-pro-exp-03-25',
            'gemini-2.5-flash', 'gemini-2.5-flash-preview-05-20', 'gemini-2.5-flash-preview-04-17',
            'gemini-2.5-flash-lite', 'gemini-2.5-flash-lite-preview-06-17',
            'gemini-2.0-flash',
            'gemini-1.5-pro-latest', 'gemini-pro'
        ],
        xai: [
            'grok-4-0709', 'grok-3-beta', 'grok-3-fast-beta', 'grok-3-mini-beta', 'grok-3-mini-fast-beta', 'grok-1'
        ],
        mistral: [
            'mistral-large-latest', 'mistral-medium-latest', 'mistral-small-latest', 'open-mistral-7b'
        ]
    };

    // ===================================================================================
    // 3. 主要初始化與事件監聽
    // ===================================================================================
    function initialize() {
        loadStateFromLocalStorage();
        applyTheme();
        renderCharacterList();
        renderActiveChat();
        setupEventListeners();
    }

    function setupEventListeners() {
        themeToggleBtn.addEventListener('click', toggleTheme);
        menuToggleBtn.addEventListener('click', () => {
            leftPanel.classList.toggle('mobile-visible');
            mobileOverlay.classList.toggle('hidden');
        });
        mobileOverlay.addEventListener('click', () => {
            leftPanel.classList.remove('mobile-visible');
            mobileOverlay.classList.add('hidden');
        });

        backToCharsBtn.addEventListener('click', showCharacterListView);
        addChatBtn.addEventListener('click', handleAddNewChat);
        editActiveCharacterBtn.addEventListener('click', () => openCharacterEditor(state.activeCharacterId));
        deleteCurrentChatBtn.addEventListener('click', handleDeleteCurrentChat);
        chatNotesInput.addEventListener('blur', handleSaveNote);
        saveRenameChatBtn.addEventListener('click', handleSaveChatName);
        cancelRenameChatBtn.addEventListener('click', () => toggleModal('rename-chat-modal', false));

        updateMemoryBtn.addEventListener('click', handleUpdateMemory);
        addCharacterBtn.addEventListener('click', () => openCharacterEditor());
        saveCharBtn.addEventListener('click', handleSaveCharacter);
        cancelCharEditorBtn.addEventListener('click', () => toggleModal('character-editor-modal', false));
        deleteCharBtn.addEventListener('click', handleDeleteCharacter);
        importCharBtn.addEventListener('click', importCharacter);
        exportCharBtn.addEventListener('click', exportCharacter);
        globalSettingsBtn.addEventListener('click', () => {
            loadGlobalSettingsToUI();
            toggleModal('global-settings-modal', true);
        });
        saveGlobalSettingsBtn.addEventListener('click', handleSaveGlobalSettings);
        cancelGlobalSettingsBtn.addEventListener('click', () => toggleModal('global-settings-modal', false));
        setupSliderSync(temperatureSlider, temperatureValue);
        setupSliderSync(topPSlider, topPValue);
        setupSliderSync(repetitionPenaltySlider, repetitionPenaltyValue);
        setupSliderSync(maxTokensSlider, maxTokensValue);
        apiProviderSelect.addEventListener('change', updateModelDropdown);
        promptSettingsBtn.addEventListener('click', () => {
            buildPromptSettingsUI();
            toggleModal('prompt-settings-modal', true);
        });
        cancelPromptSettingsBtn.addEventListener('click', () => toggleModal('prompt-settings-modal', false));
        sendBtn.addEventListener('click', sendMessage);
        messageInput.addEventListener('keydown', e => (e.key === 'Enter' && !e.shiftKey) && (e.preventDefault(), sendMessage()));
        exportCurrentChatBtn.addEventListener('click', exportChat);
        chatWindow.addEventListener('click', (e) => {
            if (e.target === chatWindow) {
                document.querySelectorAll('.message-row.show-actions').forEach(row => row.classList.remove('show-actions'));
            }
        });

        // 【新增】檔案上傳事件監聽
        charAvatarUpload.addEventListener('change', (e) => handleImageUpload(e, charAvatarPreview));
        userAvatarUpload.addEventListener('change', (e) => handleImageUpload(e, userAvatarPreview));
    }
    
    function setupSliderSync(slider, numberInput) {
        slider.addEventListener('input', () => numberInput.value = slider.value);
        numberInput.addEventListener('input', () => slider.value = numberInput.value);
    }

    // ===================================================================================
    // 4. 狀態管理 (State Management - Load/Save)
    // ===================================================================================
    function loadStateFromLocalStorage() {
        state.characters = JSON.parse(localStorage.getItem('characters')) || [];
        state.chatHistories = JSON.parse(localStorage.getItem('chatHistories')) || {};
        state.longTermMemories = JSON.parse(localStorage.getItem('longTermMemories')) || {};
        state.chatMetadatas = JSON.parse(localStorage.getItem('chatMetadatas')) || {};
        
        let loadedCharId = localStorage.getItem('activeCharacterId');
        let loadedChatId = localStorage.getItem('activeChatId');
        state.activeCharacterId = loadedCharId && loadedCharId !== 'null' ? loadedCharId : null;
        state.activeChatId = loadedChatId && loadedChatId !== 'null' ? loadedChatId : null;

        state.globalSettings = JSON.parse(localStorage.getItem('globalSettings')) || {};
        state.promptSettings = JSON.parse(localStorage.getItem('promptSettings')) || {};

        migrateAndValidateState();

        if (!state.characters.find(c => c.id === state.activeCharacterId)) {
            state.activeCharacterId = null;
            state.activeChatId = null;
        }
        if (state.activeCharacterId && (!state.chatHistories[state.activeCharacterId] || !state.chatHistories[state.activeCharacterId][state.activeChatId])) {
            state.activeChatId = null;
        }
    }

    function migrateAndValidateState() {
        for (const char of state.characters) {
            if (!state.chatHistories[char.id]) state.chatHistories[char.id] = {};
            if (!state.chatMetadatas[char.id]) state.chatMetadatas[char.id] = {};

            const historyIds = Object.keys(state.chatHistories[char.id]);
            const metadataIds = Object.keys(state.chatMetadatas[char.id]);

            for (const chatId of historyIds) {
                if (!state.chatMetadatas[char.id][chatId]) {
                    console.log(`遷移資料：為聊天室 ${chatId} 建立 metadata`);
                    state.chatMetadatas[char.id][chatId] = { name: '', pinned: false, notes: '' };
                }
            }

            for (const chatId of metadataIds) {
                if (!state.chatHistories[char.id][chatId]) {
                    console.log(`清理資料：刪除孤兒 metadata ${chatId}`);
                    delete state.chatMetadatas[char.id][chatId];
                }
            }
        }
    }

    function saveState() {
        localStorage.setItem('characters', JSON.stringify(state.characters));
        localStorage.setItem('chatHistories', JSON.stringify(state.chatHistories));
        localStorage.setItem('longTermMemories', JSON.stringify(state.longTermMemories));
        localStorage.setItem('chatMetadatas', JSON.stringify(state.chatMetadatas));
        localStorage.setItem('activeCharacterId', state.activeCharacterId || '');
        localStorage.setItem('activeChatId', state.activeChatId || '');
        localStorage.setItem('globalSettings', JSON.stringify(state.globalSettings));
        localStorage.setItem('promptSettings', JSON.stringify(state.promptSettings));
    }

    // ===================================================================================
    // 5. 畫面渲染 (UI Rendering)
    // ===================================================================================
    
    function showCharacterListView() {
        leftPanel.classList.remove('show-chats');
        leftPanel.classList.remove('mobile-visible');
        mobileOverlay.classList.add('hidden');
        state.activeCharacterId = null;
        saveState();
    }

    function showChatSessionListView(charId) {
        try {
            state.activeCharacterId = charId;
            const character = state.characters.find(c => c.id === charId);
            if (!character) {
                console.error("找不到角色:", charId);
                return;
            }
            
            leftPanel.classList.add('show-chats');
            chatListHeaderName.textContent = character.name;
            renderChatSessionList();
            saveState();
        } catch (error) {
            console.error("顯示聊天室列表時發生錯誤:", error);
            alert("載入聊天室列表時發生錯誤，請檢查主控台。");
            leftPanel.classList.remove('show-chats');
        }
    }

    function renderCharacterList() {
        characterList.innerHTML = '';
        state.characters.forEach(char => {
            const item = document.createElement('li');
            item.className = 'character-item';
            item.dataset.id = char.id;
            item.innerHTML = `
                <img src="${char.avatarUrl || DEFAULT_AVATAR}" alt="${char.name}" class="char-item-avatar">
                <span class="char-item-name">${char.name}</span>
            `;
            item.addEventListener('click', () => showChatSessionListView(char.id));
            characterList.appendChild(item);
        });
    }

    function renderChatSessionList() {
        chatSessionList.innerHTML = '';
        const sessions = state.chatHistories[state.activeCharacterId] || {};
        const metadatas = state.chatMetadatas[state.activeCharacterId] || {};
        
        const sortedSessions = Object.keys(sessions)
            .map(chatId => {
                const history = sessions[chatId];
                const metadata = metadatas[chatId] || { name: '', pinned: false, notes: '' };
                const lastMessage = history && history.length > 0 ? history[history.length - 1] : null;
                return {
                    id: chatId,
                    name: metadata.name,
                    pinned: metadata.pinned,
                    lastMessage: lastMessage
                };
            })
            .sort((a, b) => {
                if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
                const timeA = a.lastMessage ? new Date(a.lastMessage.timestamp).getTime() : 0;
                const timeB = b.lastMessage ? new Date(b.lastMessage.timestamp).getTime() : 0;
                return timeB - timeA;
            });

        if (sortedSessions.length === 0) {
            chatSessionList.innerHTML = `<li class="list-placeholder">尚無對話</li>`;
            return;
        }

        sortedSessions.forEach(session => {
            const displayName = (session.pinned ? '📌 ' : '') + (session.name || (session.lastMessage ? session.lastMessage.content.substring(0, 25) + '...' : '新對話'));
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
            item.querySelector('.session-item-content').addEventListener('click', () => {
                switchChat(session.id);
                leftPanel.classList.remove('mobile-visible');
                mobileOverlay.classList.add('hidden');
            });
            item.querySelector('.pin-chat-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                handleTogglePinChat(session.id);
            });
            item.querySelector('.rename-chat-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                openRenameModal(session.id);
            });
            chatSessionList.appendChild(item);
        });
    }


    function renderActiveChat() {
        if (!state.activeCharacterId || !state.activeChatId) {
            welcomeScreen.classList.remove('hidden');
            chatInterface.classList.add('hidden');
            return;
        }
        welcomeScreen.classList.add('hidden');
        chatInterface.classList.remove('hidden');
        
        const activeChar = state.characters.find(c => c.id === state.activeCharacterId);
        if (!activeChar) return;
        
        const metadata = state.chatMetadatas[state.activeCharacterId]?.[state.activeChatId] || {};

        chatHeaderAvatar.src = activeChar.avatarUrl || DEFAULT_AVATAR;
        chatHeaderName.textContent = activeChar.name;
        chatNotesInput.value = metadata.notes || '';
        renderChatMessages();
    }

    function renderChatMessages() {
        chatWindow.innerHTML = '';
        const history = state.chatHistories[state.activeCharacterId]?.[state.activeChatId] || [];
        history.forEach((msg, index) => {
            displayMessage(msg.content, msg.role, msg.timestamp, index, false);
        });
    }

    function displayMessage(text, sender, timestamp, index, isNew) {
        const userAvatar = state.globalSettings.userAvatarUrl || DEFAULT_AVATAR;
        const activeChar = state.characters.find(c => c.id === state.activeCharacterId);
        const charAvatar = activeChar?.avatarUrl || DEFAULT_AVATAR;
        const avatarUrl = sender === 'user' ? userAvatar : charAvatar;
        const row = document.createElement('div');
        row.className = `message-row ${sender === 'user' ? 'user-row' : 'assistant-row'}`;
        const safeText = text.replace(/</g, "&lt;").replace(/>/g, "&gt;");
        const formattedTimestamp = new Date(timestamp).toLocaleString('zh-TW', { hour12: false, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });

        row.innerHTML = `
            <img src="${avatarUrl}" alt="${sender} avatar" class="chat-avatar">
            <div class="bubble-container">
                <div class="chat-bubble">${safeText}</div>
                <div class="message-timestamp">${formattedTimestamp}</div>
            </div>
            <button class="icon-btn edit-msg-btn" title="編輯訊息"><i class="fa-solid fa-pencil"></i></button>
        `;
        
        const bubble = row.querySelector('.chat-bubble');
        bubble.addEventListener('click', (e) => {
            e.stopPropagation();
            document.querySelectorAll('.message-row.show-actions').forEach(otherRow => {
                if (otherRow !== row) otherRow.classList.remove('show-actions');
            });
            row.classList.toggle('show-actions');
        });

        row.querySelector('.edit-msg-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            makeMessageEditable(row, index);
        });

        chatWindow.appendChild(row);
        if (isNew) {
            chatWindow.scrollTop = chatWindow.scrollHeight;
        }
        return row;
    }

    // ===================================================================================
    // 6. 核心邏輯 (Core Logic)
    // ===================================================================================
    function switchChat(chatId) {
        if (state.activeChatId === chatId) return;
        state.activeChatId = chatId;
        saveState();
        renderChatSessionList();
        renderActiveChat();
    }

    async function sendMessage() {
        if (!state.activeCharacterId || !state.activeChatId) return;
        const messageText = messageInput.value.trim();
        if (messageText === '') return;

        const timestamp = new Date().toISOString();
        const history = state.chatHistories[state.activeCharacterId][state.activeChatId];
        
        history.push({ role: 'user', content: messageText, timestamp: timestamp });
        displayMessage(messageText, 'user', timestamp, history.length - 1, true);
        messageInput.value = '';

        const thinkingBubbleContainer = displayMessage('...', 'assistant', new Date().toISOString(), history.length, true);
        const thinkingBubble = thinkingBubbleContainer.querySelector('.chat-bubble');
        const thinkingTimestamp = thinkingBubbleContainer.querySelector('.message-timestamp');
        
        try {
            const messagesForApi = buildApiMessages();
            const aiResponse = await callApi(messagesForApi);
            const aiTimestamp = new Date().toISOString();
            
            history.push({ role: 'assistant', content: aiResponse, timestamp: aiTimestamp });
            thinkingBubble.textContent = aiResponse;
            thinkingTimestamp.textContent = new Date(aiTimestamp).toLocaleString('zh-TW', { hour12: false, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
            
            saveState();
            renderChatSessionList();
        } catch (error) {
            thinkingBubble.textContent = `發生錯誤: ${error.message}`;
            console.error("API Error:", error);
            history.pop();
        }
    }

    function buildSystemPrompt() {
        if (!state.activeCharacterId || !state.activeChatId) return "";
        const char = state.characters.find(c => c.id === state.activeCharacterId);
        const user = state.globalSettings;
        const prompts = state.promptSettings;
        const memory = state.longTermMemories[state.activeCharacterId]?.[state.activeChatId];
        let prompt = "";
        if (memory) prompt += `[Previous Conversation Summary]\n${memory}\n\n`;
        if (char.description) prompt += `[Persona of ${char.name}]\n${char.description}\n\n`;
        if (user.userDescription) prompt += `[Persona of ${user.userName || 'User'}]\n${user.userDescription}\n\n`;
        if (prompts.scenario) prompt += `[Scenario]\n${prompts.scenario}\n\n`;
        if (char.exampleDialogue) {
            const formattedExamples = char.exampleDialogue.replace(/{{char}}/g, char.name).replace(/{{user}}/g, user.userName || 'User');
            prompt += `[Example Dialogues]\n${formattedExamples}\n\n`;
        }
        if (prompts.jailbreak) prompt += `${prompts.jailbreak}\n\n`;
        return prompt.trim();
    }
    
    function buildApiMessages() {
        if (!state.activeCharacterId || !state.activeChatId) return [];
        const provider = state.globalSettings.apiProvider || 'openai';
        const history = state.chatHistories[state.activeCharacterId][state.activeChatId] || [];
        const contextSize = parseInt(state.globalSettings.contextSize) || 20;
        const systemPrompt = buildSystemPrompt();
        const recentHistory = history.map(({ role, content }) => ({ role, content })).slice(-contextSize);
        if (provider === 'anthropic') return { system: systemPrompt, messages: recentHistory };
        if (provider === 'google') {
            const contents = recentHistory.map(msg => ({ role: msg.role === 'assistant' ? 'model' : msg.role, parts: [{ text: msg.content }] }));
            if (systemPrompt) {
                contents.unshift({ role: 'user', parts: [{ text: systemPrompt }] });
                contents.push({ role: 'model', parts: [{ text: "OK." }] });
            }
            return contents;
        }
        const messages = [];
        if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
        messages.push(...recentHistory);
        return messages;
    }
    
    async function callApi(messagePayload, isForSummarization = false) {
        const settings = state.globalSettings;
        const provider = settings.apiProvider || 'openai';
        if (!settings.apiKey) throw new Error('尚未設定 API 金鑰。');
        let url = "", headers = {}, body = {};
        const baseParams = {
            model: settings.apiModel,
            temperature: isForSummarization ? 0.5 : parseFloat(settings.temperature),
            top_p: isForSummarization ? 1 : parseFloat(settings.topP),
            max_tokens: isForSummarization ? 1000 : parseInt(settings.maxTokens),
        };
        if (provider === 'openai' || provider === 'mistral' || provider === 'xai') {
            baseParams.frequency_penalty = parseFloat(settings.repetitionPenalty);
        }
        switch (provider) {
            case "openai": case "mistral": case "xai":
                url = provider === 'openai' ? 'https://api.openai.com/v1/chat/completions' : provider === 'mistral' ? 'https://api.mistral.ai/v1/chat/completions' : 'https://api.x.ai/v1/chat/completions';
                headers = { "Content-Type": "application/json", "Authorization": `Bearer ${settings.apiKey}` };
                body = { ...baseParams, messages: messagePayload };
                if (body.top_p >= 1) delete body.top_p;
                break;
            case "anthropic":
                url = "https://api.anthropic.com/v1/messages";
                headers = { "Content-Type": "application/json", "x-api-key": settings.apiKey, "anthropic-version": "2023-06-01" };
                body = { ...baseParams, system: messagePayload.system, messages: messagePayload.messages };
                if (body.top_p >= 1) delete body.top_p;
                break;
            case "google":
                url = `https://generativelanguage.googleapis.com/v1beta/models/${settings.apiModel}:generateContent?key=${settings.apiKey}`;
                headers = { "Content-Type": "application/json" };
                body = { contents: messagePayload, generationConfig: { temperature: baseParams.temperature, topP: baseParams.top_p, maxOutputTokens: baseParams.max_tokens } };
                if (body.generationConfig.topP >= 1) delete body.generationConfig.topP;
                break;
            default: throw new Error("不支援的 Provider: " + provider);
        }
        const response = await fetch(url, { method: "POST", headers, body: JSON.stringify(body) });
        if (!response.ok) { const errorText = await response.text(); throw new Error(`API 錯誤 (${response.status}): ${errorText}`); }
        const data = await response.json();
        return parseResponse(provider, data);
    }

    function parseResponse(provider, data) {
        try {
            switch (provider) {
                case "openai": case "mistral": case "xai": return data.choices[0].message.content;
                case "anthropic": return data.content[0].text;
                case "google": return data.candidates[0].content.parts[0].text;
                default: return "⚠️ 無法解析回應";
            }
        } catch (e) { console.error("Error parsing response:", data); return "⚠️ 回應格式錯誤"; }
    }

    function exportChat() {
        if (!state.activeCharacterId || !state.activeChatId) return;
        const history = state.chatHistories[state.activeCharacterId][state.activeChatId] || [];
        if (history.length === 0) { alert('沒有對話可以匯出。'); return; }
        const activeChar = state.characters.find(c => c.id === state.activeCharacterId);
        const jsonlString = JSON.stringify({ messages: history });
        const blob = new Blob([jsonlString], { type: 'application/jsonl' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${activeChar.name}_${state.activeChatId}.jsonl`;
        a.click();
        URL.revokeObjectURL(url);
    }
    
    // ===================================================================================
    // 7. 角色與聊天室管理 (Character & Chat Management)
    // ===================================================================================
    function handleAddNewChat() {
        if (!state.activeCharacterId) return;
        const char = state.characters.find(c => c.id === state.activeCharacterId);
        if (!char) return;

        const newChatId = `chat_${Date.now()}`;
        if (!state.chatHistories[state.activeCharacterId]) {
            state.chatHistories[state.activeCharacterId] = {};
            state.chatMetadatas[state.activeCharacterId] = {};
        }
        state.chatHistories[state.activeCharacterId][newChatId] = [];
        state.chatMetadatas[state.activeCharacterId][newChatId] = { name: '', pinned: false, notes: '' };

        if (char.firstMessage) {
            state.chatHistories[state.activeCharacterId][newChatId].push({
                role: 'assistant', content: char.firstMessage, timestamp: new Date().toISOString()
            });
        }
        
        state.activeChatId = newChatId;
        saveState();
        renderChatSessionList();
        renderActiveChat();
    }

    function handleDeleteCurrentChat() {
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

    function openCharacterEditor(charId = null) {
        editingCharacterId = charId;
        if (charId) {
            const char = state.characters.find(c => c.id === charId);
            charAvatarPreview.src = char.avatarUrl || DEFAULT_AVATAR;
            charNameInput.value = char.name;
            charDescriptionInput.value = char.description || '';
            charFirstMessageInput.value = char.firstMessage || '';
            charExampleDialogueInput.value = char.exampleDialogue || '';
            deleteCharBtn.classList.remove('hidden');
        } else {
            charAvatarPreview.src = DEFAULT_AVATAR;
            charNameInput.value = '';
            charDescriptionInput.value = '';
            charFirstMessageInput.value = '';
            charExampleDialogueInput.value = '';
            deleteCharBtn.classList.add('hidden');
        }
        toggleModal('character-editor-modal', true);
    }

    function handleSaveCharacter() {
        const charData = {
            name: charNameInput.value.trim(),
            avatarUrl: charAvatarPreview.src, // 【修改】從預覽圖讀取 Base64/URL
            description: charDescriptionInput.value.trim(),
            firstMessage: charFirstMessageInput.value.trim(),
            exampleDialogue: charExampleDialogueInput.value.trim(),
        };
        if (!charData.name) { alert('角色名稱不能為空！'); return; }
        if (editingCharacterId) {
            const charIndex = state.characters.findIndex(c => c.id === editingCharacterId);
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
        if (leftPanel.classList.contains('show-chats')) {
            const character = state.characters.find(c => c.id === state.activeCharacterId);
            chatListHeaderName.textContent = character.name;
        }
        toggleModal('character-editor-modal', false);
    }

    function handleDeleteCharacter() {
        if (!editingCharacterId) return;
        const charToDelete = state.characters.find(c => c.id === editingCharacterId);
        if (confirm(`確定要刪除角色「${charToDelete.name}」嗎？該角色的所有對話紀錄將一併刪除。`)) {
            state.characters = state.characters.filter(c => c.id !== editingCharacterId);
            delete state.chatHistories[editingCharacterId];
            delete state.longTermMemories[editingCharacterId];
            delete state.chatMetadatas[editingCharacterId];
            
            if (state.activeCharacterId === editingCharacterId) {
                state.activeCharacterId = null;
                state.activeChatId = null;
                showCharacterListView();
                renderActiveChat();
            }
            saveState();
            renderCharacterList();
            toggleModal('character-editor-modal', false);
        }
    }

    // ===================================================================================
    // 8. 全域設定邏輯 (Global Settings Logic)
    // ===================================================================================
    function loadGlobalSettingsToUI() {
        const settings = state.globalSettings;
        apiProviderSelect.value = settings.apiProvider || 'openai';
        updateModelDropdown(); 
        apiModelSelect.value = settings.apiModel || (MODELS[apiProviderSelect.value] ? MODELS[apiProviderSelect.value][0] : '');
        apiKeyInput.value = settings.apiKey || '';
        temperatureSlider.value = settings.temperature || 1;
        temperatureValue.value = settings.temperature || 1;
        topPSlider.value = settings.topP || 1;
        topPValue.value = settings.topP || 1;
        repetitionPenaltySlider.value = settings.repetitionPenalty || 0;
        repetitionPenaltyValue.value = settings.repetitionPenalty || 0;
        contextSizeInput.value = settings.contextSize || 20;
        maxTokensSlider.value = settings.maxTokens || 1024;
        maxTokensValue.value = settings.maxTokens || 1024;
        userAvatarPreview.src = settings.userAvatarUrl || DEFAULT_AVATAR;
        userNameInput.value = settings.userName || '';
        userDescriptionInput.value = settings.userDescription || '';
    }

    function handleSaveGlobalSettings() {
        state.globalSettings = {
            apiProvider: apiProviderSelect.value,
            apiModel: apiModelSelect.value,
            apiKey: apiKeyInput.value.trim(),
            temperature: temperatureValue.value,
            topP: topPValue.value,
            repetitionPenalty: repetitionPenaltyValue.value,
            contextSize: contextSizeInput.value,
            maxTokens: maxTokensValue.value,
            userAvatarUrl: userAvatarPreview.src, // 【修改】從預覽圖讀取 Base64/URL
            userName: userNameInput.value.trim(),
            userDescription: userDescriptionInput.value.trim(),
        };
        saveState();
        toggleModal('global-settings-modal', false);
        renderActiveChat();
    }
    
    function updateModelDropdown() {
        const provider = apiProviderSelect.value;
        const models = MODELS[provider] || [];
        apiModelSelect.innerHTML = ''; 
        models.forEach(model => {
            const option = document.createElement('option');
            option.value = model;
            option.textContent = model;
            apiModelSelect.appendChild(option);
        });
        const savedModel = state.globalSettings.apiModel;
        if (savedModel && models.includes(savedModel)) {
            apiModelSelect.value = savedModel;
        } else if (models.length > 0) {
            apiModelSelect.value = models[0];
        }
    }

    // ===================================================================================
    // 9. 提示詞與記憶邏輯 (Prompt & Memory Logic)
    // ===================================================================================
    function buildPromptSettingsUI() {
        promptSettingsBody.innerHTML = '';

        const modalFooter = promptSettingsModal.querySelector('.modal-footer');
        const oldSaveBtn = modalFooter.querySelector('#save-prompts-btn');
        if (oldSaveBtn) oldSaveBtn.remove();

        if (!state.activeCharacterId || !state.activeChatId) {
            promptSettingsBody.innerHTML = `<p>請先選擇一個對話以設定提示詞。</p>`;
            return;
        }
        
        const memory = state.longTermMemories[state.activeCharacterId]?.[state.activeChatId] || "尚無記憶。";
        
        const memoryGroup = document.createElement('div');
        memoryGroup.className = 'prompt-group';
        memoryGroup.innerHTML = `
            <div class="prompt-label-group">
                <label>長期記憶摘要</label>
                <div>
                    <button class="action-btn-sm secondary" id="edit-memory-btn">編輯</button>
                    <button class="action-btn-sm primary hidden" id="save-memory-btn">儲存</button>
                </div>
            </div>
            <textarea id="long-term-memory-display" readonly>${memory}</textarea>
        `;
        promptSettingsBody.appendChild(memoryGroup);

        const memoryTextarea = promptSettingsBody.querySelector('#long-term-memory-display');
        const editMemoryBtn = promptSettingsBody.querySelector('#edit-memory-btn');
        const saveMemoryBtn = promptSettingsBody.querySelector('#save-memory-btn');

        editMemoryBtn.addEventListener('click', () => {
            memoryTextarea.readOnly = false;
            memoryTextarea.focus();
            editMemoryBtn.classList.add('hidden');
            saveMemoryBtn.classList.remove('hidden');
        });

        saveMemoryBtn.addEventListener('click', () => {
            const newMemory = memoryTextarea.value;
            if (!state.longTermMemories[state.activeCharacterId]) {
                state.longTermMemories[state.activeCharacterId] = {};
            }
            state.longTermMemories[state.activeCharacterId][state.activeChatId] = newMemory;
            saveState();
            
            memoryTextarea.readOnly = true;
            editMemoryBtn.classList.remove('hidden');
            saveMemoryBtn.classList.add('hidden');
            alert('長期記憶已儲存！');
        });

        const prompts = [
            { id: 'scenario', label: '場景 (Scenario)', type: 'textarea' },
            { id: 'jailbreak', label: '越獄提示 (Jailbreak)', type: 'textarea' },
            { id: 'summarizationPrompt', label: '長期記憶生成提示', type: 'textarea', placeholder: DEFAULT_SUMMARY_PROMPT }
        ];

        prompts.forEach(p => {
            const group = document.createElement('div');
            group.className = 'prompt-group';
            group.innerHTML = `<label for="prompt-${p.id}">${p.label}</label>`;
            const input = document.createElement('textarea');
            input.id = `prompt-${p.id}`;
            input.placeholder = p.placeholder || '';
            input.value = state.promptSettings[p.id] || (p.id === 'summarizationPrompt' ? DEFAULT_SUMMARY_PROMPT : '');
            group.appendChild(input);
            promptSettingsBody.appendChild(group);
        });

        const savePromptsBtn = document.createElement('button');
        savePromptsBtn.id = 'save-prompts-btn';
        savePromptsBtn.className = 'action-btn primary';
        savePromptsBtn.textContent = '儲存提示詞';
        savePromptsBtn.addEventListener('click', () => {
            prompts.forEach(p => {
                const inputElement = document.getElementById(`prompt-${p.id}`);
                if (inputElement) {
                    state.promptSettings[p.id] = inputElement.value;
                }
            });
            saveState();
            alert('提示詞設定已儲存！');
            toggleModal('prompt-settings-modal', false);
        });
        modalFooter.insertBefore(savePromptsBtn, cancelPromptSettingsBtn);
    }

    async function handleUpdateMemory() {
        if (!state.activeCharacterId || !state.activeChatId) { alert('請先選擇一個對話。'); return; }
        const history = state.chatHistories[state.activeCharacterId][state.activeChatId];
        if (history.length < 4) { alert('對話太短，無法生成有意義的記憶。'); return; }
        
        updateMemoryBtn.textContent = '記憶生成中...';
        updateMemoryBtn.disabled = true;
        try {
            const conversationText = history.map(m => `${m.role}: ${m.content}`).join('\n');
            const userPrompt = state.promptSettings.summarizationPrompt || DEFAULT_SUMMARY_PROMPT;
            const summaryPrompt = userPrompt.replace('{{conversation}}', conversationText);
            const summaryMessages = [{ role: 'user', content: summaryPrompt }];
            const summary = await callApi(summaryMessages, true);
            
            if (!state.longTermMemories[state.activeCharacterId]) {
                state.longTermMemories[state.activeCharacterId] = {};
            }
            state.longTermMemories[state.activeCharacterId][state.activeChatId] = summary;
            saveState();
            alert('長期記憶已更新！');
            if (!promptSettingsModal.classList.contains('hidden')) {
                buildPromptSettingsUI();
            }
        } catch (error) {
            alert(`記憶更新失敗: ${error.message}`);
        } finally {
            updateMemoryBtn.textContent = '更新記憶';
            updateMemoryBtn.disabled = false;
        }
    }

    // ===================================================================================
    // 10. 通用工具與新功能函式
    // ===================================================================================
    function handleImageUpload(event, previewElement) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                previewElement.src = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    }

    function handleSaveNote() {
        if (!state.activeCharacterId || !state.activeChatId) return;
        const metadata = state.chatMetadatas[state.activeCharacterId]?.[state.activeChatId];
        if (metadata) {
            metadata.notes = chatNotesInput.value.trim();
            saveState();
        }
    }

    function openRenameModal(chatId) {
        renamingChatId = chatId;
        const metadata = state.chatMetadatas[state.activeCharacterId]?.[chatId] || {};
        renameChatInput.value = metadata.name || '';
        toggleModal('rename-chat-modal', true);
        renameChatInput.focus();
    }

    function handleSaveChatName() {
        if (!renamingChatId || !state.activeCharacterId) return;
        
        if (!state.chatMetadatas[state.activeCharacterId]) {
            state.chatMetadatas[state.activeCharacterId] = {};
        }
        if (!state.chatMetadatas[state.activeCharacterId][renamingChatId]) {
            state.chatMetadatas[state.activeCharacterId][renamingChatId] = { name: '', pinned: false, notes: '' };
        }
        
        const metadata = state.chatMetadatas[state.activeCharacterId][renamingChatId];
        metadata.name = renameChatInput.value.trim();
        saveState();
        renderChatSessionList();
        toggleModal('rename-chat-modal', false);
        renamingChatId = null;
    }

    function handleTogglePinChat(chatId) {
        if (!state.activeCharacterId) return;
        
        if (!state.chatMetadatas[state.activeCharacterId]) {
            state.chatMetadatas[state.activeCharacterId] = {};
        }
        if (!state.chatMetadatas[state.activeCharacterId][chatId]) {
            state.chatMetadatas[state.activeCharacterId][chatId] = { name: '', pinned: false, notes: '' };
        }

        const metadata = state.chatMetadatas[state.activeCharacterId][chatId];
        metadata.pinned = !metadata.pinned;
        saveState();
        renderChatSessionList();
    }
    
    function toggleModal(modalId, show) {
        document.getElementById(modalId).classList.toggle('hidden', !show);
    }

    function exportCharacter() {
        if (!editingCharacterId) { alert('請先儲存角色後再匯出。'); return; }
        const char = state.characters.find(c => c.id === editingCharacterId);
        const characterData = {
            spec: 'chara_card_v2',
            data: { name: char.name, description: char.description, first_mes: char.firstMessage, mes_example: char.exampleDialogue, character_avatar: char.avatarUrl }
        };
        const jsonString = JSON.stringify(characterData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${char.name || 'character'}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    function importCharacter() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json,.png';
        input.onchange = (event) => {
            const file = event.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            
            if (file.type === 'application/json' || file.name.endsWith('.json')) {
                reader.onload = (e) => { 
                    try { 
                        const jsonData = JSON.parse(e.target.result);
                        populateEditorWithCharData(jsonData); 
                    } catch (error) { 
                        alert('匯入失敗，JSON 檔案格式錯誤。'); 
                        console.error('JSON Import error:', error); 
                    } 
                };
                reader.readAsText(file);
            } else if (file.type === 'image/png') {
                // 【修改】同時讀取圖片的 Base64 和 ArrayBuffer
                let fileAsDataURL = '';
                const readerForDataURL = new FileReader();
                readerForDataURL.onload = (e) => {
                    fileAsDataURL = e.target.result;
                };
                readerForDataURL.readAsDataURL(file);

                reader.onload = (e) => {
                    try {
                        const arrayBuffer = e.target.result;
                        const dataView = new DataView(arrayBuffer);
                        if (dataView.getUint32(0) !== 0x89504E47 || dataView.getUint32(4) !== 0x0D0A1A0A) { throw new Error('不是有效的 PNG 檔案。'); }
                        let offset = 8; let characterDataFound = false;
                        while (offset < arrayBuffer.byteLength) {
                            const length = dataView.getUint32(offset);
                            const type = new TextDecoder("ascii").decode(new Uint8Array(arrayBuffer, offset + 4, 4));
                            if (type === 'tEXt') {
                                const chunkData = new Uint8Array(arrayBuffer, offset + 8, length);
                                const nullSeparatorIndex = chunkData.indexOf(0);
                                const keyword = new TextDecoder("ascii").decode(chunkData.slice(0, nullSeparatorIndex));
                                if (keyword === 'chara') {
                                    const base64Data = new TextDecoder("ascii").decode(chunkData.slice(nullSeparatorIndex + 1));
                                    const jsonData = JSON.parse(atob(base64Data));
                                    populateEditorWithCharData(jsonData, fileAsDataURL); // 傳入圖片的 Base64
                                    characterDataFound = true;
                                    break;
                                }
                            }
                            offset += 12 + length;
                        }
                        if (!characterDataFound) { alert('在這張 PNG 圖片中找不到角色卡資料。'); }
                    } catch (error) { alert('匯入 PNG 失敗，檔案可能已損壞或不包含角色資料。'); console.error('PNG Import error:', error); }
                };
                reader.readAsArrayBuffer(file);
            } else { alert('不支援的檔案格式。請選擇 .json 或 .png 檔案。'); }
        };
        input.click();
    }

    function populateEditorWithCharData(importedData, imageBase64 = null) {
        const data = importedData.data || importedData;
        charNameInput.value = data.name || '';
        charDescriptionInput.value = data.description || data.personality || '';
        charFirstMessageInput.value = data.first_mes || '';
        charExampleDialogueInput.value = data.mes_example || '';
        
        // 【修改】優先使用 PNG 自身的 Base64，其次是卡片內的 URL
        charAvatarPreview.src = imageBase64 || data.character_avatar || DEFAULT_AVATAR;
        
        alert('角色卡匯入成功！請記得儲存。');
    }
    
    function makeMessageEditable(row, index) {
        const currentlyEditing = document.querySelector('.is-editing');
        if (currentlyEditing) { renderChatMessages(); }
        row.classList.add('is-editing');
        const bubbleContainer = row.querySelector('.bubble-container');
        const originalText = state.chatHistories[state.activeCharacterId][state.activeChatId][index].content;
        
        row.querySelector('.chat-bubble').style.display = 'none';
        row.querySelector('.message-timestamp').style.display = 'none';

        const editContainer = document.createElement('div');
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
        textarea.style.height = textarea.scrollHeight + 'px';
        textarea.focus();

        bubbleContainer.querySelector('.edit-save-btn').addEventListener('click', (e) => { e.stopPropagation(); saveMessageEdit(index, textarea.value); });
        bubbleContainer.querySelector('.edit-cancel-btn').addEventListener('click', (e) => { e.stopPropagation(); renderChatMessages(); });
        bubbleContainer.querySelector('.delete-btn').addEventListener('click', (e) => { e.stopPropagation(); handleDeleteMessage(index); });
    }

    function saveMessageEdit(index, newText) {
        state.chatHistories[state.activeCharacterId][state.activeChatId][index].content = newText.trim();
        saveState();
        renderChatMessages();
    }

    function handleDeleteMessage(index) {
        if (confirm('您確定要永久刪除這則訊息嗎？')) {
            state.chatHistories[state.activeCharacterId][state.activeChatId].splice(index, 1);
            saveState();
            renderChatMessages();
        }
    }

    // ===================================================================================
    // 11. 主題切換 (Theme Toggle)
    // ===================================================================================
    function applyTheme() {
        const currentTheme = localStorage.getItem('theme') || 'light';
        document.body.className = currentTheme + '-mode';
        themeToggleBtn.innerHTML = currentTheme === 'light' ? '<i class="fa-solid fa-moon"></i>' : '<i class="fa-solid fa-sun"></i>';
    }

    function toggleTheme() {
        let currentTheme = localStorage.getItem('theme') || 'light';
        currentTheme = currentTheme === 'light' ? 'dark' : 'light';
        localStorage.setItem('theme', currentTheme);
        applyTheme();
    }

    // ===================================================================================
    // 12. 啟動應用程式
    // ===================================================================================
    initialize();
});
