// js/utils.js
// 這個檔案存放一些通用的輔助函式 (utility/helper functions)。

import * as DOM from './dom.js';
import { tempState, state } from './state.js';
import { DEFAULT_AVATAR } from './constants.js';

/**
 * @description 設定 --app-height CSS 變數，以解決行動裝置瀏覽器高度問題
 */
export function setAppHeight() {
    const doc = document.documentElement;
    doc.style.setProperty('--app-height', `${window.innerHeight}px`);
}

/**
 * @description 應用目前儲存的主題
 * @param {string} [theme] - 'light', 'dark', 'a', 或 'b'。如果未提供，則從 localStorage 讀取。
 */
export function applyTheme(theme) {
    const themeToApply = theme || localStorage.getItem('theme') || 'light';
    
    document.body.classList.remove('dark-mode', 'theme-a', 'theme-b');

    if (themeToApply === 'dark') {
        document.body.classList.add('dark-mode');
    } else if (themeToApply === 'a') {
        document.body.classList.add('theme-a');
    } else if (themeToApply === 'b') {
        document.body.classList.add('theme-b');
    }

    localStorage.setItem('theme', themeToApply);
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
 * @description 觸發檔案選擇器並處理角色卡的匯入流程。
 * 支援 .json 和 .png 格式。
 */
export function importCharacter() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,.png';

    input.onchange = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        
        if (file.type === 'application/json' || file.name.endsWith('.json')) {
            reader.onload = (e) => { 
                try { 
                    const jsonData = JSON.parse(e.target.result);
                    populateEditorWithCharData(jsonData); 
                } catch (error) { 
                    alert('匯入失敗，JSON 檔案格式錯誤。'); 
                    console.error('JSON Import error:', error); 
                } 
            };
            reader.readAsText(file, 'UTF-8'); 
        
        } else if (file.type === 'image/png') {
            let fileAsDataURL = '';
            const readerForDataURL = new FileReader();
            readerForDataURL.onload = (e) => {
                fileAsDataURL = e.target.result;
            };
            readerForDataURL.readAsDataURL(file);

            reader.onload = (e) => {
                try {
                    const arrayBuffer = e.target.result;
                    const dataView = new DataView(arrayBuffer);
                    
                    if (dataView.getUint32(0) !== 0x89504E47 || dataView.getUint32(4) !== 0x0D0A1A0A) {
                        throw new Error('不是有效的 PNG 檔案。');
                    }
                    
                    let offset = 8;
                    let characterDataFound = false;
                    
                    while (offset < arrayBuffer.byteLength) {
                        const length = dataView.getUint32(offset);
                        const type = new TextDecoder("ascii").decode(new Uint8Array(arrayBuffer, offset + 4, 4));
                        const chunkData = new Uint8Array(arrayBuffer, offset + 8, length);
                        
                        if (type === 'tEXt' || type === 'iTXt') {
                            const nullSeparatorIndex = chunkData.indexOf(0);
                            if (nullSeparatorIndex === -1) {
                                offset += 12 + length;
                                continue;
                            }
                            const keyword = new TextDecoder("ascii").decode(chunkData.slice(0, nullSeparatorIndex));

                            if (keyword === 'chara') {
                                let textPayloadOffset = nullSeparatorIndex + 1;
                                
                                if (type === 'iTXt') {
                                    if (chunkData[textPayloadOffset] === 0 || chunkData[textPayloadOffset] === 1) { 
                                         textPayloadOffset++; 
                                         textPayloadOffset++; 
                                         while(chunkData[textPayloadOffset] !== 0 && textPayloadOffset < chunkData.length) textPayloadOffset++; 
                                         textPayloadOffset++;
                                         while(chunkData[textPayloadOffset] !== 0 && textPayloadOffset < chunkData.length) textPayloadOffset++; 
                                         textPayloadOffset++;
                                    }
                                }

                                const base64Data = new TextDecoder("ascii").decode(chunkData.slice(textPayloadOffset));
                                
                                const decodedJsonString = new TextDecoder().decode(
                                    Uint8Array.from(atob(base64Data), c => c.charCodeAt(0))
                                );
                                
                                const jsonData = JSON.parse(decodedJsonString);
                                populateEditorWithCharData(jsonData, fileAsDataURL);
                                characterDataFound = true;
                                break;
                            }
                        } else if (type === 'zTXt') {
                            const nullSeparatorIndex = chunkData.indexOf(0);
                            if (nullSeparatorIndex !== -1) {
                                const keyword = new TextDecoder("ascii").decode(chunkData.slice(0, nullSeparatorIndex));
                                if (keyword === 'chara') {
                                      alert('偵測到壓縮格式(zTXt)的角色卡，目前版本尚不支援解壓縮。');
                                      characterDataFound = true; 
                                      break;
                                }
                            }
                        }
                        
                        offset += 12 + length;
                    }

                    if (!characterDataFound) { 
                        alert('在這張 PNG 圖片中找不到可識別的角色卡資料。'); 
                    }
                } catch (error) { 
                    alert('匯入 PNG 失敗，檔案可能已損壞、格式不符或不包含角色資料。'); 
                    console.error('PNG Import error:', error); 
                }
            };
            reader.readAsArrayBuffer(file);
        } else { 
            alert('不支援的檔案格式。請選擇 .json 或 .png 檔案。'); 
        }
    };
    input.click();
}

/**
 * @description 將從角色卡解析出的資料填入角色編輯器中。
 * @param {object} importedData - 解析後的 JSON 物件。
 * @param {string|null} imageBase64 - 如果是從 PNG 匯入，則傳入圖片的 Base64 字串。
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
