'use client';

import React from 'react';
import ClientCalendarView from '@/components/ClientCalendarView';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

const FysCoachPage = () => {
  const router = useRouter();

  return (
    <main className="container mx-auto p-8">
      <div className="flex gap-4 mb-6">
        <Button variant="outline" onClick={() => router.push('/fys-coach')}>Dashboard</Button>
        <Button onClick={() => router.push('/fys-coach/exercises')}>Exercise Library</Button>
        <Button onClick={() => router.push('/fys-coach/programs')}>Program</Button>
      </div>
      <h1 className="text-2xl font-bold mb-6">Fys-Coach Dashboard</h1>
      <div className="mb-4">
        <Button onClick={() => router.push('/fys-coach/programs')}>Skapa händerls</Button>
      </div>
      <ClientCalendarView />
    </main>
  );
}

export default FysCoachPage; 