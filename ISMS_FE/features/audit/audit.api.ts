// ============================================================
//  features/audit/audit.api.ts
// ============================================================

import type {
  AuditGoodsSearchResult,
  AuditListResult,
} from "./types/audit.types";

const BASE = process.env.NEXT_PUBLIC_API_URL;

// ── Tìm kiếm hàng hóa ───────────────────────────────────────
export async function searchGoods(
  keyword: string,
  limit = 10
): Promise<AuditGoodsSearchResult[]> {
  if (!keyword.trim()) return [];
  const res = await fetch(
    `${BASE}/Items/search?keyword=${encodeURIComponent(keyword)}&limit=${limit}`,
    { cache: "no-store" }
  );
  if (!res.ok) throw new Error("Lỗi tìm kiếm hàng hóa");
  const json = await res.json();
  return Array.isArray(json) ? json : (json.data ?? []);
}

// ── Danh sách kho ────────────────────────────────────────────
export async function getWarehouses(): Promise<
  { warehouseId: string; warehouseName: string }[]
> {
  const res = await fetch(`${BASE}/Warehouse/list`, { cache: "no-store" });
  if (!res.ok) throw new Error("Lỗi tải danh sách kho");
  const json = await res.json();
  return Array.isArray(json) ? json : (json.data ?? []);
}

// ── Danh sách phiếu kiểm kê ─────────────────────────────────
export async function getAuditList(params: {
  fromDate?:    string;
  toDate?:      string;
  keyword?:     string;
  warehouseId?: string;
  page?:        number;
  pageSize?:    number;
}): Promise<AuditListResult> {
  const query = new URLSearchParams();
  if (params.fromDate)    query.set("fromDate",    params.fromDate);
  if (params.toDate)      query.set("toDate",      params.toDate);
  if (params.keyword)     query.set("keyword",     params.keyword);
  if (params.warehouseId) query.set("warehouseId", params.warehouseId);
  query.set("page",     String(params.page     ?? 1));
  query.set("pageSize", String(params.pageSize ?? 50));

  const res  = await fetch(`${BASE}/Audit/list?${query}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Lỗi tải danh sách phiếu kiểm kê");
  const json = await res.json();
  const data = json.data ?? json;
  return {
    items:    data.items    ?? [],
    total:    data.total    ?? 0,
    page:     data.page     ?? 1,
    pageSize: data.pageSize ?? 50,
  };
}

// ── Tạo mới phiếu kiểm kê ────────────────────────────────────
export async function createAuditVoucher(
  payload: Record<string, unknown>
): Promise<{ isSuccess: boolean; message: string }> {
  const res = await fetch(`${BASE}/Audit/create`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(payload),
    cache:   "no-store",
  });
  const json = await res.json();
  return json;
}