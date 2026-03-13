"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";

import GroupDetailsCard from "@/features/groups/components/GroupDetailsCard";
import { MembersCard } from "@/features/groups/components/MembersCard";
import { useDashboardGroupsStore } from "@/features/dashboard/store/groups.store";

function GroupDetailPage() {
  const params = useParams();
  const id = (params?.id as string) ?? null;

  const groups = useDashboardGroupsStore((s) => s.groups);

  const group = useMemo(
    () => (id ? groups.find((g) => g.id === id) : undefined),
    [groups, id],
  );

  return (
    <div className="p-4 lg:p-10">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 space-y-8">
          {group ? <GroupDetailsCard group={group} /> : null}
        </div>
        <div className="lg:col-span-4 sticky top-8">
          {id && group ? (
            <MembersCard groupId={id} createdBy={group.created_by} />
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default GroupDetailPage;
