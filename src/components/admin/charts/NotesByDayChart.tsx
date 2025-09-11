'use client';

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { Skeleton } from '@/components/ui/skeleton';
import { format, parseISO } from 'date-fns';

interface NotesByDayChartProps {
  data: { date: string; count: number }[];
  loading: boolean;
}

export function NotesByDayChart({ data, loading }: NotesByDayChartProps) {
  const chartConfig = {
    notes: {
      label: 'Notes',
      color: 'hsl(var(--primary))',
    },
  };

  if (loading) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Notes per Day</CardTitle>
                <CardDescription>Last 30 days</CardDescription>
            </CardHeader>
            <CardContent>
                <Skeleton className="h-[300px] w-full" />
            </CardContent>
        </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notes per Day</CardTitle>
        <CardDescription>Number of notes created each day.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <ResponsiveContainer>
            <BarChart data={data} margin={{ top: 20, right: 20, bottom: 20, left: -10 }}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => format(parseISO(value), 'MMM d')}
              />
              <YAxis allowDecimals={false} />
              <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
              <Bar dataKey="count" name="Notes" fill="var(--color-notes)" radius={4} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
