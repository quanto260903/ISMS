// ============================================================
//  features/inward/constants/inward.constants.ts
// ============================================================

import type { PaymentOption, InwardItem } from "../types/import.types";

export const VAT_OPTIONS = [0, 5, 7, 10] as const;

export const getVoucherCodeByPayment = (payment: PaymentOption): string => {
  switch (payment) {
    case "CASH":   return "NK1";
    case "BANK":   return "NK2";
    case "UNPAID": return "NK3";
  }
};

// Tài khoản Có theo hình thức thanh toán
export const getCreditAccountByPayment = (payment: PaymentOption): string => {
  switch (payment) {
    case "CASH":   return "111";
    case "BANK":   return "112";
    case "UNPAID": return "331";
  }
};

export const generateVoucherNumber = (): string =>
  "NK" + Date.now().toString().slice(-6);

// Thành tiền = SL × Đơn giá
export const calcAmount = (item: InwardItem): number =>
  item.quantity * item.unitPrice;

export const PAYMENT_LABELS: Record<PaymentOption, string> = {
  CASH:   "Tiền mặt",
  BANK:   "Ngân hàng",
  UNPAID: "Chưa thanh toán",
};

// Cột bảng — khớp đúng các field backend có
export const INWARD_TABLE_COLUMNS = [
  { label: "#",          w: 32  },
  { label: "Mã hàng",    w: 110 },
  { label: "Tên hàng",   w: 160 },
  { label: "Kho nhập",   w: 130 },
  { label: "ĐV",         w: 50  },
  { label: "SL",         w: 60  },
  { label: "Đơn giá",    w: 100 },
  { label: "Thuế VAT",   w: 72  },
  { label: "Tiền VAT",   w: 90  },
  { label: "Thành tiền", w: 105 },
  { label: "",           w: 52  },
] as const;