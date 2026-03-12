import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronLeft,
  CreditCard,
  Sparkles,
  PlusCircle,
  Camera,
  Users,
  Loader2,
  ArrowRight,
  Check,
  LayoutDashboard,
  Share2,
} from "lucide-react";
import { MemberSearch } from "./MemberSearch";
import { useGroupForm } from "../hooks/useGroupForm";

interface GroupFormProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onSuccess?: () => void;
}

const GroupForm = ({ isOpen, setIsOpen, onSuccess }: GroupFormProps) => {
  const {
    step,
    name,
    members,
    imagePreview,
    isSubmitting,
    submitError,
    isUploading,
    fileInputRef,
    errors,
    register,
    handleSubmit,
    resetAndClose,
    handleImage,
    onSubmit,
    handleAddMember,
    handleRemoveMember,
  } = useGroupForm({ setIsOpen, onSuccess });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-100 overflow-y-auto bg-[#F8F9FD]">
      <AnimatePresence mode="wait">
        {step === "form" ? (
          <motion.div
            key="form-step"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-xl mx-auto pt-12 px-4 pb-20"
          >
            {/* Header / Cancel */}
            <div className="flex items-center justify-between mb-8 px-2">
              <button
                onClick={resetAndClose}
                className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" /> Cancel
              </button>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Drafting Mode
                </span>
              </div>
            </div>

            {/* Visual Preview */}
            <motion.div
              layoutId="main-card"
              className="bg-slate-950 rounded-[2rem] p-6 mb-10 flex items-center gap-5 shadow-2xl shadow-indigo-100 relative overflow-hidden group border border-white/5"
            >
              {imagePreview && (
                <img
                  src={imagePreview}
                  className="absolute inset-0 w-full h-full object-cover opacity-30 blur-[2px] scale-110"
                />
              )}
              <div className="absolute inset-0 bg-linear-to-r from-slate-950 via-slate-950/60 to-transparent z-0" />
              <div className="relative z-10 w-16 h-10 bg-linear-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg border border-white/10 text-white">
                <CreditCard className="w-5 h-5" />
              </div>
              <div className="relative z-10 flex-1">
                <h2 className="text-white font-black text-sm tracking-widest capitalize truncate">
                  {name || "Insert Group Name..."}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex -space-x-1.5">
                    {members.length > 0 ? (
                      members
                        .slice(0, 3)
                        .map((m) => (
                          <div
                            key={(m as { id: string }).id}
                            className="w-4 h-4 rounded-full bg-indigo-400 border border-slate-950"
                          />
                        ))
                    ) : (
                      <div className="w-4 h-4 rounded-full bg-slate-800 border border-slate-950" />
                    )}
                  </div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                    {members.length} Members Linked
                  </span>
                </div>
              </div>
              <Sparkles className="relative z-10 w-4 h-4 text-indigo-400/50" />
            </motion.div>

            {/* Inputs */}
            <div className="space-y-4">
              <div className="bg-white p-7 rounded-3xl border border-slate-100 shadow-sm focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                <div className="flex items-center gap-2 mb-4">
                  <PlusCircle className="w-4 h-4 text-indigo-500" />
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    01. Group Identity
                  </label>
                </div>
                <input
                  autoFocus
                  className="w-full text-xl font-black outline-none placeholder:text-slate-300 capitalize mb-4"
                  placeholder="Group Name"
                  {...register("name")}
                />
                {errors.name?.message && (
                  <p className="text-xs font-bold text-red-600 mb-3">
                    {errors.name.message}
                  </p>
                )}
                <textarea
                  className="w-full text-sm font-medium outline-none placeholder:text-slate-300 resize-none h-20 text-slate-600"
                  placeholder="What is this group for?"
                  {...register("description")}
                />
              </div>

              <div className="bg-white p-7 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 overflow-hidden">
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Camera className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-0.5">
                      02. Group Banner
                    </label>
                    <p className="text-xs font-bold text-indigo-600 uppercase tracking-tight">
                      Upload Group Banner
                    </p>
                  </div>
                </div>
                <button
                  onClick={() =>
                    (fileInputRef.current as HTMLInputElement)?.click()
                  }
                  className="px-6 py-3 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 transition-all"
                >
                  {imagePreview ? "Change" : "Upload"}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={handleImage}
                  accept="image/*"
                />
              </div>

              <div className="bg-white p-7 rounded-3xl border border-slate-100 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Users className="w-4 h-4 text-indigo-500" />
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    03. Group Members
                  </label>
                </div>
                <MemberSearch
                  selectedMembers={members}
                  onAddMember={handleAddMember}
                  onRemoveMember={handleRemoveMember}
                />
                <p className="text-[10px] text-slate-400 mt-2">
                  Search by email to add existing users or invite by email
                </p>
              </div>

              {submitError && (
                <div className="p-4 rounded-2xl bg-red-50 border border-red-100">
                  <p className="text-sm font-bold text-red-700">
                    {submitError}
                  </p>
                </div>
              )}
            </div>

            <div className="mt-10">
              <button
                disabled={isSubmitting || isUploading || !name?.trim()}
                onClick={handleSubmit(onSubmit)}
                className="w-full h-16 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-4 hover:bg-indigo-600 transition-all disabled:opacity-30"
              >
                {isSubmitting || isUploading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Create Group <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="success-step"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen flex flex-col items-center justify-center bg-white p-6"
          >
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="w-24 h-24 bg-green-500 rounded-[2.5rem] flex items-center justify-center text-white mb-8 shadow-2xl shadow-green-100 relative"
            >
              <Check className="w-12 h-12" />
              <motion.div
                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="absolute inset-0 bg-green-500 rounded-[2.5rem]"
              />
            </motion.div>

            <h1 className="text-4xl font-black tracking-tighter mb-2 uppercase italic text-slate-950 text-center">
              Group Created!
            </h1>
            <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px] mb-12">
              Transaction Confirmed
            </p>

            <div className="w-full max-w-xs bg-slate-50 border border-slate-100 rounded-[2rem] p-5 mb-12 flex items-center gap-4 shadow-sm">
              <div className="w-14 h-14 rounded-2xl bg-slate-950 overflow-hidden border border-white/10 shrink-0">
                <div className="w-full h-full flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-white/40" />
                </div>
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-0.5">
                  Active Fund
                </p>
                <h3 className="text-sm font-black uppercase text-slate-900 truncate">
                  {name}
                </h3>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">
                  {members.length} members invited
                </p>
              </div>
            </div>

            <div className="w-full max-w-xs space-y-3">
              <button
                onClick={resetAndClose}
                className="w-full py-5 bg-slate-950 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-3 hover:bg-indigo-600 transition-all shadow-xl"
              >
                <LayoutDashboard className="w-4 h-4" /> Go to Dashboard
              </button>
              <button className="w-full py-5 bg-white border border-slate-100 text-slate-400 rounded-2xl font-black uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-3">
                <Share2 className="w-4 h-4" /> Share Invite Link
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GroupForm;
