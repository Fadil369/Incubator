/**
 * User Service for BrainSAIT Frontend
 * Handles user profile and settings operations
 *
 * @author BrainSAIT Platform
 * @version 1.0.0
 */

import axios, { AxiosInstance } from 'axios';
import { toast } from 'react-hot-toast';
import { User, UpdateUserRequest } from '@brainsait/shared/types/user.types';
import { ApiResponse, PaginatedResponse, PaginationParams } from '@brainsait/shared/types/api.types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

class UserService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true,
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
      (error) => Promise.reject(error)
    );
  }

  private getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_token');
    }
    return null;
  }

  private handleError(error: any, operation: string): never {
    console.error(`User Service - ${operation}:`, error);

    let errorMessage = 'حدث خطأ غير متوقع';

    if (error.response?.status === 400) {
      errorMessage = error.response.data?.error?.message || 'البيانات المدخلة غير صحيحة';
    } else if (error.response?.status === 401) {
      errorMessage = 'يرجى تسجيل الدخول مرة أخرى';
    } else if (error.response?.status === 403) {
      errorMessage = 'ليس لديك صلاحية لهذا الإجراء';
    } else if (error.response?.status === 404) {
      errorMessage = 'المستخدم غير موجود';
    } else if (error.response?.data?.error?.message) {
      errorMessage = error.response.data.error.message;
    }

    toast.error(errorMessage);
    throw error;
  }

  /**
   * Get current user profile
   */
  async getCurrentUser(): Promise<User> {
    try {
      const response = await this.api.get<ApiResponse<User>>('/api/users/me');

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      throw new Error('Invalid response format');
    } catch (error) {
      return this.handleError(error, 'Get Current User');
    }
  }

  /**
   * Update current user profile
   */
  async updateProfile(data: UpdateUserRequest): Promise<User> {
    try {
      toast.loading('جاري تحديث الملف الشخصي...', { id: 'update-profile' });

      const response = await this.api.put<ApiResponse<User>>('/api/users/me', data);

      toast.dismiss('update-profile');

      if (response.data.success && response.data.data) {
        toast.success('تم تحديث الملف الشخصي بنجاح');
        return response.data.data;
      }

      throw new Error('Invalid response format');
    } catch (error) {
      toast.dismiss('update-profile');
      return this.handleError(error, 'Update Profile');
    }
  }

  /**
   * Upload user avatar
   */
  async uploadAvatar(file: File): Promise<string> {
    try {
      toast.loading('جاري رفع الصورة...', { id: 'upload-avatar' });

      const formData = new FormData();
      formData.append('avatar', file);

      const response = await this.api.post<ApiResponse<{ url: string }>>(
        '/api/users/me/avatar',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      toast.dismiss('upload-avatar');

      if (response.data.success && response.data.data) {
        toast.success('تم رفع الصورة بنجاح');
        return response.data.data.url;
      }

      throw new Error('Invalid response format');
    } catch (error) {
      toast.dismiss('upload-avatar');
      return this.handleError(error, 'Upload Avatar');
    }
  }

  /**
   * Delete user avatar
   */
  async deleteAvatar(): Promise<void> {
    try {
      toast.loading('جاري حذف الصورة...', { id: 'delete-avatar' });

      const response = await this.api.delete<ApiResponse<void>>('/api/users/me/avatar');

      toast.dismiss('delete-avatar');

      if (response.data.success) {
        toast.success('تم حذف الصورة بنجاح');
      }
    } catch (error) {
      toast.dismiss('delete-avatar');
      return this.handleError(error, 'Delete Avatar');
    }
  }

  /**
   * Get user by ID (admin only)
   */
  async getUserById(userId: string): Promise<User> {
    try {
      const response = await this.api.get<ApiResponse<User>>(`/api/users/${userId}`);

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      throw new Error('Invalid response format');
    } catch (error) {
      return this.handleError(error, 'Get User By ID');
    }
  }

  /**
   * List all users (admin only)
   */
  async listUsers(params?: PaginationParams): Promise<PaginatedResponse<User>> {
    try {
      const response = await this.api.get<ApiResponse<PaginatedResponse<User>>>('/api/users', {
        params,
      });

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      throw new Error('Invalid response format');
    } catch (error) {
      return this.handleError(error, 'List Users');
    }
  }

  /**
   * Update user (admin only)
   */
  async updateUser(userId: string, data: Partial<User>): Promise<User> {
    try {
      toast.loading('جاري تحديث المستخدم...', { id: 'update-user' });

      const response = await this.api.put<ApiResponse<User>>(`/api/users/${userId}`, data);

      toast.dismiss('update-user');

      if (response.data.success && response.data.data) {
        toast.success('تم تحديث المستخدم بنجاح');
        return response.data.data;
      }

      throw new Error('Invalid response format');
    } catch (error) {
      toast.dismiss('update-user');
      return this.handleError(error, 'Update User');
    }
  }

  /**
   * Delete user (admin only)
   */
  async deleteUser(userId: string): Promise<void> {
    try {
      toast.loading('جاري حذف المستخدم...', { id: 'delete-user' });

      const response = await this.api.delete<ApiResponse<void>>(`/api/users/${userId}`);

      toast.dismiss('delete-user');

      if (response.data.success) {
        toast.success('تم حذف المستخدم بنجاح');
      }
    } catch (error) {
      toast.dismiss('delete-user');
      return this.handleError(error, 'Delete User');
    }
  }
}

// Export singleton instance
export const userService = new UserService();
export default userService;
