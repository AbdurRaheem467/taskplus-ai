import React, { useState, useEffect, useRef } from 'react';
import { Search, X, CheckSquare, Users, Calendar, Clock, ArrowRight, CornerDownLeft } from 'lucide-react';
import { Task, TeamMember } from '../../types';
import { PriorityBadge, StatusBadge } from '../common/Badge';
import { formatFullDateTime } from '../../utils/dateUtils';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  teamMembers: TeamMember[];
  onSelectTask: (task: Task) => void;
  onSelectMember: (member: TeamMember) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  tasks,
  teamMembers,
  onSelectTask,
  onSelectMember,
}) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Keyboard shortcut listener (Escape to close)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const cleanQuery = query.toLowerCase().trim();

  // Search Results
  const matchingTasks = cleanQuery
    ? tasks.filter(t => {
        const member = teamMembers.find(m => m.id === t.assignedTo);
        return (
          t.title.toLowerCase().includes(cleanQuery) ||
          t.description?.toLowerCase().includes(cleanQuery) ||
          t.status.toLowerCase().includes(cleanQuery) ||
          t.priority.toLowerCase().includes(cleanQuery) ||
          t.deadlineDate.includes(cleanQuery) ||
          member?.name.toLowerCase().includes(cleanQuery)
        );
      })
    : [];

  const matchingMembers = cleanQuery
    ? teamMembers.filter(m => 
        m.name.toLowerCase().includes(cleanQuery) ||
        m.email.toLowerCase().includes(cleanQuery) ||
        m.role.toLowerCase().includes(cleanQuery)
      )
    : [];

  const totalResults = matchingTasks.length + matchingMembers.length;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="w-full max-w-2xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col"
        role="dialog"
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-5 py-4 border-b border-slate-100 dark:border-slate-800 gap-3">
          <Search className="w-5 h-5 text-indigo-500 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search tasks, descriptions, members, status, deadlines... (e.g. 'Ali', 'homepage', 'urgent')"
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
          />
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700">
              ESC
            </span>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Results Container */}
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4">
          {!cleanQuery ? (
            <div className="py-12 text-center text-xs text-slate-400">
              Type keywords to search across all tasks, team members, deadlines, and statuses...
            </div>
          ) : totalResults === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No results found for "{query}".
            </div>
          ) : (
            <>
              {/* Matching Members */}
              {matchingMembers.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2">
                    Team Members ({matchingMembers.length})
                  </span>
                  <div className="space-y-1.5">
                    {matchingMembers.map(member => (
                      <div
                        key={member.id}
                        onClick={() => {
                          onSelectMember(member);
                          onClose();
                        }}
                        className="p-3 rounded-2xl border border-slate-100 dark:border-slate-800/80 hover:border-indigo-400 dark:hover:border-indigo-600 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer flex items-center justify-between transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold shadow-xs"
                            style={{ backgroundColor: member.avatarColor || '#4f46e5' }}
                          >
                            {member.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span className="text-xs font-bold text-slate-900 dark:text-white">
                              {member.name}
                            </span>
                            <span className="text-[11px] text-slate-400 ml-2">
                              {member.role} • {member.email}
                            </span>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-400" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Matching Tasks */}
              {matchingTasks.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2">
                    Tasks ({matchingTasks.length})
                  </span>
                  <div className="space-y-1.5">
                    {matchingTasks.map(task => {
                      const assigned = teamMembers.find(m => m.id === task.assignedTo);
                      return (
                        <div
                          key={task.id}
                          onClick={() => {
                            onSelectTask(task);
                            onClose();
                          }}
                          className="p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800/80 hover:border-indigo-400 dark:hover:border-indigo-600 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-all space-y-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <PriorityBadge priority={task.priority} />
                              <StatusBadge status={task.status} />
                              <span className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
                                {task.title}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-400 whitespace-nowrap">
                              {formatFullDateTime(task.deadline)}
                            </span>
                          </div>

                          {task.description && (
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 pl-1">
                              {task.description}
                            </p>
                          )}

                          <div className="text-[11px] text-slate-400 pl-1">
                            Assigned to: <span className="text-slate-700 dark:text-slate-300 font-medium">{assigned?.name || 'Unassigned'}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 text-[11px] text-slate-400 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>Press</span>
            <span className="font-mono bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
              Ctrl + K
            </span>
            <span>anytime to search</span>
          </div>
          <span>TaskPulse AI Instant Search</span>
        </div>
      </div>
    </div>
  );
};
