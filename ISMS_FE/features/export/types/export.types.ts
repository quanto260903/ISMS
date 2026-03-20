// ============================================================
//  features/export/types/export.types.ts
// ============================================================

export type ExportReason = "IMPORT_RETURN" | "OTHER";

export interface GoodsSearchResult {
  goodsId:    string;
  goodsName:  string;
  unit:       string;
  salePrice:  number;
  vatrate:    string;
  itemOnHand: number;
}

export interface ExportItem {
  goodsId:           string;
  goodsName:         string;
  unit:              string;
  quantity:          number;
  unitPrice:         number;
  amount1:           number;
  vat:               number;
  promotion:         number;
  debitAccount1:     string;
  creditAccount1:    string;
  debitAccount2:     string;
  creditAccount2:    string;
  costPerUnit:       number;   // cost/warehouseIn từ phiếu nhập — dùng tính Amount1 khi xuất
  userId:            string;
  createdDateTime:   string;
  offsetVoucher?:    string;
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
  bankName?:          string;
  bankAccountNumber?: string;
  items:              ExportItem[];
}

export interface ExportListItem {
  voucherId:     string;
  voucherCode:   string | null;
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

// ── FIFO Preview types ────────────────────────────────────────
// Backend trả về danh sách phân bổ FIFO cho 1 goodsId
export interface FifoPreviewItem {
  inboundVoucherCode: string;   // mã phiếu nhập đối trừ, VD: NK000001
  allocatedQty:       number;   // số lượng lấy từ phiếu nhập này
  warehouseId:        string | null;
}