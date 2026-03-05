// ============================================================
//  features/inward/types/inward.types.ts
// ============================================================

export type PaymentOption = "CASH" | "BANK" | "UNPAID";

// Kết quả tìm kiếm hàng hóa (dùng chung API với sale)
export interface GoodsSearchResult {
  goodsId: string;
  goodsName: string;
  unit: string;
  salePrice: number;
  vatrate: string;
  itemOnHand: number;
}

// 1 dòng chi tiết trong phiếu nhập kho
export interface InwardItem {
  goodsId: string;
  goodsName: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  amount1: number;
  vat: number;
  promotion: number;
  debitAccount1: string;
  creditAccount1: string;
  debitWarehouseId: string;
  debitAccount2: string;
  creditAccount2: string;
  userId: string;
  createdDateTime: string;
}

// Header phiếu nhập kho
export interface InwardVoucher {
  voucherId: string;          // Số phiếu, vd: NK000253
  voucherCode: string;        // NK1/NK2/NK3
  customerId: string;
  customerName: string;
  taxCode: string;
  address: string;
  voucherDescription: string;
  voucherDate: string;
  invoiceSymbol: string;      // Ký hiệu hóa đơn
  invoiceNumber: string;      // Số hóa đơn
  invoiceDate: string;        // Ngày hóa đơn
  bankName?: string;
  bankAccountNumber?: string;
  items: InwardItem[];
}

// Dropdown autocomplete
export interface DropdownState {
  suggestions: GoodsSearchResult[];
  loading: boolean;
  open: boolean;
}

export interface DropdownPos {
  top: number;
  left: number;
  width: number;
  index: number;
}