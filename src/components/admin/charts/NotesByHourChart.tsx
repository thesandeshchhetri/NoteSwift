'use client';

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Skeleton } from '@/components/ui/skeleton';

interface NotesByHourChartProps {
  data: { hour: string; count: number }[];
  loading: boolean;
}

export function NotesByHourChart({ data, loading }: NotesByHourChartProps) {
  const chartConfig = {
    notes: {
      label: 'Notes',
      color: 'hsl(var(--accent))',
    },
  };

  if (loading) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Notes by Hour</CardTitle>
                <CardDescription>Distribution of notes created throughout the day.</CardDescription>
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
        <CardTitle>Notes by Hour</CardTitle>
        <CardDescription>Distribution of notes created throughout the day.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <ResponsiveContainer>
                <BarChart data={data} margin={{ top: 20, right: 20, bottom: 20, left: -10 }}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="hour" tickLine={false} axisLine={false} tickMargin={8} />
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
