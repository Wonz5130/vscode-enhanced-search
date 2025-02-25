import * as vscode from 'vscode';

export function getWebviewContent(webview: vscode.Webview, extensionUri: vscode.Uri): string {
    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>增强搜索</title>
        <style>
            body {
                padding: 0;
                margin: 0;
                color: var(--vscode-foreground);
                font-family: var(--vscode-font-family);
                background: var(--vscode-editor-background);
            }
            .search-container {
                display: flex;
                flex-direction: column;
                height: 100vh;
            }
            .header {
                background: var(--vscode-titleBar-activeBackground);
                padding: 10px 20px;
                border-bottom: 1px solid var(--vscode-panel-border);
                position: sticky;
                top: 0;
                z-index: 100;
            }
            .category-buttons {
                display: flex;
                justify-content: center;
                gap: 5px;
                margin-bottom: 15px;
            }
            .category-button {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 8px 16px;
                border: none;
                background: transparent;
                color: var(--vscode-foreground);
                cursor: pointer;
                border-radius: 4px;
                transition: all 0.2s;
                font-size: 13px;
            }
            .category-button:hover {
                background: var(--vscode-button-hoverBackground);
            }
            .category-button.active {
                background: var(--vscode-button-background);
                color: var(--vscode-button-foreground);
            }
            .category-button .icon {
                font-size: 16px;
            }
            .search-input-container {
                position: relative;
                margin: 0 20px;
            }
            .search-input {
                width: 100%;
                padding: 8px 12px;
                padding-left: 35px;
                background: var(--vscode-input-background);
                color: var(--vscode-input-foreground);
                border: 1px solid var(--vscode-input-border);
                border-radius: 4px;
                font-size: 14px;
                box-sizing: border-box;
            }
            .search-input:focus {
                outline: none;
                border-color: var(--vscode-focusBorder);
            }
            .search-icon {
                position: absolute;
                left: 10px;
                top: 50%;
                transform: translateY(-50%);
                color: var(--vscode-input-placeholderForeground);
                font-size: 16px;
            }
            .search-results {
                flex: 1;
                overflow-y: auto;
                padding: 20px;
            }
            .result-item {
                padding: 15px;
                background: var(--vscode-editor-background);
                border: 1px solid var(--vscode-panel-border);
                margin-bottom: 12px;
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.2s;
                position: relative;
                display: grid;
                gap: 8px;
            }
            .result-item:hover {
                background: var(--vscode-list-hoverBackground);
                border-color: var(--vscode-focusBorder);
                transform: translateX(4px);
            }
            .result-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .result-type {
                font-size: 12px;
                color: var(--vscode-textPreformat-foreground);
                display: flex;
                align-items: center;
                gap: 6px;
                padding: 4px 8px;
                background: var(--vscode-badge-background);
                border-radius: 4px;
                position: absolute;
                right: 15px;
                top: 15px;
            }
            .result-name {
                font-weight: 600;
                font-size: 14px;
                color: var(--vscode-symbolIcon-classForeground);
                display: flex;
                align-items: center;
                gap: 8px;
            }
            .result-name .icon {
                font-size: 16px;
                opacity: 0.8;
            }
            .result-description {
                font-size: 13px;
                color: var(--vscode-descriptionForeground);
                white-space: pre-line;
                line-height: 1.4;
                margin-top: 4px;
            }
            .result-meta {
                display: flex;
                gap: 16px;
                font-size: 12px;
                color: var(--vscode-textPreformat-foreground);
                margin-top: 8px;
                padding-top: 8px;
                border-top: 1px solid var(--vscode-panel-border);
            }
            .result-meta-item {
                display: flex;
                align-items: center;
                gap: 4px;
            }
            .result-meta-item .icon {
                font-size: 12px;
                opacity: 0.8;
            }
            .no-results {
                text-align: center;
                color: var(--vscode-descriptionForeground);
                padding: 40px;
                font-size: 14px;
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 12px;
            }
            .no-results .icon {
                font-size: 32px;
                opacity: 0.6;
            }
            .loading {
                text-align: center;
                color: var(--vscode-descriptionForeground);
                padding: 40px;
                font-size: 14px;
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 16px;
            }
            .loading-spinner {
                width: 24px;
                height: 24px;
                border: 3px solid var(--vscode-button-background);
                border-top: 3px solid transparent;
                border-radius: 50%;
                animation: spin 1s linear infinite;
            }
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        </style>
    </head>
    <body>
        <div class="search-container">
            <div class="header">
                <div class="category-buttons">
                    <button class="category-button active" data-category="all">
                        <span class="icon">🔍</span>
                        <span>全部</span>
                    </button>
                    <button class="category-button" data-category="class">
                        <span class="icon">📦</span>
                        <span>类</span>
                    </button>
                    <button class="category-button" data-category="file">
                        <span class="icon">📄</span>
                        <span>文件</span>
                    </button>
                    <button class="category-button" data-category="method">
                        <span class="icon">🔧</span>
                        <span>方法</span>
                    </button>
                    <button class="category-button" data-category="variable">
                        <span class="icon">📌</span>
                        <span>变量</span>
                    </button>
                </div>
                <div class="search-input-container">
                    <span class="search-icon">🔍</span>
                    <input type="text" class="search-input" placeholder="输入搜索关键词..." />
                </div>
            </div>
            <div class="search-results"></div>
        </div>
        <script>
            (function() {
                const vscode = acquireVsCodeApi();
                let currentCategory = 'all';
                
                // 类别按钮点击事件
                document.querySelectorAll('.category-button').forEach(button => {
                    button.addEventListener('click', () => {
                        document.querySelector('.category-button.active').classList.remove('active');
                        button.classList.add('active');
                        currentCategory = button.dataset.category;
                        const searchTerm = document.querySelector('.search-input').value.trim();
                        if (searchTerm) {
                            showLoading();
                            performSearch(searchTerm);
                        }
                    });
                });

                // 搜索输入事件
                const searchInput = document.querySelector('.search-input');
                let searchTimeout;
                searchInput.addEventListener('input', () => {
                    clearTimeout(searchTimeout);
                    searchTimeout = setTimeout(() => {
                        const searchTerm = searchInput.value.trim();
                        if (searchTerm) {
                            showLoading();
                            performSearch(searchTerm);
                        } else {
                            clearResults();
                        }
                    }, 300);
                });

                // 显示加载状态
                function showLoading() {
                    const resultsContainer = document.querySelector('.search-results');
                    resultsContainer.innerHTML = \`
                        <div class="loading">
                            <div class="loading-spinner"></div>
                            <div>正在搜索中...</div>
                        </div>
                    \`;
                }

                // 执行搜索
                function performSearch(searchTerm) {
                    vscode.postMessage({
                        command: 'search',
                        category: currentCategory,
                        searchTerm: searchTerm
                    });
                }

                // 清除搜索结果
                function clearResults() {
                    const resultsContainer = document.querySelector('.search-results');
                    resultsContainer.innerHTML = '';
                }

                // 显示搜索结果
                window.addEventListener('message', event => {
                    const message = event.data;
                    switch (message.command) {
                        case 'showResults':
                            const resultsContainer = document.querySelector('.search-results');
                            resultsContainer.innerHTML = '';

                            if (message.results.length === 0) {
                                resultsContainer.innerHTML = '<div class="no-results">未找到匹配结果</div>';
                                return;
                            }

                            message.results.forEach(result => {
                                const resultElement = document.createElement('div');
                                resultElement.className = 'result-item';
                                resultElement.innerHTML = \`
                                    <div class="result-type">
                                        <span class="icon">\${getTypeEmoji(result.type)}</span>
                                        <span>\${getTypeText(result.type)}</span>
                                    </div>
                                    <div class="result-name">\${result.name}</div>
                                    <div class="result-description">\${result.description || ''}</div>
                                \`;

                                resultElement.addEventListener('click', () => {
                                    vscode.postMessage({
                                        command: 'openLocation',
                                        location: result.location
                                    });
                                });

                                resultsContainer.appendChild(resultElement);
                            });
                            break;
                    }
                });

                // 获取类型对应的表情符号
                function getTypeEmoji(type) {
                    const emojiMap = {
                        'class': '📦',
                        'method': '🔧',
                        'file': '📄',
                        // 'api': '🔗',
                        'variable': '📌'
                    };
                    return emojiMap[type] || '🔍';
                }

                // 获取类型对应的文本
                function getTypeText(type) {
                    const textMap = {
                        'class': '类',
                        'method': '方法',
                        'file': '文件',
                        // 'api': 'API',
                        'variable': '变量'
                    };
                    return textMap[type] || '全部';
                }
            }());
        </script>
    </body>
    </html>`;
}
