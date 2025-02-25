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
exports.SearchTreeDataProvider = void 0;
const vscode = __importStar(require("vscode"));
class SearchTreeDataProvider {
    constructor() {
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
    }
    getTreeItem(element) {
        return element;
    }
    getChildren(element) {
        if (element) {
            return Promise.resolve([]);
        }
        const items = [
            new SearchTreeItem('搜索类定义', 'enhanced-search.searchClass', '$(symbol-class)'),
            new SearchTreeItem('搜索方法', 'enhanced-search.searchMethod', '$(symbol-method)'),
            new SearchTreeItem('搜索文件', 'enhanced-search.searchFile', '$(file-code)'),
            new SearchTreeItem('搜索全局变量', 'enhanced-search.searchGlobalVar', '$(symbol-variable)')
        ];
        return Promise.resolve(items);
    }
    getParent(element) {
        return null;
    }
}
exports.SearchTreeDataProvider = SearchTreeDataProvider;
class SearchTreeItem extends vscode.TreeItem {
    constructor(label, commandId, iconId) {
        super(label, vscode.TreeItemCollapsibleState.None);
        this.label = label;
        this.commandId = commandId;
        this.iconId = iconId;
        this.tooltip = label;
        this.command = {
            command: commandId,
            title: label,
            arguments: []
        };
        this.iconPath = new vscode.ThemeIcon(iconId.replace('$(', '').replace(')', ''));
    }
}
//# sourceMappingURL=searchTreeDataProvider.js.map