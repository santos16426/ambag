import { motion } from "framer-motion";
import { CheckCircle2, History, LayoutGrid, Receipt } from "lucide-react";
import { useRouter } from "next/navigation";

const Pricing = () => {
  const router = useRouter();
  return (
    <section id="pricing" className="py-32 bg-white relative">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-sm font-black text-orange-500 uppercase tracking-[0.2em] mb-4">
            Pricing Plans
          </h2>
          <p className="text-4xl md:text-6xl font-black text-slate-900 leading-tight">
            Split freely. <br className="hidden md:block" /> Upgrade for
            unlimited.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Free Plan */}
          <motion.div
            whileHover={{ y: -10 }}
            className="relative p-10 md:p-12 flex flex-col h-full border border-slate-100 rounded-[3rem] bg-slate-50/50 transition-all hover:bg-white hover:shadow-2xl"
          >
            <div className="mb-8">
              <h3 className="text-2xl font-black text-slate-900 mb-2">Free</h3>
              <p className="text-slate-500 font-medium">
                For casual diners and small groups.
              </p>
            </div>
            <div className="flex items-baseline gap-1 mb-8">
              <span className="text-5xl font-black text-slate-900">₱0</span>
              <span className="text-slate-400 font-bold uppercase text-xs tracking-widest">
                / Per Month
              </span>
            </div>
            <ul className="space-y-4 mb-12 grow">
              {[
                { text: "Up to 5 active groups", icon: CheckCircle2 },
                { text: "Equal splitting mode", icon: CheckCircle2 },
                { text: "Basic expense summary", icon: CheckCircle2 },
                { text: "Standard support", icon: CheckCircle2 },
              ].map((feature, i) => (
                <li key={i} className="flex items-start gap-3">
                  <feature.icon className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />
                  <span className="font-bold text-slate-600">
                    {feature.text}
                  </span>
                </li>
              ))}
            </ul>
            <motion.button
              onClick={() => router.push("/login?mode=signup&plan=free")}
              className="w-full py-5 rounded-2xl bg-white border-2 border-slate-200 text-slate-900 font-black hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all"
            >
              Start Splitting Free
            </motion.button>
          </motion.div>

          {/* Premium Plan */}
          <motion.div
            whileHover={{ y: -10 }}
            className="relative p-10 md:p-12 flex flex-col h-full rounded-[3rem] bg-slate-900 shadow-2xl overflow-hidden"
          >
            <div className="relative z-10">
              <div className="mb-8">
                <h3 className="text-2xl font-black text-white mb-2">
                  Lifetime Premium
                </h3>
                <p className="text-slate-400 font-medium">
                  One-time payment for the ultimate host.
                </p>
              </div>
              <div className="flex items-baseline gap-1 mb-8">
                <span className="text-5xl font-black text-white">₱500</span>
                <span className="text-orange-500 font-bold uppercase text-xs tracking-widest">
                  / One-time fee
                </span>
              </div>
              <ul className="space-y-4 mb-12 grow">
                {[
                  { text: "Unlimited Groups Forever", icon: LayoutGrid },
                  { text: "Unlimited Expenses & Tracking", icon: Receipt },
                  { text: "Unlimited Payment History", icon: History },
                  { text: "All Premium Split Modes", icon: CheckCircle2 },
                  { text: "CSV/PDF Export for Bills", icon: CheckCircle2 },
                  { text: "Priority feature requests", icon: CheckCircle2 },
                ].map((feature, i) => {
                  const Icon = feature.icon;
                  return (
                    <li
                      key={i}
                      className="flex items-start gap-3 text-slate-200"
                    >
                      <Icon className="h-5 w-5 text-orange-500 shrink-0 mt-0.5" />
                      <span className="font-bold">{feature.text}</span>
                    </li>
                  );
                })}
              </ul>
              <motion.button
                onClick={() => router.push("/login?mode=signup&plan=lifetime")}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-5 rounded-2xl bg-orange-500 text-white font-black shadow-lg shadow-orange-900/20"
              >
                Get Lifetime Access
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Pricing;
