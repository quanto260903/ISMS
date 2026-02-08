import { apiClient } from '@/lib/api';
import type {
    UserDto,
    CreateUserRequest,
    UpdateUserRequest,
    UserPagedRequestDto,
    PagedResponse
} from '@/lib/types/user.types';
import type { ApiResponse } from '@/lib/types/api.types';

/**
 * Get paginated users with filtering and sorting
 * GET /api/user
 * Authorization: Admin (Role 1) or Manager (Role 2)
 */
export async function getUsers(
    params?: UserPagedRequestDto
): Promise<ApiResponse<PagedResponse<UserDto>>> {
    const response = await apiClient.get<ApiResponse<PagedResponse<UserDto>>>('/user', {
        params: {
            pageIndex: params?.pageIndex || 1,
            pageSize: params?.pageSize || 10,
            search: params?.search,
            roleFilter: params?.roleFilter,
            sortBy: params?.sortBy,
            sortDesc: params?.sortDesc,
        }
    });
    return response.data;
}

/**
 * Get user by ID
 * GET /api/user/{id}
 * Authorization: Admin (Role 1) or Manager (Role 2)
 */
export async function getUserById(id: number): Promise<ApiResponse<UserDto>> {
    const response = await apiClient.get<ApiResponse<UserDto>>(`/user/${id}`);
    return response.data;
}

/**
 * Create new user
 * POST /api/user
 * Authorization: Admin (Role 1) only
 */
export async function createUser(data: CreateUserRequest): Promise<ApiResponse<UserDto>> {
    const response = await apiClient.post<ApiResponse<UserDto>>('/user', data);
    return response.data;
}

/**
 * Update user
 * PUT /api/user/{id}
 * Authorization: Admin (Role 1) only
 */
export async function updateUser(
    id: number,
    data: UpdateUserRequest
): Promise<ApiResponse<UserDto>> {
    const response = await apiClient.put<ApiResponse<UserDto>>(`/user/${id}`, data);
    return response.data;
}

/**
 * Delete user
 * DELETE /api/user/{id}
 * Authorization: Admin (Role 1) only
 */
export async function deleteUser(id: number): Promise<ApiResponse<null>> {
    const response = await apiClient.delete<ApiResponse<null>>(`/user/${id}`);
    return response.data;
}

/**
 * Get providers/suppliers (Role = 4)
 * GET /api/user/providers
 * Authorization: All authenticated users
 */
export async function getProviders(
    pageIndex: number = 1,
    pageSize: number = 10
): Promise<ApiResponse<PagedResponse<UserDto>>> {
    const response = await apiClient.get<ApiResponse<PagedResponse<UserDto>>>('/user/providers', {
        params: { pageIndex, pageSize }
    });
    return response.data;
}
