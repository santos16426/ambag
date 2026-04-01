"use client";

import { useEffect, useRef, useState } from "react";
import {
  Check,
  Crown,
  Mail,
  MessageSquare,
  Users,
  UserPlus,
  Trash,
} from "lucide-react";

import {
  MemberSearch,
  type MemberInvite,
} from "@/components/common/MemberSearch";
import { useAuthStore } from "@/features/auth/store/auth.store";
import getInitials from "@/lib/get-initials";

import { useGroupDetailsStore } from "../store/group-details.store";
import {
  addMembersToGroup,
  cancelGroupInvitation,
  removeGroupMember,
} from "../services/group-members.service";
import {
  subscribeToGroupMessages,
  unsubscribeFromGroupMessages,
} from "../services/group-chat.service";
import type { GroupDetailMember } from "../types";
import GroupChat from "../components/GroupChat";
import Image from "next/image";
interface MembersCardProps {
  members: GroupDetailMember[];
  createdBy?: string;
  groupId?: string;
  isArchived?: boolean;
}

function MemberRow({
  member,
  isCurrentUser,
  isGroupOwner,
  canRemove,
  onRemove,
  isRemoving,
}: {
  member: GroupDetailMember;
  isCurrentUser: boolean;
  isGroupOwner: boolean;
  canRemove: boolean;
  onRemove: (memberId: string) => void;
  isRemoving: boolean;
}) {
  const user = member.user;
  if (!user) return null;
  const displayName = user.fullname?.trim() || user.email || "User";

  return (
    <div className="flex items-center justify-between group p-2 -mx-2 hover:bg-slate-50 rounded-2xl transition-all">
      <div className="flex items-center gap-3">
        <div className="relative shrink-0">
          <div className="w-11 h-11 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center border-2 border-white shadow-sm text-sm font-bold overflow-hidden">
            {user.avatarurl ? (
              <Image
                width={100}
                height={100}
                src={user.avatarurl}
                alt={displayName}
                className="w-full h-full object-cover"
              />
            ) : (
              getInitials(user.fullname, user.email)
            )}
          </div>
          <div className="absolute -bottom-1 -right-1 rounded-full p-0.5 border-2 border-white shadow-sm bg-emerald-500">
            <Check className="w-2.5 h-2.5 text-white" />
          </div>
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-bold text-slate-900 truncate">
              {displayName}
            </p>
            {member.role === "admin" && (
              <Crown
                className="w-3 h-3 text-yellow-500 shrink-0"
                fill="currentColor"
              />
            )}
            {isGroupOwner && (
              <span className="text-[7px] bg-amber-500 text-white px-1 py-0.5 rounded font-black tracking-tighter shrink-0">
                Owner
              </span>
            )}
            {isCurrentUser && (
              <span className="text-[7px] bg-slate-900 text-white px-1 py-0.5 rounded font-black tracking-tighter shrink-0">
                YOU
              </span>
            )}
          </div>
          <p className="text-[10px] font-bold text-slate-400 tracking-tight truncate max-w-[140px]">
            {user.email}
          </p>
        </div>
      </div>
      {canRemove && (
        <button
          type="button"
          onClick={() => onRemove(member.id)}
          disabled={isRemoving}
          aria-label="Remove member"
          className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50"
        >
          <Trash className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

function PendingInviteRow({
  member,
  canRemove,
  onRemove,
  isRemoving,
}: {
  member: GroupDetailMember;
  canRemove: boolean;
  onRemove: (invitationId: string) => void;
  isRemoving: boolean;
}) {
  const email = member.email ?? "—";
  return (
    <div className="flex items-center justify-between group p-2 -mx-2 hover:bg-slate-50 rounded-2xl transition-all">
      <div className="flex items-center gap-3">
        <div className="relative shrink-0 w-11 h-11 rounded-xl bg-slate-100 border-2 border-dashed border-slate-200 flex items-center justify-center">
          <Mail className="w-5 h-5 text-slate-400" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-600 truncate">{email}</p>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
            Invitation sent
          </p>
        </div>
      </div>
      {canRemove && (
        <button
          type="button"
          onClick={() => onRemove(member.id)}
          disabled={isRemoving}
          aria-label="Cancel invitation"
          className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50"
        >
          <Trash className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

export function MembersCard({
  members,
  createdBy,
  groupId,
  isArchived = false,
}: MembersCardProps) {
  const { sessionUser } = useAuthStore();
  const currentUserId = sessionUser?.id;
  const fetchGroupDetails = useGroupDetailsStore((s) => s.fetchGroupDetails);

  const [isAddMode, setIsAddMode] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState<MemberInvite[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [membersError, setMembersError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"members" | "chat">("members");
  const [chatUnreadCount, setChatUnreadCount] = useState(0);
  const activeTabRef = useRef(activeTab);

  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

  useEffect(() => {
    function handleVisibilityChange() {
      if (
        typeof document !== "undefined" &&
        document.visibilityState === "visible" &&
        activeTabRef.current === "chat"
      ) {
        setChatUnreadCount(0);
      }
    }
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  useEffect(() => {
    if (!groupId || isArchived) return;

    const channel = subscribeToGroupMessages(groupId, (message) => {
      const isOwn =
        currentUserId !== undefined && message.senderId === currentUserId;
      if (isOwn) return;

      const tab = activeTabRef.current;
      const pageHidden =
        typeof document !== "undefined" &&
        document.visibilityState === "hidden";

      if (tab !== "chat" || pageHidden) {
        setChatUnreadCount((count) => count + 1);
      }
    });

    return () => {
      unsubscribeFromGroupMessages(channel);
    };
  }, [groupId, isArchived, currentUserId]);

  function openGroupChatTab() {
    setIsAddMode(false);
    setActiveTab("chat");
    setChatUnreadCount(0);
  }

  const isOwner =
    createdBy != null &&
    currentUserId !== undefined &&
    createdBy === currentUserId;

  const canShowAddMode = Boolean(groupId && isOwner && !isArchived);

  function getAddDisabledReason(result: MemberInvite): string | null {
    const emailLower = result.email.toLowerCase();
    const userId = result.isExistingUser ? result.id : null;

    const alreadyMember = members.some(
      (m) =>
        m.type === "member" &&
        (m.user?.id === userId || m.user?.email?.toLowerCase() === emailLower),
    );
    if (alreadyMember) return "Already a member";

    const alreadyInvited = members.some(
      (m) =>
        m.type === "pending_invite" && m.email?.toLowerCase() === emailLower,
    );
    if (alreadyInvited) return "Invitation already sent";

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
    if (isArchived || selectedMembers.length === 0 || !groupId) return;

    setIsSubmitting(true);
    setAddError(null);

    const { error } = await addMembersToGroup(groupId, selectedMembers);

    if (error) {
      setAddError(error.message ?? "Failed to add members");
    } else {
      setSelectedMembers([]);
      setIsAddMode(false);
      await fetchGroupDetails(groupId, { force: true });
    }
    setIsSubmitting(false);
  }

  async function handleRemoveMember(memberId: string) {
    if (isArchived || !groupId) return;
    setRemovingId(memberId);
    setMembersError(null);

    const { error } = await removeGroupMember(memberId);

    if (error) {
      setMembersError(error.message ?? "Failed to remove member");
    } else {
      await fetchGroupDetails(groupId, { force: true });
    }
    setRemovingId(null);
  }

  async function handleCancelInvitation(invitationId: string) {
    if (isArchived || !groupId) return;
    setRemovingId(invitationId);
    setMembersError(null);

    const { error } = await cancelGroupInvitation(invitationId);

    if (error) {
      setMembersError(error.message ?? "Failed to cancel invitation");
    } else {
      await fetchGroupDetails(groupId, { force: true });
    }
    setRemovingId(null);
  }

  const memberList = members.filter(
    (m): m is GroupDetailMember => m.type === "member",
  );
  const sortedMemberList = [...memberList].sort((a, b) => {
    const aIsCurrentUser =
      currentUserId !== undefined && a.user?.id === currentUserId;
    const bIsCurrentUser =
      currentUserId !== undefined && b.user?.id === currentUserId;
    if (aIsCurrentUser && !bIsCurrentUser) return -1;
    if (!aIsCurrentUser && bIsCurrentUser) return 1;
    const aName = (a.user?.fullname ?? a.user?.email ?? "").toLowerCase();
    const bName = (b.user?.fullname ?? b.user?.email ?? "").toLowerCase();
    return aName.localeCompare(bName);
  });
  const pendingList = members.filter((m) => m.type === "pending_invite");
  const hasAnyMembers = memberList.length > 0 || pendingList.length > 0;
  const memberNamesByUserId = memberList.reduce<Record<string, string>>(
    (nameMap, member) => {
      const userId = member.user?.id;
      if (!userId) return nameMap;
      const displayName =
        member.user?.fullname?.trim() ||
        member.user?.email?.trim() ||
        "Unknown member";
      nameMap[userId] = displayName;
      return nameMap;
    },
    {},
  );

  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col overflow  sticky top-10">
      <div className="flex border-b border-slate-100 bg-slate-50/50 shrink-0">
        <button
          type="button"
          onClick={() => setActiveTab("members")}
          className={`flex-1 py-5 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${
            activeTab === "members"
              ? "text-indigo-600 border-b-2 border-indigo-600"
              : "text-slate-400 hover:text-slate-600"
          }`}
        >
          <Users className="w-3.5 h-3.5 shrink-0" />
          Members
          {members.length > 0 && (
            <span
              className={`ml-1 px-1.5 py-0.5 rounded-full text-[8px] ${
                activeTab === "members"
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-200 text-slate-500"
              }`}
            >
              {members.length}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={openGroupChatTab}
          className={`relative flex-1 py-5 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${
            activeTab === "chat"
              ? "text-indigo-600 border-b-2 border-indigo-600"
              : "text-slate-400 hover:text-slate-600"
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5 shrink-0" />
          Group Chat
          {chatUnreadCount > 0 && activeTab !== "chat" && (
            <span className="min-h-5 min-w-5 px-1 flex items-center justify-center rounded-full bg-indigo-600 text-[9px] font-black text-white tabular-nums leading-none">
              {chatUnreadCount > 99 ? "99+" : chatUnreadCount}
            </span>
          )}
        </button>
      </div>

      {activeTab === "members" ? (
        <div className="flex-1 min-h-0 overflow p-6 space-y-3 custom-scrollbar">
          {isAddMode ? (
            <div className="space-y-4">
              <MemberSearch
                selectedMembers={selectedMembers}
                onAddMember={handleAddMember}
                onRemoveMember={handleRemoveSelectedMember}
                currentUserId={currentUserId}
                currentUserEmail={sessionUser?.email}
                getAddDisabledReason={getAddDisabledReason}
              />
              {addError && (
                <p className="text-xs text-red-600 font-medium">{addError}</p>
              )}
              <p className="text-[10px] text-slate-400 mt-2">
                Search by email to add existing users or invite by email
              </p>
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
                  disabled={selectedMembers.length === 0 || isSubmitting}
                  className="flex-1 py-3 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 disabled:opacity-50"
                >
                  {isSubmitting
                    ? "Adding..."
                    : `Add ${selectedMembers.length} ${
                        selectedMembers.length === 1 ? "member" : "members"
                      }`}
                </button>
              </div>
            </div>
          ) : (
            canShowAddMode && (
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
            <p className="text-xs text-red-600 font-medium">{membersError}</p>
          )}

          {!hasAnyMembers && !isAddMode ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Users className="w-12 h-12 mb-4 text-slate-300" />
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                No members yet
              </p>
            </div>
          ) : (
            !isAddMode && (
              <div className="space-y-3">
                {sortedMemberList.map((member) => (
                  <MemberRow
                    key={member.id}
                    member={member}
                    isCurrentUser={
                      currentUserId !== undefined &&
                      member.user?.id === currentUserId
                    }
                    isGroupOwner={
                      createdBy != null && member.user?.id === createdBy
                    }
                    canRemove={
                      !isArchived &&
                      isOwner &&
                      createdBy != null &&
                      member.user?.id !== createdBy
                    }
                    onRemove={handleRemoveMember}
                    isRemoving={removingId === member.id}
                  />
                ))}
                {pendingList.map((member) => (
                  <PendingInviteRow
                    key={member.id}
                    member={member}
                    canRemove={!isArchived && isOwner}
                    onRemove={handleCancelInvitation}
                    isRemoving={removingId === member.id}
                  />
                ))}
              </div>
            )
          )}
        </div>
      ) : (
        <GroupChat
          currentUserId={currentUserId}
          groupId={groupId}
          isArchived={isArchived}
          memberNamesByUserId={memberNamesByUserId}
        />
      )}
    </div>
  );
}

export default MembersCard;
