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

interface RevenueChartProps {
  data: ChartData;
}

export function RevenueChart({ data }: RevenueChartProps) {
  // Transform data for recharts
  const chartData = data.quarters.map((quarter, index) => ({
    quarter,
    revenue: data.revenue[index] / 1000000000, // Convert to billions
  }));

  const chartConfig = {
    revenue: {
      label: "Revenue",
      color: "#F59E0B", // Golden amber color
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quarterly Revenue</CardTitle>
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
                tickFormatter={(value) => `$${value.toFixed(1)}B`}
                tickLine={false}
                axisLine={false}
                className="text-xs"
              />
              <ChartTooltip
                content={<ChartTooltipContent 
                  formatter={(value) => [`$${(value as number).toFixed(2)}B`, "Revenue"]}
                />}
              />
              <Bar 
                dataKey="revenue" 
                fill="var(--color-revenue)" 
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}