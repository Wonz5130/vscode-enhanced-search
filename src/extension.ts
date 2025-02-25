import * as vscode from 'vscode';
import { SearchPanel } from './webview/searchPanel';

export function activate(context: vscode.ExtensionContext) {
    // 创建侧边栏视图
    const provider = new SearchViewProvider(context.extensionUri);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider('enhanced-search-view', provider)
    );

    // 注册命令
    let openSearchPanelCommand = vscode.commands.registerCommand('enhanced-search.openSearchPanel', () => {
        SearchPanel.createOrShow(context.extensionUri);
    });

    context.subscriptions.push(openSearchPanelCommand);

    // 注册类搜索命令
    let searchClass = vscode.commands.registerCommand('enhanced-search.searchClass', () => {
        const panel = SearchPanel.createOrShow(context.extensionUri);
        panel.postMessage({ command: 'selectCategory', category: 'class' });
    });

    // 注册方法搜索命令
    let searchMethod = vscode.commands.registerCommand('enhanced-search.searchMethod', () => {
        const panel = SearchPanel.createOrShow(context.extensionUri);
        if (panel) {
            panel.postMessage({ command: 'selectCategory', category: 'method' });
        }
    });

    // 注册文件搜索命令
    let searchFile = vscode.commands.registerCommand('enhanced-search.searchFile', () => {
        const panel = SearchPanel.createOrShow(context.extensionUri);
        if (panel) {
            panel.postMessage({ command: 'selectCategory', category: 'file' });
        }
    });

    // 注册全局变量搜索命令
    let searchGlobalVar = vscode.commands.registerCommand('enhanced-search.searchGlobalVar', () => {
        const panel = SearchPanel.createOrShow(context.extensionUri);
        if (panel) {
            panel.postMessage({ command: 'selectCategory', category: 'globalVar' });
        }
    });

    context.subscriptions.push(
        searchClass,
        searchMethod,
        searchFile,
        searchGlobalVar
    );

    // 注册侧边栏视图容器激活事件
    // context.subscriptions.push(
    //     vscode.window.onDidChangeActiveTextEditor(() => {
    //         // 当侧边栏图标被点击时，模拟按下快捷键
    //         if (vscode.window.activeTextEditor === undefined) {
    //             vscode.commands.executeCommand('workbench.action.toggleSidebarVisibility')
    //                 .then(() => {
    //                     // 延迟一点执行，确保侧边栏已经关闭
    //                     setTimeout(() => {
    //                         vscode.commands.executeCommand('enhanced-search.openSearchPanel');
    //                     }, 100);
    //                 });
    //         }
    //     })
    // );
}

// 创建侧边栏视图提供者
class SearchViewProvider implements vscode.WebviewViewProvider {
    constructor(private readonly _extensionUri: vscode.Uri) {}

    resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ) {
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri]
        };

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

        // 处理侧边栏视图中的消息
        webviewView.webview.onDidReceiveMessage(message => {
            switch (message.command) {
                case 'openSearchPanel':
                    vscode.commands.executeCommand('enhanced-search.openSearchPanel');
                    break;
            }
        });
    }

    private _getHtmlForWebview(webview: vscode.Webview) {
        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src ${webview.cspSource} 'unsafe-inline';">
                <title>Enhanced Search</title>
                <style>
                    body {
                        padding: 10px;
                        color: var(--vscode-foreground);
                        font-family: var(--vscode-font-family);
                    }
                    button {
                        width: 100%;
                        padding: 8px;
                        background: var(--vscode-button-background);
                        color: var(--vscode-button-foreground);
                        border: none;
                        border-radius: 2px;
                        cursor: pointer;
                    }
                    button:hover {
                        background: var(--vscode-button-hoverBackground);
                    }
                </style>
            </head>
            <body>
                <div>
                    <button id="searchButton">打开搜索面板</button>
                </div>
                <script>
                    (function() {
                        const vscode = acquireVsCodeApi();
                        document.getElementById('searchButton').addEventListener('click', () => {
                            vscode.postMessage({ command: 'openSearchPanel' });
                        });
                    })();
                </script>
            </body>
            </html>
        `;
    }
}

export function deactivate() {}
