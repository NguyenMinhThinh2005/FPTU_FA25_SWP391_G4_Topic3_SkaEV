import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import useAuthStore from '../authStore';
import { authAPI } from '../services/api';

// Mock API
vi.mock('../services/api', () => ({
  authAPI: {
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
  },
}));

describe('authStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    localStorage.clear();
  });

  afterEach(() => {
    // Reset store state
    const { result } = renderHook(() => useAuthStore());
    act(() => {
      result.current.logout();
    });
  });

  it('initializes with unauthenticated state', () => {
    const { result } = renderHook(() => useAuthStore());

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('logs in user successfully and sets state', async () => {
    const mockResponse = {
      userId: 1,
      email: 'customer@skaev.com',
      fullName: 'Test Customer',
      role: 'customer',
      token: 'mock-jwt-token',
      refreshToken: 'mock-refresh-token',
      expiresAt: '2025-11-07T10:00:00Z',
    };

    authAPI.login.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useAuthStore());

    let loginResult;
    await act(async () => {
      loginResult = await result.current.login('customer@skaev.com', 'password123');
    });

    // Assert API was called
    expect(authAPI.login).toHaveBeenCalledWith({
      email: 'customer@skaev.com',
      password: 'password123',
    });

    // Assert state updated
    expect(result.current.user).toEqual({
      user_id: 1,
      email: 'customer@skaev.com',
      full_name: 'Test Customer',
      role: 'customer',
    });
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();

    // Assert token stored in sessionStorage
    expect(sessionStorage.getItem('token')).toBe('mock-jwt-token');
    expect(sessionStorage.getItem('refreshToken')).toBe('mock-refresh-token');

    // Assert return value
    expect(loginResult.success).toBe(true);
    expect(loginResult.data.token).toBe('mock-jwt-token');
  });

  it('handles login error and sets error state', async () => {
    const error = new Error('Invalid credentials');
    error.response = { data: { message: 'Email hoặc mật khẩu không đúng' } };
    authAPI.login.mockRejectedValue(error);

    const { result } = renderHook(() => useAuthStore());

    let loginResult;
    await act(async () => {
      loginResult = await result.current.login('wrong@example.com', 'wrong');
    });

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.error).toBeTruthy();
    expect(loginResult.success).toBe(false);
  });

  it('registers user successfully', async () => {
    const mockResponse = {
      userId: 2,
      email: 'newuser@example.com',
      fullName: 'New User',
      message: 'Registration successful',
    };

    authAPI.register.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useAuthStore());

    let registerResult;
    await act(async () => {
      registerResult = await result.current.register({
        email: 'newuser@example.com',
        password: 'Password123!',
        fullName: 'New User',
        phoneNumber: '0123456789',
        role: 'customer',
      });
    });

    expect(authAPI.register).toHaveBeenCalled();
    expect(registerResult.success).toBe(true);
    expect(registerResult.user.email).toBe('newuser@example.com');
  });

  it('clears user state on logout', async () => {
    // First login
    authAPI.login.mockResolvedValue({
      userId: 1,
      email: 'test@example.com',
      fullName: 'Test',
      role: 'customer',
      token: 'token',
    });

    const { result } = renderHook(() => useAuthStore());

    await act(async () => {
      await result.current.login('test@example.com', 'pass');
    });

    expect(result.current.isAuthenticated).toBe(true);

    // Logout
    await act(async () => {
      await result.current.logout();
    });

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(sessionStorage.getItem('token')).toBeNull();
  });

  it('clears error when clearError is called', async () => {
    const error = new Error('Test error');
    authAPI.login.mockRejectedValue(error);

    const { result } = renderHook(() => useAuthStore());

    await act(async () => {
      await result.current.login('test@example.com', 'wrong');
    });

    expect(result.current.error).toBeTruthy();

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
  });

  it('persists user data across page reloads', async () => {
    const mockResponse = {
      userId: 1,
      email: 'test@example.com',
      fullName: 'Test User',
      role: 'customer',
      token: 'token',
    };

    authAPI.login.mockResolvedValue(mockResponse);

    const { result: result1 } = renderHook(() => useAuthStore());

    await act(async () => {
      await result1.current.login('test@example.com', 'password');
    });

    // Create new hook instance (simulating page reload)
    const { result: result2 } = renderHook(() => useAuthStore());

    // State should be restored from sessionStorage
    expect(result2.current.user).toEqual({
      user_id: 1,
      email: 'test@example.com',
      full_name: 'Test User',
      role: 'customer',
    });
    expect(result2.current.isAuthenticated).toBe(true);
  });

  it('provides role helper methods', () => {
    const { result } = renderHook(() => useAuthStore());

    // Mock user state directly
    act(() => {
      result.current.user = { user_id: 1, email: 'admin@test.com', role: 'admin' };
      result.current.isAuthenticated = true;
    });

    expect(result.current.isAdmin()).toBe(true);
    expect(result.current.isStaff()).toBe(false);
    expect(result.current.isCustomer()).toBe(false);
  });

  it('updates profile data', () => {
    const { result } = renderHook(() => useAuthStore());

    // Set initial user
    act(() => {
      result.current.user = {
        user_id: 1,
        email: 'test@example.com',
        full_name: 'Test User',
        role: 'customer',
        profile: { phone: '0123456789' },
      };
    });

    // Update profile
    act(() => {
      result.current.updateProfile({ phone: '0987654321' });
    });

    expect(result.current.user.profile.phone).toBe('0987654321');
  });
});
