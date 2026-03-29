// features/stock-take/stockTake.api.ts

import type {
  StockTakeListDto, StockTakeFullDto,
  GoodsDto, CreateStockTakeRequest, UpdateStockTakeHeaderRequest,
  ProcessStockTakeResultDto,
  BackendVoucherDetailRaw, BackendListRaw,
} from "./types/stockTake.types";
import { getGoodsList } from "../goods/goods.api";
import type { GoodsListResult, GoodsListDto } from "../goods/types/goods.types";

const BASE     = process.env.NEXT_PUBLIC_API_URL;
const ENDPOINT = `${BASE}/stock-take-vouchers`;

function authHeader(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...authHeader(), ...(options?.headers ?? {}) },
    cache: "no-store",
  });
  if (res.status === 204) return undefined as unknown as T;
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error(body?.message ?? body?.title ?? `HTTP ${res.status}`);
  return body as T;
}

// ── Mappers ───────────────────────────────────────────────────
function mapDetail(raw: BackendVoucherDetailRaw): StockTakeFullDto {
  return {
    stockTakeVoucherId: raw.stockTakeVoucherId,
    voucherCode:        raw.voucherCode,
    voucherDate:        raw.voucherDate,
    stockTakeDate:      raw.stockTakeDate,
    purpose:            raw.purpose,
    member1:  raw.member1,  position1: raw.position1,
    member2:  raw.member2,  position2: raw.position2,
    member3:  raw.member3,  position3: raw.position3,
    isCompleted: raw.isCompleted,
    createdBy:   raw.createdBy,
    createdDate: raw.createdDate,
    lines: (raw.stockTakeDetails ?? []).map((d) => ({
      stockTakeDetailId:  d.stockTakeDetailId,
      goodsId:            d.goodsId,
      goodsName:          d.goodsName,
      unit:               d.unit,
      bookQuantity:       d.bookQuantity,
      actualQuantity:     d.actualQuantity,
      differenceQuantity: d.differenceQuantity,
    })),
  };
}

function mapListItem(raw: BackendListRaw): StockTakeListDto {
  return {
    stockTakeVoucherId: raw.stockTakeVoucherId,
    voucherCode:        raw.voucherCode,
    voucherDate:        raw.voucherDate,
    stockTakeDate:      raw.stockTakeDate,
    purpose:            raw.purpose,
    isCompleted:        raw.isCompleted ?? false,
    createdBy:          raw.createdBy,
    createdDate:        raw.createdDate,
  };
}

// ═══════════════════════════════════════════════════════════════
// API CALLS
// ═══════════════════════════════════════════════════════════════

export async function getAllGoods(): Promise<GoodsDto[]> {
  const result: GoodsListResult = await getGoodsList({ page: 1, pageSize: 9999, isInactive: false });
  return (result.items ?? []).map((g: GoodsListDto) => ({
    goodsId:       g.goodsId,
    goodsName:     g.goodsName,
    unit:          g.unit ?? null,
    stockQuantity: g.itemOnHand ?? 0,
  }));
}

// Xem trước mã phiếu KK sẽ được sinh (không tạo phiếu)
export async function previewNextVoucherCode(): Promise<string> {
  const res = await apiFetch<{ voucherId: string }>(`${ENDPOINT}/preview-code`);
  return res.voucherId;
}

// Lấy danh sách hàng hóa với tồn kho tính đến ngày asOfDate
// Công thức backend: OpenInventory + Σ nhập (Debit 156) - Σ xuất (Credit 156) đến ngày đó
export async function getGoodsAsOfDate(asOfDate: string): Promise<GoodsDto[]> {
  const raw = await apiFetch<{ goodsId: string; goodsName: string; unit: string | null; stockQuantity: number }[]>(
    `${ENDPOINT}/goods-stock?asOfDate=${asOfDate}`
  );
  return (raw ?? []).map(g => ({
    goodsId:       g.goodsId,
    goodsName:     g.goodsName,
    unit:          g.unit ?? null,
    stockQuantity: g.stockQuantity,
  }));
}

export async function getStockTakeList(): Promise<StockTakeListDto[]> {
  const res  = await fetch(ENDPOINT, {
    headers: { "Content-Type": "application/json", ...authHeader() },
    cache: "no-store",
  });
  const body = await res.json().catch(() => ({ isSuccess: false, data: null, message: "Parse error" }));

  let rawList: BackendListRaw[];
  if (Array.isArray(body)) {
    rawList = body;
  } else if (body?.isSuccess && Array.isArray(body?.data)) {
    rawList = body.data;
  } else {
    throw new Error(body?.message ?? `HTTP ${res.status}`);
  }

  return rawList.map(mapListItem);
}

export async function getStockTakeById(id: string): Promise<StockTakeFullDto> {
  const raw = await apiFetch<BackendVoucherDetailRaw>(`${ENDPOINT}/${id}`);
  return mapDetail(raw);
}

export async function createStockTake(req: CreateStockTakeRequest): Promise<StockTakeFullDto> {
  const raw = await apiFetch<BackendVoucherDetailRaw>(ENDPOINT, {
    method: "POST", body: JSON.stringify(req),
  });
  return mapDetail(raw);
}

export async function updateStockTake(id: string, req: UpdateStockTakeHeaderRequest): Promise<StockTakeFullDto> {
  const raw = await apiFetch<BackendVoucherDetailRaw>(`${ENDPOINT}/${id}`, {
    method: "PUT", body: JSON.stringify(req),
  });
  return mapDetail(raw);
}

// Lỗi 6 đã sửa: chỉ trả về ProcessStockTakeResultDto từ API process
// Không gọi thêm getStockTakeById — component sẽ tự gọi fetchVoucher() sau khi process xong
// Tránh 1 request thừa và tách rõ trách nhiệm: API layer chỉ gọi đúng 1 endpoint
export async function processStockTake(id: string): Promise<ProcessStockTakeResultDto> {
  const res = await fetch(`${ENDPOINT}/${id}/process`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader() },
    cache: "no-store",
  });

  const body = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(body?.message ?? body?.title ?? `HTTP ${res.status}: Xử lý thất bại`);
  }
  if (body && body.success === false) {
    throw new Error(body.message ?? "Xử lý thất bại");
  }

  return {
    success:           body?.success          ?? true,
    message:           body?.message          ?? "Xử lý thành công",
    importVoucherId:   body?.importVoucherId   ?? null,
    importVoucherCode: body?.importVoucherCode ?? null,
    exportVoucherId:   body?.exportVoucherId   ?? null,
    exportVoucherCode: body?.exportVoucherCode ?? null,
  };
}

export async function deleteStockTake(id: string): Promise<void> {
  await apiFetch<void>(`${ENDPOINT}/${id}`, { method: "DELETE" });
}