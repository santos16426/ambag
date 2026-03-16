import { User } from "lucide-react";
import { GroupDetailMember } from "@/features/groups/types";
import getInitials from "@/lib/get-initials";

export const MemberStack = ({
  members,
  size = "default",
  max = 3,
  noAvatarFallback = "initials",
}: {
  members: GroupDetailMember[];
  size?: "small" | "default";
  max?: number;
  noAvatarFallback?: "initials" | "icon";
}) => {
  const isSmall = size === "small";

  const displayMembers = members.slice(0, max);
  const additionalMembers = members.slice(max);
  const additionalCount = additionalMembers.length;

  const avatarSize = isSmall ? "w-5 h-5" : "w-10 h-10";
  const stackOverlap = isSmall ? "-space-x-[7px]" : "-space-x-3";

  return (
    <div className={`flex ${stackOverlap} items-center`}>
      {displayMembers.map((member: GroupDetailMember) => (
        <div key={member.id} className="relative group/avatar">
          <div
            className={`relative ${avatarSize} rounded-full border border-slate-950 bg-slate-800 flex items-center justify-center overflow-hidden transition-all hover:z-30  ${
              member.type === "pending_invite"
                ? "opacity-50 ring-1 ring-amber-500/40"
                : ""
            }`}
          >
            {member.user?.avatarurl ? (
              <img
                src={member.user.avatarurl}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : noAvatarFallback === "icon" ? (
              <User
                className={
                  isSmall
                    ? "w-2.5 h-2.5 text-white/80"
                    : "w-5 h-5 text-white/80"
                }
              />
            ) : (
              <div
                className={`w-full h-full flex items-center justify-center bg-linear-to-br from-slate-700 to-slate-900 ${isSmall ? "text-[10px]" : "text-xs"} font-bold text-white`}
              >
                {getInitials(member.user?.fullname ?? null, member.email ?? "")}
              </div>
            )}
          </div>

          {/* Tooltip on Hover - Individual Avatars */}
          <div className="opacity-0 group-hover/avatar:opacity-100 transition-all duration-200 pointer-events-none absolute bottom-full mb-3 left-1/2 -translate-x-1/2 z-50">
            <div className="relative">
              <div className="bg-slate-900 border border-white/20 px-2 py-1.5 rounded text-[10px] font-bold text-white whitespace-nowrap shadow-2xl">
                {member.user?.fullname || member.email}
              </div>
              {/* Arrow centered to the avatar */}
              <div className="absolute top-[95%] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-slate-900 z-51" />
              <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[7px] border-l-transparent border-r-[7px] border-r-transparent border-t-[7px] border-t-white/10" />
            </div>
          </div>
        </div>
      ))}

      {additionalCount > 0 && (
        <div className="relative group/more">
          <div
            className={`${avatarSize} rounded-full border-2 border-slate-950 bg-slate-900 flex flex-col items-center justify-center text-white shrink-0 z-10 shadow-xl transition-all hover:z-30`}
          >
            <span
              className={`${isSmall ? "text-[8px]" : "text-[10px]"} font-black leading-none`}
            >
              +{additionalCount}
            </span>
            {!isSmall && (
              <span className="text-[6px] font-bold text-white/40 uppercase tracking-tighter">
                More
              </span>
            )}
          </div>

          {/* Tooltip for additional members - Aligned to the counter */}
          <div className="opacity-0 group-hover/more:opacity-100 transition-all duration-200 pointer-events-none absolute bottom-full mb-3 right-0 z-50">
            <div className="relative">
              <div className="bg-slate-900 border border-white/20 p-2.5 rounded-xl text-[10px] font-bold text-white shadow-2xl min-w-[140px]">
                <p className="text-white/40 uppercase text-[8px] mb-2 tracking-widest border-b border-white/5 pb-1">
                  Others
                </p>
                <ul className="space-y-1.5">
                  {additionalMembers.map((m) => (
                    <li key={m.id} className="truncate flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full bg-white/20" />
                      {m.user?.fullname || m.email}
                    </li>
                  ))}
                </ul>
              </div>
              {/* Arrow positioned beneath the counter chip */}
              <div className="absolute top-[95%] right-3 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-slate-900 z-51" />
              <div className="absolute top-full right-[11px] w-0 h-0 border-l-[7px] border-l-transparent border-r-[7px] border-r-transparent border-t-[7px] border-t-white/10" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
