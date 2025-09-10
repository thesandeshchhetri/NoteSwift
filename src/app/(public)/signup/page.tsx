'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { CheckCircle2, Circle } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const passwordValidation = new RegExp(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/);

const formSchema = z
  .object({
    username: z.string().min(3, 'Username must be at least 3 characters'),
    email: z.string().email('Invalid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(passwordValidation, 'Password must contain an uppercase letter, a number, and a special character'),
    confirmPassword: z.string(),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

const PasswordRequirement = ({ meets, text }: { meets: boolean; text: string }) => (
  <div className={`flex items-center text-sm ${meets ? 'text-green-600' : 'text-muted-foreground'}`}>
    {meets ? <CheckCircle2 className="mr-2 h-4 w-4" /> : <Circle className="mr-2 h-4 w-4" />}
    {text}
  </div>
);

export default function SignupPage() {
  const { user, signup } = useAuth();
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
    mode: 'all',
  });

  useEffect(() => {
    if (user) {
      router.push('/');
    }
  }, [user, router]);

  const { password } = form.watch();
  const passwordCriteria = {
    length: password?.length >= 8,
    uppercase: /[A-Z]/.test(password),
    number: /\d/.test(password),
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
  };

  function onSubmit(values: z.infer<typeof formSchema>) {
    signup(values);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
            <div className="mx-auto mb-4">
                <Logo />
            </div>
            <CardTitle className="text-2xl">Create Your Account</CardTitle>
            <CardDescription>Join NoteSwift to start organizing your thoughts.</CardDescription>
        </CardHeader>
        <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input placeholder="Choose a username" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Create a password" {...field} />
                      </FormControl>
                      <div className="p-4 bg-muted/50 rounded-md mt-2 space-y-2">
                        <PasswordRequirement meets={passwordCriteria.length} text="At least 8 characters" />
                        <PasswordRequirement meets={passwordCriteria.uppercase} text="One uppercase letter" />
                        <PasswordRequirement meets={passwordCriteria.number} text="One number" />
                        <PasswordRequirement meets={passwordCriteria.special} text="One special character" />
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Confirm your password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full">
                  Create Account
                </Button>
              </form>
            </Form>

          <div className="mt-4 text-center text-sm">
            Already have an account?{' '}
            <Link href="/login" className="underline text-primary">
              Log in
            </Link>
             {' or '}
            <Link href="/forgot-password" className="underline text-primary">
              Forgot Password?
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
