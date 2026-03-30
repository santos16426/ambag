import { LifeBuoy, ShieldCheck, UtensilsCrossed } from "lucide-react";

const Footer = () => {
  const footerNavigation = {
    features: [
      { name: "Equal Split", href: "/#features" },
      { name: "Itemized OCR", href: "/#features" },
      { name: "Smart Tax/Tip", href: "/#features" },
      { name: "Shared Groups", href: "/#features" },
    ],
    support: [
      { name: "Help Center", href: "#" },
      { name: "Safety Guide", href: "#" },
      { name: "Contact", href: "#" },
      { name: "Status", href: "#" },
    ],
    legal: [
      { name: "Privacy", href: "#" },
      { name: "Terms", href: "#" },
      { name: "Cookie Policy", href: "#" },
    ],
  };
  return (
    <footer className="bg-slate-50 pt-24 pb-12 border-t border-slate-200">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-12 mb-20">
          <div className="col-span-2">
            <div className="flex items-center gap-2 mb-8">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500 text-white shadow-lg">
                <UtensilsCrossed className="h-5 w-5" />
              </div>
              <span className="text-2xl font-black text-slate-900">Ambag.</span>
            </div>
            <p className="text-slate-500 font-medium max-w-xs mb-8">
              The essential bill splitting utility for the social diner. Spend
              less time computing and more time laughing.
            </p>
          </div>

          <div>
            <h5 className="font-black text-[10px] uppercase tracking-[0.2em] text-slate-900 mb-8">
              Features
            </h5>
            <ul className="space-y-4">
              {footerNavigation.features.map((item) => (
                <li key={item.name}>
                  <a
                    href={item.href}
                    className="text-sm font-bold text-slate-600 hover:text-orange-500 transition-colors"
                  >
                    {item.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h5 className="font-black text-[10px] uppercase tracking-[0.2em] text-slate-900 mb-8">
              Support
            </h5>
            <ul className="space-y-4">
              {footerNavigation.support.map((item) => (
                <li key={item.name}>
                  <a
                    href={item.href}
                    className="text-sm font-bold text-slate-600 hover:text-orange-500 transition-colors"
                  >
                    {item.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h5 className="font-black text-[10px] uppercase tracking-[0.2em] text-slate-900 mb-8">
              Legal
            </h5>
            <ul className="space-y-4">
              {footerNavigation.legal.map((item) => (
                <li key={item.name}>
                  <a
                    href={item.href}
                    className="text-sm font-bold text-slate-600 hover:text-orange-500 transition-colors"
                  >
                    {item.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="pt-10 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-6 w-full justify-between md:justify-start">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              © 2026 AMBAG
            </p>
            <div className="hidden sm:flex gap-6">
              <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <ShieldCheck className="h-3 w-3" /> Secure Payments
              </span>
              <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <LifeBuoy className="h-3 w-3" /> 24/7 Support
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
