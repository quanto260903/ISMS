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

// totalGoods / totalSurplus / totalShortage đã xóa:
// Backend list endpoint không trả aggregation — các field này luôn là 0 (fake).
// Xem chi tiết phiếu (StockTakeFullDto.lines) để tính nếu cần.
export interface StockTakeListDto {
  stockTakeVoucherId: string;
  voucherCode:        string;
  voucherDate:        string;
  stockTakeDate:      string;
  purpose:            string | null;
  isCompleted:        boolean;
  createdBy:          string | null;
  createdDate:        string | null;
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

// Hàng hóa từ danh mục — dùng để auto-load khi tạo phiếu
export interface GoodsDto {
  goodsId:       string;
  goodsName:     string;
  unit:          string | null;
  stockQuantity: number;
}

export interface CreateStockTakeRequest {
  // voucherCode do FE tự sinh và gửi lên (backend chưa có auto-generate)
  // TODO: Khi backend tự sinh mã, có thể xóa field này
  voucherCode?:     string;
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
  importVoucherCode: string | null;
  exportVoucherId:   string | null;
  exportVoucherCode: string | null;
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