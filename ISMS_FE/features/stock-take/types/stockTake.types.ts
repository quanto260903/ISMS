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

export interface GoodsDto {
  goodsId:       string;
  goodsName:     string;
  unit:          string | null;
  stockQuantity: number;
}

export interface CreateStockTakeRequest {
  // Lỗi 1: xóa voucherCode — backend tự sinh, không để frontend gửi lên
  // tránh race condition khi 2 user tạo cùng lúc
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
  // Lỗi 2: xóa bookQuantity — backend tự lấy từ Goods.ItemOnHand
  // tránh client gửi sai làm DifferenceQuantity tính lệch
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
// Thêm vào cuối file
export interface SurplusItemDto {
  goodsId:   string;
  goodsName: string;
  unit:      string | null;
  quantity:  number;   // = Math.round(differenceQuantity)
}

export interface ShortageItemDto {
  goodsId:   string;
  goodsName: string;
  unit:      string | null;
  quantity:  number;   // = Math.round(Math.abs(differenceQuantity))
}