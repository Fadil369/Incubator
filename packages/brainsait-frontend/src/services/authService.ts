/**
 * Authentication Service for BrainSAIT Frontend
 * Handles all authentication-related API calls
 *
 * @author BrainSAIT Platform
 * @version 1.0.0
 */

import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { toast } from 'react-hot-toast';
import {
  User,
  LoginRequest,
  LoginResponse,
  CreateUserRequest,
} from '@brainsait/shared/types/user.types';
import { ApiResponse, RefreshTokenResponse } from '@brainsait/shared/types/api.types';

// Environment configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Auth endpoints
const AUTH_ENDPOINTS = {
  LOGIN: '/api/auth/login',
  REGISTER: '/api/auth/register',
  LOGOUT: '/api/auth/logout',
  REFRESH: '/api/auth/refresh',
  VERIFY_EMAIL: '/api/auth/verify-email',
  RESEND_VERIFICATION: '/api/auth/resend-verification',
  FORGOT_PASSWORD: '/api/auth/forgot-password',
  RESET_PASSWORD: '/api/auth/reset-password',
  CHANGE_PASSWORD: '/api/auth/change-password',
  ME: '/api/auth/me',
};

/**
 * Register request interface
 */
export interface RegisterRequest extends CreateUserRequest {
  confirmPassword: string;
}

/**
 * Password reset request
 */
export interface ResetPasswordRequest {
  token: string;
  password: string;
  confirmPassword: string;
}

/**
 * Change password request
 */
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

/**
 * Verify email request
 */
export interface VerifyEmailRequest {
  token: string;
}

/**
 * Forgot password request
 */
export interface ForgotPasswordRequest {
  email: string;
}

/**
 * Authentication Service Class
 * Handles all authentication operations
 */
class AuthService {
  private api: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true, // Enable cookies for session management
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = this.getToken();
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for token refresh
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // If error is 401 and we haven't tried to refresh yet
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const refreshToken = this.getRefreshToken();
            if (refreshToken) {
              const response = await axios.post<ApiResponse<RefreshTokenResponse>>(
                `${API_BASE_URL}${AUTH_ENDPOINTS.REFRESH}`,
                { refreshToken }
              );

              if (response.data.success && response.data.data) {
                this.setToken(response.data.data.accessToken);
                originalRequest.headers.Authorization = `Bearer ${response.data.data.accessToken}`;
                return this.api(originalRequest);
              }
            }
          } catch (refreshError) {
            // Refresh failed, clear tokens and redirect to login
            this.clearTokens();
            if (typeof window !== 'undefined') {
              window.location.href = '/auth/login';
            }
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  /**
   * Get stored auth token
   */
  private getToken(): string | null {
    if (this.token) return this.token;

    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_token');
    }

    return null;
  }

  /**
   * Get stored refresh token
   */
  private getRefreshToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('refresh_token');
    }
    return null;
  }

  /**
   * Set auth token
   */
  public setToken(token: string): void {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
    }
  }

  /**
   * Set refresh token
   */
  private setRefreshToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('refresh_token', token);
    }
  }

  /**
   * Clear all tokens
   */
  public clearTokens(): void {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('auth_user');
    }
  }

  /**
   * Handle API errors
   */
  private handleError(error: any, operation: string): never {
    console.error(`Auth Service - ${operation}:`, error);

    let errorMessage = 'حدث خطأ غير متوقع';

    if (error.response?.status === 400) {
      errorMessage = error.response.data?.error?.message || 'البيانات المدخلة غير صحيحة';
    } else if (error.response?.status === 401) {
      errorMessage = 'البريد الإلكتروني أو كلمة المرور غير صحيحة';
    } else if (error.response?.status === 403) {
      errorMessage = 'ليس لديك صلاحية للوصول';
    } else if (error.response?.status === 404) {
      errorMessage = 'المستخدم غير موجود';
    } else if (error.response?.status === 409) {
      errorMessage = 'البريد الإلكتروني مستخدم مسبقاً';
    } else if (error.response?.status === 429) {
      errorMessage = 'تجاوزت الحد المسموح من المحاولات، حاول لاحقاً';
    } else if (error.response?.data?.error?.message) {
      errorMessage = error.response.data.error.message;
    } else if (error.message === 'Network Error') {
      errorMessage = 'خطأ في الاتصال بالخادم';
    }

    toast.error(errorMessage);
    throw error;
  }

  /**
   * Login user
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      toast.loading('جاري تسجيل الدخول...', { id: 'login' });

      const response = await this.api.post<ApiResponse<LoginResponse>>(
        AUTH_ENDPOINTS.LOGIN,
        credentials
      );

      toast.dismiss('login');

      if (response.data.success && response.data.data) {
        const { user, token } = response.data.data;

        this.setToken(token);

        // Store user data
        if (typeof window !== 'undefined') {
          localStorage.setItem('auth_user', JSON.stringify(user));
        }

        toast.success(`مرحباً ${user.firstName}!`);
        return response.data.data;
      }

      throw new Error('Invalid response format');
    } catch (error) {
      toast.dismiss('login');
      return this.handleError(error, 'Login');
    }
  }

  /**
   * Register new user
   */
  async register(data: RegisterRequest): Promise<LoginResponse> {
    try {
      toast.loading('جاري إنشاء الحساب...', { id: 'register' });

      // Validate passwords match
      if (data.password !== data.confirmPassword) {
        toast.dismiss('register');
        toast.error('كلمات المرور غير متطابقة');
        throw new Error('Passwords do not match');
      }

      // Remove confirmPassword before sending
      const { confirmPassword, ...registerData } = data;

      const response = await this.api.post<ApiResponse<LoginResponse>>(
        AUTH_ENDPOINTS.REGISTER,
        registerData
      );

      toast.dismiss('register');

      if (response.data.success && response.data.data) {
        const { user, token } = response.data.data;

        this.setToken(token);

        // Store user data
        if (typeof window !== 'undefined') {
          localStorage.setItem('auth_user', JSON.stringify(user));
        }

        toast.success('تم إنشاء الحساب بنجاح!');
        toast.info('يرجى التحقق من بريدك الإلكتروني لتفعيل الحساب');

        return response.data.data;
      }

      throw new Error('Invalid response format');
    } catch (error) {
      toast.dismiss('register');
      return this.handleError(error, 'Register');
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      await this.api.post(AUTH_ENDPOINTS.LOGOUT);
      this.clearTokens();
      toast.success('تم تسجيل الخروج بنجاح');
    } catch (error) {
      // Even if the API call fails, clear local tokens
      this.clearTokens();
      console.error('Logout error:', error);
    }
  }

  /**
   * Get current user
   */
  async getCurrentUser(): Promise<User> {
    try {
      const response = await this.api.get<ApiResponse<User>>(AUTH_ENDPOINTS.ME);

      if (response.data.success && response.data.data) {
        // Update stored user data
        if (typeof window !== 'undefined') {
          localStorage.setItem('auth_user', JSON.stringify(response.data.data));
        }
        return response.data.data;
      }

      throw new Error('Invalid response format');
    } catch (error) {
      return this.handleError(error, 'Get Current User');
    }
  }

  /**
   * Verify email with token
   */
  async verifyEmail(token: string): Promise<void> {
    try {
      toast.loading('جاري التحقق من البريد الإلكتروني...', { id: 'verify' });

      const response = await this.api.post<ApiResponse<void>>(
        AUTH_ENDPOINTS.VERIFY_EMAIL,
        { token }
      );

      toast.dismiss('verify');

      if (response.data.success) {
        toast.success('تم تفعيل حسابك بنجاح!');
      } else {
        throw new Error('Verification failed');
      }
    } catch (error) {
      toast.dismiss('verify');
      return this.handleError(error, 'Verify Email');
    }
  }

  /**
   * Resend verification email
   */
  async resendVerification(email: string): Promise<void> {
    try {
      toast.loading('جاري إرسال رابط التفعيل...', { id: 'resend' });

      const response = await this.api.post<ApiResponse<void>>(
        AUTH_ENDPOINTS.RESEND_VERIFICATION,
        { email }
      );

      toast.dismiss('resend');

      if (response.data.success) {
        toast.success('تم إرسال رابط التفعيل إلى بريدك الإلكتروني');
      }
    } catch (error) {
      toast.dismiss('resend');
      return this.handleError(error, 'Resend Verification');
    }
  }

  /**
   * Request password reset
   */
  async forgotPassword(email: string): Promise<void> {
    try {
      toast.loading('جاري إرسال رابط إعادة التعيين...', { id: 'forgot' });

      const response = await this.api.post<ApiResponse<void>>(
        AUTH_ENDPOINTS.FORGOT_PASSWORD,
        { email }
      );

      toast.dismiss('forgot');

      if (response.data.success) {
        toast.success('تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني');
      }
    } catch (error) {
      toast.dismiss('forgot');
      return this.handleError(error, 'Forgot Password');
    }
  }

  /**
   * Reset password with token
   */
  async resetPassword(data: ResetPasswordRequest): Promise<void> {
    try {
      toast.loading('جاري إعادة تعيين كلمة المرور...', { id: 'reset' });

      // Validate passwords match
      if (data.password !== data.confirmPassword) {
        toast.dismiss('reset');
        toast.error('كلمات المرور غير متطابقة');
        throw new Error('Passwords do not match');
      }

      const response = await this.api.post<ApiResponse<void>>(
        AUTH_ENDPOINTS.RESET_PASSWORD,
        {
          token: data.token,
          password: data.password,
        }
      );

      toast.dismiss('reset');

      if (response.data.success) {
        toast.success('تم إعادة تعيين كلمة المرور بنجاح!');
      }
    } catch (error) {
      toast.dismiss('reset');
      return this.handleError(error, 'Reset Password');
    }
  }

  /**
   * Change password for logged-in user
   */
  async changePassword(data: ChangePasswordRequest): Promise<void> {
    try {
      toast.loading('جاري تغيير كلمة المرور...', { id: 'change' });

      // Validate passwords match
      if (data.newPassword !== data.confirmPassword) {
        toast.dismiss('change');
        toast.error('كلمات المرور غير متطابقة');
        throw new Error('Passwords do not match');
      }

      const response = await this.api.post<ApiResponse<void>>(
        AUTH_ENDPOINTS.CHANGE_PASSWORD,
        {
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        }
      );

      toast.dismiss('change');

      if (response.data.success) {
        toast.success('تم تغيير كلمة المرور بنجاح!');
      }
    } catch (error) {
      toast.dismiss('change');
      return this.handleError(error, 'Change Password');
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  /**
   * Get stored user data
   */
  getStoredUser(): User | null {
    if (typeof window !== 'undefined') {
      const userData = localStorage.getItem('auth_user');
      if (userData) {
        try {
          return JSON.parse(userData);
        } catch (error) {
          console.error('Error parsing stored user data:', error);
          return null;
        }
      }
    }
    return null;
  }
}

// Export singleton instance
export const authService = new AuthService();
export default authService;
