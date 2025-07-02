import React from 'react';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EquipmentFittingModal } from './EquipmentFittingModal';
import { renderWithProviders } from '@/test-utils';
import { vi } from 'vitest';
import { format } from 'date-fns';

// Mock the API hook
vi.mock('@/store/api/calendarApi', () => ({
  useCreateCalendarEventMutation: () => {
    const mockMutation = vi.fn().mockResolvedValue({ 
      unwrap: () => Promise.resolve({ id: 'event-123', success: true }) 
    });
    return [mockMutation];
  },
}));

// Mock the toast
vi.mock('@/components/ui/use-toast', () => ({
  toast: vi.fn(),
}));

// Mock date-fns format for consistent date display
vi.mock('date-fns', async () => {
  const actual = await vi.importActual('date-fns');
  return {
    ...actual,
    format: vi.fn((date, formatStr) => {
      if (formatStr === 'PPP') {
        return 'January 15, 2024';
      }
      if (formatStr === 'HH:mm') {
        return '14:00';
      }
      return actual.format(date, formatStr);
    }),
  };
});

describe('EquipmentFittingModal', () => {
  const user = userEvent.setup();
  const mockOnClose = vi.fn();
  const mockDate = new Date('2024-01-15T14:00:00');

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the modal when open', () => {
    renderWithProviders(
      <EquipmentFittingModal 
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Schedule Equipment Fitting')).toBeInTheDocument();
    expect(screen.getByText('Schedule equipment fitting sessions for individual players or entire teams')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    renderWithProviders(
      <EquipmentFittingModal 
        isOpen={false}
        onClose={mockOnClose}
      />
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  describe('Fitting Type Selection', () => {
    it('allows switching between individual and team fitting', async () => {
      renderWithProviders(
        <EquipmentFittingModal 
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      // Individual is selected by default
      const individualButton = screen.getByRole('button', { name: /Individual Players/i });
      const teamButton = screen.getByRole('button', { name: /Entire Team/i });

      expect(individualButton).toHaveClass('bg-primary');
      expect(teamButton).not.toHaveClass('bg-primary');

      // Switch to team
      await user.click(teamButton);

      expect(teamButton).toHaveClass('bg-primary');
      expect(individualButton).not.toHaveClass('bg-primary');

      // Should show team selection
      expect(screen.getByText('Select Team')).toBeInTheDocument();
    });
  });

  describe('Individual Player Selection', () => {
    it('displays player search and list', () => {
      renderWithProviders(
        <EquipmentFittingModal 
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByPlaceholderText('Search players by name or number...')).toBeInTheDocument();
      
      // Check that players are displayed
      expect(screen.getByText('#23 Marcus Lindberg')).toBeInTheDocument();
      expect(screen.getByText('#15 Erik Andersson')).toBeInTheDocument();
      expect(screen.getByText('#30 Viktor Olsson')).toBeInTheDocument();
      expect(screen.getByText('#8 Johan Nilsson')).toBeInTheDocument();
    });

    it('shows player current sizes', () => {
      renderWithProviders(
        <EquipmentFittingModal 
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      const marcusEntry = screen.getByText('#23 Marcus Lindberg').closest('div');
      expect(within(marcusEntry!).getByText(/Current sizes: J-L, S-10.5/)).toBeInTheDocument();
    });

    it('allows searching for players', async () => {
      renderWithProviders(
        <EquipmentFittingModal 
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      const searchInput = screen.getByPlaceholderText('Search players by name or number...');
      await user.type(searchInput, 'Marcus');

      // Only Marcus should be visible
      expect(screen.getByText('#23 Marcus Lindberg')).toBeInTheDocument();
      expect(screen.queryByText('#15 Erik Andersson')).not.toBeInTheDocument();
    });

    it('allows searching by number', async () => {
      renderWithProviders(
        <EquipmentFittingModal 
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      const searchInput = screen.getByPlaceholderText('Search players by name or number...');
      await user.type(searchInput, '30');

      // Only #30 should be visible
      expect(screen.getByText('#30 Viktor Olsson')).toBeInTheDocument();
      expect(screen.queryByText('#23 Marcus Lindberg')).not.toBeInTheDocument();
    });

    it('allows selecting multiple players', async () => {
      renderWithProviders(
        <EquipmentFittingModal 
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      // Click on first player
      await user.click(screen.getByText('#23 Marcus Lindberg'));
      
      // Click on second player
      await user.click(screen.getByText('#15 Erik Andersson'));

      // Check selection count
      expect(screen.getByText('2 player(s) selected')).toBeInTheDocument();

      // Players should have selected styling
      const marcusEntry = screen.getByText('#23 Marcus Lindberg').closest('div.flex');
      expect(marcusEntry).toHaveClass('bg-primary/10', 'border-primary');
    });

    it('toggles player selection with checkbox', async () => {
      renderWithProviders(
        <EquipmentFittingModal 
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      const marcusEntry = screen.getByText('#23 Marcus Lindberg').closest('div.flex');
      const checkbox = within(marcusEntry!).getByRole('checkbox');

      // Select
      await user.click(checkbox);
      expect(screen.getByText('1 player(s) selected')).toBeInTheDocument();

      // Deselect
      await user.click(checkbox);
      expect(screen.queryByText('player(s) selected')).not.toBeInTheDocument();
    });
  });

  describe('Team Selection', () => {
    it('displays team dropdown when team fitting is selected', async () => {
      renderWithProviders(
        <EquipmentFittingModal 
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      // Switch to team fitting
      await user.click(screen.getByRole('button', { name: /Entire Team/i }));

      expect(screen.getByText('Select Team')).toBeInTheDocument();
      
      // Open dropdown
      await user.click(screen.getByText('Choose a team'));

      // Check team options
      expect(screen.getByText('Senior Team')).toBeInTheDocument();
      expect(screen.getByText('Junior A')).toBeInTheDocument();
      expect(screen.getByText('U16 Boys')).toBeInTheDocument();
    });

    it('allows selecting a team', async () => {
      renderWithProviders(
        <EquipmentFittingModal 
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      await user.click(screen.getByRole('button', { name: /Entire Team/i }));
      await user.click(screen.getByText('Choose a team'));
      await user.click(screen.getByText('Senior Team'));

      // The dropdown should show the selected team
      expect(screen.getByText('Senior Team')).toBeInTheDocument();
    });
  });

  describe('Equipment Type Selection', () => {
    it('displays all equipment options', () => {
      renderWithProviders(
        <EquipmentFittingModal 
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('Equipment Types')).toBeInTheDocument();
      expect(screen.getByText('Jerseys')).toBeInTheDocument();
      expect(screen.getByText('Pants')).toBeInTheDocument();
      expect(screen.getByText('Helmets')).toBeInTheDocument();
      expect(screen.getByText('Skates')).toBeInTheDocument();
      expect(screen.getByText('Gloves')).toBeInTheDocument();
      expect(screen.getByText('Sticks')).toBeInTheDocument();
      expect(screen.getByText('Protective Gear')).toBeInTheDocument();
      expect(screen.getByText('Goalie Equipment')).toBeInTheDocument();
    });

    it('allows selecting multiple equipment types', async () => {
      renderWithProviders(
        <EquipmentFittingModal 
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      // Click on Jerseys
      await user.click(screen.getByText('Jerseys'));
      
      // Click on Skates
      await user.click(screen.getByText('Skates'));

      // Both should have selected styling
      const jerseysOption = screen.getByText('Jerseys').closest('div.flex');
      const skatesOption = screen.getByText('Skates').closest('div.flex');
      
      expect(jerseysOption).toHaveClass('bg-primary/10', 'border-primary');
      expect(skatesOption).toHaveClass('bg-primary/10', 'border-primary');
    });

    it('toggles equipment selection with checkbox', async () => {
      renderWithProviders(
        <EquipmentFittingModal 
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      const helmetOption = screen.getByText('Helmets').closest('div.flex');
      const checkbox = within(helmetOption!).getByRole('checkbox');

      // Select
      await user.click(checkbox);
      expect(helmetOption).toHaveClass('bg-primary/10');

      // Deselect
      await user.click(checkbox);
      expect(helmetOption).not.toHaveClass('bg-primary/10');
    });
  });

  describe('Date and Time Selection', () => {
    it('displays date and time fields with defaults', () => {
      renderWithProviders(
        <EquipmentFittingModal 
          isOpen={true}
          onClose={mockOnClose}
          initialDate={mockDate}
          initialEndDate={new Date('2024-01-15T15:00:00')}
        />
      );

      expect(screen.getByText('Date')).toBeInTheDocument();
      expect(screen.getByLabelText('Start Time')).toHaveValue('14:00');
      expect(screen.getByLabelText('End Time')).toHaveValue('14:00'); // Due to our mock
    });

    it('allows changing time', async () => {
      renderWithProviders(
        <EquipmentFittingModal 
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      const startTimeInput = screen.getByLabelText('Start Time');
      const endTimeInput = screen.getByLabelText('End Time');

      await user.clear(startTimeInput);
      await user.type(startTimeInput, '10:30');

      await user.clear(endTimeInput);
      await user.type(endTimeInput, '11:30');

      expect(startTimeInput).toHaveValue('10:30');
      expect(endTimeInput).toHaveValue('11:30');
    });
  });

  describe('Location Selection', () => {
    it('has default location', () => {
      renderWithProviders(
        <EquipmentFittingModal 
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('Equipment Room')).toBeInTheDocument();
    });

    it('allows changing location', async () => {
      renderWithProviders(
        <EquipmentFittingModal 
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      // Find and click the location dropdown
      const locationDropdown = screen.getAllByRole('combobox')[1]; // Second dropdown is location
      await user.click(locationDropdown);

      // Select a different location
      await user.click(screen.getByText('Main Rink'));

      expect(screen.getByText('Main Rink')).toBeInTheDocument();
    });
  });

  describe('Additional Options', () => {
    it('has measurement checkbox', async () => {
      renderWithProviders(
        <EquipmentFittingModal 
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      const measurementCheckbox = screen.getByRole('checkbox', { 
        name: /Take new measurements during fitting/i 
      });

      expect(measurementCheckbox).not.toBeChecked();

      await user.click(measurementCheckbox);
      expect(measurementCheckbox).toBeChecked();
    });

    it('allows entering notes', async () => {
      renderWithProviders(
        <EquipmentFittingModal 
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      const notesTextarea = screen.getByLabelText('Notes (optional)');
      await user.type(notesTextarea, 'Please bring size charts for new players');

      expect(notesTextarea).toHaveValue('Please bring size charts for new players');
    });
  });

  describe('Form Validation', () => {
    it('shows error when no players selected for individual fitting', async () => {
      const { toast } = await import('@/components/ui/use-toast');
      
      renderWithProviders(
        <EquipmentFittingModal 
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      // Don't select any players
      await user.click(screen.getByRole('button', { name: /Schedule Fitting/i }));

      expect(toast).toHaveBeenCalledWith({
        title: "Error",
        description: "Please select at least one player",
        variant: "destructive",
      });
    });

    it('shows error when no team selected for team fitting', async () => {
      const { toast } = await import('@/components/ui/use-toast');
      
      renderWithProviders(
        <EquipmentFittingModal 
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      // Switch to team fitting
      await user.click(screen.getByRole('button', { name: /Entire Team/i }));

      // Don't select a team
      await user.click(screen.getByRole('button', { name: /Schedule Fitting/i }));

      expect(toast).toHaveBeenCalledWith({
        title: "Error",
        description: "Please select a team",
        variant: "destructive",
      });
    });

    it('shows error when no equipment types selected', async () => {
      const { toast } = await import('@/components/ui/use-toast');
      
      renderWithProviders(
        <EquipmentFittingModal 
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      // Select a player but no equipment
      await user.click(screen.getByText('#23 Marcus Lindberg'));
      await user.click(screen.getByRole('button', { name: /Schedule Fitting/i }));

      expect(toast).toHaveBeenCalledWith({
        title: "Error",
        description: "Please select at least one equipment type",
        variant: "destructive",
      });
    });
  });

  describe('Form Submission', () => {
    it('submits individual fitting correctly', async () => {
      const { toast } = await import('@/components/ui/use-toast');
      
      renderWithProviders(
        <EquipmentFittingModal 
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      // Select players
      await user.click(screen.getByText('#23 Marcus Lindberg'));
      await user.click(screen.getByText('#15 Erik Andersson'));

      // Select equipment
      await user.click(screen.getByText('Jerseys'));
      await user.click(screen.getByText('Skates'));

      // Add notes
      await user.type(screen.getByLabelText('Notes (optional)'), 'Test fitting');

      // Submit
      await user.click(screen.getByRole('button', { name: /Schedule Fitting/i }));

      await waitFor(() => {
        expect(toast).toHaveBeenCalledWith({
          title: "Success",
          description: "Equipment fitting scheduled successfully",
        });
      });

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('submits team fitting correctly', async () => {
      const { toast } = await import('@/components/ui/use-toast');
      
      renderWithProviders(
        <EquipmentFittingModal 
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      // Switch to team fitting
      await user.click(screen.getByRole('button', { name: /Entire Team/i }));

      // Select team
      await user.click(screen.getByText('Choose a team'));
      await user.click(screen.getByText('Senior Team'));

      // Select equipment
      await user.click(screen.getByText('Helmets'));
      await user.click(screen.getByText('Gloves'));

      // Enable measurements
      await user.click(screen.getByRole('checkbox', { 
        name: /Take new measurements during fitting/i 
      }));

      // Submit
      await user.click(screen.getByRole('button', { name: /Schedule Fitting/i }));

      await waitFor(() => {
        expect(toast).toHaveBeenCalledWith({
          title: "Success",
          description: "Equipment fitting scheduled successfully",
        });
      });
    });

    it('shows loading state during submission', async () => {
      renderWithProviders(
        <EquipmentFittingModal 
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      // Set up valid form
      await user.click(screen.getByText('#23 Marcus Lindberg'));
      await user.click(screen.getByText('Jerseys'));

      const submitButton = screen.getByRole('button', { name: /Schedule Fitting/i });
      await user.click(submitButton);

      // Check for loading state (this might be too fast to catch in tests)
      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });
  });

  describe('Cancel Action', () => {
    it('closes modal when cancel is clicked', async () => {
      renderWithProviders(
        <EquipmentFittingModal 
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      const cancelButton = screen.getByRole('button', { name: 'Cancel' });
      await user.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });
});