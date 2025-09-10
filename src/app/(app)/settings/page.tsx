'use client';

import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { AppLayout as MainAppLayout } from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNotes } from '@/contexts/NotesContext';
import { format, parseISO } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { RotateCcw, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

function RecentlyDeletedTab() {
    const { deletedNotes, restoreNote, permanentlyDeleteNote } = useNotes();
  
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recently Deleted</CardTitle>
          <CardDescription>
            Notes you've deleted in the last 30 days. They will be permanently deleted after that.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96">
            <div className="space-y-4">
              {deletedNotes.length > 0 ? (
                deletedNotes.map(note => (
                  <div key={note.id} className="flex items-center justify-between p-2 rounded-md border">
                    <div className='flex-1'>
                      <p className="font-semibold">{note.title}</p>
                      <p className="text-sm text-muted-foreground">
                        Deleted on {format(parseISO(note.deletedAt!), 'PPP')}
                      </p>
                    </div>
                    <div className='flex gap-2'>
                      <Button variant="ghost" size="icon" onClick={() => restoreNote(note.id)}>
                        <RotateCcw className="h-4 w-4" />
                        <span className="sr-only">Restore</span>
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => permanentlyDeleteNote(note.id)}>
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete Permanently</span>
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-muted-foreground py-10">
                  No recently deleted notes.
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    );
  }

export default function SettingsPage() {
  const { user, updatePassword } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  function onSubmit(values: z.infer<typeof formSchema>) {
    updatePassword(values.newPassword);
    form.reset();
    toast({ title: 'Success', description: 'Password updated successfully!' });
  }

  if (!user) {
    return null; // or a loading spinner
  }

  return (
    <MainAppLayout>
      <div className="flex flex-col h-full bg-background">
        <header className="flex items-center justify-between p-4 border-b">
          <h1 className="text-xl font-semibold">Settings</h1>
          <Button asChild variant="outline">
            <Link href="/">Back to Notes</Link>
          </Button>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6 flex items-center justify-center">
            <Tabs defaultValue="account" className="w-full max-w-2xl">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="account">Account</TabsTrigger>
                <TabsTrigger value="deleted">Recently Deleted</TabsTrigger>
              </TabsList>
              <TabsContent value="account">
                <Card>
                    <CardHeader>
                        <CardTitle>Account Information</CardTitle>
                        <CardDescription>View and manage your account details.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                          <div>
                            <span className="font-semibold text-muted-foreground">Username:</span> {user.username}
                          </div>
                          <div>
                            <span className="font-semibold text-muted-foreground">Email:</span> {user.email}
                          </div>
                        </div>
                        <Separator />
                        <div>
                          <h3 className="text-lg font-semibold mb-2">Change Password</h3>
                          <Form {...form}>
                              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                              <FormField
                                  control={form.control}
                                  name="newPassword"
                                  render={({ field }) => (
                                  <FormItem>
                                      <FormLabel>New Password</FormLabel>
                                      <FormControl>
                                      <Input type="password" placeholder="••••••••" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                  </FormItem>
                                  )}
                              />
                              <FormField
                                  control={form.control}
                                  name="confirmPassword"
                                  render={({ field }) => (
                                  <FormItem>
                                      <FormLabel>Confirm New Password</FormLabel>
                                      <FormControl>
                                      <Input type="password" placeholder="••••••••" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                  </FormItem>
                                  )}
                              />
                              <Button type="submit">Update Password</Button>
                              </form>
                          </Form>
                        </div>
                    </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="deleted">
                <RecentlyDeletedTab />
              </TabsContent>
            </Tabs>
        </main>
      </div>
    </MainAppLayout>
  );
}
