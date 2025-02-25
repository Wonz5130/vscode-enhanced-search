import * as vscode from 'vscode';
import { getWebviewContent } from './searchPanelContent';
import { SearchService, SearchResult } from '../services/searchService';

export class SearchPanel {
    public static currentPanel: SearchPanel | undefined;
    private readonly _panel: vscode.WebviewPanel;
    private _disposables: vscode.Disposable[] = [];
    private _searchService: SearchService;

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
        this._panel = panel;
        this._searchService = SearchService.getInstance();
        this._panel.webview.html = getWebviewContent(this._panel.webview, extensionUri);
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        // 处理来自 WebView 的消息
        this._panel.webview.onDidReceiveMessage(
            async message => {
                switch (message.command) {
                    case 'search':
                        await this.handleSearch(message.category, message.searchTerm);
                        break;
                    case 'openLocation':
                        await this.openLocation(message.location);
                        break;
                }
            },
            null,
            this._disposables
        );
    }

    public static createOrShow(extensionUri: vscode.Uri): SearchPanel {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        if (SearchPanel.currentPanel) {
            SearchPanel.currentPanel._panel.reveal(column);
            return SearchPanel.currentPanel;
        }

        const panel = vscode.window.createWebviewPanel(
            'enhancedSearch',
            '增强搜索',
            column || vscode.ViewColumn.One,
            {
                enableScripts: true,
                localResourceRoots: [
                    vscode.Uri.joinPath(extensionUri, 'media')
                ]
            }
        );

        SearchPanel.currentPanel = new SearchPanel(panel, extensionUri);
        return SearchPanel.currentPanel;
    }

    private async handleSearch(category: string, searchTerm: string) {
        try {
            const results = await this._searchService.search(category, searchTerm);
            await this.displayResults(results);
        } catch (error) {
            vscode.window.showErrorMessage(`搜索出错: ${error}`);
        }
    }

    private async displayResults(results: SearchResult[]) {
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

    private async openLocation(location: { uri: string, range: { start: { line: number, character: number }, end: { line: number, character: number } } }) {
        try {
            const uri = vscode.Uri.parse(location.uri);
            const range = new vscode.Range(
                new vscode.Position(location.range.start.line, location.range.start.character),
                new vscode.Position(location.range.end.line, location.range.end.character)
            );

            const document = await vscode.workspace.openTextDocument(uri);
            const editor = await vscode.window.showTextDocument(document);
            editor.revealRange(range, vscode.TextEditorRevealType.InCenter);
            editor.selection = new vscode.Selection(range.start, range.start);
        } catch (error) {
            vscode.window.showErrorMessage(`无法打开文件: ${error}`);
        }
    }

    // 添加 postMessage 方法用于向 WebView 发送消息
    public postMessage(message: any) {
        return this._panel.webview.postMessage(message);
    }

    public dispose() {
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
