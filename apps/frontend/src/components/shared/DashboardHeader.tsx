"use client";

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Calendar, MessageSquare, Settings, ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { CompactLanguageSelector } from '@/components/LanguageSelector';

interface DashboardHeaderProps {
  title: string;
  subtitle?: string;
  role: string;
}

export function DashboardHeader({ title, subtitle, role }: DashboardHeaderProps) {
  const { t, ready } = useTranslation('common');
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fallback translations if i18n isn't ready
  const getTranslation = (key: string) => {
    if (!ready || !t) {
      const fallbacks: Record<string, string> = {
        'navigation.dashboard': 'Dashboard',
        'navigation.calendar': 'Calendar', 
        'navigation.messages': 'Messages',
        'navigation.settings': 'Settings'
      };
      return fallbacks[key] || key;
    }
    return t(key);
  };

  const handleNavigation = (path: string) => {
    if (mounted) {
      router.push(path);
    }
  };
  
  return (
    <div className="flex justify-between items-center mb-6 p-4 bg-white border-b">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
        {subtitle && <p className="text-gray-600 mt-1">{subtitle}</p>}
      </div>
      <div className="flex gap-2 items-center">
        <CompactLanguageSelector className="mr-2" />
        <Button 
          variant="outline" 
          size="default"
          onClick={() => handleNavigation(`/${role}`)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {getTranslation('navigation.dashboard')}
        </Button>
        <Button 
          variant="outline" 
          size="default"
          onClick={() => handleNavigation('/calendar')}
        >
          <Calendar className="mr-2 h-4 w-4" />
          {getTranslation('navigation.calendar')}
        </Button>
        <Button 
          variant="outline" 
          size="default"
          onClick={() => handleNavigation('/chat')}
        >
          <MessageSquare className="mr-2 h-4 w-4" />
          {getTranslation('navigation.messages')}
        </Button>
        <Button 
          size="default"
          onClick={() => handleNavigation('/settings')}
        >
          <Settings className="mr-2 h-4 w-4" />
          {getTranslation('navigation.settings')}
        </Button>
      </div>
    </div>
  );
}