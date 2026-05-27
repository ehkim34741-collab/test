import { useState, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Upload, FileSpreadsheet, X, BarChart2, CheckCircle, Clock, AlertCircle, PauseCircle } from 'lucide-react';

interface Requirement {
  [key: string]: string | number | undefined;
}

interface Stats {
  total: number;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
  byCategory: Record<string, number>;
}

const STATUS_COLORS: Record<string, string> = {
  '확정': 'bg-green-100 text-green-700',
  '검토중': 'bg-blue-100 text-blue-700',
  '보류': 'bg-amber-100 text-amber-700',
  '반려': 'bg-red-100 text-red-700',
  '신규': 'bg-purple-100 text-purple-700',
};

const PRIORITY_COLORS: Record<string, string> = {
  '높음': 'bg-red-100 text-red-700',
  '보통': 'bg-blue-100 text-blue-700',
  '낮음': 'bg-gray-100 text-gray-600',
  'High': 'bg-red-100 text-red-700',
  'Medium': 'bg-blue-100 text-blue-700',
  'Low': 'bg-gray-100 text-gray-600',
};

function getStatusIcon(status: string) {
  if (status === '확정') return <CheckCircle size={14} className="text-green-600" />;
  if (status === '검토중') return <Clock size={14} className="text-blue-600" />;
  if (status === '보류') return <PauseCircle size={14} className="text-amber-600" />;
  return <AlertCircle size={14} className="text-gray-400" />;
}

// 열 이름 자동 감지
function detectColumn(headers: string[], candidates: string[]): string | null {
  for (const c of candidates) {
    const found = headers.find(h => h?.toString().toLowerCase().includes(c.toLowerCase()));
    if (found) return found;
  }
  return null;
}

export default function Requirements() {
  const [rows, setRows] = useState<Requirement[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [fileName, setFileName] = useState('');
  const [stats, setStats] = useState<Stats | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [search, setSearch] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('requirements-data');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setRows(parsed.rows || []);
        setHeaders(parsed.headers || []);
        setFileName(parsed.fileName || '');
        setStats(parsed.stats || null);
      } catch {}
    }
  }, []);

  // 열 이름 매핑
  const statusCol = detectColumn(headers, ['상태', 'status', '진행상태', '처리상태']);
  const priorityCol = detectColumn(headers, ['우선순위', 'priority', '중요도']);
  const categoryCol = detectColumn(headers, ['분류', '카테고리', 'category', '유형', '구분']);

  function parseFile(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const wb = XLSX.read(data, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const json: Requirement[] = XLSX.utils.sheet_to_json(ws, { defval: '' });

      if (json.length === 0) return;

      const hdrs = Object.keys(json[0]);
      setHeaders(hdrs);
      setRows(json);
      setFileName(file.name);

      // 통계 계산
      const statusKey = detectColumn(hdrs, ['상태', 'status', '진행상태', '처리상태']);
      const priorityKey = detectColumn(hdrs, ['우선순위', 'priority', '중요도']);
      const categoryKey = detectColumn(hdrs, ['분류', '카테고리', 'category', '유형', '구분']);

      const byStatus: Record<string, number> = {};
      const byPriority: Record<string, number> = {};
      const byCategory: Record<string, number> = {};

      json.forEach(row => {
        if (statusKey) {
          const v = String(row[statusKey] || '미정');
          byStatus[v] = (byStatus[v] || 0) + 1;
        }
        if (priorityKey) {
          const v = String(row[priorityKey] || '미정');
          byPriority[v] = (byPriority[v] || 0) + 1;
        }
        if (categoryKey) {
          const v = String(row[categoryKey] || '미정');
          byCategory[v] = (byCategory[v] || 0) + 1;
        }
      });

      const newStats = { total: json.length, byStatus, byPriority, byCategory };
      setStats(newStats);
      localStorage.setItem('requirements-data', JSON.stringify({
        rows: json, headers: hdrs, fileName: file.name, stats: newStats,
      }));
    };
    reader.readAsArrayBuffer(file);
  }

  function handleFile(file: File) {
    if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
      alert('Excel(.xlsx, .xls) 또는 CSV 파일만 지원합니다.');
      return;
    }
    parseFile(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function clearFile() {
    setRows([]);
    setHeaders([]);
    setFileName('');
    setStats(null);
    setSearch('');
    if (fileRef.current) fileRef.current.value = '';
    localStorage.removeItem('requirements-data');
  }

  const filtered = rows.filter(row =>
    Object.values(row).some(v => String(v).includes(search))
  );

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">요구사항 관리</h1>
          <p className="text-gray-500 mt-1">엑셀 파일을 업로드하여 요구사항 현황을 분석합니다</p>
        </div>
      </div>

      {/* 파일 업로드 영역 */}
      {!fileName ? (
        <div
          className={`border-2 border-dashed rounded-2xl p-16 text-center transition-colors cursor-pointer ${
            isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-400 hover:bg-gray-50'
          }`}
          onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
        >
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FileSpreadsheet size={32} className="text-blue-500" />
          </div>
          <p className="text-lg font-semibold text-gray-700 mb-1">엑셀 파일을 드래그하거나 클릭하여 업로드</p>
          <p className="text-sm text-gray-400">.xlsx · .xls · .csv 지원</p>
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
        </div>
      ) : (
        <>
          {/* 파일 정보 */}
          <div className="flex items-center gap-3 mb-6 bg-green-50 border border-green-200 rounded-xl px-5 py-3">
            <FileSpreadsheet size={20} className="text-green-600" />
            <span className="text-sm font-medium text-green-800">{fileName}</span>
            <span className="text-xs text-green-600 ml-1">· {rows.length}개 행 로드됨</span>
            <button onClick={clearFile} className="ml-auto text-gray-400 hover:text-red-500 transition-colors">
              <X size={18} />
            </button>
          </div>

          {/* KPI 카드 */}
          {stats && (
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-600 text-white rounded-xl p-5">
                <div className="text-4xl font-bold">{stats.total}</div>
                <div className="text-blue-200 text-sm mt-1">전체 요구사항</div>
              </div>

              {statusCol && Object.entries(stats.byStatus).slice(0, 3).map(([k, v]) => (
                <div key={k} className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
                  <div className="flex items-center gap-2 mb-1">
                    {getStatusIcon(k)}
                    <span className="text-xs text-gray-500">{k}</span>
                  </div>
                  <div className="text-3xl font-bold text-gray-800">{v}</div>
                  <div className="text-xs text-gray-400 mt-1">
                    {Math.round((v / stats.total) * 100)}%
                  </div>
                </div>
              ))}

              {!statusCol && (
                <div className="col-span-3 bg-amber-50 border border-amber-200 rounded-xl p-5 flex items-center gap-3">
                  <AlertCircle size={18} className="text-amber-500 flex-shrink-0" />
                  <span className="text-sm text-amber-700">
                    "상태" 열을 찾을 수 없습니다. 열 이름에 <b>상태, status, 진행상태</b> 등이 포함되면 자동 분류됩니다.
                  </span>
                </div>
              )}
            </div>
          )}

          {/* 상태별 / 우선순위별 / 분류별 차트 */}
          {stats && (
            <div className="grid grid-cols-3 gap-4 mb-6">
              {[
                { label: '상태별', data: stats.byStatus, colors: STATUS_COLORS },
                { label: '우선순위별', data: stats.byPriority, colors: PRIORITY_COLORS },
                { label: '분류별', data: stats.byCategory, colors: {} },
              ].map(({ label, data }) => (
                <div key={label} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <BarChart2 size={15} className="text-gray-400" />
                    <span className="text-sm font-semibold text-gray-700">{label}</span>
                  </div>
                  {Object.keys(data).length === 0 ? (
                    <div className="text-xs text-gray-400 py-4 text-center">해당 열 없음</div>
                  ) : (
                    <div className="space-y-2">
                      {Object.entries(data)
                        .sort((a, b) => b[1] - a[1])
                        .map(([k, v]) => (
                          <div key={k}>
                            <div className="flex justify-between text-xs text-gray-600 mb-1">
                              <span className="truncate mr-2">{k}</span>
                              <span className="font-semibold flex-shrink-0">{v}건</span>
                            </div>
                            <div className="bg-gray-100 rounded-full h-1.5">
                              <div
                                className="h-1.5 rounded-full bg-blue-500"
                                style={{ width: `${(v / stats.total) * 100}%` }}
                              />
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* 데이터 테이블 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-4 border-b border-gray-100 flex items-center gap-3">
              <div className="relative flex-1 max-w-xs">
                <Upload size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 rotate-180" />
                <input
                  type="text"
                  placeholder="내용 검색..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-8 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <span className="text-xs text-gray-400">{filtered.length}건 표시</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 w-12">#</th>
                    {headers.map(h => (
                      <th key={h} className="px-4 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.slice(0, 100).map((row, i) => (
                    <tr key={i} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-xs text-gray-400">{i + 1}</td>
                      {headers.map(h => {
                        const val = String(row[h] ?? '');
                        const isStatus = h === statusCol;
                        const isPriority = h === priorityCol;
                        return (
                          <td key={h} className="px-4 py-3 text-gray-700 whitespace-nowrap max-w-[200px] truncate">
                            {isStatus ? (
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[val] || 'bg-gray-100 text-gray-600'}`}>
                                {getStatusIcon(val)}{val}
                              </span>
                            ) : isPriority ? (
                              <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${PRIORITY_COLORS[val] || 'bg-gray-100 text-gray-600'}`}>
                                {val}
                              </span>
                            ) : (
                              <span title={val}>{val}</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length > 100 && (
                <div className="text-center text-xs text-gray-400 py-3 border-t border-gray-100">
                  100건만 표시 중 (전체 {filtered.length}건)
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
