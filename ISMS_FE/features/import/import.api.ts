// ============================================================
//  features/inward/inward.api.ts
//  Tầng API — chỉ nơi này gọi fetch/axios
// ============================================================

import type { GoodsSearchResult, SaleVoucherLookup, InwardListItem, InwardListResult, InwardVoucher } from "./types/import.types";

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

// Tra cứu phiếu bán hàng theo số hóa đơn (dùng khi nhập lại hàng bán bị trả)
export async function getSaleVoucher(voucherId: string): Promise<SaleVoucherLookup | null> {
  const res = await fetch(
    `${BASE}/SaleGoods/voucher/${encodeURIComponent(voucherId)}`,
    { cache: "no-store" }
  );
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Lỗi tra cứu phiếu bán: ${res.status}`);
  const json = await res.json();
  return (json.data ?? json) as SaleVoucherLookup;
}
// Cập nhật phiếu nhập kho
export async function updateInward(voucherId: string, payload: Record<string, unknown>) {
  const res = await fetch(
    `${BASE}/Import/${encodeURIComponent(voucherId)}`,
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
// Lấy chi tiết 1 phiếu nhập kho theo ID
export async function getInward(voucherId: string): Promise<InwardVoucher> {
  const res = await fetch(
    `${BASE}/Import/${encodeURIComponent(voucherId)}`,
    { cache: "no-store" }
  );
  if (!res.ok) throw new Error(`Không tìm thấy phiếu nhập: ${voucherId}`);
  const json = await res.json();
  return (json.data ?? json) as InwardVoucher;
}
export async function getNextImportId(): Promise<string> {
  const res = await fetch(`${BASE}/Import/next-id`, { cache: "no-store" });
  if (!res.ok) throw new Error("Lỗi lấy mã phiếu nhập");
  const json = await res.json();
  return json.voucherId as string;
}

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

export async function deleteInward(voucherId: string): Promise<{ isSuccess: boolean; message: string }> {
  const res = await fetch(
    `${BASE}/Import/${encodeURIComponent(voucherId)}`,
    { method: "DELETE", cache: "no-store" }
  );
  const json = await res.json();
  return json as { isSuccess: boolean; message: string };
}

export async function getInwardList(params: {
  fromDate?: string;
  toDate?: string;
  keyword?: string;
  voucherCode?: string;
  page?: number;
  pageSize?: number;
}): Promise<InwardListResult> {
  const q = new URLSearchParams();
  if (params.fromDate)    q.set("fromDate",    params.fromDate);
  if (params.toDate)      q.set("toDate",      params.toDate);
  if (params.keyword)     q.set("keyword",     params.keyword);
  if (params.voucherCode) q.set("voucherCode", params.voucherCode);
  q.set("page",     String(params.page     ?? 1));
  q.set("pageSize", String(params.pageSize ?? 50));

  const res = await fetch(`${BASE}/Import/list?${q}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Lỗi tải danh sách phiếu nhập");
  const json = await res.json();
  return (json.data ?? json) as InwardListResult;
}