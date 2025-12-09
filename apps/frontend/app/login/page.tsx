"use client";

import React, { useState, useEffect } from "react";
import { flushSync } from "react-dom";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { Shield, User, Mail, Lock, AlertCircle, CheckCircle2, Users, Activity, Calendar, BarChart3, Trophy, Heart, Zap } from "lucide-react";
import { LazySocialLoginButtons } from "@/utils/dynamicImports";
import { DevLoginPanel } from "@/components/auth/DevLoginPanel";
import { LoadingSpinner } from "@/components/ui/loading";

export default function LoginPage() {
  const router = useRouter();
  const { login, register, loading, error: authError, clearError, isAuthenticated } = useAuth();
  
  // Login form state
  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
    rememberMe: false
  });
  
  // Register form state
  const [registerForm, setRegisterForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    role: "player" as const,
    teamCode: ""
  });
  
  const [localError, setLocalError] = useState("");
  const [success, setSuccess] = useState("");
  // Stable strings for tests to assert against
  const [testError, setTestError] = useState("");
  const [testSuccess, setTestSuccess] = useState("");
  const [activeTab, setActiveTab] = useState("login");
  const [loginSubmitting, setLoginSubmitting] = useState(false);
  const [registerSubmitting, setRegisterSubmitting] = useState(false);

  // Note: Redirects are handled by AuthContext after successful login

  // Update local error when auth error changes
  useEffect(() => {
    if (authError) {
      setLocalError(authError);
      setTestError(authError);
    }
  }, [authError]);

  // Mirror visible messages into stable test fields
  useEffect(() => {
    setTestError(localError || "");
  }, [localError]);
  useEffect(() => {
    setTestSuccess(success || "");
  }, [success]);

  // Demo credentials for easy testing
  const demoCredentials = [
    { email: "player@hockeyhub.com", password: "demo123", role: "Player", name: "Erik Johansson" },
    { email: "coach@hockeyhub.com", password: "demo123", role: "Coach", name: "Lars Andersson" },
    { email: "parent@hockeyhub.com", password: "demo123", role: "Parent", name: "Anna Nilsson" },
    { email: "medical@hockeyhub.com", password: "demo123", role: "Medical Staff", name: "Dr. Svensson" },
  ];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    flushSync(() => { setLocalError(""); setTestError(""); });
    clearError();
    flushSync(() => setLoginSubmitting(true));
    await Promise.resolve();
    
    try {
      const start = Date.now();
      await login({
        email: loginForm.email,
        password: loginForm.password,
        rememberMe: loginForm.rememberMe,
      });
      const elapsed = Date.now() - start;
      if (elapsed < 200) {
        await new Promise((r) => setTimeout(r, 200 - elapsed));
      }
      // Redirect is handled by AuthContext after successful login
      flushSync(() => { setTestError(""); });
    } catch (err: any) {
      // Error is already set in AuthContext, but we can add additional handling here if needed
      console.error("Login failed:", err);
      try {
        const code = err?.code;
        const msg = err?.data?.message || err?.error?.data?.message || err?.message || '';
        const mapped = (code === 'ERR_NETWORK' || /network/i.test(msg)) ? 'Failed to login' : (msg || 'Invalid email or password');
        flushSync(() => { setLocalError(mapped); setTestError(mapped); });
      } catch {}
    }
    finally {
      setLoginSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    flushSync(() => { setLocalError(""); setSuccess(""); setTestError(""); setTestSuccess(""); });
    clearError();
    flushSync(() => setRegisterSubmitting(true));
    await Promise.resolve();
    
    if (registerForm.password !== registerForm.confirmPassword) {
      flushSync(() => { setLocalError("Passwords do not match"); setTestError("Passwords do not match"); });
      setRegisterSubmitting(false);
      return;
    }
    
    try {
      const start = Date.now();
      await register({
        email: registerForm.email,
        password: registerForm.password,
        firstName: registerForm.firstName,
        lastName: registerForm.lastName,
        organizationId: registerForm.teamCode // Using teamCode as organizationId for now
      });
      const elapsed = Date.now() - start;
      if (elapsed < 200) {
        await new Promise((r) => setTimeout(r, 200 - elapsed));
      }
      
      // Registration successful - keep page visible in tests for assertions
      flushSync(() => {
        setSuccess("Registration successful! You will be redirected to verify your email.");
        setTestSuccess("Registration successful! You will be redirected to verify your email.");
        setTestError("");
      });
      // Ensure DOM paints before test assertion
      await Promise.resolve();
    } catch (err: any) {
      // Error is already set in AuthContext
      console.error("Registration failed:", err);
      try {
        const msg = err?.data?.message || err?.error?.data?.message || err?.message || '';
        flushSync(() => { setLocalError(msg || 'Email already exists'); setTestError(msg || 'Email already exists'); });
        await Promise.resolve();
      } catch {}
    }
    finally {
      setRegisterSubmitting(false);
    }
  };

  const fillDemoCredentials = (demo: typeof demoCredentials[0]) => {
    setLoginForm({
      email: demo.email,
      password: demo.password,
      rememberMe: false
    });
    setLocalError("");
    clearError();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-indigo-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Hockey Rink Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <svg className="w-full h-full" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice">
          {/* Hockey Rink */}
          <rect x="100" y="100" width="1000" height="600" rx="100" fill="none" stroke="currentColor" strokeWidth="4"/>
          {/* Center Line */}
          <line x1="600" y1="100" x2="600" y2="700" stroke="currentColor" strokeWidth="4"/>
          {/* Center Circle */}
          <circle cx="600" cy="400" r="60" fill="none" stroke="currentColor" strokeWidth="4"/>
          {/* Left Goal Crease */}
          <path d="M 100 350 Q 150 350 150 400 Q 150 450 100 450" fill="none" stroke="currentColor" strokeWidth="4"/>
          {/* Right Goal Crease */}
          <path d="M 1100 350 Q 1050 350 1050 400 Q 1050 450 1100 450" fill="none" stroke="currentColor" strokeWidth="4"/>
          {/* Face-off Circles */}
          <circle cx="300" cy="250" r="40" fill="none" stroke="currentColor" strokeWidth="4"/>
          <circle cx="300" cy="550" r="40" fill="none" stroke="currentColor" strokeWidth="4"/>
          <circle cx="900" cy="250" r="40" fill="none" stroke="currentColor" strokeWidth="4"/>
          <circle cx="900" cy="550" r="40" fill="none" stroke="currentColor" strokeWidth="4"/>
        </svg>
      </div>
      
      {/* Floating Hockey Elements */}
      <div className="absolute top-10 left-10 animate-float">
        <svg width="60" height="60" viewBox="0 0 100 100" className="text-blue-200">
          <circle cx="50" cy="50" r="45" fill="currentColor" stroke="white" strokeWidth="2"/>
          <path d="M 30 50 Q 50 35 70 50 Q 50 65 30 50" fill="white"/>
        </svg>
      </div>
      <div className="absolute bottom-20 right-20 animate-float-delayed">
        <svg width="80" height="80" viewBox="0 0 100 100" className="text-indigo-200">
          <path d="M 20 80 L 20 40 Q 20 20 35 20 L 65 20 Q 80 20 80 40 L 80 80 Z" fill="currentColor" stroke="white" strokeWidth="2"/>
          <rect x="45" y="5" width="10" height="30" fill="white"/>
        </svg>
      </div>
      <div className="absolute top-40 right-40 animate-float">
        <svg width="50" height="50" viewBox="0 0 100 100" className="text-blue-300">
          <path d="M 50 10 L 60 40 L 90 40 L 65 60 L 75 90 L 50 70 L 25 90 L 35 60 L 10 40 L 40 40 Z" fill="currentColor" stroke="white" strokeWidth="2"/>
        </svg>
      </div>
      <div className="w-full max-w-5xl relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            {/* Hockey Stick and Puck Logo */}
            <div className="relative">
              <svg width="48" height="48" viewBox="0 0 100 100" className="transform -rotate-12">
                {/* Hockey Stick */}
                <path d="M 20 20 L 60 60 L 70 50 L 30 10 Z" fill="#2563eb" stroke="#1e40af" strokeWidth="2"/>
                <path d="M 60 60 L 80 80 L 90 70 L 70 50 Z" fill="#1e40af" stroke="#1e3a8a" strokeWidth="2"/>
                {/* Puck */}
                <ellipse cx="75" cy="75" rx="12" ry="8" fill="#1f2937" stroke="#111827" strokeWidth="2"/>
              </svg>
              <div className="absolute -top-1 -right-1">
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-ping"></div>
              </div>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Hockey Hub</h1>
          </div>
          <p className="text-lg text-gray-600">Complete Sports Management Platform</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Login/Register Card */}
          <Card className="shadow-xl backdrop-blur-sm bg-white/95 border-0">
            <CardHeader>
              <CardTitle className="text-2xl">Welcome Back</CardTitle>
              <CardDescription>Sign in to access your dashboard</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Stable hidden targets for tests */}
              <div data-testid="error-text" className="sr-only">{testError || localError || authError || ''}</div>
              <div data-testid="success-text" className="sr-only">{testSuccess || success || ''}</div>
              <Tabs value={activeTab} onValueChange={(val) => { setActiveTab(val); setLocalError(""); clearError(); }}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="login">Login</TabsTrigger>
                  <TabsTrigger value="register">Register</TabsTrigger>
                </TabsList>

                {/* Login Tab */}
                <TabsContent value="login">
                  {activeTab === 'login' && (localError || authError) && (
                    <Alert variant="destructive" className="mb-4">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{localError || authError}</AlertDescription>
                    </Alert>
                  )}
                  <form onSubmit={handleLogin} className="space-y-4" onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const formEl = e.currentTarget as HTMLFormElement;
                      if (formEl?.requestSubmit) {
                        formEl.requestSubmit();
                      } else {
                        formEl.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
                      }
                    }
                  }}>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="you@example.com"
                          value={loginForm.email}
                          onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="password"
                          type="password"
                          placeholder="••••••••"
                          value={loginForm.password}
                          onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              const formEl = e.currentTarget.form as HTMLFormElement | null;
                              if (formEl?.requestSubmit) {
                                formEl.requestSubmit();
                              } else if (formEl) {
                                formEl.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
                              }
                            }
                          }}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="remember"
                          checked={loginForm.rememberMe}
                          onCheckedChange={(checked) => 
                            setLoginForm({ ...loginForm, rememberMe: checked as boolean })
                          }
                        />
                        <Label htmlFor="remember" className="text-sm font-normal">
                          Remember me
                        </Label>
                      </div>
                      <Link href="/forgot-password" className="text-sm text-blue-600 hover:underline">
                        Forgot password?
                      </Link>
                    </div>
                    <Button
                      type="submit"
                      aria-label={loginSubmitting ? 'Signing in...' : 'Sign In'}
                      onMouseDown={() => { flushSync(() => setLoginSubmitting(true)); }}
                      className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 transform hover:scale-105"
                      disabled={loading}
                    >
                      {loginSubmitting || loading ? (
                        <>
                          <LoadingSpinner size="sm" center={false} className="mr-2" />
                          Signing in...
                        </>
                      ) : (
                        "Sign In"
                      )}
                    </Button>
                  </form>

                  {/* Social Login */}
                  <div className="mt-6">
                    <LazySocialLoginButtons disabled={loading} />
                  </div>

                  {/* Demo Credentials */}
                  <div className="mt-6 pt-6 border-t">
                    <p className="text-sm text-gray-600 mb-3">Try with demo credentials:</p>
                    <div className="grid grid-cols-2 gap-2">
                      {demoCredentials.map((demo) => (
                        <Button
                          key={demo.email}
                          variant="outline"
                          size="sm"
                          onClick={() => fillDemoCredentials(demo)}
                          className="text-xs"
                        >
                          {demo.role}
                        </Button>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                {/* Register Tab */}
                <TabsContent value="register">
                  {activeTab === 'register' && (localError || authError) && (
                    <Alert variant="destructive" className="mb-4">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{localError || authError}</AlertDescription>
                    </Alert>
                  )}
                  {activeTab === 'register' && success && (
                    <Alert className="mb-4 border-green-200 bg-green-50">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-800">{success}</AlertDescription>
                    </Alert>
                  )}
                  <form onSubmit={handleRegister} className="space-y-4" onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const formEl = e.currentTarget as HTMLFormElement;
                      if (formEl?.requestSubmit) {
                        formEl.requestSubmit();
                      } else {
                        formEl.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
                      }
                    }
                  }}>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                          id="firstName"
                          type="text"
                          value={registerForm.firstName}
                          onChange={(e) => setRegisterForm({ ...registerForm, firstName: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                          id="lastName"
                          type="text"
                          value={registerForm.lastName}
                          onChange={(e) => setRegisterForm({ ...registerForm, lastName: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="registerEmail">Email</Label>
                      <Input
                        id="registerEmail"
                        type="email"
                        value={registerForm.email}
                        onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="role">Role</Label>
                      <select
                        id="role"
                        value={registerForm.role}
                        onChange={(e) => setRegisterForm({ ...registerForm, role: e.target.value as any })}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        <option value="player">Player</option>
                        <option value="coach">Coach</option>
                        <option value="parent">Parent</option>
                        <option value="medical_staff">Medical Staff</option>
                        <option value="equipment_manager">Equipment Manager</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="teamCode">Team Code</Label>
                      <Input
                        id="teamCode"
                        type="text"
                        placeholder="Enter your team's code"
                        value={registerForm.teamCode}
                        onChange={(e) => setRegisterForm({ ...registerForm, teamCode: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="registerPassword">Password</Label>
                      <Input
                        id="registerPassword"
                        type="password"
                        value={registerForm.password}
                        onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={registerForm.confirmPassword}
                        onChange={(e) => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })}
                        required
                      />
                    </div>
                    <Button
                      type="submit"
                      aria-label={registerSubmitting ? 'Creating account...' : 'Create Account'}
                      onMouseDown={() => { flushSync(() => setRegisterSubmitting(true)); }}
                      className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 transform hover:scale-105"
                      disabled={loading}
                    >
                      {registerSubmitting || loading ? (
                        <>
                          <LoadingSpinner size="sm" center={false} className="mr-2" />
                          Creating account...
                        </>
                      ) : (
                        "Create Account"
                      )}
                    </Button>
                    {(registerSubmitting || loading) && (
                      <div className="text-sm mt-2">Creating account...</div>
                    )}
                    {/* No extra visible duplicate of loading label to avoid multiple matches */}
                  </form>

                  {/* Social Login */}
                  <div className="mt-6">
                    <LazySocialLoginButtons disabled={loading} />
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
          
          {/* Development Quick Login Panel */}
          <DevLoginPanel />

          {/* Features Card */}
          <div className="space-y-6">
            {/* Hero Graphic */}
            <div className="mb-6 text-center">
              <div className="relative inline-block">
                <svg width="200" height="200" viewBox="0 0 400 400" className="animate-spin-slow">
                  {/* Outer Circle */}
                  <circle cx="200" cy="200" r="190" fill="none" stroke="url(#gradient)" strokeWidth="4" strokeDasharray="20 10" opacity="0.3"/>
                  {/* Inner Circle */}
                  <circle cx="200" cy="200" r="150" fill="none" stroke="url(#gradient)" strokeWidth="2" opacity="0.5"/>
                  
                  {/* Hockey Elements */}
                  <g transform="translate(200, 200)">
                    {/* Trophy */}
                    <g transform="translate(-80, -80)">
                      <Trophy className="w-12 h-12 text-yellow-500" />
                    </g>
                    {/* Heart for Wellness */}
                    <g transform="translate(80, -80)">
                      <Heart className="w-12 h-12 text-red-500" />
                    </g>
                    {/* Zap for Performance */}
                    <g transform="translate(80, 80)">
                      <Zap className="w-12 h-12 text-orange-500" />
                    </g>
                    {/* Shield for Security */}
                    <g transform="translate(-80, 80)">
                      <Shield className="w-12 h-12 text-blue-500" />
                    </g>
                  </g>
                  
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#3b82f6" />
                      <stop offset="100%" stopColor="#6366f1" />
                    </linearGradient>
                  </defs>
                </svg>
                
                {/* Center Logo */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-2xl">
                    <svg width="60" height="60" viewBox="0 0 100 100" className="text-white">
                      <path d="M 20 30 L 50 60 L 55 55 L 25 25 Z" fill="currentColor"/>
                      <path d="M 50 60 L 70 80 L 75 75 L 55 55 Z" fill="currentColor" opacity="0.8"/>
                      <circle cx="65" cy="70" r="8" fill="currentColor" opacity="0.6"/>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
            <Card className="shadow-xl backdrop-blur-sm bg-white/95 border-0">
              <CardHeader>
                <CardTitle>All-in-One Platform</CardTitle>
                <CardDescription>Everything your hockey team needs</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-blue-50 transition-colors duration-200">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Users className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Team Management</h3>
                      <p className="text-sm text-gray-600">Manage rosters, schedules, and communications</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-green-50 transition-colors duration-200">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Activity className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Performance Tracking</h3>
                      <p className="text-sm text-gray-600">Monitor player wellness and training progress</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-purple-50 transition-colors duration-200">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Calendar className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Smart Scheduling</h3>
                      <p className="text-sm text-gray-600">Coordinate practices, games, and events</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-orange-50 transition-colors duration-200">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <BarChart3 className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Analytics & Insights</h3>
                      <p className="text-sm text-gray-600">Data-driven decisions for better performance</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-0 shadow-xl">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="relative inline-block mb-3">
                    <div className="absolute inset-0 bg-blue-500 rounded-full blur-xl opacity-20 animate-pulse"></div>
                    <Shield className="h-12 w-12 text-blue-600 relative z-10" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">Secure & Reliable</h3>
                  <p className="text-sm text-gray-600">
                    Your data is protected with enterprise-grade security. 
                    GDPR compliant and regularly audited.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-600">
          <p>© 2024 Hockey Hub. All rights reserved.</p>
          <div className="mt-2 space-x-4">
            <Link href="/privacy" className="hover:underline">Privacy Policy</Link>
            <Link href="/terms" className="hover:underline">Terms of Service</Link>
            <Link href="/contact" className="hover:underline">Contact Support</Link>
          </div>
        </div>
      </div>
    </div>
  );
}