import { useState } from 'react';
import { Search, Plus, ChevronDown, Calendar, Users, DollarSign, TrendingUp } from 'lucide-react';
import { projects } from '../data/mockData';
import StatusBadge from '../components/StatusBadge';
import type { Project } from '../types';

function formatBudget(value: number) {
  return `${(value / 100000000).toFixed(1)}억원`;
}

function formatDate(dateStr: string) {
  return dateStr.replace(/-/g, '.');
}

function ProgressBar({ value, status }: { value: number; status: Project['status'] }) {
  const colorMap = {
    'on-track': 'bg-green-500',
    'at-risk': 'bg-amber-500',
    'delayed': 'bg-red-500',
    'completed': 'bg-blue-500',
  };
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-gray-100 rounded-full h-2">
        <div className={`h-2 rounded-full ${colorMap[status]}`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-sm text-gray-600 w-10 text-right">{value}%</span>
    </div>
  );
}

const statusOptions = ['전체', '정상', '위험', '지연', '완료'];
const statusMap: Record<string, Project['status'] | undefined> = {
  '전체': undefined,
  '정상': 'on-track',
  '위험': 'at-risk',
  '지연': 'delayed',
  '완료': 'completed',
};

export default function Projects() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('전체');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const filtered = projects.filter(p => {
    const matchStatus = statusFilter === '전체' || p.status === statusMap[statusFilter];
    const matchSearch = p.name.includes(search) || p.manager.includes(search) || p.code.includes(search);
    return matchStatus && matchSearch;
  });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">프로젝트 관리</h1>
          <p className="text-gray-500 mt-1">총 {projects.length}개 프로젝트</p>
        </div>
        <button className="btn-primary flex items-center gap-2">
          <Plus size={16} />
          프로젝트 등록
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="프로젝트명, 코드, 담당자 검색..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="flex gap-2">
          {statusOptions.map(opt => (
            <button
              key={opt}
              onClick={() => setStatusFilter(opt)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === opt
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      {/* Project Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filtered.map(project => (
          <div
            key={project.id}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setSelectedProject(project)}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-gray-400 font-mono">{project.code}</span>
                  <StatusBadge status={project.priority} type="priority" />
                </div>
                <h3 className="text-base font-semibold text-gray-900">{project.name}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{project.description}</p>
              </div>
              <StatusBadge status={project.status} type="project" />
            </div>

            <div className="mb-4">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>진행률</span>
                <span>{project.progress}%</span>
              </div>
              <ProgressBar value={project.progress} status={project.status} />
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs text-gray-600">
              <div className="flex items-center gap-1.5">
                <Calendar size={13} className="text-gray-400" />
                <span>{formatDate(project.startDate)} ~ {formatDate(project.endDate)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <DollarSign size={13} className="text-gray-400" />
                <span>{formatBudget(project.spent)} / {formatBudget(project.budget)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Users size={13} className="text-gray-400" />
                <span>{project.manager} 외 {project.team.length}명</span>
              </div>
              <div className="flex items-center gap-1.5">
                <TrendingUp size={13} className="text-gray-400" />
                <span>예산 집행 {Math.round((project.spent / project.budget) * 100)}%</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-500">
                  마일스톤 {project.milestones.filter(m => m.completed).length}/{project.milestones.length} 완료
                </div>
                <div className="flex gap-1">
                  {project.milestones.map(m => (
                    <div
                      key={m.id}
                      className={`w-2 h-2 rounded-full ${m.completed ? 'bg-blue-500' : 'bg-gray-200'}`}
                      title={m.title}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Detail Modal */}
      {selectedProject && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedProject(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm text-gray-400 font-mono">{selectedProject.code}</span>
                    <StatusBadge status={selectedProject.priority} type="priority" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">{selectedProject.name}</h2>
                  <p className="text-sm text-gray-500 mt-1">{selectedProject.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={selectedProject.status} type="project" />
                  <button
                    onClick={() => setSelectedProject(null)}
                    className="text-gray-400 hover:text-gray-600 text-xl ml-2"
                  >
                    ×
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="text-xs font-medium text-gray-500 uppercase mb-2">일정</div>
                  <div className="text-sm text-gray-800">
                    {formatDate(selectedProject.startDate)} ~ {formatDate(selectedProject.endDate)}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-medium text-gray-500 uppercase mb-2">담당자</div>
                  <div className="text-sm text-gray-800">{selectedProject.manager}</div>
                </div>
                <div>
                  <div className="text-xs font-medium text-gray-500 uppercase mb-2">예산 현황</div>
                  <div className="text-sm text-gray-800">
                    {formatBudget(selectedProject.spent)} 집행 / {formatBudget(selectedProject.budget)} 배정
                  </div>
                  <div className="mt-2 bg-gray-100 rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-blue-500"
                      style={{ width: `${(selectedProject.spent / selectedProject.budget) * 100}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="text-xs font-medium text-gray-500 uppercase mb-2">팀 구성원</div>
                  <div className="flex flex-wrap gap-1">
                    {selectedProject.team.map(member => (
                      <span key={member} className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">
                        {member}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <div className="text-xs font-medium text-gray-500 uppercase mb-3">마일스톤</div>
                <div className="space-y-2">
                  {selectedProject.milestones.map((m) => (
                    <div key={m.id} className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                        m.completed ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                      }`}>
                        {m.completed && <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1 4L3 6L7 2" stroke="white" strokeWidth="1.5" strokeLinecap="round"/></svg>}
                      </div>
                      <span className={`text-sm flex-1 ${m.completed ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                        {m.title}
                      </span>
                      <span className="text-xs text-gray-400">{formatDate(m.dueDate)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-xs font-medium text-gray-500 uppercase mb-2">전체 진행률</div>
                <ProgressBar value={selectedProject.progress} status={selectedProject.status} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
