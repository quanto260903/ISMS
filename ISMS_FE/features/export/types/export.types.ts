// ============================================================
//  features/export/types/export.types.ts
// ============================================================

export type ExportReason = "IMPORT_RETURN" | "OTHER";  // XH1 = Hàng nhập trả lại, XH2 = Xuất khác

export interface GoodsSearchResult {
  goodsId:    string;
  goodsName:  string;
  unit:       string;
  salePrice:  number;
  vatrate:    string;
  itemOnHand: number;
}

// Khớp 1-1 với CreateExportItemRequest ở backend
export interface ExportItem {
  goodsId:           string;
  goodsName:         string;
  unit:              string;
  quantity:          number;
  unitPrice:         number;
  amount1:           number;       // Thành tiền = quantity × unitPrice
  vat:               number;       // % thuế VAT
  promotion:         number;
  debitAccount1:     string;       // Nợ TK 632/138...
  creditAccount1:    string;       // Có TK 156
  creditWarehouseId: string;       // Kho xuất — bắt buộc
  debitAccount2:     string;
  creditAccount2:    string;
  userId:            string;
  createdDateTime:   string;
  offsetVoucher?:    string; 
}

// Khớp 1-1 với ExportOrder ở backend
export interface ExportVoucher {
  voucherId:          string;
  voucherCode:        string;      // XH1, XH2
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

// Dòng trong bảng danh sách phiếu xuất
export interface ExportListItem {
  voucherId:     string;
  voucherCode:   string | null;
  invoiceNumber: string | null;
  voucherDate:   string | null;
  customerName:  string | null;
  totalAmount:   number;
  itemCount:     number;
}

// Kết quả phân trang
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