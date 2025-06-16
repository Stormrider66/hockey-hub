import { NextResponse } from 'next/server';

// Mock data for development
const mockEvents = [
  {
    id: '1',
    title: 'Ice Training Session',
    start: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(), // Tomorrow
    end: new Date(Date.now() + 1000 * 60 * 60 * 25).toISOString(),   // Tomorrow + 1 hour
    type: 'ice-training',
    description: 'Regular ice training session'
  },
  {
    id: '2',
    title: 'Team Meeting',
    start: new Date(Date.now() + 1000 * 60 * 60 * 48).toISOString(), // Day after tomorrow
    end: new Date(Date.now() + 1000 * 60 * 60 * 49).toISOString(),   // Day after tomorrow + 1 hour
    type: 'meeting',
    description: 'Weekly team strategy meeting'
  },
  {
    id: '3',
    title: 'Physical Training',
    start: new Date(Date.now() + 1000 * 60 * 60 * 72).toISOString(), // 3 days from now
    end: new Date(Date.now() + 1000 * 60 * 60 * 73).toISOString(),   // 3 days from now + 1 hour
    type: 'physical-training',
    description: 'Strength and conditioning session'
  }
];

export async function GET() {
  try {
    // Return mock data instead of making the external call
    return NextResponse.json(mockEvents);
    
  } catch (error) {
    console.error('Calendar API Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 