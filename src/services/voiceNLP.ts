import { TeamMember, TaskPriority, TaskReminderOption, ExtractedVoiceTask } from '../types';
import { addDays, format, nextDay, Day, startOfToday, parse } from 'date-fns';
import { parseTimeString } from '../utils/dateUtils';

// Days of week mapping (Urdu Roman + Urdu Script + English)
const DAYS_MAP: Record<string, Day> = {
  sunday: 0, itwar: 0, sun: 0, 'اتوار': 0,
  monday: 1, somwar: 1, peer: 1, mon: 1, 'پیر': 1, 'سوموار': 1,
  tuesday: 2, mangal: 2, tue: 2, 'منگل': 2,
  wednesday: 3, budh: 3, wed: 3, 'بدھ': 3,
  thursday: 4, jumerat: 4, jumeraat: 4, thu: 4, 'جمعرات': 4,
  friday: 5, juma: 5, jumma: 5, jummah: 5, fri: 5, 'جمعہ': 5,
  saturday: 6, hafta: 6, sat: 6, 'ہفتہ': 6
};

// Month names mapping
const MONTHS_MAP: Record<string, number> = {
  january: 0, jan: 0, 'جنوری': 0,
  february: 1, feb: 1, 'فروری': 1,
  march: 2, mar: 2, 'مارچ': 2,
  april: 3, apr: 3, 'اپریل': 3,
  may: 4, 'مئی': 4,
  june: 5, jun: 5, 'جون': 5,
  july: 6, jul: 6, 'جولائی': 6,
  august: 7, aug: 7, 'اگست': 7,
  september: 8, sep: 8, sept: 8, 'ستمبر': 8,
  october: 9, oct: 9, 'اکتوبر': 9,
  november: 10, nov: 10, 'نومبر': 10,
  december: 11, dec: 11, 'دسمبر': 11
};

/**
 * High-Precision AI Voice & Natural Language Parser
 * Extracts Exact Member, Clean Task Title, Date, Time, Priority, and Reminder
 */
export function parseVoiceInput(
  rawTranscript: string,
  teamMembers: TeamMember[] = []
): ExtractedVoiceTask {
  const text = rawTranscript.trim();
  const lower = text.toLowerCase();
  const ambiguities: string[] = [];

  // 1. Detect Language
  const isUrdu = /[\u0600-\u06FF]/.test(text) ||
    /\b(ko|ka|ki|ke|hai|karna|karega|karwana|tak|chahiye|shaam|sham|subah|raat|dopahar|kal|aaj|parso|bohot|zaroori|fauri|banao|dena|deni)\b/i.test(lower);
  const detectedLanguage: 'en' | 'ur-roman' = isUrdu ? 'ur-roman' : 'en';

  // 2. Extract Team Member
  let matchedMember: TeamMember | undefined;
  let candidateName = '';

  // Check against known team members first (full name, first name, aliases)
  for (const member of teamMembers) {
    const memNameLower = member.name.toLowerCase();
    const parts = memNameLower.split(/\s+/);
    const firstName = parts[0];
    const lastName = parts.length > 1 ? parts[parts.length - 1] : '';

    // Check full name
    const fullNameRegex = new RegExp(`\\b${escapeRegex(memNameLower)}\\b`, 'i');
    if (fullNameRegex.test(lower)) {
      matchedMember = member;
      candidateName = member.name;
      break;
    }

    // Check first name or distinct last name
    const firstNameRegex = new RegExp(`\\b${escapeRegex(firstName)}\\b`, 'i');
    if (firstNameRegex.test(lower)) {
      matchedMember = member;
      candidateName = member.name;
      break;
    }

    if (lastName && lastName.length > 3) {
      const lastNameRegex = new RegExp(`\\b${escapeRegex(lastName)}\\b`, 'i');
      if (lastNameRegex.test(lower)) {
        matchedMember = member;
        candidateName = member.name;
        break;
      }
    }
  }

  // Urdu grammatical patterns: "[Name] ko", "[Name] ka", "[Name] ne"
  if (!matchedMember) {
    const urduAssigneeMatch = text.match(/\b([A-Za-z]+(?:\s+[A-Za-z]+)?)\s+(?:ko|ka|ki|ke|ne)\b/i) ||
                             text.match(/([\u0600-\u06FF]+)\s+(?:کو|کا|کی|کے|نے)/);
    if (urduAssigneeMatch) {
      const rawCandidate = urduAssigneeMatch[1].trim();
      const candidateLower = rawCandidate.toLowerCase();

      matchedMember = teamMembers.find(m => {
        const mLower = m.name.toLowerCase();
        return mLower.includes(candidateLower) || candidateLower.includes(mLower.split(' ')[0]);
      });

      candidateName = matchedMember ? matchedMember.name : capitalizeWords(rawCandidate);
    }
  }

  // English assignee patterns: "assign to [Name]", "for [Name]", "[Name] needs to"
  if (!matchedMember && !candidateName) {
    const enAssigneeMatch = text.match(/\b(?:assign(?:\s+task)?\s+to|for|tell)\s+([A-Za-z]+(?:\s+[A-Za-z]+)?)\b/i) ||
                           text.match(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(?:needs to|should|must|has to)\b/i);
    if (enAssigneeMatch) {
      const rawCandidate = enAssigneeMatch[1].trim();
      const candidateLower = rawCandidate.toLowerCase();

      matchedMember = teamMembers.find(m => {
        const mLower = m.name.toLowerCase();
        return mLower.includes(candidateLower) || candidateLower.includes(mLower.split(' ')[0]);
      });

      candidateName = matchedMember ? matchedMember.name : capitalizeWords(rawCandidate);
    }
  }

  if (!matchedMember && !candidateName) {
    ambiguities.push('I understood the task, but I could not determine which team member to assign it to.');
  }

  // 3. Extract Priority
  let priority: TaskPriority = 'medium';
  if (/\b(urgent|emergency|fauri|bohot zaroori|zaroori tareen|highest|critical|asap|فوری|بہت ضروری|انتہائی ضروری)\b/i.test(lower)) {
    priority = 'urgent';
  } else if (/\b(high|zaroori|important|top priority|jaldi|pehlay|ضروری|اہم)\b/i.test(lower)) {
    priority = 'high';
  } else if (/\b(low|halka|baad mein|aram se|minor|normal priority|بعد میں|آرام سے)\b/i.test(lower)) {
    priority = 'low';
  }

  // 4. Extract Deadline Date & Time
  const now = new Date();
  let deadlineDate = '';
  let deadlineTime = '18:00'; // Default 6 PM
  let dateFound = false;
  let timeFound = false;

  // Relative tokens: "aaj" / "today"
  if (/\b(aaj|today|tonight|آج)\b/i.test(lower)) {
    deadlineDate = format(now, 'yyyy-MM-dd');
    dateFound = true;
  }
  // "kal" / "tomorrow"
  else if (/\b(kal|tomorrow|کل)\b/i.test(lower)) {
    deadlineDate = format(addDays(now, 1), 'yyyy-MM-dd');
    dateFound = true;
  }
  // "parso" / "day after tomorrow"
  else if (/\b(parso|parson|day after tomorrow|پرسوں)\b/i.test(lower)) {
    deadlineDate = format(addDays(now, 2), 'yyyy-MM-dd');
    dateFound = true;
  }
  // Days of week: "Friday", "Monday", "somwar", "juma"
  else {
    for (const [dayName, dayIndex] of Object.entries(DAYS_MAP)) {
      const dayRegex = new RegExp(`\\b${escapeRegex(dayName)}\\b`, 'i');
      if (dayRegex.test(lower)) {
        const targetDay = nextDay(now, dayIndex);
        deadlineDate = format(targetDay, 'yyyy-MM-dd');
        dateFound = true;
        break;
      }
    }
  }

  // Specific Calendar Date: e.g. "30 September", "30th Sept", "15 October", "Sep 30"
  const specificDateMatch = lower.match(/\b(\d{1,2})(?:st|nd|rd|th)?\s+([a-z\u0600-\u06FF]+)\b/) ||
                            lower.match(/\b([a-z\u0600-\u06FF]+)\s+(\d{1,2})(?:st|nd|rd|th)?\b/);
  if (specificDateMatch) {
    let dayNum: number;
    let monthStr: string;

    if (!isNaN(parseInt(specificDateMatch[1], 10))) {
      dayNum = parseInt(specificDateMatch[1], 10);
      monthStr = specificDateMatch[2];
    } else {
      monthStr = specificDateMatch[1];
      dayNum = parseInt(specificDateMatch[2], 10);
    }

    if (MONTHS_MAP[monthStr] !== undefined) {
      const monthIdx = MONTHS_MAP[monthStr];
      const year = now.getFullYear();
      let candidateDate = new Date(year, monthIdx, dayNum);
      if (candidateDate < now && (now.getTime() - candidateDate.getTime() > 86400000)) {
        candidateDate.setFullYear(year + 1);
      }
      deadlineDate = format(candidateDate, 'yyyy-MM-dd');
      dateFound = true;
    }
  }

  // Extract Exact Time
  // Match e.g. "shaam 6 baje", "sham 6", "6:00 PM", "subah 10 baje", "10 am", "dopahar 2 baje", "raat 8 baje"
  const timeMatch = text.match(/(?:at\s+)?(\d{1,2}(?::\d{2})?\s*(?:am|pm|baje|o'clock)?(?:\s+(?:shaam|sham|subah|raat|dopahar))?)/i) ||
                    text.match(/((?:shaam|sham|subah|raat|dopahar)\s+\d{1,2}(?::\d{2})?(?:\s*baje)?)/i) ||
                    text.match(/(?:شام|صبح|رات|دوپہر)?\s*(\d{1,2}(?::\d{2})?)\s*(?:بجے)?/);
  if (timeMatch) {
    deadlineTime = parseTimeString(timeMatch[1]);
    timeFound = true;
  } else {
    // Check coarse daytime hints
    if (/\b(shaam|sham|evening|شام)\b/i.test(lower)) {
      deadlineTime = '18:00';
      timeFound = true;
    } else if (/\b(subah|morning|صبح)\b/i.test(lower)) {
      deadlineTime = '10:00';
      timeFound = true;
    } else if (/\b(dopahar|afternoon|دوپہر)\b/i.test(lower)) {
      deadlineTime = '14:00';
      timeFound = true;
    } else if (/\b(raat|night|رات)\b/i.test(lower)) {
      deadlineTime = '21:00';
      timeFound = true;
    }
  }

  if (!dateFound) {
    ambiguities.push("I understood the task, but I couldn't determine the deadline. What deadline should I use?");
    deadlineDate = format(addDays(now, 1), 'yyyy-MM-dd');
  }

  // 5. Clean up Task Title
  let taskTitle = text;

  // Remove assignee name clause
  const nameToStrip = matchedMember ? matchedMember.name : candidateName;
  if (nameToStrip) {
    const parts = nameToStrip.split(/\s+/);
    taskTitle = taskTitle.replace(new RegExp(`\\b${escapeRegex(nameToStrip)}\\s*(?:ko|ka|ki|ke|ne|کو|کا|کی|کے|نے)?\\b`, 'gi'), '');
    parts.forEach(p => {
      taskTitle = taskTitle.replace(new RegExp(`\\b${escapeRegex(p)}\\s*(?:ko|ka|ki|ke|ne|کو|کا|کی|کے|نے)?\\b`, 'gi'), '');
    });
    taskTitle = taskTitle.replace(new RegExp(`\\b(?:assign(?:\s+task)?\s+to|for|tell)\\s+${escapeRegex(nameToStrip)}\\b`, 'gi'), '');
    taskTitle = taskTitle.replace(new RegExp(`\\b${escapeRegex(nameToStrip)}\\s+(?:needs to|should|must|has to)\\b`, 'gi'), '');
  }

  // Remove deadline clauses
  taskTitle = taskTitle.replace(/\b(?:deadline|due date|tak|by)\s+.*?(\.|$)/gi, '');
  taskTitle = taskTitle.replace(/\b(?:kal|aaj|parso|tomorrow|today|shaam|sham|subah|raat|dopahar|\d{1,2}\s*baje|\d{1,2}(?::\d{2})?\s*(?:am|pm)|کل|آج|پرسوں|شام|صبح|رات|دوپہر|بجے)\b/gi, '');
  taskTitle = taskTitle.replace(/\b(?:30|31|\d{1,2})(?:st|nd|rd|th)?\s+(?:september|october|november|december|january|february|march|april|may|june|july|august|sep|oct|nov|dec|jan|feb|mar|apr|jun|jul|aug|ستمبر|اکتوبر|نومبر|دسمبر|جنوری|فروری|مارچ|اپریل|مئی|جون|جولائی|اگست)\b/gi, '');
  taskTitle = taskTitle.replace(/\b(?:juma|jummah|jumma|somwar|peer|mangal|budh|jumerat|jumeraat|hafta|itwar|monday|tuesday|wednesday|thursday|friday|saturday|sunday|جمعہ|پیر|منگل|بدھ|جمعرات|ہفتہ|اتوار)\b/gi, '');

  // Remove common verbal action filler phrases
  taskTitle = taskTitle.replace(/\b(complete karna hai|complete karni hai|complete karne hain|karna hai|karni hai|karne hain|karwana hai|complete hona chahiye|deni hai|dena hai|karo|banao|karega|karegi|wala task|ka task|hai|tak|مکمل کرنی ہے|مکمل کرنا ہے|کرنا ہے|دینا ہے|دینی ہے)\b/gi, '');
  taskTitle = taskTitle.replace(/\b(urgent|emergency|fauri|bohot zaroori|zaroori tareen|top priority|important|asap|فوری|بہت ضروری|ضروری)\b/gi, '');
  taskTitle = taskTitle.replace(/\b(please|kindly|needs to be done|has to finish|by tomorrow|by today)\b/gi, '');

  // Clean extra spaces & punctuation
  taskTitle = taskTitle.replace(/^[,\s-:۔،]+|[,\s-:۔،]+$/g, '').trim();

  // Capitalize title
  if (taskTitle.length > 0) {
    taskTitle = capitalizeWords(taskTitle);
  } else {
    taskTitle = 'General Task Deliverable';
    ambiguities.push('The task description was unclear. Please review the title.');
  }

  // Calculate confidence score
  let confidence = 0.6;
  if (matchedMember || candidateName) confidence += 0.2;
  if (dateFound) confidence += 0.1;
  if (timeFound) confidence += 0.1;

  return {
    assignedToName: matchedMember ? matchedMember.name : candidateName,
    assignedToId: matchedMember ? matchedMember.id : undefined,
    taskTitle,
    taskDescription: `Voice Task: "${text}"`,
    deadlineDate,
    deadlineTime,
    priority,
    reminder: '1h',
    confidence: Math.min(1.0, confidence),
    ambiguities,
    rawTranscript: text,
    detectedLanguage
  };
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function capitalizeWords(str: string): string {
  return str
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Preset voice commands configured for the team
 */
export const SAMPLE_VOICE_COMMANDS = [
  {
    lang: 'Urdu / Roman Urdu',
    label: 'AbdurRaheem - Website Homepage (30 Sep 6 PM)',
    text: 'AbdurRaheem ko website ka homepage complete karna hai, deadline 30 September shaam 6 baje hai.'
  },
  {
    lang: 'Urdu / Roman Urdu',
    label: 'Basit Amin Bhatti - Logo Design (Kal tak)',
    text: 'Basit Amin Bhatti ko logo design karna hai kal tak.'
  },
  {
    lang: 'Urdu / Roman Urdu',
    label: 'Bilal Hanif - API Testing (Friday 6 PM)',
    text: 'Bilal Hanif ko API testing complete karni hai Friday shaam 6 baje tak.'
  },
  {
    lang: 'Urdu / Roman Urdu',
    label: 'Adnan Choudry - UI Review (Friday 5 PM)',
    text: 'Adnan Choudry ka UI review Friday shaam 5 baje tak complete hona chahiye.'
  },
  {
    lang: 'Urdu / Roman Urdu',
    label: 'Basit - Urgent Bug Fix (Today 4 PM)',
    text: 'Fauri zaroori task Basit ko payment gateway bug fix karna hai aaj shaam 4 baje tak.'
  },
  {
    lang: 'English',
    label: 'Bilal Hanif - Security Audit (Tomorrow 3 PM)',
    text: 'Urgent task for Bilal Hanif to complete security audit report by tomorrow 3 PM.'
  },
  {
    lang: 'English',
    label: 'Adnan Choudry - Mobile Prototype (Monday 11 AM)',
    text: 'Adnan Choudry needs to finalize the mobile app prototype before Monday 11 AM.'
  }
];
