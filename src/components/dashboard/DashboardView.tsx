import React from 'react';
import { Task, TeamMember } from '../../types';
import { StatCard } from './StatCard';
import { TodaysTasks } from './TodaysTasks';
import { UpcomingDeadlines } from './UpcomingDeadlines';
import { WorkloadChart } from './WorkloadChart';
import { isTaskDueToday, isTaskOverdue } from '../../utils/dateUtils';
import { 
  CheckCircle2, 
  Clock, 
  Hourglass, 
  AlertTriangle, 
  CalendarDays, 
  Layers, 
  Mic, 
  Plus,
  Sparkles
} from 'lucide-react';

interface DashboardViewProps {
  tasks: Task[];
  teamMembers: TeamMember[];
  onSelectTask: (task: Task) => void;
  onStatusToggle: (taskId: string) => void;
  onAddNewTask: () => void;
  onOpenVoiceModal: () => void;
  onNavigateToTasks: (statusFilter?: string) => void;
  onNavigateToCalendar: () => void;
  onSelectMember: (member: TeamMember) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  tasks,
  teamMembers,
  onSelectTask,
  onStatusToggle,
  onAddNewTask,
  onOpenVoiceModal,
  onNavigateToTasks,
  onNavigateToCalendar,
  onSelectMember,
}) => {
  // Metric Calculations
  const totalCount = tasks.length;
  const pendingCount = tasks.filter(t => t.status === 'pending').length;
  const inProgressCount = tasks.filter(t => t.status === 'in_progress').length;
  const completedCount = tasks.filter(t => t.status === 'completed').length;
  const overdueCount = tasks.filter(t => t.status === 'overdue' || isTaskOverdue(t.deadline, t.status)).length;
  const dueTodayTasks = tasks.filter(t => isTaskDueToday(t.deadline));
  const dueTodayCount = dueTodayTasks.length;

  return (
    <div className="space-y-6">
      {/* Welcome & Quick Action Hero */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Dashboard Overview
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time team deliverables, active deadlines, and automated reminders
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Prominent Voice Task Button */}
          <button
            onClick={onOpenVoiceModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Mic className="w-4 h-4 animate-pulse" />
            <span>🎙️ Voice Task</span>
          </button>

          {/* New Task */}
          <button
            onClick={onAddNewTask}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 text-xs font-bold shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create Task</span>
          </button>
        </div>
      </div>

      {/* 6 Core Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Total Tasks */}
        <StatCard
          label="Total Tasks"
          count={totalCount}
          icon={Layers}
          colorClass="text-indigo-600 dark:text-indigo-400"
          bgClass="bg-indigo-50 dark:bg-indigo-950/60"
          onClick={() => onNavigateToTasks('all')}
        />

        {/* Pending Tasks */}
        <StatCard
          label="Pending Tasks"
          count={pendingCount}
          icon={Hourglass}
          colorClass="text-amber-600 dark:text-amber-400"
          bgClass="bg-amber-50 dark:bg-amber-950/60"
          badge="🟡 Pending"
          onClick={() => onNavigateToTasks('pending')}
        />

        {/* In Progress Tasks */}
        <StatCard
          label="In Progress"
          count={inProgressCount}
          icon={Clock}
          colorClass="text-blue-600 dark:text-blue-400"
          bgClass="bg-blue-50 dark:bg-blue-950/60"
          badge="🔵 Active"
          onClick={() => onNavigateToTasks('in_progress')}
        />

        {/* Completed Tasks */}
        <StatCard
          label="Completed"
          count={completedCount}
          icon={CheckCircle2}
          colorClass="text-emerald-600 dark:text-emerald-400"
          bgClass="bg-emerald-50 dark:bg-emerald-950/60"
          badge="🟢 Done"
          onClick={() => onNavigateToTasks('completed')}
        />

        {/* Overdue Tasks */}
        <StatCard
          label="Overdue Tasks"
          count={overdueCount}
          icon={AlertTriangle}
          colorClass="text-rose-600 dark:text-rose-400"
          bgClass="bg-rose-50 dark:bg-rose-950/60"
          badge="🔴 Overdue"
          onClick={() => onNavigateToTasks('overdue')}
        />

        {/* Tasks Due Today */}
        <StatCard
          label="Due Today"
          count={dueTodayCount}
          icon={CalendarDays}
          colorClass="text-purple-600 dark:text-purple-400"
          bgClass="bg-purple-50 dark:bg-purple-950/60"
          badge="Today"
          onClick={() => onNavigateToTasks('today')}
        />
      </div>

      {/* Main Grid: Today's Tasks + Upcoming & Workload */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Tasks Section (2 Cols on Large) */}
        <div className="lg:col-span-2">
          <TodaysTasks
            tasks={dueTodayTasks}
            teamMembers={teamMembers}
            onSelectTask={onSelectTask}
            onStatusToggle={onStatusToggle}
            onAddNewTask={onAddNewTask}
            onViewAllTasks={() => onNavigateToTasks('today')}
          />
        </div>

        {/* Right Column: Upcoming Deadlines + Workload */}
        <div className="space-y-6">
          <UpcomingDeadlines
            tasks={tasks}
            teamMembers={teamMembers}
            onSelectTask={onSelectTask}
            onViewCalendar={onNavigateToCalendar}
          />

          <WorkloadChart
            tasks={tasks}
            teamMembers={teamMembers}
            onSelectMember={onSelectMember}
          />
        </div>
      </div>
    </div>
  );
};
