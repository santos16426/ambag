"use client";

import { SearchX } from "lucide-react";

export default function GroupNotFound() {
  return (
    <div className="p-4 lg:p-10">
      <div className="flex flex-col items-center justify-center min-h-[200px] text-center">
        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-4">
          <SearchX className="w-6 h-6 text-slate-400" />
        </div>
        <p className="text-sm font-medium text-slate-600 mb-1">Group not found</p>
        <p className="text-sm text-slate-400 max-w-md">
          This group may have been removed or you don’t have access to it.
        </p>
      </div>
    </div>
  );
}
