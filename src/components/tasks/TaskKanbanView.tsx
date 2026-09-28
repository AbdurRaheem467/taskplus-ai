import React from 'react';
import { Task, TeamMember, TaskStatus } from '../../types';
import { TaskCard } from './TaskCard';
import { Clock, Plus, ArrowRight, CheckCircle } from 'lucide-react';

interface TaskKanbanViewProps {
  tasks: Task[];
  teamMembers: TeamMember[];
  onSelectTask: (task: Task) => void;
  onStatusToggle: (taskId: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onMoveStatus: (taskId: string, newStatus: TaskStatus) => void;
  onAddNewToColumn: (status: TaskStatus) => void;
}

interface ColumnConfig {
  id: TaskStatus;
  title: string;
  dotColor: string;
  badgeBg: string;
  badgeText: string;
}

const COLUMNS: ColumnConfig[] = [
  {
    id: 'pending',
    title: 'Pending',
    dotColor: 'bg-amber-500',
    badgeBg: 'bg-amber-100 dark:bg-amber-950/60',
    badgeText: 'text-amber-800 dark:text-amber-300'
  },
  {
    id: 'in_progress',
    title: 'In Progress',
    dotColor: 'bg-blue-500',
    badgeBg: 'bg-blue-100 dark:bg-blue-950/60',
    badgeText: 'text-blue-800 dark:text-blue-300'
  },
  {
    id: 'completed',
    title: 'Completed',
    dotColor: 'bg-emerald-500',
    badgeBg: 'bg-emerald-100 dark:bg-emerald-950/60',
    badgeText: 'text-emerald-800 dark:text-emerald-300'
  }
];

export const TaskKanbanView: React.FC<TaskKanbanViewProps> = ({
  tasks,
  teamMembers,
  onSelectTask,
  onStatusToggle,
  onEdit,
  onDelete,
  onMoveStatus,
  onAddNewToColumn
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {COLUMNS.map(col => {
        // Overdue tasks should show in pending or in_progress according to their nature, but if status is overdue, group into pending with special highlight
        const colTasks = tasks.filter(t => {
          if (col.id === 'pending') {
            return t.status === 'pending' || t.status === 'overdue';
          }
          return t.status === col.id;
        });

        const overdueCount = colTasks.filter(t => t.status === 'overdue').length;

        return (
          <div
            key={col.id}
            className="flex flex-col rounded-3xl bg-slate-100/70 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80 p-4 min-h-[500px]"
          >
            {/* Column Header */}
            <div className="flex items-center justify-between mb-4 px-1">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${col.dotColor}`} />
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  {col.title}
                </h3>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${col.badgeBg} ${col.badgeText}`}>
                  {colTasks.length}
                </span>
                {overdueCount > 0 && col.id === 'pending' && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400">
                    {overdueCount} Overdue
                  </span>
                )}
              </div>

              <button
                onClick={() => onAddNewToColumn(col.id)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-slate-800 transition-colors"
                title={`Add task to ${col.title}`}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Task Cards in Column */}
            <div className="flex-1 space-y-3 overflow-y-auto pr-1">
              {colTasks.length === 0 ? (
                <div className="h-32 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center text-center p-4 text-xs text-slate-400">
                  No {col.title.toLowerCase()} tasks
                </div>
              ) : (
                colTasks.map(task => (
                  <div key={task.id} className="relative">
                    <TaskCard
                      task={task}
                      teamMembers={teamMembers}
                      onClick={onSelectTask}
                      onStatusToggle={onStatusToggle}
                      onEdit={onEdit}
                      onDelete={onDelete}
                    />

                    {/* Quick Move Shortcut in Kanban */}
                    <div className="flex items-center justify-end gap-1 mt-1 pr-1">
                      {col.id === 'pending' && (
                        <button
                          onClick={() => onMoveStatus(task.id, 'in_progress')}
                          className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5"
                        >
                          Start In Progress <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                      {col.id === 'in_progress' && (
                        <button
                          onClick={() => onMoveStatus(task.id, 'completed')}
                          className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5"
                        >
                          Mark Completed <CheckCircle className="w-3 h-3" />
                        </button>
                      )}
                      {col.id === 'completed' && (
                        <button
                          onClick={() => onMoveStatus(task.id, 'in_progress')}
                          className="text-[10px] font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:underline"
                        >
                          Reopen
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
