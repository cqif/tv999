function toggleSettings(e) {
    if (window.isPasswordProtected && window.isPasswordVerified) {
        if (window.isPasswordProtected() && !window.isPasswordVerified()) {
            showPasswordModal && showPasswordModal();
            return;
        }
    }
    e && e.stopPropagation();
    const panel = document.getElementById('settingsPanel');
    panel.classList.toggle('show');
}
const toastQueue = [];
let isShowingToast = false;

function showToast(message, type = 'error') {
    toastQueue.push({ message, type });
    if (!isShowingToast) {
        showNextToast();
    }
}

function showNextToast() {
    if (toastQueue.length === 0) {
        isShowingToast = false;
        return;
    }
    
    isShowingToast = true;
    const { message, type } = toastQueue.shift();
    
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    
    const bgColors = {
        'error': 'bg-red-500',
        'success': 'bg-green-500',
        'info': 'bg-blue-500',
        'warning': 'bg-yellow-500'
    };
    
    const bgColor = bgColors[type] || bgColors.error;
    toast.className = `fixed top-4 left-1/2 -translate-x-1/2 px-6 py-3 rounded-lg shadow-lg transform transition-all duration-300 ${bgColor} text-white z-50`;
    toastMessage.textContent = message;
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(-50%) translateY(0)';
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(-50%) translateY(-100%)';
        setTimeout(() => {
            showNextToast();
        }, 300);
    }, 3000);
}
let loadingTimeoutId = null;

function showLoading(message = '加载中...') {
    if (loadingTimeoutId) {
        clearTimeout(loadingTimeoutId);
    }
    
    const loading = document.getElementById('loading');
    const messageEl = loading.querySelector('p');
    messageEl.textContent = message;
    loading.style.display = 'flex';
    loadingTimeoutId = setTimeout(() => {
        hideLoading();
        showToast('操作超时，请稍后重试', 'warning');
    }, 30000);
}

function hideLoading() {
    if (loadingTimeoutId) {
        clearTimeout(loadingTimeoutId);
        loadingTimeoutId = null;
    }
    
    const loading = document.getElementById('loading');
    loading.style.display = 'none';
}

function updateSiteStatus(isAvailable) {
    const statusEl = document.getElementById('siteStatus');
    if (isAvailable) {
        statusEl.innerHTML = '<span class="text-green-500">●</span> 可用';
    } else {
        statusEl.innerHTML = '<span class="text-red-500">●</span> 不可用';
    }
}

function closeModal() {
    document.getElementById('modal').classList.add('hidden');
    document.getElementById('modalContent').innerHTML = '';
}
function getSearchHistory() {
    try {
        const data = localStorage.getItem(SEARCH_HISTORY_KEY);
        if (!data) return [];
        
        const parsed = JSON.parse(data);
        if (!Array.isArray(parsed)) return [];
        return parsed.map(item => {
            if (typeof item === 'string') {
                return { text: item, timestamp: 0 };
            }
            return item;
        }).filter(item => item && item.text);
    } catch (e) {
        console.error('获取搜索历史出错:', e);
        return [];
    }
}
function saveSearchHistory(query) {
    if (!query || !query.trim()) return;
    query = query.trim().substring(0, 50).replace(/</g, '&lt;').replace(/>/g, '&gt;');
    
    let history = getSearchHistory();
    const now = Date.now();
    history = history.filter(item => 
        typeof item === 'object' && item.timestamp && (now - item.timestamp < 5184000000)
    );
    history = history.filter(item => 
        typeof item === 'object' ? item.text !== query : item !== query
    );
    history.unshift({
        text: query,
        timestamp: now
    });
    if (history.length > MAX_HISTORY_ITEMS) {
        history = history.slice(0, MAX_HISTORY_ITEMS);
    }
    
    try {
        localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history));
    } catch (e) {
        console.error('保存搜索历史失败:', e);
        try {
            localStorage.removeItem(SEARCH_HISTORY_KEY);
            localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history.slice(0, 3)));
        } catch (e2) {
            console.error('再次保存搜索历史失败:', e2);
        }
    }
    
    renderSearchHistory();
}
function renderSearchHistory() {
    const historyContainer = document.getElementById('recentSearches');
    if (!historyContainer) return;
    
    const history = getSearchHistory();
    
    if (history.length === 0) {
        historyContainer.innerHTML = '';
        return;
    }
    historyContainer.innerHTML = `
        <div class="flex justify-between items-center w-full mb-2">
            <div class="text-gray-500">最近搜索:</div>
            <button id="clearHistoryBtn" class="text-gray-500 hover:text-white transition-colors" 
                    onclick="clearSearchHistory()" aria-label="清除搜索历史">
                清除搜索历史
            </button>
        </div>
    `;
    
    history.forEach(item => {
        const tag = document.createElement('button');
        tag.className = 'search-tag';
        tag.textContent = item.text;
        if (item.timestamp) {
            const date = new Date(item.timestamp);
            tag.title = `搜索于: ${date.toLocaleString()}`;
        }
        
        tag.onclick = function() {
            document.getElementById('searchInput').value = item.text;
            search();
        };
        historyContainer.appendChild(tag);
    });
}
function clearSearchHistory() {
    if (window.isPasswordProtected && window.isPasswordVerified) {
        if (window.isPasswordProtected() && !window.isPasswordVerified()) {
            showPasswordModal && showPasswordModal();
            return;
        }
    }
    try {
        localStorage.removeItem(SEARCH_HISTORY_KEY);
        renderSearchHistory();
        showToast('搜索历史已清除', 'success');
    } catch (e) {
        console.error('清除搜索历史失败:', e);
        showToast('清除搜索历史失败:', 'error');
    }
}
function toggleHistory(e) {
    if (window.isPasswordProtected && window.isPasswordVerified) {
        if (window.isPasswordProtected() && !window.isPasswordVerified()) {
            showPasswordModal && showPasswordModal();
            return;
        }
    }
    if (e) e.stopPropagation();
    
    const panel = document.getElementById('historyPanel');
    if (panel) {
        panel.classList.toggle('show');
        if (panel.classList.contains('show')) {
            loadViewingHistory();
        }
        const settingsPanel = document.getElementById('settingsPanel');
        if (settingsPanel && settingsPanel.classList.contains('show')) {
            settingsPanel.classList.remove('show');
        }
    }
}
function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    if (diff < 3600000) {
        const minutes = Math.floor(diff / 60000);
        return minutes <= 0 ? '刚刚' : `${minutes}分钟前`;
    }
    if (diff < 86400000) {
        const hours = Math.floor(diff / 3600000);
        return `${hours}小时前`;
    }
    if (diff < 604800000) {
        const days = Math.floor(diff / 86400000);
        return `${days}天前`;
    }
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hour = date.getHours().toString().padStart(2, '0');
    const minute = date.getMinutes().toString().padStart(2, '0');
    
    return `${year}-${month}-${day} ${hour}:${minute}`;
}
function getViewingHistory() {
    try {
        const data = localStorage.getItem('viewingHistory');
        return data ? JSON.parse(data) : [];
    } catch (e) {
        console.error('获取观看历史失败:', e);
        return [];
    }
}
function loadViewingHistory() {
    const historyList = document.getElementById('historyList');
    if (!historyList) return;
    
    const history = getViewingHistory();
    
    if (history.length === 0) {
        historyList.innerHTML = `<div class="text-center text-gray-500 py-8">暂无观看记录</div>`;
        return;
    }
    historyList.innerHTML = history.map(item => {
        const safeTitle = item.title
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
        
        const safeSource = item.sourceName ? 
            item.sourceName.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;') : 
            '未知来源';
            
        const episodeText = item.episodeIndex !== undefined ? 
            `第${item.episodeIndex + 1}集` : '';
        let progressHtml = '';
        if (item.playbackPosition && item.duration && item.playbackPosition > 10 && item.playbackPosition < item.duration * 0.95) {
            const percent = Math.round((item.playbackPosition / item.duration) * 100);
            const formattedTime = formatPlaybackTime(item.playbackPosition);
            const formattedDuration = formatPlaybackTime(item.duration);
            
            progressHtml = `
                <div class="history-progress">
                    <div class="progress-bar">
                        <div class="progress-filled" style="width:${percent}%"></div>
                    </div>
                    <div class="progress-text">${formattedTime} / ${formattedDuration}</div>
                </div>
            `;
        }
        const safeURL = encodeURIComponent(item.url);
        return `
            <div class="history-item cursor-pointer relative group" onclick="playFromHistory('${item.url}', '${safeTitle}', ${item.episodeIndex || 0}, ${item.playbackPosition || 0})">
                <button onclick="event.stopPropagation(); deleteHistoryItem('${safeURL}')" 
                        class="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-gray-400 hover:text-red-400 p-1 rounded-full hover:bg-gray-800 z-10"
                        title="删除记录">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
                <div class="history-info">
                    <div class="history-title">${safeTitle}</div>
                    <div class="history-meta">
                        <span class="history-episode">${episodeText}</span>
                        ${episodeText ? '<span class="history-separator mx-1">·</span>' : ''}
                        <span class="history-source">${safeSource}</span>
                    </div>
                    ${progressHtml}
                    <div class="history-time">${formatTimestamp(item.timestamp)}</div>
                </div>
            </div>
        `;
    }).join('');
    if (history.length > 5) {
        historyList.classList.add('pb-4');
    }
}
function formatPlaybackTime(seconds) {
    if (!seconds || isNaN(seconds)) return '00:00';
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}
function deleteHistoryItem(encodedUrl) {
    try {
        const url = decodeURIComponent(encodedUrl);
        const history = getViewingHistory();
        const newHistory = history.filter(item => item.url !== url);
        localStorage.setItem('viewingHistory', JSON.stringify(newHistory));
        loadViewingHistory();
        showToast('已删除该记录', 'success');
    } catch (e) {
        console.error('删除历史记录项失败:', e);
        showToast('删除记录失败', 'error');
    }
}
function playFromHistory(url, title, episodeIndex, playbackPosition = 0) {
    try {
        let episodesList = [];
        const historyRaw = localStorage.getItem('viewingHistory');
        if (historyRaw) {
            const history = JSON.parse(historyRaw);
            const historyItem = history.find(item => item.title === title);
            if (historyItem && historyItem.episodes && Array.isArray(historyItem.episodes)) {
                episodesList = historyItem.episodes;
                console.log(`从历史记录找到视频 ${title} 的集数数据:`, episodesList.length);
            }
        }
        if (episodesList.length === 0) {
            try {
                const storedEpisodes = JSON.parse(localStorage.getItem('currentEpisodes') || '[]');
                if (storedEpisodes.length > 0) {
                    episodesList = storedEpisodes;
                    console.log(`使用localStorage中的集数数据:`, episodesList.length);
                }
            } catch (e) {
                console.error('解析currentEpisodes失败:', e);
            }
        }
        if (episodesList.length > 0) {
            localStorage.setItem('currentEpisodes', JSON.stringify(episodesList));
            console.log(`已将剧集列表保存到localStorage，共 ${episodesList.length} 集`);
        }
        const positionParam = playbackPosition > 10 ? `&position=${Math.floor(playbackPosition)}` : '';
        
        if (url.includes('?')) {
            const playUrl = new URL(url);
            if (!playUrl.searchParams.has('index') && episodeIndex > 0) {
                playUrl.searchParams.set('index', episodeIndex);
            }
            if (playbackPosition > 10) {
                playUrl.searchParams.set('position', Math.floor(playbackPosition).toString());
            }
            window.location.href = playUrl.toString();
        } else {
            const playerUrl = `player.html?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}&index=${episodeIndex}${positionParam}`;
            window.location.href = playerUrl;
        }
    } catch (e) {
        console.error('从历史记录播放失败:', e);
        const simpleUrl = `player.html?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}&index=${episodeIndex}`;
        window.location.href = simpleUrl;
    }
}
function addToViewingHistory(videoInfo) {
    if (window.isPasswordProtected && window.isPasswordVerified) {
        if (window.isPasswordProtected() && !window.isPasswordVerified()) {
            showPasswordModal && showPasswordModal();
            return;
        }
    }
    try {
        const history = getViewingHistory();
        const existingIndex = history.findIndex(item => item.title === videoInfo.title);
        if (existingIndex !== -1) {
            const existingItem = history[existingIndex];
            existingItem.episodeIndex = videoInfo.episodeIndex;
            existingItem.timestamp = Date.now();
            if (videoInfo.sourceName && !existingItem.sourceName) {
                existingItem.sourceName = videoInfo.sourceName;
            }
            if (videoInfo.playbackPosition && videoInfo.playbackPosition > 10) {
                existingItem.playbackPosition = videoInfo.playbackPosition;
                existingItem.duration = videoInfo.duration || existingItem.duration;
            }
            existingItem.url = videoInfo.url;
            if (videoInfo.episodes && Array.isArray(videoInfo.episodes) && videoInfo.episodes.length > 0) {
                if (!existingItem.episodes || 
                    !Array.isArray(existingItem.episodes) || 
                    existingItem.episodes.length !== videoInfo.episodes.length) {
                    console.log(`更新 "${videoInfo.title}" 的剧集数据: ${videoInfo.episodes.length}集`);
                    existingItem.episodes = [...videoInfo.episodes];
                }
            }
            history.splice(existingIndex, 1);
            history.unshift(existingItem);
        } else {
            const newItem = {
                ...videoInfo,
                timestamp: Date.now()
            };
            if (videoInfo.episodes && Array.isArray(videoInfo.episodes)) {
                newItem.episodes = [...videoInfo.episodes];
                console.log(`保存新视频 "${videoInfo.title}" 的剧集数据: ${videoInfo.episodes.length}集`);
            } else {
                newItem.episodes = [];
            }
            
            history.unshift(newItem);
        }
        const maxHistoryItems = 50;
        if (history.length > maxHistoryItems) {
            history.splice(maxHistoryItems);
        }
        localStorage.setItem('viewingHistory', JSON.stringify(history));
    } catch (e) {
        console.error('保存观看历史失败:', e);
    }
}
function clearViewingHistory() {
    try {
        localStorage.removeItem('viewingHistory');
        loadViewingHistory();
        showToast('观看历史已清空', 'success');
    } catch (e) {
        console.error('清除观看历史失败:', e);
        showToast('清除观看历史失败', 'error');
    }
}
const originalToggleSettings = toggleSettings;
toggleSettings = function(e) {
    if (e) e.stopPropagation();
    originalToggleSettings(e);
    const historyPanel = document.getElementById('historyPanel');
    if (historyPanel && historyPanel.classList.contains('show')) {
        historyPanel.classList.remove('show');
    }
};
document.addEventListener('DOMContentLoaded', function() {
    document.addEventListener('click', function(e) {
        const historyPanel = document.getElementById('historyPanel');
        const historyButton = document.querySelector('button[onclick="toggleHistory(event)"]');
        
        if (historyPanel && historyButton && 
            !historyPanel.contains(e.target) && 
            !historyButton.contains(e.target) && 
            historyPanel.classList.contains('show')) {
            historyPanel.classList.remove('show');
        }
    });
});
function clearLocalStorage() {
    let modal = document.getElementById('messageBoxModal');
    if (modal) {
        document.body.removeChild(modal);
    }
    modal = document.createElement('div');
    modal.id = 'messageBoxModal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-40';

    modal.innerHTML = `
        <div class="bg-[#191919] rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto relative">
            <button id="closeBoxModal" class="absolute top-4 right-4 text-gray-400 hover:text-white text-xl">&times;</button>
            
            <h3 class="text-xl font-bold text-red-500 mb-4">警告</h3>
            
            <div class="mb-0">
                <div class="text-sm font-medium text-gray-300">确定要清除页面缓存吗？</div>
                <div class="text-sm font-medium text-gray-300 mb-4">此功能会删除你的观看记录和自定义 API 接口，<scan class="text-red-500 font-bold">此操作不可恢复！</scan></div>
                <div class="flex justify-end space-x-2">
                    <button id="confirmBoxModal" class="ml-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-1 rounded">确定</button>
                    <button id="cancelBoxModal" class="ml-2 bg-pink-600 hover:bg-pink-700 text-white px-4 py-1 rounded">取消</button>
                </div>
            </div>
        </div>`;
    document.body.appendChild(modal);
    document.getElementById('closeBoxModal').addEventListener('click', function () {
        document.body.removeChild(modal);
    });
    document.getElementById('confirmBoxModal').addEventListener('click', function () {
        localStorage.clear();
        modal.innerHTML = `
            <div class="bg-[#191919] rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto relative">
                <button id="closeBoxModal" class="absolute top-4 right-4 text-gray-400 hover:text-white text-xl">&times;</button>
                
                <h3 class="text-xl font-bold text-white mb-4">提示</h3>
                
                <div class="mb-4">
                    <div class="text-sm font-medium text-gray-300 mb-4">页面缓存已清除，3 秒后自动刷新本页面。</div>
                </div>
            </div>`;
        setTimeout(() => {
            window.location.reload();
        }, 3000);
    });
    document.getElementById('cancelBoxModal').addEventListener('click', function () {
        document.body.removeChild(modal);
    });
    modal.addEventListener('click', function (e) {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    });
}
function showImportBox(fun) {
    let modal = document.getElementById('showImportBoxModal');
    if (modal) {
        document.body.removeChild(modal);
    }
    modal = document.createElement('div');
    modal.id = 'showImportBoxModal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-40';

    modal.innerHTML = `
        <div class="bg-[#191919] rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto relative">
            <button id="closeBoxModal" class="absolute top-4 right-4 text-gray-400 hover:text-white text-xl">&times;</button>
            
            <div class="m-4">
                <div id="dropZone" class="w-full py-9 bg-[#111] rounded-2xl border border-gray-300 gap-3 grid border-dashed">
                    <div class="grid gap-1">
                        <svg class="mx-auto" width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <g id="File">
                                <path id="icon" d="M31.6497 10.6056L32.2476 10.0741L31.6497 10.6056ZM28.6559 7.23757L28.058 7.76907L28.058 7.76907L28.6559 7.23757ZM26.5356 5.29253L26.2079 6.02233L26.2079 6.02233L26.5356 5.29253ZM33.1161 12.5827L32.3683 12.867V12.867L33.1161 12.5827ZM31.8692 33.5355L32.4349 34.1012L31.8692 33.5355ZM24.231 11.4836L25.0157 11.3276L24.231 11.4836ZM26.85 14.1026L26.694 14.8872L26.85 14.1026ZM11.667 20.8667C11.2252 20.8667 10.867 21.2248 10.867 21.6667C10.867 22.1085 11.2252 22.4667 11.667 22.4667V20.8667ZM25.0003 22.4667C25.4422 22.4667 25.8003 22.1085 25.8003 21.6667C25.8003 21.2248 25.4422 20.8667 25.0003 20.8667V22.4667ZM11.667 25.8667C11.2252 25.8667 10.867 26.2248 10.867 26.6667C10.867 27.1085 11.2252 27.4667 11.667 27.4667V25.8667ZM20.0003 27.4667C20.4422 27.4667 20.8003 27.1085 20.8003 26.6667C20.8003 26.2248 20.4422 25.8667 20.0003 25.8667V27.4667ZM23.3337 34.2H16.667V35.8H23.3337V34.2ZM7.46699 25V15H5.86699V25H7.46699ZM32.5337 15.0347V25H34.1337V15.0347H32.5337ZM16.667 5.8H23.6732V4.2H16.667V5.8ZM23.6732 5.8C25.2185 5.8 25.7493 5.81639 26.2079 6.02233L26.8633 4.56274C26.0191 4.18361 25.0759 4.2 23.6732 4.2V5.8ZM29.2539 6.70608C28.322 5.65771 27.7076 4.94187 26.8633 4.56274L26.2079 6.02233C26.6665 6.22826 27.0314 6.6141 28.058 7.76907L29.2539 6.70608ZM34.1337 15.0347C34.1337 13.8411 34.1458 13.0399 33.8638 12.2984L32.3683 12.867C32.5216 13.2702 32.5337 13.7221 32.5337 15.0347H34.1337ZM31.0518 11.1371C31.9238 12.1181 32.215 12.4639 32.3683 12.867L33.8638 12.2984C33.5819 11.5569 33.0406 10.9662 32.2476 10.0741L31.0518 11.1371ZM16.667 34.2C14.2874 34.2 12.5831 34.1983 11.2872 34.0241C10.0144 33.8529 9.25596 33.5287 8.69714 32.9698L7.56577 34.1012C8.47142 35.0069 9.62375 35.4148 11.074 35.6098C12.5013 35.8017 14.3326 35.8 16.667 35.8V34.2ZM5.86699 25C5.86699 27.3344 5.86529 29.1657 6.05718 30.593C6.25217 32.0432 6.66012 33.1956 7.56577 34.1012L8.69714 32.9698C8.13833 32.411 7.81405 31.6526 7.64292 30.3798C7.46869 29.0839 7.46699 27.3796 7.46699 25H5.86699ZM23.3337 35.8C25.6681 35.8 27.4993 35.8017 28.9266 35.6098C30.3769 35.4148 31.5292 35.0069 32.4349 34.1012L31.3035 32.9698C30.7447 33.5287 29.9863 33.8529 28.7134 34.0241C27.4175 34.1983 25.7133 34.2 23.3337 34.2V35.8ZM32.5337 25C32.5337 27.3796 32.532 29.0839 32.3577 30.3798C32.1866 31.6526 31.8623 32.411 31.3035 32.9698L32.4349 34.1012C33.3405 33.1956 33.7485 32.0432 33.9435 30.593C34.1354 29.1657 34.1337 27.3344 34.1337 25H32.5337ZM7.46699 15C7.46699 12.6204 7.46869 10.9161 7.64292 9.62024C7.81405 8.34738 8.13833 7.58897 8.69714 7.03015L7.56577 5.89878C6.66012 6.80443 6.25217 7.95676 6.05718 9.40704C5.86529 10.8343 5.86699 12.6656 5.86699 15H7.46699ZM16.667 4.2C14.3326 4.2 12.5013 4.1983 11.074 4.39019C9.62375 4.58518 8.47142 4.99313 7.56577 5.89878L8.69714 7.03015C9.25596 6.47133 10.0144 6.14706 11.2872 5.97592C12.5831 5.8017 14.2874 5.8 16.667 5.8V4.2ZM23.367 5V10H24.967V5H23.367ZM28.3337 14.9667H33.3337V13.3667H28.3337V14.9667ZM23.367 10C23.367 10.7361 23.3631 11.221 23.4464 11.6397L25.0157 11.3276C24.9709 11.1023 24.967 10.8128 24.967 10H23.367ZM28.3337 13.3667C27.5209 13.3667 27.2313 13.3628 27.0061 13.318L26.694 14.8872C27.1127 14.9705 27.5976 14.9667 28.3337 14.9667V13.3667ZM23.4464 11.6397C23.7726 13.2794 25.0543 14.5611 26.694 14.8872L27.0061 13.318C26.0011 13.1181 25.2156 12.3325 25.0157 11.3276L23.4464 11.6397ZM11.667 22.4667H25.0003V20.8667H11.667V22.4667ZM11.667 27.4667H20.0003V25.8667H11.667V27.4667ZM32.2476 10.0741L29.2539 6.70608L28.058 7.76907L31.0518 11.1371L32.2476 10.0741Z" fill="#DB2777" />
                            </g>
                        </svg>
                    </div>
                    <div class="grid gap-2">
                        <h4 class="text-center text-white-900 text-sm font-medium leading-snug">将配置文件拖到此处，或手动选择文件</h4>
                        <div class="flex items-center justify-center">
                            <label>
                                <input type="file" id="ChooseFile" hidden />
                                <div class="flex w-28 h-9 px-2 flex-col bg-pink-600 rounded-full shadow text-white text-xs font-semibold leading-4 items-center justify-center cursor-pointer focus:outline-none">选择文件</div>
                            </label>
                        </div>
                    </div>
                </div>
            </div>
        </div>`;
    document.body.appendChild(modal);
    document.getElementById('closeBoxModal').addEventListener('click', function () {
        document.body.removeChild(modal);
    });
    modal.addEventListener('click', function (e) {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    });
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('ChooseFile');

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('border-blue-500');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('border-blue-500');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        fun(e.dataTransfer.files[0]);
    });

    fileInput.addEventListener('change', (e) => {
        fun(fileInput.files[0]);
    });
}
