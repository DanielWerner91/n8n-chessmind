import { SupabaseClient } from "@supabase/supabase-js";

export async function requirePro(supabase: SupabaseClient) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_status, subscription_ends_at")
    .eq("id", user.id)
    .single();

  const isPro =
    profile?.subscription_status === "pro" &&
    (!profile.subscription_ends_at ||
      new Date(profile.subscription_ends_at) > new Date());

  if (!isPro) {
    throw new Response(JSON.stringify({ error: "Pro subscription required" }), {
      status: 403,
    });
  }

  return { user, profile };
}
