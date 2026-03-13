// ============================================================
//  features/goods-category/types/goodsCategory.types.ts
// ============================================================

export interface GoodsCategoryListDto {
  goodsGroupId:   string;
  goodsGroupName: string;
  isInactive:     boolean;
  goodsCount:     number;
}

export interface GoodsCategoryDetailDto {
  goodsGroupId:   string;
  goodsGroupName: string;
  isInactive:     boolean;
  goodsCount:     number;
}

export interface CreateGoodsCategoryRequest {
  goodsGroupId:   string;
  goodsGroupName: string;
}

export interface UpdateGoodsCategoryRequest {
  goodsGroupName: string;
}

export interface GoodsCategoryListResult {
  items:    GoodsCategoryListDto[];
  total:    number;
  page:     number;
  pageSize: number;
}