// ============================================================
//  features/inward/types/import.types.ts
// ============================================================

// Lý do nhập kho — quyết định VoucherCode
export type InwardReason = "PURCHASE" | "SALES_RETURN" | "STOCK_TAKE";

export interface InwardItem {
  goodsId:         string;
  goodsName:       string;
  unit:            string;
  quantity:        number;
  unitPrice:       number;
  amount1:         number;
  promotion:       number;   
  debitAccount1:   string;   
  creditAccount1:  string;   
  debitAccount2:   string;   
  creditAccount2:  string;
  offsetVoucher?:  string;   
  userId:          string;
  createdDateTime: string;
}

export interface InwardVoucher {
  voucherId:          string;
  voucherCode:        string;
  customerId:         string;
  customerName:       string;
  taxCode:            string;
  address:            string;
  voucherDescription: string;
  voucherDate:        string;
  // bankName và bankAccountNumber đã xóa — mặc định tiền mặt
  items:              InwardItem[];
}

// ── Dropdown search ──────────────────────────────────────────
export interface GoodsSearchResult {
  goodsId:    string;
  goodsName:  string;
  unit:       string;
  itemOnHand: number;
}

export interface DropdownState {
  suggestions: GoodsSearchResult[];
  loading:     boolean;
  open:        boolean;
}

export interface DropdownPos {
  top:   number;
  left:  number;
  width: number;
  index: number;
}

// ── Tìm kiếm phiếu nhập kho ──────────────────────────────────
export interface InwardSearchResult {
  voucherId:    string;
  voucherDate:  string | null;
  customerName: string | null;
  totalAmount:  number;
  itemCount:    number;
}

// ── Tìm kiếm phiếu bán hàng ──────────────────────────────────
export interface SaleSearchResult {
  voucherId:    string;
  voucherDate:  string | null;
  customerName: string | null;
  totalAmount:  number;
  itemCount:    number;
}

// ── Lookup phiếu bán ─────────────────────────────────────────
export interface SaleVoucherLookupItem {
  goodsId:         string;
  goodsName:       string;
  unit:            string;
  quantity:        number;
  unitPrice:       number;
  amount1:         number;
  promotion:       number;
}

export interface SaleVoucherLookup {
  voucherId:    string;
  customerId?:  string;
  customerName: string;
  items:        SaleVoucherLookupItem[];
}

// ── List ─────────────────────────────────────────────────────
export interface InwardListItem {
  voucherId:    string;
  voucherCode:  string | null;
  invoiceNumber: string | null;
  voucherDate:  string | null;
  customerName: string | null;
  totalAmount:  number;
  itemCount:    number;
}

export interface InwardListResult {
  items:      InwardListItem[];
  total:      number;
  page:       number;
  pageSize:   number;
  grandTotal: number;
}