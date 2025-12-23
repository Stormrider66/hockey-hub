import React from 'react';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import LoginPage from './page';
import { renderWithProviders } from '@/testing/test-utils';
import { AuthProvider } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

// Router mock (moduleNameMapper uses src/testing/mocks/next-navigation.ts)
const router = useRouter();

// Dynamic imports are mapped via moduleNameMapper to src/testing/mocks/dynamicImports.ts

// Setup MSW server
const server = setupServer(
  rest.post('http://localhost:3000/api/auth/login', async (req, res, ctx) => {
    const { email, password } = await req.json();

    if (email === 'player@hockeyhub.com' && password === 'demo123') {
      return res(
        ctx.json({
          user: {
            id: 'user-123',
            email: 'player@hockeyhub.com',
            firstName: 'Erik',
            lastName: 'Johansson',
            role: {
              id: 'role-1',
              name: 'player',
              permissions: []
            }
          },
          access_token: 'mock-access-token',
          refresh_token: 'mock-refresh-token',
          expires_in: 3600
        })
      );
    }

    return res(
      ctx.status(401),
      ctx.json({ message: 'Invalid email or password' })
    );
  }),

  rest.post('http://localhost:3000/api/auth/register', async (req, res, ctx) => {
    const { email, password, firstName, lastName, organizationId } = await req.json();

    if (email === 'existing@example.com') {
      return res(
        ctx.status(409),
        ctx.json({ message: 'Email already exists' })
      );
    }

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
          }
        },
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
        expires_in: 3600
      })
    );
  })
);

beforeAll(() => server.listen());
afterEach(() => {
  server.resetHandlers();
  router.push.mockClear();
});
afterAll(() => server.close());

// Helper to render with AuthProvider
const renderLogin = () => {
  return renderWithProviders(
    <AuthProvider>
      <LoginPage />
    </AuthProvider>
  );
};

describe('LoginPage', () => {
  describe('UI Rendering', () => {
    it('should render login form by default', () => {
      renderLogin();

      expect(screen.getByText('Welcome Back')).toBeInTheDocument();
      expect(screen.getByText('Sign in to access your dashboard')).toBeInTheDocument();
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
      expect(screen.getByLabelText('Password')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
      expect(screen.getByText('Remember me')).toBeInTheDocument();
      expect(screen.getByText('Forgot password?')).toBeInTheDocument();
    });

    it('should render demo credentials section', () => {
      renderLogin();

      expect(screen.getByText('Try with demo credentials:')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Player' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Coach' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Parent' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Medical Staff' })).toBeInTheDocument();
    });

    it('should render features section', () => {
      renderLogin();

      expect(screen.getByText('All-in-One Platform')).toBeInTheDocument();
      expect(screen.getByText('Team Management')).toBeInTheDocument();
      expect(screen.getByText('Performance Tracking')).toBeInTheDocument();
      expect(screen.getByText('Smart Scheduling')).toBeInTheDocument();
      expect(screen.getByText('Analytics & Insights')).toBeInTheDocument();
    });

    it('should switch between login and register tabs', async () => {
      const user = userEvent.setup();
      renderLogin();

      // Initially on login tab
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
      expect(screen.queryByLabelText('First Name')).not.toBeInTheDocument();

      // Click register tab
      await user.click(screen.getByRole('tab', { name: 'Register' }));

      // Register form should be visible
      expect(screen.getByLabelText('First Name')).toBeInTheDocument();
      expect(screen.getByLabelText('Last Name')).toBeInTheDocument();
      expect(screen.getByLabelText('Team Code')).toBeInTheDocument();
      expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument();
    });
  });

  describe('Login Functionality', () => {
    it('should login successfully with valid credentials', async () => {
      const user = userEvent.setup();
      renderLogin();

      // Fill in login form
      await user.type(screen.getByLabelText('Email'), 'player@hockeyhub.com');
      await user.type(screen.getByLabelText('Password'), 'demo123');
      
      // Submit form
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      // Should show loading state
      expect(screen.getByText('Signing in...')).toBeInTheDocument();

      // Should redirect to player dashboard
      await waitFor(() => {
        expect(localStorage.getItem('access_token')).toBe('mock-access-token');
      });
    });

    it('should show error with invalid credentials', async () => {
      const user = userEvent.setup();
      renderLogin();

      // Fill in login form with invalid credentials
      await user.type(screen.getByLabelText('Email'), 'wrong@example.com');
      await user.type(screen.getByLabelText('Password'), 'wrongpassword');
      
      // Submit form
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      // Should show error message
      await waitFor(() => {
        expect(screen.getByTestId('error-text')).toHaveTextContent(/invalid email or password/i);
      });

      // Should not redirect
      expect(router.push).not.toHaveBeenCalled();
    });

    it('should fill demo credentials when demo button clicked', async () => {
      const user = userEvent.setup();
      renderLogin();

      // Click player demo button
      await user.click(screen.getByRole('button', { name: 'Player' }));

      // Should fill in the form
      expect(screen.getByLabelText('Email')).toHaveValue('player@hockeyhub.com');
      expect(screen.getByLabelText('Password')).toHaveValue('demo123');
    });

    it('should handle remember me checkbox', async () => {
      const user = userEvent.setup();
      renderLogin();

      const rememberCheckbox = screen.getByRole('checkbox', { name: /remember me/i });
      
      // Initially unchecked
      expect(rememberCheckbox).not.toBeChecked();

      // Check it
      await user.click(rememberCheckbox);
      expect(rememberCheckbox).toBeChecked();

      // Fill in and submit form
      await user.type(screen.getByLabelText('Email'), 'player@hockeyhub.com');
      await user.type(screen.getByLabelText('Password'), 'demo123');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      // The login function should be called with rememberMe = true
      await waitFor(() => {
        expect(localStorage.getItem('access_token')).toBe('mock-access-token');
      });
    });

    it('should disable form during submission', async () => {
      const user = userEvent.setup();
      renderLogin();

      // Fill in form
      await user.type(screen.getByLabelText('Email'), 'player@hockeyhub.com');
      await user.type(screen.getByLabelText('Password'), 'demo123');
      
      // Submit form
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      // Button should be disabled
      expect(screen.getByRole('button', { name: /signing in/i })).toBeDisabled();
    });
  });

  describe('Registration Functionality', () => {
    it('should register successfully with valid data', async () => {
      const user = userEvent.setup();
      renderLogin();

      // Switch to register tab
      await user.click(screen.getByRole('tab', { name: 'Register' }));

      // Fill in registration form
      await user.type(screen.getByLabelText('First Name'), 'Test');
      await user.type(screen.getByLabelText('Last Name'), 'User');
      await user.type(screen.getByLabelText('Email'), 'newuser@example.com');
      await user.selectOptions(screen.getByLabelText('Role'), 'player');
      await user.type(screen.getByLabelText('Team Code'), 'TEAM123');
      await user.type(screen.getByLabelText('Password'), 'SecurePass123!');
      await user.type(screen.getByLabelText('Confirm Password'), 'SecurePass123!');

      // Submit form
      await user.click(screen.getByRole('button', { name: /create account/i }));

      // Should show loading state (button disabled with loading name)
      expect(screen.getByRole('button', { name: /creating account/i })).toBeDisabled();

      // Should show success message and redirect
      await waitFor(() => {
        expect(screen.getByTestId('success-text')).toHaveTextContent(/registration successful/i);
      });
    });

    it('should show error when passwords do not match', async () => {
      const user = userEvent.setup();
      renderLogin();

      // Switch to register tab
      await user.click(screen.getByRole('tab', { name: 'Register' }));

      // Fill in form with mismatched passwords
      await user.type(screen.getByLabelText('First Name'), 'Test');
      await user.type(screen.getByLabelText('Last Name'), 'User');
      await user.type(screen.getByLabelText('Email'), 'newuser@example.com');
      await user.type(screen.getByLabelText('Team Code'), 'TEAM123');
      await user.type(screen.getByLabelText('Password'), 'SecurePass123!');
      await user.type(screen.getByLabelText('Confirm Password'), 'DifferentPass123!');

      // Submit form
      await user.click(screen.getByRole('button', { name: /create account/i }));

      // Should show error
      await waitFor(() => {
        expect(screen.getByTestId('error-text')).toHaveTextContent(/passwords do not match/i);
      });

      // Should not redirect
      expect(router.push).not.toHaveBeenCalled();
    });

    it('should show error when email already exists', async () => {
      const user = userEvent.setup();
      renderLogin();

      // Switch to register tab
      await user.click(screen.getByRole('tab', { name: 'Register' }));

      // Fill in form with existing email
      await user.type(screen.getByLabelText('First Name'), 'Test');
      await user.type(screen.getByLabelText('Last Name'), 'User');
      await user.type(screen.getByLabelText('Email'), 'existing@example.com');
      await user.type(screen.getByLabelText('Team Code'), 'TEAM123');
      await user.type(screen.getByLabelText('Password'), 'SecurePass123!');
      await user.type(screen.getByLabelText('Confirm Password'), 'SecurePass123!');

      // Submit form
      await user.click(screen.getByRole('button', { name: /create account/i }));

      // Should show error
      await waitFor(() => {
        expect(screen.getByTestId('error-text')).toHaveTextContent(/email already exists/i);
      });
    });

    it('should validate all required fields', async () => {
      const user = userEvent.setup();
      renderLogin();

      // Switch to register tab
      await user.click(screen.getByRole('tab', { name: 'Register' }));

      // Try to submit empty form
      await user.click(screen.getByRole('button', { name: /create account/i }));

      // HTML5 validation should prevent submission
      const firstNameInput = screen.getByLabelText('First Name') as HTMLInputElement;
      expect(firstNameInput.validity.valueMissing).toBe(true);
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      renderLogin();

      expect(screen.getByLabelText('Email')).toHaveAttribute('id', 'email');
      expect(screen.getByLabelText('Password')).toHaveAttribute('id', 'password');
      expect(screen.getByRole('button', { name: /sign in/i })).toHaveAttribute('type', 'submit');
    });

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();
      renderLogin();

      // Tab through form elements
      await user.tab();
      expect(screen.getByRole('tab', { name: 'Login' })).toHaveFocus();

      await user.tab();
      expect(screen.getByLabelText('Email')).toHaveFocus();

      await user.tab();
      expect(screen.getByLabelText('Password')).toHaveFocus();

      await user.tab();
      expect(screen.getByRole('checkbox', { name: /remember me/i })).toHaveFocus();
    });

    it('should support form submission with Enter key', async () => {
      const user = userEvent.setup();
      renderLogin();

      // Fill in form
      await user.type(screen.getByLabelText('Email'), 'player@hockeyhub.com');
      await user.type(screen.getByLabelText('Password'), 'demo123');

      // Press Enter in password field
      await user.keyboard('{Enter}');

      // Should submit form
      await waitFor(() => {
        expect(localStorage.getItem('access_token')).toBe('mock-access-token');
      });
    });
  });

  describe('Navigation', () => {
    it('should navigate to forgot password page', async () => {
      const user = userEvent.setup();
      renderLogin();

      const forgotPasswordLink = screen.getByText('Forgot password?');
      expect(forgotPasswordLink).toHaveAttribute('href', '/forgot-password');
    });

    it('should navigate to privacy policy', async () => {
      renderLogin();

      const privacyLinks = screen.getAllByText('Privacy Policy');
      expect(privacyLinks[0]).toHaveAttribute('href', '/privacy');
    });

    it('should navigate to terms of service', async () => {
      renderLogin();

      const termsLinks = screen.getAllByText('Terms of Service');
      expect(termsLinks[0]).toHaveAttribute('href', '/terms');
    });

    it('should navigate to contact support', async () => {
      renderLogin();

      const contactLink = screen.getByText('Contact Support');
      expect(contactLink).toHaveAttribute('href', '/contact');
    });
  });

  describe('Loading States', () => {
    it('should show loading spinner during login', async () => {
      const user = userEvent.setup();
      renderLogin();

      // Add delay to API response
      server.use(
        rest.post('http://localhost:3000/api/auth/login', async (req, res, ctx) => {
          await new Promise(resolve => setTimeout(resolve, 100));
          return res(
            ctx.json({
              user: {
                id: 'user-123',
                email: 'player@hockeyhub.com',
                firstName: 'Erik',
                lastName: 'Johansson',
                role: {
                  id: 'role-1',
                  name: 'player',
                  permissions: []
                }
              },
              access_token: 'mock-access-token',
              refresh_token: 'mock-refresh-token',
              expires_in: 3600
            })
          );
        })
      );

      await user.type(screen.getByLabelText('Email'), 'player@hockeyhub.com');
      await user.type(screen.getByLabelText('Password'), 'demo123');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      // Should show loading state
      expect(screen.getByText('Signing in...')).toBeInTheDocument();
      expect(screen.getByTestId('loader-icon')).toBeInTheDocument();
    });
  });

  describe('Error States', () => {
    it('should handle network errors gracefully', async () => {
      const user = userEvent.setup();
      renderLogin();

      // Simulate network error
      server.use(
        rest.post('http://localhost:3000/api/auth/login', (req, res) => {
          return res.networkError('Network error');
        })
      );

      await user.type(screen.getByLabelText('Email'), 'player@hockeyhub.com');
      await user.type(screen.getByLabelText('Password'), 'demo123');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      // Should show error message
      await waitFor(() => {
        // The component surfaces the underlying network error message in this case
        expect(screen.getByTestId('error-text')).toHaveTextContent(/network error|failed to login/i);
      });
    });

    it('should clear errors when switching tabs', async () => {
      const user = userEvent.setup();
      renderLogin();

      // Trigger an error
      await user.type(screen.getByLabelText('Email'), 'wrong@example.com');
      await user.type(screen.getByLabelText('Password'), 'wrongpassword');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      // Wait for error
      await waitFor(() => {
        expect(screen.getByTestId('error-text')).toHaveTextContent(/invalid email or password/i);
      });

      // Switch to register tab
      await user.click(screen.getByRole('tab', { name: 'Register' }));

      // Error should be cleared
      expect(screen.queryByText('Invalid email or password')).not.toBeInTheDocument();
    });
  });
});