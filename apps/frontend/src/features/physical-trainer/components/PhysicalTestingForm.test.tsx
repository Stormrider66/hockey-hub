import React from 'react';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PhysicalTestingForm from './PhysicalTestingForm';
import { renderWithProviders } from '@/test-utils';
import type { Player } from '@/hooks/useTestData';

// Mock the API hooks
jest.mock('@/store/api/trainingApi', () => {
  const actual = jest.requireActual('@/store/api/trainingApi');
  return {
    ...actual,
    useCreateBulkTestsMutation: () => {
      // RTK Query mutation trigger returns a promise-like object with an `.unwrap()` method.
      const mockMutation = jest.fn(() => ({ unwrap: () => Promise.resolve({ success: true }) }));
      return [mockMutation, { isLoading: false }];
    },
    useCreateTestBatchMutation: () => {
      const mockMutation = jest.fn(() => ({
        unwrap: () => Promise.resolve({ id: 'test-batch-123', name: 'Test Batch' })
      }));
      return [mockMutation];
    },
  };
});

// Mock player data
const mockPlayers: Player[] = [
  { id: '1', name: 'John Doe', position: 'Forward', active: true, teamName: 'Team A' },
  { id: '2', name: 'Jane Smith', position: 'Defense', active: true, teamName: 'Team A' },
  { id: '3', name: 'Mike Johnson', position: 'Goalie', active: true, teamName: 'Team A' },
];

describe('PhysicalTestingForm', () => {
  const user = userEvent.setup();
  const mockOnSubmit = jest.fn();
  const mockOnSaveDraft = jest.fn();

  const clickTestTypeSelect = async (variant: 'individual' | 'bulk' = 'individual') => {
    const testId = variant === 'bulk' ? 'bulk-test-type-select-trigger' : 'test-type-select-trigger';
    await user.click(screen.getByTestId(testId));
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the form with all sections', () => {
    renderWithProviders(
      <PhysicalTestingForm 
        players={mockPlayers}
        onSubmit={mockOnSubmit}
        onSaveDraft={mockOnSaveDraft}
      />
    );

    // Check batch information section
    expect(screen.getByText('Test Batch Information')).toBeInTheDocument();
    expect(screen.getByLabelText('Batch Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Notes')).toBeInTheDocument();

    // Check tabs
    expect(screen.getByRole('tab', { name: 'Individual Entry' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Bulk Entry' })).toBeInTheDocument();

    // Check initial state
    expect(screen.getByText('0 test entries added')).toBeInTheDocument();
  });

  describe('Batch Information', () => {
    it('allows entering batch information', async () => {
      renderWithProviders(
        <PhysicalTestingForm 
          players={mockPlayers}
          onSubmit={mockOnSubmit}
          onSaveDraft={mockOnSaveDraft}
        />
      );

      const batchNameInput = screen.getByLabelText('Batch Name');
      const notesTextarea = screen.getByLabelText('Notes');

      await user.type(batchNameInput, 'Pre-Season 2024');
      await user.type(notesTextarea, 'Initial fitness assessment for all players');

      expect(batchNameInput).toHaveValue('Pre-Season 2024');
      expect(notesTextarea).toHaveValue('Initial fitness assessment for all players');
    });
  });

  describe('Individual Entry Tab', () => {
    it('allows selecting a test type', async () => {
      renderWithProviders(
        <PhysicalTestingForm 
          players={mockPlayers}
          onSubmit={mockOnSubmit}
          onSaveDraft={mockOnSaveDraft}
        />
      );

      // Click on the test type dropdown (click the trigger button, not the inner span)
      await clickTestTypeSelect();

      // Check that all test types are available
      expect(screen.getByText('Vertical Jump')).toBeInTheDocument();
      expect(screen.getByText('Bench Press 1RM')).toBeInTheDocument();
      expect(screen.getByText('VO2 Max')).toBeInTheDocument();
      expect(screen.getByText('40m Sprint')).toBeInTheDocument();

      // Select a test type
      await user.click(screen.getByText('Vertical Jump'));
      
      // Player buttons should now be visible
      expect(screen.getByRole('button', { name: /John Doe/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Jane Smith/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Mike Johnson/i })).toBeInTheDocument();
    });

    it('adds individual test entries for players', async () => {
      renderWithProviders(
        <PhysicalTestingForm 
          players={mockPlayers}
          onSubmit={mockOnSubmit}
          onSaveDraft={mockOnSaveDraft}
        />
      );

      // Select test type
      await clickTestTypeSelect();
      await user.click(screen.getByText('Vertical Jump'));

      // Add test for John Doe
      await user.click(screen.getByRole('button', { name: /John Doe/i }));

      // Check that entry count updated
      expect(screen.getByText('1 test entries added')).toBeInTheDocument();

      // Check that test entry form appears
      expect(screen.getByText('Test Results Entry')).toBeInTheDocument();
      expect(screen.getAllByText('John Doe').length).toBeGreaterThan(0);
      expect(screen.getByText('Forward')).toBeInTheDocument();
      expect(screen.getAllByText('Vertical Jump').length).toBeGreaterThan(0);

      // The button should now be disabled
      const johnButton = screen.getByRole('button', { name: /John Doe/i });
      expect(johnButton).toBeDisabled();
    });

    it('prevents adding duplicate entries', async () => {
      renderWithProviders(
        <PhysicalTestingForm 
          players={mockPlayers}
          onSubmit={mockOnSubmit}
          onSaveDraft={mockOnSaveDraft}
        />
      );

      // Select test type and add entry
      await clickTestTypeSelect();
      await user.click(screen.getByText('Vertical Jump'));
      await user.click(screen.getByRole('button', { name: /John Doe/i }));

      // Button should be disabled
      const johnButton = screen.getByRole('button', { name: /John Doe/i });
      expect(johnButton).toBeDisabled();
    });
  });

  describe('Bulk Entry Tab', () => {
    it('allows bulk test entry for all players', async () => {
      renderWithProviders(
        <PhysicalTestingForm 
          players={mockPlayers}
          onSubmit={mockOnSubmit}
          onSaveDraft={mockOnSaveDraft}
        />
      );

      // Switch to bulk entry tab
      await user.click(screen.getByRole('tab', { name: 'Bulk Entry' }));

      // Select test type
      await clickTestTypeSelect('bulk');
      await user.click(screen.getByText('Bench Press 1RM'));

      // Click add button
      const addButton = screen.getByRole('button', { name: /Add Bench Press 1RM for All 3 Players/i });
      await user.click(addButton);

      // Check that entries were added
      expect(screen.getByText('3 test entries added')).toBeInTheDocument();

      // Check that all players have entries
      expect(screen.getByText('Test Results Entry')).toBeInTheDocument();
      expect(screen.getAllByText('Bench Press 1RM')).toHaveLength(3);
    });

    it('clears the selection after adding bulk entries', async () => {
      renderWithProviders(
        <PhysicalTestingForm 
          players={mockPlayers}
          onSubmit={mockOnSubmit}
          onSaveDraft={mockOnSaveDraft}
        />
      );

      await user.click(screen.getByRole('tab', { name: 'Bulk Entry' }));
      await clickTestTypeSelect('bulk');
      await user.click(screen.getByText('VO2 Max'));
      await user.click(screen.getByRole('button', { name: /Add VO2 Max for All 3 Players/i }));

      // The select should be reset
      expect(screen.getByText('Choose a test type')).toBeInTheDocument();
    });
  });

  describe('Test Entry Management', () => {
    it('allows entering test values', async () => {
      renderWithProviders(
        <PhysicalTestingForm 
          players={mockPlayers}
          onSubmit={mockOnSubmit}
          onSaveDraft={mockOnSaveDraft}
        />
      );

      // Add a test entry
      await clickTestTypeSelect();
      await user.click(screen.getByText('Vertical Jump'));
      await user.click(screen.getByRole('button', { name: /John Doe/i }));

      // Find the value input and enter a value
      const valueInput = screen.getByPlaceholderText('Value');
      await user.type(valueInput, '65.5');

      expect(valueInput).toHaveValue(65.5);
    });

    it('allows adding notes to test entries', async () => {
      renderWithProviders(
        <PhysicalTestingForm 
          players={mockPlayers}
          onSubmit={mockOnSubmit}
          onSaveDraft={mockOnSaveDraft}
        />
      );

      // Add a test entry
      await clickTestTypeSelect();
      await user.click(screen.getByText('40m Sprint'));
      await user.click(screen.getByRole('button', { name: /Jane Smith/i }));

      // Add note
      const notesInput = screen.getByPlaceholderText('Notes (optional)');
      await user.type(notesInput, 'Slight hamstring tightness');

      expect(notesInput).toHaveValue('Slight hamstring tightness');
    });

    it('displays correct units for different test types', async () => {
      renderWithProviders(
        <PhysicalTestingForm 
          players={mockPlayers}
          onSubmit={mockOnSubmit}
          onSaveDraft={mockOnSaveDraft}
        />
      );

      // Add vertical jump (cm)
      await clickTestTypeSelect();
      await user.click(screen.getByText('Vertical Jump'));
      await user.click(screen.getByRole('button', { name: /John Doe/i }));

      expect(screen.getByText('cm')).toBeInTheDocument();

      // Add sprint test (seconds)
      await clickTestTypeSelect();
      await user.click(screen.getByText('40m Sprint'));
      await user.click(screen.getByRole('button', { name: /Jane Smith/i }));

      expect(screen.getByText('seconds')).toBeInTheDocument();

      // Add body fat (%)
      await clickTestTypeSelect();
      await user.click(screen.getByText('Body Fat %'));
      await user.click(screen.getByRole('button', { name: /Mike Johnson/i }));

      expect(screen.getByText('%')).toBeInTheDocument();
    });

    it('allows removing test entries', async () => {
      renderWithProviders(
        <PhysicalTestingForm 
          players={mockPlayers}
          onSubmit={mockOnSubmit}
          onSaveDraft={mockOnSaveDraft}
        />
      );

      // Add a test entry
      await clickTestTypeSelect();
      await user.click(screen.getByText('Vertical Jump'));
      await user.click(screen.getByRole('button', { name: /John Doe/i }));

      expect(screen.getByText('1 test entries added')).toBeInTheDocument();

      // Remove the entry
      const removeButton = screen.getByRole('button', { name: '' }); // X button has no text
      await user.click(removeButton);

      expect(screen.getByText('0 test entries added')).toBeInTheDocument();
      expect(screen.queryByText('Test Results Entry')).not.toBeInTheDocument();
    });
  });

  describe('Form Actions', () => {
    it('shows action buttons only when entries exist', () => {
      renderWithProviders(
        <PhysicalTestingForm 
          players={mockPlayers}
          onSubmit={mockOnSubmit}
          onSaveDraft={mockOnSaveDraft}
        />
      );

      // No buttons initially
      expect(screen.queryByRole('button', { name: /Save Draft/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Submit Results/i })).not.toBeInTheDocument();
    });

    it('enables submit button only when all values are filled', async () => {
      renderWithProviders(
        <PhysicalTestingForm 
          players={mockPlayers}
          onSubmit={mockOnSubmit}
          onSaveDraft={mockOnSaveDraft}
        />
      );

      // Add a test entry
      await clickTestTypeSelect();
      await user.click(screen.getByText('Vertical Jump'));
      await user.click(screen.getByRole('button', { name: /John Doe/i }));

      // Submit button should be disabled initially
      const submitButton = screen.getByRole('button', { name: /Submit Results/i });
      expect(submitButton).toBeDisabled();

      // Enter a value
      const valueInput = screen.getByPlaceholderText('Value');
      await user.type(valueInput, '65');

      // Submit button should now be enabled
      expect(submitButton).toBeEnabled();
    });

    it('validates numeric input', async () => {
      renderWithProviders(
        <PhysicalTestingForm 
          players={mockPlayers}
          onSubmit={mockOnSubmit}
          onSaveDraft={mockOnSaveDraft}
        />
      );

      // Add a test entry
      await clickTestTypeSelect();
      await user.click(screen.getByText('Vertical Jump'));
      await user.click(screen.getByRole('button', { name: /John Doe/i }));

      // Enter invalid value
      const valueInput = screen.getByPlaceholderText('Value');
      await user.type(valueInput, 'abc');

      // Submit button should remain disabled
      const submitButton = screen.getByRole('button', { name: /Submit Results/i });
      expect(submitButton).toBeDisabled();
    });

    it('calls onSaveDraft when save draft is clicked', async () => {
      renderWithProviders(
        <PhysicalTestingForm 
          players={mockPlayers}
          onSubmit={mockOnSubmit}
          onSaveDraft={mockOnSaveDraft}
        />
      );

      // Add a test entry
      await clickTestTypeSelect();
      await user.click(screen.getByText('Vertical Jump'));
      await user.click(screen.getByRole('button', { name: /John Doe/i }));

      // Click save draft
      const saveDraftButton = screen.getByRole('button', { name: /Save Draft/i });
      await user.click(saveDraftButton);

      expect(mockOnSaveDraft).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            playerId: '1',
            testType: 'Vertical Jump',
            unit: 'cm',
          })
        ])
      );
    });

    it('submits form data correctly', async () => {
      renderWithProviders(
        <PhysicalTestingForm 
          players={mockPlayers}
          onSubmit={mockOnSubmit}
          onSaveDraft={mockOnSaveDraft}
        />
      );

      // Enter batch information
      await user.type(screen.getByLabelText('Batch Name'), 'Pre-Season 2024');
      await user.type(screen.getByLabelText('Notes'), 'Initial assessment');

      // Add test entries
      await clickTestTypeSelect();
      await user.click(screen.getByText('Vertical Jump'));
      await user.click(screen.getByRole('button', { name: /John Doe/i }));

      // Enter value
      const valueInput = screen.getByPlaceholderText('Value');
      await user.type(valueInput, '65.5');

      // Submit
      const submitButton = screen.getByRole('button', { name: /Submit Results/i });
      await user.click(submitButton);

      // Wait for success message
      await waitFor(() => {
        expect(screen.getAllByText('Test results submitted successfully!').length).toBeGreaterThan(0);
      });

      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            playerId: '1',
            testType: 'Vertical Jump',
            value: '65.5',
            unit: 'cm',
          })
        ])
      );
    });

    it('shows success alert after submission', async () => {
      renderWithProviders(
        <PhysicalTestingForm 
          players={mockPlayers}
          onSubmit={mockOnSubmit}
          onSaveDraft={mockOnSaveDraft}
        />
      );

      // Add and submit a test
      await clickTestTypeSelect();
      await user.click(screen.getByText('Vertical Jump'));
      await user.click(screen.getByRole('button', { name: /John Doe/i }));
      await user.type(screen.getByPlaceholderText('Value'), '65');
      await user.click(screen.getByRole('button', { name: /Submit Results/i }));

      // Check success alert
      const alerts = await screen.findAllByText('Test results submitted successfully!');
      expect(alerts.length).toBeGreaterThan(0);
    });

    it('resets form after successful submission', async () => {
      renderWithProviders(
        <PhysicalTestingForm 
          players={mockPlayers}
          onSubmit={mockOnSubmit}
          onSaveDraft={mockOnSaveDraft}
        />
      );

      // Fill form
      await user.type(screen.getByLabelText('Batch Name'), 'Test Batch');
      await clickTestTypeSelect();
      await user.click(screen.getByText('Vertical Jump'));
      await user.click(screen.getByRole('button', { name: /John Doe/i }));
      await user.type(screen.getByPlaceholderText('Value'), '65');

      // Submit
      await user.click(screen.getByRole('button', { name: /Submit Results/i }));

      // Wait for reset
      await waitFor(() => {
        expect(screen.getByLabelText('Batch Name')).toHaveValue('');
        expect(screen.getByLabelText('Notes')).toHaveValue('');
        expect(screen.getByText('0 test entries added')).toBeInTheDocument();
      });
    });
  });

  describe('Multiple Test Types', () => {
    it('groups entries by player', async () => {
      renderWithProviders(
        <PhysicalTestingForm 
          players={mockPlayers}
          onSubmit={mockOnSubmit}
          onSaveDraft={mockOnSaveDraft}
        />
      );

      // Add multiple tests for same player
      await clickTestTypeSelect();
      await user.click(within(await screen.findByRole('listbox')).getByText('Vertical Jump'));
      await user.click(screen.getByRole('button', { name: /John Doe/i }));

      await clickTestTypeSelect();
      await user.click(within(await screen.findByRole('listbox')).getByText('Bench Press 1RM'));
      await user.click(screen.getByRole('button', { name: /John Doe/i }));

      // Should see John Doe's section with both tests
      const johnHeading = screen.getByRole('heading', { level: 4, name: /john doe/i });
      const johnSection = johnHeading.closest('div.border');
      expect(johnSection).toBeTruthy();
      expect(within(johnSection!).getByText('Vertical Jump')).toBeInTheDocument();
      expect(within(johnSection!).getByText('Bench Press 1RM')).toBeInTheDocument();
    });

    it('handles mixed individual and bulk entries', async () => {
      renderWithProviders(
        <PhysicalTestingForm 
          players={mockPlayers}
          onSubmit={mockOnSubmit}
          onSaveDraft={mockOnSaveDraft}
        />
      );

      // Add individual entry
      await clickTestTypeSelect();
      await user.click(screen.getByText('Vertical Jump'));
      await user.click(screen.getByRole('button', { name: /John Doe/i }));

      // Switch to bulk and add for all
      await user.click(screen.getByRole('tab', { name: 'Bulk Entry' }));
      await clickTestTypeSelect('bulk');
      await user.click(screen.getByText('40m Sprint'));
      await user.click(screen.getByRole('button', { name: /Add 40m Sprint for All 3 Players/i }));

      // Should have 4 total entries (1 individual + 3 bulk)
      expect(screen.getByText('4 test entries added')).toBeInTheDocument();
    });
  });
});