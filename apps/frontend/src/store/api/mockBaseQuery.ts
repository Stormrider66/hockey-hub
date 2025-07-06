import { BaseQueryFn } from '@reduxjs/toolkit/query';
import { mockBaseQuery as mockAuthBaseQuery } from './mockAuthApi';

// Mock data for various APIs
const mockNotificationData = {
  unreadCount: 3,
  notifications: [
    {
      id: '1',
      user_id: 'mock-user-1',
      type: 'announcement',
      title: 'Welcome to Hockey Hub!',
      content: 'Get started by exploring your dashboard.',
      priority: 'normal',
      status: 'unread',
      channel: 'in_app',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '2',
      user_id: 'mock-user-1',
      type: 'training_assigned',
      title: 'New Training Session',
      content: 'Your coach has assigned a new training session.',
      priority: 'high',
      status: 'unread',
      channel: 'in_app',
      created_at: new Date(Date.now() - 3600000).toISOString(),
      updated_at: new Date(Date.now() - 3600000).toISOString(),
    },
  ],
  stats: {
    totalNotifications: 10,
    unreadCount: 3,
    readCount: 7,
  },
};

const mockDashboardData = {
  player: {
    todaySchedule: [
      { id: '1', title: 'Morning Practice', time: '09:00', location: 'Main Rink' },
      { id: '2', title: 'Team Meeting', time: '14:00', location: 'Conference Room' },
    ],
    upcomingTraining: [
      { id: '1', title: 'Strength Training', date: 'Tomorrow', trainer: 'Coach Johnson' },
      { id: '2', title: 'Skills Development', date: 'Friday', trainer: 'Coach Smith' },
    ],
    wellnessStatus: {
      lastSubmission: new Date().toISOString(),
      overallScore: 8.5,
      trend: 'improving',
    },
  },
  coach: {
    teamOverview: {
      totalPlayers: 24,
      activeToday: 22,
      injuredPlayers: 2,
    },
    todaySchedule: [
      { id: '1', title: 'Morning Practice', time: '09:00', players: 22 },
      { id: '2', title: 'Individual Training', time: '15:00', players: 5 },
    ],
  },
};

// Comprehensive mock base query that handles all API endpoints
export const mockBaseQuery: BaseQueryFn<
  string | { url: string; method?: string; body?: any; params?: any },
  unknown,
  unknown
> = async (args, api, extraOptions) => {
  // Check if mock mode is enabled
  const isMockMode = process.env.NEXT_PUBLIC_ENABLE_MOCK_AUTH === 'true';
  if (!isMockMode) {
    throw new Error('Mock mode is not enabled');
  }

  // Parse the request
  const { url, method = 'GET', body, params } = 
    typeof args === 'string' ? { url: args } : args;

  // Add artificial delay to simulate network
  await new Promise(resolve => setTimeout(resolve, 300));

  console.log(`🔧 Mock API: ${method} ${url}`, { body, params });

  // Route to appropriate mock handler based on URL
  try {
    // Auth endpoints (handled by mockAuthApi)
    if (url.includes('/auth/') || url.includes('/login') || url.includes('/register')) {
      return mockAuthBaseQuery(args, api, extraOptions);
    }

    // Notification endpoints
    if (url.includes('/notifications')) {
      if (url.includes('/unread-count')) {
        return { data: { count: mockNotificationData.unreadCount } };
      }
      if (url.includes('/stats')) {
        return { data: mockNotificationData.stats };
      }
      if (method === 'GET') {
        return { 
          data: {
            notifications: mockNotificationData.notifications,
            total: mockNotificationData.notifications.length,
            unreadCount: mockNotificationData.unreadCount,
          }
        };
      }
      if (method === 'PATCH' && url.includes('/read')) {
        return { data: { success: true } };
      }
      if (method === 'PATCH' && url.includes('/bulk-read')) {
        return { data: { success: true, updated: body?.notificationIds?.length || 0 } };
      }
    }

    // Dashboard endpoints
    if (url.includes('/dashboard')) {
      const role = localStorage.getItem('mock_user_role') || 'player';
      return { data: mockDashboardData[role as keyof typeof mockDashboardData] || {} };
    }

    // Player endpoints
    if (url.includes('/players')) {
      if (url.includes('/overview')) {
        return { 
          data: {
            player: {
              id: '1',
              name: 'Test Player',
              team: 'Hockey Hub Team',
              position: 'Forward',
              jerseyNumber: 99,
            },
            stats: {
              goals: 15,
              assists: 22,
              points: 37,
              plusMinus: 12,
            },
            wellness: {
              hrv: 65,
              sleepQuality: 8,
              fatigue: 3,
              mood: 9,
            },
          }
        };
      }
      if (url.includes('/wellness') && method === 'POST') {
        return { data: { success: true, message: 'Wellness data submitted' } };
      }
      if (url.includes('/training/complete') && method === 'POST') {
        return { data: { success: true, message: 'Training marked as complete' } };
      }
    }

    // Training endpoints
    if (url.includes('/training')) {
      if (url.includes('/sessions')) {
        return {
          data: {
            sessions: [
              {
                id: '1',
                title: 'Morning Practice',
                date: new Date().toISOString(),
                duration: 90,
                type: 'team',
                status: 'scheduled',
              },
              {
                id: '2',
                title: 'Skills Development',
                date: new Date(Date.now() + 86400000).toISOString(),
                duration: 60,
                type: 'individual',
                status: 'scheduled',
              },
            ],
            total: 2,
          }
        };
      }
    }

    // Teams endpoints
    if (url.includes('/teams')) {
      return {
        data: {
          teams: [
            {
              id: '1',
              name: 'Hockey Hub Elite',
              level: 'AAA',
              players: 22,
              coaches: 3,
            },
          ],
          total: 1,
        }
      };
    }

    // Calendar endpoints
    if (url.includes('/calendar')) {
      return {
        data: {
          events: [
            {
              id: '1',
              title: 'Team Practice',
              start: new Date().toISOString(),
              end: new Date(Date.now() + 7200000).toISOString(),
              type: 'practice',
              location: 'Main Rink',
            },
          ],
          total: 1,
        }
      };
    }

    // Default success response for unhandled endpoints
    console.warn(`Mock API: No specific handler for ${method} ${url}, returning generic success`);
    return { data: { success: true, message: 'Mock response' } };

  } catch (error) {
    console.error('Mock API Error:', error);
    return {
      error: {
        status: 500,
        data: { message: 'Mock API error', error: error.message },
      },
    };
  }
};

// Helper to create a mock-enabled base query
export const createMockEnabledBaseQuery = (originalBaseQuery: any) => {
  return async (args: any, api: any, extraOptions: any) => {
    const isMockMode = process.env.NEXT_PUBLIC_ENABLE_MOCK_AUTH === 'true';
    
    if (isMockMode) {
      return mockBaseQuery(args, api, extraOptions);
    }
    
    return originalBaseQuery(args, api, extraOptions);
  };
};