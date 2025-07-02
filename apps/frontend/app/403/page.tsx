"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Ban, Home, ArrowLeft, HelpCircle, Mail } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function ForbiddenPage() {
  const router = useRouter();
  const { user } = useAuth();

  const handleGoBack = () => {
    router.back();
  };

  const userRole = user?.role || "User";

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
      <Card className="max-w-lg w-full shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <Ban className="h-10 w-10 text-red-600" />
          </div>
          <CardTitle className="text-3xl font-bold text-gray-900">403 - Access Forbidden</CardTitle>
          <CardDescription className="text-lg mt-2">
            You don't have permission to view this page
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="font-semibold text-red-900 mb-1">Why am I seeing this?</h3>
            <p className="text-sm text-red-800">
              You're logged in as <span className="font-semibold">{userRole}</span>, but this page requires different permissions.
            </p>
            <div className="mt-3 space-y-2">
              <p className="text-sm text-red-800">This page may be restricted to:</p>
              <ul className="list-disc list-inside text-sm text-red-800 space-y-1">
                <li>Administrators only</li>
                <li>Specific user roles (Coach, Medical Staff, etc.)</li>
                <li>Team members with special permissions</li>
                <li>Premium subscribers</li>
              </ul>
            </div>
          </div>

          <div className="space-y-3">
            <Button
              onClick={handleGoBack}
              className="w-full"
              variant="default"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
            
            <Link href="/" className="block">
              <Button variant="outline" className="w-full">
                <Home className="mr-2 h-4 w-4" />
                Go to Dashboard
              </Button>
            </Link>

            <Link href="/help" className="block">
              <Button variant="ghost" className="w-full">
                <HelpCircle className="mr-2 h-4 w-4" />
                View Help Center
              </Button>
            </Link>
          </div>

          <div className="border-t pt-6">
            <div className="text-center">
              <h4 className="font-semibold text-gray-900 mb-2">Need access?</h4>
              <p className="text-sm text-gray-600 mb-4">
                If you believe you should have access to this page, contact your team administrator or support.
              </p>
              <Link href="/contact" className="inline-flex items-center text-sm text-blue-600 hover:underline">
                <Mail className="mr-1 h-4 w-4" />
                Contact Support
              </Link>
            </div>
          </div>

          <div className="text-center text-xs text-gray-500">
            Error ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}
          </div>
        </CardContent>
      </Card>

      {/* Decorative Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-red-200 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-red-300 rounded-full opacity-20 blur-3xl"></div>
      </div>
    </div>
  );
}