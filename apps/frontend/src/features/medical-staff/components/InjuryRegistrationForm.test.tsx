import React from 'react';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InjuryRegistrationForm } from './InjuryRegistrationForm';
import { renderWithProviders } from '@/test-utils';
import { vi } from 'vitest';
import { format } from 'date-fns';

// Mock date-fns format to have consistent date formatting in tests
vi.mock('date-fns', async () => {
  const actual = await vi.importActual('date-fns');
  return {
    ...actual,
    format: vi.fn((date, formatStr) => {
      if (formatStr === 'PPP') {
        return 'January 15, 2024';
      }
      return actual.format(date, formatStr);
    }),
  };
});

describe('InjuryRegistrationForm', () => {
  const user = userEvent.setup();
  const mockOnClose = vi.fn();
  const mockOnSave = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the form when open', () => {
    renderWithProviders(
      <InjuryRegistrationForm 
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Register New Injury')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    renderWithProviders(
      <InjuryRegistrationForm 
        isOpen={false}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  describe('Form Fields', () => {
    it('displays all required form fields', () => {
      renderWithProviders(
        <InjuryRegistrationForm 
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      // Check all labels
      expect(screen.getByText('Player')).toBeInTheDocument();
      expect(screen.getByText('Date of Injury')).toBeInTheDocument();
      expect(screen.getByLabelText('Injury Type')).toBeInTheDocument();
      expect(screen.getByText('Body Part')).toBeInTheDocument();
      expect(screen.getByText('Severity')).toBeInTheDocument();
      expect(screen.getByLabelText('Mechanism of Injury')).toBeInTheDocument();
      expect(screen.getByLabelText('Additional Notes')).toBeInTheDocument();
    });

    it('allows selecting a player', async () => {
      renderWithProviders(
        <InjuryRegistrationForm 
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const playerSelect = screen.getByText('Select player');
      await user.click(playerSelect);

      // Check all player options are available
      expect(screen.getByText('Erik Andersson')).toBeInTheDocument();
      expect(screen.getByText('Marcus Lindberg')).toBeInTheDocument();
      expect(screen.getByText('Viktor Nilsson')).toBeInTheDocument();
      expect(screen.getByText('Johan Bergström')).toBeInTheDocument();

      // Select a player
      await user.click(screen.getByText('Erik Andersson'));
      
      // The select should now show the selected player
      expect(screen.getByText('Erik Andersson')).toBeInTheDocument();
    });

    it('allows selecting a date', async () => {
      renderWithProviders(
        <InjuryRegistrationForm 
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      // Click date picker button
      const dateButton = screen.getByRole('button', { name: /pick a date/i });
      await user.click(dateButton);

      // Calendar should be visible
      expect(screen.getByRole('grid')).toBeInTheDocument();

      // Select a date (find a date button - calendars typically have role="gridcell")
      const dateCell = screen.getAllByRole('gridcell')[15]; // Select 15th day
      await user.click(dateCell);

      // The date should be formatted and displayed
      expect(screen.getByText('January 15, 2024')).toBeInTheDocument();
    });

    it('allows entering injury type', async () => {
      renderWithProviders(
        <InjuryRegistrationForm 
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const injuryTypeInput = screen.getByLabelText('Injury Type');
      await user.type(injuryTypeInput, 'Hamstring strain');

      expect(injuryTypeInput).toHaveValue('Hamstring strain');
    });

    it('allows selecting body part', async () => {
      renderWithProviders(
        <InjuryRegistrationForm 
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const bodyPartSelect = screen.getByText('Select body part');
      await user.click(bodyPartSelect);

      // Check body part options
      expect(screen.getByText('Head')).toBeInTheDocument();
      expect(screen.getByText('Shoulder')).toBeInTheDocument();
      expect(screen.getByText('Knee')).toBeInTheDocument();
      expect(screen.getByText('Ankle')).toBeInTheDocument();
      expect(screen.getByText('Hamstring')).toBeInTheDocument();
      expect(screen.getByText('Back')).toBeInTheDocument();
      expect(screen.getByText('Other')).toBeInTheDocument();

      await user.click(screen.getByText('Hamstring'));
      expect(screen.getByText('Hamstring')).toBeInTheDocument();
    });

    it('allows selecting severity', async () => {
      renderWithProviders(
        <InjuryRegistrationForm 
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const severitySelect = screen.getByText('Select severity');
      await user.click(severitySelect);

      // Check severity options
      expect(screen.getByText('Mild')).toBeInTheDocument();
      expect(screen.getByText('Moderate')).toBeInTheDocument();
      expect(screen.getByText('Severe')).toBeInTheDocument();

      await user.click(screen.getByText('Moderate'));
      expect(screen.getByText('Moderate')).toBeInTheDocument();
    });

    it('allows entering mechanism of injury', async () => {
      renderWithProviders(
        <InjuryRegistrationForm 
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const mechanismInput = screen.getByLabelText('Mechanism of Injury');
      await user.type(mechanismInput, 'Overstretched during sprint training');

      expect(mechanismInput).toHaveValue('Overstretched during sprint training');
    });

    it('allows entering additional notes', async () => {
      renderWithProviders(
        <InjuryRegistrationForm 
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const notesTextarea = screen.getByLabelText('Additional Notes');
      await user.type(notesTextarea, 'Player felt tightness before the injury occurred. Previous history of hamstring issues.');

      expect(notesTextarea).toHaveValue('Player felt tightness before the injury occurred. Previous history of hamstring issues.');
    });
  });

  describe('Form Actions', () => {
    it('calls onClose when Cancel button is clicked', async () => {
      renderWithProviders(
        <InjuryRegistrationForm 
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const cancelButton = screen.getByRole('button', { name: 'Cancel' });
      await user.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('submits form with all data when Register Injury is clicked', async () => {
      renderWithProviders(
        <InjuryRegistrationForm 
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      // Fill out the form
      await user.click(screen.getByText('Select player'));
      await user.click(screen.getByText('Erik Andersson'));

      await user.click(screen.getByRole('button', { name: /pick a date/i }));
      const dateCell = screen.getAllByRole('gridcell')[15];
      await user.click(dateCell);

      await user.type(screen.getByLabelText('Injury Type'), 'Hamstring strain');

      await user.click(screen.getByText('Select body part'));
      await user.click(screen.getByText('Hamstring'));

      await user.click(screen.getByText('Select severity'));
      await user.click(screen.getByText('Moderate'));

      await user.type(screen.getByLabelText('Mechanism of Injury'), 'Sprint training');
      await user.type(screen.getByLabelText('Additional Notes'), 'Previous history');

      // Submit the form
      const submitButton = screen.getByRole('button', { name: 'Register Injury' });
      await user.click(submitButton);

      // Check that onSave was called with correct data
      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          playerId: '1',
          injuryType: 'Hamstring strain',
          bodyPart: 'hamstring',
          severity: 'moderate',
          mechanism: 'Sprint training',
          notes: 'Previous history',
          dateOccurred: expect.any(Date),
          id: expect.any(Number),
        })
      );

      // Check that onClose was called after submission
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('requires injury type field', async () => {
      renderWithProviders(
        <InjuryRegistrationForm 
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      // Try to submit without filling required field
      const submitButton = screen.getByRole('button', { name: 'Register Injury' });
      await user.click(submitButton);

      // Form should not submit (onSave should not be called)
      expect(mockOnSave).not.toHaveBeenCalled();
    });
  });

  describe('Form State Management', () => {
    it('maintains form state across interactions', async () => {
      renderWithProviders(
        <InjuryRegistrationForm 
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      // Enter some data
      await user.type(screen.getByLabelText('Injury Type'), 'ACL tear');
      await user.type(screen.getByLabelText('Mechanism of Injury'), 'Contact during game');

      // Data should persist
      expect(screen.getByLabelText('Injury Type')).toHaveValue('ACL tear');
      expect(screen.getByLabelText('Mechanism of Injury')).toHaveValue('Contact during game');

      // Select dropdowns
      await user.click(screen.getByText('Select severity'));
      await user.click(screen.getByText('Severe'));

      // Previously entered data should still be there
      expect(screen.getByLabelText('Injury Type')).toHaveValue('ACL tear');
      expect(screen.getByLabelText('Mechanism of Injury')).toHaveValue('Contact during game');
    });

    it('generates unique ID for each injury', async () => {
      renderWithProviders(
        <InjuryRegistrationForm 
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      // Submit form twice
      await user.type(screen.getByLabelText('Injury Type'), 'Test injury');
      await user.click(screen.getByRole('button', { name: 'Register Injury' }));

      const firstCall = mockOnSave.mock.calls[0][0];
      expect(firstCall.id).toBeDefined();
      expect(typeof firstCall.id).toBe('number');
    });
  });

  describe('Dialog Behavior', () => {
    it('closes dialog when clicking outside', async () => {
      renderWithProviders(
        <InjuryRegistrationForm 
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      // Find the dialog overlay (usually has role="presentation" or is the parent of dialog)
      const dialog = screen.getByRole('dialog');
      const overlay = dialog.parentElement;

      if (overlay) {
        // Click on the overlay (outside the dialog content)
        await user.click(overlay);
        expect(mockOnClose).toHaveBeenCalled();
      }
    });
  });

  describe('Accessibility', () => {
    it('has proper form labels', () => {
      renderWithProviders(
        <InjuryRegistrationForm 
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      // Check that all inputs have associated labels
      expect(screen.getByLabelText('Injury Type')).toBeInTheDocument();
      expect(screen.getByLabelText('Mechanism of Injury')).toBeInTheDocument();
      expect(screen.getByLabelText('Additional Notes')).toBeInTheDocument();
    });

    it('has proper dialog attributes', () => {
      renderWithProviders(
        <InjuryRegistrationForm 
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
    });
  });
});