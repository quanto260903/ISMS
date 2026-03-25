// ============================================================
//  features/export/export.api.ts
// ============================================================

import type {
  GoodsSearchResult,
  ExportListResult,
  ExportVoucher,
  FifoPreviewItem,
} from "./types/export.types";

const BASE = process.env.NEXT_PUBLIC_API_URL;

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
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.message ?? json?.title ?? `HTTP ${res.status}`);
  return (json?.data ?? json) as T;
}

// ── Tìm kiếm hàng hóa ────────────────────────────────────────
export async function searchGoods(keyword: string, limit = 10): Promise<GoodsSearchResult[]> {
  const q = new URLSearchParams({ keyword, limit: String(limit) });
  const json = await apiFetch<GoodsSearchResult[] | { data: GoodsSearchResult[] }>(
    `${BASE}/Items/search?${q}`
  );
  return Array.isArray(json) ? json : (json as any).data ?? [];
}

// ── Chi tiết 1 phiếu xuất ────────────────────────────────────
export async function getExport(voucherId: string): Promise<ExportVoucher> {
  return apiFetch<ExportVoucher>(`${BASE}/Export/${encodeURIComponent(voucherId)}`);
}

// ── Tạo mới phiếu xuất ───────────────────────────────────────
export async function createExport(payload: Record<string, unknown>): Promise<{
  isSuccess: boolean;
  message:   string;
}> {
  const res = await fetch(`${BASE}/Export/add-export`, {
    method:  "POST",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body:    JSON.stringify(payload),
    cache:   "no-store",
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.message ?? `HTTP ${res.status}`);
  return json as { isSuccess: boolean; message: string };
}

// ── Cập nhật phiếu xuất ──────────────────────────────────────
export async function updateExport(
  voucherId: string,
  payload:   Record<string, unknown>
): Promise<{ isSuccess: boolean; message: string }> {
  const res = await fetch(`${BASE}/Export/${encodeURIComponent(voucherId)}`, {
    method:  "PUT",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body:    JSON.stringify(payload),
    cache:   "no-store",
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.message ?? `HTTP ${res.status}`);
  return json as { isSuccess: boolean; message: string };
}

// ── Preview FIFO trước khi lưu ───────────────────────────────
// Gọi endpoint GET /Export/fifo-preview?goodsId=X&quantity=Y
// Backend trả về danh sách phân bổ: [{inboundVoucherCode, allocatedQty, warehouseId}]
export async function getFifoPreview(
  items: { goodsId: string; goodsName: string; quantity: number }[]
): Promise<FifoPreviewResult[]> {
  const results: FifoPreviewResult[] = [];

  // Gọi song song cho tất cả items có goodsId hợp lệ
  await Promise.all(
    items
      .filter((i) => i.goodsId.trim() && i.quantity > 0)
      .map(async (item) => {
        const q = new URLSearchParams({
          goodsId:  item.goodsId,
          quantity: String(item.quantity),
        });
        try {
          const allocations = await apiFetch<FifoPreviewItem[]>(
            `${BASE}/Export/fifo-preview?${q}`
          );
          results.push({
            goodsId:     item.goodsId,
            goodsName:   item.goodsName,
            totalQty:    item.quantity,
            allocations: allocations ?? [],
            // Nếu allocations rỗng = không tìm được phiếu nhập cụ thể (FIFO fallback)
            isFallback:  !allocations || allocations.length === 0,
          });
        } catch {
          results.push({
            goodsId:    item.goodsId,
            goodsName:  item.goodsName,
            totalQty:   item.quantity,
            allocations: [],
            isFallback:  true,
          });
        }
      })
  );

  return results;
}

export interface FifoPreviewResult {
  goodsId:     string;
  goodsName:   string;
  totalQty:    number;
  allocations: FifoPreviewItem[];
  isFallback:  boolean; // true = không tìm được phiếu nhập, sẽ lưu offsetVoucher=null
}

// ── Danh sách phiếu xuất ─────────────────────────────────────
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
  return apiFetch<ExportListResult>(`${BASE}/Export/list?${q}`);
}

// ── Tái sử dụng warehouse report để lấy phiếu nhập còn hàng ────
// Dùng lại endpoint /Items/warehouse-report/{goodsId} đã có sẵn
// WarehouseTransactionDto: { offsetVoucher, warehouseId, warehouseName,
//   voucherDate, warehouseIn, warehouseOut, customInHand, cost }
export interface WarehouseTransactionItem {
  offsetVoucher: string | null;   // mã phiếu nhập — dùng làm inboundVoucherCode
  warehouseId:   string | null;
  warehouseName: string | null;
  voucherDate:   string | null;
  warehouseIn:   number;
  warehouseOut:  number;
  customInHand:  number;          // tồn còn lại = dùng làm remainingQty
  cost:          number;          // tổng Amount1 phiếu nhập (bao gồm VAT)
  unitPrice:     number;          // đơn giá nhập tại thời điểm nhập kho
}

export async function getWarehouseReport(
  goodsId: string,
  asOfDate?: string        // yyyy-MM-dd — chỉ tính xuất kho có ngày <= asOfDate
): Promise<WarehouseTransactionItem[]> {
  const q = asOfDate ? `?asOfDate=${encodeURIComponent(asOfDate)}` : "";
  const res = await fetch(
    `${BASE}/Items/warehouse-report/${encodeURIComponent(goodsId)}${q}`,
    { headers: { ...authHeader() }, cache: "no-store" }
  );
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.message ?? `HTTP ${res.status}`);
  return Array.isArray(json) ? json : json?.data ?? [];
}

// ── Danh sách kho ────────────────────────────────────────────
export async function getWarehouses(): Promise<{ warehouseId: string; warehouseName: string }[]> {
  const json = await apiFetch<any>(`${BASE}/Warehouse/list`);
  return Array.isArray(json) ? json : json.data ?? [];
}