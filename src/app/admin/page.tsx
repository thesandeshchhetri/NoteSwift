'use client';
import { useEffect, useState } from 'react';
import type { User } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { getUsersAndStats } from '@/ai/flows/get-users-and-stats';
import { Skeleton } from '@/components/ui/skeleton';
import { NotesByDayChart } from '@/components/admin/charts/NotesByDayChart';
import { NotesByHourChart } from '@/components/admin/charts/NotesByHourChart';

interface ChartData {
    notesByHour: { hour: string; count: number }[];
    notesByDay: { date: string; count: number }[];
}

export default function AdminDashboardPage() {
  const { user: currentUser } = useAuth();
  const [userCount, setUserCount] = useState(0);
  const [noteCount, setNoteCount] = useState(0);
  const [chartData, setChartData] = useState<ChartData>({ notesByHour: [], notesByDay: [] });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();


  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const data = await getUsersAndStats();
      setUserCount(data.userCount);
      setNoteCount(data.noteCount);
      setChartData({ notesByHour: data.notesByHour, notesByDay: data.notesByDay });
    } catch (error: any) {
      console.error('Failed to fetch admin data:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to fetch admin dashboard data.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser?.role === 'admin' || currentUser?.role === 'superadmin') {
      fetchAdminData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);


  return (
    <>
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Admin Dashboard</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    {loading ? <Skeleton className="h-8 w-20" /> : <div className="text-2xl font-bold">{userCount}</div>}
                </CardContent>
                </Card>
                <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Notes</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                {loading ? <Skeleton className="h-8 w-20" /> : <div className="text-2xl font-bold">{noteCount}</div>}
                </CardContent>
                </Card>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
                <NotesByHourChart data={chartData.notesByHour} loading={loading} />
                <NotesByDayChart data={chartData.notesByDay} loading={loading} />
            </div>
        </div>
    </>
  );
}
