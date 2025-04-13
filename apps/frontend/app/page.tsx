import CalendarView from "../src/components/CalendarView";

// Define a type for the calendar event data we expect
interface CalendarEvent {
  id: string;
  title: string;
  start: string; // ISO 8601 date string
  end: string;   // ISO 8601 date string
  type: string; // Adjust based on actual type from backend if needed
  description?: string;
}

// Function to fetch calendar events (runs on server)
async function getCalendarEvents(): Promise<CalendarEvent[]> {
  try {
    const response = await fetch('http://127.0.0.1:3003/events', { 
      cache: 'no-store',
    });

    if (!response.ok) {
      console.error(`Calendar API Error: ${response.status} ${response.statusText}`);
      return []; 
    }
    const data = await response.json();
    return Array.isArray(data) ? data : []; 
  } catch (error) {
    let errorMessage = 'Unknown error';
    // Check for common network error codes
    const errorCode = (error as any)?.cause?.code || (error as any)?.code; 
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    console.error("Failed to fetch calendar events:", {
      error: errorMessage,
      code: errorCode, // Log the specific code if available
      details: error, 
      timestamp: new Date().toISOString()
    });
    return []; 
  }
}

// Page component (remains Server Component)
export default async function Home() {
  const events = await getCalendarEvents();

  return (
    <main className="container mx-auto p-8">
      <CalendarView events={events} />
    </main>
  );
}
