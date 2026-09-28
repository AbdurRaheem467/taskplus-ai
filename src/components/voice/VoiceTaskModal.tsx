import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  Sparkles, 
  AlertCircle, 
  Check, 
  Clock, 
  Calendar, 
  User, 
  Flag, 
  Bell, 
  X, 
  RotateCcw,
  Volume2,
  ChevronRight,
  HelpCircle
} from 'lucide-react';
import { TeamMember, TaskPriority, TaskReminderOption, ExtractedVoiceTask } from '../../types';
import { parseVoiceInput, SAMPLE_VOICE_COMMANDS } from '../../services/voiceNLP';
import { formatFullDateTime } from '../../utils/dateUtils';
import confetti from 'canvas-confetti';

interface VoiceTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamMembers: TeamMember[];
  onTaskCreated: (taskData: {
    title: string;
    description: string;
    assignedTo: string;
    priority: TaskPriority;
    startDate: string;
    deadlineDate: string;
    deadlineTime: string;
    reminder: TaskReminderOption;
  }) => void;
}

export const VoiceTaskModal: React.FC<VoiceTaskModalProps> = ({
  isOpen,
  onClose,
  teamMembers,
  onTaskCreated,
}) => {
  const [step, setStep] = useState<'idle' | 'recording' | 'processing' | 'clarification' | 'confirm'>('idle');
  const [transcript, setTranscript] = useState('');
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [extractedData, setExtractedData] = useState<ExtractedVoiceTask | null>(null);
  const [activeClarification, setActiveClarification] = useState<string | null>(null);
  
  // Editable form state for confirmation step
  const [confirmedTitle, setConfirmedTitle] = useState('');
  const [confirmedAssignee, setConfirmedAssignee] = useState('');
  const [confirmedDate, setConfirmedDate] = useState('');
  const [confirmedTime, setConfirmedTime] = useState('18:00');
  const [confirmedPriority, setConfirmedPriority] = useState<TaskPriority>('medium');
  const [confirmedReminder, setConfirmedReminder] = useState<TaskReminderOption>('1h');
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [micLanguage, setMicLanguage] = useState<'ur-PK' | 'en-US'>('ur-PK');

  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [audioLevels, setAudioLevels] = useState<number[]>([15, 25, 40, 60, 45, 30, 20]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep('idle');
      setTranscript('');
      setRecordingSeconds(0);
      setExtractedData(null);
      setActiveClarification(null);
      setSpeechError(null);
    } else {
      stopRecordingCleanup();
    }
  }, [isOpen]);

  // Recording timer
  useEffect(() => {
    if (step === 'recording') {
      timerRef.current = setInterval(() => {
        setRecordingSeconds(s => s + 1);
        // Animate fake audio levels if no real analyser available
        setAudioLevels([
          Math.floor(20 + Math.random() * 60),
          Math.floor(30 + Math.random() * 70),
          Math.floor(40 + Math.random() * 80),
          Math.floor(50 + Math.random() * 90),
          Math.floor(35 + Math.random() * 75),
          Math.floor(25 + Math.random() * 65),
          Math.floor(15 + Math.random() * 50),
        ]);
      }, 100);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [step]);

  const stopRecordingCleanup = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        audioContextRef.current.close();
      } catch (e) {}
    }
  };

  const startVoiceRecording = async () => {
    setSpeechError(null);
    setTranscript('');
    setRecordingSeconds(0);

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechError('Web Speech API is not supported in this browser. You can type or use the test sample commands below.');
      setStep('idle');
      return;
    }

    try {
      // Optional: request mic stream for visualizer
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          streamRef.current = stream;
        } catch (e) {
          console.warn('Microphone permission for visualizer denied, proceeding with SpeechRecognition:', e);
        }
      }

      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.continuous = true;
      recognition.interimResults = true;
      // Set exact speech recognition language model
      recognition.lang = micLanguage;

      recognition.onstart = () => {
        setStep('recording');
      };

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        if (event.error !== 'no-speech') {
          setSpeechError(`Speech error: ${event.error}. You can also type or use preset examples.`);
        }
      };

      recognition.onend = () => {
        if (step === 'recording') {
          processTranscript();
        }
      };

      recognition.start();
    } catch (err: any) {
      setSpeechError(`Microphone access error: ${err?.message || 'Access blocked'}`);
      setStep('idle');
    }
  };

  const stopVoiceRecording = () => {
    stopRecordingCleanup();
    processTranscript();
  };

  const processTranscript = (customText?: string) => {
    const textToProcess = customText !== undefined ? customText : transcript;
    if (!textToProcess.trim()) {
      setStep('idle');
      return;
    }

    setStep('processing');
    setTimeout(() => {
      const extracted = parseVoiceInput(textToProcess, teamMembers);
      setExtractedData(extracted);

      // Pre-fill confirmation states
      setConfirmedTitle(extracted.taskTitle || 'New Task');
      setConfirmedAssignee(extracted.assignedToId || extracted.assignedToName || (teamMembers[0]?.id || ''));
      setConfirmedDate(extracted.deadlineDate || new Date().toISOString().slice(0, 10));
      setConfirmedTime(extracted.deadlineTime || '18:00');
      setConfirmedPriority(extracted.priority || 'medium');
      setConfirmedReminder(extracted.reminder || '1h');

      if (extracted.ambiguities.length > 0) {
        setActiveClarification(extracted.ambiguities[0]);
        setStep('clarification');
      } else {
        setStep('confirm');
      }
    }, 450);
  };

  const handleUsePreset = (sampleText: string) => {
    setTranscript(sampleText);
    processTranscript(sampleText);
  };

  const handleFinalCreateTask = () => {
    if (!confirmedTitle.trim() || !confirmedAssignee || !confirmedDate) {
      alert('Please fill in the required task fields.');
      return;
    }

    onTaskCreated({
      title: confirmedTitle.trim(),
      description: extractedData?.taskDescription || `Created via Voice Assistant ("${transcript}")`,
      assignedTo: confirmedAssignee,
      priority: confirmedPriority,
      startDate: new Date().toISOString().slice(0, 10),
      deadlineDate: confirmedDate,
      deadlineTime: confirmedTime,
      reminder: confirmedReminder
    });

    // Fun celebratory confetti
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 }
      });
    } catch (e) {}

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full max-w-xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden transition-all duration-300"
        role="dialog"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-semibold">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                AI Voice Task Assistant
                <span className="text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  Multilingual AI
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Speaks English, Urdu & Roman Urdu naturally
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content based on Step */}
        <div className="p-6 space-y-6">
          {/* IDLE / RECORDING STATE */}
          {(step === 'idle' || step === 'recording') && (
            <div className="flex flex-col items-center text-center space-y-4">
              {/* Language Mode Toggle */}
              <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setMicLanguage('ur-PK')}
                  disabled={step === 'recording'}
                  className={`px-3 py-1.5 rounded-xl transition-all ${
                    micLanguage === 'ur-PK'
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm font-bold'
                      : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  🇵🇰 Urdu / Roman Urdu
                </button>
                <button
                  type="button"
                  onClick={() => setMicLanguage('en-US')}
                  disabled={step === 'recording'}
                  className={`px-3 py-1.5 rounded-xl transition-all ${
                    micLanguage === 'en-US'
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm font-bold'
                      : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  🌐 English
                </button>
              </div>

              {/* Mic Visualizer Button */}
              <div className="relative my-2 flex items-center justify-center">
                {step === 'recording' && (
                  <>
                    <div className="absolute w-32 h-32 rounded-full bg-indigo-500/20 animate-ping" />
                    <div className="absolute w-40 h-40 rounded-full bg-indigo-500/10 animate-pulse" />
                  </>
                )}
                
                <button
                  onClick={step === 'recording' ? stopVoiceRecording : startVoiceRecording}
                  className={`relative z-10 w-24 h-24 rounded-full flex flex-col items-center justify-center shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 ${
                    step === 'recording'
                      ? 'bg-rose-600 text-white shadow-rose-500/30 ring-8 ring-rose-500/20'
                      : 'bg-gradient-to-tr from-indigo-600 to-violet-600 text-white shadow-indigo-500/30 ring-8 ring-indigo-500/20'
                  }`}
                >
                  {step === 'recording' ? (
                    <MicOff className="w-10 h-10 animate-pulse" />
                  ) : (
                    <Mic className="w-10 h-10" />
                  )}
                  <span className="text-[10px] font-medium tracking-wide mt-1">
                    {step === 'recording' ? 'STOP' : 'SPEAK'}
                  </span>
                </button>
              </div>

              {/* Status & Waveform */}
              {step === 'recording' ? (
                <div className="space-y-3 w-full">
                  <div className="flex items-center justify-center gap-2 text-rose-600 dark:text-rose-400 font-semibold text-sm">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                    Listening... {Math.floor(recordingSeconds / 10)}s
                  </div>

                  {/* Audio Wave Bars */}
                  <div className="flex items-center justify-center gap-1.5 h-10 py-1">
                    {audioLevels.map((lvl, idx) => (
                      <div
                        key={idx}
                        className="w-1.5 bg-indigo-500 dark:bg-indigo-400 rounded-full transition-all duration-75"
                        style={{ height: `${Math.max(10, Math.min(100, lvl))}%` }}
                      />
                    ))}
                  </div>

                  {/* Live Transcript Bubble */}
                  <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 text-slate-800 dark:text-slate-200 text-sm font-medium min-h-[50px] italic">
                    "{transcript || 'Listening to your command...'}"
                  </div>

                  <button
                    onClick={stopVoiceRecording}
                    className="px-6 py-2 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-semibold hover:opacity-90 transition-opacity"
                  >
                    Done Speaking (Process AI)
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                    Click the microphone to speak naturally
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
                    Speak your task in English or Roman Urdu. The AI will extract the assignee, title, deadline date, time, and priority.
                  </p>
                </div>
              )}

              {/* Manual Input Alternative */}
              {step === 'idle' && (
                <div className="w-full pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3 text-left">
                  <label className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    Or type / paste voice message:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. Ali ko website ka homepage complete karna hai, deadline 30 September shaam 6 baje..."
                      value={transcript}
                      onChange={e => setTranscript(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && transcript.trim() && processTranscript()}
                      className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                    />
                    <button
                      onClick={() => processTranscript()}
                      disabled={!transcript.trim()}
                      className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold shadow-sm transition-all"
                    >
                      Extract Task
                    </button>
                  </div>
                </div>
              )}

              {/* Quick Sample Presets */}
              {step === 'idle' && (
                <div className="w-full space-y-2 text-left">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                      Try Sample Voice Prompts (1-Click Test):
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {SAMPLE_VOICE_COMMANDS.slice(0, 4).map((sample, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleUsePreset(sample.text)}
                        className="p-2.5 rounded-xl text-left border border-slate-200/80 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 bg-white dark:bg-slate-800/40 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 transition-all text-xs group"
                      >
                        <div className="font-semibold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 line-clamp-1">
                          {sample.label}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 italic mt-0.5">
                          "{sample.text}"
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {speechError && (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 text-amber-800 dark:text-amber-300 text-xs flex items-center gap-2 text-left">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{speechError}</span>
                </div>
              )}
            </div>
          )}

          {/* PROCESSING STATE */}
          {step === 'processing' && (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center animate-spin">
                <Sparkles className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                AI is analyzing your voice command...
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs">
                Extracting assignee, deadline date, time, task scope and priority...
              </p>
            </div>
          )}

          {/* CLARIFICATION STATE */}
          {step === 'clarification' && extractedData && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900/50 text-left space-y-2">
                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-semibold text-sm">
                  <HelpCircle className="w-5 h-5" />
                  Clarification Needed Before Confirmation
                </div>
                <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                  {activeClarification}
                </p>
              </div>

              {/* Clarification resolver UI */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-4 text-left">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Assigned Team Member:
                  </label>
                  {teamMembers.length > 0 ? (
                    <select
                      value={confirmedAssignee}
                      onChange={e => setConfirmedAssignee(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                    >
                      {teamMembers.map(m => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({m.role})
                        </option>
                      ))}
                      {confirmedAssignee && !teamMembers.some(m => m.id === confirmedAssignee) && (
                        <option value={confirmedAssignee}>
                          {confirmedAssignee} (Auto-Add Member)
                        </option>
                      )}
                    </select>
                  ) : (
                    <input
                      type="text"
                      placeholder="Enter team member name (e.g. Ali Khan)"
                      value={confirmedAssignee}
                      onChange={e => setConfirmedAssignee(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                    />
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Deadline Date:
                    </label>
                    <input
                      type="date"
                      value={confirmedDate}
                      onChange={e => setConfirmedDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Deadline Time:
                    </label>
                    <input
                      type="time"
                      value={confirmedTime}
                      onChange={e => setConfirmedTime(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setStep('confirm')}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm"
                  >
                    Proceed to Confirm
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* CONFIRMATION SCREEN (Requirement 5 & 17: Never silently create without confirmation) */}
          {step === 'confirm' && (
            <div className="space-y-5 text-left">
              {/* Voice Transcript Quote */}
              <div className="p-3.5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 flex items-start gap-3">
                <Volume2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1 text-xs">
                  <div className="font-semibold text-slate-700 dark:text-slate-300">
                    Voice Input Recognized ({extractedData?.detectedLanguage === 'ur-roman' ? 'Urdu / Roman Urdu' : 'English'}):
                  </div>
                  <div className="text-slate-600 dark:text-slate-400 italic mt-0.5">
                    "{transcript}"
                  </div>
                </div>
              </div>

              {/* Confirmation Details Card */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-700 pb-3">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500" />
                    Confirm Extracted Task Details
                  </h3>
                  <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-900">
                    AI Confidence: {Math.round((extractedData?.confidence || 0.8) * 100)}%
                  </span>
                </div>

                {/* Editable Task Title */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Task Title
                  </label>
                  <input
                    type="text"
                    value={confirmedTitle}
                    onChange={e => setConfirmedTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Editable Assignee & Priority */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-indigo-500" />
                      Assigned To
                    </label>
                    {teamMembers.length > 0 ? (
                      <select
                        value={confirmedAssignee}
                        onChange={e => setConfirmedAssignee(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                      >
                        {teamMembers.map(m => (
                          <option key={m.id} value={m.id}>
                            {m.name} ({m.role})
                          </option>
                        ))}
                        {confirmedAssignee && !teamMembers.some(m => m.id === confirmedAssignee) && (
                          <option value={confirmedAssignee}>
                            {confirmedAssignee} (Auto-Add Member)
                          </option>
                        )}
                      </select>
                    ) : (
                      <input
                        type="text"
                        placeholder="Enter team member name (e.g. Ali)"
                        value={confirmedAssignee}
                        onChange={e => setConfirmedAssignee(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                      />
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1.5">
                      <Flag className="w-3.5 h-3.5 text-orange-500" />
                      Priority
                    </label>
                    <select
                      value={confirmedPriority}
                      onChange={e => setConfirmedPriority(e.target.value as TaskPriority)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="low">Low Priority</option>
                      <option value="medium">Medium Priority</option>
                      <option value="high">High Priority</option>
                      <option value="urgent">Urgent Priority 🚨</option>
                    </select>
                  </div>
                </div>

                {/* Deadline & Reminder */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                      Deadline Date
                    </label>
                    <input
                      type="date"
                      value={confirmedDate}
                      onChange={e => setConfirmedDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-blue-500" />
                      Time
                    </label>
                    <input
                      type="time"
                      value={confirmedTime}
                      onChange={e => setConfirmedTime(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1.5">
                      <Bell className="w-3.5 h-3.5 text-purple-500" />
                      Reminder
                    </label>
                    <select
                      value={confirmedReminder}
                      onChange={e => setConfirmedReminder(e.target.value as TaskReminderOption)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="none">No reminder</option>
                      <option value="15m">15 mins before</option>
                      <option value="30m">30 mins before</option>
                      <option value="1h">1 hour before</option>
                      <option value="2h">2 hours before</option>
                      <option value="1d">1 day before</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setStep('idle');
                    setTranscript('');
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Record Again
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleFinalCreateTask}
                    className="px-5 py-2.5 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    Create Task
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
