import { 
  format, 
  formatDistanceToNow, 
  isPast, 
  isToday, 
  isTomorrow, 
  parseISO, 
  differenceInMinutes, 
  differenceInHours, 
  differenceInDays,
  addDays,
  setHours,
  setMinutes,
  startOfToday,
  nextDay,
  Day
} from 'date-fns';

/**
 * Returns current timestamp in ISO format
 */
export function getNowISO(): string {
  return new Date().toISOString();
}

/**
 * Formats an ISO string or Date into friendly human-readable format
 * e.g., "30 Sep 2026, 6:00 PM"
 */
export function formatFullDateTime(dateInput: string | Date): string {
  try {
    const d = typeof dateInput === 'string' ? parseISO(dateInput) : dateInput;
    if (isNaN(d.getTime())) return dateInput.toString();
    return format(d, 'dd MMM yyyy, h:mm a');
  } catch {
    return String(dateInput);
  }
}

/**
 * Formats date part: "30 Sep 2026"
 */
export function formatDateOnly(dateInput: string | Date): string {
  try {
    const d = typeof dateInput === 'string' ? parseISO(dateInput) : dateInput;
    if (isNaN(d.getTime())) return dateInput.toString();
    return format(d, 'dd MMM yyyy');
  } catch {
    return String(dateInput);
  }
}

/**
 * Formats time part: "6:00 PM"
 */
export function formatTimeOnly(timeOrIso: string): string {
  if (!timeOrIso) return '';
  // Check if it's already HH:mm
  if (/^\d{2}:\d{2}$/.test(timeOrIso)) {
    const [h, m] = timeOrIso.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    return `${hour12}:${m.toString().padStart(2, '0')} ${period}`;
  }
  try {
    const d = parseISO(timeOrIso);
    if (!isNaN(d.getTime())) {
      return format(d, 'h:mm a');
    }
  } catch {
    // fallback
  }
  return timeOrIso;
}

/**
 * Formats remaining time with accurate human phrasing:
 * "Due in 2 hours", "Overdue by 3 days", "Due today at 6:00 PM", "Completed"
 */
export function getRemainingTimeText(deadlineISO: string, status: string): { text: string; isUrgent: boolean; isOverdue: boolean } {
  if (status === 'completed') {
    return { text: 'Completed', isUrgent: false, isOverdue: false };
  }

  try {
    const deadline = parseISO(deadlineISO);
    if (isNaN(deadline.getTime())) {
      return { text: 'No deadline', isUrgent: false, isOverdue: false };
    }

    const now = new Date();
    const isOver = isPast(deadline);
    const diffMinutes = Math.abs(differenceInMinutes(deadline, now));
    const diffHours = Math.abs(differenceInHours(deadline, now));
    const diffDays = Math.abs(differenceInDays(deadline, now));

    if (isOver) {
      if (diffMinutes < 60) {
        return { text: `Overdue by ${diffMinutes}m`, isUrgent: true, isOverdue: true };
      } else if (diffHours < 24) {
        return { text: `Overdue by ${diffHours}h`, isUrgent: true, isOverdue: true };
      } else {
        return { text: `Overdue by ${diffDays}d`, isUrgent: true, isOverdue: true };
      }
    }

    // Future
    if (diffMinutes < 60) {
      return { text: `Due in ${diffMinutes} mins`, isUrgent: true, isOverdue: false };
    } else if (diffHours < 12) {
      return { text: `Due in ${diffHours} hours`, isUrgent: true, isOverdue: false };
    } else if (isToday(deadline)) {
      return { text: `Due today at ${format(deadline, 'h:mm a')}`, isUrgent: true, isOverdue: false };
    } else if (isTomorrow(deadline)) {
      return { text: `Due tomorrow at ${format(deadline, 'h:mm a')}`, isUrgent: false, isOverdue: false };
    } else {
      return { text: `Due in ${diffDays} days (${format(deadline, 'MMM dd')})`, isUrgent: false, isOverdue: false };
    }
  } catch {
    return { text: 'Invalid date', isUrgent: false, isOverdue: false };
  }
}

/**
 * Checks if a task is overdue based on current time
 */
export function isTaskOverdue(deadlineISO: string, status: string): boolean {
  if (status === 'completed') return false;
  try {
    const d = parseISO(deadlineISO);
    return isPast(d);
  } catch {
    return false;
  }
}

/**
 * Checks if a task is due today
 */
export function isTaskDueToday(deadlineISO: string): boolean {
  try {
    const d = parseISO(deadlineISO);
    return isToday(d);
  } catch {
    return false;
  }
}

/**
 * Combines date string (YYYY-MM-DD) and time string (HH:mm) into an ISO string
 */
export function combineDateAndTime(dateStr: string, timeStr: string): string {
  if (!dateStr) return new Date().toISOString();
  const time = timeStr && /^\d{2}:\d{2}$/.test(timeStr) ? timeStr : '18:00';
  const isoString = `${dateStr}T${time}:00`;
  const parsed = new Date(isoString);
  return isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
}

/**
 * Parses time expressions like "6 baje", "shaam 6", "6:00 PM", "18:00", "subah 10"
 */
export function parseTimeString(raw: string): string {
  const clean = raw.toLowerCase().trim();
  
  // Direct HH:mm
  const directMatch = clean.match(/(\d{1,2}):(\d{2})/);
  if (directMatch) {
    let hours = parseInt(directMatch[1], 10);
    const minutes = parseInt(directMatch[2], 10);
    if ((clean.includes('pm') || clean.includes('shaam') || clean.includes('raat') || clean.includes('dopahar')) && hours < 12) {
      hours += 12;
    }
    if ((clean.includes('am') || clean.includes('subah')) && hours === 12) {
      hours = 0;
    }
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  // Number with baje or am/pm
  const numMatch = clean.match(/(\d{1,2})\s*(baje|am|pm|o'clock)?/);
  if (numMatch) {
    let hours = parseInt(numMatch[1], 10);
    const isPM = clean.includes('pm') || clean.includes('shaam') || clean.includes('sham') || clean.includes('raat') || (clean.includes('dopahar') && hours !== 12);
    const isAM = clean.includes('am') || clean.includes('subah') || clean.includes('fajar');

    if (isPM && hours < 12) hours += 12;
    if (isAM && hours === 12) hours = 0;
    // Default sensible assumption: if hours between 1 and 6 without indicator, likely PM for workday
    if (!isPM && !isAM && hours >= 1 && hours <= 7) {
      hours += 12;
    }

    return `${hours.toString().padStart(2, '0')}:00`;
  }

  return '18:00'; // Default 6:00 PM
}
