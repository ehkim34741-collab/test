import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  LineChart, Line,
} from 'recharts';
import { Download, FileText, TrendingUp, Target } from 'lucide-react';
import { projects, risks, tasks, resources } from '../data/mockData';

const portfolioHealth = [
  { subject: '일정 준수', value: 72 },
  { subject: '예산 관리', value: 85 },
  { subject: '리스크 관리', value: 65 },
  { subject: '품질', value: 78 },
  { subject: '리소스', value: 80 },
  { subject: '이해관계자', value: 70 },
];

const weeklyProgress = [
  { week: '4/28', completed: 3, added: 5, total: 42 },
  { week: '5/5', completed: 5, added: 3, total: 40 },
  { week: '5/12', completed: 4, added: 4, total: 40 },
  { week: '5/19', completed: 6, added: 2, total: 36 },
  { week: '5/26', completed: 2, added: 3, total: 37 },
];

const projectProgressData = projects.map(p => ({
  name: p.name.length > 10 ? p.name.slice(0, 10) + '...' : p.name,
  계획: Math.min(p.progress + 10, 100),
  실적: p.progress,
}));

function formatBudget(value: number) {
  return `${(value / 100000000).toFixed(1)}억`;
}

const totalBudget = projects.reduce((sum, p) => sum + p.budget, 0);
const totalSpent = projects.reduce((sum, p) => sum + p.spent, 0);

const reportCards = [
  {
    title: '주간 프로젝트 현황보고',
    date: '2026-05-26',
    type: '정기보고',
    status: '작성완료',
  },
  {
    title: '5월 PMO 월간 보고서',
    date: '2026-05-01',
    type: '월간보고',
    status: '승인완료',
  },
  {
    title: '2분기 포트폴리오 리뷰',
    date: '2026-04-30',
    type: '분기보고',
    status: '승인완료',
  },
  {
    title: '리스크 현황 특별보고',
    date: '2026-04-15',
    type: '특별보고',
    status: '공유완료',
  },
];

export default function Reports() {
  const completedTasks = tasks.filter(t => t.status === 'done').length;
  const openRisks = risks.filter(r => r.status === 'open').length;
  const onTrackProjects = projects.filter(p => p.status === 'on-track').length;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">보고서 & 분석</h1>
          <p className="text-gray-500 mt-1">PMO 포트폴리오 종합 현황</p>
        </div>
        <button className="btn-primary flex items-center gap-2">
          <Download size={16} />
          보고서 다운로드
        </button>
      </div>

      {/* Executive Summary */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 mb-8 text-white">
        <div className="flex items-center gap-2 mb-2">
          <Target size={18} />
          <span className="font-semibold">경영진 요약 (Executive Summary)</span>
          <span className="ml-auto text-blue-200 text-sm">2026년 5월 26일 기준</span>
        </div>
        <div className="grid grid-cols-4 gap-6 mt-4">
          {[
            { label: '전체 프로젝트', value: projects.length, unit: '개' },
            { label: '정상 진행', value: onTrackProjects, unit: '개' },
            { label: '예산 집행률', value: Math.round((totalSpent / totalBudget) * 100), unit: '%' },
            { label: '완료 태스크', value: completedTasks, unit: '개' },
          ].map(item => (
            <div key={item.label} className="text-center">
              <div className="text-3xl font-bold">{item.value}<span className="text-xl ml-0.5">{item.unit}</span></div>
              <div className="text-blue-200 text-sm mt-1">{item.label}</div>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-blue-500 text-sm text-blue-100">
          ⚠ 주요 이슈: 고객 경험 혁신 프로젝트 일정 지연 (2주) | ERP 시스템 고도화 진행 위험 |
          진행중 리스크 {openRisks}건 관리 중
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6 mb-8">
        {/* Portfolio Health */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">포트폴리오 건전성</h2>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={portfolioHealth}>
              <PolarGrid />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
              <Radar name="건전성" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Project vs Plan */}
        <div className="col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">계획 대비 실적 (진행률)</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={projectProgressData} layout="vertical" margin={{ left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={90} />
              <Tooltip formatter={(v) => `${v}%`} />
              <Legend />
              <Bar dataKey="계획" fill="#93c5fd" radius={[0, 4, 4, 0]} barSize={10} />
              <Bar dataKey="실적" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={10} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-8">
        {/* Weekly Task Progress */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">주간 태스크 변동 추이</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={weeklyProgress}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="week" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="completed" name="완료" stroke="#22c55e" strokeWidth={2} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="added" name="추가" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="total" name="전체" stroke="#3b82f6" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Budget Summary */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">프로젝트별 예산 현황</h2>
          <div className="space-y-3">
            {projects.map(p => {
              const utilization = Math.round((p.spent / p.budget) * 100);
              return (
                <div key={p.id}>
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span className="truncate mr-2">{p.name}</span>
                    <span className="flex-shrink-0">{formatBudget(p.spent)} / {formatBudget(p.budget)} ({utilization}%)</span>
                  </div>
                  <div className="bg-gray-100 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full ${utilization > 95 ? 'bg-red-500' : utilization > 80 ? 'bg-amber-500' : 'bg-blue-500'}`}
                      style={{ width: `${Math.min(utilization, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between text-sm">
            <span className="text-gray-500">전체 예산</span>
            <span className="font-semibold">{formatBudget(totalSpent)} / {formatBudget(totalBudget)}</span>
          </div>
        </div>
      </div>

      {/* Report Archive */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-2 mb-4">
          <FileText size={16} className="text-gray-500" />
          <h2 className="text-base font-semibold text-gray-900">보고서 목록</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {reportCards.map((report, idx) => (
            <div key={idx} className="py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center">
                  <FileText size={16} className="text-blue-600" />
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">{report.title}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{report.date.replace(/-/g, '.')} · {report.type}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs px-2.5 py-0.5 rounded-full ${
                  report.status === '작성완료' ? 'bg-blue-100 text-blue-700' :
                  report.status === '승인완료' ? 'bg-green-100 text-green-700' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {report.status}
                </span>
                <button className="text-xs text-gray-500 hover:text-blue-600 flex items-center gap-1 transition-colors">
                  <Download size={12} />
                  다운로드
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
