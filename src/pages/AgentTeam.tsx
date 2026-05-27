import { useState, useEffect } from 'react';
import {
  Crown, PenTool, Code, Bug, Plus, CheckCircle, XCircle,
  Clock, X, ThumbsUp, ThumbsDown, FileText, AlertCircle,
  RotateCcw, ChevronDown, ChevronUp, Shield,
} from 'lucide-react';

type Stage = 'planning' | 'developing' | 'testing' | 'review' | 'approved' | 'rejected';
type Priority = 'high' | 'medium' | 'low';

interface TaskLog {
  role: '리더' | '기획자' | '개발자' | '테스터' | '사용자';
  msg: string;
  at: string;
}

interface AgentTask {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  createdAt: string;
  stage: Stage;
  planSpec?: string;
  planCriteria?: string;
  planAt?: string;
  devNote?: string;
  devAt?: string;
  testResult?: string;
  testPassed?: boolean;
  testAt?: string;
  userAction?: '승인' | '반려';
  userComment?: string;
  reviewAt?: string;
  log: TaskLog[];
}

const STORAGE_KEY = 'pmo-agent-tasks';

const AGENTS = [
  { role: '리더' as const, name: '김대표', Icon: Crown, bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200', desc: '전체 프로세스 모니터링 및 감독' },
  { role: '기획자' as const, name: '이기획', Icon: PenTool, bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200', desc: '요구사항 분석 및 기능 사양 작성' },
  { role: '개발자' as const, name: '박개발', Icon: Code, bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200', desc: '기능 사양 기반 구현' },
  { role: '테스터' as const, name: '최테스터', Icon: Bug, bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200', desc: '구현 결과 검증 및 테스트' },
];

const STAGE_LABEL: Record<Stage, string> = {
  planning: '기획 분석중', developing: '개발중', testing: '테스트중',
  review: '사용자 검토 대기', approved: '승인완료', rejected: '반려',
};
const STAGE_COLOR: Record<Stage, string> = {
  planning: 'bg-blue-100 text-blue-700',
  developing: 'bg-green-100 text-green-700',
  testing: 'bg-amber-100 text-amber-700',
  review: 'bg-purple-100 text-purple-700',
  approved: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-red-100 text-red-700',
};
const PRIORITY_LABEL: Record<Priority, string> = { high: '높음', medium: '보통', low: '낮음' };
const PRIORITY_COLOR: Record<Priority, string> = {
  high: 'bg-red-100 text-red-700', medium: 'bg-blue-100 text-blue-700', low: 'bg-gray-100 text-gray-600',
};

const STAGE_ORDER: Stage[] = ['planning', 'developing', 'testing', 'review'];

function nowStr() {
  const d = new Date();
  return `${d.toISOString().slice(0, 10)} ${d.toTimeString().slice(0, 8)}`;
}

export default function AgentTeam() {
  const [tasks, setTasks] = useState<AgentTask[]>([]);

  const [showNewForm, setShowNewForm] = useState(false);
  const [showStageModal, setShowStageModal] = useState<{ task: AgentTask; stage: 'planning' | 'developing' | 'testing' } | null>(null);
  const [showReviewModal, setShowReviewModal] = useState<AgentTask | null>(null);
  const [showDetailModal, setShowDetailModal] = useState<AgentTask | null>(null);
  const [expandedHistory, setExpandedHistory] = useState<Set<string>>(new Set());

  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPriority, setNewPriority] = useState<Priority>('medium');

  const [stageOut1, setStageOut1] = useState('');
  const [stageOut2, setStageOut2] = useState('');
  const [stagePassed, setStagePassed] = useState(true);

  const [reviewAction, setReviewAction] = useState<'승인' | '반려'>('승인');
  const [reviewComment, setReviewComment] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) { try { setTasks(JSON.parse(saved)); } catch {} }
  }, []);

  function save(updated: AgentTask[]) {
    setTasks(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }

  function addTask() {
    if (!newTitle.trim()) { alert('요구사항 제목을 입력해주세요.'); return; }
    const now = nowStr();
    const t: AgentTask = {
      id: `REQ-${Date.now()}`,
      title: newTitle.trim(), description: newDesc.trim(),
      priority: newPriority, createdAt: now, stage: 'planning',
      log: [
        { role: '사용자', msg: `요구사항 등록: "${newTitle.trim()}"`, at: now },
        { role: '리더', msg: '기획자에게 요구사항 분석 지시', at: now },
        { role: '기획자', msg: '요구사항 분석 시작', at: now },
      ],
    };
    save([...tasks, t]);
    setShowNewForm(false); setNewTitle(''); setNewDesc(''); setNewPriority('medium');
  }

  function completeStage() {
    if (!showStageModal) return;
    const { task, stage } = showStageModal;
    const now = nowStr();

    if (stage === 'planning' && !stageOut1.trim()) { alert('기능 사양을 입력해주세요.'); return; }
    if (stage === 'developing' && !stageOut1.trim()) { alert('구현 내용을 입력해주세요.'); return; }
    if (stage === 'testing' && !stageOut1.trim()) { alert('테스트 결과를 입력해주세요.'); return; }

    const updates: Partial<AgentTask> = {};
    const logs: TaskLog[] = [];

    if (stage === 'planning') {
      updates.planSpec = stageOut1; updates.planCriteria = stageOut2; updates.planAt = now;
      updates.stage = 'developing';
      logs.push(
        { role: '기획자', msg: '기능 사양 및 인수기준 작성 완료', at: now },
        { role: '리더', msg: '기획 산출물 검토 후 개발팀 이관 승인', at: now },
        { role: '개발자', msg: '개발 시작', at: now },
      );
    } else if (stage === 'developing') {
      updates.devNote = stageOut1; updates.devAt = now;
      updates.stage = 'testing';
      logs.push(
        { role: '개발자', msg: '구현 완료, 테스트팀 이관', at: now },
        { role: '리더', msg: '개발 완료 확인, 테스트팀에 이관 지시', at: now },
        { role: '테스터', msg: '테스트 시작', at: now },
      );
    } else if (stage === 'testing') {
      updates.testResult = stageOut1; updates.testPassed = stagePassed; updates.testAt = now;
      if (stagePassed) {
        updates.stage = 'review';
        logs.push(
          { role: '테스터', msg: `테스트 통과. ${stageOut1}`, at: now },
          { role: '리더', msg: '테스트 통과 확인, 사용자 최종 검토 요청', at: now },
        );
      } else {
        updates.stage = 'developing';
        updates.testPassed = false;
        logs.push(
          { role: '테스터', msg: `테스트 실패: ${stageOut1}`, at: now },
          { role: '리더', msg: '테스트 실패, 개발팀 재작업 지시', at: now },
          { role: '개발자', msg: '재작업 시작', at: now },
        );
      }
    }

    save(tasks.map(t => t.id === task.id ? { ...t, ...updates, log: [...t.log, ...logs] } : t));
    setShowStageModal(null); setStageOut1(''); setStageOut2(''); setStagePassed(true);
  }

  function submitReview() {
    if (!showReviewModal) return;
    if (reviewAction === '반려' && !reviewComment.trim()) { alert('반려 사유를 입력해주세요.'); return; }
    const now = nowStr();
    save(tasks.map(t => t.id === showReviewModal.id ? {
      ...t,
      stage: reviewAction === '승인' ? 'approved' : 'rejected',
      userAction: reviewAction, userComment: reviewComment, reviewAt: now,
      log: [...t.log,
        { role: '사용자', msg: `${reviewAction}: ${reviewComment || '(코멘트 없음)'}`, at: now },
        { role: '리더', msg: `${reviewAction} 완료. 워크플로우 종료.`, at: now },
      ],
    } : t));
    setShowReviewModal(null); setReviewAction('승인'); setReviewComment('');
  }

  const activeTasks = tasks.filter(t => t.stage !== 'approved' && t.stage !== 'rejected');
  const historyTasks = [...tasks.filter(t => t.stage === 'approved' || t.stage === 'rejected')].reverse();

  function toggleHistory(id: string) {
    setExpandedHistory(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">에이전트 팀</h1>
          <p className="text-gray-500 mt-1">기획 → 개발 → 테스트 → 사용자 승인의 요구사항 처리 워크플로우</p>
        </div>
        <button onClick={() => setShowNewForm(true)} className="btn-primary flex items-center gap-2 text-sm">
          <Plus size={15} />요구사항 등록
        </button>
      </div>

      {/* Agent Cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {AGENTS.map(a => {
          const Icon = a.Icon;
          const myTasks = a.role === '리더'
            ? activeTasks
            : activeTasks.filter(t => {
                if (a.role === '기획자') return t.stage === 'planning';
                if (a.role === '개발자') return t.stage === 'developing';
                if (a.role === '테스터') return t.stage === 'testing';
                return false;
              });
          return (
            <div key={a.role} className={`bg-white rounded-xl border ${a.border} p-5 shadow-sm`}>
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${a.bg} ${a.text}`}>
                  <Icon size={18} />
                </div>
                <div>
                  <div className="font-semibold text-gray-800 text-sm">{a.name}</div>
                  <div className="text-xs text-gray-500">{a.role}</div>
                </div>
              </div>
              <p className="text-xs text-gray-400 mb-3">{a.desc}</p>
              <div className={`text-xs font-medium px-2 py-1 rounded-full inline-flex items-center gap-1 ${a.bg} ${a.text}`}>
                {a.role === '리더' ? `전체 진행: ${myTasks.length}건` : `담당: ${myTasks.length}건`}
              </div>
              {myTasks.slice(0, 2).map(t => (
                <div key={t.id} className="mt-1.5 text-xs bg-gray-50 rounded px-2 py-1 text-gray-600 truncate">{t.title}</div>
              ))}
              {myTasks.length > 2 && <div className="text-xs text-gray-400 mt-1">+{myTasks.length - 2}건 더</div>}
            </div>
          );
        })}
      </div>

      {/* Active Tasks */}
      <div className="mb-8">
        <h2 className="text-base font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <Clock size={16} className="text-blue-500" />진행 중인 요구사항
          <span className="text-xs font-normal text-gray-400">({activeTasks.length}건)</span>
        </h2>
        {activeTasks.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-12 text-center text-gray-400">
            <FileText size={32} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">진행 중인 요구사항이 없습니다.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeTasks.map(task => {
              const stageIdx = STAGE_ORDER.indexOf(task.stage as typeof STAGE_ORDER[number]);
              return (
                <div key={task.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                  <div className="flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="text-xs text-gray-400 font-mono">{task.id}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_COLOR[task.priority]}`}>{PRIORITY_LABEL[task.priority]}</span>
                        <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${STAGE_COLOR[task.stage]}`}>{STAGE_LABEL[task.stage]}</span>
                      </div>
                      <h3 className="font-semibold text-gray-900">{task.title}</h3>
                      {task.description && <p className="text-sm text-gray-500 mt-1 line-clamp-1">{task.description}</p>}
                      {/* Progress Steps */}
                      <div className="flex items-center gap-0 mt-3">
                        {STAGE_ORDER.map((s, i) => {
                          const isDone = i < stageIdx;
                          const isCurrent = s === task.stage;
                          return (
                            <div key={s} className="flex items-center">
                              <div title={STAGE_LABEL[s]}
                                className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold transition-colors ${
                                  isDone ? 'bg-green-500 text-white' : isCurrent ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-400'
                                }`}>
                                {isDone ? '✓' : i + 1}
                              </div>
                              {i < 3 && <div className={`w-8 h-0.5 ${isDone ? 'bg-green-300' : 'bg-gray-200'}`} />}
                            </div>
                          );
                        })}
                        <div className="ml-3 text-xs text-gray-500 whitespace-nowrap hidden sm:block">
                          {['기획', '개발', '테스트', '검토'][Math.min(stageIdx, 3)]}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 mt-1">
                      <button onClick={() => setShowDetailModal(task)}
                        className="text-xs btn-secondary py-1 px-3">로그</button>
                      {task.stage === 'planning' && (
                        <button onClick={() => { setShowStageModal({ task, stage: 'planning' }); setStageOut1(task.planSpec || ''); setStageOut2(task.planCriteria || ''); }}
                          className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors font-medium">
                          기획 완료 처리
                        </button>
                      )}
                      {task.stage === 'developing' && (
                        <button onClick={() => { setShowStageModal({ task, stage: 'developing' }); setStageOut1(task.devNote || ''); }}
                          className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 transition-colors font-medium">
                          개발 완료 처리
                        </button>
                      )}
                      {task.stage === 'testing' && (
                        <button onClick={() => { setShowStageModal({ task, stage: 'testing' }); setStageOut1(task.testResult || ''); setStagePassed(true); }}
                          className="text-xs bg-amber-600 text-white px-3 py-1.5 rounded-lg hover:bg-amber-700 transition-colors font-medium">
                          테스트 완료 처리
                        </button>
                      )}
                      {task.stage === 'review' && (
                        <button onClick={() => { setShowReviewModal(task); setReviewAction('승인'); setReviewComment(''); }}
                          className="text-xs bg-purple-600 text-white px-3 py-1.5 rounded-lg hover:bg-purple-700 transition-colors font-medium">
                          ★ 검토하기
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* History */}
      <div>
        <h2 className="text-base font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <RotateCcw size={16} className="text-gray-400" />승인/반려 이력
          <span className="text-xs font-normal text-gray-400">({historyTasks.length}건 · 앱 재시작 후에도 유지됩니다)</span>
        </h2>
        {historyTasks.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-8 text-center text-gray-400 text-sm">
            아직 처리된 요구사항이 없습니다.
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-left">
                  {['ID', '요구사항', '우선순위', '결과', '코멘트', '처리일시', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {historyTasks.map(task => (
                  <>
                    <tr key={task.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-xs text-gray-400 font-mono">{task.id}</td>
                      <td className="px-4 py-3 font-medium text-gray-800 max-w-[180px]">
                        <div className="truncate">{task.title}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_COLOR[task.priority]}`}>{PRIORITY_LABEL[task.priority]}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-medium ${task.stage === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {task.stage === 'approved' ? <CheckCircle size={11} /> : <XCircle size={11} />}
                          {task.stage === 'approved' ? '승인' : '반려'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 max-w-[200px]">
                        <span className="truncate block" title={task.userComment}>{task.userComment || '—'}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">{task.reviewAt}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => toggleHistory(task.id)}
                          className="text-xs text-gray-400 hover:text-blue-500 transition-colors">
                          {expandedHistory.has(task.id) ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                      </td>
                    </tr>
                    {expandedHistory.has(task.id) && (
                      <tr key={`${task.id}-detail`}>
                        <td colSpan={7} className="px-6 pb-4 bg-gray-50">
                          <div className="grid grid-cols-3 gap-3 pt-3">
                            {task.planSpec && (
                              <div className="bg-blue-50 rounded-lg p-3">
                                <div className="text-xs font-semibold text-blue-600 mb-1">기획 사양</div>
                                <p className="text-xs text-gray-700 whitespace-pre-line line-clamp-4">{task.planSpec}</p>
                              </div>
                            )}
                            {task.devNote && (
                              <div className="bg-green-50 rounded-lg p-3">
                                <div className="text-xs font-semibold text-green-600 mb-1">개발 내용</div>
                                <p className="text-xs text-gray-700 whitespace-pre-line line-clamp-4">{task.devNote}</p>
                              </div>
                            )}
                            {task.testResult && (
                              <div className={`rounded-lg p-3 ${task.testPassed ? 'bg-amber-50' : 'bg-red-50'}`}>
                                <div className={`text-xs font-semibold mb-1 ${task.testPassed ? 'text-amber-600' : 'text-red-600'}`}>
                                  테스트 {task.testPassed ? '통과' : '실패'}
                                </div>
                                <p className="text-xs text-gray-700 whitespace-pre-line line-clamp-4">{task.testResult}</p>
                              </div>
                            )}
                          </div>
                          <div className="mt-3">
                            <div className="text-xs font-semibold text-gray-500 mb-2">활동 로그</div>
                            <div className="space-y-1">
                              {task.log.map((entry, i) => (
                                <div key={i} className="flex items-start gap-3 text-xs">
                                  <span className="font-medium text-gray-500 w-14 flex-shrink-0 text-right">{entry.role}</span>
                                  <span className="text-gray-400 w-36 flex-shrink-0">{entry.at}</span>
                                  <span className="text-gray-700">{entry.msg}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── New Task Modal ── */}
      {showNewForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setShowNewForm(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">요구사항 등록</h2>
              <button onClick={() => setShowNewForm(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">제목 *</label>
                <input value={newTitle} onChange={e => setNewTitle(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="요구사항 제목" autoFocus />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">상세 설명</label>
                <textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} rows={4}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="요구사항 상세 설명 (선택)" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">우선순위</label>
                <div className="flex gap-2">
                  {(['high', 'medium', 'low'] as Priority[]).map(p => (
                    <button key={p} onClick={() => setNewPriority(p)}
                      className={`flex-1 py-2 text-sm rounded-lg border-2 font-medium transition-colors ${
                        newPriority === p ? PRIORITY_COLOR[p] + ' border-transparent' : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                      }`}>
                      {PRIORITY_LABEL[p]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
              <button onClick={() => setShowNewForm(false)} className="btn-secondary">취소</button>
              <button onClick={addTask} className="btn-primary">기획팀에 전달</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Stage Completion Modal ── */}
      {showStageModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setShowStageModal(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className={`flex items-center gap-3 px-6 py-5 rounded-t-2xl ${
              showStageModal.stage === 'planning' ? 'bg-blue-50' :
              showStageModal.stage === 'developing' ? 'bg-green-50' : 'bg-amber-50'
            }`}>
              {showStageModal.stage === 'planning' ? <PenTool size={22} className="text-blue-600" /> :
               showStageModal.stage === 'developing' ? <Code size={22} className="text-green-600" /> :
               <Bug size={22} className="text-amber-600" />}
              <div>
                <h3 className="font-bold text-gray-900 text-lg">
                  {showStageModal.stage === 'planning' ? '기획자: 분석 완료 처리' :
                   showStageModal.stage === 'developing' ? '개발자: 구현 완료 처리' : '테스터: 테스트 완료 처리'}
                </h3>
                <p className="text-sm text-gray-500 mt-0.5">{showStageModal.task.title}</p>
              </div>
            </div>
            <div className="p-6 space-y-4">
              {showStageModal.task.description && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="text-xs font-semibold text-gray-500 mb-1">원본 요구사항</div>
                  <p className="text-sm text-gray-700">{showStageModal.task.description}</p>
                </div>
              )}
              {showStageModal.stage === 'planning' && (
                <>
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">기능 사양 (세부 요건) *</label>
                    <textarea value={stageOut1} onChange={e => setStageOut1(e.target.value)} rows={6}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      placeholder="상세 기능 요건 및 화면 사양을 작성하세요..." />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">인수 기준 (선택)</label>
                    <textarea value={stageOut2} onChange={e => setStageOut2(e.target.value)} rows={3}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      placeholder="예: - 정상 케이스에서 성공 메시지 표시&#10;- 오류 시 구체적인 안내 메시지 출력" />
                  </div>
                </>
              )}
              {showStageModal.stage === 'developing' && (
                <>
                  {showStageModal.task.planSpec && (
                    <div className="bg-blue-50 rounded-xl p-4">
                      <div className="text-xs font-semibold text-blue-600 mb-1">기획 사양 참고</div>
                      <p className="text-sm text-gray-700 whitespace-pre-line">{showStageModal.task.planSpec}</p>
                    </div>
                  )}
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">구현 내용 *</label>
                    <textarea value={stageOut1} onChange={e => setStageOut1(e.target.value)} rows={6}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      placeholder="구현한 내용, 수정된 파일, 주요 변경사항을 기술하세요..." />
                  </div>
                </>
              )}
              {showStageModal.stage === 'testing' && (
                <>
                  {showStageModal.task.planCriteria && (
                    <div className="bg-blue-50 rounded-xl p-4">
                      <div className="text-xs font-semibold text-blue-600 mb-1">인수 기준 (테스트 기준)</div>
                      <p className="text-sm text-gray-700 whitespace-pre-line">{showStageModal.task.planCriteria}</p>
                    </div>
                  )}
                  <div className="flex gap-3">
                    <button onClick={() => setStagePassed(true)}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 font-semibold text-sm transition-colors ${
                        stagePassed ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 text-gray-400 hover:bg-gray-50'
                      }`}>
                      <CheckCircle size={18} />통과 (PASS)
                    </button>
                    <button onClick={() => setStagePassed(false)}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 font-semibold text-sm transition-colors ${
                        !stagePassed ? 'border-red-500 bg-red-50 text-red-700' : 'border-gray-200 text-gray-400 hover:bg-gray-50'
                      }`}>
                      <XCircle size={18} />실패 (FAIL)
                    </button>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">테스트 결과 상세 *</label>
                    <textarea value={stageOut1} onChange={e => setStageOut1(e.target.value)} rows={5}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      placeholder={stagePassed ? '테스트 통과 내용을 기술하세요...' : '실패 원인 및 재작업 필요 사항을 기술하세요...'} />
                  </div>
                  {!stagePassed && (
                    <div className="bg-amber-50 border border-amber-200 text-amber-700 text-xs rounded-lg px-3 py-2">
                      ⚠ 테스트 실패 처리 시 '개발중' 단계로 되돌아가며 개발자가 재작업합니다.
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
              <button onClick={() => setShowStageModal(null)} className="btn-secondary">취소</button>
              <button onClick={completeStage}
                className={`px-5 py-2 rounded-lg text-sm font-medium text-white transition-colors ${
                  showStageModal.stage === 'planning' ? 'bg-blue-600 hover:bg-blue-700' :
                  showStageModal.stage === 'developing' ? 'bg-green-600 hover:bg-green-700' :
                  stagePassed ? 'bg-amber-600 hover:bg-amber-700' : 'bg-red-500 hover:bg-red-600'
                }`}>
                {showStageModal.stage === 'testing' ? (stagePassed ? '통과 처리 →사용자 검토' : '실패 →재개발') : '완료 처리'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── User Review Modal ── */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setShowReviewModal(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 px-6 py-5 rounded-t-2xl bg-purple-50">
              <Shield size={22} className="text-purple-600" />
              <div>
                <h3 className="font-bold text-gray-900 text-lg">최종 검토 (사용자)</h3>
                <p className="text-sm text-gray-500 mt-0.5">{showReviewModal.title}</p>
              </div>
            </div>
            <div className="p-6 space-y-4">
              {showReviewModal.planSpec && (
                <div className="bg-blue-50 rounded-xl p-4">
                  <div className="text-xs font-semibold text-blue-600 mb-1">기획 사양</div>
                  <p className="text-sm text-gray-700 whitespace-pre-line">{showReviewModal.planSpec}</p>
                  {showReviewModal.planCriteria && (
                    <>
                      <div className="text-xs font-semibold text-blue-600 mt-2 mb-1">인수 기준</div>
                      <p className="text-sm text-gray-700 whitespace-pre-line">{showReviewModal.planCriteria}</p>
                    </>
                  )}
                </div>
              )}
              {showReviewModal.devNote && (
                <div className="bg-green-50 rounded-xl p-4">
                  <div className="text-xs font-semibold text-green-600 mb-1">개발 내용</div>
                  <p className="text-sm text-gray-700 whitespace-pre-line">{showReviewModal.devNote}</p>
                </div>
              )}
              {showReviewModal.testResult && (
                <div className={`rounded-xl p-4 ${showReviewModal.testPassed ? 'bg-green-50' : 'bg-red-50'}`}>
                  <div className={`text-xs font-semibold mb-1 ${showReviewModal.testPassed ? 'text-green-600' : 'text-red-600'}`}>
                    테스트: {showReviewModal.testPassed ? '통과' : '실패'}
                  </div>
                  <p className="text-sm text-gray-700 whitespace-pre-line">{showReviewModal.testResult}</p>
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button onClick={() => setReviewAction('승인')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 font-semibold text-sm transition-colors ${
                    reviewAction === '승인' ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 text-gray-400 hover:bg-gray-50'
                  }`}>
                  <ThumbsUp size={16} />승인
                </button>
                <button onClick={() => setReviewAction('반려')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 font-semibold text-sm transition-colors ${
                    reviewAction === '반려' ? 'border-red-500 bg-red-50 text-red-700' : 'border-gray-200 text-gray-400 hover:bg-gray-50'
                  }`}>
                  <ThumbsDown size={16} />반려
                </button>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">
                  코멘트 {reviewAction === '반려' ? '*(반려 사유 필수)' : '(선택)'}
                </label>
                <textarea value={reviewComment} onChange={e => setReviewComment(e.target.value)} rows={3}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder={reviewAction === '반려' ? '반려 사유를 입력해주세요...' : '승인 코멘트 (선택사항)'} />
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
              <button onClick={() => setShowReviewModal(null)} className="btn-secondary">취소</button>
              <button onClick={submitReview}
                className={`px-5 py-2 rounded-lg text-sm font-medium text-white transition-colors ${
                  reviewAction === '승인' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-500 hover:bg-red-600'
                }`}>
                {reviewAction} 확정
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Task Detail / Log Modal ── */}
      {showDetailModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setShowDetailModal(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-gray-400 font-mono">{showDetailModal.id}</span>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${STAGE_COLOR[showDetailModal.stage]}`}>{STAGE_LABEL[showDetailModal.stage]}</span>
                </div>
                <h2 className="text-lg font-bold text-gray-900">{showDetailModal.title}</h2>
              </div>
              <button onClick={() => setShowDetailModal(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              {showDetailModal.description && (
                <div>
                  <div className="text-xs font-semibold text-gray-500 mb-1">요구사항 설명</div>
                  <p className="text-sm text-gray-700">{showDetailModal.description}</p>
                </div>
              )}
              {showDetailModal.planSpec && (
                <div className="bg-blue-50 rounded-xl p-4">
                  <div className="text-xs font-semibold text-blue-600 mb-1">기획 사양</div>
                  <p className="text-sm text-gray-700 whitespace-pre-line">{showDetailModal.planSpec}</p>
                  {showDetailModal.planCriteria && (
                    <>
                      <div className="text-xs font-semibold text-blue-600 mt-2 mb-1">인수 기준</div>
                      <p className="text-sm text-gray-700 whitespace-pre-line">{showDetailModal.planCriteria}</p>
                    </>
                  )}
                </div>
              )}
              {showDetailModal.devNote && (
                <div className="bg-green-50 rounded-xl p-4">
                  <div className="text-xs font-semibold text-green-600 mb-1">개발 내용</div>
                  <p className="text-sm text-gray-700 whitespace-pre-line">{showDetailModal.devNote}</p>
                </div>
              )}
              {showDetailModal.testResult && (
                <div className={`rounded-xl p-4 ${showDetailModal.testPassed ? 'bg-amber-50' : 'bg-red-50'}`}>
                  <div className={`text-xs font-semibold mb-1 ${showDetailModal.testPassed ? 'text-amber-600' : 'text-red-600'}`}>
                    테스트: {showDetailModal.testPassed ? '통과' : '실패'}
                  </div>
                  <p className="text-sm text-gray-700 whitespace-pre-line">{showDetailModal.testResult}</p>
                </div>
              )}
              {showDetailModal.userAction && (
                <div className={`rounded-xl p-4 ${showDetailModal.userAction === '승인' ? 'bg-emerald-50' : 'bg-red-50'}`}>
                  <div className={`text-xs font-semibold mb-1 ${showDetailModal.userAction === '승인' ? 'text-emerald-600' : 'text-red-600'}`}>
                    사용자 최종: {showDetailModal.userAction} ({showDetailModal.reviewAt})
                  </div>
                  {showDetailModal.userComment && <p className="text-sm text-gray-700">{showDetailModal.userComment}</p>}
                </div>
              )}
              <div>
                <div className="text-xs font-semibold text-gray-500 mb-2">활동 로그</div>
                <div className="space-y-2">
                  {showDetailModal.log.map((entry, i) => (
                    <div key={i} className="flex items-start gap-3 text-xs border-l-2 border-gray-100 pl-3">
                      <span className="font-medium text-gray-600 w-14 flex-shrink-0">{entry.role}</span>
                      <span className="text-gray-400 w-36 flex-shrink-0 font-mono">{entry.at}</span>
                      <span className="text-gray-700">{entry.msg}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
