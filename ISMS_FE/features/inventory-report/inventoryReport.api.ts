// features/inventory-report/inventoryReport.api.ts

import type {
  InventorySummaryDto,
  GetInventorySummaryRequest,
} from "./types/inventoryReport.types";

const BASE     = process.env.NEXT_PUBLIC_API_URL;
const ENDPOINT = `${BASE}/InventoryReport`;

function authHeader(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...authHeader(),
      ...(options?.headers ?? {}),
    },
    cache: "no-store",
  });

  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error(body?.message ?? body?.title ?? `HTTP ${res.status}`);

  // Unwrap ResultModel<T>
  if (body && "isSuccess" in body) {
    if (!body.isSuccess) throw new Error(body.message ?? "Lỗi không xác định");
    return body.data as T;
  }
  return body as T;
}

export async function getInventorySummary(
  req: GetInventorySummaryRequest
): Promise<InventorySummaryDto> {
  const params = new URLSearchParams({
    fromDate: req.fromDate,
    toDate:   req.toDate,
  });
  if (req.keyword) params.set("keyword", req.keyword);
  return apiFetch<InventorySummaryDto>(`${ENDPOINT}/summary?${params.toString()}`);
}
