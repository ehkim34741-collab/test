import { useState, useEffect } from 'react';
import { Plus, Search, X, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { users } from '../data/users';

export type ActionStatus = '대기' | '진행중' | '완료' | '취소';
export type ActionPriority = '높음' | '보통' | '낮음';

export interface ActionItem {
  id: string;
  no: number;
  title: string;
  description: string;
  ownerId: string;
  ownerName: string;
  dueDate: string;
  status: ActionStatus;
  priority: ActionPriority;
  relatedType?: '이슈' | '위험';
  relatedRef?: string;
  createdAt: string;
  updatedAt: string;
  createdByName: string;
}

const STORAGE_KEY = 'pmo-action-items';
const STATUSES: ActionStatus[] = ['대기', '진행중', '완료', '취소'];
const PRIORITIES: ActionPriority[] = ['높음', '보통', '낮음'];

const STATUS_COLOR: Record<ActionStatus, string> = {
  '대기': 'bg-gray-100 text-gray-600',
  '진행중': 'bg-blue-100 text-blue-700',
  '완료': 'bg-green-100 text-green-700',
  '취소': 'bg-gray-100 text-gray-400',
};
const PRIORITY_COLOR: Record<ActionPriority, string> = {
  '높음': 'bg-red-100 text-red-700',
  '보통': 'bg-blue-100 text-blue-700',
  '낮음': 'bg-gray-100 text-gray-500',
};

function today() { return new Date().toISOString().slice(0, 10); }
function nowStr() {
  const d = new Date();
  return `${d.toISOString().slice(0, 10)} ${d.toTimeString().slice(0, 8)}`;
}

function daysDiff(date: string) {
  const diff = (new Date(date).getTime() - new Date().getTime()) / 86400000;
  return Math.ceil(diff);
}

export default function ActionItems() {
  const { currentUser } = useAuth();
  const [items, setItems] = useState<ActionItem[]>([]);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('전체');
  const [filterPriority, setFilterPriority] = useState('전체');
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<ActionItem | null>(null);
  const [form, setForm] = useState({
    title: '', description: '', ownerId: currentUser?.id || '',
    ownerName: currentUser?.displayName || '',
    dueDate: '', status: '대기' as ActionStatus, priority: '보통' as ActionPriority,
    relatedType: '' as '' | '이슈' | '위험', relatedRef: '',
  });

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) { try { setItems(JSON.parse(saved)); } catch {} }
  }, []);

  function save(updated: ActionItem[]) {
    setItems(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }

  function resetForm() {
    setForm({
      title: '', description: '', ownerId: currentUser?.id || '',
      ownerName: currentUser?.displayName || '',
      dueDate: '', status: '대기', priority: '보통', relatedType: '', relatedRef: '',
    });
  }
  function openCreate() { setEditTarget(null); resetForm(); setShowForm(true); }
  function openEdit(item: ActionItem) {
    setEditTarget(item);
    setForm({
      title: item.title, description: item.description,
      ownerId: item.ownerId, ownerName: item.ownerName,
      dueDate: item.dueDate, status: item.status, priority: item.priority,
      relatedType: item.relatedType || '', relatedRef: item.relatedRef || '',
    });
    setShowForm(true);
  }
  function handleOwnerChange(id: string) {
    const u = users.find(u => u.id === id);
    setForm(f => ({ ...f, ownerId: id, ownerName: u?.displayName || '' }));
  }
  function handleSave() {
    if (!form.title.trim()) { alert('제목을 입력해주세요.'); return; }
    if (!form.dueDate) { alert('기한을 입력해주세요.'); return; }
    const now = nowStr();
    if (editTarget) {
      save(items.map(i => i.id === editTarget.id ? {
        ...i, title: form.title, description: form.description,
        ownerId: form.ownerId, ownerName: form.ownerName,
        dueDate: form.dueDate, status: form.status, priority: form.priority,
        relatedType: form.relatedType || undefined, relatedRef: form.relatedRef || undefined,
        updatedAt: now,
      } : i));
    } else {
      const maxNo = items.length > 0 ? Math.max(...items.map(i => i.no)) : 0;
      save([...items, {
        id: `ACT-${Date.now()}`, no: maxNo + 1,
        title: form.title, description: form.description,
        ownerId: form.ownerId, ownerName: form.ownerName,
        dueDate: form.dueDate, status: form.status, priority: form.priority,
        relatedType: form.relatedType || undefined, relatedRef: form.relatedRef || undefined,
        createdAt: now, updatedAt: now,
        createdByName: currentUser?.displayName || '',
      }]);
    }
    setShowForm(false);
  }
  function handleDelete(id: string) {
    if (!confirm('액션아이템을 삭제하시겠습니까?')) return;
    save(items.filter(i => i.id !== id));
  }
  function quickStatus(item: ActionItem, status: ActionStatus) {
    save(items.map(i => i.id === item.id ? { ...i, status, updatedAt: nowStr() } : i));
  }

  const filtered = items.filter(i => {
    const matchSearch = !search || i.title.includes(search) || i.ownerName.includes(search);
    const matchStatus = filterStatus === '전체' || i.status === filterStatus;
    const matchPriority = filterPriority === '전체' || i.priority === filterPriority;
    return matchSearch && matchStatus && matchPriority;
  }).sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  const kpi = {
    total: items.length,
    pending: items.filter(i => i.status === '대기' || i.status === '진행중').length,
    done: items.filter(i => i.status === '완료').length,
    overdue: items.filter(i => i.dueDate < today() && i.status !== '완료' && i.status !== '취소').length,
  };

  const isOverdue = (item: ActionItem) =>
    item.dueDate < today() && item.status !== '완료' && item.status !== '취소';
  const isDueSoon = (item: ActionItem) => {
    const d = daysDiff(item.dueDate);
    return d >= 0 && d <= 3 && item.status !== '완료' && item.status !== '취소';
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">액션아이템</h1>
          <p className="text-gray-500 mt-1">해결해야 할 과제와 조치 사항을 관리합니다</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2 text-sm">
          <Plus size={15} />액션아이템 등록
        </button>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: '전체', value: kpi.total, color: 'bg-slate-700 text-white' },
          { label: '진행 중', value: kpi.pending, color: 'bg-blue-50 text-blue-800' },
          { label: '완료', value: kpi.done, color: 'bg-green-50 text-green-800' },
          { label: '기한 초과', value: kpi.overdue, color: kpi.overdue > 0 ? 'bg-red-50 text-red-800' : 'bg-gray-50 text-gray-700' },
        ].map(k => (
          <div key={k.label} className={`${k.color} rounded-xl p-5`}>
            <div className="text-3xl font-bold">{k.value}</div>
            <div className="text-sm mt-1 opacity-80">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="제목, 담당자 검색..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="pl-8 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-48" />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="border border-gray-200 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
          {['전체', ...STATUSES].map(s => <option key={s}>{s}</option>)}
        </select>
        <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)}
          className="border border-gray-200 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
          {['전체', ...PRIORITIES].map(p => <option key={p}>{p}</option>)}
        </select>
        <span className="text-xs text-gray-400 ml-auto">{filtered.length}건</span>
      </div>

      {/* List */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-100 p-12 text-center text-gray-400">
            <CheckCircle size={32} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">등록된 액션아이템이 없습니다.</p>
          </div>
        )}
        {filtered.map(item => {
          const overdue = isOverdue(item);
          const soon = isDueSoon(item);
          const diff = daysDiff(item.dueDate);
          return (
            <div key={item.id}
              className={`bg-white rounded-xl border shadow-sm p-4 flex items-center gap-4 transition-all ${
                overdue ? 'border-red-200 bg-red-50/20' : soon ? 'border-amber-200 bg-amber-50/20' : 'border-gray-100'
              }`}>
              {/* Status Toggle */}
              <button
                onClick={() => quickStatus(item, item.status === '완료' ? '진행중' : item.status === '진행중' ? '완료' : '진행중')}
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                  item.status === '완료' ? 'border-green-500 bg-green-500 text-white' :
                  item.status === '진행중' ? 'border-blue-400 bg-blue-50' : 'border-gray-300 bg-white hover:border-blue-400'
                }`}>
                {item.status === '완료' && <CheckCircle size={13} />}
              </button>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-xs text-gray-400 font-mono">#{item.no}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_COLOR[item.priority]}`}>{item.priority}</span>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${STATUS_COLOR[item.status]}`}>{item.status}</span>
                  {item.relatedType && item.relatedRef && (
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">{item.relatedType}: {item.relatedRef}</span>
                  )}
                </div>
                <p className={`font-medium text-sm ${item.status === '완료' ? 'line-through text-gray-400' : 'text-gray-900'}`}>{item.title}</p>
                {item.description && <p className="text-xs text-gray-500 mt-0.5 truncate">{item.description}</p>}
              </div>

              <div className="flex items-center gap-4 flex-shrink-0 text-xs text-gray-500">
                <div className="text-right">
                  <div className="font-medium text-gray-700">{item.ownerName || '미지정'}</div>
                  <div className={overdue ? 'text-red-500 font-medium' : soon ? 'text-amber-600 font-medium' : 'text-gray-400'}>
                    {overdue ? `${Math.abs(diff)}일 초과` : soon ? `D-${diff}` : item.dueDate}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(item)}
                    className="text-gray-400 hover:text-blue-600 px-2 py-1 rounded hover:bg-blue-50 transition-colors">수정</button>
                  <button onClick={() => handleDelete(item.id)}
                    className="text-gray-400 hover:text-red-500 px-2 py-1 rounded hover:bg-red-50 transition-colors">삭제</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">{editTarget ? '액션아이템 수정' : '액션아이템 등록'}</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">제목 *</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="액션아이템 제목" autoFocus />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">내용</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="상세 내용" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">우선순위</label>
                  <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value as ActionPriority }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {PRIORITIES.map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">상태</label>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as ActionStatus }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {STATUSES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">담당자 *</label>
                  <select value={form.ownerId} onChange={e => handleOwnerChange(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">미지정</option>
                    {users.map(u => <option key={u.id} value={u.id}>{u.displayName} ({u.role})</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">기한 *</label>
                  <input type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">관련 유형</label>
                  <select value={form.relatedType} onChange={e => setForm(f => ({ ...f, relatedType: e.target.value as '' | '이슈' | '위험' }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">없음</option>
                    <option>이슈</option>
                    <option>위험</option>
                  </select>
                </div>
                {form.relatedType && (
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">관련 ID/번호</label>
                    <input value={form.relatedRef} onChange={e => setForm(f => ({ ...f, relatedRef: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="예: #12, RISK-003" />
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
              <button onClick={() => setShowForm(false)} className="btn-secondary">취소</button>
              <button onClick={handleSave} className="btn-primary">저장</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
