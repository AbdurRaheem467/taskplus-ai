import React, { useState, useMemo } from 'react';
import { 
  Task, 
  TeamMember, 
  TaskPriority, 
  TaskStatus, 
  TaskActivity 
} from '../../types';
import { TaskListView } from './TaskListView';
import { TaskKanbanView } from './TaskKanbanView';
import { TaskModal } from './TaskModal';
import { TaskDetailModal } from './TaskDetailModal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { EmptyState } from '../common/EmptyState';
import { 
  Search, 
  Filter, 
  List, 
  Kanban, 
  Plus, 
  Mic, 
  SlidersHorizontal, 
  Calendar,
  CheckCircle2,
  Clock,
  Sparkles
} from 'lucide-react';
import { isTaskOverdue, isTaskDueToday } from '../../utils/dateUtils';
import { parseISO, isThisWeek } from 'date-fns';

interface TasksViewProps {
  tasks: Task[];
  teamMembers: TeamMember[];
  activityLogs: TaskActivity[];
  onSaveTask: (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
  onDeleteTask: (taskId: string) => void;
  onAddComment: (taskId: string, comment: string) => void;
  onOpenVoiceModal: () => void;
}

export const TasksView: React.FC<TasksViewProps> = ({
  tasks,
  teamMembers,
  activityLogs,
  onSaveTask,
  onUpdateTask,
  onDeleteTask,
  onAddComment,
  onOpenVoiceModal,
}) => {
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMember, setSelectedMember] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [selectedDeadlineToFilter, setSelectedDeadlineToFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'deadline' | 'newest' | 'priority' | 'title'>('deadline');

  // Modals
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [selectedDetailTask, setSelectedDetailTask] = useState<Task | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // Filter & Sort Logic
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const member = teamMembers.find(m => m.id === task.assignedTo);
        const matchTitle = task.title.toLowerCase().includes(q);
        const matchDesc = task.description.toLowerCase().includes(q);
        const matchMember = member?.name.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchMember) return false;
      }

      // Member Filter
      if (selectedMember !== 'all' && task.assignedTo !== selectedMember) {
        return false;
      }

      // Status Filter
      if (selectedStatus !== 'all') {
        if (selectedStatus === 'overdue') {
          if (task.status !== 'overdue' && !isTaskOverdue(task.deadline, task.status)) return false;
        } else if (task.status !== selectedStatus) {
          return false;
        }
      }

      // Priority Filter
      if (selectedPriority !== 'all' && task.priority !== selectedPriority) {
        return false;
      }

      // Deadline Filter
      if (selectedDeadlineToFilter !== 'all') {
        if (selectedDeadlineToFilter === 'overdue') {
          if (task.status !== 'overdue' && !isTaskOverdue(task.deadline, task.status)) return false;
        } else if (selectedDeadlineToFilter === 'today') {
          if (!isTaskDueToday(task.deadline)) return false;
        } else if (selectedDeadlineToFilter === 'this_week') {
          try {
            if (!isThisWeek(parseISO(task.deadline))) return false;
          } catch {
            return false;
          }
        }
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'deadline') {
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      }
      if (sortBy === 'newest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === 'priority') {
        const order = { urgent: 4, high: 3, medium: 2, low: 1 };
        return order[b.priority] - order[a.priority];
      }
      if (sortBy === 'title') {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });
  }, [tasks, teamMembers, searchQuery, selectedMember, selectedStatus, selectedPriority, selectedDeadlineToFilter, sortBy]);

  const handleOpenEdit = (task: Task) => {
    setTaskToEdit(task);
    setIsTaskModalOpen(true);
    if (selectedDetailTask?.id === task.id) {
      setSelectedDetailTask(null);
    }
  };

  const handleStatusToggle = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      const nextStatus = task.status === 'completed' ? 'in_progress' : 'completed';
      onUpdateTask(taskId, { status: nextStatus });
    }
  };

  const handleMoveStatus = (taskId: string, newStatus: TaskStatus) => {
    onUpdateTask(taskId, { status: newStatus });
  };

  const handleConfirmDelete = () => {
    if (deleteTargetId) {
      onDeleteTask(deleteTargetId);
      if (selectedDetailTask?.id === deleteTargetId) {
        setSelectedDetailTask(null);
      }
      setDeleteTargetId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Task Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Organize, monitor, and assign deliverables with real-time deadline tracking
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Voice Task Button (Prominent) */}
          <button
            onClick={onOpenVoiceModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Mic className="w-4 h-4 animate-pulse" />
            <span>🎙️ Voice Task</span>
          </button>

          {/* Manual Create Task */}
          <button
            onClick={() => {
              setTaskToEdit(null);
              setIsTaskModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 text-xs font-bold shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create Task</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search tasks, descriptions, or assigned team members..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* View Mode Toggle (List / Kanban) */}
          <div className="flex items-center p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60">
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              List View
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                viewMode === 'kanban'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <Kanban className="w-3.5 h-3.5" />
              Kanban View
            </button>
          </div>
        </div>

        {/* Filter Dropdowns Row */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80">
          {/* Member Filter */}
          <select
            value={selectedMember}
            onChange={e => setSelectedMember(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Members</option>
            {teamMembers.map(m => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="overdue">Overdue 🔴</option>
          </select>

          {/* Priority Filter */}
          <select
            value={selectedPriority}
            onChange={e => setSelectedPriority(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          {/* Deadline Filter */}
          <select
            value={selectedDeadlineToFilter}
            onChange={e => setSelectedDeadlineToFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Deadlines</option>
            <option value="overdue">Overdue</option>
            <option value="today">Due Today</option>
            <option value="this_week">Due This Week</option>
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
          >
            <option value="deadline">Sort: Deadline</option>
            <option value="newest">Sort: Newest</option>
            <option value="priority">Sort: Priority</option>
            <option value="title">Sort: Title (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Task Content List / Kanban */}
      {filteredTasks.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="No tasks found"
          description={
            searchQuery || selectedMember !== 'all' || selectedStatus !== 'all'
              ? 'No tasks matched your current filter criteria. Try clearing filters or search term.'
              : 'You have not added any tasks yet. Create your first task or speak via Voice Task!'
          }
          actionText="Create Task"
          onAction={() => {
            setTaskToEdit(null);
            setIsTaskModalOpen(true);
          }}
          secondaryActionText="🎙️ Speak Voice Task"
          onSecondaryAction={onOpenVoiceModal}
        />
      ) : viewMode === 'list' ? (
        <TaskListView
          tasks={filteredTasks}
          teamMembers={teamMembers}
          onSelectTask={setSelectedDetailTask}
          onStatusToggle={handleStatusToggle}
          onEdit={handleOpenEdit}
          onDelete={id => setDeleteTargetId(id)}
        />
      ) : (
        <TaskKanbanView
          tasks={filteredTasks}
          teamMembers={teamMembers}
          onSelectTask={setSelectedDetailTask}
          onStatusToggle={handleStatusToggle}
          onEdit={handleOpenEdit}
          onDelete={id => setDeleteTargetId(id)}
          onMoveStatus={handleMoveStatus}
          onAddNewToColumn={status => {
            setTaskToEdit(null);
            setIsTaskModalOpen(true);
          }}
        />
      )}

      {/* Modals */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setTaskToEdit(null);
        }}
        taskToEdit={taskToEdit}
        teamMembers={teamMembers}
        onSave={taskData => {
          if (taskToEdit) {
            onUpdateTask(taskToEdit.id, taskData);
          } else {
            onSaveTask(taskData);
          }
        }}
      />

      <TaskDetailModal
        isOpen={!!selectedDetailTask}
        onClose={() => setSelectedDetailTask(null)}
        task={selectedDetailTask}
        teamMembers={teamMembers}
        activityLogs={selectedDetailTask ? activityLogs.filter(a => a.taskId === selectedDetailTask.id) : []}
        onEdit={handleOpenEdit}
        onDelete={id => setDeleteTargetId(id)}
        onStatusChange={(taskId, newStatus) => {
          onUpdateTask(taskId, { status: newStatus });
          if (selectedDetailTask) {
            setSelectedDetailTask({ ...selectedDetailTask, status: newStatus });
          }
        }}
        onAddComment={onAddComment}
      />

      <ConfirmDialog
        isOpen={!!deleteTargetId}
        title="Delete Task"
        message="Are you sure you want to permanently delete this task? This action cannot be undone."
        confirmLabel="Delete Task"
        isDestructive={true}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTargetId(null)}
      />
    </div>
  );
};
