// js/main.js
// 這是應用程式的主要進入點

// [修正] 引入 Firebase v9 模組化函式
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";

import { loadStateFromDB, state } from './state.js';
import { openDB } from './db.js';
import { applyTheme, setAppHeight } from './utils.js';
import { renderCharacterList, renderActiveChat } from './ui.js';
import { setupEventListeners } from './events.js';

// [修正] 匯出 auth 實例，讓其他模組 (特別是 handlers.js) 可以使用
export let auth;

/**
 * @description 設定 Markdown 渲染器的選項
 */
function setupMarkdownRenderer() {
    const renderer = new marked.Renderer();
    
    renderer.link = (href, title, text) => {
        // 為了安全，不渲染連結
        return text;
    };

    renderer.heading = (text, level, raw) => {
        // 將標題降級為普通段落
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
    
    // =======================================================================
    // [重要] Firebase 初始化 (使用 v9 模組化語法)
    // =======================================================================
    const firebaseConfig = {
      apiKey: "AIzaSyBKfM5fvlEr72B1aXGNwW9dmpuTMHvInaI",
      authDomain: "icechat-1f28c.firebaseapp.com",
      projectId: "icechat-1f28c",
      storageBucket: "icechat-1f28c.firebasestorage.app",
      messagingSenderId: "146757831481",
      appId: "1:146757831481:web:7c7a786134eb4e4cccf6e8",
      measurementId: "G-M93QNY87PM"
    };

    // 初始化 Firebase App
    const app = initializeApp(firebaseConfig);
    // 取得 Auth 實例並指派給匯出的變數
    auth = getAuth(app);
    // =======================================================================

    try {
        await openDB();
        console.log("資料庫已成功連接。");

        // [修正] 使用 v9 語法的 onAuthStateChanged
        onAuthStateChanged(auth, async (user) => {
            state.currentUser = user; // 更新全域狀態中的使用者資訊
            console.log("使用者狀態已變更:", user ? user.displayName : '已登出');
            
            await loadStateFromDB();
            
            if (state.globalSettings.theme) {
                applyTheme(state.globalSettings.theme);
            }

            renderCharacterList();
            renderActiveChat();
        });

        setupEventListeners();
        setAppHeight();
        
    } catch (error) {
        console.error("應用程式初始化失敗:", error);
        document.body.innerHTML = "應用程式載入失敗，請檢查主控台。";
    }
}

document.addEventListener('DOMContentLoaded', initialize);
