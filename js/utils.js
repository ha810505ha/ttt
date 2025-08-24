// js/utils.js
// 這個檔案存放一些通用的輔助函式 (utility/helper functions)。

import * as DOM from './dom.js';
import { tempState, state } from './state.js';
import { DEFAULT_AVATAR } from './constants.js'; // <-- 修正：加入了這個 import

/**
 * @description 設定 --app-height CSS 變數，以解決行動裝置瀏覽器高度問題
 */
export function setAppHeight() {
    const doc = document.documentElement;
    doc.style.setProperty('--app-height', `${window.innerHeight}px`);
}

/**
 * @description 應用目前儲存的主題
 */
export function applyTheme() {
    const currentTheme = localStorage.getItem('theme') || 'light';
    document.body.className = currentTheme + '-mode';
    DOM.themeToggleBtn.innerHTML = currentTheme === 'light' ? '<i class="fa-solid fa-moon"></i>' : '<i class="fa-solid fa-sun"></i>';
}

/**
 * @description 切換亮色/暗色主題
 */
export function toggleTheme() {
    let currentTheme = localStorage.getItem('theme') || 'light';
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    localStorage.setItem('theme', currentTheme);
    applyTheme();
}

/**
 * @description 同步滑桿 (range input) 和數字輸入框 (number input) 的值
 * @param {HTMLInputElement} slider - 滑桿元素
 * @param {HTMLInputElement} numberInput - 數字輸入框元素
 */
export function setupSliderSync(slider, numberInput) {
    slider.addEventListener('input', () => numberInput.value = slider.value);
    numberInput.addEventListener('input', () => slider.value = numberInput.value);
}

/**
 * @description 處理圖片上傳、壓縮並預覽
 * @param {Event} event - input change 事件
 * @param {HTMLImageElement} previewElement - 預覽圖片的 img 元素
 */
export function handleImageUpload(event, previewElement) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 300;
            const MAX_HEIGHT = 300;
            let { width, height } = img;

            if (width > height) {
                if (width > MAX_WIDTH) {
                    height *= MAX_WIDTH / width;
                    width = MAX_WIDTH;
                }
            } else {
                if (height > MAX_HEIGHT) {
                    width *= MAX_HEIGHT / height;
                    height = MAX_HEIGHT;
                }
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            previewElement.src = canvas.toDataURL('image/jpeg', 0.7);
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

/**
 * @description 匯出角色資料為 JSON 檔案
 */
export function exportCharacter() {
    if (!tempState.editingCharacterId) { alert('請先儲存角色後再匯出。'); return; }
    const char = state.characters.find(c => c.id === tempState.editingCharacterId);
    const characterData = {
        spec: 'chara_card_v2',
        data: { name: char.name, description: char.description, first_mes: char.firstMessage, mes_example: char.exampleDialogue, character_avatar: char.avatarUrl }
    };
    const blob = new Blob([JSON.stringify(characterData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${char.name || 'character'}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

/**
 * @description 觸發檔案選擇器以匯入角色卡
 */
export function importCharacter() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,.png';
    input.onchange = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        if (file.type === 'application/json' || file.name.endsWith('.json')) {
            const reader = new FileReader();
            reader.onload = (e) => { 
                try { 
                    const jsonData = JSON.parse(e.target.result);
                    populateEditorWithCharData(jsonData); 
                } catch (error) { 
                    alert('匯入失敗，JSON 檔案格式錯誤。'); 
                } 
            };
            reader.readAsText(file, 'UTF-8');
        } else if (file.type === 'image/png') {
            // ... (PNG 匯入邏輯保持不變)
            alert('PNG 匯入功能正在開發中！');
        } else { 
            alert('不支援的檔案格式。請選擇 .json 或 .png 檔案。'); 
        }
    };
    input.click();
}

/**
 * @description 將匯入的角色資料填入編輯器
 * @param {Object} importedData - 匯入的 JSON 物件
 * @param {string|null} imageBase64 - 如果是從 PNG 匯入，則為圖片的 base64 字串
 */
function populateEditorWithCharData(importedData, imageBase64 = null) {
    const data = importedData.data || importedData;
    
    DOM.charNameInput.value = data.name || '';
    DOM.charDescriptionInput.value = data.description || data.personality || '';
    DOM.charFirstMessageInput.value = data.first_mes || data.firstMessage || '';
    DOM.charExampleDialogueInput.value = data.mes_example || data.exampleDialogue || '';
    DOM.charAvatarPreview.src = imageBase64 || data.character_avatar || DEFAULT_AVATAR;
    
    alert('角色卡匯入成功！請記得儲存。');
}

/**
 * @description 匯出對話為 JSONL 格式
 */
export function exportChatAsJsonl() {
    if (!state.activeCharacterId || !state.activeChatId) return;
    const history = state.chatHistories[state.activeCharacterId][state.activeChatId] || [];
    if (history.length === 0) { alert('沒有對話可以匯出。'); return; }
    
    const activeChar = state.characters.find(c => c.id === state.activeCharacterId);
    const jsonlString = JSON.stringify({ messages: history });
    const blob = new Blob([jsonlString], { type: 'application/jsonl' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeChar.name}_${state.activeChatId}.jsonl`;
    a.click();
    URL.revokeObjectURL(url);
}

/**
 * @description 匯出對話為 PNG 圖片
 * @param {number} startIndex - 開始匯出的訊息索引
 * @param {number} endIndex - 結束匯出的訊息索引
 */
export function exportChatAsImage(startIndex, endIndex) {
    if (!state.activeCharacterId || !state.activeChatId) return;
    const activeChar = state.characters.find(c => c.id === state.activeCharacterId);
    
    DOM.loadingOverlay.classList.remove('hidden');

    const allMessageRows = DOM.chatWindow.querySelectorAll('.message-row');
    const elementsToHide = DOM.chatWindow.querySelectorAll('.edit-msg-btn, .message-actions');
    
    allMessageRows.forEach((row, index) => {
        if (index < startIndex || index > endIndex) {
            row.style.display = 'none';
        }
    });
    elementsToHide.forEach(el => el.style.visibility = 'hidden');

    const originalChatWindowStyle = {
        height: DOM.chatWindow.style.height,
        overflowY: DOM.chatWindow.style.overflowY
    };
    DOM.chatWindow.style.height = 'auto';
    DOM.chatWindow.style.overflowY = 'visible';
    
    setTimeout(() => {
        html2canvas(DOM.chatWindow, {
            backgroundColor: getComputedStyle(document.body).getPropertyValue('--background-color'),
            useCORS: true,
        }).then(canvas => {
            const a = document.createElement('a');
            a.href = canvas.toDataURL("image/png", 1.0);
            a.download = `${activeChar.name}_${state.activeChatId}.png`;
            a.click();
        }).catch(err => {
            console.error('匯出圖片失敗!', err);
            alert('匯出圖片失敗，請查看主控台獲取更多資訊。');
        }).finally(() => {
            allMessageRows.forEach(row => row.style.display = '');
            elementsToHide.forEach(el => el.style.visibility = '');
            DOM.chatWindow.style.height = originalChatWindowStyle.height;
            DOM.chatWindow.style.overflowY = originalChatWindowStyle.overflowY;
            DOM.loadingOverlay.classList.add('hidden');
        });
    }, 150);
}
