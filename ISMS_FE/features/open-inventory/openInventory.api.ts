// features/open-inventory/openInventory.api.ts

import type {
  OpenInventoryListResult, OpenInventoryRowDto,
  OpenInventorySummaryDto, UpsertOpenInventoryRequest,
} from "./types/openInventory.types";

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

export async function getOpenInventoryList(params: {
  keyword?:  string;
  page?:     number;
  pageSize?: number;
}): Promise<OpenInventoryListResult> {
  const q = new URLSearchParams();
  if (params.keyword) q.set("keyword", params.keyword);
  q.set("page",     String(params.page     ?? 1));
  q.set("pageSize", String(params.pageSize ?? 50));
  const res = await api<OpenInventoryListResult>(`${BASE}/OpenInventory/list?${q}`);
  if (!res.isSuccess || !res.data) throw new Error(res.message);
  return res.data;
}

export async function getOpenInventorySummary(): Promise<OpenInventorySummaryDto> {
  const res = await api<OpenInventorySummaryDto>(`${BASE}/OpenInventory/summary`);
  if (!res.isSuccess || !res.data) throw new Error(res.message);
  return res.data;
}

export async function upsertOpenInventory(
  payload: UpsertOpenInventoryRequest
): Promise<OpenInventoryRowDto> {
  const res = await api<OpenInventoryRowDto>(`${BASE}/OpenInventory/upsert`, {
    method: "PUT", body: JSON.stringify(payload),
  });
  if (!res.isSuccess || !res.data) throw new Error(res.message);
  return res.data;
}

export async function deleteOpenInventoryRow(goodsId: string): Promise<string> {
  const res = await api<number>(`${BASE}/OpenInventory/${goodsId}`, { method: "DELETE" });
  if (!res.isSuccess) throw new Error(res.message);
  return res.message;
}