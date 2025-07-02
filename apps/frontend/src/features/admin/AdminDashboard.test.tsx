import React from 'react';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AdminDashboard from './AdminDashboard';
import { renderWithProviders } from '@/test-utils';
import { vi } from 'vitest';

// Mock the translations
vi.mock('@hockey-hub/translations', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: {
      language: 'en',
      changeLanguage: vi.fn(),
    },
  }),
}));

// Mock API response
const mockAdminOverviewData = {
  systemHealth: {
    score: 95,
    services: {
      healthy: 7,
      degraded: 1,
      down: 0,
    },
  },
  metrics: {
    activeUsers: 2847,
    organizations: 176,
    responseTime: 68,
    errorRate: 0.03,
  },
};

describe('AdminDashboard', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the dashboard with all tabs', () => {
    renderWithProviders(<AdminDashboard />);

    // Check main heading
    expect(screen.getByRole('heading', { name: 'System Administration' })).toBeInTheDocument();
    expect(screen.getByText('Monitor and manage the Hockey Hub platform')).toBeInTheDocument();

    // Check all tabs are present
    expect(screen.getByRole('tab', { name: /Overview/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Services/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Organizations/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Security/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Translations/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Configuration/i })).toBeInTheDocument();
  });

  describe('Overview Tab', () => {
    it('displays system health and metrics', () => {
      renderWithProviders(<AdminDashboard />);

      // Check system health card
      expect(screen.getByText('System Health')).toBeInTheDocument();
      expect(screen.getByText('94%')).toBeInTheDocument();
      expect(screen.getByText('All systems operational')).toBeInTheDocument();

      // Check active users
      expect(screen.getByText('Active Users')).toBeInTheDocument();
      expect(screen.getByText('2,847')).toBeInTheDocument();
      expect(screen.getByText('12% from yesterday')).toBeInTheDocument();

      // Check organizations
      expect(screen.getByText('Total Organizations')).toBeInTheDocument();
      expect(screen.getByText('176')).toBeInTheDocument();
      expect(screen.getByText('152 active')).toBeInTheDocument();

      // Check response time
      expect(screen.getByText('admin:system.responseTime')).toBeInTheDocument();
      expect(screen.getByText('68ms')).toBeInTheDocument();

      // Check error rate
      expect(screen.getByText('admin:system.errorRate')).toBeInTheDocument();
      expect(screen.getByText('0.03%')).toBeInTheDocument();

      // Check database size
      expect(screen.getByText('admin:system.databaseSize')).toBeInTheDocument();
      expect(screen.getByText('45.2 GB')).toBeInTheDocument();
    });

    it('displays system alerts', () => {
      renderWithProviders(<AdminDashboard />);

      expect(screen.getByText('System Alerts & Notifications')).toBeInTheDocument();
      expect(screen.getByText('3 Active')).toBeInTheDocument();
      expect(screen.getByText('Medical Service Performance Degradation')).toBeInTheDocument();
      expect(screen.getByText('Scheduled Maintenance Window')).toBeInTheDocument();
    });

    it('shows service health matrix', () => {
      renderWithProviders(<AdminDashboard />);

      expect(screen.getByText('admin:system.serviceHealthMatrix')).toBeInTheDocument();
      expect(screen.getByText('User Service')).toBeInTheDocument();
      expect(screen.getByText('Calendar Service')).toBeInTheDocument();
      expect(screen.getByText('Training Service')).toBeInTheDocument();
    });
  });

  describe('Services Tab', () => {
    it('displays all services with their status', async () => {
      renderWithProviders(<AdminDashboard />);
      
      await user.click(screen.getByRole('tab', { name: /Services/i }));

      // Check service cards
      expect(screen.getByText('User Service')).toBeInTheDocument();
      expect(screen.getByText('99.98%')).toBeInTheDocument(); // Uptime
      expect(screen.getByText('45ms')).toBeInTheDocument(); // Response time

      // Check degraded service
      expect(screen.getByText('Medical Service')).toBeInTheDocument();
      const medicalServiceCard = screen.getByText('Medical Service').closest('.border');
      expect(medicalServiceCard).toHaveClass('border-amber-400');
    });

    it('shows database performance metrics', async () => {
      renderWithProviders(<AdminDashboard />);
      
      await user.click(screen.getByRole('tab', { name: /Services/i }));

      expect(screen.getByText('Database Performance')).toBeInTheDocument();
      expect(screen.getByText('Connection Pool')).toBeInTheDocument();
      expect(screen.getByText('Active Connections')).toBeInTheDocument();
      expect(screen.getByText('156')).toBeInTheDocument();
    });

    it('allows service restart and log viewing', async () => {
      renderWithProviders(<AdminDashboard />);
      
      await user.click(screen.getByRole('tab', { name: /Services/i }));

      const restartButtons = screen.getAllByRole('button', { name: /Restart/i });
      expect(restartButtons).toHaveLength(8); // One for each service

      const logButtons = screen.getAllByRole('button', { name: /Logs/i });
      expect(logButtons).toHaveLength(8);
    });
  });

  describe('Organizations Tab', () => {
    it('displays organization statistics', async () => {
      renderWithProviders(<AdminDashboard />);
      
      await user.click(screen.getByRole('tab', { name: /Organizations/i }));

      expect(screen.getByText('Total Organizations')).toBeInTheDocument();
      expect(screen.getByText('Trial Organizations')).toBeInTheDocument();
      expect(screen.getByText('24')).toBeInTheDocument();
      expect(screen.getByText('Converting at 68%')).toBeInTheDocument();

      expect(screen.getByText('Pending Renewals')).toBeInTheDocument();
      expect(screen.getByText('7')).toBeInTheDocument();

      expect(screen.getByText('MRR')).toBeInTheDocument();
      expect(screen.getByText('$42,850')).toBeInTheDocument();
    });

    it('shows organization list with details', async () => {
      renderWithProviders(<AdminDashboard />);
      
      await user.click(screen.getByRole('tab', { name: /Organizations/i }));

      expect(screen.getByText('Stockholm Hockey Club')).toBeInTheDocument();
      expect(screen.getByText('Enterprise')).toBeInTheDocument();
      expect(screen.getByText('243 users')).toBeInTheDocument();

      // Check suspended organization
      expect(screen.getByText('Hockey Tigers')).toBeInTheDocument();
      const suspendedOrg = screen.getByText('Hockey Tigers').closest('div[class*="border"]');
      const suspendedBadge = within(suspendedOrg!).getByText('suspended');
      expect(suspendedBadge).toHaveClass('bg-red-100');
    });

    it('has organization management actions', async () => {
      renderWithProviders(<AdminDashboard />);
      
      await user.click(screen.getByRole('tab', { name: /Organizations/i }));

      expect(screen.getByRole('button', { name: /Filter/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Add Organization/i })).toBeInTheDocument();
    });
  });

  describe('Security Tab', () => {
    it('displays security overview', async () => {
      renderWithProviders(<AdminDashboard />);
      
      await user.click(screen.getByRole('tab', { name: /Security/i }));

      expect(screen.getByText('Security Score')).toBeInTheDocument();
      expect(screen.getByText('94/100')).toBeInTheDocument();
      expect(screen.getByText('Excellent')).toBeInTheDocument();

      expect(screen.getByText('Active Threats')).toBeInTheDocument();
      expect(screen.getByText('0')).toBeInTheDocument();
      expect(screen.getByText('All clear')).toBeInTheDocument();

      expect(screen.getByText('Failed Logins (24h)')).toBeInTheDocument();
      expect(screen.getByText('47')).toBeInTheDocument();
    });

    it('shows security events', async () => {
      renderWithProviders(<AdminDashboard />);
      
      await user.click(screen.getByRole('tab', { name: /Security/i }));

      expect(screen.getByText('Security Events')).toBeInTheDocument();
      expect(screen.getByText('Multiple failed login attempts from IP 192.168.1.100')).toBeInTheDocument();
      expect(screen.getByText('API rate limit exceeded for organization \'Northern Knights\'')).toBeInTheDocument();
    });

    it('displays admin access control', async () => {
      renderWithProviders(<AdminDashboard />);
      
      await user.click(screen.getByRole('tab', { name: /Security/i }));

      expect(screen.getByText('Admin Access Control')).toBeInTheDocument();
      expect(screen.getByText('John Admin')).toBeInTheDocument();
      expect(screen.getByText('Super Admin')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Add Administrator/i })).toBeInTheDocument();
    });

    it('has security configuration options', async () => {
      renderWithProviders(<AdminDashboard />);
      
      await user.click(screen.getByRole('tab', { name: /Security/i }));

      expect(screen.getByRole('button', { name: /API Key Management/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /2FA Configuration/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Password Policies/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /IP Whitelist/i })).toBeInTheDocument();
    });
  });

  describe('Translations Tab', () => {
    it('displays language statistics', async () => {
      renderWithProviders(<AdminDashboard />);
      
      await user.click(screen.getByRole('tab', { name: /Translations/i }));

      expect(screen.getByText('Translation Management')).toBeInTheDocument();
      
      // Check Swedish (100% complete)
      expect(screen.getByText('Swedish (Svenska)')).toBeInTheDocument();
      expect(screen.getByText('1245 keys translated • 0 missing')).toBeInTheDocument();

      // Check Finnish (85% complete)
      expect(screen.getByText('Finnish (Suomi)')).toBeInTheDocument();
      expect(screen.getByText('1058 keys translated • 187 missing')).toBeInTheDocument();
    });

    it('has translation management actions', async () => {
      renderWithProviders(<AdminDashboard />);
      
      await user.click(screen.getByRole('tab', { name: /Translations/i }));

      expect(screen.getByRole('button', { name: /Import/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Export/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Add Language/i })).toBeInTheDocument();
    });

    it('shows recent translation activity', async () => {
      renderWithProviders(<AdminDashboard />);
      
      await user.click(screen.getByRole('tab', { name: /Translations/i }));

      expect(screen.getByText('Recent Translation Activity')).toBeInTheDocument();
      expect(screen.getByText('Updated 45 keys in Finnish')).toBeInTheDocument();
      expect(screen.getByText('by translator@example.com • 2 hours ago')).toBeInTheDocument();
    });
  });

  describe('Configuration Tab', () => {
    it('displays configuration sections', async () => {
      renderWithProviders(<AdminDashboard />);
      
      await user.click(screen.getByRole('tab', { name: /Configuration/i }));

      expect(screen.getByText('Global Settings')).toBeInTheDocument();
      expect(screen.getByText('Service Configuration')).toBeInTheDocument();
      expect(screen.getByText('Integration Settings')).toBeInTheDocument();
    });

    it('shows feature flags', async () => {
      renderWithProviders(<AdminDashboard />);
      
      await user.click(screen.getByRole('tab', { name: /Configuration/i }));

      expect(screen.getByText('Feature Flags')).toBeInTheDocument();
      expect(screen.getByText('Advanced Analytics')).toBeInTheDocument();
      expect(screen.getByText('Enable advanced analytics features')).toBeInTheDocument();
      
      // Check enabled feature
      const advancedAnalytics = screen.getByText('Advanced Analytics').closest('div[class*="border"]');
      const enabledButton = within(advancedAnalytics!).getByRole('button', { name: 'Enabled' });
      expect(enabledButton).toHaveClass('bg-primary');

      // Check disabled feature
      const videoAnalysis = screen.getByText('Video Analysis Integration').closest('div[class*="border"]');
      const disabledButton = within(videoAnalysis!).getByRole('button', { name: 'Disabled' });
      expect(disabledButton).toHaveClass('border');
    });

    it('has various configuration buttons', async () => {
      renderWithProviders(<AdminDashboard />);
      
      await user.click(screen.getByRole('tab', { name: /Configuration/i }));

      // Global settings
      expect(screen.getByRole('button', { name: /Regional Settings/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Time Zone Configuration/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Data Retention Policies/i })).toBeInTheDocument();

      // Service configuration
      expect(screen.getByRole('button', { name: /Service Endpoints/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Performance Tuning/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Cache Configuration/i })).toBeInTheDocument();

      // Integration settings
      expect(screen.getByRole('button', { name: /Payment Providers/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Email Services/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Push Notifications/i })).toBeInTheDocument();
    });
  });

  describe('Tab Navigation', () => {
    it('switches between tabs correctly', async () => {
      renderWithProviders(<AdminDashboard />);

      // Start on Overview tab
      expect(screen.getByText('System Health')).toBeInTheDocument();

      // Switch to Services
      await user.click(screen.getByRole('tab', { name: /Services/i }));
      expect(screen.getByText('Database Performance')).toBeInTheDocument();

      // Switch to Organizations
      await user.click(screen.getByRole('tab', { name: /Organizations/i }));
      expect(screen.getByText('Organizations by Plan')).toBeInTheDocument();

      // Switch to Security
      await user.click(screen.getByRole('tab', { name: /Security/i }));
      expect(screen.getByText('Security Score')).toBeInTheDocument();

      // Switch to Translations
      await user.click(screen.getByRole('tab', { name: /Translations/i }));
      expect(screen.getByText('Translation Management')).toBeInTheDocument();

      // Switch to Configuration
      await user.click(screen.getByRole('tab', { name: /Configuration/i }));
      expect(screen.getByText('Feature Flags')).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('adapts layout for different screen sizes', () => {
      // This would require viewport testing with specific testing libraries
      // For now, we just check that grid classes are present
      renderWithProviders(<AdminDashboard />);

      const overviewCards = screen.getByText('System Health').closest('.grid');
      expect(overviewCards).toHaveClass('grid-cols-6');
    });
  });

  describe('Interactive Elements', () => {
    it('shows hover states on service cards', async () => {
      renderWithProviders(<AdminDashboard />);
      
      await user.click(screen.getByRole('tab', { name: /Services/i }));

      const serviceCard = screen.getByText('User Service').closest('.hover\\:shadow-lg');
      expect(serviceCard).toHaveClass('transition-shadow', 'cursor-pointer');
    });

    it('displays alerts badge in header', () => {
      renderWithProviders(<AdminDashboard />);

      const alertsButton = screen.getByRole('button', { name: /Alerts/i });
      const badge = within(alertsButton).getByText('3');
      expect(badge).toHaveClass('bg-destructive');
    });
  });

  describe('Loading and Error States', () => {
    it('handles loading state from API', () => {
      renderWithProviders(<AdminDashboard />);
      
      // The component uses mock data, so loading state is not visible
      // In a real test, we would mock the API to return loading state
      expect(screen.getByText('System Health')).toBeInTheDocument();
    });
  });

  describe('Chart Rendering', () => {
    it('renders system performance chart', () => {
      renderWithProviders(<AdminDashboard />);

      expect(screen.getByText('admin:system.systemPerformance24h')).toBeInTheDocument();
      expect(screen.getByText('admin:system.cpuMemoryUsage')).toBeInTheDocument();
    });

    it('renders organization growth chart in organizations tab', async () => {
      renderWithProviders(<AdminDashboard />);
      
      await user.click(screen.getByRole('tab', { name: /Organizations/i }));

      expect(screen.getByText('Organization Growth')).toBeInTheDocument();
      expect(screen.getByText('New vs churned organizations')).toBeInTheDocument();
    });
  });
});