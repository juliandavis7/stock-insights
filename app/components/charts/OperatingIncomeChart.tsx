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

interface OperatingIncomeChartProps {
  data: ChartData;
}

export function OperatingIncomeChart({ data }: OperatingIncomeChartProps) {
  // Transform data for recharts, filtering out null values
  const chartData = data.quarters
    .map((quarter, index) => ({
      quarter,
      operatingIncome: data.operating_income[index],
    }))
    .filter((item) => item.operatingIncome !== null) // Only show quarters with actual data
    .map((item) => ({
      ...item,
      operatingIncome: (item.operatingIncome as number) / 1000000000, // Convert to billions
    }));

  const chartConfig = {
    operatingIncome: {
      label: "Operating Income",
      color: "#F59E0B", // Golden amber color (same as revenue)
    },
  };

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Operating Income</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            No operating income data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card id="operating-income-chart-container">
      <CardHeader>
        <CardTitle>Operating Income</CardTitle>
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
                tickFormatter={(value) => `$${value.toFixed(2)}B`}
                tickLine={false}
                axisLine={false}
                className="text-xs"
              />
              <ChartTooltip
                content={<ChartTooltipContent 
                  formatter={(value) => [`$${(value as number).toFixed(2)}B`, "Operating Income"]}
                />}
              />
              <Bar 
                dataKey="operatingIncome" 
                fill="var(--color-operatingIncome)" 
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}