// js/lorebookManager.js
// 這個檔案封裝了所有與世界書 (Lorebook) 系統相關的核心邏輯。

import { state } from './state.js';
import { DEFAULT_LOREBOOK } from './constants.js';

/**
 * @description 解析使用者上傳的 SillyTavern V2 世界書 JSON 檔案
 * @param {string} fileContent - 讀取的檔案內容字串
 * @param {string} fileName - 檔案名稱
 * @returns {Object} - 解析後符合我們應用程式結構的世界書物件
 */
export function parseLorebookFile(fileContent, fileName) {
    try {
        const data = JSON.parse(fileContent);
        if (!data.entries || typeof data.entries !== 'object') {
            throw new Error('檔案格式不符，缺少 "entries" 物件。');
        }

        const newEntries = Object.values(data.entries).map(entry => ({
            id: `entry_${entry.uid}_${Date.now()}`,
            name: entry.comment || '未命名條目',
            keywords: entry.key || [],
            content: entry.content || '',
            enabled: !entry.disable,
            order: entry.order || 100,
            position: entry.position || 0, // 0: before_char, 1: after_char
            scanDepth: entry.depth || 4,
            logic: entry.selectiveLogic || 0, // 0: OR, 1: AND
        }));

        const newLorebook = {
            id: `lorebook_${Date.now()}`,
            name: fileName.replace(/\.json$/i, ''),
            entries: newEntries,
        };

        return newLorebook;

    } catch (error) {
        console.error("解析世界書檔案失敗:", error);
        throw new Error(`檔案解析失敗: ${error.message}`);
    }
}


/**
 * @description 獲取當前作用中的世界書
 * @returns {Object} - 當前啟用的世界書物件，若找不到則回傳預設值
 */
export function getActiveLorebook() {
    if (!state.activeLorebookId) {
        return DEFAULT_LOREBOOK;
    }
    const activeBook = state.lorebooks.find(lb => lb.id === state.activeLorebookId);
    return activeBook || DEFAULT_LOREBOOK;
}

/**
 * @description 根據啟用世界書的規則，建構要注入到 Prompt 的內容
 * @param {Array<Object>} chatHistory - 當前的對話歷史紀錄
 * @returns {Array<Object>} - 包含 { content, position, order } 的待注入內容陣列
 */
export function buildInjections(chatHistory) {
    const activeLorebook = getActiveLorebook();
    if (!activeLorebook || !activeLorebook.entries || activeLorebook.entries.length === 0) {
        return [];
    }

    const enabledEntries = activeLorebook.entries.filter(e => e.enabled);
    if (enabledEntries.length === 0) {
        return [];
    }
    
    const injections = [];

    for (const entry of enabledEntries) {
        const scanDepth = entry.scanDepth || 4;
        const historyToScan = chatHistory.slice(-scanDepth);
        const textToScan = historyToScan.map(msg => (Array.isArray(msg.content) ? msg.content[msg.activeContentIndex] : msg.content)).join('\n');
        
        const keywords = entry.keywords.map(k => k.trim().toLowerCase()).filter(k => k);
        if (keywords.length === 0) continue;

        let triggered = false;
        const isAndLogic = entry.logic === 1;

        if (isAndLogic) {
            triggered = keywords.every(keyword => textToScan.toLowerCase().includes(keyword));
        } else { // OR logic
            triggered = keywords.some(keyword => textToScan.toLowerCase().includes(keyword));
        }

        if (triggered) {
            injections.push({
                content: replacePlaceholders(entry.content),
                position: entry.position, // 0 or 1
                order: entry.order,
            });
        }
    }

    return injections;
}


/**
 * @description 替換世界書內容中的預留位置 (placeholders)
 * @param {string} text - 含有預留位置的原始字串
 * @returns {string} - 替換後的字串
 */
function replacePlaceholders(text) {
    if (typeof text !== 'string') return '';
    if (!state.activeCharacterId || !state.activeChatId) return text;

    const char = state.characters.find(c => c.id === state.activeCharacterId);
    const metadata = state.chatMetadatas[state.activeCharacterId]?.[state.activeChatId] || {};
    const currentPersonaId = metadata.userPersonaId || state.activeUserPersonaId;
    const user = state.userPersonas.find(p => p.id === currentPersonaId) || {};

    let result = text;
    if(char) result = result.replace(/{{char}}/g, char.name || 'char');
    if(user) result = result.replace(/{{user}}/g, user.name || 'user');
    
    return result;
}
