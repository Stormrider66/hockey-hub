import { useEffect, useState } from 'react';

interface InitialData {
  players: any[];
  sessions: any[];
  calendarEvents: any[];
  teams: any[];
  user: any;
}

export function useInitialData() {
  const [initialData, setInitialData] = useState<InitialData | null>(null);

  useEffect(() => {
    // Check if we have server-provided initial data
    if (typeof window !== 'undefined' && (window as any).__PHYSICAL_TRAINER_INITIAL_DATA__) {
      const data = (window as any).__PHYSICAL_TRAINER_INITIAL_DATA__;
      setInitialData(data);
      
      // Clean up to prevent memory leaks
      delete (window as any).__PHYSICAL_TRAINER_INITIAL_DATA__;
    }
  }, []);

  return initialData;
}