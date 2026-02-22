// ============================================================
//  features/sale/types/sale.types.ts
//  Tất cả types & interfaces cho nghiệp vụ bán hàng
// ============================================================

export type PaymentOption = "CASH" | "BANK" | "UNPAID";

export interface GoodsSearchResult {
  goodsId: string;
  goodsName: string;
  unit: string;
  salePrice: number;
  vatrate: string;
  itemOnHand: number;
}

export interface VoucherItem {
  goodsId: string;
  goodsName: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  amount2: number;
  vat: number;
  promotion: number;
  amount1: number;
  debitAccount1: string;
  creditAccount1: string;
  debitAccount2: string;
  creditAccount2: string;
  creditWarehouseId: string;  // Kho xuất hàng — bắt buộc
  offsetVoucher: string;
  userId: string;             // Người tạo dòng
  createdDateTime: string;    // Thời điểm tạo dòng
}

export interface Voucher {
  voucherId: string;          // Số chứng từ (trước là voucherNumber)
  voucherCode: string;        // Mã loại chứng từ, vd: "BH"
  customerId: string;
  customerName: string;
  taxCode: string;            // Mã số thuế khách hàng
  address: string;
  bankName?: string;
  bankAccountNumber?: string;
  voucherDescription: string; // Diễn giải (trước là description)
  voucherDate: string;
  items: VoucherItem[];
}

export interface WarehouseTransactionDto {
  offsetVoucher: string;
  goodsId: string;
  warehouseId: string | null;   // ID kho — dùng để điền ngược vào creditWarehouseId
  warehouseName: string | null; // Tên kho — hiển thị UI
  voucherDate: string | null;
  warehouseIn: number;
  warehouseOut: number;
  customInHand: number;
  cost: number;
}

export interface WarehouseReportState {
  itemIndex: number;            // Index dòng trong bảng sản phẩm đã trigger modal
  goodsId: string;
  goodsName: string;
  data: WarehouseTransactionDto[];
  loading: boolean;
  error: string;
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