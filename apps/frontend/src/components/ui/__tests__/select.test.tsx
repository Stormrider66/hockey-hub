import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '../select';

describe('Select Component', () => {
  const defaultOptions = [
    { value: 'player', label: 'Player' },
    { value: 'coach', label: 'Coach' },
    { value: 'parent', label: 'Parent' },
  ];

  const renderSelect = (props = {}) => {
    return render(
      <Select {...props}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select a role" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Roles</SelectLabel>
            {defaultOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    );
  };

  describe('Rendering', () => {
    it('renders select trigger with placeholder', () => {
      renderSelect();
      expect(screen.getByText('Select a role')).toBeInTheDocument();
    });

    it('renders with custom className on trigger', () => {
      render(
        <Select>
          <SelectTrigger className="custom-trigger-class">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="test">Test</SelectItem>
          </SelectContent>
        </Select>
      );
      
      const trigger = screen.getByRole('combobox');
      expect(trigger).toHaveClass('custom-trigger-class');
    });

    it('renders with disabled state', () => {
      render(
        <Select disabled>
          <SelectTrigger>
            <SelectValue placeholder="Disabled select" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="test">Test</SelectItem>
          </SelectContent>
        </Select>
      );
      
      const trigger = screen.getByRole('combobox');
      expect(trigger).toHaveAttribute('aria-disabled', 'true');
    });
  });

  describe('User Interactions', () => {
    it('opens dropdown when trigger is clicked', async () => {
      const user = userEvent.setup();
      renderSelect();
      
      const trigger = screen.getByRole('combobox');
      expect(trigger).toHaveAttribute('aria-expanded', 'false');
      
      await user.click(trigger);
      
      await waitFor(() => {
        expect(trigger).toHaveAttribute('aria-expanded', 'true');
        expect(screen.getByText('Player')).toBeInTheDocument();
        expect(screen.getByText('Coach')).toBeInTheDocument();
        expect(screen.getByText('Parent')).toBeInTheDocument();
      });
    });

    it('selects an option when clicked', async () => {
      const user = userEvent.setup();
      const handleChange = jest.fn();
      
      render(
        <Select onValueChange={handleChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select a role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="player">Player</SelectItem>
            <SelectItem value="coach">Coach</SelectItem>
          </SelectContent>
        </Select>
      );
      
      const trigger = screen.getByRole('combobox');
      await user.click(trigger);
      
      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'Player' })).toBeInTheDocument();
      });
      
      await user.click(screen.getByRole('option', { name: 'Player' }));
      
      expect(handleChange).toHaveBeenCalledWith('player');
      expect(screen.getByText('Player')).toBeInTheDocument();
    });

    it('closes dropdown after selection', async () => {
      const user = userEvent.setup();
      renderSelect();
      
      const trigger = screen.getByRole('combobox');
      await user.click(trigger);
      
      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'Coach' })).toBeInTheDocument();
      });
      
      await user.click(screen.getByRole('option', { name: 'Coach' }));
      
      await waitFor(() => {
        expect(trigger).toHaveAttribute('aria-expanded', 'false');
      });
    });

    it('closes dropdown when Escape is pressed', async () => {
      const user = userEvent.setup();
      renderSelect();
      
      const trigger = screen.getByRole('combobox');
      await user.click(trigger);
      
      await waitFor(() => {
        expect(trigger).toHaveAttribute('aria-expanded', 'true');
      });
      
      await user.keyboard('{Escape}');
      
      await waitFor(() => {
        expect(trigger).toHaveAttribute('aria-expanded', 'false');
      });
    });
  });

  describe('Keyboard Navigation', () => {
    it('opens dropdown with Enter key', async () => {
      const user = userEvent.setup();
      renderSelect();
      
      const trigger = screen.getByRole('combobox');
      await user.click(trigger);
      await user.keyboard('{Escape}'); // Close it first
      
      await waitFor(() => {
        expect(trigger).toHaveAttribute('aria-expanded', 'false');
      });
      
      trigger.focus();
      await user.keyboard('{Enter}');
      
      await waitFor(() => {
        expect(trigger).toHaveAttribute('aria-expanded', 'true');
      });
    });

    it('navigates options with arrow keys', async () => {
      const user = userEvent.setup();
      renderSelect();
      
      const trigger = screen.getByRole('combobox');
      await user.click(trigger);
      
      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'Player' })).toBeInTheDocument();
      });
      
      await user.keyboard('{ArrowDown}');
      // First option should be focused
      expect(screen.getByRole('option', { name: 'Player' })).toHaveAttribute('data-highlighted');
      
      await user.keyboard('{ArrowDown}');
      // Second option should be focused
      expect(screen.getByRole('option', { name: 'Coach' })).toHaveAttribute('data-highlighted');
      
      await user.keyboard('{ArrowUp}');
      // Back to first option
      expect(screen.getByRole('option', { name: 'Player' })).toHaveAttribute('data-highlighted');
    });

    it('selects option with Enter key', async () => {
      const user = userEvent.setup();
      const handleChange = jest.fn();
      
      render(
        <Select onValueChange={handleChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select a role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="player">Player</SelectItem>
            <SelectItem value="coach">Coach</SelectItem>
          </SelectContent>
        </Select>
      );
      
      const trigger = screen.getByRole('combobox');
      await user.click(trigger);
      
      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'Player' })).toBeInTheDocument();
      });
      
      await user.keyboard('{ArrowDown}{Enter}');
      
      expect(handleChange).toHaveBeenCalledWith('player');
    });
  });

  describe('Controlled Component', () => {
    it('displays selected value when controlled', () => {
      render(
        <Select value="coach">
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="player">Player</SelectItem>
            <SelectItem value="coach">Coach</SelectItem>
          </SelectContent>
        </Select>
      );
      
      expect(screen.getByText('Coach')).toBeInTheDocument();
    });

    it('updates value when prop changes', () => {
      const { rerender } = render(
        <Select value="player">
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="player">Player</SelectItem>
            <SelectItem value="coach">Coach</SelectItem>
          </SelectContent>
        </Select>
      );
      
      expect(screen.getByText('Player')).toBeInTheDocument();
      
      rerender(
        <Select value="coach">
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="player">Player</SelectItem>
            <SelectItem value="coach">Coach</SelectItem>
          </SelectContent>
        </Select>
      );
      
      expect(screen.getByText('Coach')).toBeInTheDocument();
    });
  });

  describe('Complex Select Features', () => {
    it('renders with groups and labels', async () => {
      const user = userEvent.setup();
      
      render(
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Select an option" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Team Members</SelectLabel>
              <SelectItem value="player">Player</SelectItem>
              <SelectItem value="coach">Coach</SelectItem>
            </SelectGroup>
            <SelectSeparator />
            <SelectGroup>
              <SelectLabel>Other</SelectLabel>
              <SelectItem value="parent">Parent</SelectItem>
              <SelectItem value="staff">Staff</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      );
      
      await user.click(screen.getByRole('combobox'));
      
      await waitFor(() => {
        expect(screen.getByText('Team Members')).toBeInTheDocument();
        expect(screen.getByText('Other')).toBeInTheDocument();
      });
    });

    it('shows check mark for selected item', async () => {
      const user = userEvent.setup();
      
      render(
        <Select value="coach">
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="player">Player</SelectItem>
            <SelectItem value="coach">Coach</SelectItem>
          </SelectContent>
        </Select>
      );
      
      await user.click(screen.getByRole('combobox'));
      
      await waitFor(() => {
        const coachOption = screen.getByRole('option', { name: 'Coach' });
        const checkIcon = coachOption.querySelector('svg');
        expect(checkIcon).toBeInTheDocument();
      });
    });

    it('handles disabled items', async () => {
      const user = userEvent.setup();
      const handleChange = jest.fn();
      
      render(
        <Select onValueChange={handleChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select a role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="player">Player</SelectItem>
            <SelectItem value="coach" disabled>Coach (Disabled)</SelectItem>
          </SelectContent>
        </Select>
      );
      
      await user.click(screen.getByRole('combobox'));
      
      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'Coach (Disabled)' })).toBeInTheDocument();
      });
      
      const disabledOption = screen.getByRole('option', { name: 'Coach (Disabled)' });
      expect(disabledOption).toHaveAttribute('aria-disabled', 'true');
      
      await user.click(disabledOption);
      expect(handleChange).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      renderSelect();
      
      const trigger = screen.getByRole('combobox');
      expect(trigger).toHaveAttribute('aria-haspopup', 'listbox');
      expect(trigger).toHaveAttribute('aria-expanded', 'false');
    });

    it('associates label with select', async () => {
      const user = userEvent.setup();
      
      render(
        <>
          <label htmlFor="role-select">Role</label>
          <Select>
            <SelectTrigger id="role-select">
              <SelectValue placeholder="Select a role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="player">Player</SelectItem>
            </SelectContent>
          </Select>
        </>
      );
      
      const trigger = screen.getByLabelText('Role');
      expect(trigger).toBeInTheDocument();
    });

    it('announces selected value to screen readers', async () => {
      const user = userEvent.setup();
      renderSelect();
      
      const trigger = screen.getByRole('combobox');
      await user.click(trigger);
      
      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'Player' })).toBeInTheDocument();
      });
      
      await user.click(screen.getByRole('option', { name: 'Player' }));
      
      // The selected value should be announced
      expect(trigger).toHaveAttribute('aria-label', expect.stringContaining('Player'));
    });
  });

  describe('Edge Cases', () => {
    it('handles empty options gracefully', () => {
      render(
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="No options available" />
          </SelectTrigger>
          <SelectContent>
            {/* No options */}
          </SelectContent>
        </Select>
      );
      
      expect(screen.getByText('No options available')).toBeInTheDocument();
    });

    it('handles long option text', async () => {
      const user = userEvent.setup();
      
      render(
        <Select>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="long">
              This is a very long option text that might need to be truncated
            </SelectItem>
          </SelectContent>
        </Select>
      );
      
      await user.click(screen.getByRole('combobox'));
      
      await waitFor(() => {
        expect(screen.getByText(/This is a very long option text/)).toBeInTheDocument();
      });
    });

    it('maintains focus after selection', async () => {
      const user = userEvent.setup();
      renderSelect();
      
      const trigger = screen.getByRole('combobox');
      await user.click(trigger);
      
      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'Player' })).toBeInTheDocument();
      });
      
      await user.click(screen.getByRole('option', { name: 'Player' }));
      
      // Trigger should maintain focus after selection
      expect(trigger).toHaveFocus();
    });
  });
});