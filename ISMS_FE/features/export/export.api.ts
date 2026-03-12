// ============================================================
//  features/export/export.api.ts
// ============================================================

import type {
  GoodsSearchResult,
  ExportListResult,
  ExportVoucher,
} from "./types/export.types";

const BASE = process.env.NEXT_PUBLIC_API_URL;

// Tìm kiếm hàng hóa (dùng chung endpoint)
export async function searchGoods(keyword: string, limit = 10): Promise<GoodsSearchResult[]> {
  const res = await fetch(
    `${BASE}/Items/search?keyword=${encodeURIComponent(keyword)}&limit=${limit}`,
    { cache: "no-store" }
  );
  if (!res.ok) throw new Error("Lỗi tìm kiếm hàng hóa");
  const json = await res.json();
  return Array.isArray(json) ? json : json.data ?? [];
}

// Lấy chi tiết 1 phiếu xuất kho theo ID
export async function getExport(voucherId: string): Promise<ExportVoucher> {
  const res = await fetch(
    `${BASE}/api/Export/${encodeURIComponent(voucherId)}`,
    { cache: "no-store" }
  );
  if (!res.ok) throw new Error(`Không tìm thấy phiếu xuất: ${voucherId}`);
  const json = await res.json();
  return (json.data ?? json) as ExportVoucher;
}

// Tạo mới phiếu xuất kho
export async function createExport(payload: Record<string, unknown>) {
  const res = await fetch(`${BASE}/Export/add-export`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(payload),
    cache:   "no-store",
  });
  const json = await res.json();
  return json as { isSuccess: boolean; message: string };
}

// Cập nhật phiếu xuất kho
export async function updateExport(voucherId: string, payload: Record<string, unknown>) {
  const res = await fetch(
    `${BASE}/Export/${encodeURIComponent(voucherId)}`,
    {
      method:  "PUT",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(payload),
      cache:   "no-store",
    }
  );
  const json = await res.json();
  return json as { isSuccess: boolean; message: string };
}

// Danh sách phiếu xuất kho
export async function getExportList(params: {
  fromDate?:    string;
  toDate?:      string;
  keyword?:     string;
  voucherCode?: string;
  page?:        number;
  pageSize?:    number;
}): Promise<ExportListResult> {
  const q = new URLSearchParams();
  if (params.fromDate)    q.set("fromDate",    params.fromDate);
  if (params.toDate)      q.set("toDate",      params.toDate);
  if (params.keyword)     q.set("keyword",     params.keyword);
  if (params.voucherCode) q.set("voucherCode", params.voucherCode);
  q.set("page",     String(params.page     ?? 1));
  q.set("pageSize", String(params.pageSize ?? 50));

  const res = await fetch(`${BASE}/Export/list?${q}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Lỗi tải danh sách phiếu xuất");
  const json = await res.json();
  return (json.data ?? json) as ExportListResult;
}

// Danh sách kho
export async function getWarehouses(): Promise<{ warehouseId: string; warehouseName: string }[]> {
  const res = await fetch(`${BASE}/Warehouse/list`, { cache: "no-store" });
  if (!res.ok) throw new Error("Lỗi tải danh sách kho");
  const json = await res.json();
  return Array.isArray(json) ? json : json.data ?? [];
}