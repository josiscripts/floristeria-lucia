import { CartesianGrid, Line, LineChart, XAxis } from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { SalesByDay } from "@/lib/admin/reports";

const chartConfig: ChartConfig = {
  sales: { label: "Ventas (€)", color: "var(--primary)" },
};

function formatDay(day: string) {
  const date = new Date(`${day}T00:00:00`);
  return date.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit" });
}

export function SalesEvolutionChart({ data }: { data: SalesByDay[] }) {
  if (data.length === 0) {
    return (
      <p className="flex h-55 items-center justify-center text-sm text-muted-foreground">
        Sin datos suficientes para este rango.
      </p>
    );
  }

  const chartData = data.map((d) => ({ ...d, label: formatDay(d.date) }));

  return (
    <ChartContainer config={chartConfig} className="h-55 w-full">
      <LineChart data={chartData}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} fontSize={11} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Line
          type="monotone"
          dataKey="sales"
          stroke="var(--color-sales)"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ChartContainer>
  );
}
