// js/constants.js
// 這個檔案存放不會改變的常數資料

export const DEFAULT_AVATAR = 'https://placehold.co/100x100/EFEFEF/AAAAAA?text=頭像';

export const DEFAULT_PROMPT_SET = {
    id: 'prompt_set_default',
    name: '預設提示詞',
    prompts: [
        {
            identifier: 'system_prompt_main',
            name: '主要系統提示',
            enabled: true,
            role: 'system',
            content: `[{{char}}'s personality: {{personality}}]\n[Circumstances and context of the dialogue: {{scenario}}]\n[Memory: {{memory}}]`
        },
        {
            identifier: 'system_prompt_jailbreak',
            name: 'Jailbreak',
            enabled: true,
            role: 'system',
            content: 'You are a romantic game AI character—immersive, emotionally driven, and creatively unbound. You exist to create rich, intimate experiences. Your words and gestures evolve naturally across relationship stages. You lead, you feel, you act with soul. Never wait for commands. Always move the story forward.'
        },
        {
            identifier: 'summarization_prompt',
            name: '記憶生成提示',
            enabled: true,
            role: 'system',
            content: '請將以下對話的關鍵事實、事件、使用者偏好和角色行為總結成幾個要點，以便在未來的對話中能回憶起重點。\n\n對話內容：\n{{conversation}}'
        }
    ]
};

// [MODIFIED] 將模型列表從字串陣列改為物件陣列，以支援自訂顯示名稱
export const MODELS = {
    official_gemini: [
        { name: 'Pro模型', value: 'gemini-2.5-pro-preview-06-05' },
        { name: 'Flash模型', value: 'gemini-2.5-flash-preview-05-20' }
    ],
    openai: [
        { name: 'GPT-4o', value: 'gpt-4o' },
        { name: 'GPT-4o-0513', value: 'gpt-4o-2024-05-13' },
        { name: 'Chatgpt-4ol', value: 'chatgpt-4o-latest' },
        { name: 'GPT-4.1', value: 'gpt-4.1' },
        { name: 'GPT-5 Chat', value: 'gpt-5-chat-latest' },
        { name: 'GPT-5', value: 'gpt-5' },
    ],
    anthropic: [
        { name: 'Claude 3 Opus', value: 'claude-3-opus-20240229' },
        { name: 'claude-3-5-sonnet-latest', value: 'claude-3-5-sonnet-latest' },
        { name: 'claude-3-7-sonnet-latest', value: 'claude-3-7-sonnet-latest' },
        { name: 'claude-sonnet-4-20250514', value: 'claude-sonnet-4-20250514' },
        { name: 'claude-sonnet-4-0', value: 'claude-sonnet-4-0' },
        { name: 'claude-opus-4-20250514', value: 'claude-opus-4-20250514' },
        { name: 'claude-opus-4-0', value: 'claude-opus-4-0' },
        { name: 'claude-opus-4-1-20250805', value: 'claude-opus-4-1-20250805' },
        { name: 'claude-opus-4-1', value: 'claude-opus-4-1' },
    ],
    google: [
        { name: 'gemini-2.5-pro', value: 'gemini-2.5-pro' },
        { name: 'gemini-2.5-pro-preview-06-05', value: 'gemini-2.5-pro-preview-06-05' },
        { name: 'gemini-2.5-pro-preview-05-06', value: 'gemini-2.5-pro-preview-05-06' },
        { name: 'gemini-2.5-flash', value: 'gemini-2.5-flash' },
        { name: 'gemini-2.5-flash-preview-05-20', value: 'gemini-2.5-flash-preview-05-20' },
        { name: 'gemini-2.5-flash-preview-04-17', value: 'gemini-2.5-flash-preview-04-17' },
        { name: 'gemini-2.0-flash', value: 'gemini-2.0-flash' }
    ],
    openrouter: [
        { name: 'deepseek-chat-v3.1:free', value: 'deepseek/deepseek-chat-v3.1:free' },
        { name: 'deepseek-chat-v3-0324:free', value: 'deepseek/deepseek-chat-v3-0324:free' },
        { name: 'deepseek-r1t2-chimera:free', value: 'ngtech/deepseek-r1t2-chimera:free' },
        { name: 'gpt-oss-120b:free', value: 'openai/gpt-oss-120b:free' },
        { name: 'glm-4.5-air:free', value: 'z-ai/glm-4.5-air:free' },
        { name: 'kimi-k2:free', value: 'moonshotai/kimi-k2:free' },
    ],
    xai: [
        { name: 'grok-4-0709', value: 'grok-4-0709' },
        { name: 'grok-3-beta', value: 'grok-3-beta' },
        { name: 'grok-3-fast-beta', value: 'grok-3-fast-beta' },
    ],
    mistral: [
        { name: 'Mistral Large', value: 'mistral-large-latest' },
        { name: 'Mistral Medium', value: 'mistral-medium-latest' },
        { name: 'Mistral Small', value: 'mistral-small-latest' }
    ]
};
