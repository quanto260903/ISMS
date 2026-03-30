// ============================================================
//  features/export/constants/export.constants.ts
// ============================================================

import type { ExportItem, ExportReason, ExportVoucherCode } from "../types/export.types";

// ── VoucherCode theo lý do xuất (chỉ 2 lý do thủ công) ───────
export const getVoucherCodeByReason = (reason: ExportReason): string => {
  switch (reason) {
    case "IMPORT_RETURN": return "XK1";
    case "DESTROY":       return "XK2";
  }
};

// ── Detect ExportReason từ voucherCode khi load phiếu edit ───
// XK3/XK4 không thể edit thủ công nên fallback về IMPORT_RETURN
export const detectReasonFromCode = (code?: string): ExportReason => {
  if (code === "XK1") return "IMPORT_RETURN";
  if (code === "XK2") return "DESTROY";
  return "IMPORT_RETURN";
};

// ── TK Nợ theo lý do xuất ────────────────────────────────────
export const getDebitAccountByReason = (reason: ExportReason): string => {
  switch (reason) {
    case "IMPORT_RETURN": return "331";  // Phải trả nhà cung cấp
    case "DESTROY":       return "632";  // Chi phí hủy hàng
  }
};


// ── Tính thành tiền xuất kho ──────────────────────────────────
// Ưu tiên costPerUnit (giá vốn FIFO từ phiếu nhập)
// Fallback về unitPrice nếu chưa chọn phiếu nhập
export const calcAmount = (item: ExportItem): number =>
  item.costPerUnit > 0
    ? item.quantity * item.costPerUnit
    : item.quantity * item.unitPrice;

// ── Labels cho form (chỉ 2 lý do thủ công) ───────────────────
export const EXPORT_REASON_LABELS: Record<ExportReason, string> = {
  IMPORT_RETURN: "Xuất trả hàng nhập",
  DESTROY:       "Xuất hủy hàng",
};

// ── Labels cho danh sách (đầy đủ 4 loại XK1-XK4) ─────────────
export const EXPORT_VOUCHER_CODE_LABELS: Record<ExportVoucherCode, string> = {
  XK1: "Xuất trả hàng nhập",
  XK2: "Xuất hủy hàng",
  XK3: "Xuất kiểm kê",
  XK4: "Xuất bán hàng",
};

// ── Màu badge cho danh sách (đầy đủ 4 loại + DEFAULT fallback) ─
export const EXPORT_VOUCHER_CODE_COLORS: Record<
  ExportVoucherCode | "DEFAULT",
  { bg: string; color: string; border: string }
> = {
  XK1:     { bg: "#fff1f2", color: "#b91c1c", border: "#fca5a5" },  // đỏ — trả hàng
  XK2:     { bg: "#fefce8", color: "#854d0e", border: "#fde68a" },  // vàng — hủy
  XK3:     { bg: "#f0f9ff", color: "#0369a1", border: "#bae6fd" },  // xanh dương — kiểm kê
  XK4:     { bg: "#f0fdf4", color: "#15803d", border: "#86efac" },  // xanh lá — bán hàng
  DEFAULT: { bg: "#f8fafc", color: "#475569", border: "#cbd5e1" },  // xám — fallback
};

// ── Cột bảng chi tiết hàng xuất ──────────────────────────────
export const EXPORT_TABLE_COLUMNS = [
  { label: "#",          w: 32  },
  { label: "Mã hàng",    w: 110 },
  { label: "Tên hàng",   w: 160 },
  { label: "ĐV",         w: 50  },
  { label: "SL",         w: 60  },
  { label: "Đơn giá",    w: 100 },
  { label: "Thành tiền", w: 105 },
  { label: "CT đối trừ", w: 120 },
  { label: "",           w: 80  },  // Actions: Xóa
] as const;