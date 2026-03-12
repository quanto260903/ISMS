// ============================================================
//  shared/api/supplier.api.ts
// ============================================================

import type { SupplierSearchResult, CreateSupplierRequest } from "@/shared/types/supplier.types";

const BASE = process.env.NEXT_PUBLIC_API_URL;

export async function searchSuppliers(
  keyword: string,
  limit = 10
): Promise<SupplierSearchResult[]> {
  if (!keyword.trim()) return [];
  const res = await fetch(
    `${BASE}/Supplier/search?keyword=${encodeURIComponent(keyword)}&limit=${limit}`,
    { cache: "no-store" }
  );
  if (!res.ok) throw new Error("Lỗi tìm kiếm nhà cung cấp");
  const json = await res.json();
  return (json.data ?? json) as SupplierSearchResult[];
}

export async function createSupplier(
  payload: CreateSupplierRequest
): Promise<{ isSuccess: boolean; message: string; data?: SupplierSearchResult }> {
  const res = await fetch(`${BASE}/Supplier/create`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(payload),
    cache:   "no-store",
  });
  const json = await res.json();
  return json;
}