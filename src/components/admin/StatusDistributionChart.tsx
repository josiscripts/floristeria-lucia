import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { orderStatusLabel } from "@/lib/admin/status";

const chartConfig: ChartConfig = {
  total: { label: "Pedidos", color: "var(--primary)" },
};

export function StatusDistributionChart({
  distribution,
}: {
  distribution: Record<string, number>;
}) {
  const data = Object.entries(distribution).map(([status, total]) => ({
    status,
    label: orderStatusLabel(status),
    total,
  }));

  if (data.length === 0) {
    return (
      <p className="flex h-55 items-center justify-center text-sm text-muted-foreground">
        Sin datos suficientes todavía.
      </p>
    );
  }

  return (
    <ChartContainer config={chartConfig} className="h-55 w-full">
      <BarChart data={data}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} fontSize={11} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="total" fill="var(--color-total)" radius={4} />
      </BarChart>
    </ChartContainer>
  );
}
