import { motion } from "framer-motion";
import { UtensilsCrossed, Twitter, Instagram, Facebook } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-slate-50 pt-24 pb-12 border-t border-slate-200">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-12 mb-20">
          <div className="col-span-2">
            <div className="flex items-center gap-2 mb-8">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500 text-white shadow-lg">
                <UtensilsCrossed className="h-5 w-5" />
              </div>
              <span className="text-2xl font-black text-slate-900">Ambag.</span>
            </div>
            <p className="text-slate-500 font-medium max-w-xs mb-8">
              The essential bill splitting utility for the social diner.
            </p>
            <div className="flex gap-4">
              {[Twitter, Instagram, Facebook].map((Icon, i) => (
                <motion.a
                  key={i}
                  whileHover={{ y: -3 }}
                  href="#"
                  className="h-10 w-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 bg-white"
                >
                  <Icon className="h-5 w-5" />
                </motion.a>
              ))}
            </div>
          </div>

          {["Features", "App", "Support", "Legal"].map((title) => (
            <div key={title}>
              <h5 className="font-black text-xs uppercase tracking-[0.2em] text-slate-900 mb-8">
                {title}
              </h5>
              <ul className="space-y-4 font-bold text-sm text-slate-500">
                <li className="hover:text-orange-500 cursor-pointer">
                  Equal Split
                </li>
                <li className="hover:text-orange-500 cursor-pointer">
                  Itemized
                </li>
              </ul>
            </div>
          ))}
        </div>
        <div className="pt-10 border-t border-slate-200 text-center">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
            © 2024 AMBAG SOCIAL UTILITY
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
