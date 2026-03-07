import { NextResponse } from "next/server";
import crypto from "crypto";
import { createServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const hmac = crypto.createHmac("sha256", secret);
  const digest = hmac.update(payload).digest("hex");
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(digest)
  );
}

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("X-Signature");

  // SECURITY: Verify webhook signature FIRST
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 401 });
  }

  const isValid = verifyWebhookSignature(
    body,
    signature,
    process.env.LEMONSQUEEZY_WEBHOOK_SECRET!
  );

  if (!isValid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(body);
  const eventName = event.meta.event_name as string;
  const eventId = event.meta.webhook_id as string;

  // SECURITY: Use service role client for webhook processing
  const supabase = createServiceClient();

  // IDEMPOTENCY: Check if we've already processed this event
  const { data: existingEvent } = await supabase
    .from("webhook_events")
    .select("id")
    .eq("event_id", eventId)
    .single();

  if (existingEvent) {
    return NextResponse.json({ message: "Already processed" });
  }

  // Record the event before processing
  await supabase.from("webhook_events").insert({
    event_id: eventId,
    event_name: eventName,
    payload: event,
    processed_at: new Date().toISOString(),
  });

  // Extract subscription data
  const attributes = event.data.attributes;
  const userId = event.meta.custom_data?.user_id;

  if (!userId) {
    console.error("Webhook missing user_id in custom_data:", eventId);
    return NextResponse.json({ message: "No user_id" });
  }

  // Handle subscription events
  switch (eventName) {
    case "subscription_created": {
      await supabase
        .from("profiles")
        .update({
          subscription_status: "pro",
          lemonsqueezy_customer_id: String(attributes.customer_id),
          lemonsqueezy_subscription_id: String(event.data.id),
          subscription_ends_at: attributes.ends_at,
        })
        .eq("id", userId);
      break;
    }

    case "subscription_updated": {
      const status = attributes.status;
      const subscriptionStatus =
        status === "active" || status === "on_trial" ? "pro" : "free";

      await supabase
        .from("profiles")
        .update({
          subscription_status: subscriptionStatus,
          subscription_ends_at: attributes.ends_at,
        })
        .eq("id", userId);
      break;
    }

    case "subscription_cancelled": {
      await supabase
        .from("profiles")
        .update({
          subscription_ends_at: attributes.ends_at,
        })
        .eq("id", userId);
      break;
    }

    case "subscription_expired": {
      await supabase
        .from("profiles")
        .update({
          subscription_status: "free",
          lemonsqueezy_subscription_id: null,
          subscription_ends_at: null,
        })
        .eq("id", userId);
      break;
    }

    default:
      console.log(`Unhandled Lemon Squeezy event: ${eventName}`);
  }

  return NextResponse.json({ message: "OK" });
}
