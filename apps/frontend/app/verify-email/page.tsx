'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useVerifyEmailMutation, useResendVerificationEmailMutation } from '@/store/api/authApi';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle, Mail } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { login } = useAuth();
  const [verifyEmail, { isLoading: isVerifying }] = useVerifyEmailMutation();
  const [resendVerificationEmail, { isLoading: isResending }] = useResendVerificationEmailMutation();
  
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'success' | 'error'>('pending');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');

  const token = searchParams.get('token');
  const email = searchParams.get('email');

  useEffect(() => {
    if (email) {
      setUserEmail(email);
    }

    if (token) {
      handleVerification(token);
    } else {
      setVerificationStatus('error');
      setErrorMessage('No verification token provided');
    }
  }, [token]);

  const handleVerification = async (verificationToken: string) => {
    try {
      const result = await verifyEmail({ token: verificationToken }).unwrap();
      
      setVerificationStatus('success');
      toast.success('Email verified successfully!');

      // If the response includes user data, log them in
      if (result.user) {
        // Store user data in auth context
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      }
    } catch (error: any) {
      setVerificationStatus('error');
      setErrorMessage(error?.data?.message || 'Failed to verify email. The token may be invalid or expired.');
      toast.error('Email verification failed');
    }
  };

  const handleResendVerification = async () => {
    if (!userEmail) {
      toast.error('Please provide an email address');
      return;
    }

    try {
      await resendVerificationEmail({ email: userEmail }).unwrap();
      toast.success('Verification email sent! Please check your inbox.');
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to resend verification email');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {verificationStatus === 'pending' && (
            <>
              <CardTitle>Verifying Your Email</CardTitle>
              <CardDescription>Please wait while we verify your email address...</CardDescription>
            </>
          )}
          {verificationStatus === 'success' && (
            <>
              <CardTitle className="flex items-center justify-center gap-2">
                <CheckCircle className="h-6 w-6 text-green-500" />
                Email Verified!
              </CardTitle>
              <CardDescription>Your email has been successfully verified.</CardDescription>
            </>
          )}
          {verificationStatus === 'error' && (
            <>
              <CardTitle className="flex items-center justify-center gap-2">
                <XCircle className="h-6 w-6 text-red-500" />
                Verification Failed
              </CardTitle>
              <CardDescription>We couldn't verify your email address.</CardDescription>
            </>
          )}
        </CardHeader>
        <CardContent>
          {verificationStatus === 'pending' && (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}

          {verificationStatus === 'success' && (
            <div className="space-y-4">
              <Alert className="bg-green-50 border-green-200">
                <AlertDescription className="text-green-800">
                  You can now access all features of Hockey Hub. Redirecting to dashboard...
                </AlertDescription>
              </Alert>
              <Button 
                onClick={() => router.push('/dashboard')} 
                className="w-full"
              >
                Go to Dashboard
              </Button>
            </div>
          )}

          {verificationStatus === 'error' && (
            <div className="space-y-4">
              <Alert className="bg-red-50 border-red-200">
                <AlertDescription className="text-red-800">
                  {errorMessage}
                </AlertDescription>
              </Alert>
              
              <div className="space-y-3">
                <p className="text-sm text-gray-600 text-center">
                  Need a new verification email?
                </p>
                
                {userEmail && (
                  <Button
                    onClick={handleResendVerification}
                    disabled={isResending}
                    variant="outline"
                    className="w-full"
                  >
                    {isResending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Mail className="mr-2 h-4 w-4" />
                        Resend to {userEmail}
                      </>
                    )}
                  </Button>
                )}

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-gray-500">Or</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <Button
                    onClick={handleResendVerification}
                    disabled={isResending || !userEmail}
                    className="w-full"
                  >
                    {isResending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      'Send Verification Email'
                    )}
                  </Button>
                </div>

                <Button
                  onClick={() => router.push('/login')}
                  variant="ghost"
                  className="w-full"
                >
                  Back to Login
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}