// js/api.js
// 這個檔案處理所有與外部 API 互動的邏輯。

import { state, tempState } from './state.js';

/**
 * @description 清理並格式化對話歷史，以符合 Claude API 的嚴格要求。
 * @param {Array} messages - 原始的對話歷史陣列。
 * @returns {Array} - 清理後，符合 user/assistant 交替順序的陣列。
 */
function cleanMessagesForClaude(messages) {
    const cleaned = [];
    let lastRole = null;

    for (const msg of messages) {
        if (!msg.content) continue;

        if (msg.role === lastRole) {
            if (msg.role === 'user' && cleaned.length > 0) {
                cleaned[cleaned.length - 1].content += `\n\n${msg.content}`;
            }
            else if (msg.role === 'assistant' && cleaned.length > 0) {
                cleaned[cleaned.length - 1] = msg;
            }
        } else {
            cleaned.push(msg);
            lastRole = msg.role;
        }
    }

    if (cleaned.length > 0 && cleaned[0].role !== 'user') {
        cleaned.shift();
    }

    return cleaned;
}


/**
 * @description 根據對話歷史和設定，建構準備發送給 API 的訊息 payload
 * @returns {Array|Object} 格式化後的訊息
 */
export function buildApiMessages() {
    if (!state.activeCharacterId || !state.activeChatId) return [];
    const history = state.chatHistories[state.activeCharacterId][state.activeChatId] || [];
    const contextSize = parseInt(state.globalSettings.contextSize) || 20;
    const recentHistory = history.slice(-contextSize);
    return buildApiMessagesFromHistory(recentHistory);
}

/**
 * @description 從指定的歷史紀錄片段建構 API payload
 * @param {Array} customHistory - 用於建構 payload 的對話歷史陣列
 * @returns {Array|Object} 格式化後的訊息
 */
export function buildApiMessagesFromHistory(customHistory) {
    const provider = state.globalSettings.apiProvider || 'openai';
    const systemPrompt = buildSystemPrompt();
    
    const recentHistory = customHistory.filter(msg => !msg.error).map(msg => {
        let finalContent = msg.content;
        if (msg.role === 'assistant' && Array.isArray(msg.content)) {
            finalContent = msg.content[msg.activeContentIndex];
        }
        return { role: msg.role, content: finalContent };
    });

    if (provider === 'anthropic') {
        const cleanedMessages = cleanMessagesForClaude(recentHistory);
        return { system: systemPrompt, messages: cleanedMessages };
    }
    
    if (provider === 'google') {
        const contents = recentHistory.map(msg => ({ 
            role: msg.role === 'assistant' ? 'model' : 'user', 
            parts: [{ text: msg.content }] 
        }));
        if (systemPrompt) {
            contents.unshift({ role: 'user', parts: [{ text: systemPrompt }] });
            contents.push({ role: 'model', parts: [{ text: "OK." }] });
        }
        return contents;
    }

    const messages = [];
    if (systemPrompt) {
        messages.push({ role: 'system', content: systemPrompt });
    }
    messages.push(...recentHistory);
    return messages;
}

/**
 * @description 根據當前角色、使用者、記憶和提示詞設定，建構系統提示 (System Prompt)
 * @returns {string} 組合好的系統提示字串
 */
function buildSystemPrompt() {
    if (!state.activeCharacterId || !state.activeChatId) return "";
    const char = state.characters.find(c => c.id === state.activeCharacterId);
    if (!char) {
        console.error(`buildSystemPrompt: 找不到 ID 為 ${state.activeCharacterId} 的角色`);
        return "";
    }
    
    const metadata = state.chatMetadatas[state.activeCharacterId]?.[state.activeChatId] || {};
    const currentPersonaId = metadata.userPersonaId || state.activeUserPersonaId;
    const user = state.userPersonas.find(p => p.id === currentPersonaId) || state.userPersonas[0] || {};

    const userName = user.name || 'User';
    const prompts = state.promptSettings;
    const memory = state.longTermMemories[state.activeCharacterId]?.[state.activeChatId];
    let prompt = "";

    const replacePlaceholders = (text) => {
        if (typeof text !== 'string') return '';
        return text.replace(/{{char}}/g, char.name).replace(/{{user}}/g, userName);
    };

    if (memory) prompt += `[先前對話摘要]\n${memory}\n\n`;
    if (char.description) prompt += `[${char.name} 的人物設定]\n${replacePlaceholders(char.description)}\n\n`;
    if (user.description) prompt += `[${userName} 的人物設定]\n${replacePlaceholders(user.description)}\n\n`;
    if (prompts.scenario) prompt += `[場景]\n${replacePlaceholders(prompts.scenario)}\n\n`;
    if (char.exampleDialogue) prompt += `[對話範例]\n${replacePlaceholders(char.exampleDialogue)}\n\n`;
    if (prompts.jailbreak) prompt += `${replacePlaceholders(prompts.jailbreak)}\n\n`;

    return prompt.trim();
}

/**
 * @description 呼叫後端大型語言模型 API
 * @param {Array|Object} messagePayload - 準備發送的訊息
 * @param {boolean} isForSummarization - 是否為生成摘要的呼叫 (會使用不同的參數)
 * @returns {Promise<string>} AI 回應的文字
 */
export async function callApi(messagePayload, isForSummarization = false) {
    tempState.apiCallController = new AbortController();
    const signal = tempState.apiCallController.signal;

    const settings = state.globalSettings;
    const provider = settings.apiProvider || 'openai';
    if (!settings.apiKey) throw new Error('尚未設定 API 金鑰。');
    
    const YOUR_CLOUDFLARE_WORKER_URL = 'https://key.d778105.workers.dev/';

    let url = "", headers = {}, body = {};
    const baseParams = {
        model: settings.apiModel,
        temperature: isForSummarization ? 0.5 : parseFloat(settings.temperature),
        top_p: isForSummarization ? 1 : parseFloat(settings.topP),
        max_tokens: isForSummarization ? 1000 : parseInt(settings.maxTokens),
    };
    
    switch (provider) {
        case "openai":
        case "mistral":
        case "xai":
            let baseUrl = provider === 'openai' ? 'https://api.openai.com/v1/chat/completions' : provider === 'mistral' ? 'https://api.mistral.ai/v1/chat/completions' : 'https://api.x.ai/v1/chat/completions';
            url = YOUR_CLOUDFLARE_WORKER_URL + baseUrl;
            headers = { "Content-Type": "application/json", "Authorization": `Bearer ${settings.apiKey}` };
            body = { 
                ...baseParams, 
                messages: messagePayload,
                frequency_penalty: parseFloat(settings.repetitionPenalty)
            };
            if (body.top_p >= 1) delete body.top_p;
            break;
        case "openrouter":
            url = "https://openrouter.ai/api/v1/chat/completions";
            headers = { 
                "Content-Type": "application/json", 
                "Authorization": `Bearer ${settings.apiKey}`,
                "HTTP-Referer": "http://localhost",
                "X-Title": "大冰奶"
            };
            body = { 
                ...baseParams, 
                messages: messagePayload,
                repetition_penalty: parseFloat(settings.repetitionPenalty)
            };
            if (body.top_p >= 1) delete body.top_p;
            break;
        case "anthropic":
            url = YOUR_CLOUDFLARE_WORKER_URL + "https://api.anthropic.com/v1/messages";
            headers = { 
                "Content-Type": "application/json", 
                "x-api-key": settings.apiKey, 
                "anthropic-version": "2023-06-01" 
            };
            body = { ...baseParams, system: messagePayload.system, messages: messagePayload.messages };
            if (body.top_p >= 1) delete body.top_p;
            break;
        case "google":
            url = YOUR_CLOUDFLARE_WORKER_URL + `https://generativelanguage.googleapis.com/v1beta/models/${settings.apiModel}:generateContent?key=${settings.apiKey}`;
            headers = { "Content-Type": "application/json" };
            body = { contents: messagePayload, generationConfig: { temperature: baseParams.temperature, topP: baseParams.topP, maxOutputTokens: baseParams.max_tokens } };
            if (body.generationConfig.topP >= 1) delete body.generationConfig.topP;
            break;
        default: throw new Error("不支援的 API 供應商: " + provider);
    }
    
    const response = await fetch(url, { method: "POST", headers, body: JSON.stringify(body), signal });
    
    if (!response.ok) { 
        const errorText = await response.text(); 
        throw new Error(`API 錯誤 (${response.status}): ${errorText}`); 
    }
    
    const data = await response.json();
    return parseResponse(provider, data);
}

/**
 * @description 解析不同 API 供應商的回應，並回傳文字內容
 * @param {string} provider - API 供應商名稱
 * @param {Object} data - API 回傳的 JSON 物件
 * @returns {string} 解析後的文字
 */
function parseResponse(provider, data) {
    try {
        switch (provider) {
            case "openai":
            case "mistral":
            case "xai":
            case "openrouter":
                return data.choices[0].message.content;
            case "anthropic": 
                return data.content[0].text;
            case "google": 
                return data.candidates[0].content.parts[0].text;
            default: 
                return "⚠️ 無法解析回應";
        }
    } catch (e) { 
        console.error("解析 API 回應失敗:", data); 
        return "⚠️ 回應格式錯誤"; 
    }
}

/**
 * @description [新增] 專門用於測試 API 連線的函式
 * @param {string} provider - API 供應商
 * @param {string} apiKey - API 金鑰
 * @param {string} model - 模型名稱
 * @returns {Promise<boolean>} - 連線成功則回傳 true，否則拋出錯誤
 */
export async function testApiConnection(provider, apiKey, model) {
    const YOUR_CLOUDFLARE_WORKER_URL = 'https://key.d778105.workers.dev/';
    let url = "", headers = {}, body = {};
    
    // 建立一個極小的測試 payload，將成本降到最低
    const testPayload = [{ role: 'user', content: 'Hello' }];
    
    switch (provider) {
        case "openai":
        case "mistral":
        case "xai":
            let baseUrl = provider === 'openai' ? 'https://api.openai.com/v1/chat/completions' : provider === 'mistral' ? 'https://api.mistral.ai/v1/chat/completions' : 'https://api.x.ai/v1/chat/completions';
            url = YOUR_CLOUDFLARE_WORKER_URL + baseUrl;
            headers = { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` };
            body = { model, messages: testPayload, max_tokens: 5 };
            break;
        case "openrouter":
            url = "https://openrouter.ai/api/v1/chat/completions";
            headers = { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` };
            body = { model, messages: testPayload, max_tokens: 5 };
            break;
        case "anthropic":
            url = YOUR_CLOUDFLARE_WORKER_URL + "https://api.anthropic.com/v1/messages";
            headers = { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" };
            body = { model, messages: testPayload, max_tokens: 5 };
            break;
        case "google":
            url = YOUR_CLOUDFLARE_WORKER_URL + `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
            headers = { "Content-Type": "application/json" };
            body = { contents: [{ parts: [{ text: "Hello" }] }], generationConfig: { maxOutputTokens: 5 } };
            break;
        default: 
            throw new Error("不支援的 API 供應商");
    }

    const response = await fetch(url, { method: "POST", headers, body: JSON.stringify(body) });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`(${response.status}) ${errorText}`);
    }

    return true;
}
