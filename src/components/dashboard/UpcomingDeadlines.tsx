import React from 'react';
import { Task, TeamMember } from '../../types';
import { formatFullDateTime, getRemainingTimeText } from '../../utils/dateUtils';
import { Calendar, ChevronRight, Clock, AlertTriangle } from 'lucide-react';
import { PriorityBadge } from '../common/Badge';

interface UpcomingDeadlinesProps {
  tasks: Task[];
  teamMembers: TeamMember[];
  onSelectTask: (task: Task) => void;
  onViewCalendar: () => void;
}

export const UpcomingDeadlines: React.FC<UpcomingDeadlinesProps> = ({
  tasks,
  teamMembers,
  onSelectTask,
  onViewCalendar,
}) => {
  // Filter active tasks sorted by earliest deadline
  const upcoming = tasks
    .filter(t => t.status !== 'completed')
    .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
    .slice(0, 5);

  return (
    <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-500" />
            Upcoming Deadlines
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Next critical deliverables on the radar
          </p>
        </div>
        <button
          onClick={onViewCalendar}
          className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
        >
          Calendar <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {upcoming.length === 0 ? (
        <div className="py-8 text-center text-xs text-slate-400 italic">
          No upcoming deadlines.
        </div>
      ) : (
        <div className="space-y-3">
          {upcoming.map(task => {
            const assigned = teamMembers.find(m => m.id === task.assignedTo);
            const remaining = getRemainingTimeText(task.deadline, task.status);

            return (
              <div
                key={task.id}
                onClick={() => onSelectTask(task)}
                className={`p-3 rounded-2xl border transition-all cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-500 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between gap-3 ${
                  remaining.isOverdue ? 'border-rose-200 dark:border-rose-900/50 bg-rose-50/20' : 'border-slate-200/60 dark:border-slate-800'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <PriorityBadge priority={task.priority} />
                    <span className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                      {task.title}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
                    <span>{assigned?.name || 'Unassigned'}</span>
                    <span>•</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {formatFullDateTime(task.deadline)}
                    </span>
                  </div>
                </div>

                <div className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                  remaining.isOverdue
                    ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400'
                    : remaining.isUrgent
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
                }`}>
                  {remaining.text}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
