// ============================================================
//  features/inward/constants/import.constants.ts
// ============================================================

import type { InwardItem, InwardReason } from "../types/import.types";

// Thành tiền = SL × Đơn giá × (1 - %KM/100)
export const calcAmount = (item: InwardItem): number => {
  const discount = item.promotion ? item.promotion / 100 : 0;
  return item.quantity * item.unitPrice * (1 - discount);
};

// Tài khoản Có mặc định — luôn là tiền mặt (111)
export const DEFAULT_CREDIT_ACCOUNT = "111";

// VoucherCode theo lý do nhập kho
export const getVoucherCodeByReason = (reason: InwardReason): string => {
  switch (reason) {
    case "SALES_RETURN": return "NK2";
    default:             return "NK1";  // PURCHASE
  }
};

export const INWARD_REASON_LABELS: Record<InwardReason, string> = {
  PURCHASE:     "Nhập kho mua hàng",
  SALES_RETURN: "Nhập kho hàng bán trả lại",
};

export const INWARD_TABLE_COLUMNS = [
  { label: "#",          w: 32  },
  { label: "Mã hàng",    w: 110 },
  { label: "Tên hàng",   w: 160 },
  { label: "ĐV",         w: 50  },
  { label: "SL",         w: 70  },
  { label: "Đơn giá",    w: 110 },
  { label: "Khuyến mãi", w: 90  },
  { label: "Thành tiền", w: 120 },
  { label: "",           w: 52  },
] as const;