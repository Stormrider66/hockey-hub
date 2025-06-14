"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Calendar, MessageSquare, Settings, ArrowLeft } from 'lucide-react';

interface DashboardHeaderProps {
  title: string;
  subtitle?: string;
  role: string;
}

export function DashboardHeader({ title, subtitle, role }: DashboardHeaderProps) {
  return (
    <div className="flex justify-between items-center mb-6 p-4 bg-white border-b">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
        {subtitle && <p className="text-gray-600 mt-1">{subtitle}</p>}
      </div>
      <div className="flex gap-2">
        <Link href={`/${role}`}>
          <Button variant="outline" size="default">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Dashboard
          </Button>
        </Link>
        <Link href={`/${role}/calendar`}>
          <Button variant="outline" size="default">
            <Calendar className="mr-2 h-4 w-4" />
            Calendar
          </Button>
        </Link>
        <Link href="/chat">
          <Button variant="outline" size="default">
            <MessageSquare className="mr-2 h-4 w-4" />
            Team Chat
          </Button>
        </Link>
        <Link href="/settings">
          <Button size="default">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
        </Link>
      </div>
    </div>
  );
} 