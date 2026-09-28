export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'overdue';

export type TaskReminderOption = 'none' | '15m' | '30m' | '1h' | '2h' | '1d' | 'custom';

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarColor: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  assignedTo: string; // TeamMember id
  priority: TaskPriority;
  status: TaskStatus;
  startDate: string; // ISO date string (YYYY-MM-DD or full ISO)
  deadline: string; // ISO datetime string (YYYY-MM-DDTHH:mm:ss)
  deadlineDate: string; // YYYY-MM-DD
  deadlineTime: string; // HH:mm
  reminder: TaskReminderOption;
  customReminderMinutes?: number;
  reminderTriggered?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TaskActivity {
  id: string;
  taskId: string;
  taskTitle: string;
  action: 'created' | 'assigned' | 'status_changed' | 'deadline_updated' | 'priority_changed' | 'completed' | 'comment_added' | 'rescheduled';
  details: string;
  performedBy: string; // 'Admin' or member name or 'AI Voice Assistant'
  timestamp: string;
}

export interface NotificationItem {
  id: string;
  taskId?: string;
  type: 'reminder' | 'overdue' | 'task_created' | 'task_completed' | 'system';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  priority?: TaskPriority;
}

export interface AppSettings {
  adminName: string;
  adminEmail: string;
  organizationName: string;
  timezone: string; // Default: 'Asia/Karachi'
  language: 'en' | 'ur';
  defaultReminder: TaskReminderOption;
  theme: 'light' | 'dark' | 'system';
  voiceLanguage: 'auto' | 'en' | 'ur-roman';
  soundEnabled: boolean;
  browserNotificationsEnabled: boolean;
  // Supabase Integration
  supabaseUrl: string;
  supabaseAnonKey: string;
  supabaseConnected: boolean;
  // n8n / Webhook Integration
  n8nWebhookUrl: string;
  n8nEnabled: boolean;
  // External notification channels
  telegramBotToken: string;
  telegramChatId: string;
  telegramEnabled: boolean;
  whatsappWebhookUrl: string;
  whatsappEnabled: boolean;
  emailNotificationsEnabled: boolean;
  // Optional LLM API Key (Gemini/OpenAI) for voice refinement
  aiApiKey?: string;
}

export interface ExtractedVoiceTask {
  assignedToName?: string;
  assignedToId?: string;
  taskTitle?: string;
  taskDescription?: string;
  deadlineDate?: string;
  deadlineTime?: string;
  priority?: TaskPriority;
  reminder?: TaskReminderOption;
  confidence: number;
  ambiguities: string[];
  rawTranscript: string;
  detectedLanguage: 'en' | 'ur-roman';
}
