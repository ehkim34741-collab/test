import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts';
import { TrendingUp, TrendingDown, FolderKanban, CheckSquare, AlertTriangle, DollarSign, Activity } from 'lucide-react';
import { projects, activities, projectStatusData, monthlyBudget } from '../data/mockData';
import StatusBadge from '../components/StatusBadge';

const totalBudget = projects.reduce((sum, p) => sum + p.budget, 0);
const totalSpent = projects.reduce((sum, p) => sum + p.spent, 0);

function formatBudget(value: number) {
  return `${(value / 100000000).toFixed(1)}억`;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = (now.getTime() - d.getTime()) / 1000 / 60;
  if (diff < 60) return `${Math.floor(diff)}분 전`;
  if (diff < 1440) return `${Math.floor(diff / 60)}시간 전`;
  return `${Math.floor(diff / 1440)}일 전`;
}

const activityTypeConfig = {
  project: { color: 'bg-blue-500', label: '프로젝트' },
  task: { color: 'bg-green-500', label: '태스크' },
  risk: { color: 'bg-red-500', label: '리스크' },
  resource: { color: 'bg-purple-500', label: '리소스' },
};

export default function Dashboard() {
  const onTrack = projects.filter(p => p.status === 'on-track').length;
  const atRisk = projects.filter(p => p.status === 'at-risk').length;
  const delayed = projects.filter(p => p.status === 'delayed').length;
  const completed = projects.filter(p => p.status === 'completed').length;
  const budgetUtilization = Math.round((totalSpent / totalBudget) * 100);

  const kpis = [
    {
      label: '전체 프로젝트',
      value: projects.length,
      unit: '개',
      change: 2,
      icon: FolderKanban,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: '정상 프로젝트',
      value: onTrack,
      unit: '개',
      change: 1,
      icon: TrendingUp,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      label: '위험/지연 프로젝트',
      value: atRisk + delayed,
      unit: '개',
      change: -1,
      icon: AlertTriangle,
      color: 'text-red-600',
      bg: 'bg-red-50',
    },
    {
      label: '예산 집행률',
      value: budgetUtilization,
      unit: '%',
      change: 3,
      icon: DollarSign,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">PMO 대시보드</h1>
        <p className="text-gray-500 mt-1">2026년 5월 26일 기준 프로젝트 현황</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-10 h-10 ${kpi.bg} rounded-lg flex items-center justify-center`}>
                  <Icon size={20} className={kpi.color} />
                </div>
                <div className={`flex items-center gap-1 text-xs font-medium ${kpi.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {kpi.change > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                  {Math.abs(kpi.change)}{kpi.unit}
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900">
                {kpi.value}<span className="text-lg text-gray-400 ml-1">{kpi.unit}</span>
              </div>
              <div className="text-sm text-gray-500 mt-1">{kpi.label}</div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-3 gap-6 mb-6">
        {/* Status Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">프로젝트 상태 현황</h2>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={projectStatusData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
              >
                {projectStatusData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`${value}개`, '']} />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {projectStatusData.map((item) => (
              <div key={item.name} className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-gray-600">{item.name}</span>
                <span className="font-semibold ml-auto">{item.value}개</span>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500 text-center">
            완료율 {Math.round((completed / projects.length) * 100)}%
          </div>
        </div>

        {/* Budget Chart */}
        <div className="col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">월별 예산 집행 현황 (단위: 백만원)</h2>
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={monthlyBudget} barSize={12}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(value, name) => [
                  `${value}백만원`,
                  name === 'planned' ? '계획' : '실적'
                ]}
              />
              <Legend formatter={(value) => value === 'planned' ? '계획' : '실적'} />
              <Bar dataKey="planned" fill="#93c5fd" name="planned" radius={[4, 4, 0, 0]} />
              <Bar dataKey="actual" fill="#3b82f6" name="actual" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Project List Summary */}
        <div className="col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900">주요 프로젝트 현황</h2>
            <a href="/projects" className="text-sm text-blue-600 hover:underline">전체보기 →</a>
          </div>
          <div className="space-y-4">
            {projects.slice(0, 5).map((project) => (
              <div key={project.id} className="flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-gray-900 truncate">{project.name}</span>
                    <StatusBadge status={project.status} type="project" />
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                      <div
                        className="h-1.5 rounded-full"
                        style={{
                          width: `${project.progress}%`,
                          backgroundColor:
                            project.status === 'on-track' ? '#22c55e' :
                            project.status === 'completed' ? '#3b82f6' :
                            project.status === 'at-risk' ? '#f59e0b' : '#ef4444'
                        }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 w-8 text-right">{project.progress}%</span>
                  </div>
                </div>
                <div className="text-right text-xs text-gray-500 w-24 flex-shrink-0">
                  <div>{formatBudget(project.spent)} / {formatBudget(project.budget)}</div>
                  <div className="text-gray-400">{project.manager}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activities */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Activity size={16} className="text-gray-500" />
            <h2 className="text-base font-semibold text-gray-900">최근 활동</h2>
          </div>
          <div className="space-y-4">
            {activities.map((activity) => {
              const typeConf = activityTypeConfig[activity.type];
              return (
                <div key={activity.id} className="flex gap-3">
                  <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${typeConf.color}`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-gray-800">{activity.action}</div>
                    <div className="text-xs text-gray-500 truncate">{activity.target}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{activity.user} · {formatDate(activity.timestamp)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
