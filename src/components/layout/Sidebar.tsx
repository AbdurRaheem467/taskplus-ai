import React from 'react';
import { 
  LayoutDashboard, 
  CheckSquare, 
  Users, 
  Calendar, 
  Settings, 
  Sparkles, 
  Mic, 
  Bell, 
  ChevronLeft, 
  ChevronRight,
  ShieldCheck,
  Zap
} from 'lucide-react';

export type NavTab = 'dashboard' | 'tasks' | 'team' | 'calendar' | 'settings';

interface SidebarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  tasksCount: number;
  membersCount: number;
  overdueCount: number;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  onOpenVoiceModal: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  tasksCount,
  membersCount,
  overdueCount,
  isOpenMobile,
  onCloseMobile,
  onOpenVoiceModal,
}) => {
  const navItems = [
    {
      id: 'dashboard' as NavTab,
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      id: 'tasks' as NavTab,
      label: 'Tasks',
      icon: CheckSquare,
      badge: tasksCount > 0 ? tasksCount : undefined,
      badgeColor: overdueCount > 0 ? 'bg-rose-500 text-white' : undefined,
    },
    {
      id: 'team' as NavTab,
      label: 'Team Members',
      icon: Users,
      badge: membersCount > 0 ? membersCount : undefined,
    },
    {
      id: 'calendar' as NavTab,
      label: 'Calendar',
      icon: Calendar,
    },
    {
      id: 'settings' as NavTab,
      label: 'Settings',
      icon: Settings,
    },
  ];

  const handleNavClick = (id: NavTab) => {
    setActiveTab(id);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden animate-in fade-in"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 flex flex-col justify-between transition-transform duration-300 lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col flex-1 p-4 space-y-6">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <Zap className="w-5 h-5 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white">
                  TaskPulse
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 uppercase">
                  AI
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-medium block">
                Team & Deadline Manager
              </span>
            </div>
          </div>

          {/* Quick Voice Task CTA in Sidebar */}
          <button
            onClick={() => {
              onOpenVoiceModal();
              onCloseMobile();
            }}
            className="w-full p-3 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-700 text-white text-xs font-bold shadow-md shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 group"
          >
            <Mic className="w-4 h-4 animate-pulse group-hover:scale-110 transition-transform" />
            <span>🎙️ New Voice Task</span>
          </button>

          {/* Navigation Items */}
          <nav className="space-y-1.5 flex-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>

                  {item.badge !== undefined && (
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        item.badgeColor || (isActive ? 'bg-indigo-200 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400')
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer Info & Status Indicator */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/30">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                AI Voice Engine Active
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-400">
              v1.0.0
            </span>
          </div>
        </div>
      </aside>
    </>
  );
};
