// js/state.js
// 這個檔案負責管理整個應用程式的狀態，並與 IndexedDB 互動。

import { DEFAULT_AVATAR, DEFAULT_PROMPT_SET } from './constants.js';
import * as db from './db.js';

// 應用程式的核心狀態物件
export let state = {
    currentUser: null,
    characters: [],
    chatHistories: {}, 
    longTermMemories: {},
    chatMetadatas: {}, 
    userPersonas: [],
    apiPresets: [], 
    
    promptSets: [],
    activePromptSetId: null,

    activeUserPersonaId: null,
    activeCharacterId: null,
    activeChatId: null,
    globalSettings: {},
};

// 暫存的編輯狀態
export let tempState = {
    editingCharacterId: null,
    editingUserPersonaId: null,
    renamingChatId: null,
    apiCallController: null,
    isScreenshotMode: false,
    selectedMessageIndices: [],
    editingPromptIdentifier: null, 
};

/**
 * @description 從 IndexedDB 載入應用程式狀態
 */
export async function loadStateFromDB() {
    const settingsData = await db.get('keyValueStore', 'settings');
    if (settingsData) {
        state.globalSettings = settingsData.globalSettings || {};
        state.activeUserPersonaId = settingsData.activeUserPersonaId || null;
        state.activeCharacterId = settingsData.activeCharacterId || null;
        state.activeChatId = settingsData.activeChatId || null;
        state.apiPresets = settingsData.apiPresets || [];
        state.activePromptSetId = settingsData.activePromptSetId || null;
    }

    state.characters = await db.getAll('characters');
    state.userPersonas = await db.getAll('userPersonas');
    state.promptSets = await db.getAll('promptSets');

    // [MODIFIED] 如果是第一次使用，從 JSON 檔案非同步載入預設角色
    if (state.characters.length === 0) {
        try {
            const response = await fetch('js/default_characters.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const defaultCharacters = await response.json();
            
            for (const char of defaultCharacters) {
                // 確保 firstMessage 是陣列格式
                if (typeof char.firstMessage === 'string') {
                    char.firstMessage = [char.firstMessage];
                }
                // 賦予 loved 和 order 預設值
                char.loved = char.loved || false;
                char.order = char.order || state.characters.length;
                await db.put('characters', char);
            }
            state.characters = await db.getAll('characters');
            console.log('成功從 JSON 檔案載入預設角色。');
        } catch (error) {
            console.error("無法載入預設角色檔案 'js/default_characters.json':", error);
            alert("錯誤：無法載入預設角色資料，請檢查主控台。");
        }
    } else {
        // 為現有使用者遷移資料，加入 loved 和 order 屬性
        let charMigrationNeeded = false;
        const updatePromises = state.characters.map((char, index) => {
            let updated = false;
            if (char.loved === undefined) {
                char.loved = false;
                updated = true;
            }
            if (char.order === undefined) {
                char.order = index;
                updated = true;
            }
            if (typeof char.firstMessage === 'string') {
                char.firstMessage = [char.firstMessage];
                updated = true;
            }
            if (updated) {
                charMigrationNeeded = true;
                return db.put('characters', char);
            }
            return Promise.resolve();
        });
        await Promise.all(updatePromises);
        if (charMigrationNeeded) {
            console.log("資料遷移完成: 角色資料已更新。");
        }
    }

    if (state.userPersonas.length === 0) {
        const defaultPersona = { id: `user_${Date.now()}`, name: 'User', description: '', avatarUrl: DEFAULT_AVATAR };
        await db.put('userPersonas', defaultPersona);
        state.userPersonas.push(defaultPersona);
        state.activeUserPersonaId = defaultPersona.id;
    }

    if (state.promptSets.length === 0) {
        await db.put('promptSets', DEFAULT_PROMPT_SET);
        state.promptSets.push(DEFAULT_PROMPT_SET);
    }
    
    if (!state.activePromptSetId || !state.promptSets.find(ps => ps.id === state.activePromptSetId)) {
        state.activePromptSetId = state.promptSets[0]?.id || null;
    }

    await saveSettings();

    if (state.activeCharacterId) {
        await loadChatDataForCharacter(state.activeCharacterId);
    }
}

/**
 * @description 載入指定角色的所有對話相關資料
 */
export async function loadChatDataForCharacter(charId) {
    const histories = await db.get('chatHistories', charId);
    const memories = await db.get('longTermMemories', charId);
    const metadatas = await db.get('chatMetadatas', charId);

    state.chatHistories[charId] = histories ? histories.data : {};
    state.longTermMemories[charId] = memories ? memories.data : {};
    state.chatMetadatas[charId] = metadatas ? metadatas.data : {};

    if (state.chatMetadatas[charId]) {
        let metaMigrationNeeded = false;
        Object.values(state.chatMetadatas[charId]).forEach((meta, index) => {
            if (meta.order === undefined) {
                meta.order = index;
                metaMigrationNeeded = true;
            }
        });
        if (metaMigrationNeeded) {
            await saveAllChatMetadatasForChar(charId);
            console.log(`資料遷移完成: 角色 ${charId} 的聊天室已新增 'order' 屬性。`);
        }
    }
}

// ===================================================================================
// 資料儲存函式
// ===================================================================================

export function saveSettings() {
    const settingsData = {
        key: 'settings',
        globalSettings: state.globalSettings,
        activeUserPersonaId: state.activeUserPersonaId,
        activeCharacterId: state.activeCharacterId,
        activeChatId: state.activeChatId,
        apiPresets: state.apiPresets,
        activePromptSetId: state.activePromptSetId, 
    };
    return db.put('keyValueStore', settingsData);
}

export function saveCharacter(character) {
    return db.put('characters', character);
}

export function deleteCharacter(charId) {
    return db.deleteItem('characters', charId);
}

export function saveUserPersona(persona) {
    return db.put('userPersonas', persona);
}

export function deleteUserPersona(personaId) {
    return db.deleteItem('userPersonas', personaId);
}

export function saveAllChatHistoriesForChar(charId) {
    return db.put('chatHistories', { id: charId, data: state.chatHistories[charId] });
}

export function saveAllLongTermMemoriesForChar(charId) {
    return db.put('longTermMemories', { id: charId, data: state.longTermMemories[charId] });
}

export function saveAllChatMetadatasForChar(charId) {
    return db.put('chatMetadatas', { id: charId, data: state.chatMetadatas[charId] });
}

export async function deleteAllChatDataForChar(charId) {
    await db.deleteItem('chatHistories', charId);
    await db.deleteItem('longTermMemories', charId);
    await db.deleteItem('chatMetadatas', charId);
}

export function savePromptSet(promptSet) {
    return db.put('promptSets', promptSet);
}

export function deletePromptSet(promptSetId) {
    return db.deleteItem('promptSets', promptSetId);
}
