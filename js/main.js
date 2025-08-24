// js/main.js
// 這是應用程式的主要進入點

import { loadStateFromLocalStorage } from './state.js';
import { applyTheme, setAppHeight } from './utils.js';
import { renderCharacterList, renderActiveChat } from './ui.js';
import { setupEventListeners } from './events.js';

/**
 * @description 設定 Markdown 渲染器的選項
 */
function setupMarkdownRenderer() {
    const renderer = new marked.Renderer();
    
    // 禁用連結，避免 AI 回應中的網址可以點擊
    renderer.link = (href, title, text) => {
        return text;
    };

    // 將標題轉換為普通段落，避免樣式錯亂
    renderer.heading = (text, level, raw) => {
        return `<p>${raw}</p>`;
    };
    
    marked.setOptions({
        renderer: renderer,
        gfm: true, // 啟用 GitHub 風格的 Markdown
        breaks: true, // 將換行符轉換為 <br>
    });
}

/**
 * @description 初始化應用程式，載入狀態、設定主題、渲染畫面並綁定事件監聽器
 */
function initialize() {
    // [重要] 首先設定好 Markdown 渲染器
    setupMarkdownRenderer();

    // 從 localStorage 載入所有資料
    loadStateFromLocalStorage();
    
    // 根據儲存的設定應用亮色/暗色主題
    applyTheme();
    
    // 渲染左側的角色列表
    renderCharacterList();
    
    // 如果有正在進行的對話，渲染它
    renderActiveChat();
    
    // 綁定所有按鈕和輸入框的事件
    setupEventListeners();
    
    // 設定應用程式高度以應對行動裝置瀏覽器
    setAppHeight();
}

// 當整個頁面載入完成後，啟動應用程式
document.addEventListener('DOMContentLoaded', initialize);
