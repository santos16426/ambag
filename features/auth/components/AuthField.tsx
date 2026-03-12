import type { ReactNode } from "react";

interface AuthFieldProps {
  icon: ReactNode;
  error?: string;
  children: ReactNode;
}

const inputWrapperClassName = "relative";

const iconWrapperClassName =
  "pointer-events-none absolute inset-y-0 left-0 flex w-12 items-center justify-center text-slate-300 transition-colors group-focus-within:text-orange-500";

const errorClassName = "mt-1.5 min-h-[1.25rem] pl-1 text-xs font-medium text-red-500";

export function AuthField({ icon, error, children }: AuthFieldProps) {
  return (
    <div className="group">
      <div className={inputWrapperClassName}>
        <div className={iconWrapperClassName} aria-hidden>
          {icon}
        </div>
        {children}
      </div>
      {error ? (
        <p className={errorClassName} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
