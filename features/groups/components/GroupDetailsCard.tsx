import React, { useRef, useState } from "react";
import type { Group } from "@/features/dashboard/types";
import { CreditCard, Camera, Check, X, Edit2, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { uploadImage, groupImagePath } from "@/lib/storage/upload";
const PremiumMeshBackground = () => {
  return (
    <div className="absolute inset-0 overflow-hidden bg-[#0a0a0c]">
      {/* Dynamic Animated Orbs */}
      <div
        className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] rounded-full opacity-40 mix-blend-screen animate-pulse"
        style={{
          background:
            "radial-gradient(circle, rgba(99,102,241,0.8) 0%, transparent 70%)",
          filter: "blur(80px)",
          animationDuration: "8s",
        }}
      />
      <div
        className="absolute top-[10%] -right-[20%] w-[60%] h-[60%] rounded-full opacity-30 mix-blend-overlay"
        style={{
          background:
            "radial-gradient(circle, rgba(168,85,247,0.7) 0%, transparent 70%)",
          filter: "blur(100px)",
          animation: "bounce 15s infinite alternate",
        }}
      />
      <div
        className="absolute -bottom-[30%] left-[20%] w-[50%] h-[50%] rounded-full opacity-20"
        style={{
          background:
            "radial-gradient(circle, rgba(59,130,246,0.6) 0%, transparent 70%)",
          filter: "blur(90px)",
          animation: "pulse 12s infinite",
        }}
      />

      {/* Grid Overlay for "Tech" feel */}
      <div
        className="absolute inset-0 opacity-[0.15]"
        style={{
          backgroundImage: `linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }}
      />

      {/* Grainy Texture for depth */}
      <div className="absolute inset-0 opacity-20 mix-blend-soft-light pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

      {/* Subtle Bottom Glow */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-linear-to-t from-[#0a0a0c] to-transparent z-5" />
    </div>
  );
};
interface GroupDetailsCardProps {
  group: Group;
  onGroupUpdate?: () => void;
}

const GroupDetailsCard = ({ group, onGroupUpdate }: GroupDetailsCardProps) => {
  const [editingField, setEditingField] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startEditing = (field: string, value: string) => {
    setEditingField(field);
    setTempValue(value);
  };

  const cancelEdit = () => {
    setEditingField(null);
    setTempValue("");
  };

  const saveEdit = async () => {
    if (editingField !== "name" && editingField !== "description") return;
    setIsSaving(true);
    const payload =
      editingField === "name"
        ? { name: tempValue.trim() }
        : { description: tempValue.trim() || null };
    const supabase = createClient();
    const { error } = await supabase
      .from("groups")
      .update({ ...payload })
      .eq("id", group.id);
    setIsSaving(false);
    if (!error) {
      setEditingField(null);
      setTempValue("");
      onGroupUpdate?.();
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !group.id) return;
    setImageUploading(true);
    const path = groupImagePath(group.id, file);
    const { url, error } = await uploadImage("groups", path, file);
    if (!error && url) {
      const supabase = createClient();
      const { error: updateError } = await supabase
        .from("groups")
        .update({ imageurl: url })
        .eq("id", group.id);
      if (!updateError) {
        onGroupUpdate?.();
      }
    }
    setImageUploading(false);
    e.target.value = "";
  };

  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    const textField = document.createElement("textarea");
    textField.innerText = group?.invite_code ?? "";
    document.body.appendChild(textField);
    textField.select();
    document.execCommand("copy");
    textField.remove();

    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <>
      <div className="bg-white rounded-[2.5rem] overflow-hidden border border-slate-200 shadow-sm">
        {/* HEADER BANNER SECTION */}
        <div className="group relative w-full aspect-21/9 bg-slate-900 overflow-hidden">
          {group.image_url ? (
            <img
              src={group.image_url}
              className="absolute inset-0 w-full h-full object-cover opacity-60 transition-transform duration-700 group-hover:scale-105"
              alt="Banner"
            />
          ) : (
            <PremiumMeshBackground />
          )}

          <div className="absolute inset-0 bg-linear-to-t from-slate-900 via-slate-900/40 to-transparent z-10" />

          <div className="relative z-20 h-full p-8 flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div className="w-12 h-8 bg-indigo-600 rounded-md flex items-center justify-center shadow-md border border-white/10 text-white">
                <CreditCard className="w-4 h-4" />
              </div>

              {/* Top Right Image Edit Button */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={imageUploading}
                  className="bg-white/10 backdrop-blur-md border border-white/20 p-2 rounded-lg text-white hover:bg-white/20 transition-all shadow-lg disabled:opacity-50"
                  title="Change Cover"
                >
                  {imageUploading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Camera className="w-4 h-4" />
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={handleImageUpload}
                  accept="image/*"
                />
              </div>
            </div>

            <div className="flex justify-between items-end gap-4">
              <div className="flex-1 space-y-2">
                {/* Name Editing Logic */}
                {editingField === "name" ? (
                  <div className="flex items-center gap-2">
                    <input
                      className="bg-white/20 backdrop-blur-md border border-white/30 rounded px-2 py-1 text-2xl font-bold text-white outline-none w-full"
                      value={tempValue}
                      onChange={(e) => setTempValue(e.target.value)}
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={saveEdit}
                      disabled={isSaving}
                      className="p-1.5 bg-emerald-500 text-white rounded-md disabled:opacity-50"
                    >
                      {isSaving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="p-1.5 bg-white/10 text-white rounded-md"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 group/title">
                    <h2 className="text-3xl font-bold text-white leading-none">
                      {group.name}
                    </h2>
                    <button
                      onClick={() => startEditing("name", group.name)}
                      className="opacity-0 group-hover/title:opacity-100 p-1 hover:bg-white/10 rounded transition-all"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-white/70" />
                    </button>
                  </div>
                )}

                {/* Description Editing Logic */}
                {editingField === "description" ? (
                  <div className="flex items-start gap-2">
                    <textarea
                      className="bg-white/20 backdrop-blur-md border border-white/30 rounded px-2 py-1 text-sm text-slate-200 outline-none w-full h-16 resize-none"
                      value={tempValue}
                      onChange={(e) => setTempValue(e.target.value)}
                      autoFocus
                    />
                    <div className="flex flex-col gap-1">
                      <button
                        type="button"
                        onClick={saveEdit}
                        disabled={isSaving}
                        className="p-1.5 bg-emerald-500 text-white rounded-md disabled:opacity-50"
                      >
                        {isSaving ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Check className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="p-1.5 bg-white/10 text-white rounded-md"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2 group/desc max-w-md">
                    <p className="text-sm text-slate-200 leading-relaxed opacity-90 line-clamp-2">
                      {group.description}
                    </p>
                    <button
                      onClick={() =>
                        startEditing("description", group.description ?? "")
                      }
                      className="opacity-0 group-hover/desc:opacity-100 p-1 mt-0.5 hover:bg-white/10 rounded transition-all shrink-0"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-white/70" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default GroupDetailsCard;
