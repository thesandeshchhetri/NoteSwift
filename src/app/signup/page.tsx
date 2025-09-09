'use client';

import { useState } from 'react';
import { useForm, zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { CheckCircle2, Circle, XCircle } from 'lucide-react';
import { OtpInput } from '@/components/OtpInput';

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

const Stepper = ({ step }: { step: number }) => (
  <div className="flex items-center justify-center gap-4 mb-8">
    <div className="flex items-center gap-2">
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${
          step >= 1 ? 'bg-primary' : 'bg-gray-300'
        }`}
      >
        1
      </div>
    </div>
    <div className={`h-1 w-12 ${step >= 2 ? 'bg-primary' : 'bg-gray-300'}`}></div>
    <div className="flex items-center gap-2">
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${
          step >= 2 ? 'bg-primary' : 'bg-gray-300'
        }`}
      >
        2
      </div>
    </div>
    <div className={`h-1 w-12 ${step >= 3 ? 'bg-primary' : 'bg-gray-300'}`}></div>
    <div className="flex items-center gap-2">
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${
          step >= 3 ? 'bg-primary' : 'bg-gray-300'
        }`}
      >
        3
      </div>
    </div>
  </div>
);

const PasswordRequirement = ({ meets, text }: { meets: boolean; text: string }) => (
  <div className={`flex items-center text-sm ${meets ? 'text-green-600' : 'text-muted-foreground'}`}>
    {meets ? <CheckCircle2 className="mr-2 h-4 w-4" /> : <Circle className="mr-2 h-4 w-4" />}
    {text}
  </div>
);

export default function SignupPage() {
  const { sendOtp, signup, verifyOtp } = useAuth();
  const [step, setStep] = useState(1);
  const [otp, setOtp] = useState('');

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

  const { password } = form.watch();
  const passwordCriteria = {
    length: password?.length >= 8,
    uppercase: /[A-Z]/.test(password),
    number: /\d/.test(password),
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
  };

  async function handleSendCode() {
    const isValid = await form.trigger();
    if (isValid) {
      await sendOtp(form.getValues('email'));
      setStep(2);
    }
  }

  async function handleVerifyAndSignup() {
    const isOtpValid = verifyOtp(otp);

    if (isOtpValid) {
      const { username, email, password } = form.getValues();
      await signup({ username, email, password });
      // The router push will be handled by the signup function on success
    } else {
      // Handle incorrect OTP
      form.setError('root', { type: 'manual', message: 'Invalid verification code.' });
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <Stepper step={step} />
          <h1 className="text-2xl font-bold text-primary">
            {step === 1 ? 'Create Your Account' : 'Verify Your Email'}
          </h1>
        </CardHeader>
        <CardContent>
          {step === 1 && (
            <Form {...form}>
              <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
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
                      <div className="p-4 bg-gray-100 rounded-md mt-2 space-y-2">
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
                <Button onClick={handleSendCode} className="w-full">
                  Send Verification Code
                </Button>
              </form>
            </Form>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <p className="text-center text-muted-foreground">
                Enter the 6-digit code sent to {form.getValues('email')}.
              </p>
              <div className="flex justify-center">
                <OtpInput value={otp} onChange={setOtp} />
              </div>
              {form.formState.errors.root && (
                 <div className="flex items-center justify-center text-destructive text-sm">
                   <XCircle className="mr-2 h-4 w-4" />
                   {form.formState.errors.root.message}
                 </div>
              )}
              <Button onClick={handleVerifyAndSignup} className="w-full">
                Verify & Create Account
              </Button>
              <Button variant="link" onClick={() => setStep(1)} className="w-full">
                Back
              </Button>
            </div>
          )}

          <div className="mt-4 text-center text-sm">
            Already have an account?{' '}
            <Link href="/login" className="underline text-primary">
              Log in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
