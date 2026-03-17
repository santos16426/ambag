import { useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";
import { QR_CODES_BUCKET } from "@/constants/storage";

export interface RecipientPaymentMethod {
  id: string;
  type: "bank" | "qr";
  userid: string;
  banktype: string | null;
  qrcodeurl: string | null;
  accountname: string | null;
  accountnumber: string | null;
}

interface UseRecipientPaymentMethodsResult {
  methods: RecipientPaymentMethod[];
  selectedMethodId: string;
  isLoading: boolean;
  setSelectedMethodId: (id: string) => void;
}

export function useRecipientPaymentMethods(
  recipientId: string | null | undefined,
): UseRecipientPaymentMethodsResult {
  const [methods, setMethods] = useState<RecipientPaymentMethod[]>([]);
  const [selectedMethodId, setSelectedMethodId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!recipientId) {
      setMethods([]);
      setSelectedMethodId("");
      return;
    }

    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setSelectedMethodId("");
      try {
        const supabase = createClient();
        const { data, error } = await supabase.rpc("getusersettings", {
          p_user_id: recipientId,
        });

        if (error) {
          throw new Error(error.message);
        }

        const payload = data as {
          paymentmethods: RecipientPaymentMethod[];
        };

        if (cancelled) return;

        const rawMethods = payload.paymentmethods ?? [];

        const enhanced: RecipientPaymentMethod[] = await Promise.all(
          rawMethods.map(async (method) => {
            if (method.type !== "qr" || !method.qrcodeurl) {
              return method;
            }

            const { data: signed } = await supabase.storage
              .from(QR_CODES_BUCKET)
              .createSignedUrl(method.qrcodeurl, 60 * 60);

            return {
              ...method,
              qrcodeurl: signed?.signedUrl ?? null,
            };
          }),
        );

        setMethods(enhanced);
        if (enhanced.length > 0) {
          setSelectedMethodId(enhanced[0].id);
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error(err);
        if (!cancelled) {
          setMethods([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [recipientId]);

  return {
    methods,
    selectedMethodId,
    isLoading,
    setSelectedMethodId,
  };
}

