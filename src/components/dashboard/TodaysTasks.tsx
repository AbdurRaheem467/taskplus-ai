import React from 'react';
import { Task, TeamMember } from '../../types';
import { PriorityBadge, StatusBadge } from '../common/Badge';
import { formatFullDateTime, getRemainingTimeText, formatTimeOnly } from '../../utils/dateUtils';
import { Clock, Bell, CheckCircle2, AlertCircle, Plus, ChevronRight } from 'lucide-react';

interface TodaysTasksProps {
  tasks: Task[];
  teamMembers: TeamMember[];
  onSelectTask: (task: Task) => void;
  onStatusToggle: (taskId: string) => void;
  onAddNewTask: () => void;
  onViewAllTasks: () => void;
}

export const TodaysTasks: React.FC<TodaysTasksProps> = ({
  tasks,
  teamMembers,
  onSelectTask,
  onStatusToggle,
  onAddNewTask,
  onViewAllTasks,
}) => {
  return (
    <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>Today's Tasks</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
              {tasks.length}
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Action items and deliverables due today
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onAddNewTask}
            className="p-1.5 rounded-xl text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Create Task"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={onViewAllTasks}
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
          >
            View All <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className="py-8 text-center text-xs text-slate-400 italic">
          No tasks due today. All caught up or assign work using Voice Task!
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map(task => {
            const assigned = teamMembers.find(m => m.id === task.assignedTo);
            const remaining = getRemainingTimeText(task.deadline, task.status);

            return (
              <div
                key={task.id}
                onClick={() => onSelectTask(task)}
                className={`group p-4 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  task.status === 'overdue'
                    ? 'border-rose-200 dark:border-rose-900/50 bg-rose-50/20'
                    : 'border-slate-200/60 dark:border-slate-800 hover:border-indigo-400 bg-white dark:bg-slate-800/40 shadow-sm'
                }`}
              >
                {/* Left: Quick check + Title + Assignee */}
                <div className="flex items-start sm:items-center gap-3 min-w-0">
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      onStatusToggle(task.id);
                    }}
                    className={`mt-0.5 sm:mt-0 w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
                      task.status === 'completed'
                        ? 'bg-emerald-500 text-white'
                        : 'border border-slate-300 dark:border-slate-700 text-transparent hover:text-emerald-500 hover:border-emerald-500'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </button>

                  <div className="min-w-0">
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                      {task.title}
                    </h4>
                    <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {/* Assignee Avatar */}
                      <div className="flex items-center gap-1.5">
                        <div
                          className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white shadow-xs"
                          style={{ backgroundColor: assigned?.avatarColor || '#4f46e5' }}
                        >
                          {assigned ? assigned.name.slice(0, 1).toUpperCase() : '?'}
                        </div>
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                          {assigned?.name || 'Unassigned'}
                        </span>
                      </div>
                      <span>•</span>
                      {/* Deadline time */}
                      <span>Due {formatTimeOnly(task.deadlineTime)}</span>
                      {task.reminder !== 'none' && (
                        <span className="flex items-center gap-1 text-purple-600 dark:text-purple-400">
                          <Bell className="w-3 h-3" />
                          {task.reminder}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Badges + Remaining time */}
                <div className="flex items-center gap-2.5 sm:justify-end flex-wrap">
                  <PriorityBadge priority={task.priority} />
                  <StatusBadge status={task.status} />
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    remaining.isOverdue 
                      ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400 font-bold' 
                      : remaining.isUrgent 
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' 
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                  }`}>
                    {remaining.text}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
