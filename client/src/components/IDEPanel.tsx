import React, { useState, useEffect, useCallback } from 'react';
import { trpc } from '../trpc';

interface FileInfo {
  name: string;
  path: string;
  relativePath: string;
  extension: string;
  size: number;
  isDirectory: boolean;
}

interface IDEPanelProps {
  sessionId?: string;
}

export function IDEPanel({ sessionId }: IDEPanelProps) {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [currentFile, setCurrentFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [isModified, setIsModified] = useState(false);
  const [currentPath, setCurrentPath] = useState('.');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [generatePrompt, setGeneratePrompt] = useState('');
  const [generateLanguage, setGenerateLanguage] = useState('typescript');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'files' | 'search' | 'generate'>('files');

  // tRPC mutations and queries
  const listFilesMutation = trpc.enhanced.ide.listFiles.useQuery(
    { path: currentPath, recursive: false },
    { enabled: false }
  );
  
  const createFileMutation = trpc.enhanced.ide.createFile.useMutation();
  const updateFileMutation = trpc.enhanced.ide.updateFile.useMutation();
  const deleteFileMutation = trpc.enhanced.ide.deleteFile.useMutation();
  const generateCodeMutation = trpc.enhanced.ide.generateCode.useMutation();
  const refactorCodeMutation = trpc.enhanced.ide.refactorCode.useMutation();
  const explainCodeMutation = trpc.enhanced.ide.explainCode.useMutation();

  // Load files
  const loadFiles = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await listFilesMutation.refetch();
      if (result.data?.success && result.data.data?.files) {
        setFiles(result.data.data.files);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load files');
    } finally {
      setIsLoading(false);
    }
  }, [currentPath]);

  useEffect(() => {
    loadFiles();
  }, [currentPath]);

  // Open file
  const openFile = async (filePath: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/ide/read?path=${encodeURIComponent(filePath)}`);
      const result = await response.json();
      if (result.success) {
        setCurrentFile(filePath);
        setFileContent(result.data.content);
        setIsModified(false);
      } else {
        setError(result.error || 'Failed to read file');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to read file');
    } finally {
      setIsLoading(false);
    }
  };

  // Save file
  const saveFile = async () => {
    if (!currentFile) return;
    
    setIsLoading(true);
    setError(null);
    try {
      await updateFileMutation.mutateAsync({
        path: currentFile,
        content: fileContent,
      });
      setIsModified(false);
    } catch (err: any) {
      setError(err.message || 'Failed to save file');
    } finally {
      setIsLoading(false);
    }
  };

  // Create new file
  const createNewFile = async (fileName: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const filePath = `${currentPath}/${fileName}`;
      await createFileMutation.mutateAsync({
        path: filePath,
        content: '',
      });
      await loadFiles();
      openFile(filePath);
    } catch (err: any) {
      setError(err.message || 'Failed to create file');
    } finally {
      setIsLoading(false);
    }
  };

  // Delete file
  const deleteFile = async (filePath: string) => {
    if (!confirm(`Delete ${filePath}?`)) return;
    
    setIsLoading(true);
    setError(null);
    try {
      await deleteFileMutation.mutateAsync({ path: filePath });
      if (currentFile === filePath) {
        setCurrentFile(null);
        setFileContent('');
      }
      await loadFiles();
    } catch (err: any) {
      setError(err.message || 'Failed to delete file');
    } finally {
      setIsLoading(false);
    }
  };

  // Generate code
  const generateCode = async () => {
    if (!generatePrompt.trim()) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const result = await generateCodeMutation.mutateAsync({
        description: generatePrompt,
        language: generateLanguage,
      });
      if (result.success && result.data?.code) {
        setFileContent(result.data.code);
        setIsModified(true);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate code');
    } finally {
      setIsLoading(false);
    }
  };

  // Refactor code
  const refactorCode = async (instructions: string) => {
    if (!currentFile) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const result = await refactorCodeMutation.mutateAsync({
        path: currentFile,
        instructions,
      });
      if (result.success) {
        await openFile(currentFile);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to refactor code');
    } finally {
      setIsLoading(false);
    }
  };

  // Explain code
  const explainCode = async () => {
    if (!currentFile) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const result = await explainCodeMutation.mutateAsync({ path: currentFile });
      if (result.success && result.data?.explanation) {
        alert(result.data.explanation);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to explain code');
    } finally {
      setIsLoading(false);
    }
  };

  // Navigate to directory
  const navigateTo = (path: string) => {
    setCurrentPath(path);
  };

  // Get file icon
  const getFileIcon = (file: FileInfo) => {
    if (file.isDirectory) return '📁';
    const ext = file.extension.toLowerCase();
    const icons: Record<string, string> = {
      '.ts': '📘',
      '.tsx': '⚛️',
      '.js': '📒',
      '.jsx': '⚛️',
      '.py': '🐍',
      '.json': '📋',
      '.md': '📝',
      '.html': '🌐',
      '.css': '🎨',
      '.sql': '🗄️',
      '.sh': '💻',
      '.yml': '⚙️',
      '.yaml': '⚙️',
    };
    return icons[ext] || '📄';
  };

  // Format file size
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  return (
    <div className="ide-panel flex flex-col h-full bg-gray-900 text-white">
      {/* Header */}
      <div className="ide-header flex items-center justify-between p-2 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-green-400">🛠️ ALE IDE</span>
          <span className="text-sm text-gray-400">| {currentPath}</span>
        </div>
        <div className="flex items-center gap-2">
          {currentFile && (
            <>
              <button
                onClick={saveFile}
                disabled={!isModified || isLoading}
                className={`px-3 py-1 rounded text-sm ${
                  isModified
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-gray-600 cursor-not-allowed'
                }`}
              >
                💾 Save
              </button>
              <button
                onClick={explainCode}
                disabled={isLoading}
                className="px-3 py-1 rounded text-sm bg-blue-600 hover:bg-blue-700"
              >
                💡 Explain
              </button>
            </>
          )}
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="bg-red-900 text-red-200 p-2 text-sm">
          ❌ {error}
          <button onClick={() => setError(null)} className="ml-2 underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
          {/* Tabs */}
          <div className="flex border-b border-gray-700">
            <button
              onClick={() => setActiveTab('files')}
              className={`flex-1 py-2 text-sm ${
                activeTab === 'files' ? 'bg-gray-700 text-white' : 'text-gray-400'
              }`}
            >
              📁 Files
            </button>
            <button
              onClick={() => setActiveTab('search')}
              className={`flex-1 py-2 text-sm ${
                activeTab === 'search' ? 'bg-gray-700 text-white' : 'text-gray-400'
              }`}
            >
              🔍 Search
            </button>
            <button
              onClick={() => setActiveTab('generate')}
              className={`flex-1 py-2 text-sm ${
                activeTab === 'generate' ? 'bg-gray-700 text-white' : 'text-gray-400'
              }`}
            >
              ✨ Generate
            </button>
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-auto p-2">
            {activeTab === 'files' && (
              <div className="space-y-1">
                {/* Navigation */}
                {currentPath !== '.' && (
                  <div
                    onClick={() => navigateTo(currentPath.split('/').slice(0, -1).join('/') || '.')}
                    className="flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-gray-700"
                  >
                    <span>📁</span>
                    <span>..</span>
                  </div>
                )}
                
                {/* File list */}
                {files.map((file) => (
                  <div
                    key={file.path}
                    onClick={() => file.isDirectory ? navigateTo(file.relativePath) : openFile(file.relativePath)}
                    className={`flex items-center justify-between p-2 rounded cursor-pointer hover:bg-gray-700 ${
                      currentFile === file.relativePath ? 'bg-gray-700' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <span>{getFileIcon(file)}</span>
                      <span className="truncate">{file.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-gray-500">{formatSize(file.size)}</span>
                      {!file.isDirectory && (
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteFile(file.relativePath); }}
                          className="text-red-400 hover:text-red-300 text-xs"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                
                {/* New file button */}
                <button
                  onClick={() => {
                    const name = prompt('Enter file name:');
                    if (name) createNewFile(name);
                  }}
                  className="w-full p-2 mt-2 rounded bg-gray-700 hover:bg-gray-600 text-sm"
                >
                  ➕ New File
                </button>
              </div>
            )}

            {activeTab === 'search' && (
              <div className="space-y-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search in files..."
                  className="w-full p-2 rounded bg-gray-700 text-white text-sm"
                />
                <button
                  onClick={async () => {
                    // Search implementation
                  }}
                  className="w-full p-2 rounded bg-blue-600 hover:bg-blue-700 text-sm"
                >
                  🔍 Search
                </button>
                {searchResults.map((result, i) => (
                  <div key={i} className="p-2 bg-gray-700 rounded text-sm">
                    <div className="text-blue-400">{result.file}:{result.line}</div>
                    <div className="text-gray-300 truncate">{result.content}</div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'generate' && (
              <div className="space-y-2">
                <select
                  value={generateLanguage}
                  onChange={(e) => setGenerateLanguage(e.target.value)}
                  className="w-full p-2 rounded bg-gray-700 text-white text-sm"
                >
                  <option value="typescript">TypeScript</option>
                  <option value="javascript">JavaScript</option>
                  <option value="python">Python</option>
                  <option value="rust">Rust</option>
                  <option value="go">Go</option>
                  <option value="java">Java</option>
                  <option value="csharp">C#</option>
                  <option value="cpp">C++</option>
                  <option value="ruby">Ruby</option>
                  <option value="php">PHP</option>
                  <option value="swift">Swift</option>
                  <option value="kotlin">Kotlin</option>
                  <option value="sql">SQL</option>
                  <option value="html">HTML</option>
                  <option value="css">CSS</option>
                </select>
                <textarea
                  value={generatePrompt}
                  onChange={(e) => setGeneratePrompt(e.target.value)}
                  placeholder="Describe what you want to generate..."
                  className="w-full p-2 rounded bg-gray-700 text-white text-sm h-32 resize-none"
                />
                <button
                  onClick={generateCode}
                  disabled={isLoading || !generatePrompt.trim()}
                  className="w-full p-2 rounded bg-green-600 hover:bg-green-700 text-sm disabled:bg-gray-600"
                >
                  {isLoading ? '⏳ Generating...' : '✨ Generate Code'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Editor */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {currentFile ? (
            <>
              {/* File tab */}
              <div className="flex items-center gap-2 p-2 bg-gray-800 border-b border-gray-700">
                <span className="text-sm text-gray-300">
                  {getFileIcon({ extension: currentFile.split('.').pop() || '', isDirectory: false } as FileInfo)}
                </span>
                <span className="text-sm">{currentFile}</span>
                {isModified && <span className="text-yellow-400">●</span>}
              </div>
              
              {/* Editor area */}
              <textarea
                value={fileContent}
                onChange={(e) => {
                  setFileContent(e.target.value);
                  setIsModified(true);
                }}
                className="flex-1 p-4 bg-gray-900 text-green-400 font-mono text-sm resize-none focus:outline-none"
                spellCheck={false}
              />
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <div className="text-6xl mb-4">📝</div>
                <div className="text-xl">Select a file to edit</div>
                <div className="text-sm mt-2">or use Generate to create code with AI</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between p-1 bg-gray-800 border-t border-gray-700 text-xs text-gray-400">
        <div className="flex items-center gap-4">
          <span>📁 {files.length} items</span>
          {currentFile && (
            <>
              <span>📄 {currentFile.split('.').pop()?.toUpperCase()}</span>
              <span>📏 {fileContent.split('\n').length} lines</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-4">
          <span>🤖 Forge AI Connected</span>
          {isLoading && <span className="text-yellow-400">⏳ Loading...</span>}
        </div>
      </div>
    </div>
  );
}

export default IDEPanel;
