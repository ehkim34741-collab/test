import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Users,
  AlertTriangle,
  BarChart3,
  Settings,
  Building2,
  ClipboardList,
  Layers,
  Bot,
} from 'lucide-react';

const navItems = [
  { path: '/', label: '대시보드', icon: LayoutDashboard },
  { path: '/projects', label: '프로젝트', icon: FolderKanban },
  { path: '/tasks', label: '태스크', icon: CheckSquare },
  { path: '/resources', label: '리소스', icon: Users },
  { path: '/risks', label: '리스크', icon: AlertTriangle },
  { path: '/reports', label: '보고서', icon: BarChart3 },
  { path: '/requirements', label: '요구사항', icon: ClipboardList },
  { path: '/designs', label: '설계산출물', icon: Layers },
  { path: '/agent-team', label: '에이전트 팀', icon: Bot },
];

export default function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-slate-900 text-white flex flex-col z-10">
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center">
            <Building2 size={20} />
          </div>
          <div>
            <div className="font-bold text-sm">PMO 시스템</div>
            <div className="text-xs text-slate-400">프로젝트 관리 오피스</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(({ path, label, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            end={path === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-sm font-medium ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-700">
        <NavLink
          to="/settings"
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-all text-sm font-medium"
        >
          <Settings size={18} />
          설정
        </NavLink>
        <div className="mt-4 px-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-xs font-bold">
              김
            </div>
            <div>
              <div className="text-sm font-medium">김민준</div>
              <div className="text-xs text-slate-400">PMO 팀장</div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
