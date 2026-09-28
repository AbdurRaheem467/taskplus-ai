import React, { useState } from 'react';
import { 
  X, 
  Clock, 
  Calendar, 
  User, 
  Flag, 
  Bell, 
  Edit3, 
  Trash2, 
  CheckCircle, 
  History, 
  Send,
  CalendarCheck2,
  AlertCircle
} from 'lucide-react';
import { Task, TeamMember, TaskActivity, TaskStatus } from '../../types';
import { PriorityBadge, StatusBadge } from '../common/Badge';
import { formatFullDateTime, getRemainingTimeText } from '../../utils/dateUtils';
import confetti from 'canvas-confetti';

interface TaskDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  teamMembers: TeamMember[];
  activityLogs: TaskActivity[];
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
  onAddComment: (taskId: string, comment: string) => void;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  isOpen,
  onClose,
  task,
  teamMembers,
  activityLogs,
  onEdit,
  onDelete,
  onStatusChange,
  onAddComment,
}) => {
  const [commentText, setCommentText] = useState('');

  if (!isOpen || !task) return null;

  const assignedMember = teamMembers.find(m => m.id === task.assignedTo);
  const remaining = getRemainingTimeText(task.deadline, task.status);

  const handleAddCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    onAddComment(task.id, commentText.trim());
    setCommentText('');
  };

  const handleToggleComplete = () => {
    const next = task.status === 'completed' ? 'in_progress' : 'completed';
    onStatusChange(task.id, next);
    if (next === 'completed') {
      try {
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (e) {}
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-2xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        role="dialog"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <PriorityBadge priority={task.priority} size="md" />
            <StatusBadge status={task.status} size="md" />
            {remaining.isOverdue && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400">
                {remaining.text}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onEdit(task)}
              className="p-2 rounded-xl text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Edit Task"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(task.id)}
              className="p-2 rounded-xl text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Delete Task"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button 
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Title & Description */}
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white leading-snug">
              {task.title}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
              {task.description || 'No detailed description provided.'}
            </p>
          </div>

          {/* Quick Actions Bar */}
          <div className="flex flex-wrap items-center gap-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
            <button
              onClick={handleToggleComplete}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                task.status === 'completed'
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 hover:bg-amber-200'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
              }`}
            >
              <CheckCircle className="w-3.5 h-3.5" />
              {task.status === 'completed' ? 'Reopen Task' : 'Mark as Completed'}
            </button>

            {task.status !== 'in_progress' && task.status !== 'completed' && (
              <button
                onClick={() => onStatusChange(task.id, 'in_progress')}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 hover:bg-blue-100 border border-blue-200 dark:border-blue-900"
              >
                Start In Progress
              </button>
            )}

            <div className="ml-auto text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {remaining.text}
            </div>
          </div>

          {/* Meta Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/60">
            {/* Assignee */}
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-white text-sm shadow-sm"
                style={{ backgroundColor: assignedMember?.avatarColor || '#4f46e5' }}
              >
                {assignedMember ? assignedMember.name.slice(0, 2).toUpperCase() : '??'}
              </div>
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Assigned Member
                </span>
                <span className="text-sm font-semibold text-slate-900 dark:text-white">
                  {assignedMember?.name || 'Unassigned'}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 block">
                  {assignedMember?.role || 'Team Member'}
                </span>
              </div>
            </div>

            {/* Deadline */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Deadline Date & Time
                </span>
                <span className="text-sm font-semibold text-slate-900 dark:text-white">
                  {formatFullDateTime(task.deadline)}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 block">
                  Reminder: {task.reminder === 'none' ? 'Disabled' : `${task.reminder} before`}
                </span>
              </div>
            </div>

            {/* Created At */}
            <div className="text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Created: </span>
              {formatFullDateTime(task.createdAt)}
            </div>

            {/* Start Date */}
            <div className="text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Start Date: </span>
              {task.startDate}
            </div>
          </div>

          {/* Activity History Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <History className="w-4 h-4 text-indigo-500" />
                Activity History & Progression
              </h3>
              <span className="text-xs text-slate-400 font-medium">
                {activityLogs.length} events
              </span>
            </div>

            {/* Timeline */}
            <div className="space-y-3 pl-2 border-l-2 border-slate-200 dark:border-slate-800 ml-3">
              {activityLogs.length === 0 ? (
                <p className="text-xs text-slate-400 italic pl-3">
                  No activity logged yet.
                </p>
              ) : (
                activityLogs.map((log) => (
                  <div key={log.id} className="relative pl-5 group">
                    {/* Timeline Node Dot */}
                    <div className="absolute -left-[19px] top-1.5 w-2.5 h-2.5 rounded-full bg-indigo-500 ring-4 ring-white dark:ring-slate-900" />
                    
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {log.details}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {formatFullDateTime(log.timestamp)}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        by <span className="font-medium text-indigo-600 dark:text-indigo-400">{log.performedBy}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Add Comment Input */}
            <form onSubmit={handleAddCommentSubmit} className="flex gap-2 pt-2">
              <input
                type="text"
                placeholder="Add a progress update, note or comment..."
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="submit"
                disabled={!commentText.trim()}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                Post
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
