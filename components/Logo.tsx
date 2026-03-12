import React from "react";
import { UtensilsCrossed } from "lucide-react";
import Link from "next/link";
const Logo = ({
  scrollToSection,
  url,
}: {
  scrollToSection?: (
    e: React.MouseEvent<HTMLAnchorElement>,
    id: string,
  ) => void;
  url?: string;
}) => {
  const content = (
    <>
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-500 text-white shadow-orange-200 shadow-lg group-hover:rotate-12 transition-transform">
        <UtensilsCrossed className="h-5 w-5" />
      </div>
      <span className="text-xl font-black tracking-tighter">
        Ambag<span className="text-orange-500">.</span>
      </span>
    </>
  );

  if (url) {
    return (
      <Link href={url} className="flex items-center gap-2 group">
        {content}
      </Link>
    );
  }
  return (
    <a
      href="#home"
      onClick={(e) => scrollToSection?.(e, "home")}
      className="flex items-center gap-2 group"
    >
      {content}
    </a>
  );
};

export default Logo;
