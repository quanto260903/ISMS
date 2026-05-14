// ============================================================
//  features/user-management/userManagement.api.ts
// ============================================================

import type {
  UserListResult,
  UserDetailDto,
  CreateUserRequest,
  UpdateUserRequest,
  UpdateRoleRequest,
} from "./types/userManagement.types";

const BASE = process.env.NEXT_PUBLIC_API_URL;

function authHeader(): Record<string, string> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function api<T>(
  url: string,
  options?: RequestInit
): Promise<{ isSuccess: boolean; data?: T; message: string; statusCode: number }> {
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...authHeader(),
      ...(options?.headers ?? {}),
    },
    cache: "no-store",
  });
  return res.json();
}

// ── Danh sách người dùng ──────────────────────────────────────
export async function getUserList(params: {
  keyword?:  string;
  roleId?:   number;
  isActive?: boolean;
  page?:     number;
  pageSize?: number;
}): Promise<UserListResult> {
  const q = new URLSearchParams();
  if (params.keyword  !== undefined) q.set("keyword",  params.keyword);
  if (params.roleId   !== undefined) q.set("roleId",   String(params.roleId));
  if (params.isActive !== undefined) q.set("isActive", String(params.isActive));
  q.set("page",     String(params.page     ?? 1));
  q.set("pageSize", String(params.pageSize ?? 50));

  const res = await api<{ items: UserListResult["items"]; total: number; page: number; pageSize: number }>(
    `${BASE}/User/list?${q}`
  );
  if (!res.isSuccess || !res.data) throw new Error(res.message);
  return res.data;
}

// ── Chi tiết 1 user ───────────────────────────────────────────
export async function getUserById(userId: string): Promise<UserDetailDto> {
  const res = await api<UserDetailDto>(`${BASE}/User/${userId}`);
  if (!res.isSuccess || !res.data) throw new Error(res.message);
  return res.data;
}

// ── Tạo tài khoản ────────────────────────────────────────────
export async function createUser(
  payload: CreateUserRequest
): Promise<UserDetailDto> {
  const res = await api<UserDetailDto>(`${BASE}/User/create`, {
    method: "POST",
    body:   JSON.stringify(payload),
  });
  if (!res.isSuccess || !res.data) throw new Error(res.message);
  return res.data;
}

// ── Cập nhật thông tin ────────────────────────────────────────
export async function updateUser(
  userId: string,
  payload: UpdateUserRequest
): Promise<UserDetailDto> {
  const res = await api<UserDetailDto>(`${BASE}/User/${userId}`, {
    method: "PUT",
    body:   JSON.stringify(payload),
  });
  if (!res.isSuccess || !res.data) throw new Error(res.message);
  return res.data;
}

// ── Đổi phân quyền (multi-role) ───────────────────────────────
// Gửi mảng roleIds thay vì 1 số roleId
export async function updateRole(
  userId: string,
  payload: UpdateRoleRequest   // ✅ { roleIds: number[] }
): Promise<string> {
  const res = await api<number>(`${BASE}/User/${userId}/role`, {
    method: "PUT",
    body:   JSON.stringify(payload),  // { roleIds: [2, 3] }
  });
  if (!res.isSuccess) throw new Error(res.message);
  return res.message;
}

// ── Reset mật khẩu ───────────────────────────────────────────
export async function resetPassword(
  userId: string,
  newPassword: string
): Promise<string> {
  const res = await api<number>(`${BASE}/User/${userId}/password`, {
    method: "PUT",
    body:   JSON.stringify({ newPassword }),
  });
  if (!res.isSuccess) throw new Error(res.message);
  return res.message;
}

// ── Kích hoạt / Khóa tài khoản ───────────────────────────────
export async function updateStatus(
  userId: string,
  isActive: boolean
): Promise<string> {
  const res = await api<number>(`${BASE}/User/${userId}/status`, {
    method: "PUT",
    body:   JSON.stringify({ isActive }),
  });
  if (!res.isSuccess) throw new Error(res.message);
  return res.message;
}