import { createFileRoute } from "@tanstack/react-router";
import { json } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const GET = async (request: Request) => {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const user = await supabaseAdmin.auth.getUser(token);

    if (!user.data.user) {
      return json({ error: "Invalid token" }, { status: 401 });
    }

    const { data, error } = await supabaseAdmin
      .from("user_preferences")
      .select("*")
      .eq("user_id", user.data.user.id)
      .single();

    if (error && error.code === "PGRST116") {
      const { data: newPrefs } = await supabaseAdmin
        .from("user_preferences")
        .insert({
          user_id: user.data.user.id,
          email_newsletter_promotions: true,
          email_newsletter_news: true,
          email_order_updates: true,
          cookies_analytics: true,
          cookies_personalization: true,
          cookies_marketing: true,
        })
        .select()
        .single();

      return json(newPrefs, { status: 200 });
    }

    if (error) throw error;

    return json(data, { status: 200 });
  } catch (error) {
    console.error("Error fetching preferences:", error);
    return json({ error: "Internal server error" }, { status: 500 });
  }
};

const PUT = async (request: Request) => {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const user = await supabaseAdmin.auth.getUser(token);

    if (!user.data.user) {
      return json({ error: "Invalid token" }, { status: 401 });
    }

    const body = await request.json();

    const { data, error } = await supabaseAdmin
      .from("user_preferences")
      .update(body)
      .eq("user_id", user.data.user.id)
      .select()
      .single();

    if (error) throw error;

    return json(data, { status: 200 });
  } catch (error) {
    console.error("Error updating preferences:", error);
    return json({ error: "Internal server error" }, { status: 500 });
  }
};

export const Route = createFileRoute("/api/preferences")({
  server: {
    handlers: {
      GET: ({ request }) => GET(request),
      PUT: ({ request }) => PUT(request),
    },
  },
});
