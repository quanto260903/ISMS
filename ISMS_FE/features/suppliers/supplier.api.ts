// ============================================================
//  features/suppliers/supplier.api.ts
// ============================================================

import type {
  SupplierListResult, SupplierDetailDto,
  CreateSupplierRequest, UpdateSupplierRequest,
} from "./types/supplier.types";

const BASE = process.env.NEXT_PUBLIC_API_URL;

function authHeader(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function api<T>(url: string, options?: RequestInit) {
  const res = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...authHeader(), ...(options?.headers ?? {}) },
    cache: "no-store",
  });
  return res.json() as Promise<{ isSuccess: boolean; data?: T; message: string; statusCode: number }>;
}

export async function getSupplierList(params: {
  keyword?:      string;
  isInactive?:   boolean;
  isEnterprise?: boolean;
  page?:         number;
  pageSize?:     number;
}): Promise<SupplierListResult> {
  const q = new URLSearchParams();
  if (params.keyword      !== undefined) q.set("keyword",      params.keyword);
  if (params.isInactive   !== undefined) q.set("isInactive",   String(params.isInactive));
  if (params.isEnterprise !== undefined) q.set("isEnterprise", String(params.isEnterprise));
  q.set("page",     String(params.page     ?? 1));
  q.set("pageSize", String(params.pageSize ?? 50));
  const res = await api<SupplierListResult>(`${BASE}/Supplier/list?${q}`);
  if (!res.isSuccess || !res.data) throw new Error(res.message);
  return res.data;
}

export async function getSupplierById(id: string): Promise<SupplierDetailDto> {
  const res = await api<SupplierDetailDto>(`${BASE}/Supplier/${id}`);
  if (!res.isSuccess || !res.data) throw new Error(res.message);
  return res.data;
}

export async function createSupplier(payload: CreateSupplierRequest): Promise<SupplierDetailDto> {
  const res = await api<SupplierDetailDto>(`${BASE}/Supplier/create`, {
    method: "POST", body: JSON.stringify(payload),
  });
  if (!res.isSuccess || !res.data) throw new Error(res.message);
  return res.data;
}

export async function updateSupplier(id: string, payload: UpdateSupplierRequest): Promise<SupplierDetailDto> {
  const res = await api<SupplierDetailDto>(`${BASE}/Supplier/${id}`, {
    method: "PUT", body: JSON.stringify(payload),
  });
  if (!res.isSuccess || !res.data) throw new Error(res.message);
  return res.data;
}

export async function updateSupplierStatus(id: string, isInactive: boolean): Promise<string> {
  const res = await api<number>(`${BASE}/Supplier/${id}/status`, {
    method: "PUT", body: JSON.stringify({ isInactive }),
  });
  if (!res.isSuccess) throw new Error(res.message);
  return res.message;
}

export async function deleteSupplier(id: string): Promise<string> {
  const res = await api<number>(`${BASE}/Supplier/${id}`, { method: "DELETE" });
  if (!res.isSuccess) throw new Error(res.message);
  return res.message;
}