// ============================================================
//  features/export/types/export.types.ts
// ============================================================

// ── Lý do xuất kho thủ công (dùng trong form tạo/sửa) ────────
// IMPORT_RETURN → XK1 = Xuất trả hàng nhập
// DESTROY       → XK2 = Xuất hủy hàng
// STOCK_TAKE    → XK3 = Xuất kho kiểm kê (tự sinh)
// SALE          → XK4 = Xuất bán hàng
export type ExportReason = "IMPORT_RETURN" | "DESTROY" | "STOCK_TAKE" | "SALE";

// ── Mã chứng từ đầy đủ (dùng để hiển thị ở danh sách) ───────
// XK1/XK2 = user tạo thủ công
// XK3     = hệ thống tự sinh khi kiểm kê
// XK4     = hệ thống tự sinh khi bán hàng
export type ExportVoucherCode = "XK1" | "XK2" | "XK3" | "XK4";

export interface GoodsSearchResult {
  goodsId:    string;
  goodsName:  string;
  unit:       string;
  salePrice:  number;
  vatrate:    string;
  itemOnHand: number;
}

export interface ExportItem {
  goodsId:         string;
  goodsName:       string;
  unit:            string;
  quantity:        number;
  unitPrice:       number;
  amount1:         number;
  debitAccount1:   string;
  creditAccount1:  string;
  debitAccount2:   string;   // Dùng cho XK4 bán hàng: Nợ 632
  creditAccount2:  string;   // Dùng cho XK4 bán hàng: Có 156
  costPerUnit:     number;   // cost/warehouseIn từ phiếu nhập — tính Amount1 khi xuất
  userId:          string;
  createdDateTime: string;
  offsetVoucher?:  string;
}

export interface ExportVoucher {
  voucherId:          string;
  voucherCode:        string;
  customerId:         string;
  customerName:       string;
  taxCode:            string;
  address:            string;
  voucherDescription: string;
  voucherDate:        string;
  // Giữ lại cho XK4 bán hàng (tạo tự động từ luồng sale)
  bankName?:          string;
  bankAccountNumber?: string;
  items:              ExportItem[];
}

// ── List item dùng ExportVoucherCode — không dùng ExportReason ─
export interface ExportListItem {
  voucherId:     string;
  voucherCode:   ExportVoucherCode | null;  // đầy đủ 4 loại XK1-XK4
  invoiceNumber: string | null;
  voucherDate:   string | null;
  customerName:  string | null;
  totalAmount:   number;
  itemCount:     number;
}

export interface ExportListResult {
  items:      ExportListItem[];
  total:      number;
  page:       number;
  pageSize:   number;
  grandTotal: number;
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
