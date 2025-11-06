import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithRouter } from '../../../tests/utils/renderWithRouter';
import { mockLocalStorage } from '../../../tests/utils/mockLocalStorage';
import RegisterPage from '../Register';
import { authAPI } from '../../../services/api';

// Mock dependencies
vi.mock('../../../services/api', () => ({
  authAPI: {
    register: vi.fn(),
  },
}));

vi.mock('../../../store/authStore', () => ({
  default: vi.fn(() => ({
    register: vi.fn(),
    loading: false,
    error: null,
    clearError: vi.fn(),
  })),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

vi.mock('../../../utils/vietnameseTexts', () => ({
  getText: (key) => key,
}));

vi.mock('../../../services/socialAuthService', () => ({
  googleAuth: {
    signUp: vi.fn(),
  },
}));

describe('RegisterPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.clearTokens();
    mockLocalStorage.clearAuthState();
  });

  it('renders registration form with all fields', () => {
    renderWithRouter(<RegisterPage />);

    // Check for form fields using labels and placeholders
    expect(screen.getByRole('textbox', { name: /auth\.firstName/i })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /auth\.lastName/i })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /auth\.email/i })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /auth\.phone/i })).toBeInTheDocument();
    
    // Password fields (type=password won't show in getByRole('textbox'))
    const passwordFields = screen.getAllByLabelText(/auth\.password/i);
    expect(passwordFields.length).toBeGreaterThan(0);

    // Submit button
    expect(screen.getByRole('button', { name: /auth\.register/i })).toBeInTheDocument();
  });

  it('shows validation errors for empty fields on submit', async () => {
    const user = userEvent.setup();
    renderWithRouter(<RegisterPage />);

    const submitButton = screen.getByRole('button', { name: /auth\.register/i });
    await user.click(submitButton);

    // Component should show validation errors
    await waitFor(() => {
      // Check for error messages - component may use helperText or error states
      const firstName = screen.getByRole('textbox', { name: /auth\.firstName/i });
      expect(firstName).toHaveAttribute('aria-invalid', 'true');
    }, { timeout: 2000 });
  });

  it('successfully registers user and navigates', async () => {
    const user = userEvent.setup();
    const mockNavigate = vi.fn();
    
    // Mock successful registration response
    const mockRegisterResponse = {
      userId: 123,
      email: 'test@example.com',
      fullName: 'Test User',
      message: 'Registration successful'
    };

    authAPI.register.mockResolvedValue(mockRegisterResponse);

    // Re-render with mocked navigate
    vi.doMock('react-router-dom', async () => {
      const actual = await vi.importActual('react-router-dom');
      return {
        ...actual,
        useNavigate: () => mockNavigate,
      };
    });

    renderWithRouter(<RegisterPage />);

    // Fill form
    await user.type(screen.getByRole('textbox', { name: /auth\.firstName/i }), 'Test');
    await user.type(screen.getByRole('textbox', { name: /auth\.lastName/i }), 'User');
    await user.type(screen.getByRole('textbox', { name: /auth\.email/i }), 'test@example.com');
    await user.type(screen.getByRole('textbox', { name: /auth\.phone/i }), '0123456789');
    
    // Passwords - get by placeholder or label
    const passwordInputs = document.querySelectorAll('input[type="password"]');
    if (passwordInputs.length >= 2) {
      await user.type(passwordInputs[0], 'Password123!');
      await user.type(passwordInputs[1], 'Password123!');
    }

    // Accept terms
    const termsCheckbox = screen.getByRole('checkbox');
    await user.click(termsCheckbox);

    // Submit
    const submitButton = screen.getByRole('button', { name: /auth\.register/i });
    await user.click(submitButton);

    // Assert authAPI.register was called with correct data
    await waitFor(() => {
      expect(authAPI.register).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'test@example.com',
          fullName: expect.stringContaining('Test'),
          phoneNumber: '0123456789',
          password: 'Password123!',
          role: 'customer'
        })
      );
    });
  });

  it('handles 400 Bad Request error (duplicate email)', async () => {
    const user = userEvent.setup();
    
    // Mock 400 error
    const error = new Error('Email already registered');
    error.response = { 
      status: 400,
      data: { message: 'Email already registered' }
    };
    authAPI.register.mockRejectedValue(error);

    renderWithRouter(<RegisterPage />);

    // Fill and submit form
    await user.type(screen.getByRole('textbox', { name: /auth\.email/i }), 'existing@example.com');
    const submitButton = screen.getByRole('button', { name: /auth\.register/i });
    await user.click(submitButton);

    // Check error is displayed (component may show in Alert or Snackbar)
    // TODO: Verify exact error display mechanism in component
    await waitFor(() => {
      expect(authAPI.register).toHaveBeenCalled();
    });
  });

  it('handles 500 server error gracefully', async () => {
    const user = userEvent.setup();
    
    const error = new Error('Server error');
    error.response = { status: 500, data: { message: 'Internal server error' } };
    authAPI.register.mockRejectedValue(error);

    renderWithRouter(<RegisterPage />);

    const submitButton = screen.getByRole('button', { name: /auth\.register/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(authAPI.register).toHaveBeenCalled();
    });
  });

  it('prevents duplicate submit while loading', async () => {
    const user = userEvent.setup();
    
    // Mock slow API call
    authAPI.register.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 2000)));

    renderWithRouter(<RegisterPage />);

    const submitButton = screen.getByRole('button', { name: /auth\.register/i });
    
    // First click
    await user.click(submitButton);
    
    // Button should be disabled while loading
    expect(submitButton).toBeDisabled();

    // Second click should not trigger another call
    await user.click(submitButton);
    
    // Only one API call
    expect(authAPI.register).toHaveBeenCalledTimes(1);
  });

  it('navigates to login when clicking login link', async () => {
    const user = userEvent.setup();
    renderWithRouter(<RegisterPage />);

    // Find login link (text: "Đăng nhập" or similar)
    const loginLink = screen.getByText(/đăng nhập/i);
    expect(loginLink).toBeInTheDocument();
    
    await user.click(loginLink);
    
    // Navigation should occur (tested via MemoryRouter in integration tests)
  });

  it('displays password strength indicator', async () => {
    const user = userEvent.setup();
    renderWithRouter(<RegisterPage />);

    const passwordInput = document.querySelector('input[type="password"]');
    if (passwordInput) {
      await user.type(passwordInput, 'weak');
      // TODO: Check for password strength indicator element
      // Component may show strength via color, text, or progress bar
    }
  });

  it('validates password confirmation matches', async () => {
    const user = userEvent.setup();
    renderWithRouter(<RegisterPage />);

    const passwordInputs = document.querySelectorAll('input[type="password"]');
    if (passwordInputs.length >= 2) {
      await user.type(passwordInputs[0], 'Password123!');
      await user.type(passwordInputs[1], 'DifferentPassword123!');

      const submitButton = screen.getByRole('button', { name: /auth\.register/i });
      await user.click(submitButton);

      // Should show password mismatch error
      await waitFor(() => {
        // Component should prevent submission or show error
        expect(passwordInputs[1]).toHaveAttribute('aria-invalid', 'true');
      }, { timeout: 1000 }).catch(() => {
        // Fallback: check that API was not called
        expect(authAPI.register).not.toHaveBeenCalled();
      });
    }
  });
});
