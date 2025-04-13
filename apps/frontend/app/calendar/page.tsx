import CalendarView from "../../src/components/CalendarView"; // Adjust import path relative to the new page

// Define a type for the calendar event data we expect (can be moved to shared types)
interface CalendarEvent {
  id: string;
  title: string;
  start: string; // ISO 8601 date string
  end: string;   // ISO 8601 date string
  type: string; 
  description?: string;
}

// Function to fetch calendar events (runs on server) with retry logic
async function getCalendarEvents(retries = 3): Promise<CalendarEvent[]> {
  try {
    const response = await fetch('http://127.0.0.1:3003/events', { 
      cache: 'no-store',
    });

    if (!response.ok) {
      console.error(`Calendar API Error: ${response.status} ${response.statusText}`);
      return []; // Don't retry on server errors
    }
    const data = await response.json();
    return Array.isArray(data) ? data : []; 

  } catch (error) {
    const errorCode = (error as any)?.cause?.code || (error as any)?.code; 
    
    // Only retry on connection refused errors and if retries are left
    if (errorCode === 'ECONNREFUSED' && retries > 0) {
      console.warn(`Connection refused, retrying... (${retries} retries left)`);
      await new Promise(resolve => setTimeout(resolve, 500)); // Wait 500ms
      return getCalendarEvents(retries - 1); // Recursive call
    }

    // Log other errors or if retries are exhausted
    let errorMessage = 'Unknown error';
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    console.error("Failed to fetch calendar events after retries:", {
      error: errorMessage,
      code: errorCode, 
      details: error, 
      timestamp: new Date().toISOString()
    });
    return []; 
  }
}

// Calendar Page component (Server Component)
export default async function CalendarPage() {
  const events = await getCalendarEvents(); 

  return (
    <main className="container mx-auto p-8">
      <CalendarView events={events} /> 
    </main>
  );
} 