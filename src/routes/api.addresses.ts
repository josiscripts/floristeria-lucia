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
      .from("addresses")
      .select("*")
      .eq("user_id", user.data.user.id)
      .order("is_default", { ascending: false });

    if (error) throw error;

    return json(data, { status: 200 });
  } catch (error) {
    console.error("Error fetching addresses:", error);
    return json({ error: "Internal server error" }, { status: 500 });
  }
};

const POST = async (request: Request) => {
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
      .from("addresses")
      .insert({
        ...body,
        user_id: user.data.user.id,
      })
      .select()
      .single();

    if (error) throw error;

    return json(data, { status: 201 });
  } catch (error) {
    console.error("Error creating address:", error);
    return json({ error: "Internal server error" }, { status: 500 });
  }
};

export const Route = createFileRoute("/api/addresses")({
  server: {
    handlers: {
      GET: ({ request }) => GET(request),
      POST: ({ request }) => POST(request),
    },
  },
});
