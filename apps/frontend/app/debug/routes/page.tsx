"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function DebugRoutesPage() {
  const router = useRouter();

  const routes = [
    { path: '/player', label: 'Player Dashboard' },
    { path: '/player/calendar', label: 'Player Calendar' },
    { path: '/coach', label: 'Coach Dashboard' },
    { path: '/coach/calendar', label: 'Coach Calendar' },
    { path: '/chat', label: 'Chat' },
    { path: '/settings', label: 'Settings' },
  ];

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Debug Routes</h1>
      
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold mb-2">Using Link component:</h2>
          <div className="flex flex-wrap gap-2">
            {routes.map(route => (
              <Link key={route.path} href={route.path}>
                <Button variant="outline">{route.label}</Button>
              </Link>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">Using router.push:</h2>
          <div className="flex flex-wrap gap-2">
            {routes.map(route => (
              <Button 
                key={route.path}
                variant="secondary"
                onClick={() => router.push(route.path)}
              >
                {route.label}
              </Button>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">Using window.location:</h2>
          <div className="flex flex-wrap gap-2">
            {routes.map(route => (
              <Button 
                key={route.path}
                variant="destructive"
                onClick={() => window.location.href = route.path}
              >
                {route.label}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}