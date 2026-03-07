import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("lemonsqueezy_customer_id")
    .eq("id", user.id)
    .single();

  if (!profile?.lemonsqueezy_customer_id) {
    return NextResponse.json(
      { error: "No subscription found" },
      { status: 404 }
    );
  }

  const response = await fetch(
    `https://api.lemonsqueezy.com/v1/customers/${profile.lemonsqueezy_customer_id}`,
    {
      headers: {
        Accept: "application/vnd.api+json",
        Authorization: `Bearer ${process.env.LEMONSQUEEZY_API_KEY}`,
      },
    }
  );

  const customer = await response.json();

  if (!response.ok) {
    console.error("Lemon Squeezy customer error:", customer);
    return NextResponse.json(
      { error: "Failed to get billing portal" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    url: customer.data.attributes.urls.customer_portal,
  });
}
