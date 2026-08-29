import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

const chartConfig: ChartConfig = {
  sales: { label: "Ventas (€)", color: "var(--primary)" },
};

interface SalesChartProps {
  today: number;
  last7Days: number;
  last30Days: number;
}

export function SalesChart({ today, last7Days, last30Days }: SalesChartProps) {
  const data = [
    { period: "Hoy", sales: Number(today.toFixed(2)) },
    { period: "7 días", sales: Number(last7Days.toFixed(2)) },
    { period: "30 días", sales: Number(last30Days.toFixed(2)) },
  ];

  return (
    <ChartContainer config={chartConfig} className="h-55 w-full">
      <BarChart data={data}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="period" tickLine={false} axisLine={false} tickMargin={8} fontSize={11} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="sales" fill="var(--color-sales)" radius={4} />
      </BarChart>
    </ChartContainer>
  );
}
