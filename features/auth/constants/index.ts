const showcaseVariants = {
  login: { x: "100%", borderRadius: "2.5rem 0 0 2.5rem" },
  signup: { x: "0%", borderRadius: "0 2.5rem 2.5rem 0" },
};

const formVariants = {
  login: { x: 0 },
  signup: { x: 0 },
};

const desktopFormVariants = {
  login: { x: "-100%" },
  signup: { x: "0%" },
};

const inputClassName =
  "w-full rounded-2xl text-black border border-slate-200 bg-white py-4 pl-14 pr-6 text-sm font-bold shadow-sm outline-none transition-all placeholder:text-slate-300 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/5 sm:rounded-3xl sm:py-5";

const passwordInputClassName =
  "w-full rounded-2xl text-black border border-slate-200 bg-white py-4 pl-14 pr-14 text-sm font-bold shadow-sm outline-none transition-all placeholder:text-slate-300 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/5 sm:rounded-3xl sm:py-5";

export {
  showcaseVariants,
  formVariants,
  desktopFormVariants,
  inputClassName,
  passwordInputClassName,
};
