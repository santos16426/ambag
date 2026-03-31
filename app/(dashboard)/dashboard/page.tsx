"use client";

import { useMemo, useState } from "react";

import { motion } from "framer-motion";
import {
  ArrowUpRight,
  ArrowDownLeft,
  Search,
  UserPlus,
  Plus,
  Archive,
} from "lucide-react";
import Link from "next/link";

import { useAuthStore } from "@/features/auth/store/auth.store";
import {
  useDashboardFinancialSummary,
  useDashboardGroups,
} from "@/features/dashboard";
import GroupCard from "@/features/dashboard/components/GroupCard";
import GroupCardLoading from "@/features/dashboard/components/GroupCardLoading";
import GroupForm from "@/features/dashboard/components/GroupForm";
import JoinGroupForm from "@/features/dashboard/components/JoinGroupForm";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

type GroupArchiveFilter = "all" | "active" | "archived";

const GROUP_ARCHIVE_FILTERS: {
  value: GroupArchiveFilter;
  label: string;
}[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "archived", label: "Archived" },
];

function isGroupArchived(archivedat: string | null | undefined): boolean {
  return archivedat != null;
}

const Dashboard = () => {
  const { profile } = useAuthStore();
  const { groups, loading } = useDashboardGroups();
  const { summary, loading: summaryLoading } =
    useDashboardFinancialSummary(groups);
  const [search, setSearch] = useState("");
  const [archiveFilter, setArchiveFilter] = useState<GroupArchiveFilter>("all");
  const [isJoinGroupFormOpen, setIsJoinGroupFormOpen] = useState(false);
  const [isGroupFormOpen, setIsGroupFormOpen] = useState(false);

  const { activeGroupCount, archivedGroupCount } = useMemo(() => {
    let active = 0;
    let archived = 0;
    for (const group of groups) {
      if (isGroupArchived(group.archivedat)) archived += 1;
      else active += 1;
    }
    return { activeGroupCount: active, archivedGroupCount: archived };
  }, [groups]);

  const showArchiveFilter = activeGroupCount > 0 && archivedGroupCount > 0;

  const filteredGroups = useMemo(() => {
    const q = search.toLowerCase().trim();
    return groups.filter((group) => {
      if (q && !group.name.toLowerCase().includes(q)) return false;
      if (!showArchiveFilter) return true;
      const archived = isGroupArchived(group.archivedat);
      if (archiveFilter === "all") return true;
      if (archiveFilter === "active") return !archived;
      return archived;
    });
  }, [groups, search, archiveFilter, showArchiveFilter]);

  const hasNoGroups = !loading && groups.length === 0;
  const hasNoMatches =
    !loading && groups.length > 0 && filteredGroups.length === 0;
  const visibleGroupSummaries = summary.groupsummary.filter(
    (group) => group.topay > 0 || group.tocollect > 0,
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 lg:p-10 max-w-7xl mx-auto flex-1 pb-32"
    >
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter mb-2">
            Welcome back,{" "}
            <span className="text-orange-500">
              {profile?.fullname?.split(" ")?.[0] ?? "there"}
            </span>
          </h1>
          <p className="text-slate-400 font-medium">
            Track your expenses and stay on top of your balances.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="md:col-span-2 bg-slate-900 rounded-[3rem] p-8 text-white relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-linear-to-l from-orange-500/20 to-transparent" />
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div>
              <p className="text-[12px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">
                Total Net Worth
              </p>
              <h2 className="text-6xl lg:text-8xl font-black tracking-tighter">
                {summaryLoading ? "..." : formatCurrency(summary.totalnetworth)}
              </h2>
            </div>
            <div className="flex gap-8 mt-8">
              <div>
                <div className="flex items-center gap-2 text-emerald-400 mb-1">
                  <ArrowUpRight className="w-4 h-4" />
                  <span className="text-[12px] font-black uppercase tracking-widest">
                    Collect
                  </span>
                </div>
                <p className="text-[18px] lg:text-[25px] font-black">
                  {summaryLoading
                    ? "..."
                    : formatCurrency(summary.totaltocollect)}
                </p>
              </div>
              <div className="w-px h-10 bg-slate-800 self-center" />
              <div>
                <div className="flex items-center gap-2 text-rose-400 mb-1">
                  <ArrowDownLeft className="w-4 h-4" />
                  <span className="text-[12px] font-black uppercase tracking-widest">
                    Pay
                  </span>
                </div>
                <p className="text-[18px] lg:text-[25px] font-black">
                  {summaryLoading ? "..." : formatCurrency(summary.totaltopay)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[3rem] border border-slate-100 p-4 lg:p-8 flex flex-col justify-between shadow-sm">
          <div>
            <h3 className="font-black text-slate-900">Quick Pay</h3>
            <p className="text-xs text-slate-400 font-medium">
              Instantly settle with your most active group.
            </p>
          </div>
          <div className="mt-4 space-y-2 max-h-52 overflow-auto pr-1">
            {summaryLoading ? (
              <p className="text-xs text-slate-400 font-medium py-2">
                Loading balances...
              </p>
            ) : visibleGroupSummaries.length === 0 ? (
              <p className="text-xs text-slate-400 font-medium py-2">
                No payable balances yet.
              </p>
            ) : (
              visibleGroupSummaries.map((group) => (
                <Link
                  key={group.id}
                  href={`/dashboard/${group.id}`}
                  className="block rounded-2xl border border-slate-100 hover:border-orange-200 px-3 py-2 transition-all"
                >
                  <p className="text-xs font-bold text-slate-800 truncate">
                    {group.groupname}
                  </p>
                  <div className="mt-1 space-y-0.5">
                    {group.topay > 0 && (
                      <p className="text-[11px] font-black text-rose-500">
                        Pay: {formatCurrency(group.topay)}
                      </p>
                    )}
                    {group.tocollect > 0 && (
                      <p className="text-[11px] font-black text-emerald-600">
                        Collect: {formatCurrency(group.tocollect)}
                      </p>
                    )}
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">
          Groups
        </h2>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          {showArchiveFilter ? (
            <div
              className="inline-flex rounded-xl border border-slate-100 bg-slate-50 p-1 shadow-sm"
              role="group"
              aria-label="Show groups by status"
            >
              {GROUP_ARCHIVE_FILTERS.map(({ value, label }) => {
                const isSelected = archiveFilter === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setArchiveFilter(value)}
                    className={`flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-[11px] font-black uppercase tracking-wider transition-all sm:px-4 ${
                      isSelected
                        ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/80"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    {value === "archived" && (
                      <Archive className="h-3.5 w-3.5 opacity-70" />
                    )}
                    {label}
                  </button>
                );
              })}
            </div>
          ) : null}
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            <button
              onClick={() => setIsJoinGroupFormOpen(true)}
              className="flex items-center gap-2 px-6 py-4 bg-white border border-slate-100 rounded-[1.5rem] shadow-sm text-slate-900 font-black text-xs hover:border-orange-200 transition-all"
            >
              <UserPlus className="w-4 h-4 text-orange-500" />
              Join Group
            </button>
            <div className="relative flex-1 min-w-48 sm:flex-none sm:block">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 pointer-events-none" />
              <input
                onChange={(e) => setSearch(e.target.value)}
                type="text"
                placeholder="Search groups..."
                value={search}
                className="w-full pl-10 pr-4 py-2 bg-slate-100 rounded-xl text-xs font-bold outline-none border-2 border-transparent focus:border-orange-500 sm:w-48"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          [1, 2, 3].map((_, index) => <GroupCardLoading key={index} />)
        ) : hasNoGroups ? (
          <div
            onClick={() => setIsGroupFormOpen(true)}
            className="cursor-pointer sm:col-span-2 lg:col-span-3 border-2 border-dashed border-slate-100 rounded-[2.5rem] flex flex-col items-center justify-center p-8 text-slate-300 hover:border-orange-200 hover:text-orange-300 transition-all"
          >
            <div className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <UserPlus className="w-6 h-6" />
            </div>
            <p className="font-black text-xs uppercase tracking-widest text-slate-400">
              No groups yet
            </p>
            <p className="text-xs text-slate-400 mt-2">
              Create your first group to start tracking shared expenses.
            </p>
          </div>
        ) : hasNoMatches ? (
          <div className="sm:col-span-2 lg:col-span-3 rounded-[2.5rem] border border-slate-100 bg-slate-50/80 px-8 py-12 text-center">
            <p className="font-black text-sm text-slate-800">
              No groups match this view
            </p>
            <p className="mt-2 text-xs font-medium text-slate-500">
              {!showArchiveFilter
                ? "Try a different search term."
                : archiveFilter === "active"
                  ? "Try “All” or “Archived”, or adjust your search."
                  : archiveFilter === "archived"
                    ? "You have no archived groups, or your search did not match."
                    : "Try a different search term."}
            </p>
          </div>
        ) : (
          <>
            <div
              onClick={() => setIsGroupFormOpen(true)}
              className="border-2 border-dashed border-slate-100 rounded-[2.5rem] flex flex-col items-center justify-center p-8 text-slate-300 hover:border-orange-200 hover:text-orange-300 transition-all group cursor-pointer"
            >
              <div className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center mb-4 group-hover:bg-orange-50">
                <Plus className="w-6 h-6" />
              </div>
              <p className="font-black text-xs uppercase tracking-widest">
                Create New Group
              </p>
            </div>
            {filteredGroups.map((group) => (
              <GroupCard key={group.id} group={group} />
            ))}
          </>
        )}
      </div>
      <JoinGroupForm
        isOpen={isJoinGroupFormOpen}
        setIsOpen={setIsJoinGroupFormOpen}
      />
      <GroupForm isOpen={isGroupFormOpen} setIsOpen={setIsGroupFormOpen} />
    </motion.div>
  );
};

export default Dashboard;
