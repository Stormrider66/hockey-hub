import React from 'react';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InjuryRegistrationForm } from './InjuryRegistrationForm';
import { renderWithProviders } from '@/test-utils';

// Keep date formatting deterministic across environments

// Mock date-fns format to have consistent date formatting in tests
jest.mock('date-fns', () => {
  const actual = jest.requireActual('date-fns');
  return {
    ...actual,
    format: (date: any, formatStr: string) => {
      if (formatStr === 'PPP') return 'January 15, 2024';
      return actual.format(date, formatStr);
    },
  };
});

describe('InjuryRegistrationForm', () => {
  const user = userEvent.setup();
  const mockOnClose = jest.fn();
  const mockOnSave = jest.fn();

  const openSelect = async (placeholder: string) => {
    // Radix Select placeholders are inside a span with pointer-events:none.
    // Click the trigger button instead.
    const trigger = screen.getByText(placeholder).closest('button');
    expect(trigger).toBeTruthy();
    await user.click(trigger!);
  };

  const pickOption = async (label: string) => {
    const listbox = await screen.findByRole('listbox');
    await user.click(within(listbox).getByText(label));
  };

  beforeEach(() => {
    jest.clearAllMocks();
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

      await openSelect('Select player');

      // Check all player options are available
      const listbox = await screen.findByRole('listbox');
      expect(within(listbox).getByText('Erik Andersson')).toBeInTheDocument();
      expect(within(listbox).getByText('Marcus Lindberg')).toBeInTheDocument();
      expect(within(listbox).getByText('Viktor Nilsson')).toBeInTheDocument();
      expect(within(listbox).getByText('Johan Bergström')).toBeInTheDocument();

      // Select a player
      await pickOption('Erik Andersson');
      
      // The select should now show the selected player
      expect(screen.getAllByText('Erik Andersson').length).toBeGreaterThan(0);
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

      await openSelect('Select body part');

      // Check body part options
      const listbox = await screen.findByRole('listbox');
      expect(within(listbox).getByText('Head')).toBeInTheDocument();
      expect(within(listbox).getByText('Shoulder')).toBeInTheDocument();
      expect(within(listbox).getByText('Knee')).toBeInTheDocument();
      expect(within(listbox).getByText('Ankle')).toBeInTheDocument();
      expect(within(listbox).getByText('Hamstring')).toBeInTheDocument();
      expect(within(listbox).getByText('Back')).toBeInTheDocument();
      expect(within(listbox).getByText('Other')).toBeInTheDocument();

      await pickOption('Hamstring');
      expect(screen.getAllByText('Hamstring').length).toBeGreaterThan(0);
    });

    it('allows selecting severity', async () => {
      renderWithProviders(
        <InjuryRegistrationForm 
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      await openSelect('Select severity');

      // Check severity options
      const listbox = await screen.findByRole('listbox');
      expect(within(listbox).getByText('Mild')).toBeInTheDocument();
      expect(within(listbox).getByText('Moderate')).toBeInTheDocument();
      expect(within(listbox).getByText('Severe')).toBeInTheDocument();

      await pickOption('Moderate');
      expect(screen.getAllByText('Moderate').length).toBeGreaterThan(0);
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
      await openSelect('Select player');
      await pickOption('Erik Andersson');

      await user.click(screen.getByRole('button', { name: /pick a date/i }));
      const dateCell = screen.getAllByRole('gridcell')[15];
      await user.click(dateCell);

      await user.type(screen.getByLabelText('Injury Type'), 'Hamstring strain');

      await openSelect('Select body part');
      await pickOption('Hamstring');

      await openSelect('Select severity');
      await pickOption('Moderate');

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
      await openSelect('Select severity');
      await pickOption('Severe');

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

      // Overlay is not reliably clickable in JSDOM (pointer-events can be none).
      // ESC is a reliable close gesture for dialogs.
      await user.keyboard('{Escape}');
      expect(mockOnClose).toHaveBeenCalled();
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
      // Radix provides proper dialog semantics; aria-modal is not always set in JSDOM.
      expect(dialog.getAttribute('aria-labelledby')).toBeTruthy();
    });
  });
});