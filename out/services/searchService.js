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
exports.SearchService = void 0;
const vscode = __importStar(require("vscode"));
class SearchService {
    constructor() {
        this.classCache = new Map();
        this.classCacheTimeout = 5 * 60 * 1000; // 5分钟缓存
        this.lastCacheCleanup = Date.now();
        // 定期清理过期缓存
        setInterval(() => this.cleanupCache(), this.classCacheTimeout);
    }
    cleanupCache() {
        const now = Date.now();
        for (const [key, value] of this.classCache.entries()) {
            if (value.timestamp && now - value.timestamp > this.classCacheTimeout) {
                this.classCache.delete(key);
            }
        }
        this.lastCacheCleanup = now;
    }
    getCacheKey(uri, className) {
        return `${uri}:${className}`;
    }
    static getInstance() {
        if (!SearchService.instance) {
            SearchService.instance = new SearchService();
        }
        return SearchService.instance;
    }
    async getWorkspaceSymbols(query) {
        return await vscode.commands.executeCommand('vscode.executeWorkspaceSymbolProvider', query) || [];
    }
    async getDocumentSymbols(uri) {
        try {
            const document = await vscode.workspace.openTextDocument(uri);
            return await vscode.commands.executeCommand('vscode.executeDocumentSymbolProvider', document.uri) || [];
        }
        catch (error) {
            console.error('Error getting document symbols:', error);
            return [];
        }
    }
    async findClassDetails(uri, className) {
        const details = {
            extends: [],
            implements: [],
            methods: [],
            properties: []
        };
        try {
            const document = await vscode.workspace.openTextDocument(uri);
            const text = document.getText();
            // 查找类定义
            const classRegex = new RegExp(`class\\s+${className}\\s*(?:extends\\s+([\\w\\d_]+))?(?:\\s+implements\\s+([\\w\\d_,\\s]+))?`, 'g');
            const match = classRegex.exec(text);
            if (match) {
                // 获取继承的类
                if (match[1]) {
                    details.extends?.push(match[1].trim());
                }
                // 获取实现的接口
                if (match[2]) {
                    details.implements = match[2].split(',').map(i => i.trim());
                }
                // 获取类的方法和属性
                const documentSymbols = await this.getDocumentSymbols(uri);
                const classSymbol = this.findClassSymbol(documentSymbols, className);
                if (classSymbol) {
                    classSymbol.children.forEach(symbol => {
                        if (symbol.kind === vscode.SymbolKind.Method) {
                            details.methods?.push(symbol.name);
                        }
                        else if (symbol.kind === vscode.SymbolKind.Property ||
                            symbol.kind === vscode.SymbolKind.Field) {
                            details.properties?.push(symbol.name);
                        }
                    });
                }
            }
        }
        catch (error) {
            console.error('Error finding class details:', error);
        }
        return details;
    }
    findClassSymbol(symbols, className) {
        for (const symbol of symbols) {
            if (symbol.kind === vscode.SymbolKind.Class && symbol.name === className) {
                return symbol;
            }
            if (symbol.children) {
                const found = this.findClassSymbol(symbol.children, className);
                if (found) {
                    return found;
                }
            }
        }
        return undefined;
    }
    async searchClasses(searchTerm) {
        const results = [];
        const symbols = await this.getWorkspaceSymbols(searchTerm);
        for (const symbol of symbols) {
            if (symbol.kind === vscode.SymbolKind.Class) {
                const cacheKey = this.getCacheKey(symbol.location.uri.toString(), symbol.name);
                let classResult = this.classCache.get(cacheKey);
                if (!classResult || !classResult.timestamp ||
                    Date.now() - classResult.timestamp > this.classCacheTimeout) {
                    const details = await this.findClassDetails(symbol.location.uri, symbol.name);
                    const description = this.formatClassDescription(symbol.name, details);
                    classResult = {
                        type: 'class',
                        name: symbol.name,
                        location: symbol.location,
                        description,
                        details,
                        timestamp: Date.now()
                    };
                    this.classCache.set(cacheKey, classResult);
                }
                results.push(classResult);
            }
        }
        // 按相关度排序
        return this.sortClassResults(results, searchTerm);
    }
    sortClassResults(results, searchTerm) {
        const termLower = searchTerm.toLowerCase();
        return results.sort((a, b) => {
            // 精确匹配优先
            const aExact = a.name.toLowerCase() === termLower;
            const bExact = b.name.toLowerCase() === termLower;
            if (aExact && !bExact)
                return -1;
            if (!aExact && bExact)
                return 1;
            // 开头匹配其次
            const aStarts = a.name.toLowerCase().startsWith(termLower);
            const bStarts = b.name.toLowerCase().startsWith(termLower);
            if (aStarts && !bStarts)
                return -1;
            if (!aStarts && bStarts)
                return 1;
            // 包含匹配再次
            const aContains = a.name.toLowerCase().includes(termLower);
            const bContains = b.name.toLowerCase().includes(termLower);
            if (aContains && !bContains)
                return -1;
            if (!aContains && bContains)
                return 1;
            // 最后按名称字母顺序
            return a.name.localeCompare(b.name);
        });
    }
    formatClassDescription(className, details) {
        const parts = [`类: ${className}`];
        if (!details) {
            return parts.join('\n');
        }
        if (details.extends?.length) {
            parts.push(`继承自: ${details.extends.join(', ')}`);
        }
        if (details.implements?.length) {
            parts.push(`实现接口: ${details.implements.join(', ')}`);
        }
        if (details.methods?.length) {
            parts.push(`方法数: ${details.methods.length}`);
        }
        if (details.properties?.length) {
            parts.push(`属性数: ${details.properties.length}`);
        }
        return parts.join(' | ');
    }
    async search(category, searchTerm) {
        switch (category) {
            case 'class':
                return this.searchClasses(searchTerm);
            case 'method':
                return this.searchMethods(searchTerm);
            case 'file':
                return this.searchFiles(searchTerm);
            // case 'api':
            //     return this.searchAPIs(searchTerm);
            case 'variable':
                return this.searchVariables(searchTerm);
            case 'all':
                return this.searchAll(searchTerm);
            default:
                return [];
        }
    }
    async searchMethods(searchTerm) {
        const results = [];
        // 1. 使用工作区符号搜索
        const workspaceSymbols = await vscode.commands.executeCommand('vscode.executeWorkspaceSymbolProvider', searchTerm);
        if (workspaceSymbols) {
            for (const symbol of workspaceSymbols) {
                if (symbol.kind === vscode.SymbolKind.Method ||
                    symbol.kind === vscode.SymbolKind.Function) {
                    // 获取方法所在文件的详细信息
                    const document = await vscode.workspace.openTextDocument(symbol.location.uri);
                    const methodRange = symbol.location.range;
                    const methodText = document.getText(methodRange);
                    // 提取方法签名
                    const firstLine = methodText.split('\n')[0].trim();
                    const signature = firstLine.includes('{') ?
                        firstLine.split('{')[0].trim() : firstLine;
                    // 构建描述信息
                    let description = `方法: ${symbol.name}\n`;
                    description += `所属: ${symbol.containerName || '全局作用域'}\n`;
                    description += `签名: ${signature}`;
                    // 如果是类方法，尝试获取访问修饰符
                    const accessModifier = methodText.match(/^(public|private|protected)/);
                    if (accessModifier) {
                        description += `\n访问级别: ${accessModifier[0]}`;
                    }
                    results.push({
                        type: 'method',
                        name: symbol.name,
                        location: symbol.location,
                        description: description,
                        details: {
                            methods: [signature]
                        }
                    });
                }
            }
        }
        // 2. 对结果进行排序，优先显示名称匹配度高的结果
        results.sort((a, b) => {
            const aMatch = a.name.toLowerCase().indexOf(searchTerm.toLowerCase());
            const bMatch = b.name.toLowerCase().indexOf(searchTerm.toLowerCase());
            if (aMatch === -1 && bMatch === -1)
                return 0;
            if (aMatch === -1)
                return 1;
            if (bMatch === -1)
                return -1;
            return aMatch - bMatch;
        });
        return results;
    }
    async searchFiles(searchTerm) {
        const results = [];
        const files = await vscode.workspace.findFiles('**/*' + searchTerm + '*');
        files.forEach(file => {
            results.push({
                type: 'file',
                name: file.fsPath.split('/').pop() || '',
                location: new vscode.Location(file, new vscode.Position(0, 0)),
                description: `文件: ${file.fsPath}`
            });
        });
        return results;
    }
    // private async searchAPIs(searchTerm: string): Promise<SearchResult[]> {
    //     const results: SearchResult[] = [];
    //     const files = await vscode.workspace.findFiles('**/*.{js,ts,py,java,rb,php}');
    //     for (const file of files) {
    //         const document = await vscode.workspace.openTextDocument(file);
    //         const text = document.getText();
    //         // 简单的 REST API 路由匹配
    //         const apiPatterns = [
    //             /(@Route|@RequestMapping|app\.(get|post|put|delete)|router\.(get|post|put|delete))\s*\(\s*['"]([^'"]+)['"]/g,
    //             /app\.(get|post|put|delete)\s*\(\s*['"]([^'"]+)['"]/g
    //         ];
    //         for (const pattern of apiPatterns) {
    //             let match;
    //             while ((match = pattern.exec(text)) !== null) {
    //                 if (match[0].toLowerCase().includes(searchTerm.toLowerCase())) {
    //                     results.push({
    //                         type: 'api',
    //                         name: match[0],
    //                         location: new vscode.Location(
    //                             file,
    //                             document.positionAt(match.index)
    //                         ),
    //                         description: `API: ${match[0]}`
    //                     });
    //                 }
    //             }
    //         }
    //     }
    //     return results;
    // }
    async searchVariables(searchTerm) {
        const results = [];
        const symbols = await vscode.commands.executeCommand('vscode.executeWorkspaceSymbolProvider', searchTerm);
        if (symbols) {
            symbols.forEach(symbol => {
                if (symbol.kind === vscode.SymbolKind.Variable) {
                    results.push({
                        type: 'variable',
                        name: symbol.name,
                        location: symbol.location,
                        description: `变量: ${symbol.containerName}`
                    });
                }
            });
        }
        return results;
    }
    async searchAll(searchTerm) {
        const results = await Promise.all([
            this.searchClasses(searchTerm),
            this.searchMethods(searchTerm),
            this.searchFiles(searchTerm),
            // this.searchAPIs(searchTerm),
            this.searchVariables(searchTerm)
        ]);
        return results.flat();
    }
}
exports.SearchService = SearchService;
//# sourceMappingURL=searchService.js.map