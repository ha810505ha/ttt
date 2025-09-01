// js/main.js
// 這是應用程式的主要進入點

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";

import { loadStateFromDB, state } from './state.js';
import { openDB } from './db.js';
import { applyTheme, setAppHeight } from './utils.js';
import { renderCharacterList, renderActiveChat, renderAccountTab } from './ui.js';
import { setupEventListeners } from './events.js';

export let auth;

/**
 * @description 設定 Markdown 渲染器的選項
 */
function setupMarkdownRenderer() {
    const renderer = new marked.Renderer();
    
    renderer.link = (href, title, text) => {
        return text;
    };

    renderer.heading = (text, level, raw) => {
        return `<p>${raw}</p>`;
    };
    
    marked.setOptions({
        renderer: renderer,
        gfm: true,
        breaks: true,
    });
}

/**
 * @description 初始化應用程式
 */
async function initialize() {
    applyTheme();
    setupMarkdownRenderer();
    
    const firebaseConfig = {
      apiKey: "AIzaSyBKfM5fvlEr72B1aXGNwW9dmpuTMHvInaI",
      authDomain: "icechat-1f28c.firebaseapp.com",
      projectId: "icechat-1f28c",
      storageBucket: "icechat-1f28c.firebasestorage.app",
      messagingSenderId: "146757831481",
      appId: "1:146757831481:web:7c7a786134eb4e4cccf6e8",
      measurementId: "G-M93QNY87PM"
    };

    const app = initializeApp(firebaseConfig);
    auth = getAuth(app);

    try {
        await openDB();
        console.log("資料庫已成功連接。");

        onAuthStateChanged(auth, async (user) => {
            state.currentUser = user;
            console.log("使用者狀態已變更:", user ? user.displayName : '已登出');
            
            await loadStateFromDB();
            
            if (state.globalSettings.theme) {
                applyTheme(state.globalSettings.theme);
            }

            renderCharacterList();
            renderActiveChat();
            renderAccountTab(); // 確保每次認證狀態改變都更新帳號分頁
        });

        setupEventListeners();
        setAppHeight();
        
    } catch (error) {
        console.error("應用程式初始化失敗:", error);
        document.body.innerHTML = "應用程式載入失敗，請檢查主控台。";
    }
}

document.addEventListener('DOMContentLoaded', initialize);
