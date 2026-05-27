import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  AlertTriangle,
  ShieldAlert,
  CheckSquare,
  ClipboardList,
  Layers,
  Bot,
  Building2,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { projectConfig } from '../data/projectConfig';

const navItems = [
  { path: '/', label: '대시보드', icon: LayoutDashboard },
  { path: '/issues', label: '이슈 관리', icon: AlertTriangle },
  { path: '/risks', label: '위험 관리', icon: ShieldAlert },
  { path: '/action-items', label: '액션아이템', icon: CheckSquare },
  { path: '/requirements', label: '요구사항', icon: ClipboardList },
  { path: '/designs', label: '설계산출물', icon: Layers },
  { path: '/agent-team', label: '에이전트 팀', icon: Bot },
];

export default function Sidebar() {
  const { currentUser, logout } = useAuth();

  const initials = currentUser?.displayName.slice(0, 1) ?? '?';
  const roleColors: Record<string, string> = {
    'PM': 'bg-blue-500',
    '기획자': 'bg-purple-500',
    '개발자': 'bg-green-500',
    '테스터': 'bg-amber-500',
    '운영': 'bg-teal-500',
    '분석가': 'bg-indigo-500',
  };
  const avatarBg = currentUser ? (roleColors[currentUser.role] ?? 'bg-slate-500') : 'bg-slate-500';

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-slate-900 text-white flex flex-col z-10">
      <div className="p-5 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <Building2 size={20} />
          </div>
          <div className="min-w-0">
            <div className="font-bold text-sm truncate">{projectConfig.name}</div>
            <div className="text-xs text-slate-400">{projectConfig.code}</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
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
        {currentUser && (
          <div className="flex items-center gap-3 px-2 py-2 mb-2">
            <div className={`w-8 h-8 ${avatarBg} rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0`}>
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium truncate">{currentUser.displayName}</div>
              <div className="text-xs text-slate-400">{currentUser.role}</div>
            </div>
            <button onClick={logout} title="로그아웃"
              className="text-slate-400 hover:text-white transition-colors flex-shrink-0">
              <LogOut size={16} />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
