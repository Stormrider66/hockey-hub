'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Mail } from 'lucide-react';
import { useForgotPasswordMutation } from '@/store/api/authApi';
import toast from 'react-hot-toast';
import { LoadingSpinner } from '@/components/ui/loading';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [forgotPassword, { isLoading, error }] = useForgotPasswordMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    try {
      await forgotPassword({ email }).unwrap();
      setSubmitted(true);
      toast.success('Password reset email sent!');
    } catch (err: any) {
      // Check if it's a rate limit error
      if (err?.status === 429) {
        toast.error('Too many requests. Please try again later.');
      } else {
        toast.error(err?.data?.message || 'Failed to send reset email');
      }
    }
  };

  if (submitted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-green-100 rounded-full">
              <Mail className="w-6 h-6 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-center">Check your email</CardTitle>
            <CardDescription className="text-center">
              We've sent a password reset link to {email}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertDescription>
                If you don't see the email, check your spam folder. The link will expire in 1 hour.
              </AlertDescription>
            </Alert>
            <div className="text-sm text-center text-muted-foreground">
              Didn't receive the email?{' '}
              <button
                onClick={() => {
                  setSubmitted(false);
                  handleSubmit(new Event('submit') as any);
                }}
                className="font-medium text-primary hover:underline"
                disabled={isLoading}
              >
                Send again
              </button>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => router.push('/login')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to login
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl">Forgot password?</CardTitle>
          <CardDescription>
            Enter your email address and we'll send you a link to reset your password
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                required
                autoComplete="email"
                autoFocus
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>
                  {(error as any)?.data?.message || 'Something went wrong. Please try again.'}
                </AlertDescription>
              </Alert>
            )}

            {/* Rate limit warning */}
            <Alert>
              <AlertDescription className="text-sm">
                For security reasons, you can only request a password reset every 15 minutes.
              </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter className="flex flex-col space-y-2">
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || !email}
            >
              {isLoading ? (
                <>
                  <LoadingSpinner size="sm" center={false} className="mr-2" />
                  Sending email...
                </>
              ) : (
                'Send reset link'
              )}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => router.push('/login')}
              disabled={isLoading}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to login
            </Button>
          </CardFooter>
        </form>
      </Card>

      {/* Additional help text */}
      <div className="absolute bottom-4 left-0 right-0 text-center">
        <p className="text-sm text-muted-foreground">
          Need help?{' '}
          <Link href="/support" className="font-medium text-primary hover:underline">
            Contact support
          </Link>
        </p>
      </div>
    </div>
  );
}