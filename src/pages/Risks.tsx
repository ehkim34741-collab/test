import { useState, useEffect } from 'react';
import { Search, Plus, AlertTriangle, ShieldCheck, X, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

type RiskCategory = '기술' | '일정' | '비용' | '품질' | '인력' | '외부';
type RiskProbability = 1 | 2 | 3;
type RiskImpact = 1 | 2 | 3;
type RiskStatus = '식별' | '분석중' | '대응중' | '완료' | '수용';

interface Risk {
  id: string;
  title: string;
  description: string;
  category: RiskCategory;
  probability: RiskProbability;
  impact: RiskImpact;
  status: RiskStatus;
  owner: string;
  mitigation: string;
  identifiedDate: string;
  reviewDate: string;
  createdAt: string;
}

const STORAGE_KEY = 'pmo-risks';

const probLabel: Record<RiskProbability, string> = { 1: '낮음', 2: '보통', 3: '높음' };
const impactLabel: Record<RiskImpact, string> = { 1: '낮음', 2: '보통', 3: '높음' };

function riskLevel(prob: RiskProbability, impact: RiskImpact) {
  const score = prob * impact;
  if (score >= 6) return { label: '고위험', color: 'bg-red-100 text-red-700', dot: 'bg-red-500' };
  if (score >= 3) return { label: '중위험', color: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' };
  return { label: '저위험', color: 'bg-green-100 text-green-700', dot: 'bg-green-500' };
}

const statusColors: Record<RiskStatus, string> = {
  '식별': 'bg-gray-100 text-gray-700',
  '분석중': 'bg-blue-100 text-blue-700',
  '대응중': 'bg-orange-100 text-orange-700',
  '완료': 'bg-green-100 text-green-700',
  '수용': 'bg-purple-100 text-purple-700',
};

const categories: RiskCategory[] = ['기술', '일정', '비용', '품질', '인력', '외부'];
const statuses: RiskStatus[] = ['식별', '분석중', '대응중', '완료', '수용'];

function newId() {
  return 'R' + Date.now().toString(36).toUpperCase();
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function load(): Risk[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function save(data: Risk[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

const emptyForm = (ownerName: string): Omit<Risk, 'id' | 'createdAt'> => ({
  title: '',
  description: '',
  category: '기술',
  probability: 2,
  impact: 2,
  status: '식별',
  owner: ownerName,
  mitigation: '',
  identifiedDate: today(),
  reviewDate: '',
});

export default function Risks() {
  const { currentUser } = useAuth();
  const [risks, setRisks] = useState<Risk[]>(load);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<RiskCategory | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<RiskStatus | 'all'>('all');
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Risk | null>(null);
  const [form, setForm] = useState(emptyForm(currentUser?.displayName ?? ''));

  useEffect(() => { save(risks); }, [risks]);

  const filtered = risks.filter(r => {
    if (categoryFilter !== 'all' && r.category !== categoryFilter) return false;
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    if (search && !r.title.includes(search) && !r.owner.includes(search) && !r.description.includes(search)) return false;
    return true;
  });

  const highCount = risks.filter(r => r.probability * r.impact >= 6).length;
  const midCount = risks.filter(r => { const s = r.probability * r.impact; return s >= 3 && s < 6; }).length;
  const openCount = risks.filter(r => r.status !== '완료' && r.status !== '수용').length;

  function openCreate() {
    setEditTarget(null);
    setForm(emptyForm(currentUser?.displayName ?? ''));
    setShowModal(true);
  }

  function openEdit(r: Risk) {
    setEditTarget(r);
    const { id, createdAt, ...rest } = r;
    setForm(rest);
    setShowModal(true);
  }

  function handleSave() {
    if (!form.title.trim()) return;
    if (editTarget) {
      setRisks(prev => prev.map(r => r.id === editTarget.id ? { ...r, ...form } : r));
    } else {
      const newRisk: Risk = { ...form, id: newId(), createdAt: new Date().toISOString() };
      setRisks(prev => [newRisk, ...prev]);
    }
    setShowModal(false);
  }

  function handleDelete(id: string) {
    if (confirm('이 위험을 삭제하시겠습니까?')) {
      setRisks(prev => prev.filter(r => r.id !== id));
    }
  }

  function f(key: keyof typeof form, val: unknown) {
    setForm(prev => ({ ...prev, [key]: val }));
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">위험 관리</h1>
          <p className="text-gray-500 mt-1">총 {risks.length}개 위험 등록</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors">
          <Plus size={16} />
          위험 등록
        </button>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: '전체', value: risks.length, color: 'text-gray-700', bg: 'bg-gray-50', icon: AlertTriangle },
          { label: '고위험', value: highCount, color: 'text-red-700', bg: 'bg-red-50', icon: AlertTriangle },
          { label: '중위험', value: midCount, color: 'text-amber-700', bg: 'bg-amber-50', icon: AlertTriangle },
          { label: '미완료', value: openCount, color: 'text-blue-700', bg: 'bg-blue-50', icon: ShieldCheck },
        ].map(card => {
          const Icon = card.icon;
          return (
            <div key={card.label} className={`${card.bg} rounded-xl p-5`}>
              <div className="flex items-center gap-2 mb-1">
                <Icon size={16} className={card.color} />
                <span className="text-sm text-gray-600">{card.label}</span>
              </div>
              <div className={`text-3xl font-bold ${card.color}`}>{card.value}</div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="위험명, 담당자 검색..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {(['all', ...categories] as const).map(c => (
            <button key={c} onClick={() => setCategoryFilter(c)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${categoryFilter === c ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {c === 'all' ? '전체 분류' : c}
            </button>
          ))}
        </div>
        <div className="flex gap-2 flex-wrap">
          {(['all', ...statuses] as const).map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${statusFilter === s ? 'bg-slate-700 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {s === 'all' ? '전체 상태' : s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-gray-400 text-sm">등록된 위험이 없습니다.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">위험</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">분류</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">발생 가능성</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">영향도</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">위험 수준</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">상태</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">담당자</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">검토일</th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(risk => {
                  const rl = riskLevel(risk.probability, risk.impact);
                  return (
                    <tr key={risk.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{risk.title}</div>
                        <div className="text-xs text-gray-500 mt-0.5 max-w-xs truncate">{risk.description}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">{risk.category}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${risk.probability === 3 ? 'bg-red-100 text-red-700' : risk.probability === 2 ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                          {probLabel[risk.probability]}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${risk.impact === 3 ? 'bg-red-100 text-red-700' : risk.impact === 2 ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                          {impactLabel[risk.impact]}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${rl.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${rl.dot}`} />
                          {rl.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[risk.status]}`}>
                          {risk.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">{risk.owner}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{risk.reviewDate || '-'}</td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button onClick={() => openEdit(risk)} className="text-xs text-blue-600 hover:underline">수정</button>
                          <button onClick={() => handleDelete(risk.id)} className="text-xs text-red-500 hover:underline">삭제</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">{editTarget ? '위험 수정' : '위험 등록'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1.5">위험명 *</label>
                <input value={form.title} onChange={e => f('title', e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="위험명 입력" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1.5">설명</label>
                <textarea value={form.description} onChange={e => f('description', e.target.value)}
                  rows={2}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="위험 상세 설명" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1.5">분류</label>
                  <div className="relative">
                    <select value={form.category} onChange={e => f('category', e.target.value as RiskCategory)}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none">
                      {categories.map(c => <option key={c}>{c}</option>)}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1.5">상태</label>
                  <div className="relative">
                    <select value={form.status} onChange={e => f('status', e.target.value as RiskStatus)}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none">
                      {statuses.map(s => <option key={s}>{s}</option>)}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1.5">발생 가능성</label>
                  <div className="relative">
                    <select value={form.probability} onChange={e => f('probability', Number(e.target.value) as RiskProbability)}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none">
                      <option value={1}>1 - 낮음</option>
                      <option value={2}>2 - 보통</option>
                      <option value={3}>3 - 높음</option>
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1.5">영향도</label>
                  <div className="relative">
                    <select value={form.impact} onChange={e => f('impact', Number(e.target.value) as RiskImpact)}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none">
                      <option value={1}>1 - 낮음</option>
                      <option value={2}>2 - 보통</option>
                      <option value={3}>3 - 높음</option>
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1.5">담당자</label>
                <input value={form.owner} onChange={e => f('owner', e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="담당자명" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1.5">대응 방안</label>
                <textarea value={form.mitigation} onChange={e => f('mitigation', e.target.value)}
                  rows={2}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="위험 대응 방안" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1.5">식별일</label>
                  <input type="date" value={form.identifiedDate} onChange={e => f('identifiedDate', e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1.5">검토일</label>
                  <input type="date" value={form.reviewDate} onChange={e => f('reviewDate', e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 pb-6">
              <button onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                취소
              </button>
              <button onClick={handleSave} disabled={!form.title.trim()}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors disabled:opacity-50">
                {editTarget ? '수정 완료' : '등록'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
