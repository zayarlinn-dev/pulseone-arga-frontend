import publicApi from '@/providers/publicAxios';
import privateApi from '@/providers/privateAxios';
import { API_ENDPOINTS } from '@/config/constants';
import { toApiError } from '@/lib/getApiErrorMessage';
import type { ApiResponse } from '@/types/api';

export interface LoginPayload {
  username: string;
  password: string;
}

export interface LoginResult {
  userId: number;
  username: string;
  role: string;
  isSuperUser: boolean;
  token: string;
  refreshToken: string;
  expiresAt: string;
  permissions: string[];
}

export interface CurrentUser {
  id: number;
  username: string;
  role: string;
  isActive: boolean;
  isSuperUser: boolean;
  remarks?: string | null;
  permissions: string[];
}

class AuthService {
  async login(payload: LoginPayload): Promise<LoginResult> {
    try {
      const response = await publicApi.post<ApiResponse<LoginResult>>(
        API_ENDPOINTS.AUTH_LOGIN,
        payload
      );
      return response.data.data;
    } catch (error) {
      throw toApiError(error, 'Login failed');
    }
  }

  async me(): Promise<CurrentUser> {
    try {
      const response = await privateApi.get<ApiResponse<CurrentUser>>(API_ENDPOINTS.AUTH_ME);
      return response.data.data;
    } catch (error) {
      throw toApiError(error, 'Failed to load current user');
    }
  }

  async logout(): Promise<void> {
    try {
      await privateApi.post(API_ENDPOINTS.AUTH_LOGOUT);
    } catch {
      // A failed logout call must not block clearing the local session.
    }
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    try {
      await privateApi.post(API_ENDPOINTS.AUTH_CHANGE_PASSWORD, { currentPassword, newPassword });
    } catch (error) {
      throw toApiError(error, 'Failed to change password');
    }
  }
}

export const authService = new AuthService();
