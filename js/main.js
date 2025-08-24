// js/main.js
// 這是應用程式的主要進入點

import { loadStateFromDB } from './state.js';
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
 * @description 初始化應用程式，載入狀態、設定主題、渲染畫面並綁定事件監聽器
 */
async function initialize() {
    setupMarkdownRenderer();
    
    try {
        // [重要修改] 等待 IndexedDB 資料庫成功打開
        await openDB();
        console.log("資料庫已成功連接。");

        // [重要修改] 從 IndexedDB 異步載入所有資料
        await loadStateFromDB();
        console.log("應用程式狀態已從資料庫載入。");

        applyTheme();
        renderCharacterList();
        renderActiveChat();
        setupEventListeners();
        setAppHeight();
        
    } catch (error) {
        console.error("應用程式初始化失敗:", error);
        // 可以在此處向使用者顯示一個錯誤訊息
        document.body.innerHTML = "應用程式載入失敗，請檢查主控台或嘗試清除網站資料。";
    }
}

// 當整個頁面載入完成後，啟動應用程式
document.addEventListener('DOMContentLoaded', initialize);
