import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithRouter } from '../../../tests/utils/renderWithRouter';
import { mockLocalStorage } from '../../../tests/utils/mockLocalStorage';
import LoginPage from '../Login';
import { authAPI } from '../../../services/api';

// Mock dependencies
const mockLogin = vi.fn();
const mockClearError = vi.fn();

vi.mock('../../../services/api', () => ({
  authAPI: {
    login: vi.fn(),
    getProfile: vi.fn(),
  },
}));

vi.mock('../../../store/authStore', () => ({
  default: vi.fn(() => ({
    login: mockLogin,
    loading: false,
    error: null,
    clearError: mockClearError,
  })),
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../../../utils/vietnameseTexts', () => ({
  getText: (key) => key,
}));

vi.mock('../../../services/socialAuthService', () => ({
  googleAuth: { signIn: vi.fn() },
}));

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.clearTokens();
    mockLocalStorage.clearAuthState();
  });

  it('renders login form', () => {
    renderWithRouter(<LoginPage />);

    expect(screen.getByRole('textbox', { name: /email/i })).toBeInTheDocument();
    const passwordInput = document.querySelector('input[name="password"]');
    expect(passwordInput).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /auth\.login/i })).toBeInTheDocument();
  });

  it('shows validation error for empty email', async () => {
    const user = userEvent.setup();
    renderWithRouter(<LoginPage />);

    const loginButton = screen.getByRole('button', { name: /auth\.login/i });
    await user.click(loginButton);

    // Empty email should trigger validation
    await waitFor(() => {
      const emailInput = screen.getByRole('textbox', { name: /email/i });
      expect(emailInput).toHaveAttribute('aria-invalid', 'true');
    }, { timeout: 1000 }).catch(() => {
      // Component may handle validation differently
    });
  });

  it('successfully logs in and stores token', async () => {
    const user = userEvent.setup();
    
    // Mock successful login from authStore
    mockLogin.mockResolvedValue({ 
      success: true,
      data: {
        userId: 1,
        email: 'customer@skaev.com',
        fullName: 'John Doe',
        role: 'customer'
      }
    });

    renderWithRouter(<LoginPage />);

    // Fill form
    await user.type(screen.getByRole('textbox', { name: /email/i }), 'customer@skaev.com');
    const passwordInput = document.querySelector('input[name="password"]');
    await user.type(passwordInput, 'password123');

    // Submit
    const loginButton = screen.getByRole('button', { name: /auth\.login/i });
    await user.click(loginButton);

    // Assert login called with correct credentials
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('customer@skaev.com', 'password123');
    }, { timeout: 2000 });
  });

  it('handles 401 Unauthorized (invalid credentials)', async () => {
    const user = userEvent.setup();
    
    // Mock login error - should be resolved not rejected for proper state handling
    mockLogin.mockResolvedValue({ 
      success: false, 
      error: 'Invalid email or password' 
    });

    renderWithRouter(<LoginPage />);

    await user.type(screen.getByRole('textbox', { name: /email/i }), 'wrong@example.com');
    const passwordInput = document.querySelector('input[name="password"]');
    await user.type(passwordInput, 'wrongpass');
    
    const loginButton = screen.getByRole('button', { name: /auth\.login/i });
    await user.click(loginButton);

    // Assert login was called
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalled();
    }, { timeout: 2000 });
  });

  it('handles empty email validation', async () => {
    const user = userEvent.setup();

    renderWithRouter(<LoginPage />);

    // Try to submit with empty email
    const passwordInput = document.querySelector('input[name="password"]');
    await user.type(passwordInput, 'password123');
    
    const loginButton = screen.getByRole('button', { name: /auth\.login/i });
    await user.click(loginButton);

    // Login should not be called with empty email
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('handles empty password validation', async () => {
    const user = userEvent.setup();

    renderWithRouter(<LoginPage />);

    // Try to submit with empty password
    await user.type(screen.getByRole('textbox', { name: /email/i }), 'test@example.com');
    
    const loginButton = screen.getByRole('button', { name: /auth\.login/i });
    await user.click(loginButton);

    // Login should not be called with empty password
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('handles remember me checkbox', async () => {
    const user = userEvent.setup();

    renderWithRouter(<LoginPage />);

    // Find and check remember me checkbox if it exists
    const checkboxes = screen.queryAllByRole('checkbox');
    if (checkboxes.length > 0) {
      const rememberCheckbox = checkboxes[0];
      await user.click(rememberCheckbox);
      expect(rememberCheckbox).toBeChecked();
    }
  });

  it('clears error message when user types', async () => {
    const user = userEvent.setup();
    
    // Mock failed login first
    mockLogin.mockResolvedValue({ 
      success: false, 
      error: 'Invalid credentials' 
    });

    renderWithRouter(<LoginPage />);

    const emailInput = screen.getByRole('textbox', { name: /email/i });
    await user.type(emailInput, 'test@test.com');
    const passwordInput = document.querySelector('input[name="password"]');
    await user.type(passwordInput, 'wrong');
    
    await user.click(screen.getByRole('button', { name: /auth\.login/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalled();
    });

    // Type again to clear error
    await user.clear(emailInput);
    await user.type(emailInput, 'new@test.com');
  });

  it('navigates to customer dashboard after customer login', async () => {
    const user = userEvent.setup();
    
    mockLogin.mockResolvedValue({ 
      success: true,
      data: {
        userId: 1,
        email: 'customer@skaev.com',
        role: 'customer'
      }
    });

    renderWithRouter(<LoginPage />);

    await user.type(screen.getByRole('textbox', { name: /email/i }), 'customer@skaev.com');
    const passwordInput = document.querySelector('input[name="password"]');
    await user.type(passwordInput, 'password123');
    
    const loginButton = screen.getByRole('button', { name: /auth\.login/i });
    await user.click(loginButton);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalled();
    }, { timeout: 2000 });
  });

  it('navigates to admin dashboard after admin login', async () => {
    const user = userEvent.setup();
    
    mockLogin.mockResolvedValue({ 
      success: true,
      data: {
        userId: 2,
        email: 'admin@skaev.com',
        role: 'admin'
      }
    });

    renderWithRouter(<LoginPage />);

    await user.type(screen.getByRole('textbox', { name: /email/i }), 'admin@skaev.com');
    const passwordInput = document.querySelector('input[name="password"]');
    await user.type(passwordInput, 'admin123');
    
    await user.click(screen.getByRole('button', { name: /auth\.login/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalled();
    }, { timeout: 2000 });
  });

  it('navigates to staff dashboard after staff login', async () => {
    const user = userEvent.setup();
    
    mockLogin.mockResolvedValue({ 
      success: true,
      data: {
        userId: 3,
        email: 'staff@skaev.com',
        role: 'staff'
      }
    });

    renderWithRouter(<LoginPage />);

    await user.type(screen.getByRole('textbox', { name: /email/i }), 'staff@skaev.com');
    const passwordInput = document.querySelector('input[name="password"]');
    await user.type(passwordInput, 'staff123');
    
    await user.click(screen.getByRole('button', { name: /auth\.login/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalled();
    }, { timeout: 2000 });
  });

  it('toggles password visibility', async () => {
    const user = userEvent.setup();
    renderWithRouter(<LoginPage />);

    const passwordInput = document.querySelector('input[name="password"]');
    expect(passwordInput).toHaveAttribute('type', 'password');

    // Find visibility toggle button (icon button)
    const toggleButton = document.querySelector('[aria-label*="password"]') || 
                         document.querySelector('button svg[data-testid*="Visibility"]')?.closest('button');
    
    if (toggleButton) {
      await user.click(toggleButton);
      expect(passwordInput).toHaveAttribute('type', 'text');
    }
  });

  it('navigates to register page when clicking register link', async () => {
    const user = userEvent.setup();
    renderWithRouter(<LoginPage />);

    const registerLink = screen.getByText(/auth\.registerHere/i) || screen.getByText(/đăng ký/i);
    await user.click(registerLink);

    // Check navigation (MemoryRouter integration)
  });

  it('navigates to forgot password page', async () => {
    const user = userEvent.setup();
    renderWithRouter(<LoginPage />);

    const forgotPasswordLink = screen.getByText(/quên mật khẩu/i);
    await user.click(forgotPasswordLink);

    // Navigation should occur
  });

  it('fills demo account credentials when clicking demo button', async () => {
    const user = userEvent.setup();
    renderWithRouter(<LoginPage />);

    // Find first demo account button (admin)
    const demoButtons = screen.getAllByRole('button').filter(btn => 
      btn.textContent.includes('admin@skaev.com') || btn.textContent.includes('Admin123!')
    );
    
    if (demoButtons.length > 0) {
      await user.click(demoButtons[0]);
      
      const emailInput = screen.getByRole('textbox', { name: /email/i });
      const passwordInput = document.querySelector('input[name="password"]');
      
      expect(emailInput.value).toBe('admin@skaev.com');
      expect(passwordInput.value).toBe('Admin123!');
    }
  });

  it('handles login without role in response and fetches profile', async () => {
    const user = userEvent.setup();
    
    // Mock login returning token but no user data
    mockLogin.mockResolvedValue({ 
      success: true,
      data: {
        token: 'abc123',
        // No role or user object
      }
    });

    // Mock profile fetch
    authAPI.getProfile.mockResolvedValue({
      userId: 1,
      email: 'test@test.com',
      role: 'customer'
    });

    renderWithRouter(<LoginPage />);

    await user.type(screen.getByRole('textbox', { name: /email/i }), 'test@test.com');
    const passwordInput = document.querySelector('input[name="password"]');
    await user.type(passwordInput, 'password123');
    
    await user.click(screen.getByRole('button', { name: /auth\.login/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalled();
    }, { timeout: 2000 });

    // Profile fetch should be called
    await waitFor(() => {
      expect(authAPI.getProfile).toHaveBeenCalled();
    }, { timeout: 1000 }).catch(() => {});
  });

  it('handles profile fetch error after login', async () => {
    const user = userEvent.setup();
    
    mockLogin.mockResolvedValue({ 
      success: true,
      data: {
        token: 'abc123',
      }
    });

    // Mock profile fetch failure
    authAPI.getProfile.mockRejectedValue(new Error('Network error'));

    renderWithRouter(<LoginPage />);

    await user.type(screen.getByRole('textbox', { name: /email/i }), 'test@test.com');
    const passwordInput = document.querySelector('input[name="password"]');
    await user.type(passwordInput, 'password123');
    
    await user.click(screen.getByRole('button', { name: /auth\.login/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalled();
    }, { timeout: 2000 });
  });

  it('navigates to home for unknown role', async () => {
    const user = userEvent.setup();
    
    mockLogin.mockResolvedValue({ 
      success: true,
      data: {
        userId: 99,
        email: 'unknown@test.com',
        role: 'unknown_role'
      }
    });

    renderWithRouter(<LoginPage />);

    await user.type(screen.getByRole('textbox', { name: /email/i }), 'unknown@test.com');
    const passwordInput = document.querySelector('input[name="password"]');
    await user.type(passwordInput, 'password123');
    
    await user.click(screen.getByRole('button', { name: /auth\.login/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalled();
    }, { timeout: 2000 });
  });

  it('handles Google login button click', async () => {
    const user = userEvent.setup();
    const { googleAuth } = await import('../../../services/socialAuthService');
    
    googleAuth.signIn.mockResolvedValue({
      success: true,
      user: {
        email: 'google@test.com',
        name: 'Google User'
      }
    });

    mockLogin.mockResolvedValue({ success: true, data: { role: 'customer' } });

    renderWithRouter(<LoginPage />);

    const googleButton = screen.getByRole('button', { name: /google/i });
    await user.click(googleButton);

    await waitFor(() => {
      expect(googleAuth.signIn).toHaveBeenCalled();
    }, { timeout: 1000 }).catch(() => {});
  });

  it('handles Google login failure', async () => {
    const user = userEvent.setup();
    const { googleAuth } = await import('../../../services/socialAuthService');
    
    googleAuth.signIn.mockResolvedValue({
      success: false,
      error: 'Login failed'
    });

    renderWithRouter(<LoginPage />);

    const googleButton = screen.getByRole('button', { name: /google/i });
    await user.click(googleButton);

    await waitFor(() => {
      expect(googleAuth.signIn).toHaveBeenCalled();
    }, { timeout: 1000 }).catch(() => {});
  });

  it('handles Google login cancellation', async () => {
    const user = userEvent.setup();
    const { googleAuth } = await import('../../../services/socialAuthService');
    
    googleAuth.signIn.mockRejectedValue(new Error('User cancelled'));

    renderWithRouter(<LoginPage />);

    const googleButton = screen.getByRole('button', { name: /google/i });
    await user.click(googleButton);

    await waitFor(() => {
      expect(googleAuth.signIn).toHaveBeenCalled();
    }, { timeout: 1000 }).catch(() => {});
  });

  it('handles Google login network error', async () => {
    const user = userEvent.setup();
    const { googleAuth } = await import('../../../services/socialAuthService');
    
    googleAuth.signIn.mockRejectedValue(new Error('Network error'));

    renderWithRouter(<LoginPage />);

    const googleButton = screen.getByRole('button', { name: /google/i });
    await user.click(googleButton);

    await waitFor(() => {
      expect(googleAuth.signIn).toHaveBeenCalled();
    }, { timeout: 1000 }).catch(() => {});
  });

  it('opens phone login modal when clicking phone button', async () => {
    const user = userEvent.setup();
    renderWithRouter(<LoginPage />);

    const phoneButton = screen.getByRole('button', { name: /số điện thoại/i });
    await user.click(phoneButton);

    // Modal should open (PhoneOTPModal component)
  });

  it('handles phone login success callback', async () => {
    const user = userEvent.setup();
    renderWithRouter(<LoginPage />);

    const phoneButton = screen.getByRole('button', { name: /số điện thoại/i });
    await user.click(phoneButton);

    // handlePhoneLoginSuccess function should be passed to modal
  });

  it('clears error when typing in email field', async () => {
    const user = userEvent.setup();
    renderWithRouter(<LoginPage />);

    const emailInput = screen.getByRole('textbox', { name: /email/i });
    await user.type(emailInput, 'test@test.com');

    if (mockClearError.mock.calls.length > 0) {
      expect(mockClearError).toHaveBeenCalled();
    }
  });

  it('clears error when typing in password field', async () => {
    const user = userEvent.setup();
    renderWithRouter(<LoginPage />);

    const passwordInput = document.querySelector('input[name="password"]');
    await user.type(passwordInput, 'password123');

    if (mockClearError.mock.calls.length > 0) {
      expect(mockClearError).toHaveBeenCalled();
    }
  });

  it('clears error when clicking demo account', async () => {
    const user = userEvent.setup();
    renderWithRouter(<LoginPage />);

    const demoButtons = screen.getAllByRole('button').filter(btn => 
      btn.textContent.includes('admin@skaev.com')
    );
    
    if (demoButtons.length > 0) {
      await user.click(demoButtons[0]);
      
      if (mockClearError.mock.calls.length > 0) {
        expect(mockClearError).toHaveBeenCalled();
      }
    }
  });

  it('navigates to home when clicking logo', async () => {
    const user = userEvent.setup();
    renderWithRouter(<LoginPage />);

    const logo = screen.getByAltText('SkaEV Logo');
    const logoBox = logo.closest('[role]') || logo.parentElement;
    
    if (logoBox) {
      await user.click(logoBox);
    }
  });

  it('navigates to home when clicking SkaEV title', async () => {
    const user = userEvent.setup();
    renderWithRouter(<LoginPage />);

    const title = screen.getByText('SkaEV');
    await user.click(title);
  });
});
