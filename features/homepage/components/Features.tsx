import { motion } from "framer-motion";
import { Users, Receipt, Heart } from "lucide-react";
import { staggerContainer, fadeInUp } from "../constants";

const Features = () => {
  return (
    <section id="features" className="py-24 bg-white">
      <div className="mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-sm font-black text-orange-500 uppercase tracking-[0.2em] mb-4">
            Core Utility
          </h2>
          <p className="text-4xl font-bold">
            Smart splitting for every dinner.
          </p>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          className="grid md:grid-cols-3 gap-8"
        >
          {[
            {
              title: "Equal Split",
              desc: "Divide any total instantly across your entire group.",
              icon: Users,
              color: "orange",
            },
            {
              title: "Itemized Mode",
              desc: "Assign specific dishes to specific friends with zero friction.",
              icon: Receipt,
              color: "blue",
            },
            {
              title: "Couple Logic",
              desc: "Treat couples as one unit or split their share independently.",
              icon: Heart,
              color: "pink",
            },
          ].map((feature, idx) => (
            <motion.div
              key={idx}
              variants={fadeInUp}
              whileHover={{ y: -10 }}
              className="p-8 rounded-[2.5rem] bg-slate-50 hover:bg-white border border-transparent hover:border-slate-100 hover:shadow-xl transition-all group"
            >
              <div
                className={`h-14 w-14 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-6 group-hover:bg-slate-900 group-hover:text-white transition-all`}
              >
                <feature.icon className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
              <p className="text-gray-500 leading-relaxed font-medium">
                {feature.desc}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default Features;
