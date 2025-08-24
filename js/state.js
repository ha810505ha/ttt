// js/state.js
// This file manages the application's state, including loading and saving to localStorage.

import { defaultCharacters, DEFAULT_AVATAR } from './constants.js';

// The core state object for the application
export let state = {
    characters: [],
    chatHistories: {}, 
    longTermMemories: {},
    chatMetadatas: {}, 
    userPersonas: [],
    activeUserPersonaId: null,
    activeCharacterId: null,
    activeChatId: null,
    globalSettings: {},
    promptSettings: {}
};

// Temporary state for editing
export let tempState = {
    editingCharacterId: null,
    editingUserPersonaId: null,
    renamingChatId: null,
    apiCallController: null
};

/**
 * @description Loads the application state from localStorage
 */
export function loadStateFromLocalStorage() {
    const safelyParseJSON = (key, defaultValue) => {
        const item = localStorage.getItem(key);
        if (item === null) return defaultValue;
        try {
            return JSON.parse(item);
        } catch (error) {
            console.error(`Failed to parse JSON from localStorage for key "${key}":`, error);
            return defaultValue;
        }
    };

    state.characters = safelyParseJSON('characters', defaultCharacters);
    state.chatHistories = safelyParseJSON('chatHistories', {});
    state.longTermMemories = safelyParseJSON('longTermMemories', {});
    state.chatMetadatas = safelyParseJSON('chatMetadatas', {});
    state.userPersonas = safelyParseJSON('userPersonas', []);
    state.activeUserPersonaId = localStorage.getItem('activeUserPersonaId') || null;
    state.globalSettings = safelyParseJSON('globalSettings', {});
    state.promptSettings = safelyParseJSON('promptSettings', {});
    
    // Initialize or validate user personas
    if (state.userPersonas.length === 0) {
        const defaultPersona = { id: `user_${Date.now()}`, name: 'User', description: '', avatarUrl: DEFAULT_AVATAR };
        state.userPersonas.push(defaultPersona);
        state.activeUserPersonaId = defaultPersona.id;
    }
    if (!state.activeUserPersonaId || !state.userPersonas.find(p => p.id === state.activeUserPersonaId)) {
        state.activeUserPersonaId = state.userPersonas[0]?.id || null;
    }

    // Load and validate the active character and chat
    let loadedCharId = localStorage.getItem('activeCharacterId');
    let loadedChatId = localStorage.getItem('activeChatId');
    state.activeCharacterId = loadedCharId && loadedCharId !== 'null' ? loadedCharId : null;
    state.activeChatId = loadedChatId && loadedChatId !== 'null' ? loadedChatId : null;

    migrateAndValidateState();

    if (!state.characters.find(c => c.id === state.activeCharacterId)) {
        state.activeCharacterId = null;
        state.activeChatId = null;
    }
    if (state.activeCharacterId && (!state.chatHistories[state.activeCharacterId] || !state.chatHistories[state.activeCharacterId][state.activeChatId])) {
        state.activeChatId = null;
    }

    state.characters.forEach(char => {
        if (!state.chatHistories[char.id]) {
            state.chatHistories[char.id] = {};
            state.chatMetadatas[char.id] = {};
        }
    });

    saveState();
}

/**
 * @description Migrates old data structures and validates data integrity
 */
function migrateAndValidateState() {
    // Migration: Ensure assistant message content is an array
    for (const charId in state.chatHistories) {
        for (const chatId in state.chatHistories[charId]) {
            const history = state.chatHistories[charId][chatId];
            history.forEach(msg => {
                if (msg.role === 'assistant' && typeof msg.content === 'string') {
                    msg.content = [msg.content];
                    msg.activeContentIndex = 0;
                }
            });
        }
    }

    // Validation: Ensure every chat has corresponding metadata
    for (const char of state.characters) {
        if (!state.chatHistories[char.id]) state.chatHistories[char.id] = {};
        if (!state.chatMetadatas[char.id]) state.chatMetadatas[char.id] = {};

        const historyIds = Object.keys(state.chatHistories[char.id]);
        const metadataIds = Object.keys(state.chatMetadatas[char.id]);

        for (const chatId of historyIds) {
            if (!state.chatMetadatas[char.id][chatId]) {
                state.chatMetadatas[char.id][chatId] = { name: '', pinned: false, notes: '', userPersonaId: state.activeUserPersonaId };
            }
            if (!state.chatMetadatas[char.id][chatId].userPersonaId) {
                state.chatMetadatas[char.id][chatId].userPersonaId = state.activeUserPersonaId;
            }
        }

        for (const chatId of metadataIds) {
            if (!state.chatHistories[char.id][chatId]) {
                delete state.chatMetadatas[char.id][chatId];
            }
        }
    }
}

/**
 * @description Saves the current state to localStorage
 */
export function saveState() {
    localStorage.setItem('characters', JSON.stringify(state.characters));
    localStorage.setItem('chatHistories', JSON.stringify(state.chatHistories));
    localStorage.setItem('longTermMemories', JSON.stringify(state.longTermMemories));
    localStorage.setItem('chatMetadatas', JSON.stringify(state.chatMetadatas));
    localStorage.setItem('userPersonas', JSON.stringify(state.userPersonas));
    localStorage.setItem('activeUserPersonaId', state.activeUserPersonaId || '');
    localStorage.setItem('activeCharacterId', state.activeCharacterId || '');
    localStorage.setItem('activeChatId', state.activeChatId || '');
    localStorage.setItem('globalSettings', JSON.stringify(state.globalSettings));
    localStorage.setItem('promptSettings', JSON.stringify(state.promptSettings));
}