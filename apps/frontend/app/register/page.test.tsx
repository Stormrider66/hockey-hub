import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { renderWithProviders } from '@/testing/test-utils';
import { AuthProvider } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

// Since we don't have a separate register page, we'll test the registration functionality
// within the login page component
import LoginPage from '../login/page';

// Router mock (moduleNameMapper uses src/testing/mocks/next-navigation.ts)
const router = useRouter();

// Mock dynamic imports
jest.mock('@/utils/dynamicImports', () => ({
  LazySocialLoginButtons: ({ disabled }: { disabled: boolean }) => (
    <div data-testid="social-login-buttons">Social Login Buttons</div>
  ),
}));

// Setup MSW server
const server = setupServer(
  rest.post('http://localhost:3000/api/auth/register', async (req, res, ctx) => {
    const { email, password, firstName, lastName, organizationId, teamCode } = await req.json();
    const orgOrTeam = organizationId || teamCode;

    // Validation checks
    if (!email || !password || !firstName || !lastName) {
      return res(
        ctx.status(400),
        ctx.json({ message: 'All fields are required' })
      );
    }

    if (password.length < 8) {
      return res(
        ctx.status(400),
        ctx.json({ message: 'Password must be at least 8 characters long' })
      );
    }

    if (email === 'existing@example.com') {
      return res(
        ctx.status(409),
        ctx.json({ message: 'An account with this email already exists' })
      );
    }

    if (!orgOrTeam || orgOrTeam === 'INVALID') {
      return res(
        ctx.status(400),
        ctx.json({ message: 'Invalid team code' })
      );
    }

    // Successful registration
    return res(
      ctx.json({
        user: {
          id: 'new-user-123',
          email,
          firstName,
          lastName,
          role: {
            id: 'role-1',
            name: 'player',
            permissions: []
          },
          emailVerified: false
        },
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
        expires_in: 3600
      })
    );
  }),

  rest.post('http://localhost:3000/api/auth/resend-verification', async (req, res, ctx) => {
    const { email } = await req.json();

    if (email === 'verified@example.com') {
      return res(
        ctx.status(400),
        ctx.json({ message: 'Email is already verified' })
      );
    }

    return res(
      ctx.json({
        message: 'Verification email sent successfully',
        email
      })
    );
  })
);

beforeAll(() => server.listen());
afterEach(() => {
  server.resetHandlers();
  (router.push as any).mockClear?.();
});
afterAll(() => server.close());

// Helper to render with AuthProvider
const renderRegistration = () => {
  return renderWithProviders(
    <AuthProvider>
      <LoginPage />
    </AuthProvider>
  );
};

describe('Registration Flow', () => {
  describe('Registration Form', () => {
    it('should display registration form when register tab is clicked', async () => {
      const user = userEvent.setup();
      renderRegistration();

      // Click on register tab
      await user.click(screen.getByRole('tab', { name: /register/i }));

      // Check all form fields are present
      expect(screen.getByLabelText('First Name')).toBeInTheDocument();
      expect(screen.getByLabelText('Last Name')).toBeInTheDocument();
      expect(screen.getByLabelText(/^Email$/)).toBeInTheDocument();
      expect(screen.getByLabelText('Role')).toBeInTheDocument();
      expect(screen.getByLabelText('Team Code')).toBeInTheDocument();
      expect(screen.getByLabelText(/^Password$/)).toBeInTheDocument();
      expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
    });

    it('should have all role options available', async () => {
      const user = userEvent.setup();
      renderRegistration();

      await user.click(screen.getByRole('tab', { name: /register/i }));

      const roleSelect = screen.getByLabelText('Role') as HTMLSelectElement;
      const options = Array.from(roleSelect.options).map(option => option.value);

      expect(options).toContain('player');
      expect(options).toContain('coach');
      expect(options).toContain('parent');
      expect(options).toContain('medical_staff');
      expect(options).toContain('equipment_manager');
    });
  });

  describe('Form Validation', () => {
    it('should show error when passwords do not match', async () => {
      const user = userEvent.setup();
      renderRegistration();

      await user.click(screen.getByRole('tab', { name: /register/i }));

      // Fill form with mismatched passwords
      await user.type(screen.getByLabelText('First Name'), 'Test');
      await user.type(screen.getByLabelText('Last Name'), 'User');
      await user.type(screen.getByLabelText(/^Email$/), 'test@example.com');
      await user.type(screen.getByLabelText('Team Code'), 'TEAM123');
      await user.type(screen.getByLabelText(/^Password$/), 'SecurePass123!');
      await user.type(screen.getByLabelText('Confirm Password'), 'DifferentPass123!');

      await user.click(screen.getByRole('button', { name: /create account/i }));

      await waitFor(() => {
        expect(screen.getByTestId('error-text')).toHaveTextContent(/passwords do not match/i);
      });

      // Should not redirect
      expect(router.push).not.toHaveBeenCalled();
    });

    it('should validate required fields', async () => {
      const user = userEvent.setup();
      renderRegistration();

      await user.click(screen.getByRole('tab', { name: /register/i }));

      // Try to submit without filling required fields
      const submitButton = screen.getByRole('button', { name: /create account/i });
      await user.click(submitButton);

      // HTML5 validation should prevent submission
      const firstNameInput = screen.getByLabelText('First Name') as HTMLInputElement;
      expect(firstNameInput.validity.valueMissing).toBe(true);
    });

    it('should validate email format', async () => {
      const user = userEvent.setup();
      renderRegistration();

      await user.click(screen.getByRole('tab', { name: /register/i }));

      const emailInput = screen.getByLabelText(/^Email$/) as HTMLInputElement;
      await user.type(emailInput, 'invalid-email');

      // HTML5 email validation
      expect(emailInput.validity.typeMismatch).toBe(true);
    });

    it('should show error for weak password', async () => {
      const user = userEvent.setup();
      renderRegistration();

      await user.click(screen.getByRole('tab', { name: /register/i }));

      // Fill form with weak password
      await user.type(screen.getByLabelText('First Name'), 'Test');
      await user.type(screen.getByLabelText('Last Name'), 'User');
      await user.type(screen.getByLabelText(/^Email$/), 'test@example.com');
      await user.type(screen.getByLabelText('Team Code'), 'TEAM123');
      await user.type(screen.getByLabelText(/^Password$/), 'weak');
      await user.type(screen.getByLabelText('Confirm Password'), 'weak');

      await user.click(screen.getByRole('button', { name: /create account/i }));

      await waitFor(() => {
        expect(screen.getByTestId('error-text')).toHaveTextContent(/password must be at least 8 characters/i);
      });
    });
  });

  describe('Registration Success', () => {
    it('should register successfully with valid data', async () => {
      const user = userEvent.setup();
      renderRegistration();

      await user.click(screen.getByRole('tab', { name: /register/i }));

      // Fill all fields correctly
      await user.type(screen.getByLabelText('First Name'), 'John');
      await user.type(screen.getByLabelText('Last Name'), 'Doe');
      await user.type(screen.getByLabelText(/^Email$/), 'john.doe@example.com');
      await user.selectOptions(screen.getByLabelText('Role'), 'player');
      await user.type(screen.getByLabelText('Team Code'), 'TEAM123');
      await user.type(screen.getByLabelText(/^Password$/), 'SecurePass123!');
      await user.type(screen.getByLabelText('Confirm Password'), 'SecurePass123!');

      await user.click(screen.getByRole('button', { name: /create account/i }));

      // Should show loading state
      expect(screen.getAllByText('Creating account...').length).toBeGreaterThan(0);

      // Should show success message and redirect
      await waitFor(() => {
        expect(screen.getByTestId('success-text')).toHaveTextContent(/registration successful/i);
      });
    });

    it('should allow different role selection', async () => {
      const user = userEvent.setup();
      renderRegistration();

      await user.click(screen.getByRole('tab', { name: /register/i }));

      // Register as coach
      await user.type(screen.getByLabelText('First Name'), 'Coach');
      await user.type(screen.getByLabelText('Last Name'), 'Smith');
      await user.type(screen.getByLabelText(/^Email$/), 'coach@example.com');
      await user.selectOptions(screen.getByLabelText('Role'), 'coach');
      await user.type(screen.getByLabelText('Team Code'), 'TEAM123');
      await user.type(screen.getByLabelText(/^Password$/), 'CoachPass123!');
      await user.type(screen.getByLabelText('Confirm Password'), 'CoachPass123!');

      await user.click(screen.getByRole('button', { name: /create account/i }));

      await waitFor(() => {
        expect(screen.getByTestId('success-text')).toHaveTextContent(/registration successful/i);
      });
    });
  });

  describe('Registration Errors', () => {
    it('should show error when email already exists', async () => {
      const user = userEvent.setup();
      renderRegistration();

      await user.click(screen.getByRole('tab', { name: /register/i }));

      // Try to register with existing email
      await user.type(screen.getByLabelText('First Name'), 'Test');
      await user.type(screen.getByLabelText('Last Name'), 'User');
      await user.type(screen.getByLabelText(/^Email$/), 'existing@example.com');
      await user.type(screen.getByLabelText('Team Code'), 'TEAM123');
      await user.type(screen.getByLabelText(/^Password$/), 'Password123!');
      await user.type(screen.getByLabelText('Confirm Password'), 'Password123!');

      await user.click(screen.getByRole('button', { name: /create account/i }));

      await waitFor(() => {
        expect(screen.getByTestId('error-text')).toHaveTextContent(/account with this email already exists/i);
      });

      expect(router.push).not.toHaveBeenCalled();
    });

    it('should show error for invalid team code', async () => {
      const user = userEvent.setup();
      renderRegistration();

      await user.click(screen.getByRole('tab', { name: /register/i }));

      // Try with invalid team code
      await user.type(screen.getByLabelText('First Name'), 'Test');
      await user.type(screen.getByLabelText('Last Name'), 'User');
      await user.type(screen.getByLabelText(/^Email$/), 'test@example.com');
      await user.type(screen.getByLabelText('Team Code'), 'INVALID');
      await user.type(screen.getByLabelText(/^Password$/), 'Password123!');
      await user.type(screen.getByLabelText('Confirm Password'), 'Password123!');

      await user.click(screen.getByRole('button', { name: /create account/i }));

      await waitFor(() => {
        expect(screen.getByTestId('error-text')).toHaveTextContent(/invalid team code/i);
      });
    });

    it('should handle network errors gracefully', async () => {
      const user = userEvent.setup();
      renderRegistration();

      // Simulate network error
      server.use(
        rest.post('http://localhost:3000/api/auth/register', (req, res) => {
          return res.networkError('Network error');
        })
      );

      await user.click(screen.getByRole('tab', { name: /register/i }));

      // Fill form
      await user.type(screen.getByLabelText('First Name'), 'Test');
      await user.type(screen.getByLabelText('Last Name'), 'User');
      await user.type(screen.getByLabelText(/^Email$/), 'test@example.com');
      await user.type(screen.getByLabelText('Team Code'), 'TEAM123');
      await user.type(screen.getByLabelText(/^Password$/), 'Password123!');
      await user.type(screen.getByLabelText('Confirm Password'), 'Password123!');

      await user.click(screen.getByRole('button', { name: /create account/i }));

      await waitFor(() => {
        expect(screen.getByTestId('error-text')).toHaveTextContent(/failed to register|network error/i);
      });
    });
  });

  describe('Form Interaction', () => {
    it('should clear form when switching between tabs', async () => {
      const user = userEvent.setup();
      renderRegistration();

      // Go to register tab and fill some data
      await user.click(screen.getByRole('tab', { name: /register/i }));
      await user.type(screen.getByLabelText('First Name'), 'Test');
      await user.type(screen.getByLabelText(/^Email$/), 'test@example.com');

      // Switch to login tab
      await user.click(screen.getByRole('tab', { name: /login/i }));

      // Switch back to register tab
      await user.click(screen.getByRole('tab', { name: /register/i }));

      // Form should be cleared
      expect(screen.getByLabelText('First Name')).toHaveValue('');
      expect(screen.getByLabelText(/^Email$/)).toHaveValue('');
    });

    it('should disable submit button during registration', async () => {
      const user = userEvent.setup();
      renderRegistration();

      await user.click(screen.getByRole('tab', { name: /register/i }));

      // Fill form
      await user.type(screen.getByLabelText('First Name'), 'Test');
      await user.type(screen.getByLabelText('Last Name'), 'User');
      await user.type(screen.getByLabelText(/^Email$/), 'test@example.com');
      await user.type(screen.getByLabelText('Team Code'), 'TEAM123');
      await user.type(screen.getByLabelText(/^Password$/), 'Password123!');
      await user.type(screen.getByLabelText('Confirm Password'), 'Password123!');

      const submitButton = screen.getByRole('button', { name: /create account/i });
      
      // Submit form
      await user.click(submitButton);

      // Button should be disabled during submission
      await waitFor(() => {
        expect(submitButton).toBeDisabled();
      });
      expect(screen.getAllByText('Creating account...').length).toBeGreaterThan(0);
    });
  });

  describe('Accessibility', () => {
    it('should have proper labels for all form fields', async () => {
      const user = userEvent.setup();
      renderRegistration();

      await user.click(screen.getByRole('tab', { name: /register/i }));

      // All inputs should have accessible labels
      expect(screen.getByLabelText('First Name')).toHaveAttribute('id', 'firstName');
      expect(screen.getByLabelText('Last Name')).toHaveAttribute('id', 'lastName');
      expect(screen.getByLabelText(/^Email$/)).toHaveAttribute('id', 'registerEmail');
      expect(screen.getByLabelText('Role')).toHaveAttribute('id', 'role');
      expect(screen.getByLabelText('Team Code')).toHaveAttribute('id', 'teamCode');
      expect(screen.getByLabelText(/^Password$/)).toHaveAttribute('id', 'registerPassword');
      expect(screen.getByLabelText('Confirm Password')).toHaveAttribute('id', 'confirmPassword');
    });

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();
      renderRegistration();

      await user.click(screen.getByRole('tab', { name: /register/i }));

      // Tab through form fields
      await user.tab();
      expect(screen.getByLabelText('First Name')).toHaveFocus();

      await user.tab();
      expect(screen.getByLabelText('Last Name')).toHaveFocus();

      await user.tab();
      expect(screen.getByLabelText(/^Email$/)).toHaveFocus();

      await user.tab();
      expect(screen.getByLabelText('Role')).toHaveFocus();

      await user.tab();
      expect(screen.getByLabelText('Team Code')).toHaveFocus();

      await user.tab();
      expect(screen.getByLabelText(/^Password$/)).toHaveFocus();

      await user.tab();
      expect(screen.getByLabelText('Confirm Password')).toHaveFocus();

      await user.tab();
      expect(screen.getByRole('button', { name: /create account/i })).toHaveFocus();
    });

    it('should announce errors to screen readers', async () => {
      const user = userEvent.setup();
      renderRegistration();

      await user.click(screen.getByRole('tab', { name: /register/i }));

      // Submit with mismatched passwords
      await user.type(screen.getByLabelText('First Name'), 'Test');
      await user.type(screen.getByLabelText('Last Name'), 'User');
      await user.type(screen.getByLabelText(/^Email$/), 'test@example.com');
      await user.type(screen.getByLabelText('Team Code'), 'TEAM123');
      await user.type(screen.getByLabelText(/^Password$/), 'Password123!');
      await user.type(screen.getByLabelText('Confirm Password'), 'Different123!');

      await user.click(screen.getByRole('button', { name: /create account/i }));

      await waitFor(() => {
        const alert = screen.getByRole('alert');
        expect(alert).toBeInTheDocument();
        expect(alert).toHaveTextContent('Passwords do not match');
      });
    });
  });

  describe('Password Requirements', () => {
    it('should show password requirements hint', async () => {
      const user = userEvent.setup();
      renderRegistration();

      await user.click(screen.getByRole('tab', { name: /register/i }));

      const passwordInput = screen.getByLabelText(/^Password$/);
      
      // Password field should have proper type
      expect(passwordInput).toHaveAttribute('type', 'password');
    });

    it('should toggle password visibility if button exists', async () => {
      const user = userEvent.setup();
      renderRegistration();

      await user.click(screen.getByRole('tab', { name: /register/i }));

      // Check if password toggle exists (optional feature)
      const toggleButton = screen.queryByRole('button', { name: /show password/i });
      if (toggleButton) {
        await user.click(toggleButton);
        expect(screen.getByLabelText(/^Password$/)).toHaveAttribute('type', 'text');
      }
    });
  });

  describe('Social Registration', () => {
    it('should display social registration options', async () => {
      const user = userEvent.setup();
      renderRegistration();

      await user.click(screen.getByRole('tab', { name: /register/i }));

      await waitFor(() => {
        expect(screen.getByTestId('social-login-buttons')).toBeInTheDocument();
      });
    });
  });
});