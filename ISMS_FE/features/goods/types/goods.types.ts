// ============================================================
//  features/goods/types/goods.types.ts
// ============================================================

export interface GoodsListDto {
  goodsId:            string;
  goodsName:          string;
  goodsGroupId:       string | null;
  goodsGroupName:     string | null;
  unit:               string;
  salePrice:          number | null;
  fixedPurchasePrice: number | null;
  vatrate:            string;
  isIncludeVat:       boolean;
  isPromotion:        boolean;
  isInactive:         boolean;
  itemOnHand:         number | null;
  createdDate:        string;
}

export interface GoodsDetailDto extends GoodsListDto {
  minimumStock:      number | null;
  lastPurchasePrice: number | null;
}

export interface GoodsSearchResult {
  goodsId:    string;
  goodsName:  string;
  unit:       string;
  salePrice:  number | null;
  itemOnHand: number | null;
}

export interface CreateGoodsRequest {
  goodsId:            string;
  goodsName:          string;
  goodsGroupId?:      string;
  unit:               string;
  minimumStock?:      number;
  fixedPurchasePrice?: number;
  salePrice?:         number;
  vatrate:            string;
  isIncludeVat:       boolean;
  isPromotion:        boolean;
}

export interface UpdateGoodsRequest {
  goodsName:          string;
  goodsGroupId?:      string;
  unit:               string;
  minimumStock?:      number;
  fixedPurchasePrice?: number;
  salePrice?:         number;
  vatrate:            string;
  isIncludeVat:       boolean;
  isPromotion:        boolean;
}

export interface GoodsListResult {
  items:    GoodsListDto[];
  total:    number;
  page:     number;
  pageSize: number;
}

export const VAT_OPTIONS = ["0%", "5%", "8%", "10%"];

export const UNIT_SUGGESTIONS = [
  "Cái", "Hộp", "Túi", "Kg", "Gram", "Lít", "Chai", "Lon",
  "Thùng", "Bịch", "Cuộn", "Tấm", "Bộ", "Đôi", "Cặp",
];