// ============================================================
//  features/sale/constants/sale.constants.ts
//  Hằng số và helper thuần (không có side effect)
// ============================================================

import type { PaymentOption, VoucherItem } from "../types/sale.types";

// Các mức thuế VAT được phép chọn (%)
export const VAT_OPTIONS = [0, 5, 7, 10] as const;

// Map hình thức thanh toán → tài khoản nợ
export const getDebitAccountByPayment = (payment: PaymentOption): string => {
  switch (payment) {
    case "CASH":   return "111";
    case "BANK":   return "112";
    case "UNPAID": return "131";
  }
};

// Map hình thức thanh toán → mã loại chứng từ
export const getVoucherCodeByPayment = (payment: PaymentOption): string => {
  switch (payment) {
    case "CASH":   return "BH1";
    case "BANK":   return "BH2";
    case "UNPAID": return "BH3";
  }
};
// Sinh số chứng từ tự động
export const generateVoucherNumber = (): string =>
  "BH" + Date.now().toString().slice(-8);

/**
 * Tính thành tiền 1 dòng sản phẩm.
 * Công thức: quantity × unitPrice - promotion
 * VAT KHÔNG được cộng vào đây — tính riêng ở cột "Tiền VAT"
 */
export const calcAmount = (item: VoucherItem): number =>
  item.quantity * item.unitPrice - item.promotion;

// Label hiển thị cho từng hình thức thanh toán
export const PAYMENT_LABELS: Record<PaymentOption, string> = {
  CASH:   "Tiền mặt",
  BANK:   "Ngân hàng",
  UNPAID: "Chưa thanh toán",
};

// Cấu hình cột bảng sản phẩm
export const ITEM_TABLE_COLUMNS = [
  { label: "#",           w: 32  },
  { label: "Mã hàng",     w: 110 },
  { label: "Tên hàng",    w: 160 },
  { label: "ĐV",          w: 50  },
  { label: "SL",          w: 58  },
  { label: "Đơn giá",     w: 95  },
  { label: "Giá mua",     w: 95  },
  { label: "KM",          w: 75  },
  { label: "Thuế VAT",    w: 72  },
  { label: "Tiền VAT",    w: 85  },
  { label: "Thành tiền",  w: 95  },
  { label: "CT đối trừ",  w: 95  },
  { label: "",            w: 72  },
] as const;