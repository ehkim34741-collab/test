import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Settings, FolderOpen, Key, RefreshCw, FileText, X, Trash2 } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface DocFile {
  name: string;
  ext: string;
  supported: boolean;
  size: string;
}

const KEY_DIR = 'pmo-knowledge-dir';
const KEY_APIKEY = 'pmo-knowledge-apikey';

const SAMPLE_QUESTIONS = [
  '00업무 현업 담당자는 누구인가요?',
  '요구사항001 관련 설계서는?',
  '프로젝트 PM이 누구인가요?',
  '이 프로젝트의 주요 일정은?',
];

export default function KnowledgeChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [dir, setDir] = useState(() => localStorage.getItem(KEY_DIR) || '');
  const [apiKey, setApiKey] = useState(() => localStorage.getItem(KEY_APIKEY) || '');
  const [tempDir, setTempDir] = useState('');
  const [tempKey, setTempKey] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [docFiles, setDocFiles] = useState<DocFile[]>([]);
  const [docError, setDocError] = useState('');
  const [loadingDocs, setLoadingDocs] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (dir) loadDocList(dir);
  }, []);

  function openSettings() {
    setTempDir(dir);
    setTempKey(apiKey);
    setShowSettings(true);
  }

  function saveSettings() {
    localStorage.setItem(KEY_DIR, tempDir);
    localStorage.setItem(KEY_APIKEY, tempKey);
    setDir(tempDir);
    setApiKey(tempKey);
    setShowSettings(false);
    if (tempDir) loadDocList(tempDir);
  }

  async function loadDocList(targetDir: string) {
    if (!targetDir) return;
    setLoadingDocs(true);
    setDocError('');
    try {
      const res = await fetch(`/api/knowledge/list?dir=${encodeURIComponent(targetDir)}`);
      const data = await res.json();
      if (data.error) { setDocError(data.error); setDocFiles([]); }
      else setDocFiles(data.files || []);
    } catch {
      setDocError('서버에 연결할 수 없습니다. npm run dev:full 로 실행하세요.');
      setDocFiles([]);
    }
    setLoadingDocs(false);
  }

  async function handleSend() {
    const q = input.trim();
    if (!q || loading) return;
    if (!dir) { openSettings(); return; }
    if (!apiKey) { openSettings(); return; }

    const userMsg: Message = { role: 'user', content: q };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/knowledge/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dir,
          question: q,
          apiKey,
          history: messages,
        }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.error ? `❌ ${data.error}` : data.answer,
      }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: '❌ 서버에 연결할 수 없습니다.' }]);
    }
    setLoading(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  }

  const supportedCount = docFiles.filter(f => f.supported).length;
  const ready = !!dir && !!apiKey && supportedCount > 0;

  return (
    <div className="flex flex-col h-[calc(100vh-0px)] p-8 gap-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">프로젝트 챗봇</h1>
          <p className="text-gray-500 mt-1">문서 기반으로 프로젝트 정보를 질문하세요</p>
        </div>
        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <button onClick={() => setMessages([])}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
              <Trash2 size={14} />대화 초기화
            </button>
          )}
          <button onClick={openSettings}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 shadow-sm transition-colors">
            <Settings size={15} />설정
          </button>
        </div>
      </div>

      {/* Document status bar */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <FolderOpen size={16} className={dir ? 'text-blue-500 flex-shrink-0' : 'text-gray-300 flex-shrink-0'} />
            {dir
              ? <code className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-700 truncate max-w-xs">{dir}</code>
              : <span className="text-sm text-gray-400">폴더 미설정 — 설정을 눌러 문서 폴더를 지정하세요</span>
            }
          </div>
          {dir && (
            <button onClick={() => loadDocList(dir)} disabled={loadingDocs}
              className="text-gray-400 hover:text-blue-500 transition-colors ml-2 flex-shrink-0">
              <RefreshCw size={14} className={loadingDocs ? 'animate-spin' : ''} />
            </button>
          )}
        </div>

        {docError && <p className="text-xs text-red-500 mt-2">{docError}</p>}

        {docFiles.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5 items-center">
            {docFiles.map(f => (
              <span key={f.name}
                className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${
                  f.supported ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-400 line-through'
                }`}>
                <FileText size={10} />{f.name}
                <span className="opacity-50">({f.size})</span>
              </span>
            ))}
            <span className="text-xs text-gray-400 ml-1">
              {supportedCount}개 문서 읽기 가능
              {docFiles.length > supportedCount && ` (${docFiles.length - supportedCount}개 미지원)`}
            </span>
          </div>
        )}

        {!dir && (
          <div className="mt-2 text-xs text-gray-400">
            지원 형식: .txt .md .csv .json .xlsx .xls
          </div>
        )}
      </div>

      {/* Chat area */}
      <div className="flex-1 bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col overflow-hidden min-h-0">
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <Bot size={44} className="mx-auto mb-3 opacity-20" />
              <p className="text-sm font-medium text-gray-500 mb-1">프로젝트 문서에 대해 무엇이든 질문하세요</p>
              <p className="text-xs text-gray-400 mb-6">담당자, 요구사항, 일정, 설계서 등</p>
              <div className="flex flex-wrap gap-2 justify-center max-w-lg mx-auto">
                {SAMPLE_QUESTIONS.map(q => (
                  <button key={q} onClick={() => { setInput(q); inputRef.current?.focus(); }}
                    className="px-3 py-1.5 bg-gray-50 hover:bg-blue-50 hover:text-blue-600 text-gray-600 rounded-full text-xs transition-colors border border-gray-200 hover:border-blue-200">
                    {q}
                  </button>
                ))}
              </div>
              {!ready && (
                <button onClick={openSettings}
                  className="mt-6 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors">
                  설정 시작하기
                </button>
              )}
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                  <Bot size={14} className="text-white" />
                </div>
              )}
              <div className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap shadow-sm ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-tr-sm'
                  : 'bg-gray-100 text-gray-800 rounded-tl-sm'
              }`}>
                {msg.content}
              </div>
              {msg.role === 'user' && (
                <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <User size={14} className="text-slate-600" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                <Bot size={14} className="text-white" />
              </div>
              <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3.5">
                <div className="flex gap-1.5 items-center">
                  {[0, 1, 2].map(i => (
                    <div key={i} className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="border-t border-gray-100 p-4 flex-shrink-0">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder={ready ? '질문을 입력하세요 (Enter로 전송)' : '설정을 완료한 후 질문하세요'}
              className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              disabled={loading}
            />
            <button onClick={handleSend} disabled={loading || !input.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-xl transition-colors flex items-center">
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">챗봇 설정</h2>
              <button onClick={() => setShowSettings(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-2 flex items-center gap-1">
                  <FolderOpen size={12} />문서 폴더 경로
                </label>
                <input value={tempDir} onChange={e => setTempDir(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  placeholder="예: C:\project\doc" />
                <p className="text-xs text-gray-400 mt-1.5">
                  지원 파일: <strong>.txt .md .csv .json .xlsx .xls</strong><br />
                  이 폴더의 문서를 읽어 답변에 활용합니다.
                </p>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-2 flex items-center gap-1">
                  <Key size={12} />Anthropic API 키
                </label>
                <input value={tempKey} onChange={e => setTempKey(e.target.value)}
                  type="password"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  placeholder="sk-ant-api03-..." />
                <p className="text-xs text-gray-400 mt-1.5">
                  <a href="https://console.anthropic.com/keys" target="_blank" rel="noopener noreferrer"
                    className="text-blue-500 hover:underline">console.anthropic.com/keys</a>에서 발급할 수 있습니다.<br />
                  API 키는 로컬(localStorage)에만 저장됩니다.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 pb-6">
              <button onClick={() => setShowSettings(false)}
                className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                취소
              </button>
              <button onClick={saveSettings} disabled={!tempDir || !tempKey}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-colors">
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
