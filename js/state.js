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
    // [新增] 用於儲存 API 設定檔
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
    apiCallController: null
};

/**
 * @description 從 IndexedDB 載入應用程式狀態
 */
export async function loadStateFromDB() {
    // 從 keyValueStore 中獲取單一值
    const settingsData = await db.get('keyValueStore', 'settings');
    if (settingsData) {
        state.globalSettings = settingsData.globalSettings || {};
        state.promptSettings = settingsData.promptSettings || {};
        state.activeUserPersonaId = settingsData.activeUserPersonaId || null;
        state.activeCharacterId = settingsData.activeCharacterId || null;
        state.activeChatId = settingsData.activeChatId || null;
        // [新增] 載入儲存的 API 設定檔
        state.apiPresets = settingsData.apiPresets || [];
    }

    // 獲取所有列表資料
    state.characters = await db.getAll('characters');
    state.userPersonas = await db.getAll('userPersonas');

    // 如果是第一次使用，初始化預設資料
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
        await saveSettings(); // 儲存新的 activeUserPersonaId
    }

    // 載入與當前角色相關的對話資料
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

/**
 * @description 儲存所有設定和當前活躍的 ID
 */
export function saveSettings() {
    const settingsData = {
        key: 'settings',
        globalSettings: state.globalSettings,
        promptSettings: state.promptSettings,
        activeUserPersonaId: state.activeUserPersonaId,
        activeCharacterId: state.activeCharacterId,
        activeChatId: state.activeChatId,
        // [新增] 儲存 API 設定檔
        apiPresets: state.apiPresets,
    };
    return db.put('keyValueStore', settingsData);
}

/**
 * @description 儲存單一角色資料
 * @param {Object} character - 角色物件
 */
export function saveCharacter(character) {
    return db.put('characters', character);
}

/**
 * @description 刪除單一角色資料
 * @param {string} charId - 角色 ID
 */
export function deleteCharacter(charId) {
    return db.deleteItem('characters', charId);
}

/**
 * @description 儲存單一使用者角色
 * @param {Object} persona - 使用者角色物件
 */
export function saveUserPersona(persona) {
    return db.put('userPersonas', persona);
}

/**
 * @description 刪除單一使用者角色
 * @param {string} personaId - 使用者角色 ID
 */
export function deleteUserPersona(personaId) {
    return db.deleteItem('userPersonas', personaId);
}

/**
 * @description 儲存指定角色的所有聊天紀錄
 * @param {string} charId - 角色 ID
 */
export function saveAllChatHistoriesForChar(charId) {
    return db.put('chatHistories', { id: charId, data: state.chatHistories[charId] });
}

/**
 * @description 儲存指定角色的所有長期記憶
 * @param {string} charId - 角色 ID
 */
export function saveAllLongTermMemoriesForChar(charId) {
    return db.put('longTermMemories', { id: charId, data: state.longTermMemories[charId] });
}

/**
 * @description 儲存指定角色的所有聊天元資料
 * @param {string} charId - 角色 ID
 */
export function saveAllChatMetadatasForChar(charId) {
    return db.put('chatMetadatas', { id: charId, data: state.chatMetadatas[charId] });
}

/**
 * @description 刪除指定角色的所有聊天相關資料
 * @param {string} charId - 角色 ID
 */
export async function deleteAllChatDataForChar(charId) {
    await db.deleteItem('chatHistories', charId);
    await db.deleteItem('longTermMemories', charId);
    await db.deleteItem('chatMetadatas', charId);
}
