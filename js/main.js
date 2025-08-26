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
    // [修改] 立即從 localStorage 應用主題，以避免畫面閃爍
    applyTheme();
    setupMarkdownRenderer();
    
    // =======================================================================
    // [重要] Firebase 初始化
    // =======================================================================
    // 請將您從 Firebase 控制台複製的 firebaseConfig 物件，完整地貼到下面來取代它
    const firebaseConfig = {
      apiKey: "YOUR_API_KEY",
      authDomain: "YOUR_AUTH_DOMAIN",
      projectId: "YOUR_PROJECT_ID",
      storageBucket: "YOUR_STORAGE_BUCKET",
      messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
      appId: "YOUR_APP_ID",
      measurementId: "YOUR_MEASUREMENT_ID"
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
            
            // 載入資料庫中的狀態
            await loadStateFromDB();
            
            // [新增] 從載入的設定中再次應用主題，確保與資料庫同步
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
