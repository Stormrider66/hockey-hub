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
  rightContent?: React.ReactNode;
}

export function DashboardHeader({ title, subtitle, role, rightContent }: DashboardHeaderProps) {
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
    <div className="flex justify-between items-center mb-4 p-3 bg-white border-b">
      <div className="flex items-baseline gap-3">
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
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
        {rightContent ? (
          rightContent
        ) : (
          <Button 
            size="default"
            onClick={() => handleNavigation('/settings')}
          >
            <Settings className="mr-2 h-4 w-4" />
            {getTranslation('navigation.settings')}
          </Button>
        )}
      </div>
    </div>
  );
}