import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  PlayerCardSkeleton,
  WorkoutCardSkeleton,
  DashboardWidgetSkeleton,
  TableRowSkeleton,
  FormSkeleton
} from '../../components/ui/skeletons';

describe('Phase 2: Skeleton Screens', () => {
  describe('PlayerCardSkeleton', () => {
    it('renders player card skeleton structure', () => {
      render(<PlayerCardSkeleton />);
      
      // Check for avatar skeleton
      const avatar = screen.getByTestId('player-avatar-skeleton');
      expect(avatar).toBeInTheDocument();
      expect(avatar).toHaveClass('rounded-full');
      
      // Check for name skeleton
      const name = screen.getByTestId('player-name-skeleton');
      expect(name).toBeInTheDocument();
      expect(name).toHaveClass('h-6 w-32');
      
      // Check for team skeleton
      const team = screen.getByTestId('player-team-skeleton');
      expect(team).toBeInTheDocument();
      expect(team).toHaveClass('h-4 w-24');
      
      // Check for status skeleton
      const status = screen.getByTestId('player-status-skeleton');
      expect(status).toBeInTheDocument();
    });

    it('has proper layout structure', () => {
      const { container } = render(<PlayerCardSkeleton />);
      const card = container.firstChild;
      
      expect(card).toHaveClass('rounded-lg');
      expect(card).toHaveClass('border');
      expect(card).toHaveClass('p-4');
    });

    it('animates all skeleton elements', () => {
      render(<PlayerCardSkeleton />);
      
      const skeletons = screen.getAllByTestId(/skeleton/);
      skeletons.forEach(skeleton => {
        expect(skeleton).toHaveClass('animate-pulse');
      });
    });

    it('supports custom className', () => {
      render(<PlayerCardSkeleton className="custom-card" />);
      const card = screen.getByTestId('player-card-skeleton');
      expect(card).toHaveClass('custom-card');
    });
  });

  describe('WorkoutCardSkeleton', () => {
    it('renders workout card skeleton structure', () => {
      render(<WorkoutCardSkeleton />);
      
      // Check for title skeleton
      const title = screen.getByTestId('workout-title-skeleton');
      expect(title).toBeInTheDocument();
      expect(title).toHaveClass('h-6 w-48');
      
      // Check for type badge skeleton
      const badge = screen.getByTestId('workout-type-skeleton');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('h-6 w-20');
      
      // Check for exercise list skeletons
      const exercises = screen.getAllByTestId(/exercise-\d+-skeleton/);
      expect(exercises).toHaveLength(3);
      
      // Check for footer skeletons
      const duration = screen.getByTestId('workout-duration-skeleton');
      expect(duration).toBeInTheDocument();
      
      const players = screen.getByTestId('workout-players-skeleton');
      expect(players).toBeInTheDocument();
    });

    it('shows correct number of exercise placeholders', () => {
      render(<WorkoutCardSkeleton exerciseCount={5} />);
      const exercises = screen.getAllByTestId(/exercise-\d+-skeleton/);
      expect(exercises).toHaveLength(5);
    });

    it('has hover state styling', () => {
      const { container } = render(<WorkoutCardSkeleton />);
      const card = container.firstChild;
      expect(card).toHaveClass('hover:shadow-md');
    });

    it('includes action buttons skeleton', () => {
      render(<WorkoutCardSkeleton showActions />);
      const actions = screen.getByTestId('workout-actions-skeleton');
      expect(actions).toBeInTheDocument();
      
      const buttons = actions.querySelectorAll('.h-8.w-8');
      expect(buttons).toHaveLength(3); // Edit, Duplicate, Delete
    });
  });

  describe('DashboardWidgetSkeleton', () => {
    it('renders widget skeleton with header and content', () => {
      render(<DashboardWidgetSkeleton />);
      
      // Check header elements
      const title = screen.getByTestId('widget-title-skeleton');
      expect(title).toBeInTheDocument();
      expect(title).toHaveClass('h-6 w-32');
      
      const subtitle = screen.getByTestId('widget-subtitle-skeleton');
      expect(subtitle).toBeInTheDocument();
      expect(subtitle).toHaveClass('h-4 w-24');
      
      // Check content area
      const content = screen.getByTestId('widget-content-skeleton');
      expect(content).toBeInTheDocument();
      expect(content).toHaveClass('h-32');
    });

    it('renders different widget sizes', () => {
      const sizes = ['sm', 'md', 'lg'] as const;
      const expectedHeights = {
        sm: 'h-24',
        md: 'h-32',
        lg: 'h-48'
      };
      
      sizes.forEach(size => {
        render(<DashboardWidgetSkeleton size={size} data-testid={`widget-${size}`} />);
        const content = screen.getByTestId('widget-content-skeleton');
        expect(content).toHaveClass(expectedHeights[size]);
      });
    });

    it('shows action button skeleton when specified', () => {
      render(<DashboardWidgetSkeleton showAction />);
      const action = screen.getByTestId('widget-action-skeleton');
      expect(action).toBeInTheDocument();
      expect(action).toHaveClass('h-8 w-8');
    });

    it('supports custom content height', () => {
      render(<DashboardWidgetSkeleton contentHeight="h-64" />);
      const content = screen.getByTestId('widget-content-skeleton');
      expect(content).toHaveClass('h-64');
    });
  });

  describe('TableRowSkeleton', () => {
    it('renders table row with correct number of cells', () => {
      render(
        <table>
          <tbody>
            <TableRowSkeleton columns={5} />
          </tbody>
        </table>
      );
      
      const cells = screen.getAllByTestId(/cell-\d+-skeleton/);
      expect(cells).toHaveLength(5);
    });

    it('renders custom column widths', () => {
      const widths = ['w-12', 'w-32', 'w-24', 'w-16'];
      render(
        <table>
          <tbody>
            <TableRowSkeleton columns={4} columnWidths={widths} />
          </tbody>
        </table>
      );
      
      widths.forEach((width, index) => {
        const cell = screen.getByTestId(`cell-${index}-skeleton`);
        expect(cell.firstChild).toHaveClass(width);
      });
    });

    it('renders multiple rows', () => {
      render(
        <table>
          <tbody>
            <TableRowSkeleton columns={3} rows={5} />
          </tbody>
        </table>
      );
      
      const rows = screen.getAllByRole('row');
      expect(rows).toHaveLength(5);
      
      // Check total cells (3 columns × 5 rows)
      const cells = screen.getAllByTestId(/cell-\d+-skeleton/);
      expect(cells).toHaveLength(15);
    });

    it('applies hover effect to rows', () => {
      const { container } = render(
        <table>
          <tbody>
            <TableRowSkeleton columns={3} />
          </tbody>
        </table>
      );
      
      const row = container.querySelector('tr');
      expect(row).toHaveClass('hover:bg-gray-50');
    });

    it('shows checkbox skeleton when specified', () => {
      render(
        <table>
          <tbody>
            <TableRowSkeleton columns={3} showCheckbox />
          </tbody>
        </table>
      );
      
      const checkbox = screen.getByTestId('checkbox-skeleton');
      expect(checkbox).toBeInTheDocument();
      expect(checkbox).toHaveClass('h-4 w-4');
      
      // Total cells should be columns + 1 for checkbox
      const cells = screen.getAllByRole('cell');
      expect(cells).toHaveLength(4);
    });
  });

  describe('FormSkeleton', () => {
    it('renders form skeleton with default fields', () => {
      render(<FormSkeleton />);
      
      // Default should have 3 fields
      const fields = screen.getAllByTestId(/field-\d+-skeleton/);
      expect(fields).toHaveLength(3);
      
      // Each field should have label and input
      fields.forEach((field, index) => {
        const label = field.querySelector(`[data-testid="label-${index}-skeleton"]`);
        const input = field.querySelector(`[data-testid="input-${index}-skeleton"]`);
        
        expect(label).toBeInTheDocument();
        expect(input).toBeInTheDocument();
      });
    });

    it('renders custom number of fields', () => {
      render(<FormSkeleton fields={5} />);
      const fields = screen.getAllByTestId(/field-\d+-skeleton/);
      expect(fields).toHaveLength(5);
    });

    it('renders different field types', () => {
      const fieldTypes = ['text', 'textarea', 'select', 'checkbox'] as const;
      render(<FormSkeleton fields={4} fieldTypes={fieldTypes} />);
      
      // Check textarea has different height
      const textarea = screen.getByTestId('input-1-skeleton');
      expect(textarea).toHaveClass('h-24');
      
      // Check select has icon skeleton
      const selectField = screen.getByTestId('field-2-skeleton');
      const selectIcon = selectField.querySelector('[data-testid="select-icon-skeleton"]');
      expect(selectIcon).toBeInTheDocument();
      
      // Check checkbox has different layout
      const checkboxField = screen.getByTestId('field-3-skeleton');
      expect(checkboxField).toHaveClass('flex-row');
    });

    it('shows submit button skeleton', () => {
      render(<FormSkeleton showSubmit />);
      const submit = screen.getByTestId('submit-skeleton');
      expect(submit).toBeInTheDocument();
      expect(submit).toHaveClass('h-10 w-32');
    });

    it('shows form title skeleton', () => {
      render(<FormSkeleton title="User Settings" />);
      const title = screen.getByTestId('form-title-skeleton');
      expect(title).toBeInTheDocument();
      expect(title).toHaveClass('h-8 w-48');
    });

    it('supports two-column layout', () => {
      render(<FormSkeleton fields={4} columns={2} />);
      const form = screen.getByTestId('form-skeleton');
      const fieldContainer = form.querySelector('.grid');
      expect(fieldContainer).toHaveClass('grid-cols-2');
    });
  });

  describe('Skeleton Animation Consistency', () => {
    it('all skeletons use consistent animation', () => {
      render(
        <div>
          <PlayerCardSkeleton />
          <WorkoutCardSkeleton />
          <DashboardWidgetSkeleton />
          <table>
            <tbody>
              <TableRowSkeleton columns={3} />
            </tbody>
          </table>
          <FormSkeleton />
        </div>
      );
      
      const allSkeletons = screen.getAllByTestId(/skeleton/);
      allSkeletons.forEach(skeleton => {
        // Find the actual skeleton element (might be nested)
        const animatedElement = skeleton.querySelector('.animate-pulse') || skeleton;
        expect(animatedElement).toHaveClass('animate-pulse');
      });
    });

    it('all skeletons have consistent styling', () => {
      render(
        <div>
          <PlayerCardSkeleton />
          <WorkoutCardSkeleton />
          <DashboardWidgetSkeleton />
        </div>
      );
      
      const allSkeletons = screen.getAllByTestId(/skeleton/);
      allSkeletons.forEach(skeleton => {
        const bgElement = skeleton.querySelector('.bg-gray-200') || skeleton;
        expect(bgElement).toHaveClass('bg-gray-200');
      });
    });
  });

  describe('Responsive Behavior', () => {
    it('skeletons adapt to container width', () => {
      const { container } = render(
        <div className="w-64">
          <WorkoutCardSkeleton />
        </div>
      );
      
      const card = container.querySelector('[data-testid="workout-card-skeleton"]');
      expect(card).toHaveClass('w-full');
    });

    it('form skeleton adjusts columns on mobile', () => {
      // Mock mobile viewport
      global.innerWidth = 375;
      
      render(<FormSkeleton fields={4} columns={2} />);
      const form = screen.getByTestId('form-skeleton');
      const fieldContainer = form.querySelector('.grid');
      
      // Should have responsive classes
      expect(fieldContainer).toHaveClass('md:grid-cols-2');
    });
  });
});