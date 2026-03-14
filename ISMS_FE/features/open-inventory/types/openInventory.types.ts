// features/open-inventory/types/openInventory.types.ts

export interface OpenInventoryRowDto {
  goodsId:      string;
  goodsName:    string;
  unit:         string;
  quantity:     number;
  debitAmount0: number;
  totalValue:   number;
  createDate:   string;
}

export interface OpenInventorySummaryDto {
  totalQuantity: number;
  totalValue:    number;
  totalRows:     number;
}

export interface UpsertOpenInventoryRequest {
  goodsId:      string;
  unit:         string;
  quantity:     number;
  debitAmount0: number;
}

export interface OpenInventoryListResult {
  items:    OpenInventoryRowDto[];
  total:    number;
  page:     number;
  pageSize: number;
}

export interface EditingRow {
  goodsId:      string;
  quantity:     string;
  debitAmount0: string;
  unit:         string;
}