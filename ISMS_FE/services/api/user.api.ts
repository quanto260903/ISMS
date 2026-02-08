import { apiClient } from '@/lib/api';
import type { UserProfile, UpdateProfileRequest, ChangePasswordRequest } from '@/lib/types/user.types';
import type { ApiResponse } from '@/lib/types/api.types';

/**
 * Get current user profile (from token)
 * GET /api/warehouse/auth/me
 */
export async function getCurrentUserProfile(): Promise<ApiResponse<UserProfile>> {
  const response = await apiClient.get<ApiResponse<UserProfile>>('/warehouse/auth/me');
  return response.data;
}

/**
 * Get user profile by ID
 * GET /api/warehouse/auth/{userId}
 */
export async function getUserById(userId: number): Promise<ApiResponse<UserProfile>> {
  const response = await apiClient.get<ApiResponse<UserProfile>>(`/warehouse/auth/${userId}`);
  return response.data;
}

/**
 * Update user profile
 * PUT /api/warehouse/auth/{userId}
 * Note: User can only update their own profile unless they are Admin (roleId = 1)
 */
export async function updateUserProfile(
  userId: number,
  data: UpdateProfileRequest
): Promise<ApiResponse<UserProfile>> {
  const response = await apiClient.put<ApiResponse<UserProfile>>(
    `/warehouse/auth/${userId}`,
    data
  );
  return response.data;
}

/**
 * Change password for current user
 * POST /api/warehouse/auth/change-password
 */
export async function changePassword(data: ChangePasswordRequest): Promise<ApiResponse<void>> {
  const response = await apiClient.post<ApiResponse<void>>(
    '/warehouse/auth/change-password',
    data
  );
  return response.data;
}
