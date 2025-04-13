import Image from "next/image";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Input } from "../components/ui/input";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "../components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";

// Define a type for the calendar event data we expect
interface CalendarEvent {
  id: string;
  title: string;
  start: string; // ISO 8601 date string
  end: string;   // ISO 8601 date string
  type: string; // Adjust based on actual type from backend if needed
  description?: string;
}

// Function to fetch calendar events
async function getCalendarEvents(): Promise<CalendarEvent[]> {
  try {
    // Get the current host from the environment or default to localhost:3001
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';
    const res = await fetch(`${baseUrl}/api/calendar/events`, {
      cache: 'no-store',
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!res.ok) {
      console.error(`API Error: ${res.status} ${res.statusText}`);
      return [];
    }

    const data = await res.json();
    
    // Validate and transform the response data
    if (data && data.value && Array.isArray(data.value)) {
      return data.value as CalendarEvent[];
    }
    
    if (Array.isArray(data)) {
      return data as CalendarEvent[];
    }

    console.warn("Unexpected data format received:", data);
    return [];

  } catch (error) {
    // Log the specific error for debugging
    console.error("Failed to fetch calendar events:", {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
    return [];
  }
}

// Make the component async to use await for data fetching
export default async function Home() {
  // Fetch events when the component renders on the server
  const events = await getCalendarEvents();

  return (
    <main className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-2">Hockey App UI-komponenter</h1>
      <p className="text-muted-foreground mb-6">Baserad på shadcn/ui och Tailwind CSS</p>
      <Tabs defaultValue="overview" className="w-full mb-8">
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Översikt</TabsTrigger>
          <TabsTrigger value="calendar">Kalender</TabsTrigger>
          <TabsTrigger value="training">Träning</TabsTrigger>
          <TabsTrigger value="medical">Medicinskt</TabsTrigger>
          <TabsTrigger value="communication">Kommunikation</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          {/* Content for Overview tab can go here */}
        </TabsContent>
        <TabsContent value="calendar">
          {/* Content for Calendar tab can go here */}
        </TabsContent>
        {/* Add other TabsContent sections as needed */}
      </Tabs>

      <h2 className="text-xl font-semibold mb-4">Hockey App färgschema</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Primary Color */}
        <Card className="p-6 bg-primary text-primary-foreground">
          <h3 className="text-lg font-medium mb-2">Primär</h3>
          <p className="text-sm opacity-80">Used for main actions, active states.</p>
        </Card>
        {/* Secondary Color */}
        <Card className="p-6 bg-secondary text-secondary-foreground">
          <h3 className="text-lg font-medium mb-2">Sekundär</h3>
          <p className="text-sm opacity-80">Used for supporting elements, backgrounds.</p>
        </Card>
        {/* Accent Color */}
        <Card className="p-6 bg-accent text-accent-foreground">
          <h3 className="text-lg font-medium mb-2">Accent</h3>
          <p className="text-sm opacity-80">Used for highlights, hover states.</p>
        </Card>
        {/* Muted Color */}
        <Card className="p-6 bg-muted text-muted-foreground">
          <h3 className="text-lg font-medium mb-2">Muted</h3>
          <p className="text-sm opacity-80">Used for borders, disabled states, subtle text.</p>
        </Card>
        {/* Destructive Color */}
        <Card className="p-6 bg-destructive text-destructive-foreground">
          <h3 className="text-lg font-medium mb-2">Destructive</h3>
          <p className="text-sm opacity-80">Used for destructive actions (delete, error).</p>
        </Card>
      </div>

      <Button>Click Me</Button>

      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle>Sample Card</CardTitle>
          <CardDescription>This is a shadcn/ui card component.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Card content goes here. You can add forms, text, or other components.</p>
        </CardContent>
        <CardFooter>
          <Button variant="outline">View Details</Button>
        </CardFooter>
      </Card>

      <div className="w-[350px]">
        <Input type="email" placeholder="Email" />
      </div>

      <div className="mb-8">
        <Select defaultValue="all">
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Events</SelectItem>
            <SelectItem value="game">Games</SelectItem>
            <SelectItem value="practice">Practice</SelectItem>
            <SelectItem value="tournament">Tournament</SelectItem>
            <SelectItem value="meeting">Meeting</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Table className="w-[800px] border">
        <TableCaption>A list of your upcoming events.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Start Time</TableHead>
            <TableHead>End Time</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {events.length > 0 ? (
            events.map((event) => (
              <TableRow key={event.id}>
                <TableCell className="font-medium">{event.id}</TableCell>
                <TableCell>{event.title}</TableCell>
                <TableCell>{event.type}</TableCell>
                <TableCell>{new Date(event.start).toLocaleString()}</TableCell>
                <TableCell>{new Date(event.end).toLocaleString()}</TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center">
                <div className="flex flex-col items-center justify-center">
                  {events.length === 0 ? (
                    <div className="text-muted-foreground">
                      <p className="font-medium">Calendar Service is not available.</p>
                      <p className="text-sm">Please ensure the service is running on port 3010.</p>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No events found.</p>
                  )}
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline">Open Dialog</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit profile</DialogTitle>
            <DialogDescription>
              Make changes to your profile here. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="name" className="text-right">Name</label>
              <Input id="name" defaultValue="Pedro Duarte" className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
               <label htmlFor="username" className="text-right">Username</label>
              <Input id="username" defaultValue="@peduarte" className="col-span-3" />
            </div>
        </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary">Close</Button> 
            </DialogClose>
            <Button type="submit">Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      </main>
  );
}
