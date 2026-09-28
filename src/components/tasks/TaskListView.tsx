import React from 'react';
import { Task, TeamMember } from '../../types';
import { PriorityBadge, StatusBadge } from '../common/Badge';
import { formatFullDateTime, getRemainingTimeText } from '../../utils/dateUtils';
import { CheckCircle, Clock, Bell, Edit3, Trash2, Calendar, MoreVertical } from 'lucide-react';

interface TaskListViewProps {
  tasks: Task[];
  teamMembers: TeamMember[];
  onSelectTask: (task: Task) => void;
  onStatusToggle: (taskId: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
}

export const TaskListView: React.FC<TaskListViewProps> = ({
  tasks,
  teamMembers,
  onSelectTask,
  onStatusToggle,
  onEdit,
  onDelete,
}) => {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/75 dark:bg-slate-950/40 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
              <th className="py-3 px-4 w-10">Done</th>
              <th className="py-3 px-4">Task Details</th>
              <th className="py-3 px-4">Assigned Person</th>
              <th className="py-3 px-4">Priority</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Deadline & Remaining</th>
              <th className="py-3 px-4">Reminder</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {tasks.map(task => {
              const assigned = teamMembers.find(m => m.id === task.assignedTo);
              const remaining = getRemainingTimeText(task.deadline, task.status);

              return (
                <tr
                  key={task.id}
                  onClick={() => onSelectTask(task)}
                  className={`group cursor-pointer transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40 ${
                    task.status === 'overdue' ? 'bg-rose-50/20 dark:bg-rose-950/10' : ''
                  }`}
                >
                  {/* Done Checkbox */}
                  <td className="py-3 px-4" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => onStatusToggle(task.id)}
                      className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
                        task.status === 'completed'
                          ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/30'
                          : 'border border-slate-300 dark:border-slate-700 hover:border-emerald-500 text-transparent hover:text-emerald-500'
                      }`}
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>
                  </td>

                  {/* Task Details */}
                  <td className="py-3 px-4 max-w-xs">
                    <div className="font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
                      {task.title}
                    </div>
                    {task.description && (
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                        {task.description}
                      </div>
                    )}
                  </td>

                  {/* Assigned Person */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-sm flex-shrink-0"
                        style={{ backgroundColor: assigned?.avatarColor || '#4f46e5' }}
                      >
                        {assigned ? assigned.name.slice(0, 2).toUpperCase() : '??'}
                      </div>
                      <span className="font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap">
                        {assigned?.name || 'Unassigned'}
                      </span>
                    </div>
                  </td>

                  {/* Priority */}
                  <td className="py-3 px-4">
                    <PriorityBadge priority={task.priority} />
                  </td>

                  {/* Status */}
                  <td className="py-3 px-4">
                    <StatusBadge status={task.status} />
                  </td>

                  {/* Deadline & Remaining */}
                  <td className="py-3 px-4">
                    <div className="text-slate-700 dark:text-slate-300 font-medium">
                      {formatFullDateTime(task.deadline)}
                    </div>
                    <div className={`text-[11px] font-medium flex items-center gap-1 mt-0.5 ${
                      remaining.isOverdue 
                        ? 'text-rose-600 dark:text-rose-400 font-bold' 
                        : remaining.isUrgent 
                        ? 'text-amber-600 dark:text-amber-400' 
                        : 'text-slate-400'
                    }`}>
                      <Clock className="w-3 h-3" />
                      {remaining.text}
                    </div>
                  </td>

                  {/* Reminder */}
                  <td className="py-3 px-4">
                    {task.reminder === 'none' ? (
                      <span className="text-slate-400">Off</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-purple-600 dark:text-purple-400 font-medium bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 rounded-full border border-purple-200 dark:border-purple-900/50">
                        <Bell className="w-3 h-3" />
                        {task.reminder} before
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 text-right" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => onEdit(task)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Edit task"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDelete(task.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Delete task"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
