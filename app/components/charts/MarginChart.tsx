import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "~/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Legend } from "recharts";

interface ChartData {
  quarters: string[];
  revenue: number[];
  eps: number[];
  gross_margin: (number | null)[];
  net_margin: (number | null)[];
  operating_income: (number | null)[];
}

interface MarginChartProps {
  data: ChartData;
}

export function MarginChart({ data }: MarginChartProps) {
  // Transform data for recharts, filtering out null values
  const chartData = data.quarters
    .map((quarter, index) => ({
      quarter,
      grossMargin: data.gross_margin[index],
      netMargin: data.net_margin[index],
    }))
    .filter((item) => item.grossMargin !== null || item.netMargin !== null); // Keep if at least one margin has data

  const chartConfig = {
    grossMargin: {
      label: "Gross Margin",
      color: "#E879F9", // Magenta/pink color
    },
    netMargin: {
      label: "Net Margin", 
      color: "#22D3EE", // Cyan/turquoise color
    },
  };

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Gross Margin & Net Margin</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            No margin data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card id="margin-chart-container">
      <CardHeader>
        <CardTitle>Gross Margin & Net Margin</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <XAxis 
                dataKey="quarter" 
                tickLine={false}
                axisLine={false}
                className="text-xs"
              />
              <YAxis 
                tickFormatter={(value) => `${value}%`}
                tickLine={false}
                axisLine={false}
                className="text-xs"
              />
              <ChartTooltip
                content={<ChartTooltipContent 
                  formatter={(value, name) => [
                    value !== null ? `${(value as number).toFixed(2)}%` : "N/A", 
                    name === "grossMargin" ? "Gross Margin" : "Net Margin"
                  ]}
                />}
              />
              <Legend />
              <Line 
                type="monotone"
                dataKey="grossMargin" 
                stroke="var(--color-grossMargin)"
                strokeWidth={2}
                dot={{ r: 4 }}
                connectNulls={false}
                name="Gross Margin"
              />
              <Line 
                type="monotone"
                dataKey="netMargin" 
                stroke="var(--color-netMargin)"
                strokeWidth={2}
                dot={{ r: 4 }}
                connectNulls={false}
                name="Net Margin"
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}