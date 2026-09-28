import React from 'react';
import { Clock, Calendar, CheckCircle, MoreVertical, AlertTriangle, Bell, Edit3, Trash2, ArrowRight } from 'lucide-react';
import { Task, TeamMember } from '../../types';
import { PriorityBadge, StatusBadge } from '../common/Badge';
import { formatFullDateTime, getRemainingTimeText } from '../../utils/dateUtils';

interface TaskCardProps {
  task: Task;
  teamMembers: TeamMember[];
  onClick: (task: Task) => void;
  onStatusToggle: (taskId: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  teamMembers,
  onClick,
  onStatusToggle,
  onEdit,
  onDelete,
}) => {
  const assignedMember = teamMembers.find(m => m.id === task.assignedTo);
  const remaining = getRemainingTimeText(task.deadline, task.status);

  return (
    <div 
      className={`group relative rounded-2xl bg-white dark:bg-slate-900 border transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 p-4 flex flex-col justify-between ${
        task.status === 'overdue'
          ? 'border-rose-300/80 dark:border-rose-900/60 ring-1 ring-rose-500/20 bg-rose-50/10'
          : task.status === 'completed'
          ? 'border-emerald-200/60 dark:border-emerald-950/40 opacity-80'
          : 'border-slate-200/80 dark:border-slate-800 shadow-sm'
      }`}
    >
      {/* Top Badges & Actions */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          <PriorityBadge priority={task.priority} />
          <StatusBadge status={task.status} />
        </div>

        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onStatusToggle(task.id);
            }}
            className={`p-1.5 rounded-lg transition-colors ${
              task.status === 'completed'
                ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50'
                : 'text-slate-400 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title={task.status === 'completed' ? 'Reopen task' : 'Mark as completed'}
          >
            <CheckCircle className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(task);
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Edit task"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Title & Description (Clickable to open details) */}
      <div 
        onClick={() => onClick(task)}
        className="cursor-pointer space-y-1.5 mb-3"
      >
        <h4 className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2">
          {task.title}
        </h4>
        {task.description && (
          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
            {task.description}
          </p>
        )}
      </div>

      {/* Footer Info */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs gap-2">
        {/* Assignee Avatar */}
        <div className="flex items-center gap-2 min-w-0">
          <div
            className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-white shadow-sm"
            style={{ backgroundColor: assignedMember?.avatarColor || '#4f46e5' }}
            title={assignedMember?.name}
          >
            {assignedMember ? assignedMember.name.slice(0, 2).toUpperCase() : '??'}
          </div>
          <span className="truncate text-slate-700 dark:text-slate-300 font-medium">
            {assignedMember?.name || 'Unassigned'}
          </span>
        </div>

        {/* Remaining Time & Reminder status */}
        <div className="flex items-center gap-1.5 flex-shrink-0 text-slate-500 dark:text-slate-400">
          {task.reminder !== 'none' && (
            <span title={`Reminder: ${task.reminder} before`}>
              <Bell className="w-3 h-3 text-purple-500" />
            </span>
          )}
          <span className={`font-medium ${remaining.isOverdue ? 'text-rose-600 dark:text-rose-400 font-bold' : remaining.isUrgent ? 'text-amber-600 dark:text-amber-400 font-semibold' : ''}`}>
            {remaining.text}
          </span>
        </div>
      </div>
    </div>
  );
};
