import { 
  Task, 
  TeamMember, 
  TaskActivity, 
  NotificationItem, 
  AppSettings,
  TaskStatus,
  TaskPriority,
  TaskReminderOption
} from '../types';
import { combineDateAndTime, formatFullDateTime, isTaskOverdue } from '../utils/dateUtils';
import { playNotificationSound, sendBrowserNotification } from './notifications';
import { triggerWebhook } from './webhook';

const STORAGE_KEYS = {
  TASKS: 'taskpulse_tasks_v2',
  MEMBERS: 'taskpulse_members_v2',
  ACTIVITY: 'taskpulse_activity_v2',
  NOTIFICATIONS: 'taskpulse_notifications_v2',
  SETTINGS: 'taskpulse_settings_v2',
};

// Auto-purge old v1 dummy data if present
if (typeof window !== 'undefined') {
  try {
    ['taskpulse_tasks_v1', 'taskpulse_members_v1', 'taskpulse_activity_v1', 'taskpulse_notifications_v1'].forEach(k => {
      localStorage.removeItem(k);
    });
  } catch (e) {}
}

// Initial Team Members specified by user
const INITIAL_MEMBERS: TeamMember[] = [
  {
    id: 'mem-abdurraheem',
    name: 'AbdurRaheem',
    email: 'abdurraheem@team.io',
    role: 'Team Member',
    avatarColor: '#8b5cf6',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'mem-basit-amin-bhatti',
    name: 'Basit Amin Bhatti',
    email: 'basit.amin@team.io',
    role: 'Team Member',
    avatarColor: '#06b6d4',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'mem-bilal-hanif',
    name: 'Bilal Hanif',
    email: 'bilal.hanif@team.io',
    role: 'Team Member',
    avatarColor: '#10b981',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'mem-adnan-choudry',
    name: 'Adnan Choudry',
    email: 'adnan.choudry@team.io',
    role: 'Team Member',
    avatarColor: '#f59e0b',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];
const INITIAL_TASKS: Task[] = [];
const INITIAL_ACTIVITIES: TaskActivity[] = [];
const INITIAL_NOTIFICATIONS: NotificationItem[] = [];

// Default App Settings
export const DEFAULT_SETTINGS: AppSettings = {
  adminName: 'Admin',
  adminEmail: 'admin@company.io',
  organizationName: 'Team Workspace',
  timezone: 'Asia/Karachi',
  language: 'en',
  defaultReminder: '1h',
  theme: 'dark',
  voiceLanguage: 'auto',
  soundEnabled: true,
  browserNotificationsEnabled: true,
  supabaseUrl: '',
  supabaseAnonKey: '',
  supabaseConnected: false,
  n8nWebhookUrl: '',
  n8nEnabled: false,
  telegramBotToken: '',
  telegramChatId: '',
  telegramEnabled: false,
  whatsappWebhookUrl: '',
  whatsappEnabled: false,
  emailNotificationsEnabled: true,
};

// -------------------------------------------------------------
// Database Operations Service (LocalStorage with Supabase-ready schema)
// -------------------------------------------------------------

export const dbService = {
  // Members
  getTeamMembers(): TeamMember[] {
    const raw = localStorage.getItem(STORAGE_KEYS.MEMBERS);
    let members: TeamMember[] = [];
    if (!raw) {
      members = INITIAL_MEMBERS;
      localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(members));
      return members;
    }
    try {
      members = JSON.parse(raw);
      if (!Array.isArray(members)) members = [];
    } catch {
      members = INITIAL_MEMBERS;
    }

    // Auto-merge any newly added INITIAL_MEMBERS
    let hasNew = false;
    for (const initMem of INITIAL_MEMBERS) {
      if (!members.some(m => m.id === initMem.id || m.name.toLowerCase() === initMem.name.toLowerCase())) {
        members.push(initMem);
        hasNew = true;
      }
    }

    if (hasNew) {
      localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(members));
    }
    return members;
  },

  createTeamMember(memberData: Omit<TeamMember, 'id' | 'createdAt' | 'updatedAt'>): TeamMember {
    const members = this.getTeamMembers();
    const newMember: TeamMember = {
      ...memberData,
      id: `mem-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    members.unshift(newMember);
    localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(members));
    return newMember;
  },

  updateTeamMember(id: string, updates: Partial<TeamMember>): TeamMember | null {
    const members = this.getTeamMembers();
    const index = members.findIndex(m => m.id === id);
    if (index === -1) return null;

    members[index] = {
      ...members[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(members));
    return members[index];
  },

  deleteTeamMember(id: string): boolean {
    const members = this.getTeamMembers();
    const filtered = members.filter(m => m.id !== id);
    localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(filtered));
    return true;
  },

  // Tasks
  getTasks(): Task[] {
    const raw = localStorage.getItem(STORAGE_KEYS.TASKS);
    let tasks: Task[] = [];
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(INITIAL_TASKS));
      tasks = INITIAL_TASKS;
    } else {
      try {
        tasks = JSON.parse(raw);
      } catch {
        tasks = INITIAL_TASKS;
      }
    }

    // Dynamic auto-detect overdue tasks
    let hasUpdates = false;
    const now = new Date();
    tasks = tasks.map(task => {
      if (task.status !== 'completed' && task.status !== 'overdue') {
        if (isTaskOverdue(task.deadline, task.status)) {
          hasUpdates = true;
          return { ...task, status: 'overdue' as TaskStatus, updatedAt: now.toISOString() };
        }
      }
      return task;
    });

    if (hasUpdates) {
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
    }

    return tasks;
  },

  createTask(taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>, createdBy = 'Admin'): Task {
    const tasks = this.getTasks();
    const now = new Date().toISOString();
    
    // Auto-create member if assignedTo is a raw name and doesn't match an existing member ID
    let assignedId = taskData.assignedTo;
    const members = this.getTeamMembers();
    let assignedMember = members.find(m => m.id === assignedId);

    if (!assignedMember && assignedId && assignedId.trim()) {
      // Check if matches member by name
      assignedMember = members.find(m => m.name.toLowerCase() === assignedId.trim().toLowerCase());
      if (assignedMember) {
        assignedId = assignedMember.id;
      } else {
        // Auto-create new team member
        const colors = ['#4f46e5', '#06b6d4', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6', '#3b82f6'];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        const cleanName = assignedId.trim();
        const newMem = this.createTeamMember({
          name: cleanName,
          email: `${cleanName.toLowerCase().replace(/\s+/g, '.')}@team.io`,
          role: 'Team Member',
          avatarColor: randomColor,
        });
        assignedId = newMem.id;
        assignedMember = newMem;
      }
    }

    const newTask: Task = {
      ...taskData,
      assignedTo: assignedId,
      id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      createdAt: now,
      updatedAt: now,
    };
    tasks.unshift(newTask);
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));

    // Log Activity
    this.addActivityLog({
      taskId: newTask.id,
      taskTitle: newTask.title,
      action: 'created',
      details: `Task created and assigned to ${assignedMember ? assignedMember.name : 'unassigned'}`,
      performedBy: createdBy,
    });

    // Notify
    this.addNotification({
      taskId: newTask.id,
      type: 'task_created',
      title: 'New Task Created',
      message: `Task "${newTask.title}" assigned to ${assignedMember?.name || 'team member'}.`,
      priority: newTask.priority
    });

    // Trigger n8n Webhook if configured
    const settings = this.getSettings();
    if (settings.n8nEnabled && settings.n8nWebhookUrl) {
      triggerWebhook(settings.n8nWebhookUrl, {
        event: 'task.created',
        timestamp: now,
        source: createdBy.includes('Voice') ? 'TaskPulse AI Voice' : 'TaskPulse AI Web',
        data: {
          task: newTask,
          assignedMember
        }
      });
    }

    return newTask;
  },

  updateTask(id: string, updates: Partial<Task>, updatedBy = 'Admin'): Task | null {
    const tasks = this.getTasks();
    const index = tasks.findIndex(t => t.id === id);
    if (index === -1) return null;

    const oldTask = tasks[index];
    const updatedTask: Task = {
      ...oldTask,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    // If deadline date or time changed, sync composite deadline
    if (updates.deadlineDate || updates.deadlineTime) {
      updatedTask.deadline = combineDateAndTime(
        updatedTask.deadlineDate,
        updatedTask.deadlineTime
      );
      if (updatedTask.status === 'overdue' && !isTaskOverdue(updatedTask.deadline, updatedTask.status)) {
        updatedTask.status = 'pending';
      }
    }

    tasks[index] = updatedTask;
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));

    // Log Activity changes
    if (updates.status && updates.status !== oldTask.status) {
      this.addActivityLog({
        taskId: id,
        taskTitle: updatedTask.title,
        action: updates.status === 'completed' ? 'completed' : 'status_changed',
        details: `Status changed from ${oldTask.status} to ${updates.status}`,
        performedBy: updatedBy
      });

      if (updates.status === 'completed') {
        this.addNotification({
          taskId: id,
          type: 'task_completed',
          title: 'Task Completed 🎉',
          message: `Task "${updatedTask.title}" was marked as completed!`,
          priority: updatedTask.priority
        });
      }
    }

    if (updates.assignedTo && updates.assignedTo !== oldTask.assignedTo) {
      const members = this.getTeamMembers();
      const newMember = members.find(m => m.id === updates.assignedTo);
      this.addActivityLog({
        taskId: id,
        taskTitle: updatedTask.title,
        action: 'assigned',
        details: `Reassigned to ${newMember?.name || 'new member'}`,
        performedBy: updatedBy
      });
    }

    if (updates.deadlineDate || updates.deadlineTime) {
      this.addActivityLog({
        taskId: id,
        taskTitle: updatedTask.title,
        action: 'rescheduled',
        details: `Deadline updated to ${formatFullDateTime(updatedTask.deadline)}`,
        performedBy: updatedBy
      });
    }

    return updatedTask;
  },

  deleteTask(id: string): boolean {
    const tasks = this.getTasks();
    const task = tasks.find(t => t.id === id);
    const filtered = tasks.filter(t => t.id !== id);
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(filtered));

    if (task) {
      this.addActivityLog({
        taskId: id,
        taskTitle: task.title,
        action: 'status_changed',
        details: 'Task deleted by Admin',
        performedBy: 'Admin'
      });
    }
    return true;
  },

  rescheduleTask(id: string, newDate: string, newTime = '18:00'): Task | null {
    return this.updateTask(id, {
      deadlineDate: newDate,
      deadlineTime: newTime,
      deadline: combineDateAndTime(newDate, newTime)
    });
  },

  toggleTaskStatus(id: string): Task | null {
    const tasks = this.getTasks();
    const task = tasks.find(t => t.id === id);
    if (!task) return null;

    const nextStatus: TaskStatus = task.status === 'completed' ? 'in_progress' : 'completed';
    return this.updateTask(id, { status: nextStatus });
  },

  // Activity Logs
  getActivityLogs(taskId?: string): TaskActivity[] {
    const raw = localStorage.getItem(STORAGE_KEYS.ACTIVITY);
    let logs: TaskActivity[] = [];
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.ACTIVITY, JSON.stringify(INITIAL_ACTIVITIES));
      logs = INITIAL_ACTIVITIES;
    } else {
      try {
        logs = JSON.parse(raw);
      } catch {
        logs = INITIAL_ACTIVITIES;
      }
    }
    if (taskId) {
      return logs.filter(l => l.taskId === taskId);
    }
    return logs;
  },

  addActivityLog(log: Omit<TaskActivity, 'id' | 'timestamp'>): TaskActivity {
    const logs = this.getActivityLogs();
    const newLog: TaskActivity = {
      ...log,
      id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      timestamp: new Date().toISOString()
    };
    logs.unshift(newLog);
    if (logs.length > 200) logs.pop();
    localStorage.setItem(STORAGE_KEYS.ACTIVITY, JSON.stringify(logs));
    return newLog;
  },

  // Notifications
  getNotifications(): NotificationItem[] {
    const raw = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(INITIAL_NOTIFICATIONS));
      return INITIAL_NOTIFICATIONS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_NOTIFICATIONS;
    }
  },

  addNotification(item: Omit<NotificationItem, 'id' | 'timestamp' | 'read'>): NotificationItem {
    const list = this.getNotifications();
    const newItem: NotificationItem = {
      ...item,
      id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      timestamp: new Date().toISOString(),
      read: false
    };
    list.unshift(newItem);
    if (list.length > 100) list.pop();
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(list));

    const settings = this.getSettings();
    if (settings.soundEnabled) {
      playNotificationSound();
    }
    if (settings.browserNotificationsEnabled) {
      sendBrowserNotification(newItem.title, newItem.message);
    }

    return newItem;
  },

  markNotificationRead(id: string): void {
    const list = this.getNotifications();
    const index = list.findIndex(n => n.id === id);
    if (index !== -1) {
      list[index].read = true;
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(list));
    }
  },

  markAllNotificationsRead(): void {
    const list = this.getNotifications();
    list.forEach(n => n.read = true);
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(list));
  },

  clearNotifications(): void {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify([]));
  },

  // Settings
  getSettings(): AppSettings {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
      return DEFAULT_SETTINGS;
    }
    try {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    } catch {
      return DEFAULT_SETTINGS;
    }
  },

  saveSettings(settings: Partial<AppSettings>): AppSettings {
    const current = this.getSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
    return updated;
  },

  resetAllData(): void {
    localStorage.removeItem(STORAGE_KEYS.TASKS);
    localStorage.removeItem(STORAGE_KEYS.MEMBERS);
    localStorage.removeItem(STORAGE_KEYS.ACTIVITY);
    localStorage.removeItem(STORAGE_KEYS.NOTIFICATIONS);
    // Remove old v1 keys too
    localStorage.removeItem('taskpulse_tasks_v1');
    localStorage.removeItem('taskpulse_members_v1');
    localStorage.removeItem('taskpulse_activity_v1');
    localStorage.removeItem('taskpulse_notifications_v1');
  }
};
