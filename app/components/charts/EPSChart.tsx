import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "~/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from "recharts";

interface ChartData {
  quarters: string[];
  revenue: number[];
  eps: number[];
  gross_margin: (number | null)[];
  net_margin: (number | null)[];
  operating_income: (number | null)[];
}

interface EPSChartProps {
  data: ChartData;
}

export function EPSChart({ data }: EPSChartProps) {
  // Transform data for recharts
  const chartData = data.quarters.map((quarter, index) => ({
    quarter,
    eps: data.eps[index],
  }));

  const chartConfig = {
    eps: {
      label: "EPS",
      color: "#F59E0B", // Golden amber color (same as revenue)
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Earnings Per Share (EPS)</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <XAxis 
                dataKey="quarter" 
                tickLine={false}
                axisLine={false}
                className="text-xs"
              />
              <YAxis 
                tickFormatter={(value) => `$${value.toFixed(2)}`}
                tickLine={false}
                axisLine={false}
                className="text-xs"
              />
              <ChartTooltip
                content={<ChartTooltipContent 
                  formatter={(value) => [`$${(value as number).toFixed(2)}`, "EPS"]}
                />}
              />
              <Bar 
                dataKey="eps" 
                fill="var(--color-eps)" 
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}