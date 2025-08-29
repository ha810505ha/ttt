// js/api.js
// 這個檔案處理所有與外部 API 互動的邏輯。

import { state, tempState } from './state.js';
import * as PromptManager from './promptManager.js';

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

        const currentRole = msg.role === 'assistant' ? 'assistant' : 'user';

        if (currentRole === lastRole && cleaned.length > 0) {
             cleaned[cleaned.length - 1].content += `\n\n${msg.content}`;
        } else {
            cleaned.push({ role: currentRole, content: msg.content });
            lastRole = currentRole;
        }
    }

    if (cleaned.length > 0 && cleaned[0].role !== 'user') {
       cleaned.unshift({role: 'user', content: '(對話開始)'});
    }

    return cleaned;
}


/**
 * @description 估算文字的 token 數量 (此處使用字元長度作為一個粗略的代理)
 * @param {string} text - 要計算的文字
 * @returns {number} - 估算的 token 數量
 */
function estimateTokens(text = '') {
    return (text || '').length;
}

/**
 * @description 根據 Token 數量上限，從歷史紀錄中建構準備發送給 API 的訊息 payload
 * @returns {Array|Object} 格式化後的訊息
 */
export function buildApiMessages() {
    if (!state.activeCharacterId || !state.activeChatId) return [];

    const history = state.chatHistories[state.activeCharacterId][state.activeChatId] || [];
    const maxTokenContext = parseInt(state.globalSettings.contextSize) || 30000;
    
    const prefixMessages = PromptManager.buildPrefixMessages();
    let currentTokenCount = prefixMessages.reduce((sum, msg) => sum + estimateTokens(msg.content), 0);
    
    const recentHistory = [];

    for (let i = history.length - 1; i >= 0; i--) {
        const msg = history[i];
        const content = (msg.role === 'assistant' && Array.isArray(msg.content))
            ? msg.content[msg.activeContentIndex]
            : msg.content;
        
        const messageTokens = estimateTokens(content);

        if (currentTokenCount + messageTokens <= maxTokenContext) {
            recentHistory.unshift(msg);
            currentTokenCount += messageTokens;
        } else {
            break;
        }
    }

    return buildApiMessagesFromHistory(recentHistory, prefixMessages);
}

/**
 * @description 從指定的歷史紀錄片段建構 API payload
 * @param {Array} customHistory - 用於建構 payload 的對話歷史陣列
 * @param {Array} prefixMessages - 由提示詞組成的訊息前綴
 * @returns {Array|Object} 格式化後的訊息
 */
export function buildApiMessagesFromHistory(customHistory, prefixMessages = []) {
    const provider = state.globalSettings.apiProvider || 'official_gemini';
    
    const recentHistory = customHistory.filter(msg => !msg.error).map(msg => {
        let finalContent = msg.content;
        if (msg.role === 'assistant' && Array.isArray(msg.content)) {
            finalContent = msg.content[msg.activeContentIndex];
        }
        return { role: msg.role, content: finalContent };
    });

    const combinedMessages = [...prefixMessages, ...recentHistory];

    if (provider === 'google' || provider === 'anthropic') {
        const systemPrompts = combinedMessages.filter(m => m.role === 'system').map(m => m.content).join('\n\n');
        const chatMessages = combinedMessages.filter(m => m.role !== 'system');

        if (provider === 'google') {
            const contents = chatMessages.map(msg => ({ 
                role: msg.role === 'assistant' ? 'model' : 'user', 
                parts: [{ text: msg.content }] 
            }));
            return {
                contents,
                systemInstruction: { parts: [{ text: systemPrompts }] }
            };
        }

        if (provider === 'anthropic') {
            const cleanedMessages = cleanMessagesForClaude(chatMessages);
            return { system: systemPrompts, messages: cleanedMessages };
        }
    }

    let systemContent = '';
    const otherMessages = [];
    let systemBlockEnded = false;
    for (const msg of combinedMessages) {
        if (msg.role === 'system' && !systemBlockEnded) {
            systemContent += (systemContent ? '\n\n' : '') + msg.content;
        } else {
            if (msg.role !== 'system') {
                systemBlockEnded = true;
            }
            otherMessages.push(msg);
        }
    }

    const finalMessages = [];
    if (systemContent) {
        finalMessages.push({ role: 'system', content: systemContent });
    }
    finalMessages.push(...otherMessages);
    return finalMessages;
}

/**
 * @description 呼叫後端大型語言模型 API
 * @param {Array|Object} messagePayload - 準備發送的訊息
 * @param {boolean} isForSummarization - 是否為生成摘要的呼叫
 * @returns {Promise<string>} AI 回應的文字
 */
export async function callApi(messagePayload, isForSummarization = false) {
    tempState.apiCallController = new AbortController();
    const signal = tempState.apiCallController.signal;

    const settings = state.globalSettings;
    const provider = settings.apiProvider || 'official_gemini';
    
    if (provider === 'official_gemini') {
        return callOfficialApi(messagePayload, isForSummarization, signal);
    } else {
        return callProxyApi(provider, settings.apiKey, messagePayload, isForSummarization, signal);
    }
}

async function callOfficialApi(messagePayload, isForSummarization, signal) {
    const YOUR_WORKER_URL = 'https://key.d778105.workers.dev/';
    const url = YOUR_WORKER_URL + 'chat';
    const settings = state.globalSettings;

    const body = {
        model: settings.apiModel,
        messages: messagePayload,
        temperature: isForSummarization ? 0.5 : parseFloat(settings.temperature),
        top_p: isForSummarization ? 1 : parseFloat(settings.topP),
        max_tokens: isForSummarization ? 1000 : parseInt(settings.maxTokens)
    };

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal,
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API 錯誤 (${response.status}): ${errorText}`);
    }
    const data = await response.json();
    return parseResponse('openai', data);
}

async function callProxyApi(provider, apiKey, messagePayload, isForSummarization, signal) {
    if (!apiKey) throw new Error('尚未設定 API 金鑰。');

    const YOUR_WORKER_URL = 'https://key.d778105.workers.dev/';
    const settings = state.globalSettings;
    let url = "", headers = {}, body = {};
    const baseParams = {
        model: settings.apiModel,
        temperature: isForSummarization ? 0.5 : parseFloat(settings.temperature),
        top_p: isForSummarization ? 1 : parseFloat(settings.topP),
    };
    const maxTokensValue = isForSummarization ? 1000 : parseInt(settings.maxTokens);

    switch (provider) {
        case "openai":
        case "mistral":
        case "xai":
        case "openrouter":
            let baseUrl;
            if (provider === 'openai') baseUrl = 'https://api.openai.com/v1/chat/completions';
            else if (provider === 'mistral') baseUrl = 'https://api.mistral.ai/v1/chat/completions';
            else if (provider === 'xai') baseUrl = 'https://api.x.ai/v1/chat/completions';
            else baseUrl = 'https://openrouter.ai/api/v1/chat/completions';
            
            url = YOUR_WORKER_URL + baseUrl;
            headers = { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` };
            
            body = { ...baseParams, messages: messagePayload };

            // [FIX] 根據供應商決定使用 max_tokens 或 max_completion_tokens
            // 假設 OpenAI 的 gpt-4.1 和 gpt-5 也可能使用新參數
            if (provider === 'mistral' || provider === 'xai' || (provider === 'openai' && (settings.apiModel.includes('gpt-5') || settings.apiModel.includes('gpt-4.1')))) {
                body.max_completion_tokens = maxTokensValue;
            } else {
                body.max_tokens = maxTokensValue;
            }

            if (provider === 'openai' || provider === 'mistral' || provider === 'xai') {
                body.frequency_penalty = parseFloat(settings.repetitionPenalty);
            }
            if (provider === 'openrouter') {
                body.repetition_penalty = parseFloat(settings.repetitionPenalty);
            }
            break;
        case "anthropic":
            url = YOUR_WORKER_URL + "https://api.anthropic.com/v1/messages";
            headers = { 
                "Content-Type": "application/json", 
                "x-api-key": apiKey, 
                "anthropic-version": "2023-06-01",
                "anthropic-dangerous-direct-browser-access": "true"
            };
            body = { ...baseParams, system: messagePayload.system, messages: messagePayload.messages, max_tokens: maxTokensValue };
            break;
        case "google":
            url = YOUR_WORKER_URL + `https://generativelanguage.googleapis.com/v1beta/models/${settings.apiModel}:generateContent?key=${apiKey}`;
            headers = { "Content-Type": "application/json" };
            body = { 
                contents: messagePayload.contents, 
                systemInstruction: messagePayload.systemInstruction,
                generationConfig: { 
                    temperature: baseParams.temperature, 
                    topP: baseParams.top_p, 
                    maxOutputTokens: maxTokensValue 
                } 
            };
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

function parseResponse(provider, data) {
    try {
        switch (provider) {
            case "openai":
            case "mistral":
            case "xai":
            case "openrouter":
            case "official_gemini":
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

export async function testApiConnection(provider, apiKey, model) {
    const YOUR_CLOUDFLARE_WORKER_URL = 'https://key.d778105.workers.dev/';
    let url = "", headers = {}, body = {};
    
    const testPayload = [{ role: 'user', content: 'Hello' }];
    
    switch (provider) {
        case "openai":
        case "mistral":
        case "xai":
        case "openrouter":
            let baseUrl;
            if (provider === 'openai') baseUrl = 'https://api.openai.com/v1/chat/completions';
            else if (provider === 'mistral') baseUrl = 'https://api.mistral.ai/v1/chat/completions';
            else if (provider === 'xai') baseUrl = 'https://api.x.ai/v1/chat/completions';
            else baseUrl = 'https://openrouter.ai/api/v1/chat/completions';
            url = YOUR_CLOUDFLARE_WORKER_URL + baseUrl;
            headers = { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` };
            
            body = { model, messages: testPayload };
            // [FIX] 根據供應商和模型名稱決定使用 max_tokens 或 max_completion_tokens 進行測試
            if (provider === 'mistral' || provider === 'xai' || (provider === 'openai' && (model.includes('gpt-5') || model.includes('gpt-4.1')))) {
                body.max_completion_tokens = 5;
            } else {
                body.max_tokens = 5;
            }
            break;
        case "anthropic":
            url = YOUR_CLOUDFLARE_WORKER_URL + "https://api.anthropic.com/v1/messages";
            headers = { 
                "Content-Type": "application/json", 
                "x-api-key": apiKey, 
                "anthropic-version": "2023-06-01",
                "anthropic-dangerous-direct-browser-access": "true"
            };
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
