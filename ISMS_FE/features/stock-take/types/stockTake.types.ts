// features/stock-take/types/stockTake.types.ts

export interface StockTakeDetailDto {
  stockTakeDetailId:  number;
  goodsId:            string;
  goodsName:          string;
  unit:               string | null;
  bookQuantity:       number;
  actualQuantity:     number;
  differenceQuantity: number;
}

export interface StockTakeListDto {
  stockTakeVoucherId: string;
  voucherCode:        string;
  voucherDate:        string;
  stockTakeDate:      string;
  purpose:            string | null;
  isCompleted:        boolean | null;
  createdBy:          string | null;
  createdDate:        string | null;
  totalGoods:         number;
  totalSurplus:       number;
  totalShortage:      number;
}

export interface StockTakeFullDto {
  stockTakeVoucherId: string;
  voucherCode:        string;
  voucherDate:        string;
  stockTakeDate:      string;
  purpose:            string | null;
  member1:            string | null;
  position1:          string | null;
  member2:            string | null;
  position2:          string | null;
  member3:            string | null;
  position3:          string | null;
  isCompleted:        boolean | null;
  createdBy:          string | null;
  createdDate:        string | null;
  lines:              StockTakeDetailDto[];
}

export interface StockTakeListResult {
  items:    StockTakeListDto[];
  total:    number;
  page:     number;
  pageSize: number;
}

// Hàng hóa từ danh mục — dùng để auto-load khi tạo phiếu
export interface GoodsDto {
  goodsId:       string;
  goodsName:     string;
  unit:          string | null;
  stockQuantity: number;
}

export interface CreateStockTakeRequest {
  voucherDate:      string;
  stockTakeDate:    string;
  purpose?:         string;
  member1?:         string; position1?: string;
  member2?:         string; position2?: string;
  member3?:         string; position3?: string;
  createdBy?:       string;
  stockTakeDetails: CreateStockTakeDetailRequest[];
}

export interface CreateStockTakeDetailRequest {
  goodsId:        string;
  goodsName:      string;
  unit?:          string | null;
  bookQuantity:   number;
  actualQuantity: number;
}

export interface UpdateStockTakeHeaderRequest {
  voucherDate:      string;
  stockTakeDate:    string;
  purpose?:         string;
  member1?:         string; position1?: string;
  member2?:         string; position2?: string;
  member3?:         string; position3?: string;
  stockTakeDetails: CreateStockTakeDetailRequest[];
}

export interface ProcessStockTakeResultDto {
  success:           boolean;
  message:           string;
  importVoucherId:   string | null;
  importVoucherCode: string | null;  // VD: NK000001
  exportVoucherId:   string | null;
  exportVoucherCode: string | null;  // VD: XK000001
}

// ── Raw backend shapes ─────────────────────────────────────────
export interface BackendVoucherDetailRaw {
  stockTakeVoucherId: string;
  voucherCode:        string;
  voucherDate:        string;
  stockTakeDate:      string;
  purpose:            string | null;
  member1:            string | null; position1: string | null;
  member2:            string | null; position2: string | null;
  member3:            string | null; position3: string | null;
  isCompleted:        boolean | null;
  createdBy:          string | null;
  createdDate:        string | null;
  stockTakeDetails:   BackendDetailRaw[];
}

export interface BackendDetailRaw {
  stockTakeDetailId:  number;
  goodsId:            string;
  goodsName:          string;
  unit:               string | null;
  bookQuantity:       number;
  actualQuantity:     number;
  differenceQuantity: number;
}

export interface BackendListRaw {
  stockTakeVoucherId: string;
  voucherCode:        string;
  voucherDate:        string;
  stockTakeDate:      string;
  purpose:            string | null;
  isCompleted:        boolean | null;
  createdBy:          string | null;
  createdDate:        string | null;
}