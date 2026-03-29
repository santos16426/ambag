"use client";

import { useState } from "react";

import { motion } from "framer-motion";
import {
  ArrowUpRight,
  ArrowDownLeft,
  CreditCard,
  Search,
  UserPlus,
  Plus,
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

const Dashboard = () => {
  const { profile } = useAuthStore();
  const { groups, loading } = useDashboardGroups();
  const { summary, loading: summaryLoading } =
    useDashboardFinancialSummary(groups);
  const [search, setSearch] = useState("");
  const [isJoinGroupFormOpen, setIsJoinGroupFormOpen] = useState(false);
  const [isGroupFormOpen, setIsGroupFormOpen] = useState(false);
  const filteredGroups = groups.filter((group) =>
    group.name.toLowerCase().includes(search.toLowerCase()),
  );
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
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">
                Total Net Worth (Pools)
              </p>
              <h2 className="text-5xl font-black tracking-tighter">
                {summaryLoading ? "..." : formatCurrency(summary.totalnetworth)}
              </h2>
            </div>
            <div className="flex gap-8 mt-8">
              <div>
                <div className="flex items-center gap-2 text-emerald-400 mb-1">
                  <ArrowUpRight className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">
                    Collect
                  </span>
                </div>
                <p className="text-xl font-black">
                  {summaryLoading
                    ? "..."
                    : formatCurrency(summary.totaltocollect)}
                </p>
              </div>
              <div className="w-px h-10 bg-slate-800 self-center" />
              <div>
                <div className="flex items-center gap-2 text-rose-400 mb-1">
                  <ArrowDownLeft className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">
                    Pay
                  </span>
                </div>
                <p className="text-xl font-black">
                  {summaryLoading ? "..." : formatCurrency(summary.totaltopay)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[3rem] border border-slate-100 p-8 flex flex-col justify-between shadow-sm">
          <div>
            {/* <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-500 mb-4">
              <CreditCard className="w-6 h-6" />
            </div> */}
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

      <div className="flex items-center justify-between mb-8 ">
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">
          Groups
        </h2>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsJoinGroupFormOpen(true)}
            className="flex items-center gap-2 px-6 py-4 bg-white border border-slate-100 rounded-[1.5rem] shadow-sm text-slate-900 font-black text-xs hover:border-orange-200 transition-all"
          >
            <UserPlus className="w-4 h-4 text-orange-500" />
            Join Group
          </button>
          <div className="relative hidden sm:block">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
            <input
              onChange={(e) => setSearch(e.target.value)}
              type="text"
              placeholder="Search groups..."
              className="pl-10 pr-4 py-2 bg-slate-100 rounded-xl text-xs font-bold outline-none border-2 border-transparent focus:border-orange-500 w-48"
            />
          </div>
        </div>
      </div>

      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          [1, 2, 3].map((_, index) => <GroupCardLoading key={index} />)
        ) : filteredGroups.length === 0 ? (
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
        ) : (
          <>
            {filteredGroups.map((group) => (
              <GroupCard key={group.id} group={group} />
            ))}
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
