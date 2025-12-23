import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import PlayerDashboard from '../PlayerDashboard';
import { renderWithProviders } from '@/test-utils';

// Ensure RTK Query hooks used by PlayerDashboard don't drive the component into an error state during a11y tests.
// We keep the real API slices (for reducer/middleware in test-utils) and only override hook implementations.
jest.mock('@/store/api/playerApi', () => {
  const actual = jest.requireActual('@/store/api/playerApi');
  return {
    ...actual,
    useGetPlayerOverviewQuery: () => ({ data: undefined, isLoading: false, error: undefined }),
    useSubmitWellnessMutation: () => [jest.fn(), { isLoading: false, error: null }],
    useCompleteTrainingMutation: () => [jest.fn(), { isLoading: false, error: null }],
  };
});

jest.mock('@/store/api/trainingApi', () => {
  const actual = jest.requireActual('@/store/api/trainingApi');
  return {
    ...actual,
    useGetWorkoutSessionsQuery: () => ({ data: undefined, isLoading: false, error: undefined }),
  };
});

jest.mock('@/store/api/dashboardApi', () => {
  const actual = jest.requireActual('@/store/api/dashboardApi');
  return {
    ...actual,
    useGetUserDashboardDataQuery: () => ({ data: undefined, isLoading: false, error: undefined }),
    useGetUserStatisticsQuery: () => ({ data: undefined, isLoading: false, error: undefined }),
    useGetCommunicationSummaryQuery: () => ({ data: undefined, isLoading: false, error: undefined }),
    useGetStatisticsSummaryQuery: () => ({ data: undefined, isLoading: false, error: undefined }),
  };
});

// Add jest-axe matchers
expect.extend(toHaveNoViolations);

describe('PlayerDashboard Accessibility', () => {
  describe('Keyboard Navigation', () => {
    it('should allow tab navigation through all interactive elements', async () => {
      const user = userEvent.setup();
      renderWithProviders(<PlayerDashboard />);
      
      // Start at the first tab
      const firstTab = screen.getByRole('tab', { name: /today/i });

      // The page header contains other focusable controls (e.g. message/logout buttons),
      // so tab until we reach the first tab trigger.
      for (let i = 0; i < 30; i++) {
        await user.tab();
        if (firstTab === document.activeElement) break;
      }
      expect(firstTab).toHaveFocus();

      // Radix Tabs uses roving tabindex: Tab moves *out* of the tablist, while arrow keys move between tabs.
      // Verify tab continues to the next focusable control.
      await user.tab();
      expect(document.activeElement).not.toBe(firstTab);
    });
    
    it('should support arrow key navigation in tabs', async () => {
      const user = userEvent.setup();
      renderWithProviders(<PlayerDashboard />);
      
      const tabs = screen.getAllByRole('tab');
      tabs[0].focus();
      
      // Arrow right
      await user.keyboard('{ArrowRight}');
      expect(tabs[1]).toHaveFocus();
      
      // Arrow left
      await user.keyboard('{ArrowLeft}');
      expect(tabs[0]).toHaveFocus();
    });
    
    it('should allow keyboard navigation through wellness sliders', async () => {
      const user = userEvent.setup();
      renderWithProviders(<PlayerDashboard />);
      
      // Navigate to wellness tab
      const wellnessTab = screen.getByRole('tab', { name: /wellness/i });
      await user.click(wellnessTab);
      
      // Find sleep quality slider
      const sleepSlider = screen.getByRole('slider', { name: /sleep quality/i });
      sleepSlider.focus();
      
      // Test arrow key navigation
      const initialValue = sleepSlider.getAttribute('aria-valuenow');
      await user.keyboard('{ArrowRight}');
      expect(sleepSlider.getAttribute('aria-valuenow')).toBe(String(Number(initialValue) + 1));
      
      await user.keyboard('{ArrowLeft}');
      expect(sleepSlider.getAttribute('aria-valuenow')).toBe(initialValue);
      
      // Test Home/End keys
      await user.keyboard('{Home}');
      expect(sleepSlider.getAttribute('aria-valuenow')).toBe('1');
      
      await user.keyboard('{End}');
      expect(sleepSlider.getAttribute('aria-valuenow')).toBe('10');
    });
    
    it('should make calendar widget keyboard accessible', async () => {
      const user = userEvent.setup();
      renderWithProviders(<PlayerDashboard />);
      
      // Navigate to calendar tab
      const calendarTab = screen.getByRole('tab', { name: /calendar/i });
      await user.click(calendarTab);
      
      // Check if calendar events are focusable
      const events = screen.queryAllByRole('article');
      if (events.length > 0) {
        await user.tab();
        expect(events[0]).toHaveFocus();
        
        // Should respond to Enter key
        await user.keyboard('{Enter}');
        // Add assertions for what should happen on Enter
      }
    });
  });
  
  describe('Focus Indicators', () => {
    it('should show visible focus indicators on all interactive elements', () => {
      renderWithProviders(<PlayerDashboard />);
      
      // Check tabs have focus styles
      const tabs = screen.getAllByRole('tab');
      tabs.forEach(tab => {
        tab.focus();
        const styles = getComputedStyle(tab);
        expect(styles.outlineWidth).not.toBe('0px');
      });
      
      // Check buttons have focus styles
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        button.focus();
        const styles = getComputedStyle(button);
        expect(styles.outlineWidth).not.toBe('0px');
      });
    });
  });
  
  describe('ARIA Attributes', () => {
    it('should have proper ARIA labels on all form elements', async () => {
      const user = userEvent.setup();
      renderWithProviders(<PlayerDashboard />);
      
      // Navigate to wellness tab
      const wellnessTab = screen.getByRole('tab', { name: /wellness/i });
      await user.click(wellnessTab);
      
      // Check sliders have proper ARIA attributes
      const sliders = await screen.findAllByRole('slider');
      sliders.forEach(slider => {
        expect(slider).toHaveAttribute('aria-label');
        expect(slider).toHaveAttribute('aria-valuemin');
        expect(slider).toHaveAttribute('aria-valuemax');
        expect(slider).toHaveAttribute('aria-valuenow');
      });
      
      // Check form inputs have labels
      const inputs = screen.getAllByRole('textbox');
      inputs.forEach(input => {
        const ariaLabel = input.getAttribute('aria-label');
        const ariaLabelledBy = input.getAttribute('aria-labelledby');
        const id = input.getAttribute('id');
        const hasHtmlForLabel = Boolean(id && document.querySelector(`label[for="${id}"]`));

        expect(Boolean(ariaLabel || ariaLabelledBy || hasHtmlForLabel)).toBe(true);
      });
    });
    
    it('should have proper tab panel associations', () => {
      renderWithProviders(<PlayerDashboard />);
      
      const tabs = screen.getAllByRole('tab');
      tabs.forEach(tab => {
        expect(tab).toHaveAttribute('id');
        expect(tab).toHaveAttribute('aria-controls');
        
        const panelId = tab.getAttribute('aria-controls');
        const panel = document.getElementById(panelId!);
        expect(panel).toBeInTheDocument();
        expect(panel).toHaveAttribute('aria-labelledby', tab.id);
      });
    });
  });
  
  describe('Screen Reader Support', () => {
    it('should announce loading states', () => {
      renderWithProviders(<PlayerDashboard />);
      
      const loadingElements = screen.queryAllByRole('status');
      loadingElements.forEach(element => {
        expect(element).toHaveAttribute('aria-live');
      });
    });
    
    it('should have proper heading hierarchy', () => {
      renderWithProviders(<PlayerDashboard />);
      
      const headings = screen.getAllByRole('heading');
      const levels = headings.map(h => parseInt(h.tagName.charAt(1)));
      
      // Check that heading levels don't skip
      for (let i = 1; i < levels.length; i++) {
        expect(levels[i] - levels[i-1]).toBeLessThanOrEqual(1);
      }
    });
  });
  
  describe('Axe Accessibility Audit', () => {
    it('should have no accessibility violations', async () => {
      const { container } = renderWithProviders(<PlayerDashboard />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});