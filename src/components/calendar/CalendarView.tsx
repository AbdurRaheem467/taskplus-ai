import React, { useState, useMemo } from 'react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths, 
  isToday, 
  parseISO,
  addWeeks,
  subWeeks,
  startOfDay
} from 'date-fns';
import { Task, TeamMember } from '../../types';
import { PriorityBadge, StatusBadge } from '../common/Badge';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Clock, 
  Plus, 
  X,
  AlertCircle
} from 'lucide-react';
import { formatTimeOnly } from '../../utils/dateUtils';

interface CalendarViewProps {
  tasks: Task[];
  teamMembers: TeamMember[];
  onSelectTask: (task: Task) => void;
  onAddNewTaskOnDate: (dateStr: string) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  tasks,
  teamMembers,
  onSelectTask,
  onAddNewTaskOnDate,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewType, setViewType] = useState<'month' | 'week' | 'day'>('month');
  const [selectedDay, setSelectedDay] = useState<Date>(new Date());
  const [isDayDetailOpen, setIsDayDetailOpen] = useState(false);

  // Month days interval
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday start
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const monthDays = useMemo(() => eachDayOfInterval({ start: calendarStart, end: calendarEnd }), [calendarStart, calendarEnd]);

  // Week days interval
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = useMemo(() => eachDayOfInterval({ start: weekStart, end: weekEnd }), [weekStart, weekEnd]);

  // Navigate forward/back
  const handlePrev = () => {
    if (viewType === 'month') setCurrentDate(subMonths(currentDate, 1));
    else if (viewType === 'week') setCurrentDate(subWeeks(currentDate, 1));
    else setCurrentDate(new Date(currentDate.getTime() - 86400000));
  };

  const handleNext = () => {
    if (viewType === 'month') setCurrentDate(addMonths(currentDate, 1));
    else if (viewType === 'week') setCurrentDate(addWeeks(currentDate, 1));
    else setCurrentDate(new Date(currentDate.getTime() + 86400000));
  };

  const handleToday = () => {
    const now = new Date();
    setCurrentDate(now);
    setSelectedDay(now);
  };

  // Tasks mapped by date string "YYYY-MM-DD"
  const tasksByDate = useMemo(() => {
    const map: Record<string, Task[]> = {};
    tasks.forEach(task => {
      const dateKey = task.deadlineDate;
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push(task);
    });
    return map;
  }, [tasks]);

  const selectedDayKey = format(selectedDay, 'yyyy-MM-dd');
  const selectedDayTasks = tasksByDate[selectedDayKey] || [];

  const handleDayClick = (day: Date) => {
    setSelectedDay(day);
    setIsDayDetailOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Calendar Header & View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Deadline Calendar
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Track schedules, milestones, and deliverables across time
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex items-center p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 text-xs font-semibold">
            <button
              onClick={() => setViewType('month')}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                viewType === 'month'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setViewType('week')}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                viewType === 'week'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setViewType('day')}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                viewType === 'day'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              Today
            </button>
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleToday}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition-colors"
            >
              Today
            </button>
            <div className="flex items-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden">
              <button
                onClick={handlePrev}
                className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                title="Previous"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNext}
                className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                title="Next"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Current Range Label */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-indigo-500" />
          {viewType === 'month' && format(currentDate, 'MMMM yyyy')}
          {viewType === 'week' && `Week of ${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`}
          {viewType === 'day' && format(currentDate, 'EEEE, MMMM d, yyyy')}
        </h2>
        <span className="text-xs text-slate-400">
          Showing {tasks.length} total scheduled tasks
        </span>
      </div>

      {/* MONTH VIEW */}
      {viewType === 'month' && (
        <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
          {/* Weekday Names Header */}
          <div className="grid grid-cols-7 border-b border-slate-100 dark:border-slate-800 text-center text-xs font-semibold py-3 text-slate-400 dark:text-slate-500 bg-slate-50/50 dark:bg-slate-950/40">
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
            <div>Sun</div>
          </div>

          {/* Grid of Days */}
          <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 dark:divide-slate-800">
            {monthDays.map(day => {
              const dateKey = format(day, 'yyyy-MM-dd');
              const dayTasks = tasksByDate[dateKey] || [];
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isTodayDate = isToday(day);

              return (
                <div
                  key={dateKey}
                  onClick={() => handleDayClick(day)}
                  className={`min-h-[115px] p-2 transition-all cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-800/40 flex flex-col justify-between ${
                    !isCurrentMonth ? 'bg-slate-50/30 dark:bg-slate-950/20 opacity-40' : ''
                  } ${isTodayDate ? 'bg-indigo-50/20 dark:bg-indigo-950/20 ring-1 ring-inset ring-indigo-500/30' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                        isTodayDate
                          ? 'bg-indigo-600 text-white font-bold'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {format(day, 'd')}
                    </span>
                    {dayTasks.length > 0 && (
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        {dayTasks.length}
                      </span>
                    )}
                  </div>

                  {/* Task Badges in Day Cell */}
                  <div className="space-y-1 mt-1 flex-1 overflow-hidden">
                    {dayTasks.slice(0, 3).map(task => {
                      const assigned = teamMembers.find(m => m.id === task.assignedTo);
                      return (
                        <div
                          key={task.id}
                          onClick={e => {
                            e.stopPropagation();
                            onSelectTask(task);
                          }}
                          className={`text-[10px] px-1.5 py-0.5 rounded-lg truncate font-medium transition-all ${
                            task.status === 'completed'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : task.status === 'overdue'
                              ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 font-bold'
                              : task.priority === 'urgent'
                              ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400'
                              : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
                          }`}
                          title={`${task.title} (${assigned?.name || 'Unassigned'})`}
                        >
                          <span className="font-bold mr-1">{formatTimeOnly(task.deadlineTime)}</span>
                          {task.title}
                        </div>
                      );
                    })}
                    {dayTasks.length > 3 && (
                      <div className="text-[9px] text-slate-400 font-medium pl-1">
                        +{dayTasks.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* WEEK VIEW */}
      {viewType === 'week' && (
        <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
          {weekDays.map(day => {
            const dateKey = format(day, 'yyyy-MM-dd');
            const dayTasks = tasksByDate[dateKey] || [];
            const isTodayDate = isToday(day);

            return (
              <div
                key={dateKey}
                onClick={() => handleDayClick(day)}
                className={`rounded-3xl border border-slate-200/80 dark:border-slate-800 p-3.5 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between min-h-[350px] cursor-pointer hover:border-indigo-400 transition-all ${
                  isTodayDate ? 'ring-2 ring-indigo-500 bg-indigo-50/10' : ''
                }`}
              >
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <div className="text-xs font-semibold text-slate-400 uppercase">
                        {format(day, 'EEE')}
                      </div>
                      <div className="text-lg font-bold text-slate-900 dark:text-white">
                        {format(day, 'd MMM')}
                      </div>
                    </div>
                    {isTodayDate && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                        Today
                      </span>
                    )}
                  </div>

                  <div className="mt-3 space-y-2">
                    {dayTasks.length === 0 ? (
                      <p className="text-xs text-slate-400 italic pt-2">No tasks</p>
                    ) : (
                      dayTasks.map(task => (
                        <div
                          key={task.id}
                          onClick={e => {
                            e.stopPropagation();
                            onSelectTask(task);
                          }}
                          className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-xs hover:border-indigo-400 transition-colors"
                        >
                          <div className="font-semibold text-slate-900 dark:text-white line-clamp-1">
                            {task.title}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
                            <span>{formatTimeOnly(task.deadlineTime)}</span>
                            <PriorityBadge priority={task.priority} />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <button
                  onClick={e => {
                    e.stopPropagation();
                    onAddNewTaskOnDate(dateKey);
                  }}
                  className="w-full mt-3 py-1.5 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 hover:border-indigo-500 text-slate-500 hover:text-indigo-600 text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Task
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* TODAY / DAY VIEW */}
      {viewType === 'day' && (
        <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Tasks Due on {format(currentDate, 'MMMM d, yyyy')}
              </h3>
              <p className="text-xs text-slate-400">
                Detailed schedule breakdown for this day
              </p>
            </div>
            <button
              onClick={() => onAddNewTaskOnDate(format(currentDate, 'yyyy-MM-dd'))}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Schedule Task For This Day
            </button>
          </div>

          <div className="space-y-3">
            {(tasksByDate[format(currentDate, 'yyyy-MM-dd')] || []).length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400 italic">
                No tasks scheduled for this day. Click "Schedule Task" above to add one.
              </div>
            ) : (
              (tasksByDate[format(currentDate, 'yyyy-MM-dd')] || []).map(task => {
                const assigned = teamMembers.find(m => m.id === task.assignedTo);
                return (
                  <div
                    key={task.id}
                    onClick={() => onSelectTask(task)}
                    className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-indigo-400 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between cursor-pointer transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs">
                        {formatTimeOnly(task.deadlineTime)}
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                          {task.title}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Assigned to: <span className="font-medium text-slate-700 dark:text-slate-300">{assigned?.name || 'Unassigned'}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <PriorityBadge priority={task.priority} />
                      <StatusBadge status={task.status} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Date Detail Drawer when clicking any calendar day */}
      {isDayDetailOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            className="w-full max-w-md h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-200"
            role="dialog"
          >
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/50">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {format(selectedDay, 'EEEE, d MMMM yyyy')}
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedDayTasks.length} tasks scheduled
                </p>
              </div>
              <button
                onClick={() => setIsDayDetailOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {selectedDayTasks.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400 italic">
                  No deadlines on this day.
                </div>
              ) : (
                selectedDayTasks.map(task => {
                  const assigned = teamMembers.find(m => m.id === task.assignedTo);
                  return (
                    <div
                      key={task.id}
                      onClick={() => {
                        setIsDayDetailOpen(false);
                        onSelectTask(task);
                      }}
                      className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-indigo-400 bg-white dark:bg-slate-800/40 cursor-pointer shadow-sm transition-all space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {formatTimeOnly(task.deadlineTime)}
                        </span>
                        <PriorityBadge priority={task.priority} />
                      </div>
                      <div className="text-xs font-semibold text-slate-900 dark:text-white">
                        {task.title}
                      </div>
                      <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400">
                        <span>{assigned?.name || 'Unassigned'}</span>
                        <StatusBadge status={task.status} />
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="p-4 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => {
                  setIsDayDetailOpen(false);
                  onAddNewTaskOnDate(selectedDayKey);
                }}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Schedule Task on this Date
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
