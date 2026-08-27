import { json } from "@tanstack/react-start";
import { getGHLProducts, testGHLConnection } from "@/lib/ghl/client.server";

export async function GET(request: Request) {
  try {
    // Parse URL to check query params
    const url = new URL(request.url);
    const action = url.searchParams.get("action");

    // Test connection
    if (action === "test") {
      const result = await testGHLConnection();
      return json(result, { status: result.connected ? 200 : 503 });
    }

    // Fetch products (default action)
    const locationId = url.searchParams.get("locationId") || undefined;
    const limit = url.searchParams.get("limit")
      ? parseInt(url.searchParams.get("limit")!)
      : 100;
    const skip = url.searchParams.get("skip")
      ? parseInt(url.searchParams.get("skip")!)
      : 0;

    const result = await getGHLProducts(locationId, { limit, skip });

    // Check if result is an error
    if ("code" in result && "statusCode" in result) {
      return json(result, { status: result.statusCode || 500 });
    }

    return json(result, { status: 200 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown server error";
    console.error("[API] /api/ghl/products error:", message);
    return json(
      { message, code: "API_ERROR" },
      { status: 500 }
    );
  }
}
