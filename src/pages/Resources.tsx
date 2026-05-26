import { useState } from 'react';
import { Search, Mail, Phone, Plus } from 'lucide-react';
import { resources, projects } from '../data/mockData';

const departments = ['전체', ...Array.from(new Set(resources.map(r => r.department)))];

function AllocationBar({ value }: { value: number }) {
  const color = value >= 100 ? 'bg-red-500' : value >= 80 ? 'bg-amber-500' : 'bg-green-500';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-gray-100 rounded-full h-2">
        <div className={`h-2 rounded-full ${color}`} style={{ width: `${Math.min(value, 100)}%` }} />
      </div>
      <span className={`text-xs font-medium w-10 text-right ${value >= 100 ? 'text-red-600' : value >= 80 ? 'text-amber-600' : 'text-green-600'}`}>
        {value}%
      </span>
    </div>
  );
}

export default function Resources() {
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('전체');

  const filtered = resources.filter(r => {
    const matchDept = deptFilter === '전체' || r.department === deptFilter;
    const matchSearch = r.name.includes(search) || r.role.includes(search) || r.skills.some(s => s.includes(search));
    return matchDept && matchSearch;
  });

  const overAllocated = resources.filter(r => r.allocation >= 100).length;
  const avgAllocation = Math.round(resources.reduce((sum, r) => sum + r.allocation, 0) / resources.length);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">리소스 관리</h1>
          <p className="text-gray-500 mt-1">총 {resources.length}명 · 평균 투입률 {avgAllocation}%</p>
        </div>
        <button className="btn-primary flex items-center gap-2">
          <Plus size={16} />
          리소스 등록
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: '전체 인원', value: resources.length, unit: '명', color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: '평균 투입률', value: avgAllocation, unit: '%', color: 'text-green-600', bg: 'bg-green-50' },
          { label: '과부하 인원', value: overAllocated, unit: '명', color: 'text-red-600', bg: 'bg-red-50' },
          { label: '참여 프로젝트', value: projects.filter(p => p.status !== 'completed').length, unit: '개', color: 'text-purple-600', bg: 'bg-purple-50' },
        ].map(card => (
          <div key={card.label} className={`${card.bg} rounded-xl p-5`}>
            <div className={`text-2xl font-bold ${card.color}`}>{card.value}<span className="text-base ml-0.5">{card.unit}</span></div>
            <div className="text-sm text-gray-600 mt-1">{card.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative max-w-xs flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="이름, 역할, 기술 검색..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {departments.map(dept => (
            <button
              key={dept}
              onClick={() => setDeptFilter(dept)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                deptFilter === dept ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {dept}
            </button>
          ))}
        </div>
      </div>

      {/* Resource Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filtered.map(resource => {
          const resourceProjects = projects.filter(p => resource.projects.includes(p.id));
          return (
            <div key={resource.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white text-lg font-bold flex-shrink-0">
                  {resource.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900">{resource.name}</div>
                  <div className="text-sm text-gray-500">{resource.role}</div>
                  <div className="text-xs text-blue-600 bg-blue-50 inline-block px-2 py-0.5 rounded-full mt-1">
                    {resource.department}
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>투입률</span>
                </div>
                <AllocationBar value={resource.allocation} />
              </div>

              <div className="mb-4">
                <div className="text-xs text-gray-500 mb-2">참여 프로젝트</div>
                <div className="space-y-1">
                  {resourceProjects.length > 0 ? resourceProjects.map(p => (
                    <div key={p.id} className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                        p.status === 'on-track' ? 'bg-green-500' :
                        p.status === 'at-risk' ? 'bg-amber-500' :
                        p.status === 'delayed' ? 'bg-red-500' : 'bg-blue-500'
                      }`} />
                      <span className="text-xs text-gray-600 truncate">{p.name}</span>
                    </div>
                  )) : (
                    <span className="text-xs text-gray-400">미배정</span>
                  )}
                </div>
              </div>

              <div className="mb-4">
                <div className="text-xs text-gray-500 mb-2">보유 기술</div>
                <div className="flex flex-wrap gap-1">
                  {resource.skills.slice(0, 4).map(skill => (
                    <span key={skill} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                      {skill}
                    </span>
                  ))}
                  {resource.skills.length > 4 && (
                    <span className="text-xs text-gray-400">+{resource.skills.length - 4}</span>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 space-y-1.5">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Mail size={12} />
                  <span className="truncate">{resource.email}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Phone size={12} />
                  <span>{resource.phone}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
