import React from 'react';
import { X, Mail, Briefcase, Calendar, CheckCircle2, Clock, AlertTriangle, Plus, Edit3, Trash2 } from 'lucide-react';
import { TeamMember, Task } from '../../types';
import { TaskCard } from '../tasks/TaskCard';
import { PriorityBadge, StatusBadge } from '../common/Badge';
import { formatFullDateTime } from '../../utils/dateUtils';

interface MemberDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  member: TeamMember | null;
  tasks: Task[];
  teamMembers: TeamMember[];
  onSelectTask: (task: Task) => void;
  onStatusToggle: (taskId: string) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onAddNewTaskForMember: (memberId: string) => void;
  onEditMember: (member: TeamMember) => void;
}

export const MemberDetailDrawer: React.FC<MemberDetailDrawerProps> = ({
  isOpen,
  onClose,
  member,
  tasks,
  teamMembers,
  onSelectTask,
  onStatusToggle,
  onEditTask,
  onDeleteTask,
  onAddNewTaskForMember,
  onEditMember,
}) => {
  if (!isOpen || !member) return null;

  const memberTasks = tasks.filter(t => t.assignedTo === member.id);
  const total = memberTasks.length;
  const completed = memberTasks.filter(t => t.status === 'completed').length;
  const pending = memberTasks.filter(t => t.status === 'pending').length;
  const inProgress = memberTasks.filter(t => t.status === 'in_progress').length;
  const overdue = memberTasks.filter(t => t.status === 'overdue').length;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-xl h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-300"
        role="dialog"
      >
        {/* Drawer Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-base font-bold shadow-md"
              style={{ backgroundColor: member.avatarColor || '#4f46e5' }}
            >
              {member.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                {member.name}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {member.role} • {member.email}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onEditMember(member)}
              className="p-2 rounded-xl text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              title="Edit Member Profile"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 space-y-4">
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <span className="text-xs font-medium text-slate-400 block">Total</span>
              <span className="text-lg font-extrabold text-slate-900 dark:text-white">{total}</span>
            </div>
            <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/40">
              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 block">Done</span>
              <span className="text-lg font-extrabold text-emerald-700 dark:text-emerald-300">{completed}</span>
            </div>
            <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/40">
              <span className="text-xs font-medium text-blue-600 dark:text-blue-400 block">Active</span>
              <span className="text-lg font-extrabold text-blue-700 dark:text-blue-300">{inProgress + pending}</span>
            </div>
            <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/40">
              <span className="text-xs font-medium text-rose-600 dark:text-rose-400 block">Overdue</span>
              <span className="text-lg font-extrabold text-rose-700 dark:text-rose-300">{overdue}</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div>
            <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
              <span>Task Completion Rate</span>
              <span>{completionRate}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${completionRate}%` }}
              />
            </div>
          </div>
        </div>

        {/* Assigned Tasks List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Assigned Tasks ({memberTasks.length})
            </h3>
            <button
              onClick={() => onAddNewTaskForMember(member.id)}
              className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/80 text-indigo-600 dark:text-indigo-400 text-xs font-bold transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              Assign Task
            </button>
          </div>

          {memberTasks.length === 0 ? (
            <div className="py-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl text-center p-6 text-xs text-slate-400">
              No tasks currently assigned to {member.name}. Click "Assign Task" above to delegate work.
            </div>
          ) : (
            <div className="space-y-3">
              {memberTasks.map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  teamMembers={teamMembers}
                  onClick={onSelectTask}
                  onStatusToggle={onStatusToggle}
                  onEdit={onEditTask}
                  onDelete={onDeleteTask}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
