// js/state.js
// 這個檔案負責管理整個應用程式的狀態，並與 IndexedDB 互動。

import { defaultCharacters, DEFAULT_AVATAR } from './constants.js';
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
    activeUserPersonaId: null,
    activeCharacterId: null,
    activeChatId: null,
    globalSettings: {},
    promptSettings: {}
};

// 暫存的編輯狀態
export let tempState = {
    editingCharacterId: null,
    editingUserPersonaId: null,
    renamingChatId: null,
    apiCallController: null,
    // [新增] 用於管理截圖模式的狀態
    isScreenshotMode: false,
    selectedMessageIndices: [],
};

/**
 * @description 從 IndexedDB 載入應用程式狀態
 */
export async function loadStateFromDB() {
    const settingsData = await db.get('keyValueStore', 'settings');
    if (settingsData) {
        state.globalSettings = settingsData.globalSettings || {};
        state.promptSettings = settingsData.promptSettings || {};
        state.activeUserPersonaId = settingsData.activeUserPersonaId || null;
        state.activeCharacterId = settingsData.activeCharacterId || null;
        state.activeChatId = settingsData.activeChatId || null;
        state.apiPresets = settingsData.apiPresets || [];
    }

    state.characters = await db.getAll('characters');
    state.userPersonas = await db.getAll('userPersonas');

    if (state.characters.length === 0) {
        for (const char of defaultCharacters) {
            await db.put('characters', char);
        }
        state.characters = defaultCharacters;
    }
    if (state.userPersonas.length === 0) {
        const defaultPersona = { id: `user_${Date.now()}`, name: 'User', description: '', avatarUrl: DEFAULT_AVATAR };
        await db.put('userPersonas', defaultPersona);
        state.userPersonas.push(defaultPersona);
        state.activeUserPersonaId = defaultPersona.id;
        await saveSettings();
    }

    if (state.activeCharacterId) {
        await loadChatDataForCharacter(state.activeCharacterId);
    }
}

/**
 * @description 載入指定角色的所有對話相關資料
 * @param {string} charId - 角色 ID
 */
export async function loadChatDataForCharacter(charId) {
    const histories = await db.get('chatHistories', charId);
    const memories = await db.get('longTermMemories', charId);
    const metadatas = await db.get('chatMetadatas', charId);

    state.chatHistories[charId] = histories ? histories.data : {};
    state.longTermMemories[charId] = memories ? memories.data : {};
    state.chatMetadatas[charId] = metadatas ? metadatas.data : {};
}

// ===================================================================================
// 資料儲存函式
// ===================================================================================

export function saveSettings() {
    const settingsData = {
        key: 'settings',
        globalSettings: state.globalSettings,
        promptSettings: state.promptSettings,
        activeUserPersonaId: state.activeUserPersonaId,
        activeCharacterId: state.activeCharacterId,
        activeChatId: state.activeChatId,
        apiPresets: state.apiPresets,
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
