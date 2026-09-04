import { useEffect, useState } from "react";
import { useNavigate, Link } from "@tanstack/react-router";
import type { User } from "@supabase/supabase-js";
import type { Tables } from "@/integrations/supabase/types";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useT } from "@/context/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { formatPrice } from "@/data/catalog";
import { StatusBadge } from "@/components/admin/StatusBadge";

type OrderRow = Tables<"orders">;
type OrderItemRow = Tables<"order_items">;

interface UserOrder extends OrderRow {
  items: OrderItemRow[];
}

interface MyOrdersTabProps {
  user: User;
}

const FETCH_COUNTER = { current: 0 };

export function MyOrdersTab({ user }: MyOrdersTabProps) {
  const t = useT();
  const navigate = useNavigate();
  const { session, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<UserOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchCountRef = { current: 0 };

  useEffect(() => {
    fetchCountRef.current += 1;
    const fetchNumber = fetchCountRef.current;
    const timestamp = new Date().toLocaleTimeString();

    console.log(
      `[Orders Fetch #${fetchNumber}] Start - ${timestamp} | authLoading=${authLoading} | session=${!!session} | token=${!!session?.access_token}`,
    );

    const fetchOrders = async () => {
      try {
        setError(null);

        // Wait for auth to be loaded
        if (authLoading) {
          console.log(`[Orders Fetch #${fetchNumber}] Skipped - authLoading=true`);
          return;
        }

        if (!session) {
          console.log(`[Orders Fetch #${fetchNumber}] No session - returning empty`);
          setOrders([]);
          setLoading(false);
          return;
        }

        // Verify we have a valid access token
        if (!session.access_token) {
          console.log(`[Orders Fetch #${fetchNumber}] No access_token - setting error`);
          setError("No valid authentication token");
          setOrders([]);
          setLoading(false);
          return;
        }

        const fetchStart = performance.now();
        console.log(`[Orders Fetch #${fetchNumber}] Fetching from /api/account/orders`);

        const response = await fetch("/api/account/orders", {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        const fetchDuration = (performance.now() - fetchStart).toFixed(0);
        console.log(
          `[Orders Fetch #${fetchNumber}] Response - Status: ${response.status} | Duration: ${fetchDuration}ms`,
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMsg = errorData.error || response.statusText;
          console.log(`[Orders Fetch #${fetchNumber}] Error response: ${errorMsg}`);
          throw new Error(errorMsg);
        }

        const responseData = await response.json();
        const orderCount = responseData.orders?.length || 0;
        console.log(`[Orders Fetch #${fetchNumber}] Success - Orders count: ${orderCount}`);
        setOrders(responseData.orders || []);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        console.error(`[Orders Fetch #${fetchNumber}] Exception:`, message);
        setError(message);
        setOrders([]);
      } finally {
        setLoading(false);
        console.log(`[Orders Fetch #${fetchNumber}] Complete`);
      }
    };

    fetchOrders();

    return () => {
      console.log(`[Orders Fetch #${fetchNumber}] Component cleanup`);
    };
  }, [session, authLoading]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-pulse space-y-4 w-full max-w-2xl">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-muted rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border border-destructive/50 bg-destructive/5 p-6">
        <p className="text-sm text-destructive">{t("auth.account.error")}</p>
        <p className="text-xs text-destructive/70 mt-2">{error}</p>
      </Card>
    );
  }

  if (orders.length === 0) {
    return (
      <Card className="border border-dashed border-border p-12 text-center">
        <h3 className="font-display text-xl text-foreground">{t("auth.account.noOrders.title")}</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("auth.account.noOrders.description")}
        </p>
        <Button asChild className="mt-6">
          <Link to="/catalogo">{t("auth.account.noOrders.cta")}</Link>
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <OrderCard key={order.id} order={order} />
      ))}
    </div>
  );
}

function OrderCard({ order }: { order: UserOrder }) {
  const t = useT();
  const navigate = useNavigate();

  const createdDate = new Date(order.created_at || "").toLocaleDateString("es-ES", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const itemCount = order.items?.length || 0;

  const handleViewOrder = () => {
    navigate({
      to: `/confirmation/${order.id}`,
    });
  };

  return (
    <Card className="border border-border/40 p-4 sm:p-6 transition-shadow hover:shadow-petal">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Order Number and Date */}
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            {t("auth.account.orderNumber")}
          </p>
          <p className="mt-1 font-semibold text-foreground">{order.order_number}</p>
          <p className="mt-1 text-xs text-muted-foreground">{createdDate}</p>
        </div>

        {/* Items Count */}
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            {t("auth.account.items")}
          </p>
          <p className="mt-1 font-semibold text-foreground">
            {itemCount} {itemCount === 1 ? t("common.item") : t("common.items")}
          </p>
        </div>

        {/* Total */}
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            {t("auth.account.total")}
          </p>
          <p className="mt-1 font-semibold text-foreground">{formatPrice(order.total)}</p>
        </div>

        {/* Status and Action */}
        <div className="flex flex-col items-start gap-3 sm:items-end">
          <StatusBadge status={order.status as any} />
          <Button variant="outline" size="sm" onClick={handleViewOrder}>
            {t("common.view")}
          </Button>
        </div>
      </div>
    </Card>
  );
}
