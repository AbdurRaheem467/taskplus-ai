import { Task, TeamMember, TaskActivity, NotificationItem } from '../types';

export interface WebhookPayload {
  event: 'task.created' | 'task.updated' | 'task.status_changed' | 'task.reminder' | 'task.overdue' | 'task.deleted' | 'voice.task_processed';
  timestamp: string;
  source: 'TaskPulse AI Web' | 'TaskPulse AI Voice';
  data: {
    task?: Task;
    assignedMember?: TeamMember;
    activity?: TaskActivity;
    notification?: NotificationItem;
    rawVoiceTranscript?: string;
  };
}

/**
 * Sends a webhook event to n8n or custom endpoint
 */
export async function triggerWebhook(
  url: string,
  payload: WebhookPayload
): Promise<{ success: boolean; status?: number; message: string }> {
  if (!url || !url.trim()) {
    return { success: false, message: 'No webhook URL configured' };
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'TaskPulse-AI-Manager/1.0'
      },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      return {
        success: true,
        status: response.status,
        message: `Webhook delivered successfully (${response.status})`
      };
    } else {
      return {
        success: false,
        status: response.status,
        message: `Webhook returned status ${response.status}: ${response.statusText}`
      };
    }
  } catch (err: any) {
    return {
      success: false,
      message: `Failed to dispatch webhook: ${err?.message || 'Network error'}`
    };
  }
}

/**
 * Dispatch notification to external channels (Telegram, WhatsApp, Browser)
 */
export async function dispatchExternalNotification(
  channel: 'telegram' | 'whatsapp' | 'email',
  config: {
    telegramBotToken?: string;
    telegramChatId?: string;
    whatsappWebhookUrl?: string;
  },
  title: string,
  message: string
): Promise<{ success: boolean; message: string }> {
  if (channel === 'telegram') {
    if (!config.telegramBotToken || !config.telegramChatId) {
      return { success: false, message: 'Telegram Bot Token or Chat ID missing' };
    }
    try {
      const text = `*${title}*\n${message}`;
      const url = `https://api.telegram.org/bot${config.telegramBotToken}/sendMessage`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: config.telegramChatId,
          text,
          parse_mode: 'Markdown'
        })
      });
      return { success: res.ok, message: res.ok ? 'Sent to Telegram' : 'Failed to send to Telegram' };
    } catch (e: any) {
      return { success: false, message: e?.message || 'Telegram network error' };
    }
  }

  if (channel === 'whatsapp') {
    if (!config.whatsappWebhookUrl) {
      return { success: false, message: 'WhatsApp Webhook URL missing' };
    }
    try {
      const res = await fetch(config.whatsappWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, message, channel: 'whatsapp' })
      });
      return { success: res.ok, message: res.ok ? 'Sent to WhatsApp Webhook' : 'Failed to deliver' };
    } catch (e: any) {
      return { success: false, message: e?.message || 'WhatsApp network error' };
    }
  }

  return { success: true, message: 'Mock email channel logged' };
}
