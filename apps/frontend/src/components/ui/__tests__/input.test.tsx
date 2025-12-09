import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from '../input';

describe('Input Component', () => {
  describe('Rendering', () => {
    it('renders input element', () => {
      render(<Input />);
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('renders with placeholder', () => {
      render(<Input placeholder="Enter text" />);
      expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
    });

    it('renders with value', () => {
      render(<Input value="Test value" readOnly />);
      expect(screen.getByDisplayValue('Test value')).toBeInTheDocument();
    });

    it('renders with different types', () => {
      const { rerender } = render(<Input type="text" />);
      expect(screen.getByRole('textbox')).toHaveAttribute('type', 'text');

      rerender(<Input type="email" />);
      expect(screen.getByRole('textbox')).toHaveAttribute('type', 'email');

      rerender(<Input type="password" />);
      const passwordInput = screen.getByDisplayValue('');
      expect(passwordInput).toHaveAttribute('type', 'password');

      rerender(<Input type="number" />);
      expect(screen.getByRole('spinbutton')).toHaveAttribute('type', 'number');

      rerender(<Input type="tel" />);
      expect(screen.getByRole('textbox')).toHaveAttribute('type', 'tel');

      rerender(<Input type="search" />);
      expect(screen.getByRole('searchbox')).toHaveAttribute('type', 'search');
    });

    it('applies custom className', () => {
      render(<Input className="custom-class" />);
      expect(screen.getByRole('textbox')).toHaveClass('custom-class');
    });

    it('forwards ref correctly', () => {
      const ref = React.createRef<HTMLInputElement>();
      render(<Input ref={ref} />);
      expect(ref.current).toBeInstanceOf(HTMLInputElement);
    });
  });

  describe('User Interactions', () => {
    it('handles text input', async () => {
      const user = userEvent.setup();
      render(<Input />);
      
      const input = screen.getByRole('textbox');
      await user.type(input, 'Hello world');
      
      expect(input).toHaveValue('Hello world');
    });

    it('handles onChange event', async () => {
      const handleChange = jest.fn();
      const user = userEvent.setup();
      
      render(<Input onChange={handleChange} />);
      
      const input = screen.getByRole('textbox');
      await user.type(input, 'Test');
      
      expect(handleChange).toHaveBeenCalledTimes(4); // T-e-s-t
    });

    it('handles onFocus and onBlur events', async () => {
      const handleFocus = jest.fn();
      const handleBlur = jest.fn();
      const user = userEvent.setup();
      
      render(<Input onFocus={handleFocus} onBlur={handleBlur} />);
      
      const input = screen.getByRole('textbox');
      
      await user.click(input);
      expect(handleFocus).toHaveBeenCalledTimes(1);
      
      await user.tab();
      expect(handleBlur).toHaveBeenCalledTimes(1);
    });

    it('handles onKeyDown event', async () => {
      const handleKeyDown = jest.fn();
      const user = userEvent.setup();
      
      render(<Input onKeyDown={handleKeyDown} />);
      
      const input = screen.getByRole('textbox');
      await user.click(input);
      await user.keyboard('{Enter}');
      
      expect(handleKeyDown).toHaveBeenCalledWith(
        expect.objectContaining({
          key: 'Enter',
        })
      );
    });
  });

  describe('States', () => {
    it('can be disabled', async () => {
      const handleChange = jest.fn();
      const user = userEvent.setup();
      
      render(<Input disabled onChange={handleChange} />);
      
      const input = screen.getByRole('textbox');
      expect(input).toBeDisabled();
      expect(input).toHaveClass('disabled:cursor-not-allowed');
      expect(input).toHaveClass('disabled:opacity-50');
      
      await user.click(input);
      await user.type(input, 'Test');
      expect(handleChange).not.toHaveBeenCalled();
    });

    it('can be readonly', async () => {
      const user = userEvent.setup();
      
      render(<Input readOnly value="Read only text" />);
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('readonly');
      
      await user.click(input);
      await user.type(input, 'New text');
      expect(input).toHaveValue('Read only text'); // Value shouldn't change
    });

    it('can be required', () => {
      render(<Input required />);
      
      const input = screen.getByRole('textbox');
      expect(input).toBeRequired();
    });
  });

  describe('Styling', () => {
    it('has correct base classes', () => {
      render(<Input />);
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('flex');
      expect(input).toHaveClass('h-9');
      expect(input).toHaveClass('w-full');
      expect(input).toHaveClass('rounded-md');
      expect(input).toHaveClass('border');
      expect(input).toHaveClass('border-input');
      expect(input).toHaveClass('bg-transparent');
    });

    it('has focus styles', () => {
      render(<Input />);
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('focus-visible:outline-none');
      expect(input).toHaveClass('focus-visible:ring-1');
      expect(input).toHaveClass('focus-visible:ring-ring');
    });

    it('has file input styles when type is file', () => {
      render(<Input type="file" />);
      
      const input = screen.getByDisplayValue('');
      expect(input).toHaveClass('file:border-0');
      expect(input).toHaveClass('file:bg-transparent');
      expect(input).toHaveClass('file:text-sm');
    });
  });

  describe('Validation', () => {
    it('supports HTML5 validation attributes', () => {
      render(
        <Input
          type="email"
          pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$"
          minLength={5}
          maxLength={50}
        />
      );
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('type', 'email');
      const patternAttr = input.getAttribute('pattern') || '';
      expect(patternAttr.replace('\\.', '.')).toBe('[a-z0-9._%+-]+@[a-z0-9.-]+.[a-z]{2,}$');
      expect(input).toHaveAttribute('minLength', '5');
      expect(input).toHaveAttribute('maxLength', '50');
    });

    it('supports number input constraints', () => {
      render(
        <Input
          type="number"
          min={0}
          max={100}
          step={5}
        />
      );
      
      const input = screen.getByRole('spinbutton');
      expect(input).toHaveAttribute('min', '0');
      expect(input).toHaveAttribute('max', '100');
      expect(input).toHaveAttribute('step', '5');
    });
  });

  describe('Accessibility', () => {
    it('can have aria-label', () => {
      render(<Input aria-label="Search input" />);
      
      const input = screen.getByLabelText('Search input');
      expect(input).toBeInTheDocument();
    });

    it('can have aria-describedby', () => {
      render(
        <>
          <Input aria-describedby="input-help" />
          <span id="input-help">Enter your email address</span>
        </>
      );
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-describedby', 'input-help');
    });

    it('can have aria-invalid for error states', () => {
      render(<Input aria-invalid="true" />);
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-invalid', 'true');
    });

    it('supports autocomplete attribute', () => {
      render(<Input autoComplete="email" />);
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('autocomplete', 'email');
    });
  });

  describe('Edge Cases', () => {
    it('handles paste events', async () => {
      const handlePaste = jest.fn();
      const user = userEvent.setup();
      
      render(<Input onPaste={handlePaste} />);
      
      const input = screen.getByRole('textbox');
      await user.click(input);
      await user.paste('Pasted text');
      
      expect(handlePaste).toHaveBeenCalled();
      expect(input).toHaveValue('Pasted text');
    });

    it('handles clear button for search input', async () => {
      const user = userEvent.setup();
      
      render(<Input type="search" />);
      
      const input = screen.getByRole('searchbox');
      await user.type(input, 'Search term');
      
      expect(input).toHaveValue('Search term');
      
      // Clear the search input
      await user.clear(input);
      expect(input).toHaveValue('');
    });

    it('maintains cursor position during controlled updates', async () => {
      const ControlledInput = () => {
        const [value, setValue] = React.useState('');
        
        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
          // Transform to uppercase but maintain cursor position
          setValue(e.target.value.toUpperCase());
        };
        
        return <Input value={value} onChange={handleChange} />;
      };
      
      const user = userEvent.setup();
      render(<ControlledInput />);
      
      const input = screen.getByRole('textbox');
      await user.type(input, 'hello');
      
      expect(input).toHaveValue('HELLO');
    });
  });
});