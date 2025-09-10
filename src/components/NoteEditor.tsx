'use client';

import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { Note } from '@/types';
import { useNotes } from '@/contexts/NotesContext';
import { useEffect } from 'react';
import { Bell, CalendarIcon, Loader2 } from 'lucide-react';
import { Checkbox } from './ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Calendar } from './ui/calendar';
import { ScrollArea } from './ui/scroll-area';

const formSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
  tags: z.string().optional(),
  reminderSet: z.boolean().default(false),
  reminderAt: z.date().optional().nullable(),
});

interface NoteEditorProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  note: Omit<Note, 'userId'> | null;
}

export function NoteEditor({ isOpen, onOpenChange, note }: NoteEditorProps) {
  const { addNote, updateNote } = useNotes();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      content: '',
      tags: '',
      reminderSet: false,
      reminderAt: null,
    },
  });

  const reminderSet = form.watch('reminderSet');

  useEffect(() => {
    if (isOpen && note) {
      form.reset({
        title: note.title,
        content: note.content,
        tags: note.tags.join(', '),
        reminderSet: note.reminderSet,
        reminderAt: note.reminderAt ? new Date(note.reminderAt) : null,
      });
    } else if (isOpen) {
      form.reset({
        title: '',
        content: '',
        tags: '',
        reminderSet: false,
        reminderAt: null,
      });
    }
  }, [note, isOpen, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    onOpenChange(false); // Close dialog immediately
    const noteData = {
      title: values.title,
      content: values.content,
      tags: values.tags ? values.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [],
      reminderSet: values.reminderSet,
      reminderAt: values.reminderSet && values.reminderAt ? values.reminderAt.toISOString() : null,
    };
  
    if (note) {
      await updateNote(note.id, noteData);
    } else {
      await addNote(noteData);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[625px]">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <DialogHeader>
              <DialogTitle>{note ? 'Edit Note' : 'Create Note'}</DialogTitle>
              <DialogDescription>
                {note ? 'Update your note details.' : 'Fill in the details for your new note.'}
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[70vh] pr-4 py-4">
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="My new note" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Content</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Start writing your thoughts..." className="min-h-[200px]" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="tags"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tags</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. work, personal, ideas" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="reminderSet"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          Set Reminder
                        </FormLabel>
                        <FormDescription>
                          Get a notification for this note.
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                {reminderSet && (
                  <FormField
                    control={form.control}
                    name="reminderAt"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Reminder Date & Time</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-[240px] pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}>
                                {field.value ? (
                                  format(field.value, "PPP HH:mm")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value ?? undefined}
                              onSelect={field.onChange}
                              disabled={(date) =>
                                date < new Date(new Date().setHours(0, 0, 0, 0))
                              }
                              initialFocus
                            />
                            <div className="p-3 border-t border-border">
                              <Input
                                type="time"
                                onChange={(e) => {
                                  const [hours, minutes] = e.target.value.split(':');
                                  const newDate = new Date(field.value || new Date());
                                  newDate.setHours(parseInt(hours, 10));
                                  newDate.setMinutes(parseInt(minutes, 10));
                                  field.onChange(newDate);
                                }}
                                value={field.value ? format(field.value, 'HH:mm') : ''}
                              />
                            </div>
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
            </ScrollArea>
            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {note ? 'Save Changes' : 'Create Note'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
