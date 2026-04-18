// ============================================================
//  features/inward/types/import.types.ts
// ============================================================

// Lý do nhập kho — quyết định VoucherCode
export type InwardReason = "PURCHASE" | "SALES_RETURN" | "STOCK_TAKE";
export type InwardStockBucket = "SELLABLE" | "QUARANTINE";

export interface InwardItem {
  goodsId:         string;
  goodsName:       string;
  unit:            string;
  quantity:        number;
  unitPrice:       number;
  amount1:         number;
  promotion:       number;   // % khuyến mãi (0–100)
  debitAccount1:   string;   // 156 (Hàng tồn kho)
  creditAccount1:  string;   // 111 (Tiền mặt) — mặc định
  debitAccount2:   string;   // 1331 (Thuế GTGT được khấu trừ) — để trống nếu không dùng
  creditAccount2:  string;
  stockBucket?:    InwardStockBucket;
  offsetVoucher?:  string;   // Liên kết phiếu bán gốc (chỉ có khi SALES_RETURN)
  sourceVoucherId?: string;
  sourceVoucherDetailId?: number;
  returnReason?:   string;
  rootCause?:      string;
  expiryDate?:     string | null;
  soldQty?:        number;
  returnedQty?:    number;
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
  quarantineOnHand?: number;
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
  saleVoucherDetailId: number;
  goodsId:         string;
  goodsName:       string;
  unit:            string;
  soldQty:         number;
  returnedQty:     number;
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
  stockBucket?: InwardStockBucket;
}

export interface InwardListResult {
  items:      InwardListItem[];
  total:      number;
  page:       number;
  pageSize:   number;
  grandTotal: number;
}
