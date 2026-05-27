import { useState, useRef } from 'react';
import type { ReactElement } from 'react';
import {
  Plus, Search, Upload, Download, X, ChevronDown, ChevronUp,
  FileText, Monitor, Database, Clock, CheckCircle, AlertCircle,
  RotateCcw, History, Eye,
} from 'lucide-react';
import { designs as initialDesigns } from '../data/designData';
import { projects } from '../data/mockData';
import type {
  Design, DesignStatus, CustomerReviewStatus, DesignType, DesignPhase, DesignVersion,
} from '../types/design';

// ────────────── 상수 ──────────────
const DESIGN_TYPES: DesignType[] = ['요구사항 정의서', '화면 설계서', '데이터베이스 설계서'];
const PHASES: DesignPhase[] = ['분석', '설계', '구현', '테스트', '이행'];

const STATUS_FLOW: DesignStatus[] = ['작성중', '검토중', '승인완료', '반려'];
const STATUS_STYLE: Record<DesignStatus, string> = {
  '작성중': 'bg-gray-100 text-gray-700',
  '검토중': 'bg-blue-100 text-blue-700',
  '승인완료': 'bg-green-100 text-green-700',
  '반려': 'bg-red-100 text-red-700',
};
const CR_STYLE: Record<CustomerReviewStatus, string> = {
  '검토전': 'bg-gray-100 text-gray-500',
  '검토중': 'bg-purple-100 text-purple-700',
  '승인': 'bg-green-100 text-green-700',
  '반려': 'bg-red-100 text-red-700',
};
const TYPE_ICON: Record<DesignType, ReactElement> = {
  '요구사항 정의서': <FileText size={14} />,
  '화면 설계서': <Monitor size={14} />,
  '데이터베이스 설계서': <Database size={14} />,
};

function nextVersion(ver: string): string {
  const m = ver.match(/^v(\d+)\.(\d+)$/);
  if (!m) return 'v1.1';
  return `v${m[1]}.${parseInt(m[2]) + 1}`;
}
function today() { return new Date().toISOString().slice(0, 10); }

// ────────────── 빈 폼 ──────────────
function emptyForm(): Omit<Design, 'id' | 'versions' | 'createdAt' | 'updatedAt'> {
  return {
    name: '', type: '요구사항 정의서', projectId: '', projectName: '',
    phase: '분석', manager: '', plannedStart: '', plannedEnd: '',
    status: '작성중', customerReviewer: '', customerReviewStatus: '검토전',
    relatedRequirementIds: [], currentVersion: 'v1.0',
  };
}

export default function Designs() {
  const [data, setData] = useState<Design[]>(initialDesigns);
  const [search, setSearch] = useState('');
  const [filterProject, setFilterProject] = useState('전체');
  const [filterPhase, setFilterPhase] = useState('전체');
  const [filterStatus, setFilterStatus] = useState('전체');
  const [filterType, setFilterType] = useState('전체');

  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Design | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [reqInput, setReqInput] = useState('');

  const [detailTarget, setDetailTarget] = useState<Design | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  // 파일 업로드
  const fileRef = useRef<HTMLInputElement>(null);
  const [pendingFile, setPendingFile] = useState<{ name: string; size: string; data: string } | null>(null);
  const [fileNote, setFileNote] = useState('');

  // ── 필터 ──
  const filtered = data.filter(d => {
    const matchProject = filterProject === '전체' || d.projectName === filterProject;
    const matchPhase = filterPhase === '전체' || d.phase === filterPhase;
    const matchStatus = filterStatus === '전체' || d.status === filterStatus;
    const matchType = filterType === '전체' || d.type === filterType;
    const matchSearch = !search ||
      d.name.includes(search) || d.manager.includes(search) ||
      d.id.includes(search) || d.relatedRequirementIds.some(r => r.includes(search));
    return matchProject && matchPhase && matchStatus && matchType && matchSearch;
  });

  // ── KPI ──
  const kpi = {
    total: data.length,
    approved: data.filter(d => d.status === '승인완료').length,
    inReview: data.filter(d => d.status === '검토중').length,
    rejected: data.filter(d => d.status === '반려').length,
    writing: data.filter(d => d.status === '작성중').length,
  };

  // ── 폼 열기 ──
  function openCreate() {
    setEditTarget(null);
    setForm(emptyForm());
    setPendingFile(null);
    setFileNote('');
    setReqInput('');
    setShowForm(true);
  }
  function openEdit(d: Design) {
    setEditTarget(d);
    setForm({
      name: d.name, type: d.type, projectId: d.projectId, projectName: d.projectName,
      phase: d.phase, manager: d.manager, plannedStart: d.plannedStart, plannedEnd: d.plannedEnd,
      actualEnd: d.actualEnd, status: d.status, customerReviewer: d.customerReviewer,
      customerReviewStatus: d.customerReviewStatus, relatedRequirementIds: [...d.relatedRequirementIds],
      currentVersion: d.currentVersion,
    });
    setPendingFile(null);
    setFileNote('');
    setReqInput('');
    setShowForm(true);
  }

  // ── 파일 처리 ──
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const data = ev.target?.result as string;
      setPendingFile({
        name: file.name,
        size: `${(file.size / 1024 / 1024).toFixed(1)}MB`,
        data,
      });
    };
    reader.readAsDataURL(file);
  }

  // ── 저장 ──
  function handleSave() {
    if (!form.name || !form.projectId || !form.manager || !form.plannedStart || !form.plannedEnd) {
      alert('필수 항목을 입력해주세요.');
      return;
    }
    const now = today();

    if (editTarget) {
      // 수정: 파일 있으면 새 버전 추가
      const updatedVersions: DesignVersion[] = [...editTarget.versions];
      let newVersion = editTarget.currentVersion;
      if (pendingFile) {
        newVersion = nextVersion(editTarget.currentVersion);
        updatedVersions.push({
          version: newVersion,
          fileName: pendingFile.name,
          fileSize: pendingFile.size,
          fileData: pendingFile.data,
          uploadedAt: now,
          uploadedBy: form.manager,
          note: fileNote || '업데이트',
        });
      }
      setData(prev => prev.map(d => d.id === editTarget.id ? {
        ...d, ...form,
        currentVersion: newVersion,
        versions: updatedVersions,
        updatedAt: now,
      } : d));
    } else {
      // 신규
      const versions: DesignVersion[] = [];
      if (pendingFile) {
        versions.push({
          version: form.currentVersion,
          fileName: pendingFile.name,
          fileSize: pendingFile.size,
          fileData: pendingFile.data,
          uploadedAt: now,
          uploadedBy: form.manager,
          note: fileNote || '최초 등록',
        });
      }
      const newId = `D${String(data.length + 1).padStart(3, '0')}`;
      setData(prev => [...prev, {
        ...form, id: newId, versions, createdAt: now, updatedAt: now,
      } as Design]);
    }
    setShowForm(false);
  }

  // ── 다운로드 ──
  function handleDownload(ver: DesignVersion) {
    if (!ver.fileData) { alert('저장된 파일이 없습니다.'); return; }
    const a = document.createElement('a');
    a.href = ver.fileData;
    a.download = ver.fileName;
    a.click();
  }

  // ── 상태 뱃지 ──
  function StatusBadge({ s }: { s: DesignStatus }) {
    return <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLE[s]}`}>{s}</span>;
  }
  function CRBadge({ s }: { s: CustomerReviewStatus }) {
    return <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${CR_STYLE[s]}`}>{s}</span>;
  }

  const projectNames = ['전체', ...Array.from(new Set(data.map(d => d.projectName)))];

  return (
    <div className="p-8">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">설계산출물 관리</h1>
          <p className="text-gray-500 mt-1">프로젝트 단계별 설계 산출물 현황 및 승인 관리</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus size={16} />산출물 등록
        </button>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        {[
          { label: '전체', value: kpi.total, color: 'bg-slate-700 text-white' },
          { label: '작성중', value: kpi.writing, color: 'bg-gray-100 text-gray-700' },
          { label: '검토중', value: kpi.inReview, color: 'bg-blue-50 text-blue-700' },
          { label: '승인완료', value: kpi.approved, color: 'bg-green-50 text-green-700' },
          { label: '반려', value: kpi.rejected, color: 'bg-red-50 text-red-700' },
        ].map(k => (
          <div key={k.label} className={`${k.color} rounded-xl p-5`}>
            <div className="text-3xl font-bold">{k.value}</div>
            <div className="text-sm mt-1 opacity-80">{k.label}</div>
          </div>
        ))}
      </div>

      {/* 필터 */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text" placeholder="설계명, 담당자, 요구사항ID..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="pl-8 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-56"
          />
        </div>
        {[
          { label: '프로젝트', value: filterProject, setter: setFilterProject, options: projectNames },
          { label: '단계', value: filterPhase, setter: setFilterPhase, options: ['전체', ...PHASES] },
          { label: '상태', value: filterStatus, setter: setFilterStatus, options: ['전체', ...STATUS_FLOW] },
          { label: '유형', value: filterType, setter: setFilterType, options: ['전체', ...DESIGN_TYPES] },
        ].map(f => (
          <select
            key={f.label}
            value={f.value}
            onChange={e => f.setter(e.target.value)}
            className="border border-gray-200 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            {f.options.map(o => <option key={o}>{o}</option>)}
          </select>
        ))}
        <span className="text-xs text-gray-400 ml-auto">{filtered.length}건</span>
      </div>

      {/* 테이블 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left border-b border-gray-100">
                {['설계ID', '산출물명', '유형', '단계', '담당자', '계획일정', '버전', '상태', '고객검토자', '고객검토상태', '관련요구사항', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(d => (
                <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-xs text-gray-400 font-mono">{d.id}</td>
                  <td className="px-4 py-3 font-medium text-gray-900 max-w-[200px]">
                    <div className="flex items-center gap-1.5">
                      <span className="text-gray-400">{TYPE_ICON[d.type]}</span>
                      <span className="truncate">{d.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">{d.type}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">{d.phase}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{d.manager}</td>
                  <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                    {d.plannedStart.replace(/-/g, '.')} ~ {d.plannedEnd.replace(/-/g, '.')}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-mono">{d.currentVersion}</span>
                  </td>
                  <td className="px-4 py-3"><StatusBadge s={d.status} /></td>
                  <td className="px-4 py-3 text-gray-700">{d.customerReviewer}</td>
                  <td className="px-4 py-3"><CRBadge s={d.customerReviewStatus} /></td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {d.relatedRequirementIds.slice(0, 2).join(', ')}
                    {d.relatedRequirementIds.length > 2 && ` +${d.relatedRequirementIds.length - 2}`}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => { setDetailTarget(d); setShowHistory(false); }}
                        className="text-gray-400 hover:text-blue-600 transition-colors" title="상세보기">
                        <Eye size={15} />
                      </button>
                      <button onClick={() => openEdit(d)}
                        className="text-gray-400 hover:text-blue-600 transition-colors" title="수정">
                        <Upload size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={12} className="text-center text-gray-400 py-12 text-sm">조회된 산출물이 없습니다.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ──────── 등록/수정 모달 ──────── */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">{editTarget ? '설계산출물 수정' : '설계산출물 등록'}</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>

            <div className="p-6 space-y-5">
              {/* 기본 정보 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-xs font-medium text-gray-500 mb-1 block">산출물명 *</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="예: 통합 플랫폼 화면 설계서" />
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">산출물 유형 *</label>
                  <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as DesignType }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {DESIGN_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">프로젝트 *</label>
                  <select value={form.projectId}
                    onChange={e => {
                      const p = projects.find(p => p.id === e.target.value);
                      setForm(f => ({ ...f, projectId: e.target.value, projectName: p?.name || '' }));
                    }}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">-- 선택 --</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">단계 *</label>
                  <select value={form.phase} onChange={e => setForm(f => ({ ...f, phase: e.target.value as DesignPhase }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {PHASES.map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">담당자 *</label>
                  <input value={form.manager} onChange={e => setForm(f => ({ ...f, manager: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="담당자명" />
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">계획 시작일 *</label>
                  <input type="date" value={form.plannedStart} onChange={e => setForm(f => ({ ...f, plannedStart: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">계획 종료일 *</label>
                  <input type="date" value={form.plannedEnd} onChange={e => setForm(f => ({ ...f, plannedEnd: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">상태</label>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as DesignStatus }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {STATUS_FLOW.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              {/* 고객 검토 */}
              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100">
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">고객 검토자</label>
                  <input value={form.customerReviewer} onChange={e => setForm(f => ({ ...f, customerReviewer: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="고객사 검토자명" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">고객 검토 상태</label>
                  <select value={form.customerReviewStatus}
                    onChange={e => setForm(f => ({ ...f, customerReviewStatus: e.target.value as CustomerReviewStatus }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {(['검토전', '검토중', '승인', '반려'] as CustomerReviewStatus[]).map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              {/* 관련 요구사항 */}
              <div className="pt-2 border-t border-gray-100">
                <label className="text-xs font-medium text-gray-500 mb-2 block">관련 요구사항 ID</label>
                <div className="flex gap-2 mb-2">
                  <input value={reqInput} onChange={e => setReqInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && reqInput.trim()) {
                        setForm(f => ({ ...f, relatedRequirementIds: [...f.relatedRequirementIds, reqInput.trim()] }));
                        setReqInput('');
                      }
                    }}
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="REQ-001 입력 후 Enter" />
                  <button onClick={() => {
                    if (reqInput.trim()) {
                      setForm(f => ({ ...f, relatedRequirementIds: [...f.relatedRequirementIds, reqInput.trim()] }));
                      setReqInput('');
                    }
                  }} className="btn-secondary">추가</button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {form.relatedRequirementIds.map(id => (
                    <span key={id} className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full">
                      {id}
                      <button onClick={() => setForm(f => ({ ...f, relatedRequirementIds: f.relatedRequirementIds.filter(r => r !== id) }))}>
                        <X size={10} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* 파일 업로드 */}
              <div className="pt-2 border-t border-gray-100">
                <label className="text-xs font-medium text-gray-500 mb-2 block">
                  파일 첨부 {editTarget && <span className="text-blue-500">(업로드 시 새 버전 {nextVersion(editTarget.currentVersion)} 생성)</span>}
                </label>
                <div
                  onClick={() => fileRef.current?.click()}
                  className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
                >
                  {pendingFile ? (
                    <div className="flex items-center justify-center gap-2 text-sm text-green-700">
                      <CheckCircle size={16} />
                      <span>{pendingFile.name} ({pendingFile.size})</span>
                      <button onClick={e => { e.stopPropagation(); setPendingFile(null); }} className="text-red-400 hover:text-red-600">
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-400">
                      <Upload size={20} className="mx-auto mb-1 text-gray-300" />
                      클릭하여 파일 선택
                    </div>
                  )}
                </div>
                <input ref={fileRef} type="file" className="hidden" onChange={handleFileChange} />
                {pendingFile && (
                  <input value={fileNote} onChange={e => setFileNote(e.target.value)}
                    className="mt-2 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="버전 변경 내용 (예: 고객 검토 의견 반영)" />
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

      {/* ──────── 상세보기 모달 ──────── */}
      {detailTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          onClick={() => setDetailTarget(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-gray-400 font-mono">{detailTarget.id}</span>
                  <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-mono">{detailTarget.currentVersion}</span>
                </div>
                <h2 className="text-lg font-bold text-gray-900">{detailTarget.name}</h2>
              </div>
              <button onClick={() => setDetailTarget(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>

            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4 text-sm">
                {[
                  { label: '산출물 유형', value: detailTarget.type },
                  { label: '프로젝트', value: detailTarget.projectName },
                  { label: '단계', value: detailTarget.phase },
                  { label: '담당자', value: detailTarget.manager },
                  { label: '계획 시작일', value: detailTarget.plannedStart.replace(/-/g, '.') },
                  { label: '계획 종료일', value: detailTarget.plannedEnd.replace(/-/g, '.') },
                  { label: '상태', value: detailTarget.status },
                  { label: '고객 검토자', value: detailTarget.customerReviewer },
                  { label: '고객 검토 상태', value: detailTarget.customerReviewStatus },
                  { label: '관련 요구사항', value: detailTarget.relatedRequirementIds.join(', ') || '-' },
                ].map(item => (
                  <div key={item.label}>
                    <div className="text-xs text-gray-400 mb-0.5">{item.label}</div>
                    <div className="font-medium text-gray-800">{item.value}</div>
                  </div>
                ))}
              </div>

              {/* 버전 이력 */}
              <div className="border-t border-gray-100 pt-4">
                <button
                  onClick={() => setShowHistory(h => !h)}
                  className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3 hover:text-blue-600"
                >
                  <History size={15} />
                  버전 이력 ({detailTarget.versions.length}건)
                  {showHistory ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>

                {showHistory && (
                  <div className="space-y-2">
                    {detailTarget.versions.length === 0 && (
                      <div className="text-sm text-gray-400 text-center py-4">첨부된 파일이 없습니다.</div>
                    )}
                    {[...detailTarget.versions].reverse().map(ver => (
                      <div key={ver.version} className="flex items-center gap-3 bg-gray-50 rounded-lg px-4 py-3">
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-mono font-bold w-14 text-center">
                          {ver.version}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-800 truncate">{ver.fileName}</div>
                          <div className="text-xs text-gray-400">{ver.uploadedAt} · {ver.uploadedBy} · {ver.fileSize}</div>
                          {ver.note && <div className="text-xs text-gray-500 mt-0.5">{ver.note}</div>}
                        </div>
                        <button
                          onClick={() => handleDownload(ver)}
                          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 transition-colors flex-shrink-0"
                        >
                          <Download size={13} />다운로드
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
              <button onClick={() => { setDetailTarget(null); openEdit(detailTarget); }} className="btn-secondary flex items-center gap-1">
                <Upload size={14} />수정
              </button>
              <button onClick={() => setDetailTarget(null)} className="btn-primary">닫기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
