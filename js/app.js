
let selectedAPIs = JSON.parse(localStorage.getItem('selectedAPIs') || '["tyyszy", "bfzy", "ruyi"]');
let customAPIs = JSON.parse(localStorage.getItem('customAPIs') || '[]');

let currentEpisodeIndex = 0;
let currentEpisodes = [];
let currentVideoTitle = '';
let episodesReversed = false;

document.addEventListener('DOMContentLoaded', function() {
   
    initAPICheckboxes();
    
   
    renderCustomAPIsList();
    
   
    updateSelectedApiCount();
    
   
    renderSearchHistory();
    
   
    if (!localStorage.getItem('hasInitializedDefaults')) {
       
        selectedAPIs = ["tyyszy", "bfzy", "ruyi"];
        localStorage.setItem('selectedAPIs', JSON.stringify(selectedAPIs));
        
       
        localStorage.setItem('yellowFilterEnabled', 'true');
        localStorage.setItem(PLAYER_CONFIG.adFilteringStorage, 'true');
        
       
        localStorage.setItem('doubanEnabled', 'true');

       
        localStorage.setItem('hasInitializedDefaults', 'true');
    }
    
   
    const yellowFilterToggle = document.getElementById('yellowFilterToggle');
    if (yellowFilterToggle) {
        yellowFilterToggle.checked = localStorage.getItem('yellowFilterEnabled') === 'true';
    }
    
   
    const adFilterToggle = document.getElementById('adFilterToggle');
    if (adFilterToggle) {
        adFilterToggle.checked = localStorage.getItem(PLAYER_CONFIG.adFilteringStorage) !== 'false';
    }
    
   
    setupEventListeners();
    
   
    setTimeout(checkAdultAPIsSelected, 100);
});

function initAPICheckboxes() {
    const container = document.getElementById('apiCheckboxes');
    container.innerHTML = '';

   
    const normaldiv = document.createElement('div');
    normaldiv.id = 'normaldiv';
    normaldiv.className = 'grid grid-cols-2 gap-2';
    const normalTitle = document.createElement('div');
    normalTitle.className = 'api-group-title';
    normalTitle.textContent = '普通资源';
    normaldiv.appendChild(normalTitle);
    
   
    Object.keys(API_SITES).forEach(apiKey => {
        const api = API_SITES[apiKey];
        if (api.adult) return;
        
        const checked = selectedAPIs.includes(apiKey);
        
        const checkbox = document.createElement('div');
        checkbox.className = 'flex items-center';
        checkbox.innerHTML = `
            <input type="checkbox" id="api_${apiKey}" 
                   class="form-checkbox h-3 w-3 text-blue-600 bg-[#222] border border-[#333]" 
                   ${checked ? 'checked' : ''} 
                   data-api="${apiKey}">
            <label for="api_${apiKey}" class="ml-1 text-xs text-gray-400 truncate">${api.name}</label>
        `;
        normaldiv.appendChild(checkbox);
        
       
        checkbox.querySelector('input').addEventListener('change', function() {
            updateSelectedAPIs();
            checkAdultAPIsSelected();
        });
    });
    container.appendChild(normaldiv);

   
    addAdultAPI();

   
    checkAdultAPIsSelected();
}

function addAdultAPI() {
   
    if (!HIDE_BUILTIN_ADULT_APIS && (localStorage.getItem('yellowFilterEnabled') === 'false')) {
        const container = document.getElementById('apiCheckboxes');

       
        const adultdiv = document.createElement('div');
        adultdiv.id = 'adultdiv';
        adultdiv.className = 'grid grid-cols-2 gap-2';
        const adultTitle = document.createElement('div');
        adultTitle.className = 'api-group-title adult';
        adultTitle.innerHTML = `黄色资源采集站 <span class="adult-warning">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
        </span>`;
        adultdiv.appendChild(adultTitle);
        
       
        Object.keys(API_SITES).forEach(apiKey => {
            const api = API_SITES[apiKey];
            if (!api.adult) return;
            
            const checked = selectedAPIs.includes(apiKey);
            
            const checkbox = document.createElement('div');
            checkbox.className = 'flex items-center';
            checkbox.innerHTML = `
                <input type="checkbox" id="api_${apiKey}" 
                       class="form-checkbox h-3 w-3 text-blue-600 bg-[#222] border border-[#333] api-adult" 
                       ${checked ? 'checked' : ''} 
                       data-api="${apiKey}">
                <label for="api_${apiKey}" class="ml-1 text-xs text-pink-400 truncate">${api.name}</label>
            `;
            adultdiv.appendChild(checkbox);
            
           
            checkbox.querySelector('input').addEventListener('change', function() {
                updateSelectedAPIs();
                checkAdultAPIsSelected();
            });
        });
        container.appendChild(adultdiv);
    }
}

function checkAdultAPIsSelected() {
   
    const adultBuiltinCheckboxes = document.querySelectorAll('#apiCheckboxes .api-adult:checked');
    
   
    const customApiCheckboxes = document.querySelectorAll('#customApisList .api-adult:checked');
    
    const hasAdultSelected = adultBuiltinCheckboxes.length > 0 || customApiCheckboxes.length > 0;
    
    const yellowFilterToggle = document.getElementById('yellowFilterToggle');
    const yellowFilterContainer = yellowFilterToggle.closest('div').parentNode;
    const filterDescription = yellowFilterContainer.querySelector('p.filter-description');
    
   
    if (hasAdultSelected) {
        yellowFilterToggle.checked = false;
        yellowFilterToggle.disabled = true;
        localStorage.setItem('yellowFilterEnabled', 'false');
        
       
        yellowFilterContainer.classList.add('filter-disabled');
        
       
        if (filterDescription) {
            filterDescription.innerHTML = '<strong class="text-pink-300">选中黄色资源站时无法启用此过滤</strong>';
        }
        
       
        const existingTooltip = yellowFilterContainer.querySelector('.filter-tooltip');
        if (existingTooltip) {
            existingTooltip.remove();
        }
    } else {
       
        yellowFilterToggle.disabled = false;
        yellowFilterContainer.classList.remove('filter-disabled');
        
       
        if (filterDescription) {
            filterDescription.innerHTML = '过滤"伦理片"等黄色内容';
        }
        
       
        const existingTooltip = yellowFilterContainer.querySelector('.filter-tooltip');
        if (existingTooltip) {
            existingTooltip.remove();
        }
    }
}

function renderCustomAPIsList() {
    const container = document.getElementById('customApisList');
    if (!container) return;
    
    if (customAPIs.length === 0) {
        container.innerHTML = '<p class="text-xs text-gray-500 text-center my-2">未添加自定义API</p>';
        return;
    }
    
    container.innerHTML = '';
    customAPIs.forEach((api, index) => {
        const apiItem = document.createElement('div');
        apiItem.className = 'flex items-center justify-between p-1 mb-1 bg-[#222] rounded';
        
       
        const textColorClass = api.isAdult ? 'text-pink-400' : 'text-white';
        
       
        const adultTag = api.isAdult ? '<span class="text-xs text-pink-400 mr-1">(18+)</span>' : '';
        
        apiItem.innerHTML = `
            <div class="flex items-center flex-1 min-w-0">
                <input type="checkbox" id="custom_api_${index}" 
                       class="form-checkbox h-3 w-3 text-blue-600 mr-1 ${api.isAdult ? 'api-adult' : ''}" 
                       ${selectedAPIs.includes('custom_' + index) ? 'checked' : ''} 
                       data-custom-index="${index}">
                <div class="flex-1 min-w-0">
                    <div class="text-xs font-medium ${textColorClass} truncate">
                        ${adultTag}${api.name}
                    </div>
                    <div class="text-xs text-gray-500 truncate">${api.url}</div>
                </div>
            </div>
            <div class="flex items-center">
                <button class="text-blue-500 hover:text-blue-700 text-xs px-1" onclick="editCustomApi(${index})">✎</button>
                <button class="text-red-500 hover:text-red-700 text-xs px-1" onclick="removeCustomApi(${index})">✕</button>
            </div>
        `;
        container.appendChild(apiItem);
        
       
        apiItem.querySelector('input').addEventListener('change', function() {
            updateSelectedAPIs();
            checkAdultAPIsSelected();
        });
    });
}

function editCustomApi(index) {
    if (index < 0 || index >= customAPIs.length) return;
    
    const api = customAPIs[index];
    
   
    const nameInput = document.getElementById('customApiName');
    const urlInput = document.getElementById('customApiUrl');
    const isAdultInput = document.getElementById('customApiIsAdult');
    
    nameInput.value = api.name;
    urlInput.value = api.url;
    if (isAdultInput) isAdultInput.checked = api.isAdult || false;
    
   
    const form = document.getElementById('addCustomApiForm');
    if (form) {
        form.classList.remove('hidden');
        
       
        const buttonContainer = form.querySelector('div:last-child');
        buttonContainer.innerHTML = `
            <button onclick="updateCustomApi(${index})" class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs">更新</button>
            <button onclick="cancelEditCustomApi()" class="bg-[#444] hover:bg-[#555] text-white px-3 py-1 rounded text-xs">取消</button>
        `;
    }
}

function updateCustomApi(index) {
    if (index < 0 || index >= customAPIs.length) return;
    
    const nameInput = document.getElementById('customApiName');
    const urlInput = document.getElementById('customApiUrl');
    const isAdultInput = document.getElementById('customApiIsAdult');
    
    const name = nameInput.value.trim();
    let url = urlInput.value.trim();
    const isAdult = isAdultInput ? isAdultInput.checked : false;
    
    if (!name || !url) {
        showToast('请输入API名称和链接', 'warning');
        return;
    }
    
   
    if (!/^https?:\/\/.+/.test(url)) {
        showToast('API链接格式不正确，需以http://或https://开头', 'warning');
        return;
    }
    
   
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    
   
    customAPIs[index] = { name, url, isAdult };
    localStorage.setItem('customAPIs', JSON.stringify(customAPIs));
    
   
    renderCustomAPIsList();
    
   
    checkAdultAPIsSelected();
    
   
    restoreAddCustomApiButtons();
    
   
    nameInput.value = '';
    urlInput.value = '';
    if (isAdultInput) isAdultInput.checked = false;
    document.getElementById('addCustomApiForm').classList.add('hidden');
    
    showToast('已更新自定义API: ' + name, 'success');
}

function cancelEditCustomApi() {
   
    document.getElementById('customApiName').value = '';
    document.getElementById('customApiUrl').value = '';
    const isAdultInput = document.getElementById('customApiIsAdult');
    if (isAdultInput) isAdultInput.checked = false;
    
   
    document.getElementById('addCustomApiForm').classList.add('hidden');
    
   
    restoreAddCustomApiButtons();
}

function restoreAddCustomApiButtons() {
    const form = document.getElementById('addCustomApiForm');
    const buttonContainer = form.querySelector('div:last-child');
    buttonContainer.innerHTML = `
        <button onclick="addCustomApi()" class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs">添加</button>
        <button onclick="cancelAddCustomApi()" class="bg-[#444] hover:bg-[#555] text-white px-3 py-1 rounded text-xs">取消</button>
    `;
}

function updateSelectedAPIs() {
   
    const builtInApiCheckboxes = document.querySelectorAll('#apiCheckboxes input:checked');
    
   
    const builtInApis = Array.from(builtInApiCheckboxes).map(input => input.dataset.api);
    
   
    const customApiCheckboxes = document.querySelectorAll('#customApisList input:checked');
    const customApiIndices = Array.from(customApiCheckboxes).map(input => 'custom_' + input.dataset.customIndex);
    
   
    selectedAPIs = [...builtInApis, ...customApiIndices];
    
   
    localStorage.setItem('selectedAPIs', JSON.stringify(selectedAPIs));
    
   
    updateSelectedApiCount();
}

function updateSelectedApiCount() {
    const countEl = document.getElementById('selectedApiCount');
    if (countEl) {
        countEl.textContent = selectedAPIs.length;
    }
}

function selectAllAPIs(selectAll = true, excludeAdult = false) {
    const checkboxes = document.querySelectorAll('#apiCheckboxes input[type="checkbox"]');
    
    checkboxes.forEach(checkbox => {
        if (excludeAdult && checkbox.classList.contains('api-adult')) {
            checkbox.checked = false;
        } else {
            checkbox.checked = selectAll;
        }
    });
    
    updateSelectedAPIs();
    checkAdultAPIsSelected();
}

function showAddCustomApiForm() {
    const form = document.getElementById('addCustomApiForm');
    if (form) {
        form.classList.remove('hidden');
    }
}

function cancelAddCustomApi() {
    const form = document.getElementById('addCustomApiForm');
    if (form) {
        form.classList.add('hidden');
        document.getElementById('customApiName').value = '';
        document.getElementById('customApiUrl').value = '';
        const isAdultInput = document.getElementById('customApiIsAdult');
        if (isAdultInput) isAdultInput.checked = false;
        
       
        restoreAddCustomApiButtons();
    }
}

function addCustomApi() {
    const nameInput = document.getElementById('customApiName');
    const urlInput = document.getElementById('customApiUrl');
    const isAdultInput = document.getElementById('customApiIsAdult');
    
    const name = nameInput.value.trim();
    let url = urlInput.value.trim();
    const isAdult = isAdultInput ? isAdultInput.checked : false;
    
    if (!name || !url) {
        showToast('请输入API名称和链接', 'warning');
        return;
    }
    
   
    if (!/^https?:\/\/.+/.test(url)) {
        showToast('API链接格式不正确，需以http://或https://开头', 'warning');
        return;
    }
    
   
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    
   
    customAPIs.push({ name, url, isAdult });
    localStorage.setItem('customAPIs', JSON.stringify(customAPIs));
    
   
    const newApiIndex = customAPIs.length - 1;
    selectedAPIs.push('custom_' + newApiIndex);
    localStorage.setItem('selectedAPIs', JSON.stringify(selectedAPIs));
    
   
    renderCustomAPIsList();
    
   
    updateSelectedApiCount();
    
   
    checkAdultAPIsSelected();
    
   
    nameInput.value = '';
    urlInput.value = '';
    if (isAdultInput) isAdultInput.checked = false;
    document.getElementById('addCustomApiForm').classList.add('hidden');
    
    showToast('已添加自定义API: ' + name, 'success');
}

function removeCustomApi(index) {
    if (index < 0 || index >= customAPIs.length) return;
    
    const apiName = customAPIs[index].name;
    
   
    customAPIs.splice(index, 1);
    localStorage.setItem('customAPIs', JSON.stringify(customAPIs));
    
   
    const customApiId = 'custom_' + index;
    selectedAPIs = selectedAPIs.filter(id => id !== customApiId);
    
   
    selectedAPIs = selectedAPIs.map(id => {
        if (id.startsWith('custom_')) {
            const currentIndex = parseInt(id.replace('custom_', ''));
            if (currentIndex > index) {
                return 'custom_' + (currentIndex - 1);
            }
        }
        return id;
    });
    
    localStorage.setItem('selectedAPIs', JSON.stringify(selectedAPIs));
    
   
    renderCustomAPIsList();
    
   
    updateSelectedApiCount();
    
   
    checkAdultAPIsSelected();
    
    showToast('已移除自定义API: ' + apiName, 'info');
}

function setupEventListeners() {
   
    document.getElementById('searchInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            search();
        }
    });

   
    document.addEventListener('click', function(e) {
        const panel = document.getElementById('settingsPanel');
        const settingsButton = document.querySelector('button[onclick="toggleSettings(event)"]');
        
        if (!panel.contains(e.target) && !settingsButton.contains(e.target) && panel.classList.contains('show')) {
            panel.classList.remove('show');
        }
    });
    
   
    const yellowFilterToggle = document.getElementById('yellowFilterToggle');
    if (yellowFilterToggle) {
        yellowFilterToggle.addEventListener('change', function(e) {
            localStorage.setItem('yellowFilterEnabled', e.target.checked);

           
            const adultdiv = document.getElementById('adultdiv');
            if (adultdiv) {
                if (e.target.checked === true) {
                    adultdiv.style.display = 'none';
                } else if (e.target.checked === false) {
                    adultdiv.style.display = ''
                }
            } else {
               
                addAdultAPI();
            }
        });
    }
    
   
    const adFilterToggle = document.getElementById('adFilterToggle');
    if (adFilterToggle) {
        adFilterToggle.addEventListener('change', function(e) {
            localStorage.setItem(PLAYER_CONFIG.adFilteringStorage, e.target.checked);
        });
    }
}

function resetSearchArea() {
   
    document.getElementById('results').innerHTML = '';
    document.getElementById('searchInput').value = '';
    
   
    document.getElementById('searchArea').classList.add('flex-1');
    document.getElementById('searchArea').classList.remove('mb-8');
    document.getElementById('resultsArea').classList.add('hidden');
    
   
    const footer = document.querySelector('.footer');
    if (footer) {
        footer.style.position = '';
    }
    
   
    if (typeof updateDoubanVisibility === 'function') {
        updateDoubanVisibility();
    }
}

function getCustomApiInfo(customApiIndex) {
    const index = parseInt(customApiIndex);
    if (isNaN(index) || index < 0 || index >= customAPIs.length) {
        return null;
    }
    return customAPIs[index];
}

async function search() {
   
    if (window.isPasswordProtected && window.isPasswordVerified) {
        if (window.isPasswordProtected() && !window.isPasswordVerified()) {
            showPasswordModal && showPasswordModal();
            return;
        }
    }
    const query = document.getElementById('searchInput').value.trim();
    
    if (!query) {
        showToast('请输入搜索内容', 'info');
        return;
    }
    
    if (selectedAPIs.length === 0) {
        showToast('请至少选择一个API源', 'warning');
        return;
    }
    
    showLoading();
    
    try {
       
        saveSearchHistory(query);
        
       
        let allResults = [];
        const searchPromises = selectedAPIs.map(async (apiId) => {
            try {
                let apiUrl, apiName;
                
               
                if (apiId.startsWith('custom_')) {
                    const customIndex = apiId.replace('custom_', '');
                    const customApi = getCustomApiInfo(customIndex);
                    if (!customApi) return [];
                    
                    apiUrl = customApi.url + API_CONFIG.search.path + encodeURIComponent(query);
                    apiName = customApi.name;
                } else {
                   
                    if (!API_SITES[apiId]) return [];
                    apiUrl = API_SITES[apiId].api + API_CONFIG.search.path + encodeURIComponent(query);
                    apiName = API_SITES[apiId].name;
                }
                
               
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 8000);
                
                const response = await fetch(PROXY_URL + encodeURIComponent(apiUrl), {
                    headers: API_CONFIG.search.headers,
                    signal: controller.signal
                });
                
                clearTimeout(timeoutId);
                
                if (!response.ok) {
                    return [];
                }
                
                const data = await response.json();
                
                if (!data || !data.list || !Array.isArray(data.list) || data.list.length === 0) {
                    return [];
                }
                
               
                const results = data.list.map(item => ({
                    ...item,
                    source_name: apiName,
                    source_code: apiId,
                    api_url: apiId.startsWith('custom_') ? getCustomApiInfo(apiId.replace('custom_', ''))?.url : undefined
                }));
                
                return results;
            } catch (error) {
                console.warn(`API ${apiId} 搜索失败:`, error);
                return [];
            }
        });
        
       
        const resultsArray = await Promise.all(searchPromises);
        
       
        resultsArray.forEach(results => {
            if (Array.isArray(results) && results.length > 0) {
                allResults = allResults.concat(results);
            }
        });
        
       
        const searchResultsCount = document.getElementById('searchResultsCount');
        if (searchResultsCount) {
            searchResultsCount.textContent = allResults.length;
        }
        
       
        document.getElementById('searchArea').classList.remove('flex-1');
        document.getElementById('searchArea').classList.add('mb-8');
        document.getElementById('resultsArea').classList.remove('hidden');
        
       
        const doubanArea = document.getElementById('doubanArea');
        if (doubanArea) {
            doubanArea.classList.add('hidden');
        }
        
        const resultsDiv = document.getElementById('results');
        
       
        if (!allResults || allResults.length === 0) {
            resultsDiv.innerHTML = `
                <div class="col-span-full text-center py-16">
                    <svg class="mx-auto h-12 w-12 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 class="mt-2 text-lg font-medium text-gray-400">没有找到匹配的结果</h3>
                    <p class="mt-1 text-sm text-gray-500">请尝试其他关键词或更换数据源</p>
                </div>
            `;
            hideLoading();
            return;
        }

       
        const yellowFilterEnabled = localStorage.getItem('yellowFilterEnabled') === 'true';
        if (yellowFilterEnabled) {
            const banned = ['伦理片','福利','里番动漫','门事件','萝莉少女','制服诱惑','国产传媒','cosplay','黑丝诱惑','无码','日本无码','有码','日本有码','SWAG','网红主播', '色情片','同性片','福利视频','福利片'];
            allResults = allResults.filter(item => {
                const typeName = item.type_name || '';
                return !banned.some(keyword => typeName.includes(keyword));
            });
        }

       
        resultsDiv.innerHTML = allResults.map(item => {
            const safeId = item.vod_id ? item.vod_id.toString().replace(/[^\w-]/g, '') : '';
            const safeName = (item.vod_name || '').toString()
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;');
            const sourceInfo = item.source_name ? 
                `<span class="bg-[#222] text-xs px-1.5 py-0.5 rounded-full">${item.source_name}</span>` : '';
            const sourceCode = item.source_code || '';
            
           
            const apiUrlAttr = item.api_url ? 
                `data-api-url="${item.api_url.replace(/"/g, '&quot;')}"` : '';
            
           
            const hasCover = item.vod_pic && item.vod_pic.startsWith('http');
            
            return `
                <div class="card-hover bg-[#111] rounded-lg overflow-hidden cursor-pointer transition-all hover:scale-[1.02] h-full shadow-sm hover:shadow-md" 
                     onclick="showDetails('${safeId}','${safeName}','${sourceCode}')" ${apiUrlAttr}>
                    <div class="flex h-full">
                        ${hasCover ? `
                        <div class="relative flex-shrink-0 search-card-img-container">
                            <img src="${item.vod_pic}" alt="${safeName}" 
                                 class="h-full w-full object-cover transition-transform hover:scale-110" 
                                 onerror="this.onerror=null; this.src='https://via.placeholder.com/300x450?text=无封面'; this.classList.add('object-contain');" 
                                 loading="lazy">
                            <div class="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent"></div>
                        </div>` : ''}
                        
                        <div class="p-2 flex flex-col flex-grow">
                            <div class="flex-grow">
                                <h3 class="font-semibold mb-2 break-words line-clamp-2 ${hasCover ? '' : 'text-center'}" title="${safeName}">${safeName}</h3>
                                
                                <div class="flex flex-wrap ${hasCover ? '' : 'justify-center'} gap-1 mb-2">
                                    ${(item.type_name || '').toString().replace(/</g, '&lt;') ? 
                                      `<span class="text-xs py-0.5 px-1.5 rounded bg-opacity-20 bg-blue-500 text-blue-300">
                                          ${(item.type_name || '').toString().replace(/</g, '&lt;')}
                                      </span>` : ''}
                                    ${(item.vod_year || '') ? 
                                      `<span class="text-xs py-0.5 px-1.5 rounded bg-opacity-20 bg-purple-500 text-purple-300">
                                          ${item.vod_year}
                                      </span>` : ''}
                                </div>
                                <p class="text-gray-400 line-clamp-2 overflow-hidden ${hasCover ? '' : 'text-center'} mb-2">
                                    ${(item.vod_remarks || '暂无介绍').toString().replace(/</g, '&lt;')}
                                </p>
                            </div>
                            
                            <div class="flex justify-between items-center mt-1 pt-1 border-t border-gray-800">
                                ${sourceInfo ? `<div>${sourceInfo}</div>` : '<div></div>'}
                                <!-- 接口名称过长会被挤变形
                                <div>
                                    <span class="text-gray-500 flex items-center hover:text-blue-400 transition-colors">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                        </svg>
                                        播放
                                    </span>
                                </div>
                                -->
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('搜索错误:', error);
        if (error.name === 'AbortError') {
            showToast('搜索请求超时，请检查网络连接', 'error');
        } else {
            showToast('搜索请求失败，请稍后重试', 'error');
        }
    } finally {
        hideLoading();
    }
}

async function showDetails(id, vod_name, sourceCode) {
   
    if (window.isPasswordProtected && window.isPasswordVerified) {
        if (window.isPasswordProtected() && !window.isPasswordVerified()) {
            showPasswordModal && showPasswordModal();
            return;
        }
    }
    if (!id) {
        showToast('视频ID无效', 'error');
        return;
    }
    
    showLoading();
    try {
       
        let apiParams = '';
        
       
        if (sourceCode.startsWith('custom_')) {
            const customIndex = sourceCode.replace('custom_', '');
            const customApi = getCustomApiInfo(customIndex);
            if (!customApi) {
                showToast('自定义API配置无效', 'error');
                hideLoading();
                return;
            }
            
            apiParams = '&customApi=' + encodeURIComponent(customApi.url) + '&source=custom';
        } else {
           
            apiParams = '&source=' + sourceCode;
        }
        
        const response = await fetch('/api/detail?id=' + encodeURIComponent(id) + apiParams);
        
        const data = await response.json();
        
        const modal = document.getElementById('modal');
        const modalTitle = document.getElementById('modalTitle');
        const modalContent = document.getElementById('modalContent');
        
       
        const sourceName = data.videoInfo && data.videoInfo.source_name ? 
            ` <span class="text-sm font-normal text-gray-400">(${data.videoInfo.source_name})</span>` : '';
        
       
        modalTitle.innerHTML = `<span class="break-words">${vod_name || '未知视频'}</span>${sourceName}`;
        currentVideoTitle = vod_name || '未知视频';
        
        if (data.episodes && data.episodes.length > 0) {
           
            const safeEpisodes = data.episodes.map(url => {
                try {
                   
                    return url && (url.startsWith('http://') || url.startsWith('https://'))
                        ? url.replace(/"/g, '&quot;')
                        : '';
                } catch (e) {
                    return '';
                }
            }).filter(url => url);
            
           
            currentEpisodes = safeEpisodes;
            episodesReversed = false;
            modalContent.innerHTML = `
                <div class="flex justify-end mb-2">
                    <button onclick="toggleEpisodeOrder('${sourceCode}')" class="px-4 py-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform flex items-center justify-center space-x-2">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clip-rule="evenodd" />
                        </svg>
                        <span>倒序排列</span>
                    </button>
                </div>
                <div id="episodesGrid" class="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                    ${renderEpisodes(vod_name, sourceCode)}
                </div>
            `;
        } else {
            modalContent.innerHTML = '<p class="text-center text-gray-400 py-8">没有找到可播放的视频</p>';
        }
        
        modal.classList.remove('hidden');
    } catch (error) {
        console.error('获取详情错误:', error);
        showToast('获取详情失败，请稍后重试', 'error');
    } finally {
        hideLoading();
    }
}

function playVideo(url, vod_name, sourceCode, episodeIndex = 0) {
   
    if (window.isPasswordProtected && window.isPasswordVerified) {
        if (window.isPasswordProtected() && !window.isPasswordVerified()) {
            showPasswordModal && showPasswordModal();
            return;
        }
    }
    if (!url) {
        showToast('无效的视频链接', 'error');
        return;
    }
    
   
    let sourceName = '';
    const modalTitle = document.getElementById('modalTitle');
    if (modalTitle) {
        const sourceSpan = modalTitle.querySelector('span.text-gray-400');
        if (sourceSpan) {
           
            const sourceText = sourceSpan.textContent;
            const match = sourceText.match(/\(([^)]+)\)/);
            if (match && match[1]) {
                sourceName = match[1].trim();
            }
        }
    }
    
   
    const currentVideoTitle = vod_name;
    localStorage.setItem('currentVideoTitle', currentVideoTitle);
    localStorage.setItem('currentEpisodeIndex', episodeIndex);
    localStorage.setItem('currentEpisodes', JSON.stringify(currentEpisodes));
    localStorage.setItem('episodesReversed', episodesReversed);
    
   
    const videoTitle = vod_name || currentVideoTitle;
    const videoInfo = {
        title: videoTitle,
        url: url,
        episodeIndex: episodeIndex,
        sourceName: sourceName,
        timestamp: Date.now(),
       
        episodes: currentEpisodes && currentEpisodes.length > 0 ? [...currentEpisodes] : []
    };
    
   
    if (typeof addToViewingHistory === 'function') {
        addToViewingHistory(videoInfo);
    }
    
   
    const playerUrl = `player.html?url=${encodeURIComponent(url)}&title=${encodeURIComponent(videoTitle)}&index=${episodeIndex}&source=${encodeURIComponent(sourceName)}&source_code=${encodeURIComponent(sourceCode)}`;
    
   
    window.location.href = playerUrl;
}

function playPreviousEpisode(sourceCode) {
    if (currentEpisodeIndex > 0) {
        const prevIndex = currentEpisodeIndex - 1;
        const prevUrl = currentEpisodes[prevIndex];
        playVideo(prevUrl, currentVideoTitle, sourceCode, prevIndex);
    }
}

function playNextEpisode(sourceCode) {
    if (currentEpisodeIndex < currentEpisodes.length - 1) {
        const nextIndex = currentEpisodeIndex + 1;
        const nextUrl = currentEpisodes[nextIndex];
        playVideo(nextUrl, currentVideoTitle, sourceCode, nextIndex);
    }
}

function handlePlayerError() {
    hideLoading();
    showToast('视频播放加载失败，请尝试其他视频源', 'error');
}

function renderEpisodes(vodName, sourceCode) {
    const episodes = episodesReversed ? [...currentEpisodes].reverse() : currentEpisodes;
    return episodes.map((episode, index) => {
       
        const realIndex = episodesReversed ? currentEpisodes.length - 1 - index : index;
        return `
            <button id="episode-${realIndex}" onclick="playVideo('${episode}','${vodName.replace(/"/g, '&quot;')}', '${sourceCode}', ${realIndex})" 
                    class="px-4 py-2 bg-[#222] hover:bg-[#333] border border-[#333] rounded-lg transition-colors text-center episode-btn">
                第${realIndex + 1}集
            </button>
        `;
    }).join('');
}

function toggleEpisodeOrder(sourceCode) {
    episodesReversed = !episodesReversed;
   
    const episodesGrid = document.getElementById('episodesGrid');
    if (episodesGrid) {
        episodesGrid.innerHTML = renderEpisodes(currentVideoTitle, sourceCode);
    }
    
   
    const toggleBtn = document.querySelector(`button[onclick="toggleEpisodeOrder('${sourceCode}')"]`);
    if (toggleBtn) {
        toggleBtn.querySelector('span').textContent = episodesReversed ? '正序排列' : '倒序排列';
        const arrowIcon = toggleBtn.querySelector('svg');
        if (arrowIcon) {
            arrowIcon.style.transform = episodesReversed ? 'rotate(180deg)' : 'rotate(0deg)';
        }
    }
}

async function importConfig() {
    showImportBox(async (file) => {
        try {
           
            if (!(file.type === 'application/json' || file.name.endsWith('.json'))) throw '文件类型不正确';

           
            if(file.size > 1024 * 1024 * 10) throw new Error('文件大小超过 10MB');

           
            const content = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = () => reject('文件读取失败');
                reader.readAsText(file);
            });

           
            const config = JSON.parse(content);
            if (config.name !== 'TV233-Settings') throw '配置文件格式不正确';

           
            const dataHash = await sha256(JSON.stringify(config.data));
            if (dataHash !== config.hash) throw '配置文件哈希值不匹配';

           
            for (let item in config.data) {
                localStorage.setItem(item, config.data[item]);
            }
            
            showToast('配置文件导入成功，3 秒后自动刷新本页面。', 'success');
            setTimeout(() => {
                window.location.reload();
            }, 3000);
        } catch (error) {
            const message = typeof error === 'string' ? error : '配置文件格式错误';
            showToast(`配置文件读取出错 (${message})`, 'error');
        }
    });
}

async function exportConfig() {
   
    const config = {};

   
    const items = {};
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        items[key] = localStorage.getItem(key);
    }

    const times = Date.now().toString();
    config['name'] = 'TV233-Settings'; 
    config['time'] = times;              
    config['cfgVer'] = '1.0.0';          
    config['data'] = items;              
    config['hash'] = await sha256(JSON.stringify(config['data'])); 

   
    saveStringAsFile(JSON.stringify(config), 'TV233-Settings_' + times + '.json');
}

function saveStringAsFile(content, fileName) {
   
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
   
    const url = window.URL.createObjectURL(blob);
   
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
   
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

const authMiddleware = require('./middleware/auth');
const config = require('./config');

if (config.auth.enabled) {
  app.use(authMiddleware);
}

app.use('/api', authMiddleware);
