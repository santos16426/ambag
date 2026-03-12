import { motion } from "framer-motion";
import { staggerContainer, fadeInUp } from "../constants";
import { LayoutGrid, ArrowRight, CheckCircle2 } from "lucide-react";

const Hero = () => {
  return (
    <section
      id="home"
      className="relative pt-32 pb-24 lg:pt-56 lg:pb-40 overflow-hidden"
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-orange-100 rounded-full blur-[120px]"
      />

      <div className="mx-auto max-w-7xl px-6 lg:px-8 relative">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="lg:col-span-7 text-center lg:text-left"
          >
            <motion.div
              variants={fadeInUp}
              className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-orange-600 mb-8 border border-orange-50 shadow-sm"
            >
              <LayoutGrid className="h-4 w-4" />
              Unlimited Groups. Unlimited Splits.
            </motion.div>
            <motion.h1
              variants={fadeInUp}
              className="text-6xl font-black tracking-tight text-slate-900 sm:text-8xl leading-[0.95] mb-8"
            >
              Dine now.
              <br />
              <span className="text-transparent bg-clip-text bg-linear-to-r from-orange-500 to-pink-500 italic">
                Settle easy.
              </span>
            </motion.h1>
            <motion.p
              variants={fadeInUp}
              className="mx-auto lg:mx-0 mt-8 max-w-xl text-lg leading-relaxed text-slate-500 sm:text-xl font-medium"
            >
              The most powerful bill-splitting utility for your barkada. Equal
              splits, itemized orders, and couple modes—all in one tap.
            </motion.p>

            <motion.div
              variants={fadeInUp}
              className="mt-12 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4"
            >
              <motion.a
                href="/login?mode=signup"
                whileHover={{ scale: 1.05, x: 5 }}
                whileTap={{ scale: 0.95 }}
                className="w-full sm:w-auto flex items-center justify-center gap-3 rounded-2xl bg-orange-500 px-10 py-5 text-lg font-black text-white shadow-2xl shadow-orange-100"
              >
                Start Splitting Free
                <ArrowRight className="h-5 w-5" />
              </motion.a>
              <div className="flex items-center gap-3 px-6">
                <div className="flex -space-x-3">
                  {[1, 2, 3].map((i) => (
                    <motion.img
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="h-12 w-12 rounded-full border-4 border-white object-cover"
                      src={`https://i.pravatar.cc/150?u=${i + 20}`}
                    />
                  ))}
                </div>
                <div className="text-left">
                  <p className="text-xs font-black text-slate-900 uppercase tracking-widest">
                    12k+ Users
                  </p>
                  <p className="text-xs font-bold text-slate-400">
                    Splitting daily
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="lg:col-span-5 relative"
          >
            <div className="relative z-10">
              <motion.img
                animate={{
                  rotate: [3, -1, 3],
                  y: [0, -10, 0],
                }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                src="https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&q=80&w=800"
                className="rounded-[48px] shadow-2xl border-8 border-white w-full h-[550px] object-cover"
                alt="Social dining"
              />
              <motion.div
                initial={{ x: -50, opacity: 0 }}
                whileInView={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="absolute -bottom-10 -left-10 bg-white p-6 rounded-[32px] shadow-2xl border border-slate-50 max-w-[240px]"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <p className="text-sm font-black text-slate-900">
                    Fair Split Done
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: "100%" }}
                      transition={{ duration: 1.5, delay: 1 }}
                      className="h-full bg-orange-500"
                    />
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">
                    No math errors
                  </p>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
