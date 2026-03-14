import { Users } from "lucide-react";

const GroupDetailsCardSkeleton = () => {
  return (
    <div className="bg-white rounded-[2.5rem] overflow-hidden border border-slate-200 shadow-sm">
      <div className="relative w-full aspect-21/9 bg-slate-200 overflow-hidden animate-pulse">
        <div className="absolute inset-0 bg-slate-300/50" />
        <div className="absolute inset-0 bg-linear-to-t from-slate-900/60 via-slate-900/20 to-transparent z-10" />
        <div className="relative z-20 h-full p-8 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div className="w-12 h-8 bg-slate-400 rounded-md shrink-0" />
          </div>
          <div className="flex flex-col gap-2 max-w-md">
            <div className="h-8 w-3/4 bg-white/30 rounded" />
            <div className="h-4 w-full bg-white/20 rounded" />
            <div className="h-4 w-1/2 bg-white/20 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
};

const MembersCardSkeleton = () => {
  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col h-[500px] overflow-hidden">
      <div className="flex border-b border-slate-100 bg-slate-50/50 shrink-0">
        <div className="flex-1 py-5 flex items-center justify-center gap-2 text-slate-400">
          <Users className="w-3.5 h-3.5 shrink-0 animate-pulse" />
          <div className="h-3 w-16 rounded bg-slate-200 animate-pulse" />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-3 p-2 rounded-2xl">
            <div className="w-11 h-11 rounded-xl bg-slate-200 animate-pulse shrink-0" />
            <div className="space-y-1 flex-1 min-w-0">
              <div className="h-3 w-24 rounded bg-slate-200 animate-pulse" />
              <div className="h-2.5 w-16 rounded bg-slate-100 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const PremiumMeshBackground = () => {
  return (
    <div className="absolute inset-0 overflow-hidden bg-[#0a0a0c]">
      <div
        className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] rounded-full opacity-40 mix-blend-screen animate-pulse"
        style={{
          background:
            "radial-gradient(circle, rgba(99,102,241,0.8) 0%, transparent 70%)",
          filter: "blur(80px)",
          animationDuration: "8s",
        }}
      />
      <div
        className="absolute top-[10%] -right-[20%] w-[60%] h-[60%] rounded-full opacity-30 mix-blend-overlay"
        style={{
          background:
            "radial-gradient(circle, rgba(168,85,247,0.7) 0%, transparent 70%)",
          filter: "blur(100px)",
          animation: "bounce 15s infinite alternate",
        }}
      />
      <div
        className="absolute -bottom-[30%] left-[20%] w-[50%] h-[50%] rounded-full opacity-20"
        style={{
          background:
            "radial-gradient(circle, rgba(59,130,246,0.6) 0%, transparent 70%)",
          filter: "blur(90px)",
          animation: "pulse 12s infinite",
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.15]"
        style={{
          backgroundImage: `linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }}
      />
      <div className="absolute inset-0 opacity-20 mix-blend-soft-light pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-linear-to-t from-[#0a0a0c] to-transparent z-5" />
    </div>
  );
};

export { GroupDetailsCardSkeleton, MembersCardSkeleton, PremiumMeshBackground };
