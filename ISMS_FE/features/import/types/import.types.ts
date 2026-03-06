// ============================================================
//  features/inward/types/inward.types.ts
//  Khớp với backend ImportOrder + ImportOrderItem
// ============================================================

export type PaymentOption  = "CASH" | "BANK" | "UNPAID";
export type InwardReason   = "PURCHASE" | "SALES_RETURN" | "OTHER";

export interface GoodsSearchResult {
  goodsId: string;
  goodsName: string;
  unit: string;
  salePrice: number;
  vatrate: string;
  itemOnHand: number;
}

// Chi tiết 1 dòng từ phiếu bán hàng gốc (dùng khi tra cứu để auto-fill)
export interface SaleVoucherDetail {
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
  creditWarehouseId: string; // kho xuất bán → dùng làm kho nhập lại
}

// Kết quả tra cứu phiếu bán hàng theo số hóa đơn
export interface SaleVoucherLookup {
  voucherId: string;
  customerName: string;
  voucherDate: string;
  items: SaleVoucherDetail[];
}

// Khớp 1-1 với ImportOrderItem ở backend
export interface InwardItem {
  goodsId: string;
  goodsName: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  amount1: number;          // Thành tiền = quantity × unitPrice
  vat: number;              // % thuế VAT
  promotion: number;
  debitAccount1: string;    // Nợ TK 156
  creditAccount1: string;   // Có TK 331/111/112
  debitWarehouseId: string; // Kho nhập — bắt buộc
  debitAccount2: string;    // Nợ TK 1331
  creditAccount2: string;   // Có TK 331/111/112
  userId: string;
  createdDateTime: string;
}

// Khớp 1-1 với ImportOrder ở backend
export interface InwardVoucher {
  voucherId: string;
  voucherCode: string;        // NK1/NK2/NK3
  customerId: string;
  customerName: string;
  taxCode: string;
  address: string;
  voucherDescription: string;
  voucherDate: string;
  bankName?: string;
  bankAccountNumber?: string;
  items: InwardItem[];
}

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

// Danh sách phiếu nhập kho
export interface InwardListItem {
  voucherId: string;
  voucherCode: string | null;
  invoiceNumber: string | null;
  voucherDate: string | null;
  customerName: string | null;
  totalAmount: number;
  itemCount: number;
}

export interface InwardListResult {
  items: InwardListItem[];
  total: number;
  page: number;
  pageSize: number;
  grandTotal: number;
}