"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface SubscriptionData {
  subscription_status: "free" | "pro";
  subscription_ends_at: string | null;
}

export function useSubscription() {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    async function fetchSubscription() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setIsLoading(false);
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("subscription_status, subscription_ends_at")
        .eq("id", user.id)
        .single();

      setSubscription(data);
      setIsLoading(false);
    }

    fetchSubscription();
  }, []);

  const isProUser =
    subscription?.subscription_status === "pro" &&
    (!subscription.subscription_ends_at ||
      new Date(subscription.subscription_ends_at) > new Date());

  return { subscription, isProUser, isLoading };
}
