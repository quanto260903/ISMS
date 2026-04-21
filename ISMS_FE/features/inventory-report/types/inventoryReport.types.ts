// features/inventory-report/types/inventoryReport.types.ts

export interface InventorySummaryItemDto {
  goodsId:   string;
  goodsName: string;
  unit:      string;
  opening:   number;
  inbound:   number;
  outbound:  number;
  closing:   number;
}

export interface InventorySummaryGroupDto {
  groupId:     string | null;
  groupName:   string;
  subOpening:  number;
  subInbound:  number;
  subOutbound: number;
  subClosing:  number;
  items:       InventorySummaryItemDto[];
}

export interface InventorySummaryTotalsDto {
  totalItems:    number;
  totalOpening:  number;
  totalInbound:  number;
  totalOutbound: number;
  totalClosing:  number;
}

export interface InventorySummaryDto {
  fromDate:    string;   // "YYYY-MM-DD"
  toDate:      string;
  generatedAt: string;   // ISO datetime
  totals:      InventorySummaryTotalsDto;
  groups:      InventorySummaryGroupDto[];
}

export interface GetInventorySummaryRequest {
  fromDate: string;
  toDate:   string;
  keyword?: string;
}
