import { useMemo } from 'react';
import { AlertTriangle, CheckSquare, ShieldAlert, DollarSign, Calendar, TrendingUp, Clock, User } from 'lucide-react';
import { projectConfig } from '../data/projectConfig';
import { useAuth } from '../context/AuthContext';

interface Issue { id: string; status: string; dueDate?: string; }
interface Risk { id: string; probability: number; impact: number; status: string; }
interface ActionItem { id: string; status: string; dueDate?: string; }

function loadJSON<T>(key: string): T[] {
  try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : []; } catch { return []; }
}

function formatMoney(v: number) {
  return `${(v / 100_000_000).toFixed(1)}억원`;
}

function dDay(dateStr: string) {
  const diff = Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
  if (diff < 0) return `D+${Math.abs(diff)}`;
  if (diff === 0) return 'D-Day';
  return `D-${diff}`;
}

function progressColor(pct: number) {
  if (pct >= 80) return 'bg-green-500';
  if (pct >= 50) return 'bg-blue-500';
  if (pct >= 30) return 'bg-amber-500';
  return 'bg-red-500';
}

export default function Dashboard() {
  const { currentUser } = useAuth();

  const issues = useMemo(() => loadJSON<Issue>('pmo-issues'), []);
  const risks = useMemo(() => loadJSON<Risk>('pmo-risks'), []);
  const actions = useMemo(() => loadJSON<ActionItem>('pmo-action-items'), []);

  const today = new Date().toISOString().slice(0, 10);

  const issueOpen = issues.filter(i => i.status !== '해결' && i.status !== '닫힘').length;
  const issueOverdue = issues.filter(i => i.dueDate && i.dueDate < today && i.status !== '해결' && i.status !== '닫힘').length;
  const riskHigh = risks.filter(r => r.probability * r.impact >= 6).length;
  const riskOpen = risks.filter(r => r.status !== '완료' && r.status !== '수용').length;
  const actionPending = actions.filter(a => a.status !== '완료' && a.status !== '취소').length;
  const actionOverdue = actions.filter(a => a.dueDate && a.dueDate < today && a.status !== '완료' && a.status !== '취소').length;

  const startDate = new Date(projectConfig.startDate);
  const endDate = new Date(projectConfig.endDate);
  const now = Date.now();
  const totalDays = (endDate.getTime() - startDate.getTime()) / 86400000;
  const elapsedDays = Math.max(0, (now - startDate.getTime()) / 86400000);
  const scheduleProgress = Math.min(100, Math.round((elapsedDays / totalDays) * 100));
  const budgetRate = Math.round((projectConfig.spent / projectConfig.budget) * 100);
  const remainingBudget = projectConfig.budget - projectConfig.spent;
  const endDDay = dDay(projectConfig.endDate);

  const kpis = [
    {
      label: '미처리 이슈',
      value: issueOpen,
      unit: '건',
      sub: issueOverdue > 0 ? `기한초과 ${issueOverdue}건` : '기한초과 없음',
      subColor: issueOverdue > 0 ? 'text-red-500' : 'text-green-500',
      icon: AlertTriangle,
      color: 'text-red-600',
      bg: 'bg-red-50',
    },
    {
      label: '미완료 위험',
      value: riskOpen,
      unit: '건',
      sub: riskHigh > 0 ? `고위험 ${riskHigh}건` : '고위험 없음',
      subColor: riskHigh > 0 ? 'text-red-500' : 'text-green-500',
      icon: ShieldAlert,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
    },
    {
      label: '미완료 액션',
      value: actionPending,
      unit: '건',
      sub: actionOverdue > 0 ? `기한초과 ${actionOverdue}건` : '기한초과 없음',
      subColor: actionOverdue > 0 ? 'text-red-500' : 'text-green-500',
      icon: CheckSquare,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: '예산 집행률',
      value: budgetRate,
      unit: '%',
      sub: `잔여 ${formatMoney(remainingBudget)}`,
      subColor: 'text-gray-500',
      icon: DollarSign,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
  ];

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">PMO 대시보드</h1>
        <p className="text-gray-500 mt-1">
          {projectConfig.name} &nbsp;·&nbsp; {today.replace(/-/g, '.')} 기준
          {currentUser && <span className="ml-2 text-blue-600 font-medium">· {currentUser.displayName} ({currentUser.role})</span>}
        </p>
      </div>

      {/* Project Info Card */}
      <div className="bg-gradient-to-r from-slate-800 to-blue-900 rounded-2xl p-6 mb-8 text-white">
        <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="bg-blue-500 text-white text-xs font-bold px-2 py-0.5 rounded">{projectConfig.code}</span>
              <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded">{projectConfig.phase} 단계</span>
            </div>
            <h2 className="text-xl font-bold mb-1">{projectConfig.name}</h2>
            <p className="text-slate-300 text-sm">{projectConfig.description}</p>
          </div>
          <div className="flex gap-6 flex-shrink-0 text-sm">
            <div className="text-center">
              <div className="text-slate-300 text-xs mb-1 flex items-center gap-1"><User size={11} /> 발주처</div>
              <div className="font-semibold">{projectConfig.client}</div>
            </div>
            <div className="text-center">
              <div className="text-slate-300 text-xs mb-1 flex items-center gap-1"><User size={11} /> PM</div>
              <div className="font-semibold">{projectConfig.pm}</div>
            </div>
            <div className="text-center">
              <div className="text-slate-300 text-xs mb-1 flex items-center gap-1"><Calendar size={11} /> 종료일</div>
              <div className="font-semibold">{projectConfig.endDate.replace(/-/g, '.')}</div>
              <div className="text-xs text-amber-300 font-bold">{endDDay}</div>
            </div>
          </div>
        </div>

        {/* Progress bars */}
        <div className="mt-5 grid grid-cols-2 gap-6">
          <div>
            <div className="flex justify-between text-xs text-slate-300 mb-1.5">
              <span className="flex items-center gap-1"><TrendingUp size={12} /> 일정 진행률</span>
              <span className="font-semibold text-white">{scheduleProgress}%</span>
            </div>
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all ${progressColor(scheduleProgress)}`} style={{ width: `${scheduleProgress}%` }} />
            </div>
            <div className="flex justify-between text-xs text-slate-400 mt-1">
              <span>{projectConfig.startDate.replace(/-/g, '.')}</span>
              <span>{projectConfig.endDate.replace(/-/g, '.')}</span>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs text-slate-300 mb-1.5">
              <span className="flex items-center gap-1"><DollarSign size={12} /> 예산 집행률</span>
              <span className="font-semibold text-white">{budgetRate}%</span>
            </div>
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all ${progressColor(budgetRate)}`} style={{ width: `${budgetRate}%` }} />
            </div>
            <div className="flex justify-between text-xs text-slate-400 mt-1">
              <span>집행 {formatMoney(projectConfig.spent)}</span>
              <span>총 {formatMoney(projectConfig.budget)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {kpis.map(kpi => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 ${kpi.bg} rounded-lg flex items-center justify-center`}>
                  <Icon size={20} className={kpi.color} />
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900">
                {kpi.value}<span className="text-base text-gray-400 ml-1">{kpi.unit}</span>
              </div>
              <div className="text-sm text-gray-500 mt-0.5">{kpi.label}</div>
              <div className={`text-xs mt-1 font-medium ${kpi.subColor}`}>{kpi.sub}</div>
            </div>
          );
        })}
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-3 gap-6">
        {/* Issue summary */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={16} className="text-red-500" />
            <h2 className="text-base font-semibold text-gray-900">이슈 현황</h2>
          </div>
          {[
            { label: '전체', value: issues.length, color: 'bg-gray-100 text-gray-700' },
            { label: '미처리', value: issueOpen, color: 'bg-red-100 text-red-700' },
            { label: '해결완료', value: issues.filter(i => i.status === '해결').length, color: 'bg-green-100 text-green-700' },
            { label: '기한초과', value: issueOverdue, color: 'bg-rose-100 text-rose-700' },
          ].map(row => (
            <div key={row.label} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
              <span className="text-sm text-gray-600">{row.label}</span>
              <span className={`text-sm font-bold px-2 py-0.5 rounded-full ${row.color}`}>{row.value}</span>
            </div>
          ))}
        </div>

        {/* Risk summary */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-4">
            <ShieldAlert size={16} className="text-orange-500" />
            <h2 className="text-base font-semibold text-gray-900">위험 현황</h2>
          </div>
          {[
            { label: '전체', value: risks.length, color: 'bg-gray-100 text-gray-700' },
            { label: '고위험', value: riskHigh, color: 'bg-red-100 text-red-700' },
            { label: '중위험', value: risks.filter(r => { const s = r.probability * r.impact; return s >= 3 && s < 6; }).length, color: 'bg-amber-100 text-amber-700' },
            { label: '미완료', value: riskOpen, color: 'bg-orange-100 text-orange-700' },
          ].map(row => (
            <div key={row.label} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
              <span className="text-sm text-gray-600">{row.label}</span>
              <span className={`text-sm font-bold px-2 py-0.5 rounded-full ${row.color}`}>{row.value}</span>
            </div>
          ))}
        </div>

        {/* Action summary */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock size={16} className="text-blue-500" />
            <h2 className="text-base font-semibold text-gray-900">액션아이템 현황</h2>
          </div>
          {[
            { label: '전체', value: actions.length, color: 'bg-gray-100 text-gray-700' },
            { label: '미완료', value: actionPending, color: 'bg-blue-100 text-blue-700' },
            { label: '완료', value: actions.filter(a => a.status === '완료').length, color: 'bg-green-100 text-green-700' },
            { label: '기한초과', value: actionOverdue, color: 'bg-rose-100 text-rose-700' },
          ].map(row => (
            <div key={row.label} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
              <span className="text-sm text-gray-600">{row.label}</span>
              <span className={`text-sm font-bold px-2 py-0.5 rounded-full ${row.color}`}>{row.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
