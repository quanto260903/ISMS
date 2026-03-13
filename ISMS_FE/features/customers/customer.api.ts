// ============================================================
//  features/customers/customer.api.ts
// ============================================================

import type {
  CustomerListResult, CustomerDetailDto,
  CustomerSearchResult, CreateCustomerRequest, UpdateCustomerRequest,
} from "./types/customer.types";

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

export async function getCustomerList(params: {
  keyword?:      string;
  isInactive?:   boolean;
  isEnterprise?: boolean;
  page?:         number;
  pageSize?:     number;
}): Promise<CustomerListResult> {
  const q = new URLSearchParams();
  if (params.keyword      !== undefined) q.set("keyword",      params.keyword);
  if (params.isInactive   !== undefined) q.set("isInactive",   String(params.isInactive));
  if (params.isEnterprise !== undefined) q.set("isEnterprise", String(params.isEnterprise));
  q.set("page",     String(params.page     ?? 1));
  q.set("pageSize", String(params.pageSize ?? 50));
  const res = await api<CustomerListResult>(`${BASE}/Customer/list?${q}`);
  if (!res.isSuccess || !res.data) throw new Error(res.message);
  return res.data;
}

export async function searchCustomers(keyword: string, limit = 10): Promise<CustomerSearchResult[]> {
  const q = new URLSearchParams({ keyword, limit: String(limit) });
  const res = await api<CustomerSearchResult[]>(`${BASE}/Customer/search?${q}`);
  if (!res.isSuccess || !res.data) throw new Error(res.message);
  return res.data;
}

export async function getCustomerById(id: string): Promise<CustomerDetailDto> {
  const res = await api<CustomerDetailDto>(`${BASE}/Customer/${id}`);
  if (!res.isSuccess || !res.data) throw new Error(res.message);
  return res.data;
}

export async function createCustomer(payload: CreateCustomerRequest): Promise<CustomerDetailDto> {
  const res = await api<CustomerDetailDto>(`${BASE}/Customer/create`, {
    method: "POST", body: JSON.stringify(payload),
  });
  if (!res.isSuccess || !res.data) throw new Error(res.message);
  return res.data;
}

export async function updateCustomer(id: string, payload: UpdateCustomerRequest): Promise<CustomerDetailDto> {
  const res = await api<CustomerDetailDto>(`${BASE}/Customer/${id}`, {
    method: "PUT", body: JSON.stringify(payload),
  });
  if (!res.isSuccess || !res.data) throw new Error(res.message);
  return res.data;
}

export async function updateCustomerStatus(id: string, isInactive: boolean): Promise<string> {
  const res = await api<number>(`${BASE}/Customer/${id}/status`, {
    method: "PUT", body: JSON.stringify({ isInactive }),
  });
  if (!res.isSuccess) throw new Error(res.message);
  return res.message;
}

export async function deleteCustomer(id: string): Promise<string> {
  const res = await api<number>(`${BASE}/Customer/${id}`, { method: "DELETE" });
  if (!res.isSuccess) throw new Error(res.message);
  return res.message;
}