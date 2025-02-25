"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchViewProvider = void 0;
const vscode = __importStar(require("vscode"));
const searchService_1 = require("../services/searchService");
class SearchViewProvider {
    constructor(_extensionUri) {
        this._extensionUri = _extensionUri;
    }
    resolveWebviewView(webviewView, context, _token) {
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [
                this._extensionUri
            ]
        };
        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
        // 处理来自 WebView 的消息
        webviewView.webview.onDidReceiveMessage(async (data) => {
            switch (data.type) {
                case 'search':
                    const searchService = searchService_1.SearchService.getInstance();
                    const results = await searchService.search(data.category, data.searchTerm);
                    webviewView.webview.postMessage({ type: 'searchResults', results });
                    break;
                case 'openLocation':
                    if (data.location) {
                        const location = data.location;
                        const document = await vscode.workspace.openTextDocument(location.uri);
                        const editor = await vscode.window.showTextDocument(document);
                        const range = new vscode.Range(location.range.start.line, location.range.start.character, location.range.end.line, location.range.end.character);
                        editor.revealRange(range, vscode.TextEditorRevealType.InCenter);
                        editor.selection = new vscode.Selection(range.start, range.end);
                    }
                    break;
            }
        });
    }
    _getHtmlForWebview(webview) {
        return `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Enhanced Code Search</title>
                <style>
                    body {
                        padding: 10px;
                        font-family: var(--vscode-font-family);
                        color: var(--vscode-foreground);
                    }
                    .search-container {
                        margin-bottom: 10px;
                    }
                    .search-input {
                        width: 100%;
                        padding: 8px;
                        margin-bottom: 10px;
                        background: var(--vscode-input-background);
                        color: var(--vscode-input-foreground);
                        border: 1px solid var(--vscode-input-border);
                        border-radius: 2px;
                    }
                    .search-input:focus {
                        outline: 1px solid var(--vscode-focusBorder);
                        border-color: var(--vscode-focusBorder);
                    }
                    .category-buttons {
                        display: flex;
                        gap: 5px;
                        flex-wrap: wrap;
                        margin-bottom: 10px;
                    }
                    .category-button {
                        padding: 5px 10px;
                        cursor: pointer;
                        border: none;
                        background: var(--vscode-button-background);
                        color: var(--vscode-button-foreground);
                        border-radius: 2px;
                    }
                    .category-button:hover {
                        background: var(--vscode-button-hoverBackground);
                    }
                    .category-button.active {
                        background: var(--vscode-button-hoverBackground);
                    }
                    .results-container {
                        margin-top: 10px;
                    }
                    .result-item {
                        padding: 8px;
                        margin-bottom: 5px;
                        cursor: pointer;
                        border-radius: 2px;
                    }
                    .result-item:hover {
                        background: var(--vscode-list-hoverBackground);
                    }
                    .result-name {
                        font-weight: bold;
                        margin-bottom: 4px;
                    }
                    .result-description {
                        font-size: 0.9em;
                        opacity: 0.8;
                    }
                    .loading {
                        text-align: center;
                        padding: 20px;
                        color: var(--vscode-descriptionForeground);
                    }
                    .loading-spinner {
                        width: 24px;
                        height: 24px;
                        border: 3px solid var(--vscode-button-background);
                        border-top: 3px solid transparent;
                        border-radius: 50%;
                        animation: spin 1s linear infinite;
                        margin: 0 auto 10px;
                    }
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                </style>
            </head>
            <body>
                <div class="search-container">
                    <input type="text" class="search-input" placeholder="输入搜索关键词...">
                    <div class="category-buttons">
                        <button class="category-button active" data-category="class">类</button>
                        <button class="category-button" data-category="method">方法</button>
                        <button class="category-button" data-category="file">文件</button>
                        <button class="category-button" data-category="variable">变量</button>
                    </div>
                </div>
                <div class="results-container"></div>
                <script>
                    (function() {
                        const vscode = acquireVsCodeApi();
                        let currentCategory = 'class';
                        
                        // 搜索输入框
                        const searchInput = document.querySelector('.search-input');
                        let searchTimeout;
                        
                        function showLoading() {
                            const resultsContainer = document.querySelector('.results-container');
                            resultsContainer.innerHTML = \`
                                <div class="loading">
                                    <div class="loading-spinner"></div>
                                    <div>正在搜索中...</div>
                                </div>
                            \`;
                        }
                        
                        searchInput.addEventListener('input', () => {
                            clearTimeout(searchTimeout);
                            searchTimeout = setTimeout(() => {
                                const searchTerm = searchInput.value.trim();
                                if (searchTerm) {
                                    showLoading();
                                    vscode.postMessage({
                                        type: 'search',
                                        category: currentCategory,
                                        searchTerm
                                    });
                                }
                            }, 300);
                        });
                        
                        // 分类按钮
                        document.querySelectorAll('.category-button').forEach(button => {
                            button.addEventListener('click', () => {
                                document.querySelectorAll('.category-button').forEach(b => 
                                    b.classList.remove('active'));
                                button.classList.add('active');
                                currentCategory = button.dataset.category;
                                
                                const searchTerm = searchInput.value.trim();
                                if (searchTerm) {
                                    showLoading();
                                    vscode.postMessage({
                                        type: 'search',
                                        category: currentCategory,
                                        searchTerm
                                    });
                                }
                            });
                        });
                        
                        // 处理搜索结果
                        window.addEventListener('message', event => {
                            const message = event.data;
                            switch (message.type) {
                                case 'searchResults':
                                    const resultsContainer = document.querySelector('.results-container');
                                    if (message.results.length === 0) {
                                        resultsContainer.innerHTML = '<div class="loading">没有找到匹配的结果</div>';
                                        return;
                                    }
                                    
                                    resultsContainer.innerHTML = message.results.map(result => \`
                                        <div class="result-item" data-location='\${JSON.stringify(result.location)}'>
                                            <div class="result-name">\${result.name}</div>
                                            <div class="result-description">
                                                \${result.description || ''}
                                            </div>
                                        </div>
                                    \`).join('');
                                    
                                    // 添加点击事件
                                    document.querySelectorAll('.result-item').forEach(item => {
                                        item.addEventListener('click', () => {
                                            const location = JSON.parse(item.dataset.location);
                                            vscode.postMessage({
                                                type: 'openLocation',
                                                location
                                            });
                                        });
                                    });
                                    break;
                            }
                        });
                    }());
                </script>
            </body>
            </html>`;
    }
}
exports.SearchViewProvider = SearchViewProvider;
//# sourceMappingURL=searchViewProvider.js.map