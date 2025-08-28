// js/promptManager.js
// 這個檔案封裝了所有與新提示詞系統相關的核心邏輯。

import { state } from './state.js';
import { DEFAULT_PROMPT_SET } from './constants.js';

/**
 * @description 解析使用者上傳的提示詞庫 JSON 檔案
 * @param {string} fileContent - 讀取的檔案內容字串
 * @param {string} fileName - 檔案名稱
 * @returns {Object} - 解析後符合我們應用程式結構的提示詞庫物件
 */
export function parsePromptSetFile(fileContent, fileName) {
    try {
        const data = JSON.parse(fileContent);
        if (!data.prompts || !Array.isArray(data.prompts)) {
            throw new Error('JSON 檔案缺少 "prompts" 陣列。');
        }

        const newPromptSet = {
            id: `prompt_set_${Date.now()}`,
            name: fileName.replace(/\.json$/i, ''), // 使用檔名作為預設名稱
            prompts: data.prompts.map(p => ({
                identifier: p.identifier || `prompt_${Math.random().toString(36).substr(2, 9)}`,
                name: p.name || '未命名提示詞',
                enabled: p.enabled !== undefined ? p.enabled : true,
                role: p.role || 'system',
                content: p.content || '',
            })),
        };

        return newPromptSet;
    } catch (error) {
        console.error("解析提示詞庫檔案失敗:", error);
        throw new Error(`檔案解析失敗: ${error.message}`);
    }
}

/**
 * @description 獲取當前作用中的提示詞設定檔
 * @returns {Object} - 當前啟用的提示詞庫物件，若找不到則回傳預設值
 */
export function getActivePromptSet() {
    if (!state.activePromptSetId) {
        return DEFAULT_PROMPT_SET;
    }
    const activeSet = state.promptSets.find(ps => ps.id === state.activePromptSetId);
    return activeSet || DEFAULT_PROMPT_SET;
}


/**
 * @description 根據當前角色、使用者、記憶和啟用的提示詞，建構最終的系統提示 (System Prompt)
 * @returns {string} 組合好的系統提示字串
 */
export function buildSystemPrompt() {
    if (!state.activeCharacterId || !state.activeChatId) return "";
    
    const activePromptSet = getActivePromptSet();
    if (!activePromptSet || !activePromptSet.prompts) return "";

    // 僅篩選出 role 為 'system' 且已啟用的提示詞
    const enabledSystemPrompts = activePromptSet.prompts.filter(p => p.enabled && p.role === 'system');
    
    const promptContents = enabledSystemPrompts.map(p => {
        return replacePlaceholders(p.content);
    });

    return promptContents.join('\n\n').trim();
}

/**
 * @description 替換提示詞內容中的預留位置 (placeholders)
 * @param {string} text - 含有預留位置的原始字串
 * @returns {string} - 替換後的字串
 */
function replacePlaceholders(text) {
    if (typeof text !== 'string') return '';
    if (!state.activeCharacterId || !state.activeChatId) return text;

    const char = state.characters.find(c => c.id === state.activeCharacterId);
    if (!char) return text;

    const metadata = state.chatMetadatas[state.activeCharacterId]?.[state.activeChatId] || {};
    const currentPersonaId = metadata.userPersonaId || state.activeUserPersonaId;
    const user = state.userPersonas.find(p => p.id === currentPersonaId) || state.userPersonas[0] || {};
    const memory = state.longTermMemories[state.activeCharacterId]?.[state.activeChatId] || '無';

    let result = text;
    // 替換核心變數
    result = result.replace(/{{char}}/g, char.name || 'char');
    result = result.replace(/{{user}}/g, user.name || 'user');
    
    // 替換結構化變數
    result = result.replace(/{{personality}}/g, char.description || '');
    result = result.replace(/{{scenario}}/g, char.exampleDialogue || ''); // 暫用對話範例填充場景
    result = result.replace(/{{memory}}/g, memory);

    return result;
}

/**
 * @description 獲取特定用途的提示詞內容，例如用於生成記憶的提示
 * @param {string} identifier - 提示詞的唯一識別碼
 * @returns {string|null} - 找到的提示詞內容，或 null
 */
export function getPromptContentByIdentifier(identifier) {
    const activePromptSet = getActivePromptSet();
    const prompt = activePromptSet.prompts.find(p => p.identifier === identifier && p.enabled);
    if (!prompt) {
        // 如果在當前設定檔找不到，則嘗試從預設設定檔中尋找，以確保核心功能(如記憶)正常
        const defaultPrompt = DEFAULT_PROMPT_SET.prompts.find(p => p.identifier === identifier);
        return defaultPrompt ? defaultPrompt.content : null;
    }
    return prompt.content;
}
