// ============================================================
//  features/inward/inward.api.ts
//  Tầng API — chỉ nơi này gọi fetch/axios
// ============================================================

import type { GoodsSearchResult } from "./types/import.types";

const BASE = process.env.NEXT_PUBLIC_API_URL;

// Tìm kiếm hàng hóa (dùng chung endpoint với sale)
export async function searchGoods(keyword: string, limit = 10): Promise<GoodsSearchResult[]> {
  const res = await fetch(
    `${BASE}/Items/search?keyword=${encodeURIComponent(keyword)}&limit=${limit}`,
    { cache: "no-store" }
  );
  if (!res.ok) throw new Error("Lỗi tìm kiếm hàng hóa");
  const json = await res.json();
  return Array.isArray(json) ? json : json.data ?? [];
}

// Tạo phiếu nhập kho
export async function createInward(payload: Record<string, unknown>) {
  const res = await fetch(`${BASE}/Import/add-inward`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(payload),
    cache:   "no-store",
  });
  const json = await res.json();
  return json as { isSuccess: boolean; message: string };
}

// Danh sách kho (để chọn kho nhập)
export async function getWarehouses(): Promise<{ warehouseId: string; warehouseName: string }[]> {
  const res = await fetch(`${BASE}/Warehouse/list`, { cache: "no-store" });
  if (!res.ok) throw new Error("Lỗi tải danh sách kho");
  const json = await res.json();
  return Array.isArray(json) ? json : json.data ?? [];
}