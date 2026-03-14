import { useState } from "react";
import { toast } from "sonner";

export function useCopyInviteCode() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  async function copyInviteCode(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
      toast.success("Invite code copied to clipboard");
    } catch {
      toast.error("Failed to copy invite code");
    }
  }

  return { copiedCode, copyInviteCode };
}
