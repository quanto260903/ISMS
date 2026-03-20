// ============================================================
//  features/export/constants/export.constants.ts
// ============================================================

import type { ExportItem, ExportReason } from "../types/export.types";

export const VAT_OPTIONS = [0, 5, 8, 10] as const;

// XH1 = Hàng nhập bị trả lại, XH2 = Xuất khác
export const getVoucherCodeByReason = (reason: ExportReason): string => {
  switch (reason) {
    case "IMPORT_RETURN": return "XH1";
    case "OTHER":         return "XH2";
  }
};

// TK Nợ theo lý do xuất
export const getDebitAccountByReason = (reason: ExportReason): string => {
  switch (reason) {
    case "IMPORT_RETURN": return "331";  // Phải trả nhà cung cấp
    case "OTHER":         return "632";  // Giá vốn hàng bán
  }
};

export const generateVoucherNumber = (): string =>
  "XH" + Date.now().toString().slice(-6);

// Amount1 xuất kho = costPerUnit × qty (giá vốn bình quân theo phiếu nhập)
// Fallback về unitPrice × qty nếu chưa chọn phiếu nhập
export const calcAmount = (item: ExportItem): number =>
  item.costPerUnit > 0
    ? item.quantity * item.costPerUnit
    : item.quantity * item.unitPrice;

export const EXPORT_REASON_LABELS: Record<ExportReason, string> = {
  IMPORT_RETURN: "Hàng nhập bị trả lại",
  OTHER:         "Hủy hàng",
};

// Không có cột VAT — Amount2 = null cho phiếu xuất kho (chỉ dùng trong luồng bán hàng)
export const EXPORT_TABLE_COLUMNS = [
  { label: "#",           w: 32  },
  { label: "Mã hàng",     w: 110 },
  { label: "Tên hàng",    w: 160 },
  { label: "ĐV",          w: 50  },
  { label: "SL",          w: 60  },
  { label: "Đơn giá",     w: 100 },
  { label: "Thành tiền",  w: 105 },
  { label: "CT đối trừ",  w: 120 },
  { label: "",             w: 80  },  // Actions: 📦 Kho + Xóa
] as const;