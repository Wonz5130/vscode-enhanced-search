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
exports.SearchPanel = void 0;
const vscode = __importStar(require("vscode"));
const searchPanelContent_1 = require("./searchPanelContent");
const searchService_1 = require("../services/searchService");
class SearchPanel {
    constructor(panel, extensionUri) {
        this._disposables = [];
        this._panel = panel;
        this._searchService = searchService_1.SearchService.getInstance();
        this._panel.webview.html = (0, searchPanelContent_1.getWebviewContent)(this._panel.webview, extensionUri);
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
        // 处理来自 WebView 的消息
        this._panel.webview.onDidReceiveMessage(async (message) => {
            switch (message.command) {
                case 'search':
                    await this.handleSearch(message.category, message.searchTerm);
                    break;
                case 'openLocation':
                    await this.openLocation(message.location);
                    break;
            }
        }, null, this._disposables);
    }
    static createOrShow(extensionUri) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;
        if (SearchPanel.currentPanel) {
            SearchPanel.currentPanel._panel.reveal(column);
            return SearchPanel.currentPanel;
        }
        const panel = vscode.window.createWebviewPanel('enhancedSearch', '增强搜索', column || vscode.ViewColumn.One, {
            enableScripts: true,
            localResourceRoots: [
                vscode.Uri.joinPath(extensionUri, 'media')
            ]
        });
        SearchPanel.currentPanel = new SearchPanel(panel, extensionUri);
        return SearchPanel.currentPanel;
    }
    async handleSearch(category, searchTerm) {
        try {
            const results = await this._searchService.search(category, searchTerm);
            await this.displayResults(results);
        }
        catch (error) {
            vscode.window.showErrorMessage(`搜索出错: ${error}`);
        }
    }
    async displayResults(results) {
        // 发送结果到 WebView
        await this._panel.webview.postMessage({
            command: 'showResults',
            results: results.map(result => ({
                type: result.type,
                name: result.name,
                description: result.description,
                location: {
                    uri: result.location.uri.toString(),
                    range: {
                        start: {
                            line: result.location.range.start.line,
                            character: result.location.range.start.character
                        },
                        end: {
                            line: result.location.range.end.line,
                            character: result.location.range.end.character
                        }
                    }
                }
            }))
        });
    }
    async openLocation(location) {
        try {
            const uri = vscode.Uri.parse(location.uri);
            const range = new vscode.Range(new vscode.Position(location.range.start.line, location.range.start.character), new vscode.Position(location.range.end.line, location.range.end.character));
            const document = await vscode.workspace.openTextDocument(uri);
            const editor = await vscode.window.showTextDocument(document);
            editor.revealRange(range, vscode.TextEditorRevealType.InCenter);
            editor.selection = new vscode.Selection(range.start, range.start);
        }
        catch (error) {
            vscode.window.showErrorMessage(`无法打开文件: ${error}`);
        }
    }
    // 添加 postMessage 方法用于向 WebView 发送消息
    postMessage(message) {
        return this._panel.webview.postMessage(message);
    }
    dispose() {
        SearchPanel.currentPanel = undefined;
        this._panel.dispose();
        while (this._disposables.length) {
            const disposable = this._disposables.pop();
            if (disposable) {
                disposable.dispose();
            }
        }
    }
}
exports.SearchPanel = SearchPanel;
//# sourceMappingURL=searchPanel.js.map