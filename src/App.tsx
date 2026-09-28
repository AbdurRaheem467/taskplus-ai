import React, { useState, useEffect, useCallback } from 'react';
import { 
  Task, 
  TeamMember, 
  TaskActivity, 
  NotificationItem, 
  AppSettings, 
  TaskStatus, 
  TaskPriority,
  TaskReminderOption 
} from './types';
import { dbService } from './services/db';
import { Sidebar, NavTab } from './components/layout/Sidebar';
import { Navbar } from './components/layout/Navbar';
import { GlobalSearchModal } from './components/layout/GlobalSearchModal';
import { DashboardView } from './components/dashboard/DashboardView';
import { TasksView } from './components/tasks/TasksView';
import { TeamView } from './components/team/TeamView';
import { CalendarView } from './components/calendar/CalendarView';
import { SettingsView } from './components/settings/SettingsView';
import { VoiceTaskModal } from './components/voice/VoiceTaskModal';
import { TaskModal } from './components/tasks/TaskModal';
import { TaskDetailModal } from './components/tasks/TaskDetailModal';
import { NotificationDrawer } from './components/notifications/NotificationDrawer';
import { ConfirmDialog } from './components/common/ConfirmDialog';
import { Mic, Plus } from 'lucide-react';
import { isPast, parseISO, differenceInMinutes } from 'date-fns';

export const App: React.FC = () => {
  // Core Entities State
  const [tasks, setTasks] = useState<Task[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [activityLogs, setActivityLogs] = useState<TaskActivity[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [settings, setSettings] = useState<AppSettings>(dbService.getSettings());

  // UI Navigation State
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('taskpulse_theme');
    if (saved) return saved === 'dark';
    return true; // Default dark mode
  });

  // Modal Visibility States
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isNotificationDrawerOpen, setIsNotificationDrawerOpen] = useState(false);
  const [selectedDetailTask, setSelectedDetailTask] = useState<Task | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Initial Load from DB
  const refreshData = useCallback(() => {
    setTasks(dbService.getTasks());
    setTeamMembers(dbService.getTeamMembers());
    setActivityLogs(dbService.getActivityLogs());
    setNotifications(dbService.getNotifications());
    setSettings(dbService.getSettings());
  }, []);

  useEffect(() => {
    // Purge any old v1 demo data keys
    ['taskpulse_tasks_v1', 'taskpulse_members_v1', 'taskpulse_activity_v1', 'taskpulse_notifications_v1'].forEach(k => {
      try { localStorage.removeItem(k); } catch (e) {}
    });
    refreshData();
  }, [refreshData]);

  // Dark Mode Sync
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('taskpulse_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('taskpulse_theme', 'light');
    }
  }, [darkMode]);

  // Global Keyboard Shortcuts (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchModalOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Periodic Reminder & Overdue Scanner (runs every 30 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      const currentTasks = dbService.getTasks();
      const currentMembers = dbService.getTeamMembers();
      const now = new Date();
      let hadUpdates = false;

      currentTasks.forEach(task => {
        if (task.status === 'completed') return;

        try {
          const deadline = parseISO(task.deadline);
          const diffMins = differenceInMinutes(deadline, now);

          // Overdue detection
          if (isPast(deadline) && task.status !== 'overdue') {
            hadUpdates = true;
            dbService.updateTask(task.id, { status: 'overdue' });
            const member = currentMembers.find(m => m.id === task.assignedTo);
            dbService.addNotification({
              taskId: task.id,
              type: 'overdue',
              title: 'Task Overdue Alert 🔴',
              message: `${member ? member.name : 'Assigned person'}'s task "${task.title}" is overdue!`,
              priority: task.priority
            });
          }

          // Reminder Trigger
          if (!task.reminderTriggered && task.reminder !== 'none') {
            let thresholdMinutes = 60; // default 1h
            if (task.reminder === '15m') thresholdMinutes = 15;
            else if (task.reminder === '30m') thresholdMinutes = 30;
            else if (task.reminder === '1h') thresholdMinutes = 60;
            else if (task.reminder === '2h') thresholdMinutes = 120;
            else if (task.reminder === '1d') thresholdMinutes = 1440;
            else if (task.reminder === 'custom' && task.customReminderMinutes) {
              thresholdMinutes = task.customReminderMinutes;
            }

            if (diffMins > 0 && diffMins <= thresholdMinutes) {
              hadUpdates = true;
              dbService.updateTask(task.id, { reminderTriggered: true });
              const member = currentMembers.find(m => m.id === task.assignedTo);
              dbService.addNotification({
                taskId: task.id,
                type: 'reminder',
                title: 'Upcoming Deadline Reminder 🔔',
                message: `Reminder: ${member ? member.name : 'Team member'}'s task "${task.title}" is due in ${Math.max(1, Math.round(diffMins))} minutes.`,
                priority: task.priority
              });
            }
          }
        } catch (e) {}
      });

      if (hadUpdates) {
        refreshData();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [refreshData]);

  // Handlers for Tasks
  const handleSaveTask = (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    dbService.createTask(taskData, 'Admin');
    refreshData();
  };

  const handleVoiceTaskCreated = (taskData: {
    title: string;
    description: string;
    assignedTo: string;
    priority: TaskPriority;
    startDate: string;
    deadlineDate: string;
    deadlineTime: string;
    reminder: TaskReminderOption;
  }) => {
    const isoDeadline = `${taskData.deadlineDate}T${taskData.deadlineTime}:00`;
    dbService.createTask({
      ...taskData,
      deadline: new Date(isoDeadline).toISOString(),
      status: 'pending'
    }, 'Admin (Voice AI)');
    refreshData();
  };

  const handleUpdateTask = (taskId: string, updates: Partial<Task>) => {
    dbService.updateTask(taskId, updates);
    refreshData();
  };

  const handleDeleteTask = (taskId: string) => {
    dbService.deleteTask(taskId);
    refreshData();
  };

  const handleStatusToggle = (taskId: string) => {
    dbService.toggleTaskStatus(taskId);
    refreshData();
  };

  const handleAddComment = (taskId: string, comment: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      dbService.addActivityLog({
        taskId,
        taskTitle: task.title,
        action: 'comment_added',
        details: comment,
        performedBy: 'Admin'
      });
      refreshData();
    }
  };

  // Handlers for Team Members
  const handleSaveMember = (data: Omit<TeamMember, 'id' | 'createdAt' | 'updatedAt'>) => {
    dbService.createTeamMember(data);
    refreshData();
  };

  const handleUpdateMember = (id: string, updates: Partial<TeamMember>) => {
    dbService.updateTeamMember(id, updates);
    refreshData();
  };

  const handleDeleteMember = (id: string) => {
    dbService.deleteTeamMember(id);
    refreshData();
  };

  // Handlers for Settings
  const handleSaveSettings = (newSettings: Partial<AppSettings>) => {
    const updated = dbService.saveSettings(newSettings);
    setSettings(updated);
  };

  const handleResetData = () => {
    dbService.resetAllData();
    refreshData();
  };

  // Quick navigation helper
  const handleNavigateToTasks = (statusFilter?: string) => {
    setActiveTab('tasks');
  };

  const handleAddNewTaskOnDate = (dateStr: string) => {
    setIsTaskModalOpen(true);
  };

  const overdueCount = tasks.filter(t => t.status === 'overdue').length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 flex flex-col antialiased selection:bg-indigo-500 selection:text-white font-sans">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        tasksCount={tasks.length}
        membersCount={teamMembers.length}
        overdueCount={overdueCount}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
        onOpenVoiceModal={() => setIsVoiceModalOpen(true)}
      />

      {/* Main Layout Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen">
        {/* Top Navbar */}
        <Navbar
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          onOpenGlobalSearch={() => setIsSearchModalOpen(true)}
          onOpenNotifications={() => setIsNotificationDrawerOpen(true)}
          onOpenVoiceModal={() => setIsVoiceModalOpen(true)}
          onAddNewTask={() => setIsTaskModalOpen(true)}
          notifications={notifications}
          settings={settings}
          darkMode={darkMode}
          onToggleDarkMode={() => setDarkMode(!darkMode)}
        />

        {/* Dynamic Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {activeTab === 'dashboard' && (
            <DashboardView
              tasks={tasks}
              teamMembers={teamMembers}
              onSelectTask={task => setSelectedDetailTask(task)}
              onStatusToggle={handleStatusToggle}
              onAddNewTask={() => setIsTaskModalOpen(true)}
              onOpenVoiceModal={() => setIsVoiceModalOpen(true)}
              onNavigateToTasks={handleNavigateToTasks}
              onNavigateToCalendar={() => setActiveTab('calendar')}
              onSelectMember={() => setActiveTab('team')}
            />
          )}

          {activeTab === 'tasks' && (
            <TasksView
              tasks={tasks}
              teamMembers={teamMembers}
              activityLogs={activityLogs}
              onSaveTask={handleSaveTask}
              onUpdateTask={handleUpdateTask}
              onDeleteTask={handleDeleteTask}
              onAddComment={handleAddComment}
              onOpenVoiceModal={() => setIsVoiceModalOpen(true)}
            />
          )}

          {activeTab === 'team' && (
            <TeamView
              teamMembers={teamMembers}
              tasks={tasks}
              onSaveMember={handleSaveMember}
              onUpdateMember={handleUpdateMember}
              onDeleteMember={handleDeleteMember}
              onSelectTask={task => setSelectedDetailTask(task)}
              onStatusToggle={handleStatusToggle}
              onEditTask={task => {
                setSelectedDetailTask(task);
              }}
              onDeleteTask={handleDeleteTask}
              onAddNewTaskForMember={memberId => {
                setIsTaskModalOpen(true);
              }}
            />
          )}

          {activeTab === 'calendar' && (
            <CalendarView
              tasks={tasks}
              teamMembers={teamMembers}
              onSelectTask={task => setSelectedDetailTask(task)}
              onAddNewTaskOnDate={handleAddNewTaskOnDate}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              settings={settings}
              onSaveSettings={handleSaveSettings}
              onResetData={handleResetData}
            />
          )}
        </main>
      </div>

      {/* Mobile Floating Action Button for Instant Voice Task */}
      <button
        onClick={() => setIsVoiceModalOpen(true)}
        className="fixed bottom-6 right-6 z-40 lg:hidden w-14 h-14 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 text-white shadow-xl shadow-indigo-500/40 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
        title="🎙️ Voice Task"
      >
        <Mic className="w-6 h-6 animate-pulse" />
      </button>

      {/* Global Modals & Drawers */}
      <VoiceTaskModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        teamMembers={teamMembers}
        onTaskCreated={handleVoiceTaskCreated}
      />

      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        teamMembers={teamMembers}
        onSave={handleSaveTask}
      />

      <TaskDetailModal
        isOpen={!!selectedDetailTask}
        onClose={() => setSelectedDetailTask(null)}
        task={selectedDetailTask}
        teamMembers={teamMembers}
        activityLogs={selectedDetailTask ? activityLogs.filter(a => a.taskId === selectedDetailTask.id) : []}
        onEdit={task => {
          setIsTaskModalOpen(true);
        }}
        onDelete={id => setDeleteConfirmId(id)}
        onStatusChange={(taskId, newStatus) => {
          handleUpdateTask(taskId, { status: newStatus });
          if (selectedDetailTask) {
            setSelectedDetailTask({ ...selectedDetailTask, status: newStatus });
          }
        }}
        onAddComment={handleAddComment}
      />

      <GlobalSearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        tasks={tasks}
        teamMembers={teamMembers}
        onSelectTask={task => setSelectedDetailTask(task)}
        onSelectMember={() => setActiveTab('team')}
      />

      <NotificationDrawer
        isOpen={isNotificationDrawerOpen}
        onClose={() => setIsNotificationDrawerOpen(false)}
        notifications={notifications}
        onMarkRead={id => {
          dbService.markNotificationRead(id);
          refreshData();
        }}
        onMarkAllRead={() => {
          dbService.markAllNotificationsRead();
          refreshData();
        }}
        onClearAll={() => {
          dbService.clearNotifications();
          refreshData();
        }}
        onSelectTaskFromNotification={taskId => {
          const t = tasks.find(item => item.id === taskId);
          if (t) setSelectedDetailTask(t);
        }}
      />

      <ConfirmDialog
        isOpen={!!deleteConfirmId}
        title="Delete Task"
        message="Are you sure you want to delete this task? This action will remove the task and all associated activity records."
        confirmLabel="Delete Task"
        isDestructive={true}
        onConfirm={() => {
          if (deleteConfirmId) {
            handleDeleteTask(deleteConfirmId);
            if (selectedDetailTask?.id === deleteConfirmId) {
              setSelectedDetailTask(null);
            }
            setDeleteConfirmId(null);
          }
        }}
        onCancel={() => setDeleteConfirmId(null)}
      />
    </div>
  );
};

export default App;
