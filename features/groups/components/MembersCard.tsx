"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Clock,
  Check,
  Mail,
  ShieldCheck,
  UserPlus,
  UserCheck,
  Crown,
  X,
} from "lucide-react";
import { useState } from "react";

import { useAuthStore } from "@/features/auth/store/auth.store";
import { MemberSearch, type MemberInvite } from "@/features/dashboard/components/MemberSearch";
import getInitial from "../../../lib/useGetInitials";

import { useGroupMembersSummary } from "@/features/groups/hooks/useGroupMembersSummary";
import { addMembersToGroupAction } from "@/features/groups/actions/add-members-to-group";
import {
  acceptJoinRequestAction,
  rejectJoinRequestAction,
} from "@/features/groups/actions/join-requests";
import { removeGroupMemberAction } from "@/features/groups/actions/remove-member";
import { cancelGroupInvitationAction } from "@/features/groups/actions/cancel-invitation";
import type {
  GroupMember,
  JoinRequest,
  PendingInvitation,
} from "@/features/groups/types";

function formatRequestDate(iso: string): string {
  try {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return d.toLocaleDateString();
  } catch {
    return "";
  }
}

interface MembersCardProps {
  groupId: string;
  /** When provided, the member with this user id is shown with an owner badge. */
  createdBy?: string;
}

export function MembersCard({ groupId, createdBy }: MembersCardProps) {
  const [activeTab, setActiveTab] = useState<"members" | "requests">("members");
  const { sessionUser: currentUser } = useAuthStore();
  const [isAddMode, setIsAddMode] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState<MemberInvite[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [processingRequestId, setProcessingRequestId] = useState<string | null>(
    null,
  );
  const [requestsError, setRequestsError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [membersError, setMembersError] = useState<string | null>(null);

  const { summary, loading, error, refetch } = useGroupMembersSummary(groupId);

  const isOwner =
    createdBy !== undefined &&
    currentUser?.id !== undefined &&
    createdBy === currentUser.id;

  const members: GroupMember[] = summary?.members ?? [];
  const joinRequests: JoinRequest[] = summary?.join_requests ?? [];
  const pendingInvitations: PendingInvitation[] =
    summary?.pending_invitations ?? [];
  const membersCount = summary?.counts.members_count ?? 0;
  const requestsCount = summary?.counts.join_requests_count ?? 0;

  function getAddDisabledReason(result: MemberInvite): string | null {
    const emailLower = result.email.toLowerCase();
    const userId = result.isExistingUser ? result.id : null;

    if (
      members.some((m: GroupMember) => {
        return (
          m.user.email.toLowerCase() === emailLower || m.user.id === userId
        );
      })
    ) {
      return "Already a member";
    }
    if (
      pendingInvitations.some(
        (inv: PendingInvitation) =>
          inv.email.toLowerCase() === emailLower,
      )
    ) {
      return "Invitation already sent";
    }
    if (
      result.isExistingUser &&
      joinRequests.some((r: JoinRequest) => {
        return (
          r.user.id === userId || r.user.email.toLowerCase() === emailLower
        );
      })
    ) {
      return "Join request pending";
    }
    return null;
  }

  function handleAddMember(member: MemberInvite) {
    setSelectedMembers((prev) => [...prev, member]);
    setAddError(null);
  }

  function handleRemoveSelectedMember(id: string) {
    setSelectedMembers((prev) => prev.filter((m) => m.id !== id));
  }

  async function handleSubmitAddMembers() {
    if (selectedMembers.length === 0) return;

    setIsSubmitting(true);
    setAddError(null);

    const result = await addMembersToGroupAction(groupId, selectedMembers);

    if (result.error) {
      setAddError(result.error.message);
      setIsSubmitting(false);
      return;
    }

    setSelectedMembers([]);
    setIsAddMode(false);
    setAddError(null);
    await refetch();
    setIsSubmitting(false);
  }

  async function handleAcceptRequest(requestId: string) {
    setProcessingRequestId(requestId);
    setRequestsError(null);
    const result = await acceptJoinRequestAction(requestId);
    if (result.error) {
      setRequestsError(result.error.message);
    } else {
      await refetch();
    }
    setProcessingRequestId(null);
  }

  async function handleRejectRequest(requestId: string) {
    setProcessingRequestId(requestId);
    setRequestsError(null);
    const result = await rejectJoinRequestAction(requestId);
    if (result.error) {
      setRequestsError(result.error.message);
    } else {
      await refetch();
    }
    setProcessingRequestId(null);
  }

  async function handleRemoveMember(memberId: string) {
    setRemovingId(memberId);
    setMembersError(null);
    const result = await removeGroupMemberAction(groupId, memberId);
    if (result.error) {
      setMembersError(result.error.message);
    } else {
      await refetch();
    }
    setRemovingId(null);
  }

  async function handleCancelInvitation(invitationId: string) {
    setRemovingId(invitationId);
    setMembersError(null);
    const result = await cancelGroupInvitationAction(invitationId);
    if (result.error) {
      setMembersError(result.error.message);
    } else {
      await refetch();
    }
    setRemovingId(null);
  }

  if (loading && !summary) {
    return (
      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col h-[500px] overflow-hidden">
        <div className="flex border-b border-slate-100 bg-slate-50/50 shrink-0">
          <div className="flex-1 py-5 flex items-center justify-center gap-2">
            <div className="h-3.5 w-3.5 rounded bg-slate-200 animate-pulse" />
            <div className="h-3 w-16 rounded bg-slate-200 animate-pulse" />
          </div>
          <div className="flex-1 py-5 flex items-center justify-center gap-2">
            <div className="h-3.5 w-3.5 rounded bg-slate-200 animate-pulse" />
            <div className="h-3 w-16 rounded bg-slate-200 animate-pulse" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-3 p-2 rounded-2xl">
              <div className="w-11 h-11 rounded-xl bg-slate-200 animate-pulse" />
              <div className="space-y-1">
                <div className="h-3 w-24 rounded bg-slate-200 animate-pulse" />
                <div className="h-2.5 w-16 rounded bg-slate-100 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col h-[500px] overflow-hidden p-6">
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }
  const memberTabs: Array<{
    id: "members" | "requests";
    label: string;
    icon: typeof Users;
    count: number;
  }> = [
    {
      id: "members",
      label: "Members",
      icon: Users,
      count: membersCount + pendingInvitations.length,
    },
  ];
  if (isOwner) {
    memberTabs.push({
      id: "requests",
      label: "Requests",
      icon: Clock,
      count: requestsCount,
    });
  }
  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col h-[500px] overflow-hidden">
      {/* Tabs Header */}
      <div className="flex border-b border-slate-100 bg-slate-50/50 shrink-0">
        {memberTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-5 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all relative ${
              activeTab === tab.id
                ? "text-indigo-600"
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            <tab.icon className="w-3.5 h-3.5 shrink-0" />
            {tab.label}
            {tab.count > 0 && (
              <span
                className={`ml-1 px-1.5 py-0.5 rounded-full text-[8px] ${
                  activeTab === tab.id
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-200 text-slate-500"
                }`}
              >
                {tab.count}
              </span>
            )}
            {activeTab === tab.id && (
              <motion.div
                layoutId="tab-underline"
                className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-600"
              />
            )}
          </button>
        ))}
      </div>

      {/* List Area - Scrollable */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
        <AnimatePresence mode="wait">
          {activeTab === "members" ? (
            <motion.div
              key="members"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="space-y-3"
            >
              {members.length === 0 && pendingInvitations.length === 0 ? (
                <div className="py-12 text-center opacity-60">
                  <Users className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    No members yet
                  </p>
                </div>
              ) : (
                <>
                  {isAddMode ? (
                    <div className="space-y-4">
                      <MemberSearch
                        selectedMembers={selectedMembers}
                        onAddMember={handleAddMember}
                        onRemoveMember={handleRemoveSelectedMember}
                        getAddDisabledReason={getAddDisabledReason}
                      />
                      {addError && (
                        <p className="text-xs text-red-600 font-medium">
                          {addError}
                        </p>
                      )}
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setIsAddMode(false);
                            setSelectedMembers([]);
                            setAddError(null);
                          }}
                          className="flex-1 py-3 border border-slate-200 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleSubmitAddMembers}
                          disabled={
                            selectedMembers.length === 0 || isSubmitting
                          }
                          className="flex-1 py-3 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 disabled:opacity-50"
                        >
                          {isSubmitting
                            ? "Adding..."
                            : `Add ${selectedMembers.length} ${
                                selectedMembers.length === 1
                                  ? "member"
                                  : "members"
                              }`}
                        </button>
                      </div>
                    </div>
                  ) : (
                    isOwner && (
                      <button
                        type="button"
                        onClick={() => setIsAddMode(true)}
                        className="w-full py-4 border-2 border-dashed border-slate-100 rounded-2xl flex items-center justify-center gap-2 text-slate-400 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50/50 transition-all text-[10px] font-black uppercase tracking-widest"
                      >
                        <UserPlus className="w-4 h-4" />
                        Invite Members
                      </button>
                    )
                  )}
                  {membersError && (
                    <p className="text-xs text-red-600 font-medium">
                      {membersError}
                    </p>
                  )}
                  {!isAddMode &&
                    members.map((member: GroupMember) => (
                      <MemberRow
                        key={member.id}
                        member={member}
                        isCurrentUser={currentUser?.id === member.user.id}
                        isGroupOwner={
                          createdBy !== undefined &&
                          createdBy === member.user.id
                        }
                        canRemove={
                          isOwner &&
                          currentUser?.id !== member.user.id &&
                          createdBy !== member.user.id
                        }
                        onRemove={handleRemoveMember}
                        isRemoving={removingId === member.id}
                      />
                    ))}
                  {!isAddMode &&
                    pendingInvitations.map((invitation: PendingInvitation) => (
                      <PendingInvitationRow
                        key={invitation.id}
                        invitation={invitation}
                        canRemove={isOwner}
                        onRemove={handleCancelInvitation}
                        isRemoving={removingId === invitation.id}
                      />
                    ))}
                </>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="requests"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="space-y-4"
            >
              {requestsError && (
                <p className="text-xs text-red-600 font-medium mb-2">
                  {requestsError}
                </p>
              )}
              {joinRequests.length > 0 ? (
                joinRequests.map((req: JoinRequest) => (
                  <JoinRequestRow
                    key={req.id}
                    request={req}
                    onAccept={handleAcceptRequest}
                    onReject={handleRejectRequest}
                    isProcessing={processingRequestId === req.id}
                  />
                ))
              ) : (
                <div className="py-20 text-center opacity-30">
                  <UserCheck className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    No pending requests
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function MemberRow({
  member,
  isCurrentUser,
  isGroupOwner,
  canRemove,
  onRemove,
  isRemoving,
}: {
  member: GroupMember;
  isCurrentUser: boolean;
  isGroupOwner: boolean;
  canRemove: boolean;
  onRemove: (memberId: string) => void;
  isRemoving: boolean;
}) {
  const displayName =
    member.user.full_name?.trim() || member.user.email || "User";
  return (
    <div className="flex items-center justify-between group p-2 -mx-2 hover:bg-slate-50 rounded-2xl transition-all">
      <div className="flex items-center gap-3">
        <div className="relative shrink-0">
          <div className="w-11 h-11 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center border-2 border-white shadow-sm text-sm font-bold">
            {getInitial(member.user.full_name, member.user.email)}
          </div>

          <div className="absolute -bottom-1 -right-1 rounded-full p-0.5 border-2 border-white shadow-sm bg-emerald-500">
            <Check className="w-2.5 h-2.5 text-white" />
          </div>
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-bold text-slate-900">{displayName}</p>
            {member.role === "admin" && (
              <Crown
                className="w-3 h-3 text-yellow-500 shrink-0"
                fill="currentColor"
              />
            )}
            {isCurrentUser && (
              <span className="text-[7px] bg-slate-900 text-white px-1 py-0.5 rounded font-black tracking-tighter">
                YOU
              </span>
            )}
          </div>
          <p className="text-[10px] font-bold text-slate-400 tracking-tight truncate max-w-[140px]">
            {member.user.email}
          </p>
        </div>
      </div>
      {canRemove && (
        <button
          type="button"
          onClick={() => onRemove(member.id)}
          disabled={isRemoving}
          className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all disabled:opacity-50"
          aria-label="Remove member"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

function PendingInvitationRow({
  invitation,
  canRemove,
  onRemove,
  isRemoving,
}: {
  invitation: PendingInvitation;
  canRemove: boolean;
  onRemove: (invitationId: string) => void;
  isRemoving: boolean;
}) {
  return (
    <div className="flex items-center justify-between group p-2 -mx-2 hover:bg-slate-50 rounded-2xl transition-all">
      <div className="flex items-center gap-3">
        <div className="relative shrink-0 w-11 h-11 rounded-xl bg-slate-100 border-2 border-dashed border-slate-200 flex items-center justify-center">
          <Mail className="w-5 h-5 text-slate-400" />
        </div>
        <div>
          <p className="text-sm font-bold text-slate-600">{invitation.email}</p>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
            Invitation sent
          </p>
        </div>
      </div>
      {canRemove && (
        <button
          type="button"
          onClick={() => onRemove(invitation.id)}
          disabled={isRemoving}
          className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all disabled:opacity-50"
          aria-label="Cancel invitation"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

function JoinRequestRow({
  request,
  onAccept,
  onReject,
  isProcessing,
}: {
  request: JoinRequest;
  onAccept: (requestId: string) => void;
  onReject: (requestId: string) => void;
  isProcessing: boolean;
}) {
  const displayName =
    request.user.full_name?.trim() || request.user.email || "User";
  const avatarUrl = request.user.avatar_url ?? null;

  return (
    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-4">
      <div className="flex items-center gap-3">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt=""
            className="w-10 h-10 rounded-xl object-cover shrink-0"
          />
        ) : (
          <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-bold shrink-0">
            {getInitial(request.user.full_name, request.user.email)}
          </div>
        )}
        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-900 truncate">
            {displayName}
          </p>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            {formatRequestDate(request.requested_at)}
          </p>
        </div>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onAccept(request.id)}
          disabled={isProcessing}
          className="flex-1 bg-indigo-600 text-white py-2 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-indigo-700 shadow-lg shadow-indigo-100 disabled:opacity-50"
        >
          {isProcessing ? "..." : "Approve"}
        </button>
        <button
          type="button"
          onClick={() => onReject(request.id)}
          disabled={isProcessing}
          className="flex-1 border border-slate-200 text-slate-500 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-white disabled:opacity-50"
        >
          Ignore
        </button>
      </div>
    </div>
  );
}

export default MembersCard;
