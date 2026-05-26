import { useState } from 'react';
import { Search, Plus, Calendar } from 'lucide-react';
import { tasks } from '../data/mockData';
import StatusBadge from '../components/StatusBadge';
import type { Task } from '../types';

type TaskStatus = Task['status'];

const columns: { key: TaskStatus; label: string; color: string }[] = [
  { key: 'todo', label: '예정', color: 'bg-gray-500' },
  { key: 'in-progress', label: '진행중', color: 'bg-blue-500' },
  { key: 'review', label: '검토중', color: 'bg-purple-500' },
  { key: 'done', label: '완료', color: 'bg-green-500' },
];

const priorityColors: Record<string, string> = {
  low: 'border-l-gray-300',
  medium: 'border-l-blue-400',
  high: 'border-l-orange-400',
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const isOverdue = d < now;
  return { text: dateStr.replace(/-/g, '.'), overdue: isOverdue };
}

export default function Tasks() {
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'kanban' | 'list'>('kanban');

  const filtered = tasks.filter(t =>
    t.title.includes(search) || t.assignee.includes(search) || t.projectName.includes(search)
  );

  const getByStatus = (status: TaskStatus) => filtered.filter(t => t.status === status);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">태스크 관리</h1>
          <p className="text-gray-500 mt-1">총 {tasks.length}개 태스크</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setView('kanban')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${view === 'kanban' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            >
              칸반
            </button>
            <button
              onClick={() => setView('list')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${view === 'list' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            >
              목록
            </button>
          </div>
          <button className="btn-primary flex items-center gap-2">
            <Plus size={16} />
            태스크 등록
          </button>
        </div>
      </div>

      <div className="relative max-w-xs mb-6">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="태스크명, 담당자, 프로젝트 검색..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {view === 'kanban' ? (
        <div className="grid grid-cols-4 gap-6">
          {columns.map(col => {
            const colTasks = getByStatus(col.key);
            return (
              <div key={col.key} className="bg-gray-100 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-4">
                  <div className={`w-2 h-2 rounded-full ${col.color}`} />
                  <span className="text-sm font-semibold text-gray-700">{col.label}</span>
                  <span className="ml-auto bg-white text-gray-600 text-xs px-2 py-0.5 rounded-full font-medium">
                    {colTasks.length}
                  </span>
                </div>
                <div className="space-y-3">
                  {colTasks.map(task => {
                    const { text, overdue } = formatDate(task.dueDate);
                    return (
                      <div
                        key={task.id}
                        className={`bg-white rounded-lg p-4 shadow-sm border-l-4 ${priorityColors[task.priority]} cursor-pointer hover:shadow-md transition-shadow`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h4 className="text-sm font-medium text-gray-800 leading-snug">{task.title}</h4>
                          <StatusBadge status={task.priority} type="priority" />
                        </div>
                        <p className="text-xs text-gray-500 mb-3 line-clamp-2">{task.description}</p>
                        <div className="flex flex-wrap gap-1 mb-3">
                          {task.tags.map(tag => (
                            <span key={tag} className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                              {tag}
                            </span>
                          ))}
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                              {task.assignee[0]}
                            </div>
                            <span className="text-xs text-gray-500">{task.assignee}</span>
                          </div>
                          <div className={`flex items-center gap-1 text-xs ${overdue && task.status !== 'done' ? 'text-red-500' : 'text-gray-400'}`}>
                            <Calendar size={11} />
                            {text}
                          </div>
                        </div>
                        <div className="mt-2 text-xs text-gray-400 truncate">{task.projectName}</div>
                      </div>
                    );
                  })}
                  {colTasks.length === 0 && (
                    <div className="text-center text-xs text-gray-400 py-8">태스크 없음</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">태스크명</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">프로젝트</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">담당자</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">우선순위</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">상태</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">마감일</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(task => {
                const { text, overdue } = formatDate(task.dueDate);
                return (
                  <tr key={task.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{task.title}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{task.description}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{task.projectName}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                          {task.assignee[0]}
                        </div>
                        <span className="text-sm text-gray-700">{task.assignee}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={task.priority} type="priority" />
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={task.status} type="task" />
                    </td>
                    <td className={`px-6 py-4 text-sm ${overdue && task.status !== 'done' ? 'text-red-500 font-medium' : 'text-gray-600'}`}>
                      {text}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
