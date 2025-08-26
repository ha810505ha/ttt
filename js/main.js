// js/main.js
// 這是應用程式的主要進入點

import { loadStateFromDB, state } from './state.js';
import { openDB } from './db.js';
import { applyTheme, setAppHeight } from './utils.js';
import { renderCharacterList, renderActiveChat } from './ui.js';
import { setupEventListeners } from './events.js';

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
    
    // =======================================================================
    // [重要] Firebase 初始化
    // =======================================================================
    // [已更新] 使用您提供的正確設定
    const firebaseConfig = {
      apiKey: "AIzaSyBKfM5fvlEr72B1aXGNwW9dmpuTMHvInaI",
      authDomain: "icechat-1f28c.firebaseapp.com",
      projectId: "icechat-1f28c",
      storageBucket: "icechat-1f28c.firebasestorage.app",
      messagingSenderId: "146757831481",
      appId: "1:146757831481:web:7c7a786134eb4e4cccf6e8",
      measurementId: "G-M93QNY87PM"
    };

    // 初始化 Firebase
    firebase.initializeApp(firebaseConfig);
    const auth = firebase.auth();
    // =======================================================================

    try {
        await openDB();
        console.log("資料庫已成功連接。");

        // 監聽使用者登入狀態的變化
        auth.onAuthStateChanged(async (user) => {
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
