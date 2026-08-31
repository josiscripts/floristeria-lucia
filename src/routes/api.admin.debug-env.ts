import { createFileRoute } from "@tanstack/react-router";
import { json } from "@tanstack/react-start";

async function GET() {
  return json({
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_PROJECT_ID: process.env.SUPABASE_PROJECT_ID,
    NODE_ENV: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
}

export const Route = createFileRoute("/api/admin/debug-env")({
  server: {
    handlers: {
      GET: () => GET(),
    },
  },
});
