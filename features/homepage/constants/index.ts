const navLinks = [
  { name: "Home", id: "home" },
  { name: "Features", id: "features" },
  { name: "Split Tool", id: "split-tool" },
  // { name: "Pricing", id: "pricing" },
];


const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: "easeOut" },
};

export { navLinks, staggerContainer, fadeInUp };