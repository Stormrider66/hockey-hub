"use client";
import { FormEvent, useState } from 'react';
import { useLoginMutation } from '@/src/store/api/authApi';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { setCredentials } from '@/src/store/features/authSlice';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [login, { isLoading }] = useLoginMutation();

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const response = await login({ email, password }).unwrap();
      
      // Extract data from the response
      const { accessToken, refreshToken, user } = response.data;
      
      // Store credentials in Redux store
      dispatch(setCredentials({ accessToken, refreshToken, user }));
      
      // Show success message with user's name
      const displayName = user.firstName && user.lastName 
        ? `${user.firstName} ${user.lastName}` 
        : user.email;
      
      toast.success(`Welcome back, ${displayName}!`);
      
      // Small delay to ensure cookies are set before redirect
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Redirect based on user role
      const getRoleBasedRoute = (roles: any[]) => {
        // Priority order for users with multiple roles
        if (roles.some(r => r.name === 'admin')) return '/admin';
        if (roles.some(r => r.name === 'coach')) return '/coach';
        if (roles.some(r => r.name === 'player')) return '/player';
        if (roles.some(r => r.name === 'parent')) return '/parent';
        if (roles.some(r => r.name === 'medical_staff')) return '/medicalstaff';
        if (roles.some(r => r.name === 'physical_trainer')) return '/physical-trainer';
        if (roles.some(r => r.name === 'equipment_manager')) return '/equipment';
        if (roles.some(r => r.name === 'club_admin')) return '/club-admin';
        return '/'; // Fallback to home
      };
      
      const dashboardRoute = getRoleBasedRoute(user.roles || []);
      router.push(dashboardRoute);
    } catch (err: any) {
      console.error('Login failed:', err);
      
      // Handle different error formats
      const errorMessage = err?.data?.message || 
                          err?.message || 
                          'Login failed. Please check your credentials.';
      
      toast.error(errorMessage);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Login to Hockey Hub</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Signing in…' : 'Sign In'}
            </Button>
          </form>
          
          {/* Development credentials helper */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm">
              <strong>Development Test Accounts:</strong><br />
              <div className="mt-2 space-y-1">
                <div><strong>Coach:</strong> robert.ohlsson@saik.se</div>
                <div><strong>Medical Staff:</strong> medical@saik.se</div>
                <div className="text-xs text-gray-600">Password: Passw0rd!</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 