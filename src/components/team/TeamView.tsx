import React, { useState, useMemo } from 'react';
import { TeamMember, Task } from '../../types';
import { MemberModal } from './MemberModal';
import { MemberDetailDrawer } from './MemberDetailDrawer';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { EmptyState } from '../common/EmptyState';
import { 
  Users, 
  Plus, 
  Search, 
  Mail, 
  Briefcase, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Edit3, 
  Trash2,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

interface TeamViewProps {
  teamMembers: TeamMember[];
  tasks: Task[];
  onSaveMember: (data: Omit<TeamMember, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateMember: (id: string, updates: Partial<TeamMember>) => void;
  onDeleteMember: (id: string) => void;
  onSelectTask: (task: Task) => void;
  onStatusToggle: (taskId: string) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onAddNewTaskForMember: (memberId: string) => void;
}

export const TeamView: React.FC<TeamViewProps> = ({
  teamMembers,
  tasks,
  onSaveMember,
  onUpdateMember,
  onDeleteMember,
  onSelectTask,
  onStatusToggle,
  onEditTask,
  onDeleteTask,
  onAddNewTaskForMember,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [memberToEdit, setMemberToEdit] = useState<TeamMember | null>(null);
  const [selectedDrawerMember, setSelectedDrawerMember] = useState<TeamMember | null>(null);
  const [deleteMemberTargetId, setDeleteMemberTargetId] = useState<string | null>(null);

  const filteredMembers = useMemo(() => {
    return teamMembers.filter(member => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        member.name.toLowerCase().includes(q) ||
        member.email.toLowerCase().includes(q) ||
        member.role.toLowerCase().includes(q)
      );
    });
  }, [teamMembers, searchQuery]);

  const handleEditClick = (member: TeamMember, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setMemberToEdit(member);
    setIsMemberModalOpen(true);
  };

  const handleDeleteClick = (memberId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setDeleteMemberTargetId(memberId);
  };

  const handleConfirmDelete = () => {
    if (deleteMemberTargetId) {
      onDeleteMember(deleteMemberTargetId);
      if (selectedDrawerMember?.id === deleteMemberTargetId) {
        setSelectedDrawerMember(null);
      }
      setDeleteMemberTargetId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Team Members
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage your team roster, monitor member workloads and task distribution
          </p>
        </div>

        <button
          onClick={() => {
            setMemberToEdit(null);
            setIsMemberModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          <span>Add Team Member</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search team members by name, email, or role..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
        />
      </div>

      {/* Members Grid */}
      {filteredMembers.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No team members yet"
          description={
            searchQuery
              ? 'No team members matched your search query.'
              : 'Add members to start assigning tasks, tracking progress, and enabling voice task delegation.'
          }
          actionText="Add Team Member"
          onAction={() => {
            setMemberToEdit(null);
            setIsMemberModalOpen(true);
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredMembers.map(member => {
            const memberTasks = tasks.filter(t => t.assignedTo === member.id);
            const total = memberTasks.length;
            const completed = memberTasks.filter(t => t.status === 'completed').length;
            const pending = memberTasks.filter(t => t.status === 'pending').length;
            const inProgress = memberTasks.filter(t => t.status === 'in_progress').length;
            const overdue = memberTasks.filter(t => t.status === 'overdue').length;
            const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

            return (
              <div
                key={member.id}
                onClick={() => setSelectedDrawerMember(member)}
                className="group relative rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm hover:shadow-xl transition-all duration-200 cursor-pointer flex flex-col justify-between hover:-translate-y-1"
              >
                <div>
                  {/* Top Card Bar: Avatar & Action Buttons */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-base font-bold shadow-md shadow-indigo-500/10 group-hover:scale-105 transition-transform"
                        style={{ backgroundColor: member.avatarColor || '#4f46e5' }}
                      >
                        {member.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {member.name}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                          {member.role}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={e => handleEditClick(member, e)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                        title="Edit member"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={e => handleDeleteClick(member.id, e)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                        title="Delete member"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Email row */}
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-4 px-1">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate">{member.email}</span>
                  </div>

                  {/* Task Counts Summary Pills */}
                  <div className="grid grid-cols-4 gap-2 mb-4 text-center">
                    <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 font-medium block">Total</span>
                      <span className="text-xs font-bold text-slate-900 dark:text-white">{total}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/40">
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium block">Done</span>
                      <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">{completed}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900/40">
                      <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium block">Pending</span>
                      <span className="text-xs font-bold text-amber-700 dark:text-amber-300">{pending + inProgress}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/40">
                      <span className="text-[10px] text-rose-600 dark:text-rose-400 font-medium block">Overdue</span>
                      <span className="text-xs font-bold text-rose-700 dark:text-rose-300">{overdue}</span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1 mb-2">
                    <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400">
                      <span>Completion</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{rate}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                        style={{ width: `${rate}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Footer Link */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-indigo-600 dark:text-indigo-400 group-hover:translate-x-0.5 transition-transform">
                  <span>View all {total} tasks</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Member Modal (Add / Edit) */}
      <MemberModal
        isOpen={isMemberModalOpen}
        onClose={() => {
          setIsMemberModalOpen(false);
          setMemberToEdit(null);
        }}
        memberToEdit={memberToEdit}
        onSave={data => {
          if (memberToEdit) {
            onUpdateMember(memberToEdit.id, data);
          } else {
            onSaveMember(data);
          }
        }}
      />

      {/* Member Tasks Drawer */}
      <MemberDetailDrawer
        isOpen={!!selectedDrawerMember}
        onClose={() => setSelectedDrawerMember(null)}
        member={selectedDrawerMember}
        tasks={tasks}
        teamMembers={teamMembers}
        onSelectTask={onSelectTask}
        onStatusToggle={onStatusToggle}
        onEditTask={onEditTask}
        onDeleteTask={onDeleteTask}
        onAddNewTaskForMember={onAddNewTaskForMember}
        onEditMember={member => {
          setSelectedDrawerMember(null);
          setMemberToEdit(member);
          setIsMemberModalOpen(true);
        }}
      />

      {/* Confirm Delete Member */}
      <ConfirmDialog
        isOpen={!!deleteMemberTargetId}
        title="Remove Team Member"
        message="Are you sure you want to remove this member? Existing tasks assigned to them will become unassigned."
        confirmLabel="Remove Member"
        isDestructive={true}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteMemberTargetId(null)}
      />
    </div>
  );
};
