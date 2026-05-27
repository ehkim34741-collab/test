import { useState, useEffect } from 'react';
import { Plus, Search, X, AlertCircle, CheckCircle, Clock, Bug, Lightbulb, HelpCircle, Zap, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { users } from '../data/users';

export type IssueType = '버그' | '기능개선' | '문의' | '장애' | '기타';
export type IssueStatus = '신규' | '진행중' | '해결' | '완료' | '취소';
export type IssuePriority = '높음' | '보통' | '낮음';

export interface Issue {
  id: string;
  no: number;
  title: string;
  description: string;
  type: IssueType;
  status: IssueStatus;
  priority: IssuePriority;
  assigneeId: string;
  assigneeName: string;
  reporterName: string;
  createdAt: string;
  updatedAt: string;
  dueDate: string;
}

const STORAGE_KEY = 'pmo-issues';
const TYPES: IssueType[] = ['버그', '기능개선', '문의', '장애', '기타'];
const STATUSES: IssueStatus[] = ['신규', '진행중', '해결', '완료', '취소'];
const PRIORITIES: IssuePriority[] = ['높음', '보통', '낮음'];

const TYPE_ICON: Record<IssueType, React.ReactNode> = {
  '버그': <Bug size={13} />,
  '기능개선': <Lightbulb size={13} />,
  '문의': <HelpCircle size={13} />,
  '장애': <Zap size={13} />,
  '기타': <AlertCircle size={13} />,
};
const TYPE_COLOR: Record<IssueType, string> = {
  '버그': 'bg-red-100 text-red-700',
  '기능개선': 'bg-blue-100 text-blue-700',
  '문의': 'bg-gray-100 text-gray-700',
  '장애': 'bg-orange-100 text-orange-700',
  '기타': 'bg-purple-100 text-purple-700',
};
const STATUS_COLOR: Record<IssueStatus, string> = {
  '신규': 'bg-sky-100 text-sky-700',
  '진행중': 'bg-yellow-100 text-yellow-700',
  '해결': 'bg-green-100 text-green-700',
  '완료': 'bg-emerald-100 text-emerald-700',
  '취소': 'bg-gray-100 text-gray-400',
};
const PRIORITY_COLOR: Record<IssuePriority, string> = {
  '높음': 'bg-red-100 text-red-700',
  '보통': 'bg-blue-100 text-blue-700',
  '낮음': 'bg-gray-100 text-gray-500',
};

function today() { return new Date().toISOString().slice(0, 10); }
function nowStr() {
  const d = new Date();
  return `${d.toISOString().slice(0, 10)} ${d.toTimeString().slice(0, 8)}`;
}

function emptyForm(currentUser: { id: string; displayName: string } | null) {
  return {
    title: '', description: '', type: '버그' as IssueType, status: '신규' as IssueStatus,
    priority: '보통' as IssuePriority,
    assigneeId: currentUser?.id || '',
    assigneeName: currentUser?.displayName || '',
    reporterName: currentUser?.displayName || '',
    dueDate: '',
  };
}

export default function Issues() {
  const { currentUser } = useAuth();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('전체');
  const [filterStatus, setFilterStatus] = useState('전체');
  const [filterPriority, setFilterPriority] = useState('전체');
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Issue | null>(null);
  const [form, setForm] = useState(emptyForm(currentUser));
  const [showDetail, setShowDetail] = useState<Issue | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) { try { setIssues(JSON.parse(saved)); } catch {} }
  }, []);

  function save(updated: Issue[]) {
    setIssues(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }

  function openCreate() {
    setEditTarget(null);
    setForm(emptyForm(currentUser));
    setShowForm(true);
  }
  function openEdit(issue: Issue) {
    setEditTarget(issue);
    setForm({
      title: issue.title, description: issue.description, type: issue.type,
      status: issue.status, priority: issue.priority,
      assigneeId: issue.assigneeId, assigneeName: issue.assigneeName,
      reporterName: issue.reporterName, dueDate: issue.dueDate,
    });
    setShowForm(true);
  }
  function handleAssigneeChange(id: string) {
    const u = users.find(u => u.id === id);
    setForm(f => ({ ...f, assigneeId: id, assigneeName: u?.displayName || '' }));
  }
  function handleSave() {
    if (!form.title.trim()) { alert('제목을 입력해주세요.'); return; }
    const now = nowStr();
    if (editTarget) {
      save(issues.map(i => i.id === editTarget.id ? { ...i, ...form, updatedAt: now } : i));
    } else {
      const maxNo = issues.length > 0 ? Math.max(...issues.map(i => i.no)) : 0;
      const newIssue: Issue = {
        id: `ISS-${Date.now()}`, no: maxNo + 1,
        ...form, createdAt: now, updatedAt: now,
      };
      save([...issues, newIssue]);
    }
    setShowForm(false);
  }
  function handleDelete(id: string) {
    if (!confirm('이슈를 삭제하시겠습니까?')) return;
    save(issues.filter(i => i.id !== id));
  }

  const filtered = issues.filter(i => {
    const matchSearch = !search || i.title.includes(search) || i.assigneeName.includes(search) || String(i.no).includes(search);
    const matchType = filterType === '전체' || i.type === filterType;
    const matchStatus = filterStatus === '전체' || i.status === filterStatus;
    const matchPriority = filterPriority === '전체' || i.priority === filterPriority;
    return matchSearch && matchType && matchStatus && matchPriority;
  });

  const kpi = {
    total: issues.length,
    open: issues.filter(i => i.status === '신규' || i.status === '진행중').length,
    resolved: issues.filter(i => i.status === '해결' || i.status === '완료').length,
    overdue: issues.filter(i => i.dueDate && i.dueDate < today() && i.status !== '완료' && i.status !== '취소').length,
  };

  const isOverdue = (issue: Issue) =>
    issue.dueDate && issue.dueDate < today() && issue.status !== '완료' && issue.status !== '취소';

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">이슈 관리</h1>
          <p className="text-gray-500 mt-1">프로젝트 이슈를 등록하고 처리 현황을 추적합니다</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2 text-sm">
          <Plus size={15} />이슈 등록
        </button>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: '전체 이슈', value: kpi.total, color: 'bg-slate-700 text-white', sub: '' },
          { label: '미처리', value: kpi.open, color: 'bg-yellow-50 text-yellow-800', sub: '신규+진행중' },
          { label: '해결/완료', value: kpi.resolved, color: 'bg-green-50 text-green-800', sub: '' },
          { label: '기한 초과', value: kpi.overdue, color: kpi.overdue > 0 ? 'bg-red-50 text-red-800' : 'bg-gray-50 text-gray-700', sub: '' },
        ].map(k => (
          <div key={k.label} className={`${k.color} rounded-xl p-5`}>
            <div className="text-3xl font-bold">{k.value}</div>
            <div className="text-sm mt-1 opacity-80">{k.label}</div>
            {k.sub && <div className="text-xs mt-0.5 opacity-60">{k.sub}</div>}
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="제목, 담당자, 번호 검색..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="pl-8 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-52" />
        </div>
        {[
          { label: '유형', value: filterType, setter: setFilterType, options: ['전체', ...TYPES] },
          { label: '상태', value: filterStatus, setter: setFilterStatus, options: ['전체', ...STATUSES] },
          { label: '우선순위', value: filterPriority, setter: setFilterPriority, options: ['전체', ...PRIORITIES] },
        ].map(f => (
          <select key={f.label} value={f.value} onChange={e => f.setter(e.target.value)}
            className="border border-gray-200 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
            {f.options.map(o => <option key={o}>{o}</option>)}
          </select>
        ))}
        <span className="text-xs text-gray-400 ml-auto">{filtered.length}건</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100 text-left">
              {['No', '유형', '제목', '우선순위', '상태', '담당자', '보고자', '기한', '등록일', ''].map(h => (
                <th key={h} className="px-4 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map(issue => (
              <tr key={issue.id} className={`hover:bg-gray-50 transition-colors ${isOverdue(issue) ? 'bg-red-50/30' : ''}`}>
                <td className="px-4 py-3 text-xs text-gray-400 font-mono">#{issue.no}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLOR[issue.type]}`}>
                    {TYPE_ICON[issue.type]}{issue.type}
                  </span>
                </td>
                <td className="px-4 py-3 max-w-[220px]">
                  <button onClick={() => setShowDetail(issue)}
                    className="font-medium text-gray-900 hover:text-blue-600 transition-colors text-left truncate block w-full">
                    {isOverdue(issue) && <span className="text-red-500 mr-1" title="기한 초과">!</span>}
                    {issue.title}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_COLOR[issue.priority]}`}>{issue.priority}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${STATUS_COLOR[issue.status]}`}>{issue.status}</span>
                </td>
                <td className="px-4 py-3 text-gray-700 text-xs">{issue.assigneeName}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">{issue.reporterName}</td>
                <td className={`px-4 py-3 text-xs whitespace-nowrap ${isOverdue(issue) ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                  {issue.dueDate || '—'}
                </td>
                <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">{issue.createdAt.slice(0, 10)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEdit(issue)}
                      className="text-xs text-gray-400 hover:text-blue-600 px-2 py-1 rounded hover:bg-blue-50 transition-colors">수정</button>
                    <button onClick={() => handleDelete(issue.id)}
                      className="text-xs text-gray-400 hover:text-red-500 px-2 py-1 rounded hover:bg-red-50 transition-colors">삭제</button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={10} className="text-center text-gray-400 py-12 text-sm">등록된 이슈가 없습니다.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">{editTarget ? '이슈 수정' : '이슈 등록'}</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">제목 *</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="이슈 제목" autoFocus />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">설명</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="상세 내용" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">유형</label>
                  <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as IssueType }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">우선순위</label>
                  <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value as IssuePriority }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {PRIORITIES.map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">상태</label>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as IssueStatus }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {STATUSES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">담당자</label>
                  <select value={form.assigneeId} onChange={e => handleAssigneeChange(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">미지정</option>
                    {users.map(u => <option key={u.id} value={u.id}>{u.displayName} ({u.role})</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">기한</label>
                  <input type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">보고자</label>
                <input value={form.reporterName} onChange={e => setForm(f => ({ ...f, reporterName: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="보고자 이름" />
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
              <button onClick={() => setShowForm(false)} className="btn-secondary">취소</button>
              <button onClick={handleSave} className="btn-primary">저장</button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetail && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setShowDetail(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 font-mono">#{showDetail.no}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLOR[showDetail.type]}`}>{showDetail.type}</span>
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${STATUS_COLOR[showDetail.status]}`}>{showDetail.status}</span>
              </div>
              <button onClick={() => setShowDetail(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <h3 className="text-lg font-bold text-gray-900">{showDetail.title}</h3>
              {showDetail.description && <p className="text-sm text-gray-600 whitespace-pre-line">{showDetail.description}</p>}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: '우선순위', value: showDetail.priority },
                  { label: '담당자', value: showDetail.assigneeName || '미지정' },
                  { label: '보고자', value: showDetail.reporterName },
                  { label: '기한', value: showDetail.dueDate || '—' },
                  { label: '등록일', value: showDetail.createdAt.slice(0, 10) },
                  { label: '수정일', value: showDetail.updatedAt.slice(0, 10) },
                ].map(item => (
                  <div key={item.label} className="bg-gray-50 rounded-lg p-3">
                    <div className="text-xs text-gray-400 mb-1">{item.label}</div>
                    <div className="text-sm font-medium text-gray-800">{item.value}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
              <button onClick={() => { setShowDetail(null); openEdit(showDetail); }} className="btn-secondary">수정</button>
              <button onClick={() => setShowDetail(null)} className="btn-primary">닫기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
