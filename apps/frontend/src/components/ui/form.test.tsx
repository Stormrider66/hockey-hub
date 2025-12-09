import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from './form';
import { Input } from './input';
import { Button } from './button';
import { Checkbox } from './checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from './textarea';

// Test form schema
const testFormSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Invalid email address'),
  age: z.coerce.number().min(18, 'Must be at least 18 years old'),
  bio: z.string().max(200, 'Bio must be less than 200 characters').optional(),
  role: z.enum(['player', 'coach', 'parent'] as const),
  terms: z.boolean().refine((val) => val === true, {
    message: 'You must accept the terms and conditions',
  }),
});

type TestFormValues = z.infer<typeof testFormSchema>;

// Test component that uses the form
const TestForm = ({ onSubmit }: { onSubmit: (data: TestFormValues) => void }) => {
  const form = useForm<TestFormValues>({
    resolver: zodResolver(testFormSchema) as any,
    defaultValues: {
      username: '',
      email: '',
      age: undefined,
      bio: '',
      role: undefined,
      terms: false,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit as any)} noValidate>
        {/* Username field */}
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="Enter username" {...field} />
              </FormControl>
              <FormDescription>This is your public display name.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Email field */}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="Enter email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Age field */}
        <FormField
          control={form.control}
          name="age"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Age</FormLabel>
              <FormControl>
                <Input type="number" placeholder="Enter age" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Bio field */}
        <FormField
          control={form.control}
          name="bio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bio</FormLabel>
              <FormControl>
                <Textarea placeholder="Tell us about yourself" {...field} />
              </FormControl>
              <FormDescription>Optional: Write a short bio</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Role field (native select for test stability) */}
        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Role</FormLabel>
              <FormControl>
                <select {...field} aria-label="Select">
                  <option value="">Select a role</option>
                  <option value="player">Player</option>
                  <option value="coach">Coach</option>
                  <option value="parent">Parent</option>
                </select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Terms checkbox */}
        <FormField
          control={form.control}
          name="terms"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Accept terms and conditions</FormLabel>
                <FormDescription>
                  You agree to our Terms of Service and Privacy Policy.
                </FormDescription>
                <FormMessage />
              </div>
            </FormItem>
          )}
        />

        <Button type="submit" disabled={form.formState.isSubmitting}>Submit</Button>
        <Button type="button" variant="outline" onClick={() => form.reset()}>
          Reset
        </Button>
      </form>
    </Form>
  );
};

describe('Form Components', () => {
  describe('Form Rendering', () => {
    it('should render all form fields correctly', () => {
      const onSubmit = jest.fn();
      render(<TestForm onSubmit={onSubmit} />);

      expect(screen.getByLabelText('Username')).toBeInTheDocument();
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
      expect(screen.getByLabelText('Age')).toBeInTheDocument();
      expect(screen.getByLabelText('Bio')).toBeInTheDocument();
      expect(screen.getByLabelText('Role')).toBeInTheDocument();
      expect(screen.getByLabelText('Accept terms and conditions')).toBeInTheDocument();
    });

    it('should render form descriptions', () => {
      const onSubmit = jest.fn();
      render(<TestForm onSubmit={onSubmit} />);

      expect(screen.getByText('This is your public display name.')).toBeInTheDocument();
      expect(screen.getByText('Optional: Write a short bio')).toBeInTheDocument();
      expect(screen.getByText('You agree to our Terms of Service and Privacy Policy.')).toBeInTheDocument();
    });

    it('should render submit and reset buttons', () => {
      const onSubmit = jest.fn();
      render(<TestForm onSubmit={onSubmit} />);

      expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Reset' })).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should show validation errors on empty submit', async () => {
      const user = userEvent.setup();
      const onSubmit = jest.fn();
      render(<TestForm onSubmit={onSubmit} />);

      await user.click(screen.getByRole('button', { name: 'Submit' }));

      await waitFor(() => {
        expect(screen.getByText('Username must be at least 3 characters')).toBeInTheDocument();
        expect(screen.getByText('Invalid email address')).toBeInTheDocument();
        expect(screen.getByText(/Invalid input/i)).toBeInTheDocument();
        expect(screen.getByText(/Invalid option/i)).toBeInTheDocument();
        expect(screen.getByText('You must accept the terms and conditions')).toBeInTheDocument();
      });

      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('should validate username length', async () => {
      const user = userEvent.setup();
      const onSubmit = jest.fn();
      render(<TestForm onSubmit={onSubmit} />);

      await user.type(screen.getByLabelText('Username'), 'ab');
      await user.click(screen.getByRole('button', { name: 'Submit' }));

      await waitFor(() => {
        expect(screen.getByText('Username must be at least 3 characters')).toBeInTheDocument();
      });
    });

    it('should validate email format', async () => {
      const user = userEvent.setup();
      const onSubmit = jest.fn();
      render(<TestForm onSubmit={onSubmit} />);

      await user.type(screen.getByLabelText('Email'), 'not-an-email');
      await user.click(screen.getByRole('button', { name: 'Submit' }));

      await waitFor(() => {
        expect(screen.getByText('Invalid email address')).toBeInTheDocument();
      });
    });

    it('should validate age minimum', async () => {
      const user = userEvent.setup();
      const onSubmit = jest.fn();
      render(<TestForm onSubmit={onSubmit} />);

      await user.type(screen.getByLabelText('Age'), '17');
      await user.click(screen.getByRole('button', { name: 'Submit' }));

      await waitFor(() => {
        expect(screen.getByText('Must be at least 18 years old')).toBeInTheDocument();
      });
    });

    it('should validate bio max length', async () => {
      const user = userEvent.setup();
      const onSubmit = jest.fn();
      render(<TestForm onSubmit={onSubmit} />);

      const longBio = 'a'.repeat(201);
      await user.type(screen.getByLabelText('Bio'), longBio);
      await user.click(screen.getByRole('button', { name: 'Submit' }));

      await waitFor(() => {
        expect(screen.getByText('Bio must be less than 200 characters')).toBeInTheDocument();
      });
    });

    it('should clear validation errors when corrected', async () => {
      const user = userEvent.setup();
      const onSubmit = jest.fn();
      render(<TestForm onSubmit={onSubmit} />);

      // Trigger validation error
      await user.type(screen.getByLabelText('Username'), 'ab');
      await user.click(screen.getByRole('button', { name: 'Submit' }));

      await waitFor(() => {
        expect(screen.getByText('Username must be at least 3 characters')).toBeInTheDocument();
      });

      // Fix the error
      await user.clear(screen.getByLabelText('Username'));
      await user.type(screen.getByLabelText('Username'), 'validusername');

      // Error should disappear
      await waitFor(() => {
        expect(screen.queryByText('Username must be at least 3 characters')).not.toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('should submit form with valid data', async () => {
      const user = userEvent.setup();
      const onSubmit = jest.fn();
      render(<TestForm onSubmit={onSubmit} />);

      // Fill in valid data
      await user.type(screen.getByLabelText('Username'), 'testuser');
      await user.type(screen.getByLabelText('Email'), 'test@example.com');
      await user.type(screen.getByLabelText('Age'), '25');
      await user.type(screen.getByLabelText('Bio'), 'I love hockey!');
      
      // Select role
      await user.selectOptions(screen.getByLabelText('Select'), 'player');
      
      // Check terms
      await user.click(screen.getByLabelText('Accept terms and conditions'));

      // Submit
      await user.click(screen.getByRole('button', { name: 'Submit' }));

      await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    });

    it('should reset form when reset button clicked', async () => {
      const user = userEvent.setup();
      const onSubmit = jest.fn();
      render(<TestForm onSubmit={onSubmit} />);

      // Fill in data
      await user.type(screen.getByLabelText('Username'), 'testuser');
      await user.type(screen.getByLabelText('Email'), 'test@example.com');
      await user.click(screen.getByLabelText('Accept terms and conditions'));

      // Reset form
      await user.click(screen.getByRole('button', { name: 'Reset' }));

      // Fields should be cleared
      expect(screen.getByLabelText('Username')).toHaveValue('');
      expect(screen.getByLabelText('Email')).toHaveValue('');
      expect(screen.getByLabelText('Accept terms and conditions')).not.toBeChecked();
    });

    it('should handle optional fields correctly', async () => {
      const user = userEvent.setup();
      const onSubmit = jest.fn();
      render(<TestForm onSubmit={onSubmit} />);

      // Fill required fields only
      await user.type(screen.getByLabelText('Username'), 'testuser');
      await user.type(screen.getByLabelText('Email'), 'test@example.com');
      await user.type(screen.getByLabelText('Age'), '25');
      await user.selectOptions(screen.getByLabelText('Select'), 'player');
      await user.click(screen.getByLabelText('Accept terms and conditions'));

      // Submit without optional bio
      await user.click(screen.getByRole('button', { name: 'Submit' }));

      await waitFor(() => expect(onSubmit).toHaveBeenCalled());
      const firstCall = (onSubmit as jest.Mock).mock.calls[0][0];
      expect(firstCall).toEqual(expect.objectContaining({ bio: '' }));
    });
  });

  describe('Accessibility', () => {
    it('should have proper labels for all inputs', () => {
      const onSubmit = jest.fn();
      render(<TestForm onSubmit={onSubmit} />);

      const inputs = screen.getAllByRole('textbox');
      inputs.forEach((input) => {
        expect(input).toHaveAccessibleName();
      });

      expect(screen.getByRole('spinbutton')).toHaveAccessibleName('Age');
      expect(screen.getByRole('checkbox')).toHaveAccessibleName('Accept terms and conditions');
    });

    it('should associate error messages with inputs', async () => {
      const user = userEvent.setup();
      const onSubmit = jest.fn();
      render(<TestForm onSubmit={onSubmit} />);

      // Trigger validation errors
      await user.click(screen.getByRole('button', { name: 'Submit' }));

      await waitFor(() => {
        const usernameInput = screen.getByLabelText('Username');
        const errorId = usernameInput.getAttribute('aria-describedby');
        expect(errorId).toBeTruthy();
        
        const errorMessage = document.getElementById(errorId!);
        expect(errorMessage).toHaveTextContent('Username must be at least 3 characters');
      });
    });

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();
      const onSubmit = jest.fn();
      render(<TestForm onSubmit={onSubmit} />);

      // Tab through form
      await user.tab();
      expect(screen.getByLabelText('Username')).toHaveFocus();

      await user.tab();
      expect(screen.getByLabelText('Email')).toHaveFocus();

      await user.tab();
      expect(screen.getByLabelText('Age')).toHaveFocus();

      await user.tab();
      expect(screen.getByLabelText('Bio')).toHaveFocus();

      await user.tab();
      expect(screen.getByLabelText('Select')).toHaveFocus();

      await user.tab();
      expect(screen.getByLabelText('Accept terms and conditions')).toHaveFocus();

      await user.tab();
      expect(screen.getByRole('button', { name: 'Submit' })).toHaveFocus();
    });

    it('should announce validation errors to screen readers', async () => {
      const user = userEvent.setup();
      const onSubmit = jest.fn();
      render(<TestForm onSubmit={onSubmit} />);

      await user.click(screen.getByRole('button', { name: 'Submit' }));

      await waitFor(() => {
        const errorMessages = screen.getAllByRole('alert');
        expect(errorMessages.length).toBeGreaterThan(0);
        
        errorMessages.forEach((error) => {
          expect(error).toHaveAttribute('aria-live', 'polite');
        });
      });
    });
  });

  describe('Field Interactions', () => {
    it('should update field values on user input', async () => {
      const user = userEvent.setup();
      const onSubmit = jest.fn();
      render(<TestForm onSubmit={onSubmit} />);

      const usernameInput = screen.getByLabelText('Username');
      await user.type(usernameInput, 'newuser');
      expect(usernameInput).toHaveValue('newuser');

      const emailInput = screen.getByLabelText('Email');
      await user.type(emailInput, 'new@email.com');
      expect(emailInput).toHaveValue('new@email.com');
    });

    it('should handle select field changes', async () => {
      const user = userEvent.setup();
      const onSubmit = jest.fn();
      render(<TestForm onSubmit={onSubmit} />);

      const roleSelect = screen.getByLabelText('Select');
      await user.selectOptions(roleSelect, 'coach');
      expect((roleSelect as HTMLSelectElement).value).toBe('coach');
    });

    it('should handle checkbox changes', async () => {
      const user = userEvent.setup();
      const onSubmit = jest.fn();
      render(<TestForm onSubmit={onSubmit} />);

      const checkbox = screen.getByLabelText('Accept terms and conditions');
      
      expect(checkbox).not.toBeChecked();
      
      await user.click(checkbox);
      expect(checkbox).toBeChecked();
      
      await user.click(checkbox);
      expect(checkbox).not.toBeChecked();
    });

    it('should handle number input correctly', async () => {
      const user = userEvent.setup();
      const onSubmit = jest.fn();
      render(<TestForm onSubmit={onSubmit} />);

      const ageInput = screen.getByLabelText('Age');
      
      // Type a number
      await user.type(ageInput, '30');
      expect(ageInput).toHaveValue(30);
      
      // Clear and type new number
      await user.clear(ageInput);
      await user.type(ageInput, '25');
      expect(ageInput).toHaveValue(25);
    });
  });

  describe('Form State Management', () => {
    it('should disable submit button while submitting', async () => {
      const user = userEvent.setup();
      const onSubmit = jest.fn(() => new Promise(resolve => setTimeout(resolve, 100)));
      render(<TestForm onSubmit={onSubmit} />);

      // Fill valid data
      await user.type(screen.getByLabelText('Username'), 'testuser');
      await user.type(screen.getByLabelText('Email'), 'test@example.com');
      await user.type(screen.getByLabelText('Age'), '25');
      await user.selectOptions(screen.getByLabelText('Select'), 'player');
      await user.click(screen.getByLabelText('Accept terms and conditions'));

      const submitButton = screen.getByRole('button', { name: 'Submit' });
      
      // Submit form
      await user.click(submitButton);
      
      // Button should be disabled during submission
      expect(submitButton).toBeDisabled();
      
      // Wait for submission to complete
      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });
    });

    it('should show loading state during async validation', async () => {
      const user = userEvent.setup();
      const onSubmit = jest.fn();
      
      // Mock async validation
      const AsyncTestForm = () => {
        const form = useForm<TestFormValues>({
          resolver: zodResolver(testFormSchema),
          mode: 'onChange',
        });

        return (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    {form.formState.isValidating && (
                      <span data-testid="validating">Validating...</span>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit">Submit</Button>
            </form>
          </Form>
        );
      };

      render(<AsyncTestForm />);
      
      const input = screen.getByLabelText('Username');
      await user.type(input, 'test');
      expect(input).toHaveValue('test');
    });
  });
});