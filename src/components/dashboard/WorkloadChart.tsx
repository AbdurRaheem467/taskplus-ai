import React from 'react';
import { Task, TeamMember } from '../../types';
import { Users, BarChart3, PieChart } from 'lucide-react';

interface WorkloadChartProps {
  tasks: Task[];
  teamMembers: TeamMember[];
  onSelectMember: (member: TeamMember) => void;
}

export const WorkloadChart: React.FC<WorkloadChartProps> = ({
  tasks,
  teamMembers,
  onSelectMember,
}) => {
  return (
    <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-indigo-500" />
            Team Workload & Capacity
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Task distribution across all team members
          </p>
        </div>
      </div>

      <div className="space-y-3.5">
        {teamMembers.map(member => {
          const memberTasks = tasks.filter(t => t.assignedTo === member.id);
          const total = memberTasks.length;
          const completed = memberTasks.filter(t => t.status === 'completed').length;
          const overdue = memberTasks.filter(t => t.status === 'overdue').length;
          const active = total - completed;
          const completionPercentage = total > 0 ? Math.round((completed / total) * 100) : 0;

          return (
            <div
              key={member.id}
              onClick={() => onSelectMember(member)}
              className="group p-3 rounded-2xl border border-slate-100 dark:border-slate-800/80 hover:border-indigo-400 dark:hover:border-indigo-600 bg-slate-50/50 dark:bg-slate-800/30 transition-all cursor-pointer space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-7 h-7 rounded-xl flex items-center justify-center text-[11px] font-bold text-white shadow-xs"
                    style={{ backgroundColor: member.avatarColor || '#4f46e5' }}
                  >
                    {member.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {member.name}
                    </span>
                    <span className="text-[11px] text-slate-400 ml-1.5 font-medium">
                      ({member.role})
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  {overdue > 0 && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400">
                      {overdue} overdue
                    </span>
                  )}
                  <span className="text-slate-500 font-medium">
                    {completed}/{total} done
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700/80 overflow-hidden flex">
                <div
                  className="h-full bg-emerald-500 rounded-l-full transition-all duration-500"
                  style={{ width: `${completionPercentage}%` }}
                  title={`${completed} Completed (${completionPercentage}%)`}
                />
                {overdue > 0 && (
                  <div
                    className="h-full bg-rose-500 transition-all duration-500"
                    style={{ width: `${Math.round((overdue / (total || 1)) * 100)}%` }}
                    title={`${overdue} Overdue`}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
